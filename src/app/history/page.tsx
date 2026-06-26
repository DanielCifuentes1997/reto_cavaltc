"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/lib/store/useStore";

interface EvaluationSummary {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  companyName: string;
  sector: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444";
  const label = score >= 80 ? "Alto" : score >= 50 ? "Parcial" : "Bajo";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: `${color}18`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {score}% · {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in_progress: { label: "En curso",   cls: "bg-blue-50 text-blue-600"   },
    completed:   { label: "Completado", cls: "bg-green-50 text-green-600" },
    cancelled:   { label: "Cancelado",  cls: "bg-slate-100 text-slate-500" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-500" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function HistoryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { reset, evaluationId } = useStore();

  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") { router.push("/login"); return; }
    if (sessionStatus !== "authenticated") return;

    fetch("/api/evaluations")
      .then((r) => r.json())
      .then(({ evaluations: data }) => setEvaluations(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionStatus, router]);

  const handleNewEvaluation = async () => {
    setStarting(true);
    // Mark current in_progress evaluation as completed (if any)
    if (evaluationId) {
      await fetch("/api/evaluation/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId }),
      }).catch(console.error);
    }
    reset();
    router.push("/");
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-cavaltec-light flex items-center justify-center">
        <div className="w-9 h-9 border-[3px] border-cavaltec-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cavaltec-light">
      {/* Header */}
      <header className="bg-cavaltec-dark sticky top-0 z-40 shadow-xl">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <Image src="/logo_blanco.png" alt="CAVALTEC" width={100} height={26} className="object-contain" />
          <span className="text-slate-400 text-xs hidden sm:inline">
            · Historial de evaluaciones
          </span>
          <button
            onClick={handleNewEvaluation}
            disabled={starting}
            className="ml-auto flex items-center gap-2 bg-cavaltec-gold text-cavaltec-dark text-xs font-bold px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-60"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {starting ? "Iniciando..." : "Nueva evaluación"}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-cavaltec-dark">Historial de evaluaciones</h1>
          <p className="text-slate-400 text-sm mt-1">
            {evaluations.length} evaluación{evaluations.length !== 1 ? "es" : ""} registrada{evaluations.length !== 1 ? "s" : ""} para tu cuenta
          </p>
        </div>

        {evaluations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-cavaltec-light flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
              </svg>
            </div>
            <p className="text-slate-500 font-semibold mb-1">Sin evaluaciones aún</p>
            <p className="text-slate-400 text-sm mb-6">Inicia tu primer diagnóstico Ley 1581.</p>
            <button
              onClick={handleNewEvaluation}
              className="bg-cavaltec-gold text-cavaltec-dark font-bold text-sm px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors"
            >
              Iniciar diagnóstico →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                {/* Left: date + company */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge status={ev.status} />
                    <span className="text-xs text-slate-400">{formatDate(ev.createdAt)}</span>
                  </div>
                  <p className="font-bold text-cavaltec-dark text-sm truncate">{ev.companyName}</p>
                  <p className="text-xs text-slate-400">{ev.sector}</p>
                </div>

                {/* Right: score + actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <ScoreBadge score={ev.score} />

                  {ev.status === "in_progress" ? (
                    <Link
                      href="/"
                      onClick={() => useStore.getState().setEvaluationSession(ev.id, "", "")}
                      className="text-xs font-bold text-cavaltec-blue hover:text-cavaltec-gold transition-colors"
                    >
                      Continuar →
                    </Link>
                  ) : (
                    <Link
                      href={`/results?evaluationId=${ev.id}`}
                      className="text-xs font-bold text-cavaltec-blue hover:text-cavaltec-gold transition-colors"
                    >
                      Ver informe →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

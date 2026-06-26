"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/lib/store/useStore";
import ComplianceGauge from "@/components/ComplianceGauge";

// ── Question definitions (aligned with scoringEngine.ts) ──────────────────
interface QuestionDef {
  id: number;
  block: number;
  label: string;
  weight: number;
  gateway?: boolean;
  qualitative?: boolean;
}

const QUESTIONS: QuestionDef[] = [
  { id: 1,  block: 1, label: "Política de Tratamiento de Datos Personales", weight: 0,  gateway: true  },
  { id: 2,  block: 1, label: "Aviso de Privacidad",                          weight: 10                },
  { id: 3,  block: 1, label: "Consentimiento previo e informado",            weight: 10                },
  { id: 4,  block: 1, label: "Mecanismos ARCO (derechos del titular)",       weight: 10                },
  { id: 5,  block: 1, label: "Registro de Actividades de Tratamiento",       weight: 10                },
  { id: 6,  block: 2, label: "Seguridad técnica",                            weight: 12                },
  { id: 7,  block: 2, label: "Seguridad administrativa",                     weight: 12                },
  { id: 8,  block: 2, label: "Seguridad física",                             weight: 12                },
  { id: 9,  block: 3, label: "Protocolo de notificación a la SIC",           weight: 16                },
  { id: 10, block: 3, label: "Retención y eliminación de datos",             weight: 8                 },
  { id: 11, block: 0, label: "Responsable / DPO designado",                  weight: 0,  qualitative: true },
];

const BLOCKS = [
  { id: 1, name: "Política y Consentimiento", max: 40, color: "#3b82f6" },
  { id: 2, name: "Seguridad",                 max: 36, color: "#8b5cf6" },
  { id: 3, name: "Gobernanza y Notificación", max: 24, color: "#f0b429" },
];

// ── Types ─────────────────────────────────────────────────────────────────
interface Answer {
  question_id: number;
  is_compliant: boolean;
  ai_justification: string;
  awarded_weight: number;
}

interface ResultsData {
  evaluation: { id: string; score: number; status: string; createdAt: string };
  company: { name: string; nit: string; industry_sector: string } | null;
  answers: Answer[];
}

// ── Helper ─────────────────────────────────────────────────────────────────
function blockScore(answers: Answer[], blockId: number): number {
  return answers
    .filter((a) => QUESTIONS.find((q) => q.id === a.question_id)?.block === blockId)
    .reduce((s, a) => s + (a.awarded_weight ?? 0), 0);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { evaluationId: storeEvalId, companyName: storeCompanyName, reset } = useStore();

  // Support both store evaluationId and ?evaluationId= query param (from history)
  const evaluationId = searchParams.get("evaluationId") ?? storeEvalId;

  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const handleNewEvaluation = async () => {
    setStarting(true);
    if (storeEvalId) {
      await fetch("/api/evaluation/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId: storeEvalId }),
      }).catch(console.error);
    }
    reset();
    router.push("/");
  };

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (sessionStatus !== "authenticated") return;
    if (!evaluationId) {
      router.push("/");
      return;
    }

    fetch(`/api/results?evaluationId=${evaluationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Error de conexión."))
      .finally(() => setLoading(false));
  }, [sessionStatus, evaluationId, router]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-cavaltec-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-cavaltec-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-cavaltec-blue text-sm font-semibold">Cargando informe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cavaltec-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <Link href="/" className="text-cavaltec-blue hover:underline text-sm">← Volver al dashboard</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { evaluation, company, answers } = data;
  const score = evaluation.score;
  const companyDisplayName = company?.name ?? storeCompanyName ?? "—";
  const answeredCount = answers.length;
  const compliantCount = answers.filter((a) => a.is_compliant).length;
  const gaps = answers.filter((a) => !a.is_compliant);

  const scoreColor = score >= 80 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444";
  const scoreLabel = score >= 80 ? "Alto cumplimiento" : score >= 50 ? "Cumplimiento parcial" : "Bajo cumplimiento";

  return (
    <div className="min-h-screen bg-cavaltec-light">
      {/* Header */}
      <header className="bg-cavaltec-dark sticky top-0 z-40 shadow-xl">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <Image src="/logo_blanco.png" alt="CAVALTEC" width={100} height={26} className="object-contain" />
          <span className="text-slate-400 text-xs hidden sm:inline">
            · Informe de cumplimiento Ley 1581 de 2012
          </span>
          <div className="ml-auto text-slate-400 text-xs hidden md:block">
            {company && `${company.nit} · ${company.industry_sector}`}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex flex-col gap-8 max-w-4xl">

        {/* Score hero */}
        <section className="bg-cavaltec-dark rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl">
          <ComplianceGauge score={score} />

          <div className="flex-grow text-center md:text-left">
            <p className="text-slate-400 text-sm mb-1">
              {companyDisplayName} · {formatDate(evaluation.createdAt)}
            </p>
            <h1 className="text-3xl font-extrabold text-white mb-2">
              {score}% de cumplimiento
            </h1>
            <span
              className="inline-flex px-3 py-1 rounded-full text-sm font-bold"
              style={{ background: `${scoreColor}22`, color: scoreColor }}
            >
              {scoreLabel}
            </span>
            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-white">{compliantCount}</p>
                <p className="text-xs text-slate-400">Criterios cumplidos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold" style={{ color: scoreColor }}>
                  {gaps.length}
                </p>
                <p className="text-xs text-slate-400">Brechas detectadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-slate-300">{answeredCount}</p>
                <p className="text-xs text-slate-400">Criterios evaluados</p>
              </div>
            </div>
          </div>
        </section>

        {/* Block breakdown */}
        <section>
          <h2 className="text-lg font-bold text-cavaltec-dark mb-3">Desglose por bloque</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BLOCKS.map((block) => {
              const earned = blockScore(answers, block.id);
              const pct = Math.round((earned / block.max) * 100);
              return (
                <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Bloque {block.id}
                  </p>
                  <p className="font-bold text-cavaltec-dark text-sm mb-3">{block.name}</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-extrabold" style={{ color: block.color }}>
                      {earned}
                    </span>
                    <span className="text-slate-300 text-lg font-normal mb-0.5">/ {block.max}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: block.color }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">{pct}%</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Question-by-question results */}
        <section>
          <h2 className="text-lg font-bold text-cavaltec-dark mb-3">Resultados por criterio</h2>
          <div className="flex flex-col gap-3">
            {QUESTIONS.map((q) => {
              const answer = answers.find((a) => a.question_id === q.id);
              const compliant = answer?.is_compliant ?? null;
              const blockDef = BLOCKS.find((b) => b.id === q.block);

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                    compliant === false
                      ? "border-red-200"
                      : compliant === true
                      ? "border-green-200"
                      : "border-slate-200"
                  }`}
                >
                  {/* Question header */}
                  <div className="px-5 py-4 flex items-start gap-4">
                    {/* Status icon */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background:
                          compliant === true
                            ? "#dcfce7"
                            : compliant === false
                            ? "#fee2e2"
                            : "#f1f5f9",
                      }}
                    >
                      {compliant === true && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {compliant === false && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                      {compliant === null && (
                        <span className="text-slate-400 text-xs font-bold">—</span>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-400">P{q.id}</span>
                        {blockDef && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${blockDef.color}15`, color: blockDef.color }}
                          >
                            Bloque {q.block}
                          </span>
                        )}
                        {q.qualitative && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            Cualitativo
                          </span>
                        )}
                        {q.weight > 0 && (
                          <span className="text-xs text-slate-400 ml-auto">{q.weight}%</span>
                        )}
                      </div>
                      <p className="font-semibold text-cavaltec-dark text-sm">{q.label}</p>
                    </div>
                  </div>

                  {/* Answer details — only if answered */}
                  {answer && (
                    <div className="px-5 pb-4 pt-0 flex flex-col gap-2 border-t border-slate-50">
                      {/* Justification */}
                      {answer.ai_justification && (
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-slate-400 w-20 flex-shrink-0 pt-0.5">
                            Hallazgo
                          </span>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {answer.ai_justification}
                          </p>
                        </div>
                      )}

                      {/* Action plan — only for gaps */}
                      {!answer.is_compliant && (
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-red-500 w-20 flex-shrink-0 pt-0.5">
                            Acción
                          </span>
                          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 leading-relaxed flex-grow">
                            {/* mitigation_steps comes from kanban_tasks; we use ai_justification fallback */}
                            Ver plan de mitigación en el Kanban del dashboard.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Not evaluated yet */}
                  {!answer && (
                    <div className="px-5 pb-3">
                      <p className="text-xs text-slate-400 italic">No evaluado en esta sesión.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Actions footer */}
        <section className="flex flex-col sm:flex-row gap-3 pb-8">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-cavaltec-blue text-cavaltec-blue font-bold text-sm hover:bg-cavaltec-blue hover:text-white transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al dashboard
          </Link>

          <button
            onClick={handleNewEvaluation}
            disabled={starting}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-cavaltec-gold text-cavaltec-dark font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {starting ? "Iniciando..." : "Nueva evaluación"}
          </button>

          <a
            href={`/api/results/pdf?evaluationId=${evaluationId}`}
            download
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-cavaltec-gold text-cavaltec-dark font-bold text-sm hover:bg-cavaltec-gold transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="12" x2="12" y2="18" />
              <polyline points="9 15 12 18 15 15" />
            </svg>
            Exportar PDF
          </a>
        </section>
      </main>
    </div>
  );
}

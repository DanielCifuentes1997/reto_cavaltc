"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Evaluation {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  evaluatorId: string;
  companyName: string;
  companyNit: string | null;
  sector: string;
  companySize: string | null;
}

function scoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f0b429";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Alto";
  if (score >= 50) return "Parcial";
  return "Bajo";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    in_progress: { label: "En curso",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    completed:   { label: "Completado",  color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
  };
  const s = map[status] ?? { label: status, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") { router.push("/login"); return; }
    if (sessionStatus !== "authenticated") return;
    if (session?.user?.role !== "administrador") { router.push("/dashboard"); return; }

    fetch("/api/evaluations")
      .then((r) => r.json())
      .then(({ evaluations: data }) => setEvaluations(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionStatus, session, router]);

  const handleDelete = useCallback(async (id: string, companyName: string) => {
    if (!confirm(`¿Eliminar el registro de "${companyName}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvaluations((prev) => prev.filter((e) => e.id !== id));
      } else {
        const d = await res.json();
        alert(d.error ?? "Error al eliminar.");
      }
    } catch {
      alert("Error de conexión.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalEvals       = evaluations.length;
  const completedEvals   = evaluations.filter((e) => e.status === "completed");
  const inProgressEvals  = evaluations.filter((e) => e.status === "in_progress");
  const uniqueCompanies  = new Set(evaluations.map((e) => e.companyName)).size;
  const avgScore = completedEvals.length === 0
    ? 0
    : Math.round(completedEvals.reduce((s, e) => s + e.score, 0) / completedEvals.length);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #060f1e 0%, #0d1f33 100%)" }}>
        <div className="w-10 h-10 border-[3px] border-cavaltec-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #060f1e 0%, #0d1f33 100%)" }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(6,15,30,0.92)", backdropFilter: "blur(14px)" }}>
        <div className="container mx-auto px-6 h-16 flex items-center gap-3">
          <img src="/logo_blanco.png" alt="CAVALTEC" className="h-9 w-auto object-contain" />
          <div className="w-px h-5 bg-white/10" />
          <span className="text-white font-bold text-sm">Panel de Administración</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full hidden sm:inline"
            style={{ background: "rgba(240,180,41,0.12)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.25)" }}>
            CAVALTEC · Admin
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-slate-500 text-xs hidden md:block">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Empresas registradas",
              value: uniqueCompanies,
              sub: "en la plataforma",
              color: "#3b82f6",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ),
            },
            {
              label: "Promedio cumplimiento",
              value: `${avgScore}%`,
              sub: "solo evaluaciones completadas",
              color: avgScore >= 80 ? "#22c55e" : avgScore >= 50 ? "#f0b429" : "#ef4444",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ),
            },
            {
              label: "En curso",
              value: inProgressEvals.length,
              sub: "evaluaciones activas",
              color: "#3b82f6",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.53-8.02" />
                </svg>
              ),
            },
            {
              label: "Completadas",
              value: completedEvals.length,
              sub: `de ${totalEvals} total`,
              color: "#22c55e",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              ),
            },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-slate-400 font-semibold leading-snug max-w-[8rem]">{kpi.label}</p>
                <span style={{ color: kpi.color, opacity: 0.7 }}>{kpi.icon}</span>
              </div>
              <p className="text-3xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-slate-600 mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── TABLE HEADER ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">
            Tabla multiempresa
          </h2>
          <span className="text-slate-500 text-xs">{totalEvals} evaluación{totalEvals !== 1 ? "es" : ""}</span>
        </div>

        {/* ── TABLE ── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>

          {/* Head */}
          <div className="hidden lg:grid px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"
            style={{
              gridTemplateColumns: "2.5fr 1.5fr 1.5fr 1fr 1fr 1fr",
              background: "rgba(255,255,255,0.04)",
            }}>
            <span>Empresa</span>
            <span>Sector / Tamaño</span>
            <span>Evaluador</span>
            <span>Estado</span>
            <span>Puntaje</span>
            <span>Acciones</span>
          </div>

          {evaluations.length === 0 ? (
            <div className="px-5 py-16 text-center text-slate-500 text-sm"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              Sin evaluaciones registradas.
            </div>
          ) : (
            evaluations.map((ev, i) => {
              const color = scoreColor(ev.score);
              return (
                <div
                  key={ev.id}
                  className="flex flex-col lg:grid items-start lg:items-center gap-3 lg:gap-0 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                  style={{
                    gridTemplateColumns: "2.5fr 1.5fr 1.5fr 1fr 1fr 1fr",
                    borderTop: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(255,255,255,0.05)",
                    background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  }}
                >
                  {/* Empresa */}
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{ev.companyName}</p>
                    {ev.companyNit && (
                      <p className="text-slate-500 text-xs mt-0.5">NIT {ev.companyNit}</p>
                    )}
                  </div>

                  {/* Sector / Tamaño */}
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs truncate">{ev.sector}</p>
                    {ev.companySize && (
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{ev.companySize}</p>
                    )}
                  </div>

                  {/* Evaluador */}
                  <p className="text-slate-400 text-xs truncate">{ev.evaluatorId}</p>

                  {/* Estado */}
                  <StatusBadge status={ev.status} />

                  {/* Puntaje */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xl font-extrabold" style={{ color }}>{ev.score}%</span>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ color, background: `${color}18` }}>
                      {scoreLabel(ev.score)}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`/api/results/pdf?evaluationId=${ev.id}`}
                      download
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "rgba(240,180,41,0.12)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.2)" }}
                      title="Descargar informe PDF"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <line x1="12" y1="12" x2="12" y2="18" /><polyline points="9 15 12 18 15 15" />
                      </svg>
                      PDF
                    </a>

                    <Link
                      href={`/results?evaluationId=${ev.id}`}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}
                    >
                      Ver →
                    </Link>

                    <button
                      onClick={() => handleDelete(ev.id, ev.companyName)}
                      disabled={deletingId === ev.id}
                      title="Eliminar registro de prueba"
                      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      {deletingId === ev.id ? (
                        <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-slate-600 text-xs mt-4 text-center">
          El botón <span style={{ color: "#ef4444" }}>✕</span> elimina el registro completo incluyendo respuestas y Kanban — úsalo solo para datos de prueba.
        </p>
      </main>
    </div>
  );
}

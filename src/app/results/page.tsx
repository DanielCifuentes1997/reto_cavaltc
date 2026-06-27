"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store/useStore";
import ComplianceGauge from "@/components/ComplianceGauge";

interface QuestionDef {
  id: number;
  block: number;
  label: string;
  weight: number;
  qualitative?: boolean;
}

const QUESTIONS: QuestionDef[] = [
  { id: 1,  block: 1, label: "Política de tratamiento de datos (gateway)",         weight: 0,  qualitative: true },
  { id: 2,  block: 1, label: "Política documentada y publicada",                   weight: 10 },
  { id: 3,  block: 1, label: "Define finalidades del tratamiento",                 weight: 10 },
  { id: 4,  block: 1, label: "Incluye derechos de los titulares",                  weight: 10 },
  { id: 5,  block: 1, label: "Menciona cómo ejercer los derechos",                 weight: 10 },
  { id: 6,  block: 2, label: "Evaluaciones de impacto (PIA)",                      weight: 12 },
  { id: 7,  block: 2, label: "Técnicas de minimización de datos",                  weight: 12 },
  { id: 8,  block: 2, label: "Privacidad por defecto (mínimo de datos)",           weight: 12 },
  { id: 9,  block: 3, label: "Sistema de administración de riesgos de privacidad", weight: 16 },
  { id: 10, block: 3, label: "Oficial de Protección de Datos (DPO)",               weight: 8  },
  { id: 11, block: 0, label: "DPO designado formalmente con funciones definidas",   weight: 0,  qualitative: true },
];

const BLOCKS = [
  { id: 1, name: "Política de Datos Personales", max: 40, color: "#3b82f6" },
  { id: 2, name: "Privacidad desde el Diseño",   max: 36, color: "#8b5cf6" },
  { id: 3, name: "Gobernanza",                   max: 24, color: "#f0b429" },
];

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

export default function ResultsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { evaluationId: storeEvalId, companyName: storeCompanyName, reset } = useStore();

  const evaluationId = searchParams.get("evaluationId") ?? storeEvalId;

  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const role = session?.user?.role;
  const isAdmin   = role === "administrador";
  const isAuditor = role === "auditor";
  const isPrivileged = isAdmin || isAuditor;

  const backHref  = isAdmin ? "/admin" : isAuditor ? "/history" : "/dashboard";
  const backLabel = isAdmin ? "Panel admin" : isAuditor ? "Historial" : "Dashboard";

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
    router.push("/dashboard");
  };

  useEffect(() => {
    if (sessionStatus === "unauthenticated") { router.push("/login"); return; }
    if (sessionStatus !== "authenticated") return;
    if (!evaluationId) { router.push("/dashboard"); return; }

    fetch(`/api/results?evaluationId=${evaluationId}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Error de conexión."))
      .finally(() => setLoading(false));
  }, [sessionStatus, evaluationId, router]);

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#3b82f6] text-sm font-semibold">Cargando informe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-10 text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-slate-700 font-semibold mb-1">No se pudo cargar el informe</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link href={backHref}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#3b82f6] hover:underline">
            ← {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { evaluation, company, answers } = data;
  const score = evaluation.score;
  const companyDisplayName = company?.name ?? storeCompanyName ?? "—";
  const compliantCount = answers.filter((a) => a.is_compliant).length;
  const gaps = answers.filter((a) => !a.is_compliant);

  const scoreColor = score >= 80 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444";
  const scoreLabel = score >= 80 ? "Alto cumplimiento" : score >= 50 ? "Cumplimiento parcial" : "Bajo cumplimiento";

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* ── HEADER ── */}
      <header className="bg-[#0d1f33] sticky top-0 z-40 shadow-xl">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href={backHref}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {backLabel}
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <img src="/logo_blanco.png" alt="CAVALTEC" className="h-7 w-auto object-contain" />
          <span className="text-slate-500 text-xs hidden sm:inline">· Informe Ley 1581</span>

          {isAuditor && (
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(240,180,41,0.12)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.2)" }}>
              Solo lectura
            </span>
          )}
          {isAdmin && (
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
              Vista admin
            </span>
          )}

          {/* PDF button in header for quick access */}
          <a href={`/api/results/pdf?evaluationId=${evaluationId}`} download
            className={`${isPrivileged ? "" : "ml-auto"} flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80`}
            style={{ background: "rgba(240,180,41,0.12)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.2)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 18 15 15"/>
            </svg>
            PDF
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 max-w-4xl">

        {/* ── SCORE HERO ── */}
        <section className="rounded-2xl overflow-hidden shadow-lg"
          style={{ background: "linear-gradient(135deg, #0d1f33 0%, #1a3a5c 100%)" }}>
          <div className="px-6 py-5 flex flex-col sm:flex-row items-center gap-6">
            <ComplianceGauge score={score} />

            <div className="flex-grow text-center sm:text-left">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">
                {formatDate(evaluation.createdAt)}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                {companyDisplayName}
              </h1>
              {company && (
                <p className="text-slate-400 text-xs mb-3">
                  {company.nit && `NIT ${company.nit} · `}{company.industry_sector}
                </p>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-4"
                style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: scoreColor }} />
                {scoreLabel}
              </div>

              <div className="flex gap-5 justify-center sm:justify-start flex-wrap">
                {[
                  { value: `${score}%`, label: "Puntaje total", color: scoreColor },
                  { value: compliantCount, label: "Cumplidos", color: "#22c55e" },
                  { value: gaps.length, label: "Brechas", color: "#ef4444" },
                  { value: answers.length, label: "Evaluados", color: "#94a3b8" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl sm:text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="h-1.5 bg-white/10">
            <div className="h-full transition-all duration-1000"
              style={{ width: `${score}%`, background: `linear-gradient(90deg, ${scoreColor}99, ${scoreColor})` }} />
          </div>
        </section>

        {/* ── BLOCK BREAKDOWN ── */}
        <section>
          <h2 className="text-base font-bold text-[#0d1f33] mb-3">Desglose por bloque</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BLOCKS.map((block) => {
              const earned = blockScore(answers, block.id);
              const pct = Math.round((earned / block.max) * 100);
              return (
                <div key={block.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bloque {block.id}</p>
                      <p className="font-bold text-[#0d1f33] text-sm mt-0.5 leading-snug">{block.name}</p>
                    </div>
                    <span className="text-2xl font-extrabold" style={{ color: block.color }}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: block.color }} />
                  </div>
                  <p className="text-xs text-slate-400 text-right">{earned} / {block.max} pts</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── QUESTION RESULTS ── */}
        <section>
          <h2 className="text-base font-bold text-[#0d1f33] mb-3">Resultados por criterio</h2>
          <div className="flex flex-col gap-2.5">
            {QUESTIONS.map((q) => {
              const answer = answers.find((a) => a.question_id === q.id);
              const compliant = answer?.is_compliant ?? null;
              const blockDef = BLOCKS.find((b) => b.id === q.block);
              const borderColor = compliant === true ? "#bbf7d0" : compliant === false ? "#fecaca" : "#e2e8f0";

              return (
                <div key={q.id}
                  className="bg-white rounded-xl border overflow-hidden shadow-sm"
                  style={{ borderColor }}>
                  <div className="px-4 py-3 flex items-start gap-3">
                    {/* Status */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: compliant === true ? "#dcfce7" : compliant === false ? "#fee2e2" : "#f1f5f9" }}>
                      {compliant === true && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {compliant === false && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                      {compliant === null && <span className="text-slate-300 text-xs font-bold">—</span>}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">P{q.id}</span>
                        {blockDef && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${blockDef.color}15`, color: blockDef.color }}>
                            {blockDef.name}
                          </span>
                        )}
                        {q.qualitative && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            Cualitativo
                          </span>
                        )}
                        {q.weight > 0 && (
                          <span className="text-xs text-slate-400 ml-auto font-semibold">{q.weight}%</span>
                        )}
                      </div>
                      <p className="font-semibold text-[#0d1f33] text-sm">{q.label}</p>

                      {answer?.ai_justification && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed border-t border-slate-50 pt-2">
                          {answer.ai_justification}
                        </p>
                      )}

                      {answer && !answer.is_compliant && (
                        <div className="mt-2 flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          <p className="text-xs text-red-600 leading-relaxed">
                            Brecha detectada — ver plan de mitigación en Kanban
                          </p>
                        </div>
                      )}

                      {!answer && (
                        <p className="text-xs text-slate-400 mt-1 italic">No evaluado</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FOOTER ACTIONS ── */}
        <section className="flex flex-col sm:flex-row gap-3 pb-8">
          <Link href={backHref}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-[#3b82f6] text-[#3b82f6] font-bold text-sm hover:bg-[#3b82f6] hover:text-white transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {backLabel}
          </Link>

          {!isPrivileged && (
            <button onClick={handleNewEvaluation} disabled={starting}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#f0b429] text-[#0d1f33] font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {starting ? "Iniciando..." : "Nueva evaluación"}
            </button>
          )}

          <a href={`/api/results/pdf?evaluationId=${evaluationId}`} download
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-80"
            style={{ background: "#f0b429", color: "#0d1f33" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 18 15 15"/>
            </svg>
            Exportar PDF
          </a>
        </section>
      </main>
    </div>
  );
}

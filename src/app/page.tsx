"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import Chat from "@/components/Chat";
import Kanban from "@/components/Kanban";
import ComplianceGauge from "@/components/ComplianceGauge";
import { useStore } from "@/lib/store/useStore";

// Three.js only runs client-side — no SSR
const ChestViewer = dynamic(() => import("@/components/ChestViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-2xl bg-cavaltec-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cavaltec-gold border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

type PageStatus = "loading" | "onboarding" | "ready";

const SECTORS = [
  "Ciberseguridad",
  "Tecnología e Innovación",
  "Financiero y Bancario",
  "Salud y Bienestar",
  "Educación",
  "Manufactura e Industria",
  "Gobierno y Sector Público",
  "Telecomunicaciones",
  "Comercio y Retail",
  "Otro",
];

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const { setEvaluationSession, evaluationId, score, companyName, tasks } = useStore();

  const [pageStatus, setPageStatus] = useState<PageStatus>(() =>
    useStore.getState().evaluationId ? "ready" : "loading"
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", nit: "", sector: "" });

  // Verificar si el usuario ya tiene empresa y evaluación
  useEffect(() => {
    if (sessionStatus !== "authenticated" || evaluationId) return;

    fetch("/api/evaluation/start", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ready") {
          setEvaluationSession(data.evaluationId, data.companyId, data.companyName ?? undefined);
          setPageStatus("ready");
        } else if (data.status === "needs_onboarding") {
          setPageStatus("onboarding");
        }
      })
      .catch(() => setPageStatus("onboarding"));
  }, [sessionStatus, evaluationId, setEvaluationSession]);

  // Si ya hay evaluationId en el store (retorno a la página), ir directo al dashboard
  useEffect(() => {
    if (evaluationId) setPageStatus("ready");
  }, [evaluationId]);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.nit || !form.sector) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/company/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.status === "ready") {
        setEvaluationSession(data.evaluationId, data.companyId, data.companyName);
        setPageStatus("ready");
      } else {
        setFormError(data.error ?? "Error al registrar. Intenta de nuevo.");
      }
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (sessionStatus === "loading" || pageStatus === "loading") {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "linear-gradient(135deg, #0d1f33 0%, #1a3a5c 100%)" }}
      >
        <div className="w-10 h-10 border-[3px] border-cavaltec-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-cavaltec-gold text-sm font-semibold tracking-wide">
          Verificando sesión segura...
        </p>
      </div>
    );
  }

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (pageStatus === "onboarding") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center px-4 overflow-auto py-8"
        style={{ background: "linear-gradient(135deg, #0d1f33 0%, #1a3a5c 100%)" }}
      >
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-cavaltec-gold text-xs font-semibold uppercase tracking-widest mb-3">
              <span className="w-2 h-2 rounded-full bg-cavaltec-gold animate-pulse" />
              Configuración inicial
            </span>
            <h1 className="text-2xl font-extrabold text-white">
              Registra tu empresa
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Esta información contextualiza el diagnóstico de cumplimiento.
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8 shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Nombre de la empresa *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Empresa S.A.S."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cavaltec-gold"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  NIT *
                </label>
                <input
                  type="text"
                  value={form.nit}
                  onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))}
                  placeholder="Ej: 900.123.456-7"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cavaltec-gold"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Sector *
                </label>
                <select
                  value={form.sector}
                  onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cavaltec-gold appearance-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: form.sector ? "white" : "#64748b",
                  }}
                >
                  <option value="" disabled style={{ background: "#0d1f33" }}>
                    Selecciona el sector
                  </option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s} style={{ background: "#0d1f33", color: "white" }}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-2">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-cavaltec-dark mt-1 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: isSubmitting ? "#c8952a" : "#f0b429" }}
              >
                {isSubmitting ? "Iniciando..." : "Comenzar diagnóstico →"}
              </button>
            </form>
          </div>

          {/* User info */}
          {session?.user && (
            <div className="mt-5 flex items-center justify-center gap-2">
              {session.user.image && (
                <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
              )}
              <span className="text-slate-500 text-xs">{session.user.email}</span>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const tasksTotal = tasks.length;
  const tasksDone = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="min-h-screen flex flex-col bg-cavaltec-light">

      {/* Top navigation */}
      <header className="bg-cavaltec-dark shadow-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(240,180,41,0.15)", border: "1px solid rgba(240,180,41,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 5.5v6c0 4.97 3.47 9.63 8 10.73C16.53 21.13 20 16.47 20 11.5v-6L12 2z"
                  stroke="#f0b429" strokeWidth="1.5" strokeLinejoin="round"
                  fill="rgba(240,180,41,0.1)" />
              </svg>
            </div>
            <div>
              <span className="text-white font-extrabold text-sm tracking-tight">
                CAVAL<span className="text-cavaltec-gold">TEC</span>
              </span>
              {companyName && (
                <p className="text-slate-400 text-xs leading-none mt-0.5">{companyName}</p>
              )}
            </div>
          </div>

          {/* Score badge */}
          <div className="hidden sm:flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: score >= 80 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444",
              }}
            />
            <span className="text-white font-bold text-sm">{score}%</span>
            <span className="text-slate-400 text-xs">Cumplimiento</span>
          </div>

          {/* User menu */}
          {session?.user && (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border-2 border-white/20"
                />
              )}
              <div className="hidden md:block text-right">
                <p className="text-white text-xs font-semibold leading-none">
                  {session.user.name ?? session.user.email}
                </p>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-slate-400 hover:text-red-400 text-xs transition-colors mt-0.5"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 flex flex-col gap-6 flex-grow">

        {/* Score overview: Chest 3D + Gauge + Stats */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Cofre 3D */}
          <div className="bg-cavaltec-dark rounded-2xl shadow-sm border border-slate-800 p-4">
            <ChestViewer />
          </div>

          {/* Velocímetro */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center py-6 px-4">
            <ComplianceGauge score={score} />
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-4">
            {/* Risk level */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                Nivel de riesgo
              </p>
              <p
                className="text-2xl font-extrabold"
                style={{ color: score >= 80 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444" }}
              >
                {score >= 80 ? "Bajo" : score >= 50 ? "Medio" : "Alto"}
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {score >= 80
                  ? "Organización conforme con los criterios principales de Ley 1581."
                  : score >= 50
                  ? "Existen brechas que requieren atención prioritaria."
                  : "Vulnerabilidades críticas en protección de datos personales."}
              </p>
            </div>

            {/* Controls progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                Controles implementados
              </p>
              <p className="text-2xl font-extrabold text-cavaltec-dark">
                {tasksDone}
                <span className="text-slate-300 font-normal"> / {tasksTotal}</span>
              </p>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-700"
                  style={{ width: tasksTotal > 0 ? `${(tasksDone / tasksTotal) * 100}%` : "0%" }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Brechas mitigadas en el Kanban</p>
            </div>
          </div>
        </section>

        {/* Chat + Kanban */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Chat />
          <Kanban />
        </section>
      </main>
    </div>
  );
}

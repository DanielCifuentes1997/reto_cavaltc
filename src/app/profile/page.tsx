"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/useStore";

const SECTORS = [
  "Ciberseguridad", "Tecnología e Innovación", "Financiero y Bancario",
  "Salud y Bienestar", "Educación", "Manufactura e Industria",
  "Gobierno y Sector Público", "Telecomunicaciones", "Comercio y Retail", "Otro",
];

const SIZES = [
  "Microempresa (1–10 empleados)",
  "Pequeña empresa (11–50 empleados)",
  "Mediana empresa (51–200 empleados)",
  "Grande empresa (más de 200 empleados)",
];

const PQRS_TYPES = [
  { value: "peticion", label: "Petición" },
  { value: "queja", label: "Queja" },
  { value: "reclamo", label: "Reclamo" },
  { value: "sugerencia", label: "Sugerencia" },
];

type Tab = "empresa" | "historial" | "pqrs";

interface Company { name: string; nit: string | null; industry_sector: string; company_size: string | null; }
interface Evaluation { id: string; score: number; status: string; createdAt: string; companyName: string; sector: string; }

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
      style={{
        background: active ? "#f0b429" : "rgba(255,255,255,0.05)",
        color: active ? "#0d1f33" : "#94a3b8",
        border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </button>
  );
}

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { reset, evaluationId } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("empresa");

  const [company, setCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: "", nit: "", sector: "", size: "" });
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyMsg, setCompanyMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [pqrsForm, setPqrsForm] = useState({ type: "peticion", subject: "", message: "" });
  const [pqrsSending, setPqrsSending] = useState(false);
  const [pqrsMsg, setPqrsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") { router.push("/login"); return; }
    if (sessionStatus !== "authenticated") return;

    fetch("/api/company/update")
      .then((r) => r.json())
      .then(({ company: c }) => {
        if (c) {
          setCompany(c);
          setCompanyForm({ name: c.name, nit: c.nit ?? "", sector: c.industry_sector, size: c.company_size ?? "" });
        }
      })
      .finally(() => setCompanyLoading(false));
  }, [sessionStatus, router]);

  useEffect(() => {
    if (activeTab !== "historial" || evaluations.length > 0) return;
    setHistLoading(true);
    fetch("/api/evaluations")
      .then((r) => r.json())
      .then(({ evaluations: data }) => setEvaluations(data ?? []))
      .catch(console.error)
      .finally(() => setHistLoading(false));
  }, [activeTab, evaluations.length]);

  const handleCompanySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.nit || !companyForm.sector) {
      setCompanyMsg({ type: "err", text: "Todos los campos son obligatorios." });
      return;
    }
    setCompanySaving(true);
    setCompanyMsg(null);
    try {
      const res = await fetch("/api/company/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      if (res.ok) {
        setCompanyMsg({ type: "ok", text: "Datos actualizados correctamente." });
        setCompany({ name: companyForm.name, nit: companyForm.nit, industry_sector: companyForm.sector, company_size: companyForm.size });
      } else {
        const d = await res.json();
        setCompanyMsg({ type: "err", text: d.error ?? "Error al guardar." });
      }
    } catch {
      setCompanyMsg({ type: "err", text: "Error de conexión." });
    } finally {
      setCompanySaving(false);
    }
  };

  const handleDeleteEvaluation = async (id: string) => {
    if (!confirm("¿Eliminar este informe del historial? Esta acción no se puede deshacer.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvaluations((prev) => prev.filter((e) => e.id !== id));
        if (evaluationId === id) reset();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePqrsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPqrsSending(true);
    setPqrsMsg(null);
    try {
      const res = await fetch("/api/pqrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pqrsForm),
      });
      if (res.ok) {
        setPqrsMsg({ type: "ok", text: "Tu solicitud fue enviada. Te responderemos en máximo 15 días hábiles." });
        setPqrsForm({ type: "peticion", subject: "", message: "" });
      } else {
        const d = await res.json();
        setPqrsMsg({ type: "err", text: d.error ?? "Error al enviar." });
      }
    } catch {
      setPqrsMsg({ type: "err", text: "Error de conexión." });
    } finally {
      setPqrsSending(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-cavaltec-dark flex items-center justify-center">
        <div className="w-9 h-9 border-[3px] border-cavaltec-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0d1f33 0%, #081525 100%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(13,31,51,0.9)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <img src="/logo_blanco.png" alt="CAVALTEC" className="h-7 w-auto object-contain" />
          <span className="text-slate-400 text-xs hidden sm:inline">· Mi perfil</span>

          <div className="ml-auto flex items-center gap-3">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border-2 border-white/15" />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* User info card */}
        <div className="rounded-2xl p-6 mb-8 flex items-center gap-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="w-16 h-16 rounded-full border-2 border-cavaltec-gold/30" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-cavaltec-gold/20 flex items-center justify-center">
              <span className="text-cavaltec-gold text-2xl font-bold">
                {(session?.user?.name ?? session?.user?.email ?? "U")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg truncate">{session?.user?.name ?? "Usuario"}</p>
            <p className="text-slate-400 text-sm truncate">{session?.user?.email}</p>
            {company && (
              <p className="text-cavaltec-gold text-xs font-semibold mt-1">{company.name}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <TabButton active={activeTab === "empresa"} onClick={() => setActiveTab("empresa")}>
            Datos de empresa
          </TabButton>
          <TabButton active={activeTab === "historial"} onClick={() => setActiveTab("historial")}>
            Historial de informes
          </TabButton>
          <TabButton active={activeTab === "pqrs"} onClick={() => setActiveTab("pqrs")}>
            PQRS
          </TabButton>
        </div>

        {/* ── Tab: EMPRESA ── */}
        {activeTab === "empresa" && (
          <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-white font-bold text-xl mb-6">Datos de tu empresa</h2>
            {companyLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-cavaltec-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !company ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm mb-4">No tienes empresa registrada aún.</p>
                <Link href="/dashboard" className="text-cavaltec-gold font-semibold text-sm hover:underline">
                  Ir al dashboard para registrarla →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCompanySave} className="flex flex-col gap-5">
                <Field label="Nombre de la empresa *">
                  <input
                    type="text"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Empresa S.A.S."
                    className="input-field"
                  />
                </Field>
                <Field label="NIT *">
                  <input
                    type="text"
                    value={companyForm.nit}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, nit: e.target.value }))}
                    placeholder="Ej: 900.123.456-7"
                    className="input-field"
                  />
                </Field>
                <Field label="Sector *">
                  <select
                    value={companyForm.sector}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, sector: e.target.value }))}
                    className="input-field appearance-none"
                    style={{ color: companyForm.sector ? "white" : "#64748b" }}
                  >
                    <option value="" disabled style={{ background: "#0d1f33" }}>Selecciona el sector</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s} style={{ background: "#0d1f33", color: "white" }}>{s}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Tamaño de la empresa">
                  <select
                    value={companyForm.size}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, size: e.target.value }))}
                    className="input-field appearance-none"
                    style={{ color: companyForm.size ? "white" : "#64748b" }}
                  >
                    <option value="" style={{ background: "#0d1f33", color: "#64748b" }}>Sin especificar</option>
                    {SIZES.map((s) => (
                      <option key={s} value={s} style={{ background: "#0d1f33", color: "white" }}>{s}</option>
                    ))}
                  </select>
                </Field>

                {companyMsg && (
                  <p className={`text-sm px-4 py-2 rounded-lg ${companyMsg.type === "ok" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {companyMsg.text}
                  </p>
                )}

                <style>{`.input-field { width:100%; padding: 12px 16px; border-radius:12px; font-size:14px; color:white; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); outline:none; } .input-field:focus { box-shadow: 0 0 0 2px #f0b429; }`}</style>

                <button
                  type="submit"
                  disabled={companySaving}
                  className="py-3.5 rounded-xl font-bold text-sm text-cavaltec-dark transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#f0b429" }}
                >
                  {companySaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Tab: HISTORIAL ── */}
        {activeTab === "historial" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-bold text-xl mb-2">Historial de informes</h2>
            {histLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-cavaltec-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : evaluations.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-slate-400 mb-4">Sin evaluaciones registradas.</p>
                <Link href="/dashboard" className="text-cavaltec-gold font-semibold text-sm hover:underline">
                  Iniciar primera auditoría →
                </Link>
              </div>
            ) : (
              evaluations.map((ev) => {
                const color = ev.score >= 80 ? "#22c55e" : ev.score >= 50 ? "#f0b429" : "#ef4444";
                return (
                  <div key={ev.id} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{ev.companyName}</p>
                      <p className="text-slate-400 text-xs">{ev.sector} · {new Date(ev.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}</p>
                    </div>
                    <span className="text-sm font-extrabold flex-shrink-0" style={{ color }}>{ev.score}%</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {ev.status === "in_progress" ? (
                        <Link href="/dashboard" className="text-xs font-bold text-cavaltec-gold hover:underline">
                          Continuar →
                        </Link>
                      ) : (
                        <Link href={`/results?evaluationId=${ev.id}`} className="text-xs font-bold text-cavaltec-gold hover:underline">
                          Ver informe →
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteEvaluation(ev.id)}
                        disabled={deletingId === ev.id}
                        className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Eliminar informe"
                      >
                        {deletingId === ev.id ? (
                          <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab: PQRS ── */}
        {activeTab === "pqrs" && (
          <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-white font-bold text-xl mb-2">Peticiones, Quejas, Reclamos y Sugerencias</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Tus derechos importan. Usa este formulario para ejercer tus derechos ARCO sobre tus datos personales o para enviarnos cualquier comunicación. Respondemos en máximo <strong className="text-white">15 días hábiles</strong>.
            </p>
            {pqrsMsg?.type === "ok" ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-green-400 font-semibold">{pqrsMsg.text}</p>
                <button
                  onClick={() => setPqrsMsg(null)}
                  className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handlePqrsSubmit} className="flex flex-col gap-5">
                <style>{`.input-field { width:100%; padding: 12px 16px; border-radius:12px; font-size:14px; color:white; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); outline:none; } .input-field:focus { box-shadow: 0 0 0 2px #f0b429; }`}</style>
                <Field label="Tipo de solicitud *">
                  <select
                    value={pqrsForm.type}
                    onChange={(e) => setPqrsForm((f) => ({ ...f, type: e.target.value }))}
                    className="input-field appearance-none"
                    style={{ color: "white" }}
                  >
                    {PQRS_TYPES.map((t) => (
                      <option key={t.value} value={t.value} style={{ background: "#0d1f33" }}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Asunto *">
                  <input
                    type="text"
                    value={pqrsForm.subject}
                    onChange={(e) => setPqrsForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Ej: Solicitud de eliminación de mis datos"
                    className="input-field"
                    maxLength={200}
                  />
                </Field>
                <Field label="Descripción *">
                  <textarea
                    value={pqrsForm.message}
                    onChange={(e) => setPqrsForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Describe tu solicitud con el mayor detalle posible..."
                    rows={6}
                    maxLength={2000}
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-slate-600 mt-1 text-right">{pqrsForm.message.length}/2000</p>
                </Field>

                {pqrsMsg?.type === "err" && (
                  <p className="text-sm px-4 py-2 rounded-lg bg-red-500/10 text-red-400">{pqrsMsg.text}</p>
                )}

                <button
                  type="submit"
                  disabled={pqrsSending}
                  className="py-3.5 rounded-xl font-bold text-sm text-cavaltec-dark transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "#f0b429" }}
                >
                  {pqrsSending ? "Enviando..." : "Enviar solicitud"}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

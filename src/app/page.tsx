"use client";

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HomeScene = dynamic(() => import("@/components/HomeScene"), { ssr: false });

export default function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);

  // GSAP text entrance — same pattern as the example
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-text",
        { y: 70, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.6, ease: "power4.out", stagger: 0.18, delay: 0.3 }
      );
      gsap.fromTo(
        ".hero-badge",
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)", delay: 0.1 }
      );
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={mainRef}
      className="w-full relative text-white"
      style={{ background: "#060f1e" }}
    >
      {/* ── FIXED 3D CANVAS (stays in background while content scrolls over it) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <HomeScene />
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="relative z-10">

        {/* ── NAV ── */}
        <nav
          className="fixed top-0 inset-x-0 z-50 border-b pointer-events-auto"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(6,15,30,0.75)", backdropFilter: "blur(14px)" }}
        >
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <img src="/logo_blanco.png" alt="CAVALTEC" className="h-11 w-auto object-contain" />
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
                Iniciar sesión
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-cavaltec-dark transition-all hover:scale-[1.04]"
                style={{ background: "#f0b429" }}
              >
                Comenzar auditoría →
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO — full screen ── */}
        <section className="h-screen w-full flex flex-col justify-center px-8 md:px-16 lg:px-24 pointer-events-none">
          <div className="max-w-3xl">

            {/* Badge */}
            <div className="hero-badge inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.25)", color: "#f0b429" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-cavaltec-gold animate-pulse" />
              Diagnóstico IA · Ley 1581 de 2012
            </div>

            {/* Main heading — mix-blend-difference makes it "cut through" the canvas */}
            <h1 className="hero-text text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase mix-blend-difference">
              Protege<br />
              tu empresa<br />
              <span style={{ color: "#f0b429" }}>con IA.</span>
            </h1>

            <p className="hero-text mt-8 text-base md:text-lg text-slate-300 max-w-lg leading-relaxed">
              Audita el cumplimiento de la <strong className="text-white">Ley 1581</strong> en 15 minutos. Detecta brechas, obtén tu puntaje y descarga un informe ejecutivo listo para presentar.
            </p>

            <div className="hero-text mt-10 flex gap-4 pointer-events-auto">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-cavaltec-dark transition-all hover:scale-[1.04]"
                style={{ background: "#f0b429", boxShadow: "0 0 32px rgba(240,180,41,0.3)" }}
              >
                Iniciar diagnóstico gratis
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a
                href="#que-evaluamos"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              >
                ¿Qué evaluamos?
              </a>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-10 left-8 md:left-16 flex items-center gap-4">
            <div className="w-px h-16 bg-gradient-to-b from-cavaltec-gold to-transparent animate-pulse" />
            <span
              className="text-xs uppercase tracking-[0.3em] text-cavaltec-gold"
              style={{ writingMode: "vertical-rl" }}
            >
              Desplazar
            </span>
          </div>
        </section>

        {/* ── SECTION 2: El riesgo ── */}
        <section
          id="que-evaluamos"
          className="min-h-screen w-full flex flex-col justify-center px-8 md:px-16 lg:px-24 pointer-events-none"
        >
          <div className="max-w-2xl ml-auto text-right">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cavaltec-gold mb-6 block">
              / El problema
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mix-blend-difference">
              Las multas de la SIC<br />son reales.
            </h2>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              La Ley 1581 obliga a <strong className="text-white">toda empresa colombiana</strong> que recopile datos personales. Sanciones de hasta <strong className="text-cavaltec-gold">$2.500 millones de pesos</strong>. La mayoría de las empresas no sabe si cumple.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6 text-left pointer-events-none">
              {[
                { val: "72%", desc: "empresas sin política de datos adoptada" },
                { val: "15 días", desc: "para notificar una vulneración a la SIC" },
                { val: "11", desc: "criterios que evaluamos en 15 minutos" },
              ].map((s) => (
                <div key={s.val} className="border-t border-cavaltec-gold/30 pt-4">
                  <p className="text-2xl font-extrabold text-cavaltec-gold">{s.val}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Cómo funciona ── */}
        <section className="min-h-screen w-full flex flex-col justify-center px-8 md:px-16 lg:px-24 pointer-events-none">
          <div className="max-w-4xl">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cavaltec-gold mb-6 block">
              / Cómo funciona
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mix-blend-difference mb-14">
              De cero a diagnóstico<br />en 4 pasos.
            </h2>

            <ul className="flex flex-col gap-5 md:gap-6">
              {[
                { num: "01", title: "Inicia sesión", desc: "Microsoft, Google o GitHub. Sin contraseñas. Sin instalaciones." },
                { num: "02", title: "Registra tu empresa", desc: "Nombre, NIT y sector. 30 segundos y el perfil queda listo." },
                { num: "03", title: "Responde 11 preguntas con la IA", desc: "AUDITOR-1581 te guía en lenguaje natural. ~15 minutos." },
                { num: "04", title: "Obtén tu informe", desc: "Puntaje 0-100%, PDF ejecutivo y tablero Kanban de mitigación." },
              ].map((s) => (
                <li
                  key={s.num}
                  className="group flex items-start gap-6 border-b pb-5 transition-colors duration-500"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <span className="text-5xl font-black text-cavaltec-gold opacity-50 leading-none flex-shrink-0 group-hover:opacity-100 transition-opacity duration-300">
                    {s.num}
                  </span>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── SECTION 4: CTA final ── */}
        <section className="min-h-screen w-full flex flex-col justify-center items-center px-8 md:px-16 text-center pointer-events-none">
          <div className="pointer-events-auto">
            <span className="text-xs font-semibold uppercase tracking-widest text-cavaltec-gold mb-6 block">
              El siguiente paso de tu empresa
            </span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 mix-blend-difference">
              ¿Estás<br />protegido?
            </h2>
            <p className="text-slate-300 text-lg mb-12 max-w-md mx-auto leading-relaxed">
              Descúbrelo hoy. Gratis. Sin compromiso. Sin instalaciones.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl font-bold text-lg text-cavaltec-dark transition-all hover:scale-[1.05] uppercase tracking-wide"
              style={{ background: "#f0b429", boxShadow: "0 0 48px rgba(240,180,41,0.35)" }}
            >
              [ Iniciar diagnóstico ]
            </Link>
            <p className="text-slate-600 text-xs mt-8">
              Al continuar aceptas nuestra{" "}
              <Link href="/habeas-data" className="text-slate-500 underline hover:text-slate-300 transition-colors">
                Política de Datos Personales
              </Link>
              {" "}· Hackathon MINTIC 2026 · CAVALTEC Cybersecurity
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";

function ShieldIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L4 5.5v6c0 4.97 3.47 9.63 8 10.73C16.53 21.13 20 16.47 20 11.5v-6L12 2z"
        fill="rgba(240,180,41,0.15)"
        stroke="#f0b429"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2.5 2.5 4-5"
        stroke="#f0b429"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden>
      <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
      <path fill="#f35325" d="M1 1h10v10H1z"/>
      <path fill="#81bc06" d="M12 1h10v10H12z"/>
      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
      <path fill="#ffba08" d="M12 12h10v10H12z"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-auto"
      style={{ background: "linear-gradient(135deg, #0d1f33 0%, #1a3a5c 60%, #0d2744 100%)" }}>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #f0b429, transparent)" }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #f0b429, transparent)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ShieldIcon />
          </div>
          <Image src="/logo_blanco.png" alt="CAVALTEC" width={180} height={48} className="object-contain mx-auto mb-1" priority />
          <p className="text-slate-400 text-sm">
            Plataforma de Cumplimiento — Ley 1581 de 2012
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>

          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                Acceso seguro · OAuth 2.0
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Microsoft (enterprise preferred) */}
              <button
                onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "#0078D4" }}
              >
                <MicrosoftIcon />
                <span className="text-white">Continuar con Microsoft</span>
                <span className="ml-auto text-xs text-blue-200 font-normal">Empresarial</span>
              </button>

              {/* Google */}
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold text-sm bg-white hover:bg-slate-50 text-slate-800 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm"
              >
                <GoogleIcon />
                <span>Continuar con Google</span>
              </button>

              {/* GitHub */}
              <button
                onClick={() => signIn("github", { callbackUrl: "/" })}
                className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "#24292F" }}
              >
                <GitHubIcon />
                <span className="text-white">Continuar con GitHub</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-slate-500">
              Al ingresar confirmas que cuentas con autorización de tu organización.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Conexión cifrada · Datos protegidos bajo Ley 1581
            </p>
          </div>
        </div>

        {/* Bottom badge */}
        <div className="mt-6 text-center">
          <span className="text-xs text-slate-600">
            Hackathon MINTIC 2026 · Powered by CAVALTEC Cybersecurity
          </span>
        </div>
      </div>
    </div>
  );
}

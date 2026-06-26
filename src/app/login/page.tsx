"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-cavaltec-light px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-cavaltec-dark p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Portal de Acceso Seguro
          </h1>
          <p className="text-sm text-slate-300">
            Plataforma de Cumplimiento Ley 1581
          </p>
        </div>
        <div className="p-8 flex flex-col gap-4">
          <div className="text-center mb-4">
            <span className="bg-blue-100 text-cavaltec-blue text-xs font-semibold px-3 py-1 rounded-full">
              Autenticación OAuth 2.0
            </span>
          </div>
          <button
            onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-[#0078D4] hover:bg-[#005a9e] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Continuar con Microsoft (Empresarial)
          </button>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-lg border border-slate-300 shadow-sm transition-colors"
          >
            Continuar con Google
          </button>
          <button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-[#24292F] hover:bg-[#040d14] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Continuar con GitHub
          </button>
          <div className="mt-6 text-center text-xs text-slate-500 flex flex-col gap-1">
            <p>Al ingresar, confirmas que cuentas con autorización.</p>
            <p>Conexión encriptada de extremo a extremo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
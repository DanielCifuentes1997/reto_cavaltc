"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import Chat from "@/components/Chat";
import Kanban from "@/components/Kanban";
import { useStore } from "@/lib/store/useStore";

export default function Home() {
  const { data: session, status } = useSession();
  const { setEvaluationSession, evaluationId } = useStore();

  useEffect(() => {
    if (session?.user && !evaluationId) {
      const currentCompanyId = (session.user as any).company_id || crypto.randomUUID();
      const newEvaluationId = crypto.randomUUID();
      setEvaluationSession(newEvaluationId, currentCompanyId);
    }
  }, [session, evaluationId, setEvaluationSession]);

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <p className="text-cavaltec-blue font-bold">Autenticando sesión segura...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-cavaltec-blue mb-2">
            Consola de Cumplimiento Normativo
          </h1>
          <p className="text-slate-600">
            Autodiagnóstico asistido por IA para la Ley 1581 (Protección de Datos Personales).
          </p>
        </div>
        
        {session?.user && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-center md:text-right">
            <p className="text-sm font-bold text-cavaltec-dark">
              {session.user.email}
            </p>
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Rol: {(session.user as any).role}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="flex flex-col gap-4">
          <Chat />
        </section>
        <section className="flex flex-col gap-4">
          <Kanban />
        </section>
      </div>
    </div>
  );
}
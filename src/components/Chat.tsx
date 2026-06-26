"use client";

import { useChat } from "@ai-sdk/react";
import { useStore } from "@/lib/store/useStore";

export default function Chat() {
  const { evaluationId, companyId } = useStore();

    const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      evaluationId,
      companyId,
    },
  } as any) as any;

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
      <div className="bg-cavaltec-blue p-4 text-white">
        <h2 className="text-xl font-bold">Auditor IA - Ley 1581</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
        {messages?.map((m: any) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg max-w-[80%] ${
              m.role === "user"
                ? "bg-cavaltec-blue text-white self-end"
                : "bg-slate-100 text-slate-800 self-start"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe tu respuesta..."
          className="flex-grow p-2 border border-slate-300 rounded focus:outline-none focus:border-cavaltec-blue"
        />
        <button
          type="submit"
          className="bg-cavaltec-gold text-cavaltec-dark px-4 py-2 rounded font-bold hover:bg-yellow-400 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
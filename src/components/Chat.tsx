"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useStore } from "@/lib/store/useStore";

export default function Chat() {
  const { evaluationId, updateScore, addTask, score } = useStore();
  const [inputText, setInputText] = useState("");
  const processedToolCalls = useRef(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Crear transport estable que siempre lee el evaluationId actual del store
  const transportRef = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ evaluationId: useStore.getState().evaluationId }),
    })
  );

  const { messages, sendMessage, status } = useChat({
    transport: transportRef.current,
  });

  // Conectar resultados del tool al store (score + kanban)
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const part of m.parts) {
        // Los resultados de tools server-side llegan como 'dynamic-tool'
        if (part.type !== "dynamic-tool") continue;
        if (part.state !== "output-available") continue;
        if (part.toolName !== "registrar_evaluacion_ley_1581") continue;
        if (processedToolCalls.current.has(part.toolCallId)) continue;

        processedToolCalls.current.add(part.toolCallId);
        const result = part.output as any;

        if (typeof result?.nuevo_puntaje_global === "number") {
          updateScore(result.nuevo_puntaje_global);
        }
        if (result?.nueva_tarea) {
          addTask(result.nueva_tarea);
        }
      }
    }
  }, [messages, updateScore, addTask]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText("");
    await sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-cavaltec-blue px-5 py-4 text-white flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <div>
          <h2 className="text-lg font-bold leading-none">Auditor IA — Ley 1581</h2>
          <p className="text-xs text-blue-200 mt-0.5">Asistido por Gemini</p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-grow overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-8">
            <p className="font-semibold">El auditor está listo.</p>
            <p className="mt-1">
              Escribe{" "}
              <span className="font-mono bg-slate-100 px-1 rounded">
                Iniciar auditoría
              </span>{" "}
              para comenzar.
            </p>
          </div>
        )}

        {messages.map((m) => {
          // En AI SDK v7, el contenido de texto está en parts con type:'text'
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { type: "text"; text: string }).text)
            .join("");

          if (!text) return null;

          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`px-4 py-3 rounded-xl text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                isUser
                  ? "bg-cavaltec-blue text-white self-end rounded-br-none"
                  : "bg-white text-slate-800 self-start shadow-sm border border-slate-100 rounded-bl-none"
              }`}
            >
              {text}
            </div>
          );
        })}

        {isLoading && (
          <div className="self-start flex gap-1 px-4 py-3">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Results CTA — visible once at least one question is scored */}
      {score > 0 && (
        <div className="px-4 py-2.5 bg-cavaltec-dark/5 border-t border-cavaltec-blue/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cavaltec-gold animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">
              Evaluación en curso · {score}% acumulado
            </span>
          </div>
          <Link
            href="/results"
            className="flex items-center gap-1.5 text-xs font-bold text-cavaltec-blue hover:text-cavaltec-gold transition-colors whitespace-nowrap"
          >
            Ver informe
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 bg-white border-t border-slate-200 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          placeholder={
            evaluationId ? "Escribe tu respuesta..." : "Iniciando sesión segura..."
          }
          className="flex-grow px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cavaltec-blue focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim() || !evaluationId}
          className="bg-cavaltec-gold text-cavaltec-dark px-5 py-2 rounded-lg font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

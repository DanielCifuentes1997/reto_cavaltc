"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useStore } from "@/lib/store/useStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useVoiceSpeaker } from "@/hooks/useVoiceSpeaker";

export default function Chat() {
  const { evaluationId, updateScore, addTask, score } = useStore();
  const [inputText, setInputText] = useState("");
  const processedToolCalls = useRef(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenId = useRef<string | null>(null);

  const transportRef = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ evaluationId: useStore.getState().evaluationId }),
    })
  );

  const { messages, sendMessage, status } = useChat({
    transport: transportRef.current,
  });

  // ── Voice hooks ──────────────────────────────────────────────────────────
  const { speak, stop: stopSpeaking, isSpeaking, isEnabled: audioEnabled, toggle: toggleAudio } =
    useVoiceSpeaker();

  const handleTranscript = useCallback((text: string) => {
    setInputText(text);
  }, []);

  const { isRecording, isSupported: micSupported, toggle: toggleMic } =
    useVoiceInput(handleTranscript);

  // ── Connect tool results to store ────────────────────────────────────────
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const part of m.parts) {
        if (part.type !== "dynamic-tool") continue;
        if (part.state !== "output-available") continue;
        if (part.toolName !== "registrar_evaluacion_ley_1581") continue;
        if (processedToolCalls.current.has(part.toolCallId)) continue;

        processedToolCalls.current.add(part.toolCallId);
        const result = part.output as Record<string, unknown>;

        if (typeof result?.nuevo_puntaje_global === "number") {
          updateScore(result.nuevo_puntaje_global);
        }
        if (result?.nueva_tarea) {
          addTask(result.nueva_tarea as Parameters<typeof addTask>[0]);
        }
      }
    }
  }, [messages, updateScore, addTask]);

  // ── Auto-speak new AI messages ────────────────────────────────────────────
  useEffect(() => {
    if (status !== "ready") return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last || last.id === lastSpokenId.current) return;

    const text = last.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("");

    if (text) {
      lastSpokenId.current = last.id;
      speak(text);
    }
  }, [messages, status, speak]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;
    stopSpeaking();
    setInputText("");
    await sendMessage({ text });
  };

  const handleMicToggle = () => {
    if (isRecording) return toggleMic(); // stop → transcript applied → user sends
    stopSpeaking();
    toggleMic();
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">

      {/* ── Header ── */}
      <div className="bg-cavaltec-blue px-5 py-3 text-white flex items-center gap-3">
        <Image
          src="/logo_blanco.png"
          alt="CAVALTEC"
          width={110}
          height={28}
          className="object-contain"
          priority
        />
        <div className="flex-grow">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold">Auditor IA · Ley 1581</span>
          </div>
          <p className="text-xs text-blue-200">Asistido por Gemini</p>
        </div>

        {/* Audio toggle */}
        <button
          onClick={toggleAudio}
          title={audioEnabled ? "Desactivar audio" : "Activar audio"}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            audioEnabled
              ? "bg-white/15 hover:bg-white/25"
              : "bg-white/5 hover:bg-white/10 opacity-50"
          }`}
        >
          {audioEnabled ? (
            /* Speaker on */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            /* Speaker off */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-grow overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-8">
            <p className="font-semibold">El auditor está listo.</p>
            <p className="mt-1">
              Escribe{" "}
              <span className="font-mono bg-slate-100 px-1 rounded">Iniciar auditoría</span>
              {" "}o usa el micrófono para comenzar.
            </p>
          </div>
        )}

        {messages.map((m) => {
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
              {!isUser && isSpeaking && lastSpokenId.current === m.id && (
                <span className="inline-flex items-center gap-1 mr-2 opacity-60">
                  <span className="w-1 h-3 bg-cavaltec-gold rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-3 bg-cavaltec-gold rounded-full animate-bounce [animation-delay:100ms]" />
                  <span className="w-1 h-3 bg-cavaltec-gold rounded-full animate-bounce [animation-delay:200ms]" />
                </span>
              )}
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

      {/* ── Results CTA ── */}
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

      {/* ── Recording indicator ── */}
      {isRecording && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-600 font-semibold">Grabando… Presiona el micrófono para terminar</span>
        </div>
      )}

      {/* ── Input ── */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 bg-white border-t border-slate-200 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading || isRecording}
          placeholder={
            isRecording
              ? "Grabando voz..."
              : evaluationId
              ? "Escribe tu respuesta o usa el micrófono…"
              : "Iniciando sesión segura..."
          }
          className="flex-grow px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cavaltec-blue focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
        />

        {/* Mic button — only if browser supports it */}
        {micSupported && (
          <button
            type="button"
            onClick={handleMicToggle}
            disabled={isLoading}
            title={isRecording ? "Detener grabación" : "Hablar"}
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
              isRecording
                ? "bg-red-500 text-white shadow-lg shadow-red-200 scale-110"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-cavaltec-blue"
            } disabled:opacity-40`}
          >
            {isRecording ? (
              /* Stop square */
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            ) : (
              /* Mic */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        )}

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

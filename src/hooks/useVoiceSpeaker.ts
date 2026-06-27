"use client";

import { useRef, useState, useCallback } from "react";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export function useVoiceSpeaker() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!isEnabled) return;

      const clean = stripMarkdown(text);
      if (!clean) return;

      // Cancela cualquier audio anterior
      stop();

      setIsSpeaking(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean }),
          signal: controller.signal,
        });

        if (!res.ok || controller.signal.aborted) {
          setIsSpeaking(false);
          return;
        }

        const blob = await res.blob();
        if (controller.signal.aborted) { setIsSpeaking(false); return; }

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setIsSpeaking(false);
        };

        await audio.play();
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("[tts]", err);
        }
        setIsSpeaking(false);
      }
    },
    [isEnabled, stop]
  );

  const toggle = useCallback(() => {
    if (isSpeaking) stop();
    setIsEnabled((prev) => !prev);
  }, [isSpeaking, stop]);

  return { speak, stop, isSpeaking, isEnabled, toggle };
}

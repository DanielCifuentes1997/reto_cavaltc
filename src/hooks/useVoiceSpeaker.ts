"use client";

import { useRef, useState, useCallback, useEffect } from "react";

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
  const voicesLoadedRef = useRef(false);

  // Pre-load voices (browsers load them async)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => { voicesLoadedRef.current = true; };
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const clean = stripMarkdown(text);
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "es-ES";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Pick a Spanish voice if available
      const voices = window.speechSynthesis.getVoices();
      const spanish = voices.find((v) => v.lang.startsWith("es"));
      if (spanish) utterance.voice = spanish;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isEnabled]
  );

  const toggle = useCallback(() => {
    if (isSpeaking) stop();
    setIsEnabled((prev) => !prev);
  }, [isSpeaking, stop]);

  return { speak, stop, isSpeaking, isEnabled, toggle };
}

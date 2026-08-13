"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LunaState = "idle" | "listening" | "thinking" | "speaking";
export type Lang = "es" | "en";

type ChatMessage = { role: "user" | "assistant"; content: string };

const WAKE_WORDS = ["luna"];
const RETURN_PHRASES_ES = ["vuelve a luna", "vuelve a Luna"];
const RETURN_PHRASES_EN = ["back to luna", "come back luna"];
const SWITCH_TO_EN = ["habla en ingles", "habla en inglés", "switch to english", "speak english"];
const SWITCH_TO_ES = ["habla en español", "speak spanish", "switch to spanish"];

// El navegador no permite que una pestaña se enfoque a sí misma desde otra pestaña
// por seguridad. Como alternativa real, usamos una notificación del navegador:
// al hacer click en ella, sí vuelve a esta pestaña.
function notifyReturn(lang: Lang) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const title = lang === "es" ? "Luna" : "Luna";
  const body = lang === "es" ? "Toca para volver a Luna" : "Tap to return to Luna";
  if (Notification.permission === "granted") {
    const n = new Notification(title, { body });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  }
}

export function useLuna() {
  const [state, setState] = useState<LunaState>("idle");
  const [lang, setLang] = useState<Lang>("es");
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [awake, setAwake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const langRef = useRef<Lang>("es");
  const awakeRef = useRef(false);
  const stateRef = useRef<LunaState>("idle");

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);
  useEffect(() => {
    awakeRef.current = awake;
  }, [awake]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langRef.current === "es" ? "es-ES" : "en-US";
    utter.onstart = () => setState("speaking");
    utter.onend = () => {
      setState("idle");
      onEnd?.();
    };
    window.speechSynthesis.speak(utter);
  }, []);

  const sendToDeepSeek = useCallback(
    async (text: string) => {
      setState("thinking");
      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
      setMessages(nextMessages);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, lang: langRef.current }),
        });
        const data = await res.json();
        const reply = data.reply ?? (langRef.current === "es" ? "No entendí eso." : "I didn't catch that.");
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

        // Si DeepSeek devolvió una acción de abrir link, la abrimos.
        if (data.action?.type === "open_url" && data.action.url) {
          window.open(data.action.url, "_blank");
        }
        // Si devolvió una llamada a Home Assistant, ya se ejecutó server-side.

        speak(reply, () => {
          setAwake(false);
        });
      } catch (e) {
        setError("Error al conectar con DeepSeek");
        setState("idle");
      }
    },
    [messages, speak]
  );

  const handleFinalTranscript = useCallback(
    (text: string) => {
      const lower = text.toLowerCase().trim();

      // Comando: volver a la pestaña de Luna (funciona si esta pestaña sigue con el
      // reconocimiento activo en background — ver limitación arriba).
      if (RETURN_PHRASES_ES.some((p) => lower.includes(p.toLowerCase())) || RETURN_PHRASES_EN.some((p) => lower.includes(p))) {
        window.focus();
        notifyReturn(langRef.current);
        return;
      }

      // Comando: cambiar idioma
      if (SWITCH_TO_EN.some((p) => lower.includes(p))) {
        setLang("en");
        speak("Switched to English.");
        return;
      }
      if (SWITCH_TO_ES.some((p) => lower.includes(p))) {
        setLang("es");
        speak("Cambié a español.");
        return;
      }

      if (!awakeRef.current) {
        // Esperando la wake word "Luna"
        if (WAKE_WORDS.some((w) => lower.includes(w))) {
          setAwake(true);
          setState("listening");
          const greeting = langRef.current === "es" ? "Dime" : "Yes?";
          speak(greeting);
        }
        return;
      }

      // Ya despierta: esto es el comando/pregunta real
      setAwake(false);
      sendToDeepSeek(text);
    },
    [sendToDeepSeek, speak]
  );

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(
        lang === "es"
          ? "Tu navegador no soporta reconocimiento de voz (usa Chrome)."
          : "Your browser doesn't support speech recognition (use Chrome)."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang === "es" ? "es-ES" : "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(interim || final);
      if (final) handleFinalTranscript(final);
    };

    recognition.onerror = () => {
      // reinicia solo, los errores de "no-speech" son normales en escucha continua
    };

    recognition.onend = () => {
      // Mantiene la escucha continua reiniciando el motor
      try {
        recognition.start();
      } catch {
        /* ya estaba corriendo */
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    if (stateRef.current === "idle") setState("idle");
  }, [lang, handleFinalTranscript]);

  // Reinicia el reconocimiento cuando cambia el idioma
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    startListening();
    return () => {
      recognitionRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  return { state, lang, setLang, transcript, messages, awake, error, speak, sendToDeepSeek };
}

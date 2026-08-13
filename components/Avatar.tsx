"use client";

import type { LunaState } from "@/hooks/useLuna";

const STATE_COLOR: Record<LunaState, string> = {
  idle: "#3a4266",
  listening: "#7c6ff0",
  thinking: "#4f3485",
  speaking: "#8b9fd6",
};

const STATE_LABEL_ES: Record<LunaState, string> = {
  idle: "En espera de \u201cLuna\u201d",
  listening: "Escuchando",
  thinking: "Pensando",
  speaking: "Hablando",
};

const STATE_LABEL_EN: Record<LunaState, string> = {
  idle: "Waiting for \u201cLuna\u201d",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export default function Avatar({ state, lang }: { state: LunaState; lang: "es" | "en" }) {
  const color = STATE_COLOR[state];
  const label = lang === "es" ? STATE_LABEL_ES[state] : STATE_LABEL_EN[state];
  const active = state !== "idle";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-40 w-40 items-center justify-center">
        {active && (
          <>
            <span
              className="absolute h-40 w-40 rounded-full animate-ring"
              style={{ border: `1px solid ${color}` }}
            />
            <span
              className="absolute h-40 w-40 rounded-full animate-ring [animation-delay:0.6s]"
              style={{ border: `1px solid ${color}` }}
            />
          </>
        )}
        <div
          className="h-28 w-28 rounded-full animate-breathe transition-colors duration-700"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${color}cc, ${color}22 60%, transparent 75%)`,
            boxShadow: `0 0 60px ${color}55, 0 0 120px ${color}22`,
          }}
        />
      </div>
      <p className="font-body text-sm tracking-wide text-moon-soft">{label}</p>
    </div>
  );
}

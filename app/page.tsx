"use client";

import { useLuna } from "@/hooks/useLuna";
import Avatar from "@/components/Avatar";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import QuickActions from "@/components/QuickActions";

export default function Home() {
  const { state, lang, setLang, transcript, messages, error } = useLuna();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-between px-6 py-10">
      <header className="w-full text-center">
        <h1 className="font-display text-2xl tracking-tight text-moon-glow">Luna</h1>
        <p className="mt-1 font-body text-xs text-moon-soft">
          {lang === "es" ? "Di “Luna” para activarme" : "Say “Luna” to wake me"}
        </p>
      </header>

      <Avatar state={state} lang={lang} />

      <div className="w-full space-y-4">
        {transcript && (
          <p className="min-h-[1.5rem] text-center font-body text-sm text-moon-soft/80">{transcript}</p>
        )}

        {messages.length > 0 && (
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-night-700 bg-night-800/40 p-4">
            {messages.slice(-4).map((m, i) => (
              <p key={i} className="font-body text-xs text-moon-soft">
                <span className="text-moon-glow">{m.role === "user" ? "Tú: " : "Luna: "}</span>
                {m.content}
              </p>
            ))}
          </div>
        )}

        {error && <p className="text-center font-body text-xs text-speak">{error}</p>}

        <SpotifyPlayer lang={lang} />

        <div className="flex justify-center pt-2">
          <QuickActions lang={lang} setLang={setLang} />
        </div>
      </div>
    </main>
  );
}

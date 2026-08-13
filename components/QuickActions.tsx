"use client";

import type { Lang } from "@/hooks/useLuna";

export default function QuickActions({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const haUrl = process.env.NEXT_PUBLIC_HA_URL || "http://127.0.0.1:8123";

  return (
    <div className="flex items-center gap-3">
      <a
        href={haUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-night-700 px-4 py-2 font-body text-xs text-moon-soft transition-colors hover:border-moon-soft hover:text-moon-glow"
      >
        {lang === "es" ? "Abrir Home Assistant" : "Open Home Assistant"}
      </a>
      <button
        onClick={() => setLang(lang === "es" ? "en" : "es")}
        className="rounded-full border border-night-700 px-4 py-2 font-body text-xs text-moon-soft transition-colors hover:border-moon-soft hover:text-moon-glow"
      >
        {lang === "es" ? "ES → EN" : "EN → ES"}
      </button>
    </div>
  );
}

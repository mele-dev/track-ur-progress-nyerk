"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export function SiteHeader() {
  const { d, locale, setLocale } = useI18n();
  return (
    <header className="border-b border-line/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-black" aria-hidden>
            ✦
          </span>
          <span>{d.appName}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">
            {d.nav.home}
          </Link>
          <Link href="/roadmap" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">
            {d.nav.roadmap}
          </Link>
          <div className="ml-1 flex overflow-hidden rounded-lg border border-line" role="group" aria-label={d.lang.label}>
            {(["es", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={`px-2.5 py-1.5 text-xs font-semibold uppercase ${
                  locale === l ? "bg-gold text-black" : "text-muted hover:text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { d } = useI18n();
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-xs text-faint">
      <p>{d.footer}</p>
    </footer>
  );
}

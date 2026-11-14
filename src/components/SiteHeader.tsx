"use client";

import Link from "next/link";
import { DATA_META } from "@/data/meta";
import { useI18n } from "@/i18n/I18nProvider";

export function SiteHeader() {
  const { d, locale, setLocale } = useI18n();
  return (
    <header className="border-b border-line/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold text-black" aria-hidden>
            ✦
          </span>
          <span className="truncate">{d.appName}</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-1">
          <Link
            href="/"
            className="hidden rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink sm:inline-block"
          >
            {d.nav.home}
          </Link>
          <Link href="/roadmap" className="rounded-lg px-2 py-1.5 text-muted hover:bg-surface-2 hover:text-ink sm:px-3">
            <span className="sm:hidden">{d.nav.roadmapShort}</span>
            <span className="hidden sm:inline">{d.nav.roadmap}</span>
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
  const { d, fmt, locale } = useI18n();
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "es" ? "es-AR" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return (
    <footer className="mx-auto max-w-6xl space-y-1 px-4 pb-10 pt-6 text-xs text-faint">
      <p>
        {fmt(d.dataReviewed, {
          date: date(`${DATA_META.lastReviewed}T12:00:00Z`),
          patch: date(DATA_META.patchNotesReviewedThrough.postedAt),
        })}{" "}
        <a
          href={DATA_META.patchNotesReviewedThrough.url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted hover:text-muted"
        >
          ↗
        </a>
      </p>
      <p>{d.footer}</p>
    </footer>
  );
}

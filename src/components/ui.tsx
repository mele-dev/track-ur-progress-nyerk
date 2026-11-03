"use client";

import type { ReactNode } from "react";
import { SOURCES, type SourceId } from "@/data/sources";
import type { Confidence } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";

export function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
  id,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-2xl border border-line bg-surface/90 p-4 shadow-lg shadow-black/20 sm:p-5 ${className}`}>
      {(title || right) && (
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

type Tone = "neutral" | "gold" | "ok" | "warn" | "bad" | "info";

const TONES: Record<Tone, string> = {
  neutral: "border-line bg-surface-2 text-muted",
  gold: "border-gold/40 bg-gold-soft text-gold",
  ok: "border-ok/40 bg-ok-soft text-ok",
  warn: "border-warn/40 bg-warn-soft text-warn",
  bad: "border-bad/40 bg-bad-soft text-bad",
  info: "border-info/40 bg-info-soft text-info",
};

export function Badge({ tone = "neutral", children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const { d } = useI18n();
  if (confidence === "ok") return null;
  return (
    <Badge tone="warn" title={d.confidence.disputed}>
      <span aria-hidden>⚠</span>
      <span className="sr-only">{d.confidence.disputed}</span>
    </Badge>
  );
}

export function SourceLinks({ ids }: { ids: readonly SourceId[] }) {
  const { d } = useI18n();
  if (ids.length === 0) return null;
  return (
    <p className="mt-2 text-xs text-faint">
      {d.task.sources}:{" "}
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && " · "}
          <a href={SOURCES[id].url} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-muted">
            {SOURCES[id].title}
          </a>
        </span>
      ))}
    </p>
  );
}

export function ProgressBar({ pct, tone = "gold" }: { pct: number; tone?: "gold" | "ok" }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full transition-all ${tone === "gold" ? "bg-gradient-to-r from-gold/70 to-gold" : "bg-ok"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-transparent" aria-hidden />;
}

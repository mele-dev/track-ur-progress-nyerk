"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import type { CharacterSnapshot } from "@/lib/plaync/types";
import { getRegion } from "@/lib/regions";
import type { StatOverrides } from "@/lib/storage/progress";
import { Avatar, Badge, Spinner } from "../ui";

function Stat({ label, value, overridden }: { label: string; value: string; overridden?: boolean }) {
  const { d } = useI18n();
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface-2/60 px-2 py-2 text-center sm:px-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">{label}</p>
      <p className="truncate text-lg font-bold tabular-nums sm:text-xl">{value}</p>
      {overridden && <p className="text-[10px] uppercase text-warn">{d.header.manualBadge}</p>}
    </div>
  );
}

export function CharacterHeader({
  snapshot,
  level,
  gs,
  cp,
  overrides,
  membership,
  onSaveOverrides,
  onMembership,
  onRefresh,
  refreshing,
  officialUrl,
  editOpen,
  setEditOpen,
}: {
  snapshot: CharacterSnapshot;
  level: number | null;
  gs: number | null;
  cp: number | null;
  overrides: StatOverrides;
  membership: boolean;
  onSaveOverrides: (o: StatOverrides) => void;
  onMembership: (v: boolean) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  officialUrl?: string | null;
  editOpen: boolean;
  setEditOpen: (v: boolean) => void;
}) {
  const { d, num, locale } = useI18n();
  const className = overrides.className ?? snapshot.className;
  const meta = [className, snapshot.race, snapshot.serverName, snapshot.region ? getRegion(snapshot.region).label : null]
    .filter(Boolean)
    .join(" · ");
  const dash = "—";

  return (
    <section className="rounded-2xl border border-line bg-surface/90 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
          <Avatar src={snapshot.profileImage} name={snapshot.name} />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{snapshot.name}</h1>
            {meta && <p className="mt-0.5 text-sm leading-snug text-muted">{meta}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
              {snapshot.source === "manual" ? (
                <Badge tone="warn">{d.header.manualBadge}</Badge>
              ) : (
                <span className="whitespace-nowrap">
                  {d.header.updated}:{" "}
                  {new Date(snapshot.fetchedAt).toLocaleString(locale === "es" ? "es-AR" : "en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              )}
              {officialUrl && (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="whitespace-nowrap underline decoration-dotted hover:text-muted"
                >
                  {d.header.official} ↗
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 *:flex-1 sm:*:flex-none">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm font-medium hover:border-gold/50 disabled:opacity-60 sm:py-2"
            >
              {refreshing ? <Spinner /> : "↻"} {d.header.refresh}
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(!editOpen)}
            aria-expanded={editOpen}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm font-medium hover:border-gold/50 sm:py-2"
          >
            ✎ {d.header.edit}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
        <Stat label={d.header.level} value={level !== null ? String(level) : dash} overridden={overrides.level !== undefined} />
        <Stat label={d.header.gs} value={gs !== null ? num(gs) : dash} overridden={overrides.gs !== undefined} />
        <Stat label={d.header.cp} value={cp !== null ? num(cp) : dash} overridden={overrides.cp !== undefined} />
      </div>

      {editOpen && (
        <StatEditor
          key={JSON.stringify(overrides)}
          initial={{
            level: overrides.level ?? snapshot.level ?? undefined,
            gs: overrides.gs ?? snapshot.itemLevel ?? undefined,
            cp: overrides.cp ?? snapshot.combatPower ?? undefined,
          }}
          snapshot={snapshot}
          membership={membership}
          onMembership={onMembership}
          onSave={(o) => {
            onSaveOverrides({ ...o, className: overrides.className });
            setEditOpen(false);
          }}
          onClear={snapshot.source === "plaync" ? () => onSaveOverrides({}) : undefined}
        />
      )}
    </section>
  );
}

function StatEditor({
  initial,
  snapshot,
  membership,
  onMembership,
  onSave,
  onClear,
}: {
  initial: { level?: number; gs?: number; cp?: number };
  snapshot: CharacterSnapshot;
  membership: boolean;
  onMembership: (v: boolean) => void;
  onSave: (o: StatOverrides) => void;
  onClear?: () => void;
}) {
  const { d } = useI18n();
  const [level, setLevel] = useState(initial.level?.toString() ?? "");
  const [gs, setGs] = useState(initial.gs?.toString() ?? "");
  const [cp, setCp] = useState(initial.cp?.toString() ?? "");

  const parse = (v: string) => {
    const n = Number(v.replace(/[.,\s]/g, ""));
    return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Solo guardamos como override lo que difiere del dato oficial.
    const o: StatOverrides = {};
    const lv = parse(level);
    const g = parse(gs);
    const c = parse(cp);
    if (lv !== undefined && lv !== snapshot.level) o.level = Math.min(lv, 99);
    if (g !== undefined && g !== snapshot.itemLevel) o.gs = g;
    if (c !== undefined && c !== snapshot.combatPower) o.cp = c;
    onSave(o);
  };

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink tabular-nums focus:border-gold/60 focus:outline-none";

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-line bg-surface-2/50 p-3">
      <p className="font-medium">{d.header.editTitle}</p>
      <p className="mb-3 text-sm text-muted">{d.header.editHint}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="text-sm text-muted">
          {d.manual.level}
          <input inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} className={input} />
        </label>
        <label className="text-sm text-muted">
          {d.manual.gs}
          <input inputMode="numeric" value={gs} onChange={(e) => setGs(e.target.value)} className={input} />
        </label>
        <label className="text-sm text-muted">
          {d.manual.cp}
          <input inputMode="numeric" value={cp} onChange={(e) => setCp(e.target.value)} className={input} />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={membership}
          onChange={(e) => onMembership(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-gold)]"
        />
        {d.header.membership}
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black hover:brightness-110">
          {d.header.save}
        </button>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted hover:text-ink"
          >
            {d.header.clear}
          </button>
        )}
      </div>
    </form>
  );
}

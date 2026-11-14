"use client";

import { UPGRADE_ORDER } from "@/data/gear";
import { useI18n } from "@/i18n/I18nProvider";
import type { Dashboard, GearAdvice, UnlockedItem, UpcomingUnlock } from "@/lib/engine/types";
import type { RegionId } from "@/lib/regions";
import { nextArtifactSiege, nextShugoFestival, nextSpacetimeRift, type Occurrence } from "@/lib/time/events";
import { formatDuration } from "@/lib/time/resets";
import { Badge, Card, ConfidenceBadge, ProgressBar, SourceLinks } from "../ui";

// ─────────────────────────────── Fase ───────────────────────────────

export function PhaseCard({ dash }: { dash: Dashboard }) {
  const { d, l, fmt, num } = useI18n();
  const { phase, progress, nextPhase } = dash;
  const isLeveling = phase.id === "leveling";
  return (
    <Card className="border-gold/30 bg-gradient-to-br from-gold-soft/60 to-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold/80">{d.phase.current}</p>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{l(phase.name)}</h2>
        </div>
        {nextPhase && (
          <p className="text-sm text-muted">
            {d.phase.next}: <span className="text-ink">{l(nextPhase.short)}</span>
          </p>
        )}
      </div>

      {progress && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted">
              {d.phase.goal}: <span className="font-medium text-ink">{l(phase.goal)}</span>
            </span>
            <span className="font-semibold text-gold">
              {progress.gap > 0
                ? fmt(d.phase.toGo, { gap: num(progress.gap), unit: isLeveling ? d.phase.levelUnit : d.phase.gsUnit })
                : d.phase.reached}
            </span>
          </div>
          <ProgressBar pct={progress.pct} />
          <div className="mt-1 flex justify-between text-xs text-faint">
            <span>{num(progress.from)}</span>
            <span>{num(progress.to)}</span>
          </div>
        </div>
      )}

      <h3 className="mt-4 text-sm font-semibold text-ink">{d.phase.focus}</h3>
      <ul className="mt-1.5 space-y-1.5 text-sm text-ink/90">
        {phase.focus.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-gold" aria-hidden>
              ➜
            </span>
            <span>{l(f)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ─────────────────────────── Ya desbloqueado ───────────────────────────

export function UnlockedPanel({
  items,
  onDoing,
}: {
  items: UnlockedItem[];
  onDoing: (activityId: string, tierId: string | null) => void;
}) {
  const { d, l, fmt } = useI18n();
  if (items.length === 0) return null;
  return (
    <Card title={d.unlocked.title} subtitle={d.unlocked.hint}>
      <ul className="space-y-2">
        {items.map((u) => {
          const status = u.canStepUp ? "up" : u.doingTier ? "ok" : "unset";
          return (
            <li
              key={u.activity.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                status === "up" ? "border-gold/50 bg-gold-soft/40" : status === "unset" ? "border-info/30 bg-info-soft/30" : "border-line bg-surface-2/50"
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium">{l(u.activity.name)}</p>
                <p className="text-sm text-muted">
                  {status === "up" ? (
                    <span className="font-semibold text-gold">{fmt(d.unlocked.stepUp, { tier: l(u.bestTier.label) })}</span>
                  ) : status === "ok" ? (
                    <span className="text-ok">✓ {d.unlocked.ok}</span>
                  ) : (
                    fmt(d.unlocked.best, { tier: l(u.bestTier.label) })
                  )}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                {d.unlocked.doing}
                <select
                  value={u.doingTier?.id ?? ""}
                  onChange={(e) => onDoing(u.activity.id, e.target.value || null)}
                  className="rounded-lg border border-line bg-surface px-2 py-1.5 text-ink"
                >
                  <option value="">{d.unlocked.notSet}</option>
                  {u.allTiers
                    .filter((t) => u.allTiers.indexOf(t) <= u.allTiers.indexOf(u.bestTier))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {l(t.label)}
                      </option>
                    ))}
                </select>
              </label>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ─────────────────────────── Próximos desbloqueos ───────────────────────────

export function UpcomingPanel({ groups }: { groups: UpcomingUnlock[] }) {
  const { d, l, fmt, num } = useI18n();
  return (
    <Card title={d.upcoming.title}>
      {groups.length === 0 ? (
        <p className="text-sm text-muted">{d.upcoming.none}</p>
      ) : (
        <ol className="relative space-y-3 border-l border-line pl-4">
          {groups.map((g) => (
            <li key={`${g.kind}-${g.threshold}`} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-gold bg-bg" aria-hidden />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-gold">
                  {g.kind === "gs" ? fmt(d.upcoming.gs, { n: num(g.threshold) }) : fmt(d.upcoming.level, { n: g.threshold })}
                </span>
                <span className="text-xs text-faint">{fmt(d.upcoming.gap, { gap: num(g.gap) })}</span>
              </div>
              <ul className="mt-1 space-y-0.5 text-sm text-ink/90">
                {g.entries.map((e) => (
                  <li key={`${e.activity.id}-${e.tier?.id ?? "base"}`} className="flex flex-wrap items-center gap-1.5">
                    <span>
                      {l(e.activity.name)}
                      {e.tier && <span className="text-muted">: {l(e.tier.label)}</span>}
                    </span>
                    {e.tier?.disabled && <Badge tone="bad">{d.task.disabled}</Badge>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ─────────────────────────────── Equipo ───────────────────────────────

export function GearPanel({ advice, hasEquipment }: { advice: GearAdvice[]; hasEquipment: boolean }) {
  const { d, l } = useI18n();
  if (advice.length === 0) return null;
  return (
    <Card title={d.gear.title} subtitle={hasEquipment ? undefined : d.gear.noEquip}>
      <ul className="space-y-3">
        {advice.map((g) => (
          <li key={g.id} className="rounded-xl border border-line bg-surface-2/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <p className="font-medium">{l(g.title)}</p>
              <ConfidenceBadge confidence={g.confidence} />
            </div>
            <p className="mt-1 text-sm text-muted">{l(g.body)}</p>
            {g.pieces && g.pieces.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {g.pieces.map((p, i) => (
                  <li key={`${p.slot}-${i}`}>
                    <Badge tone="warn" title={p.name ?? undefined}>
                      {p.slot} · {p.value}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {g.id === "order" && (
              <ol className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {UPGRADE_ORDER.map((o, i) => (
                  <li key={i}>
                    <Badge>
                      {i + 1}. {l(o)}
                    </Badge>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ul>
      <SourceLinks ids={["fextralife-enhance", "skycoach-gs", "allthings-cp"]} />
    </Card>
  );
}

// ─────────────────────────────── Eventos ───────────────────────────────

function EventRow({ name, occ, now, verify }: { name: string; occ: Occurrence; now: Date; verify?: boolean }) {
  const { d, fmt, locale } = useI18n();
  const time = occ.start.toLocaleString(locale === "es" ? "es-AR" : "en-US", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-medium">
          {name}
          {verify && (
            <Badge tone="warn" title={d.events.verify}>
              ⚠
            </Badge>
          )}
        </p>
        <p className="text-xs text-faint">{fmt(d.events.at, { time })}</p>
      </div>
      {occ.active ? (
        <Badge tone="ok">{d.events.now}</Badge>
      ) : (
        <span className="text-sm text-muted">{fmt(d.events.in, { time: formatDuration(occ.start.getTime() - now.getTime()) })}</span>
      )}
    </li>
  );
}

export function EventsPanel({
  now,
  region,
  show,
}: {
  now: Date;
  region: RegionId;
  show: { shugo: boolean; rift: boolean; siege: boolean };
}) {
  const { d } = useI18n();
  if (!show.shugo && !show.rift && !show.siege) return null;
  return (
    <Card title={d.events.title}>
      <ul className="divide-y divide-line">
        {show.shugo && <EventRow name={d.events.shugo} occ={nextShugoFestival(now)} now={now} />}
        {show.rift && <EventRow name={d.events.rift} occ={nextSpacetimeRift(now)} now={now} verify />}
        {show.siege && <EventRow name={d.events.siege} occ={nextArtifactSiege(now, region)} now={now} verify />}
      </ul>
      <SourceLinks ids={["shugo-timers", "allthings-rift", "metabot-siege"]} />
    </Card>
  );
}

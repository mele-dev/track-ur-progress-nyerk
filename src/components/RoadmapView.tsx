"use client";

import { ACTIVITIES } from "@/data/activities";
import { PHASES } from "@/data/phases";
import { SOURCES, type SourceId } from "@/data/sources";
import type { Activity, Tier } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import { Badge, Card, ConfidenceBadge, SourceLinks } from "./ui";

interface Rung {
  gs: number;
  entries: { activity: Activity; tier: Tier | null }[];
}

/** Escalera de GS armada a partir del catálogo de actividades. */
function buildLadder(): Rung[] {
  const map = new Map<number, Rung>();
  const add = (gs: number, activity: Activity, tier: Tier | null) => {
    const rung = map.get(gs) ?? { gs, entries: [] };
    rung.entries.push({ activity, tier });
    map.set(gs, rung);
  };
  for (const a of ACTIVITIES) {
    if (a.tiers?.some((t) => t.gs !== undefined)) {
      for (const t of a.tiers) if (t.gs !== undefined) add(t.gs, a, t);
    } else if (a.unlock.gs !== undefined) {
      add(a.unlock.gs, a, null);
    }
  }
  return [...map.values()].sort((x, y) => x.gs - y.gs);
}

const LADDER = buildLadder();

export function RoadmapView() {
  const { d, l, num } = useI18n();
  const categoryLabel = { daily: d.roadmap.daily, weekly: d.roadmap.weekly, once: d.roadmap.oneTime };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{d.roadmap.title}</h1>
        <p className="mt-1 max-w-3xl text-muted">{d.roadmap.intro}</p>
        <p className="mt-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">⚠ {d.roadmap.disclaimer}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {PHASES.map((p) => (
          <Card
            key={p.id}
            title={l(p.name)}
            subtitle={`${d.phase.goal}: ${l(p.goal)}`}
          >
            <ul className="space-y-1.5 text-sm text-ink/90">
              {p.focus.map((f, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gold" aria-hidden>
                    ➜
                  </span>
                  <span>{l(f)}</span>
                </li>
              ))}
            </ul>
            <SourceLinks ids={p.sources} />
          </Card>
        ))}
      </div>

      <Card title={d.roadmap.ladder}>
        <ol className="divide-y divide-line/60">
          {LADDER.map((r) => (
            <li key={r.gs} className="flex gap-3 py-2.5 sm:gap-4">
              <span className="w-14 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-gold sm:w-16">{num(r.gs)}</span>
              <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {r.entries.map((e) => (
                  <li key={`${e.activity.id}-${e.tier?.id ?? "base"}`} className="min-w-0">
                    <Badge tone={e.tier?.disabled ? "bad" : "neutral"}>
                      <span className="whitespace-normal">
                        {l(e.activity.name)}
                        {e.tier ? `: ${l(e.tier.label)}` : ""}
                        {e.tier?.disabled ? ` (${d.task.disabled})` : ""}
                      </span>
                    </Badge>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Card>

      <Card title={d.roadmap.activities}>
        <ul className="grid gap-3 md:grid-cols-2">
          {ACTIVITIES.map((a) => (
            <li key={a.id} className="rounded-xl border border-line bg-surface-2/50 p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="font-medium">{l(a.name)}</p>
                <Badge>{categoryLabel[a.category]}</Badge>
                {a.unlock.level !== undefined && <Badge>{`${d.header.level} ${a.unlock.level}`}</Badge>}
                {a.unlock.gs !== undefined && <Badge tone="gold">{`${num(a.unlock.gs)} GS`}</Badge>}
                <ConfidenceBadge confidence={a.confidence} />
              </div>
              <p className="mt-1 text-sm text-muted">{l(a.summary)}</p>
              <p className="mt-1 text-sm text-ink/90">💡 {l(a.tip)}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={d.roadmap.sources}>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {(Object.keys(SOURCES) as SourceId[]).map((id) => (
            <li key={id}>
              <a href={SOURCES[id].url} target="_blank" rel="noreferrer" className="text-muted underline decoration-dotted hover:text-ink">
                {SOURCES[id].title}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

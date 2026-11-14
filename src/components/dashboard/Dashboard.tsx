"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { buildDashboard, MAX_LEVEL } from "@/lib/engine/recommend";
import type { CharacterSnapshot } from "@/lib/plaync/types";
import { nextDailyReset, nextWeeklyReset, formatDuration } from "@/lib/time/resets";
import { useProgress } from "@/lib/useProgress";
import { Card, Spinner } from "../ui";
import { CharacterHeader } from "./CharacterHeader";
import { EventsPanel, GearPanel, PhaseCard, UnlockedPanel, UpcomingPanel } from "./Panels";
import { TaskList } from "./TaskList";

export function Dashboard({
  charKey,
  snapshot,
  onRefresh,
  refreshing,
  officialUrl,
}: {
  charKey: string;
  snapshot: CharacterSnapshot;
  onRefresh?: () => void;
  refreshing?: boolean;
  officialUrl?: string | null;
}) {
  const { d, fmt } = useI18n();
  const { progress, now, toggle, setDoing, setOverrides, setMembership } = useProgress(charKey);
  const [editOpen, setEditOpen] = useState(false);

  const level = progress?.overrides.level ?? snapshot.level;
  const gs = progress?.overrides.gs ?? snapshot.itemLevel;
  const cp = progress?.overrides.cp ?? snapshot.combatPower;

  const dash = useMemo(
    () =>
      progress
        ? buildDashboard({ level, gs, cp, equipment: snapshot.equipment }, progress, now)
        : null,
    [progress, level, gs, cp, snapshot.equipment, now],
  );

  if (!progress || !dash) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Spinner /> {d.loading}
      </div>
    );
  }

  const effLevel = level ?? (gs ? MAX_LEVEL : 1);
  const effGs = gs ?? 0;
  const membership = progress.settings.membership;
  const lastDay = dash.hoursToWeekly <= 24;
  const all = [...dash.today, ...dash.week];
  const hasEvent = (id: string) => all.some((t) => t.activity.id === id);
  // Durante el leveo lo principal es contenido de una sola vez (historia, Ascension): va en la columna principal.
  const leveling = dash.phase.id === "leveling";
  const onceCard =
    dash.once.length > 0 ? (
      <Card title={`✔ ${d.once.title}`} subtitle={d.once.hint}>
        <TaskList
          items={dash.once}
          onToggle={(id) => toggle("once", id)}
          membership={membership}
          level={effLevel}
          gs={effGs}
          empty=""
        />
      </Card>
    ) : null;

  return (
    <div className="space-y-4">
      <CharacterHeader
        snapshot={snapshot}
        level={level}
        gs={gs}
        cp={cp}
        overrides={progress.overrides}
        membership={membership}
        onSaveOverrides={setOverrides}
        onMembership={setMembership}
        onRefresh={onRefresh}
        refreshing={refreshing}
        officialUrl={officialUrl}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
      />

      {dash.missing.length > 0 && !editOpen && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn">
          <span>
            {fmt(d.header.missing, {
              field: dash.missing.map((m) => (m === "gs" ? "GS" : d.header.level.toLowerCase())).join(" / "),
            })}
          </span>
          <button type="button" onClick={() => setEditOpen(true)} className="font-semibold underline">
            {d.header.missingCta}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <PhaseCard dash={dash} />
          {leveling && onceCard}

          <Card
            title={`☀ ${d.today.title}`}
            right={<span className="text-sm text-muted">{fmt(d.today.reset, { time: formatDuration(nextDailyReset(now).getTime() - now.getTime()) })}</span>}
          >
            <TaskList
              items={dash.today}
              onToggle={(id) => toggle("daily", id)}
              membership={membership}
              level={effLevel}
              gs={effGs}
              empty={d.today.empty}
            />
          </Card>

          {(dash.week.length > 0 || effLevel >= MAX_LEVEL) && (
            <Card
              title={`📅 ${d.week.title}`}
              subtitle={lastDay ? <span className="font-semibold text-warn">{d.week.lastDay}</span> : undefined}
              right={
                <span className="text-sm text-muted">
                  {fmt(d.week.reset, { time: formatDuration(nextWeeklyReset(now).getTime() - now.getTime()) })}
                </span>
              }
            >
              <TaskList
                items={dash.week}
                onToggle={(id) => toggle("weekly", id)}
                membership={membership}
                level={effLevel}
                gs={effGs}
                empty={d.week.empty}
              />
            </Card>
          )}

          <UnlockedPanel items={dash.unlocked} onDoing={setDoing} />
          <GearPanel advice={dash.gear} hasEquipment={!!snapshot.equipment?.length} />
        </div>

        <div className="min-w-0 space-y-4">
          <UpcomingPanel groups={dash.upcoming} />
          <EventsPanel
            now={now}
            region={snapshot.region ?? "nae"}
            show={{
              shugo: hasEvent("shugo-festival"),
              rift: hasEvent("spacetime-rift"),
              siege: hasEvent("artifact-siege"),
            }}
          />
          {!leveling && onceCard}
        </div>
      </div>
    </div>
  );
}

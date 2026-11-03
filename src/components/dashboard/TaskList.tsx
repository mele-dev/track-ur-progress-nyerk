"use client";

import { useState } from "react";
import type { Activity } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import { disabledReason, MEMBERSHIP_ODYLE_CAP } from "@/lib/engine/recommend";
import type { TaskItem } from "@/lib/engine/types";
import { perDay } from "@/lib/time/resets";
import { Badge, ConfidenceBadge, SourceLinks } from "../ui";

function useCadenceText() {
  const { d, l, fmt, num } = useI18n();
  return (a: Activity, membership: boolean): string | null => {
    const c = a.cadence;
    if (c.kind === "recharge") {
      const cap = a.id === "odyle-energy" && membership ? MEMBERSHIP_ODYLE_CAP : c.cap;
      return fmt(d.task.perDay, { n: num(perDay(c) ?? 0), unit: l(c.unit), cap: num(cap) });
    }
    if ((c.kind === "daily" || c.kind === "weekly") && (c.count || c.note)) {
      const parts: string[] = [];
      if (c.count) parts.push(fmt(d.task.count, { n: c.count, period: c.kind === "daily" ? d.task.day : d.task.weekWord }));
      if (c.note) parts.push(l(c.note));
      return parts.join(" · ");
    }
    if (c.kind === "event") return d.task.schedule[c.schedule];
    return null;
  };
}

export function TaskRow({
  item,
  onToggle,
  membership,
  level,
  gs,
  lastDay,
}: {
  item: TaskItem;
  onToggle: () => void;
  membership: boolean;
  level: number;
  gs: number;
  lastDay?: boolean;
}) {
  const { d, l, fmt, num } = useI18n();
  const [open, setOpen] = useState(false);
  const cadenceText = useCadenceText();
  const a = item.activity;
  const disabled = disabledReason(a, level, gs);
  const cadence = cadenceText(a, membership);
  const checkboxId = `task-${a.category}-${a.id}`;
  // Solo avisamos "se pierde" cuando es urgente: contador que se llena rápido o último día de la semana.
  const urgent =
    !!a.wasteIfSkipped && !item.done && !disabled && ((item.fillDays !== null && item.fillDays <= 5) || (a.category === "weekly" && !!lastDay));

  return (
    <li
      className={`rounded-xl border px-3 py-3 transition-colors ${
        item.done ? "border-line/60 bg-surface/40" : disabled ? "border-line/60 bg-surface/40" : "border-line bg-surface-2/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={item.done}
          disabled={!!disabled}
          onChange={onToggle}
          className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded-md accent-[var(--color-ok)] disabled:cursor-not-allowed disabled:opacity-30"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <label
              htmlFor={checkboxId}
              className={`cursor-pointer font-medium leading-snug ${item.done ? "text-faint line-through" : disabled ? "text-faint" : "text-ink"}`}
            >
              {l(a.name)}
            </label>
            {item.boosted && !item.done && !disabled && (
              <Badge tone="gold" title={d.task.priority}>
                ★ <span className="hidden sm:inline">{d.task.priority}</span>
              </Badge>
            )}
            {urgent && <Badge tone="info">{d.task.waste}</Badge>}
            {disabled && <Badge tone="bad">{d.task.disabled}</Badge>}
            <ConfidenceBadge confidence={a.confidence} />
          </div>

          {!item.done && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
              {item.bestTier && a.category !== "once" && (
                <Badge tone="ok">{fmt(d.task.best, { tier: l(item.bestTier.label) })}</Badge>
              )}
              {item.nextTier && (
                <Badge>
                  {item.nextTier.level !== undefined && item.nextTier.level > level
                    ? fmt(d.task.nextLevel, { tier: l(item.nextTier.label), level: item.nextTier.level })
                    : fmt(d.task.next, { tier: l(item.nextTier.label), gs: num(item.nextTier.gs ?? 0) })}
                </Badge>
              )}
              {cadence && <span className="text-muted">{cadence}</span>}
              {item.fillDays !== null && (
                <span className="text-faint">· {fmt(d.task.fill, { days: num(item.fillDays) })}</span>
              )}
            </div>
          )}

          {disabled && <p className="mt-1 text-sm text-bad/90">{l(disabled)}</p>}

          {open && (
            <div className="mt-2 space-y-1.5 text-sm text-muted">
              <p>{l(a.summary)}</p>
              {a.wasteIfSkipped && <p className="text-info">↻ {d.task.wasteLong}</p>}
              <p className="text-ink/90">💡 {l(a.tip)}</p>
              {a.confidence === "disputed" && <p className="text-warn">⚠ {d.confidence.disputed}</p>}
              <SourceLinks ids={a.sources} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-1.5 text-xs font-medium text-faint hover:text-muted"
            aria-expanded={open}
          >
            {open ? `▲ ${d.task.less}` : `▼ ${d.task.more}`}
          </button>
        </div>
      </div>
    </li>
  );
}

export function TaskList({
  items,
  onToggle,
  membership,
  level,
  gs,
  empty,
  lastDay,
}: {
  items: TaskItem[];
  onToggle: (id: string) => void;
  membership: boolean;
  level: number;
  gs: number;
  empty: string;
  lastDay?: boolean;
}) {
  if (items.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <TaskRow
          key={item.activity.id}
          item={item}
          onToggle={() => onToggle(item.activity.id)}
          membership={membership}
          level={level}
          gs={gs}
          lastDay={lastDay}
        />
      ))}
    </ul>
  );
}

/**
 * Motor de recomendaciones: dado un personaje (nivel, GS, CP, equipo) y lo que
 * ya marcó el usuario, arma el dashboard de "qué te conviene hacer".
 * Es una función pura (sin DOM ni red) para poder testearla.
 */
import { ACTIVITIES } from "@/data/activities";
import { GEAR_RULES, SAFE_ENHANCE } from "@/data/gear";
import { PHASES } from "@/data/phases";
import type { Activity, Phase, Tier } from "@/data/types";
import type { ProgressState } from "@/lib/storage/progress";
import { daysToFill, nextWeeklyReset } from "@/lib/time/resets";
import { nextPhaseOf, phaseProgress, resolvePhase } from "./phases";
import type {
  Dashboard,
  GearAdvice,
  ProfileInput,
  TaskItem,
  UnlockedItem,
  UpcomingEntry,
  UpcomingUnlock,
} from "./types";

export const MAX_LEVEL = 45;
export const MEMBERSHIP_ODYLE_CAP = 840;

export function tierAvailable(t: Tier, level: number, gs: number): boolean {
  return level >= (t.level ?? 0) && gs >= (t.gs ?? 0);
}

export function isRelevant(a: Activity, level: number, gs: number): boolean {
  if (a.maxLevel !== undefined && level > a.maxLevel) return false;
  if (a.hideFromGs !== undefined && gs >= a.hideFromGs) return false;
  return true;
}

export function isUnlocked(a: Activity, level: number, gs: number): boolean {
  return level >= (a.unlock.level ?? 0) && gs >= (a.unlock.gs ?? 0);
}

/** Tier más alto disponible que no esté desactivado. */
export function bestTierOf(a: Activity, level: number, gs: number): Tier | null {
  if (!a.tiers) return null;
  let best: Tier | null = null;
  for (const t of a.tiers) {
    if (tierAvailable(t, level, gs) && !t.disabled) best = t;
  }
  return best;
}

export function nextTierOf(a: Activity, level: number, gs: number): Tier | null {
  return a.tiers?.find((t) => !tierAvailable(t, level, gs)) ?? null;
}

/** Si todos los tiers disponibles están desactivados, la actividad no se puede hacer hoy. */
export function disabledReason(a: Activity, level: number, gs: number) {
  if (a.disabled) return a.disabled;
  if (!a.tiers) return null;
  const available = a.tiers.filter((t) => tierAvailable(t, level, gs));
  if (available.length > 0 && available.every((t) => t.disabled)) return available[available.length - 1].disabled!;
  return null;
}

function buildTask(
  a: Activity,
  level: number,
  gs: number,
  phase: Phase,
  done: boolean,
  membership: boolean,
  hoursToWeekly: number,
): TaskItem {
  const boosted = phase.boost.includes(a.id);
  const capOverride = a.id === "odyle-energy" && membership ? MEMBERSHIP_ODYLE_CAP : undefined;
  const fillDays = daysToFill(a.cadence, capOverride);

  let score = a.priority;
  if (boosted) score += 15;
  if (a.wasteIfSkipped) score += 8;
  if (fillDays !== null && fillDays <= 5) score += 6;
  if (a.category === "weekly" && a.wasteIfSkipped && hoursToWeekly <= 24) score += 25;
  if (disabledReason(a, level, gs)) score -= 2000;
  if (done) score -= 1000;

  return {
    activity: a,
    done,
    bestTier: bestTierOf(a, level, gs),
    nextTier: nextTierOf(a, level, gs),
    boosted,
    fillDays,
    score,
  };
}

function sortTasks(list: TaskItem[]): TaskItem[] {
  return [...list].sort((x, y) => y.score - x.score);
}

/** Próximos desbloqueos agrupados por umbral (nivel durante el leveo, GS después). */
export function upcomingUnlocks(level: number, gs: number, limit = 4): UpcomingUnlock[] {
  const groups = new Map<string, UpcomingUnlock>();
  const add = (kind: "gs" | "level", threshold: number, entry: UpcomingEntry) => {
    const key = `${kind}:${threshold}`;
    const g =
      groups.get(key) ??
      ({ kind, threshold, gap: threshold - (kind === "gs" ? gs : level), entries: [] } as UpcomingUnlock);
    g.entries.push(entry);
    groups.set(key, g);
  };

  for (const a of ACTIVITIES) {
    if (!isRelevant(a, level, gs) || a.disabled) continue;
    const needLevel = a.unlock.level ?? 0;
    if (needLevel > level) {
      // Solo lo que vas a poder hacer al llegar a ese nivel con tu GS actual.
      if ((a.unlock.gs ?? 0) <= gs) add("level", needLevel, { activity: a, tier: null });
      continue;
    }
    if (a.tiers) {
      for (const t of a.tiers) {
        if (tierAvailable(t, level, gs)) continue;
        if ((t.level ?? 0) > level) add("level", t.level!, { activity: a, tier: t });
        else if ((t.gs ?? 0) > gs) add("gs", t.gs!, { activity: a, tier: t });
      }
    } else if ((a.unlock.gs ?? 0) > gs) {
      add("gs", a.unlock.gs!, { activity: a, tier: null });
    }
  }

  return [...groups.values()]
    .sort((x, y) => (x.kind === y.kind ? x.threshold - y.threshold : x.kind === "level" ? -1 : 1))
    .slice(0, limit);
}

export function gearAdvice(profile: ProfileInput, phase: Phase, gs: number): GearAdvice[] {
  const out: GearAdvice[] = [];
  const pieces = profile.equipment ?? [];

  const belowSafe = pieces.filter((p) => p.enhance !== null && p.enhance < SAFE_ENHANCE);
  if (belowSafe.length > 0) {
    out.push({
      id: "pieces-below-10",
      title: { es: "Subí a +10 estas piezas (no puede fallar)", en: "Take these pieces to +10 (can't fail)" },
      body: {
        es: "Hasta +10 el enhance es seguro en Epic y Unique. Es el GS más barato que tenés.",
        en: "Up to +10 enhancing is safe on Epic and Unique. It's the cheapest GS you have.",
      },
      pieces: belowSafe.map((p) => ({ slot: p.slot, name: p.name, value: `+${p.enhance}` })),
      confidence: "ok",
    });
  }

  if (phase.pieceIlvl !== undefined) {
    const target = phase.pieceIlvl;
    const low = pieces.filter((p) => p.itemLevel !== null && p.itemLevel < target);
    if (low.length > 0) {
      out.push({
        id: "pieces-low-ilvl",
        title: {
          es: `Piezas por debajo del nivel ${target} recomendado para tu fase`,
          en: `Pieces below the level ${target} recommended for your phase`,
        },
        body: {
          es: "Reemplazalas con drops de las Expeditions de tu tier antes de invertir en ellas.",
          en: "Replace them with drops from your tier's Expeditions before investing in them.",
        },
        pieces: low.map((p) => ({ slot: p.slot, name: p.name, value: `ilvl ${p.itemLevel}` })),
        confidence: "disputed",
      });
    }
  }

  for (const rule of GEAR_RULES) {
    if ((rule.fromGs ?? 0) > gs) continue;
    out.push({ id: rule.id, title: rule.title, body: rule.body, confidence: rule.confidence });
  }
  return out;
}

export function buildDashboard(profile: ProfileInput, progress: ProgressState, now: Date): Dashboard {
  const missing: Dashboard["missing"] = [];
  if (profile.level === null) missing.push("level");
  if (profile.gs === null) missing.push("gs");

  const gs = profile.gs ?? 0;
  const level = profile.level ?? (gs > 0 ? MAX_LEVEL : 1);
  const membership = progress.settings.membership;
  const hoursToWeekly = (nextWeeklyReset(now).getTime() - now.getTime()) / 3_600_000;

  const phase = resolvePhase(level, gs, PHASES);
  const available = ACTIVITIES.filter((a) => isRelevant(a, level, gs) && isUnlocked(a, level, gs));

  const task = (a: Activity, done: boolean) => buildTask(a, level, gs, phase, done, membership, hoursToWeekly);

  const today = sortTasks(
    available.filter((a) => a.category === "daily").map((a) => task(a, !!progress.daily.done[a.id])),
  );
  const week = sortTasks(
    available.filter((a) => a.category === "weekly").map((a) => task(a, !!progress.weekly.done[a.id])),
  );
  const once = sortTasks(available.filter((a) => a.category === "once").map((a) => task(a, !!progress.once[a.id])));

  const unlocked: UnlockedItem[] = [];
  for (const a of available) {
    if (!a.tiers || a.category === "once" || a.hideTierPicker) continue;
    const best = bestTierOf(a, level, gs);
    if (!best) continue;
    const tiers = a.tiers;
    const doingTier = tiers.find((t) => t.id === progress.doing[a.id]) ?? null;
    const canStepUp = doingTier !== null && tiers.indexOf(doingTier) < tiers.indexOf(best);
    unlocked.push({ activity: a, bestTier: best, doingTier, canStepUp, allTiers: tiers });
  }
  // Primero lo que podés mejorar o todavía no marcaste.
  unlocked.sort((x, y) => Number(y.canStepUp || !y.doingTier) - Number(x.canStepUp || !x.doingTier));

  return {
    phase,
    nextPhase: nextPhaseOf(phase, PHASES),
    progress: phaseProgress(phase, level, gs),
    today,
    week,
    once,
    unlocked,
    upcoming: upcomingUnlocks(level, gs),
    gear: level >= MAX_LEVEL ? gearAdvice(profile, phase, gs) : [],
    missing,
    hoursToWeekly,
  };
}

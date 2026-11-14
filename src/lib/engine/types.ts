import type { Activity, Confidence, L10n, Phase, Tier } from "@/data/types";
import type { EquipmentPiece } from "@/lib/plaync/types";

export interface ProfileInput {
  level: number | null;
  /** Gear Score / Item Level. */
  gs: number | null;
  cp: number | null;
  equipment: EquipmentPiece[] | null;
}

export interface TaskItem {
  activity: Activity;
  done: boolean;
  /** Tier más alto disponible (si la actividad tiene tiers). */
  bestTier: Tier | null;
  /** Siguiente tier bloqueado. */
  nextTier: Tier | null;
  /** Prioridad de la fase actual. */
  boosted: boolean;
  /** Días para que el contador se llene (actividades con recarga). */
  fillDays: number | null;
  score: number;
}

export interface UnlockedItem {
  activity: Activity;
  bestTier: Tier;
  /** Tier que el usuario dijo que hace (null = no lo marcó). */
  doingTier: Tier | null;
  /** Puede hacer un tier más alto que el que marcó. */
  canStepUp: boolean;
  allTiers: Tier[];
}

export interface UpcomingEntry {
  activity: Activity;
  tier: Tier | null;
}

export interface UpcomingUnlock {
  kind: "gs" | "level";
  threshold: number;
  gap: number;
  entries: UpcomingEntry[];
}

export interface GearAdvice {
  id: string;
  title: L10n;
  body: L10n;
  /** Piezas involucradas (si vienen de la API). */
  pieces?: { slot: string; name: string | null; value: string }[];
  confidence: Confidence;
}

export interface PhaseProgress {
  from: number;
  to: number;
  current: number;
  pct: number;
  gap: number;
}

export interface Dashboard {
  phase: Phase;
  nextPhase: Phase | null;
  progress: PhaseProgress | null;
  today: TaskItem[];
  week: TaskItem[];
  once: TaskItem[];
  unlocked: UnlockedItem[];
  upcoming: UpcomingUnlock[];
  gear: GearAdvice[];
  /** Datos que faltan para dar recomendaciones completas. */
  missing: ("level" | "gs")[];
  /** Horas que faltan para el reset semanal. */
  hoursToWeekly: number;
}

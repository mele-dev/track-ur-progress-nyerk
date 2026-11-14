import type { SourceId } from "./sources";

export type Locale = "es" | "en";

/** Texto bilingüe. */
export interface L10n {
  es: string;
  en: string;
}

/** "ok" = las guías coinciden; "disputed" = las guías dan números distintos, verificar in-game. */
export type Confidence = "ok" | "disputed";

export type RewardTag =
  | "gear"
  | "enhance"
  | "daevanion"
  | "arcana"
  | "abyss"
  | "kinah"
  | "exp"
  | "stigma"
  | "pet"
  | "odyle"
  | "skill"
  | "accessory";

export type EventSchedule = "hourly" | "every3h" | "siege";

export type Cadence =
  /** Se resetea cada día (07:00 UTC). */
  | { kind: "daily"; count?: number; note?: L10n }
  /** Se resetea cada miércoles (07:00 UTC). */
  | { kind: "weekly"; count?: number; note?: L10n }
  /** Contador que se recarga solo y tiene tope: si llega al tope, perdés recargas. */
  | { kind: "recharge"; amount: number; everyHours: number; cap: number; unit: L10n }
  /** Contenido de una sola vez (o hasta completarlo). */
  | { kind: "once" }
  /** Evento con horario. */
  | { kind: "event"; schedule: EventSchedule };

export type Category = "daily" | "weekly" | "once";

export interface Unlock {
  level?: number;
  gs?: number;
}

export interface Tier {
  id: string;
  label: L10n;
  gs?: number;
  level?: number;
  /** Si está desactivado temporalmente en Global (ej. Ludra). */
  disabled?: L10n;
}

export interface Activity {
  id: string;
  name: L10n;
  category: Category;
  cadence: Cadence;
  /** Requisito mínimo para que aparezca como disponible. */
  unlock: Unlock;
  /** Solo relevante hasta este nivel (ej. misiones de historia). */
  maxLevel?: number;
  /** Se oculta a partir de este GS (ya no aporta). */
  hideFromGs?: number;
  /** No mostrar el selector de "qué dificultad hacés" (ej. tiers repetidos de otra actividad). */
  hideTierPicker?: boolean;
  /** Escalones de dificultad / dungeons que se desbloquean con más GS. */
  tiers?: Tier[];
  rewards: RewardTag[];
  /** Prioridad base 1–100. */
  priority: number;
  /** Qué es, en una línea. */
  summary: L10n;
  /** Consejo práctico. */
  tip: L10n;
  confidence: Confidence;
  /** Si no lo hacés, perdés valor (tope de recarga o entradas que no se acumulan). */
  wasteIfSkipped?: boolean;
  /** Motivo si está desactivado temporalmente. */
  disabled?: L10n;
  sources: SourceId[];
}

export interface Phase {
  id: string;
  /** Nombre corto, ej. "Tier 3". */
  short: L10n;
  name: L10n;
  /** El personaje está en esta fase si level >= minLevel y minGs <= gs < siguiente fase. */
  minLevel: number;
  minGs: number;
  /** GS objetivo para pasar a la siguiente fase. */
  targetGs?: number;
  goal: L10n;
  focus: L10n[];
  /** Actividades que tienen prioridad extra en esta fase. */
  boost: string[];
  /** Item level de pieza recomendado en esta fase (no es GS). */
  pieceIlvl?: number;
  sources: SourceId[];
}

export interface GearRule {
  id: string;
  title: L10n;
  body: L10n;
  /** Desde qué GS aplica. */
  fromGs?: number;
  confidence: Confidence;
  sources: SourceId[];
}

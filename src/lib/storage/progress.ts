/**
 * Progreso del usuario guardado en el navegador (localStorage), por personaje.
 * Los bloques diario y semanal guardan la "clave" del reset en el que se
 * marcaron: si el reset cambió, se vacían solos.
 */
import type { RegionId } from "@/lib/regions";
import { dailyResetKey, weeklyResetKey } from "@/lib/time/resets";

const PREFIX = "aion2tracker:v1:";
const RECENT_KEY = `${PREFIX}recent`;
const MAX_RECENT = 8;

export interface StatOverrides {
  level?: number;
  gs?: number;
  cp?: number;
  className?: string;
}

export interface ProgressState {
  v: 1;
  daily: { key: string; done: Record<string, boolean> };
  weekly: { key: string; done: Record<string, boolean> };
  /** Contenido de una sola vez: no se resetea. */
  once: Record<string, boolean>;
  /** Qué tier hace hoy el usuario en cada actividad escalonada (activityId → tierId). */
  doing: Record<string, string>;
  settings: { membership: boolean };
  overrides: StatOverrides;
}

export function emptyProgress(now: Date): ProgressState {
  return {
    v: 1,
    daily: { key: dailyResetKey(now), done: {} },
    weekly: { key: weeklyResetKey(now), done: {} },
    once: {},
    doing: {},
    settings: { membership: false },
    overrides: {},
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function boolMap(v: unknown): Record<string, boolean> {
  if (!isRecord(v)) return {};
  return Object.fromEntries(Object.entries(v).filter(([, b]) => typeof b === "boolean")) as Record<string, boolean>;
}

function strMap(v: unknown): Record<string, string> {
  if (!isRecord(v)) return {};
  return Object.fromEntries(Object.entries(v).filter(([, s]) => typeof s === "string")) as Record<string, string>;
}

function numOrUndef(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Valida datos guardados y aplica los resets que pasaron desde la última visita. */
export function normalizeProgress(raw: unknown, now: Date): ProgressState {
  const base = emptyProgress(now);
  if (!isRecord(raw) || raw.v !== 1) return base;

  const daily = isRecord(raw.daily) ? raw.daily : {};
  const weekly = isRecord(raw.weekly) ? raw.weekly : {};
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const overrides = isRecord(raw.overrides) ? raw.overrides : {};

  return {
    v: 1,
    daily: daily.key === base.daily.key ? { key: base.daily.key, done: boolMap(daily.done) } : base.daily,
    weekly: weekly.key === base.weekly.key ? { key: base.weekly.key, done: boolMap(weekly.done) } : base.weekly,
    once: boolMap(raw.once),
    doing: strMap(raw.doing),
    settings: { membership: settings.membership === true },
    overrides: {
      level: numOrUndef(overrides.level),
      gs: numOrUndef(overrides.gs),
      cp: numOrUndef(overrides.cp),
      className: typeof overrides.className === "string" ? overrides.className : undefined,
    },
  };
}

export function characterKey(region: RegionId, serverId: string, characterId: string): string {
  return `${region}:${serverId}:${characterId}`;
}

export function manualKey(name: string): string {
  return `manual:${name.trim().toLowerCase()}`;
}

export function loadProgress(charKey: string, now: Date): ProgressState {
  try {
    const raw = window.localStorage.getItem(PREFIX + charKey);
    return normalizeProgress(raw ? JSON.parse(raw) : null, now);
  } catch {
    return emptyProgress(now);
  }
}

export function saveProgress(charKey: string, state: ProgressState): void {
  try {
    window.localStorage.setItem(PREFIX + charKey, JSON.stringify(state));
  } catch {
    // Modo privado o storage lleno: el progreso queda solo en memoria.
  }
}

// ─────────────────────────── Personajes recientes ───────────────────────────

export interface RecentCharacter {
  key: string;
  name: string;
  /** Ruta interna del dashboard. */
  href: string;
  serverName?: string | null;
  className?: string | null;
  region?: RegionId | null;
  gs?: number | null;
  savedAt: string;
}

export function loadRecent(): RecentCharacter[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (r): r is RecentCharacter =>
        isRecord(r) && typeof r.key === "string" && typeof r.name === "string" && typeof r.href === "string",
    );
  } catch {
    return [];
  }
}

export function rememberCharacter(entry: RecentCharacter): void {
  try {
    const list = [entry, ...loadRecent().filter((r) => r.key !== entry.key)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // ignorar
  }
}

export function forgetCharacter(key: string): void {
  try {
    const list = loadRecent().filter((r) => r.key !== key);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // ignorar
  }
}

// ─────────────────────────────── Idioma ───────────────────────────────

const LOCALE_KEY = `${PREFIX}locale`;

export function loadLocale(): string | null {
  try {
    return window.localStorage.getItem(LOCALE_KEY);
  } catch {
    return null;
  }
}

export function saveLocale(locale: string): void {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // ignorar
  }
}

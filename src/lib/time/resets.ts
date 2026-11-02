import type { Cadence } from "@/data/types";

/** Reset diario de AION 2 Global: 07:00 UTC (02:00 NY / 23:00 LA / 08:00 Berlín / 04:00 São Paulo en invierno). */
export const DAILY_RESET_UTC_HOUR = 7;
/** Reset semanal: miércoles (0 = domingo). */
export const WEEKLY_RESET_UTC_DAY = 3;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Último reset diario en o antes de `now`. */
export function lastDailyReset(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DAILY_RESET_UTC_HOUR),
  );
  if (d.getTime() > now.getTime()) d.setTime(d.getTime() - DAY);
  return d;
}

export function nextDailyReset(now: Date): Date {
  return new Date(lastDailyReset(now).getTime() + DAY);
}

/** Último reset semanal (miércoles 07:00 UTC) en o antes de `now`. */
export function lastWeeklyReset(now: Date): Date {
  const daily = lastDailyReset(now);
  const diff = (daily.getUTCDay() - WEEKLY_RESET_UTC_DAY + 7) % 7;
  return new Date(daily.getTime() - diff * DAY);
}

export function nextWeeklyReset(now: Date): Date {
  return new Date(lastWeeklyReset(now).getTime() + 7 * DAY);
}

/** Clave que cambia en cada reset diario (sirve para expirar checklists). */
export function dailyResetKey(now: Date): string {
  return lastDailyReset(now).toISOString();
}

export function weeklyResetKey(now: Date): string {
  return lastWeeklyReset(now).toISOString();
}

/** Días que tarda un contador en llenarse desde 0 hasta el tope. */
export function daysToFill(cadence: Cadence, capOverride?: number): number | null {
  if (cadence.kind !== "recharge") return null;
  const perDay = cadence.amount * (24 / cadence.everyHours);
  const cap = capOverride ?? cadence.cap;
  return Math.round((cap / perDay) * 10) / 10;
}

/** Cuánto se recarga por día. */
export function perDay(cadence: Cadence): number | null {
  if (cadence.kind !== "recharge") return null;
  return cadence.amount * (24 / cadence.everyHours);
}

/** "2 d 4 h", "3 h 12 min", "8 min". */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(totalMin / (60 * 24));
  const h = Math.floor((totalMin % (60 * 24)) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

import { getRegion, type RegionId } from "@/lib/regions";

export interface Occurrence {
  start: Date;
  end: Date;
  /** true si `now` está dentro de la ventana. */
  active: boolean;
}

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Shugo Festival: cada hora en punto, ventana de 3 minutos. */
export const SHUGO_WINDOW_MIN = 3;
/** Spacetime Rift: cada 3 h (00, 03, 06… UTC según la mayoría de las guías), ~10 min para entrar. */
export const RIFT_EVERY_HOURS = 3;
export const RIFT_WINDOW_MIN = 10;
/** Artifact Siege: lunes, jueves y sábado a las 21:00 hora del servidor. */
export const SIEGE_DAYS = [1, 4, 6];
export const SIEGE_HOUR = 21;
/** Duración aproximada mostrada (no confirmada). */
export const SIEGE_WINDOW_MIN = 60;

function occurrence(start: number, windowMin: number, now: Date): Occurrence {
  const end = start + windowMin * MIN;
  return {
    start: new Date(start),
    end: new Date(end),
    active: now.getTime() >= start && now.getTime() < end,
  };
}

/** Próximo evento que empieza cada `everyHours` horas en punto (UTC). Si hay uno activo, devuelve ese. */
export function nextRecurringUtc(now: Date, everyHours: number, windowMin: number): Occurrence {
  const t = now.getTime();
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const slot = everyHours * HOUR;
  const currentStart = dayStart + Math.floor((t - dayStart) / slot) * slot;
  if (t < currentStart + windowMin * MIN) return occurrence(currentStart, windowMin, now);
  return occurrence(currentStart + slot, windowMin, now);
}

export function nextShugoFestival(now: Date): Occurrence {
  return nextRecurringUtc(now, 1, SHUGO_WINDOW_MIN);
}

export function nextSpacetimeRift(now: Date): Occurrence {
  return nextRecurringUtc(now, RIFT_EVERY_HOURS, RIFT_WINDOW_MIN);
}

/** Partes de fecha/hora de `date` vistas en la zona horaria `tz`. */
function zonedParts(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: weekdays.indexOf(parts.weekday as string),
  };
}

/** Offset (ms) de la zona `tz` respecto de UTC en el instante `date`. */
export function tzOffsetMs(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Convierte una hora "de pared" en la zona `tz` a un instante UTC. */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tz: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let result = guess - tzOffsetMs(new Date(guess), tz);
  // Segunda pasada para los cambios de horario (DST).
  result = guess - tzOffsetMs(new Date(result), tz);
  return new Date(result);
}

/** Próximo Artifact Siege (lun/jue/sáb 21:00 hora del servidor de la región). */
export function nextArtifactSiege(now: Date, region: RegionId): Occurrence {
  const { tz } = getRegion(region);
  const today = zonedParts(now, tz);
  for (let i = 0; i < 8; i++) {
    // Mediodía local de ese día, para evitar problemas de DST al avanzar.
    const probe = zonedWallTimeToUtc(today.year, today.month, today.day + i, 12, 0, tz);
    const p = zonedParts(probe, tz);
    if (!SIEGE_DAYS.includes(p.weekday)) continue;
    const start = zonedWallTimeToUtc(p.year, p.month, p.day, SIEGE_HOUR, 0, tz).getTime();
    if (now.getTime() < start + SIEGE_WINDOW_MIN * MIN) return occurrence(start, SIEGE_WINDOW_MIN, now);
  }
  // No debería pasar: siempre hay un siege en los próximos 7 días.
  return occurrence(now.getTime(), SIEGE_WINDOW_MIN, now);
}

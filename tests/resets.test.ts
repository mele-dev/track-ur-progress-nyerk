import { describe, expect, it } from "vitest";
import {
  dailyResetKey,
  daysToFill,
  formatDuration,
  lastDailyReset,
  lastWeeklyReset,
  nextDailyReset,
  nextWeeklyReset,
  weeklyResetKey,
} from "@/lib/time/resets";

const d = (iso: string) => new Date(iso);

describe("daily reset (07:00 UTC)", () => {
  it("antes de las 07:00 UTC el último reset es el de ayer", () => {
    expect(lastDailyReset(d("2026-11-04T06:59:00Z")).toISOString()).toBe("2026-11-03T07:00:00.000Z");
  });
  it("justo a las 07:00 UTC arranca un día nuevo", () => {
    expect(lastDailyReset(d("2026-11-04T07:00:00Z")).toISOString()).toBe("2026-11-04T07:00:00.000Z");
    expect(nextDailyReset(d("2026-11-04T07:00:00Z")).toISOString()).toBe("2026-11-05T07:00:00.000Z");
  });
  it("la clave cambia al cruzar el reset", () => {
    expect(dailyResetKey(d("2026-11-04T06:59:59Z"))).not.toBe(dailyResetKey(d("2026-11-04T07:00:00Z")));
  });
});

describe("weekly reset (miércoles 07:00 UTC)", () => {
  it("martes a la noche todavía es la semana anterior", () => {
    // 2026-11-04 es miércoles
    expect(lastWeeklyReset(d("2026-11-04T06:30:00Z")).toISOString()).toBe("2026-10-28T07:00:00.000Z");
    expect(nextWeeklyReset(d("2026-11-04T06:30:00Z")).toISOString()).toBe("2026-11-04T07:00:00.000Z");
  });
  it("miércoles después del reset empieza la semana nueva", () => {
    expect(lastWeeklyReset(d("2026-11-04T07:00:00Z")).toISOString()).toBe("2026-11-04T07:00:00.000Z");
    expect(weeklyResetKey(d("2026-11-10T23:00:00Z"))).toBe("2026-11-04T07:00:00.000Z");
  });
  it("el último reset siempre cae en miércoles", () => {
    for (let i = 0; i < 14; i++) {
      const t = new Date(Date.UTC(2026, 10, 1 + i, 12));
      expect(lastWeeklyReset(t).getUTCDay()).toBe(3);
    }
  });
});

describe("recargas", () => {
  it("Odyle: 120/día → 560 se llena en ~4,7 días; 840 con membership en 7", () => {
    const c = { kind: "recharge", amount: 15, everyHours: 3, cap: 560, unit: { es: "", en: "" } } as const;
    expect(daysToFill(c)).toBe(4.7);
    expect(daysToFill(c, 840)).toBe(7);
  });
  it("Nightmare: +2/día con tope 14 → 7 días", () => {
    expect(daysToFill({ kind: "recharge", amount: 2, everyHours: 24, cap: 14, unit: { es: "", en: "" } })).toBe(7);
  });
  it("no aplica a diarias comunes", () => {
    expect(daysToFill({ kind: "daily", count: 5 })).toBeNull();
  });
});

describe("formatDuration", () => {
  it("formatea días, horas y minutos", () => {
    expect(formatDuration(8 * 60_000)).toBe("8 min");
    expect(formatDuration((3 * 60 + 12) * 60_000)).toBe("3 h 12 min");
    expect(formatDuration((2 * 24 + 4) * 3_600_000)).toBe("2 d 4 h");
  });
});

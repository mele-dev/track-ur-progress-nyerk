import { describe, expect, it } from "vitest";
import { nextArtifactSiege, nextShugoFestival, nextSpacetimeRift, zonedWallTimeToUtc } from "@/lib/time/events";

describe("Shugo Festival", () => {
  it("si estás dentro de la ventana de 3 min, está activo", () => {
    const o = nextShugoFestival(new Date("2026-11-04T10:02:00Z"));
    expect(o.active).toBe(true);
    expect(o.start.toISOString()).toBe("2026-11-04T10:00:00.000Z");
  });
  it("si ya pasó la ventana, es la próxima hora", () => {
    const o = nextShugoFestival(new Date("2026-11-04T10:03:00Z"));
    expect(o.active).toBe(false);
    expect(o.start.toISOString()).toBe("2026-11-04T11:00:00.000Z");
  });
});

describe("Spacetime Rift", () => {
  it("cada 3 h desde 00:00 UTC", () => {
    expect(nextSpacetimeRift(new Date("2026-11-04T04:00:00Z")).start.toISOString()).toBe("2026-11-04T06:00:00.000Z");
    expect(nextSpacetimeRift(new Date("2026-11-04T22:30:00Z")).start.toISOString()).toBe("2026-11-05T00:00:00.000Z");
  });
});

describe("Artifact Siege", () => {
  it("convierte hora local a UTC respetando DST", () => {
    // Nueva York: EDT (UTC-4) en octubre, EST (UTC-5) en noviembre
    expect(zonedWallTimeToUtc(2026, 10, 15, 21, 0, "America/New_York").toISOString()).toBe("2026-10-16T01:00:00.000Z");
    expect(zonedWallTimeToUtc(2026, 11, 5, 21, 0, "America/New_York").toISOString()).toBe("2026-11-06T02:00:00.000Z");
  });
  it("el próximo siege cae lunes, jueves o sábado a las 21:00 locales", () => {
    // Miércoles 4/11/2026 12:00 UTC → jueves 5/11 21:00 São Paulo (UTC-3) = 6/11 00:00 UTC
    const o = nextArtifactSiege(new Date("2026-11-04T12:00:00Z"), "sa");
    expect(o.start.toISOString()).toBe("2026-11-06T00:00:00.000Z");
  });
  it("devuelve el siege activo si está en curso", () => {
    const o = nextArtifactSiege(new Date("2026-11-06T00:30:00Z"), "sa");
    expect(o.active).toBe(true);
  });
});

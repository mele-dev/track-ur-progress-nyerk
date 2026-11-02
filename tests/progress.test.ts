import { describe, expect, it } from "vitest";
import { emptyProgress, normalizeProgress } from "@/lib/storage/progress";

describe("normalizeProgress", () => {
  const monday = new Date("2026-11-02T12:00:00Z");

  it("mantiene lo marcado dentro del mismo día", () => {
    const p = emptyProgress(monday);
    p.daily.done.nightmare = true;
    const again = normalizeProgress(JSON.parse(JSON.stringify(p)), new Date("2026-11-03T06:00:00Z"));
    expect(again.daily.done.nightmare).toBe(true);
  });

  it("vacía las diarias después del reset de las 07:00 UTC", () => {
    const p = emptyProgress(monday);
    p.daily.done.nightmare = true;
    p.weekly.done.abyss = true;
    const after = normalizeProgress(JSON.parse(JSON.stringify(p)), new Date("2026-11-03T07:00:00Z"));
    expect(after.daily.done).toEqual({});
    expect(after.weekly.done.abyss).toBe(true);
  });

  it("vacía las semanales el miércoles, pero no lo de una sola vez", () => {
    const p = emptyProgress(monday);
    p.weekly.done.abyss = true;
    p.once["sealed-dungeons"] = true;
    const wed = normalizeProgress(JSON.parse(JSON.stringify(p)), new Date("2026-11-04T07:00:00Z"));
    expect(wed.weekly.done).toEqual({});
    expect(wed.once["sealed-dungeons"]).toBe(true);
  });

  it("ignora basura", () => {
    expect(normalizeProgress("hola", monday)).toEqual(emptyProgress(monday));
    expect(normalizeProgress({ v: 1, daily: { key: 3, done: "x" }, overrides: { gs: "2400" } }, monday).overrides.gs).toBeUndefined();
  });
});

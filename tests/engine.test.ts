import { describe, expect, it } from "vitest";
import { buildDashboard, upcomingUnlocks } from "@/lib/engine/recommend";
import { resolvePhase } from "@/lib/engine/phases";
import { emptyProgress, type ProgressState } from "@/lib/storage/progress";
import type { ProfileInput } from "@/lib/engine/types";

const NOW = new Date("2026-11-02T12:00:00Z"); // lunes
const profile = (p: Partial<ProfileInput>): ProfileInput => ({ level: 45, gs: 0, cp: null, equipment: null, ...p });
const ids = (list: { activity: { id: string } }[]) => list.map((t) => t.activity.id);

describe("fases", () => {
  it("nivel 30 → leveo", () => {
    expect(resolvePhase(30, 300).id).toBe("leveling");
  });
  it("nivel 45 con 700 GS → Tier 1", () => {
    expect(resolvePhase(45, 700).id).toBe("t1");
  });
  it("2.400 GS → Tier 5", () => {
    expect(resolvePhase(45, 2400).id).toBe("t5");
  });
  it("3.000 GS → Tier 6", () => {
    expect(resolvePhase(45, 3000).id).toBe("t6");
  });
});

describe("leveo (nivel 30)", () => {
  const dash = buildDashboard(profile({ level: 30, gs: 300 }), emptyProgress(NOW), NOW);

  it("prioriza historia y barras de Ascension", () => {
    expect(ids(dash.once).slice(0, 2)).toEqual(["episode-quests", "ascension-gates"]);
  });
  it("no muestra contenido de nivel 45", () => {
    expect(ids(dash.today)).not.toContain("nightmare");
    expect(ids(dash.week)).toHaveLength(0);
  });
  it("el próximo desbloqueo es por nivel", () => {
    expect(dash.upcoming[0].kind).toBe("level");
    expect(dash.upcoming[0].threshold).toBe(32);
  });
  it("barra de progreso hacia nivel 45", () => {
    expect(dash.progress).toMatchObject({ to: 45, gap: 15 });
  });
});

describe("Tier 1 (700 GS)", () => {
  const dash = buildDashboard(profile({ gs: 700 }), emptyProgress(NOW), NOW);
  it("tiene Conquest y Exploration, pero no Transcendence", () => {
    expect(ids(dash.today)).toContain("expedition-conquest");
    expect(ids(dash.today)).not.toContain("transcendence");
    expect(ids(dash.week)).toContain("expedition-exploration");
  });
  it("el próximo desbloqueo es 1.000 GS (Abyss, Ascension Trial…)", () => {
    expect(dash.upcoming[0]).toMatchObject({ kind: "gs", threshold: 1000, gap: 300 });
    expect(ids(dash.upcoming[0].entries)).toEqual(expect.arrayContaining(["ascension-trial", "abyss"]));
  });
  it("oculta la historia una vez en 45", () => {
    expect(ids(dash.once)).not.toContain("episode-quests");
  });
});

describe("2.400 GS (el caso del usuario)", () => {
  const dash = buildDashboard(profile({ gs: 2400 }), emptyProgress(NOW), NOW);
  const transcendence = dash.today.find((t) => t.activity.id === "transcendence")!;

  it("Transcendence Stage 3 disponible y Stage 4 bloqueado", () => {
    expect(transcendence.bestTier?.id).toBe("stage-3");
    expect(transcendence.nextTier?.id).toBe("stage-4");
  });
  it("faltan 100 GS para el próximo desbloqueo (Stage 4 / Extreme)", () => {
    const next = dash.upcoming[0];
    expect(next).toMatchObject({ kind: "gs", threshold: 2500, gap: 100 });
    expect(ids(next.entries)).toEqual(expect.arrayContaining(["transcendence", "ascension-trial"]));
  });
  it("Ascension Trial en Hard", () => {
    expect(dash.week.find((t) => t.activity.id === "ascension-trial")?.bestTier?.id).toBe("hard");
  });
  it("todavía no muestra raids", () => {
    expect(ids(dash.week)).not.toContain("sanctuary-raids");
  });
  it("las diarias que se pierden van arriba", () => {
    expect(ids(dash.today).slice(0, 4)).toEqual(
      expect.arrayContaining(["duty-missions", "odyle-energy", "transcendence"]),
    );
  });
});

describe("2.900 GS: Ludra desactivado", () => {
  const dash = buildDashboard(profile({ gs: 2900 }), emptyProgress(NOW), NOW);
  it("el raid aparece pero al fondo de la lista", () => {
    const raid = dash.week.find((t) => t.activity.id === "sanctuary-raids")!;
    expect(raid.bestTier).toBeNull();
    expect(dash.week[dash.week.length - 1].activity.id).toBe("sanctuary-raids");
  });
  it("no se ofrece en 'desbloqueado'", () => {
    expect(ids(dash.unlocked)).not.toContain("sanctuary-raids");
  });
  it("Hell aparece como próximo desbloqueo a 3.500", () => {
    expect(upcomingUnlocks(45, 2900).some((g) => g.threshold === 3500)).toBe(true);
  });
});

describe("progreso marcado", () => {
  it("lo hecho baja al final", () => {
    const p: ProgressState = emptyProgress(NOW);
    p.daily.done["duty-missions"] = true;
    const dash = buildDashboard(profile({ gs: 2400 }), p, NOW);
    expect(dash.today[dash.today.length - 1].activity.id).toBe("duty-missions");
    expect(dash.today[dash.today.length - 1].done).toBe(true);
  });
  it("avisa si podés subir de dificultad", () => {
    const p = emptyProgress(NOW);
    p.doing["transcendence"] = "stage-2";
    const item = buildDashboard(profile({ gs: 2400 }), p, NOW).unlocked.find((u) => u.activity.id === "transcendence")!;
    expect(item.canStepUp).toBe(true);
    expect(item.bestTier.id).toBe("stage-3");
  });
  it("membership sube el tope de Odyle a 840", () => {
    const p = emptyProgress(NOW);
    p.settings.membership = true;
    const odyle = buildDashboard(profile({ gs: 2400 }), p, NOW).today.find((t) => t.activity.id === "odyle-energy")!;
    expect(odyle.fillDays).toBe(7);
  });
});

describe("equipo", () => {
  it("detecta piezas por debajo de +10 y de nivel bajo", () => {
    const dash = buildDashboard(
      profile({
        gs: 2400,
        equipment: [
          { slot: "Weapon", name: "Espada", itemLevel: 86, enhance: 12, grade: "Unique", icon: null },
          { slot: "Helmet", name: "Casco", itemLevel: 70, enhance: 7, grade: "Epic", icon: null },
        ],
      }),
      emptyProgress(NOW),
      NOW,
    );
    const below = dash.gear.find((g) => g.id === "pieces-below-10")!;
    expect(below.pieces).toEqual([{ slot: "Helmet", name: "Casco", value: "+7" }]);
    expect(dash.gear.find((g) => g.id === "pieces-low-ilvl")?.pieces?.[0].slot).toBe("Helmet");
  });
});

describe("datos faltantes", () => {
  it("sin GS lo marca como faltante", () => {
    const dash = buildDashboard(profile({ gs: null }), emptyProgress(NOW), NOW);
    expect(dash.missing).toContain("gs");
  });
});

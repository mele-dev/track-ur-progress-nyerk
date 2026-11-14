import { describe, expect, it } from "vitest";
import search from "./fixtures/search.json";
import info from "./fixtures/info.json";
import infoAlt from "./fixtures/info-alt.json";
import equipment from "./fixtures/equipment.json";
import { absolutizeImage, decodeId, normalizeCharacter, normalizeSearch, slotKind, toNum } from "@/lib/plaync/normalize";
import { buildQuery, characterUrl, INFO_URL } from "@/lib/plaync/client";

describe("helpers", () => {
  it("toNum acepta strings con separadores", () => {
    expect(toNum("152,300")).toBe(152300);
    expect(toNum("+12")).toBe(12);
    expect(toNum("abc")).toBeNull();
  });
  it("decodeId deshace el %-encoding (incluso doble)", () => {
    expect(decodeId("abc%3D")).toBe("abc=");
    expect(decodeId("abc%253D")).toBe("abc=");
    expect(decodeId("abc=")).toBe("abc=");
  });
  it("absolutizeImage completa rutas relativas de la búsqueda", () => {
    expect(absolutizeImage("/game_profile_images/x?a=1")).toBe("https://profileimg.plaync.com/game_profile_images/x?a=1");
    expect(absolutizeImage("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    expect(absolutizeImage(null)).toBeNull();
  });
  it("slotKind separa runas y Arcana del equipo", () => {
    expect(slotKind("MainHand")).toBe("gear");
    expect(slotKind("Rune2")).toBe("rune");
    expect(slotKind("Arcana5")).toBe("arcana");
  });
});

describe("query string", () => {
  it("codifica el characterId una sola vez", () => {
    expect(buildQuery({ characterId: "abc%3D" })).toBe("characterId=abc%3D");
    expect(buildQuery({ characterId: "abc=" })).toBe("characterId=abc%3D");
    expect(buildQuery({ characterId: "a+b/c=" })).toBe("characterId=a%2Bb%2Fc%3D");
  });
  it("omite parámetros vacíos", () => {
    expect(buildQuery({ keyword: "x", serverId: "", race: undefined })).toBe("keyword=x");
  });
  it("arma la URL de info", () => {
    expect(characterUrl(INFO_URL, "naw", "2201", "abc%3D")).toBe(
      "https://aion2.plaync.com/api/character/info?region=naw&characterId=abc%3D&serverId=2201&lang=en-US",
    );
  });
});

describe("normalizeSearch (formato real)", () => {
  const results = normalizeSearch(search, "la");
  it("lee resultados y descarta los incompletos", () => {
    expect(results).toHaveLength(2);
  });
  it("saca el <strong> del nombre, decodifica el id, traduce la raza y completa la foto", () => {
    expect(results[0]).toMatchObject({
      name: "Ejemplo",
      characterId: "AbCdEf1BuE6sYBSnOseF3EglUkOK0a5kXvs0_Ii4aafgw=",
      serverId: "2404",
      serverName: "Lumiel",
      level: 45,
      race: "Asmodians",
      region: "la",
    });
    expect(results[0].profileImage).toMatch(/^https:\/\/profileimg\.plaync\.com\/game_profile_images\//);
    expect(results[1]).toMatchObject({ name: "Ejemploito", characterId: "Zx-Yw_9876+def/=", race: "Elyos", level: 3 });
  });
  it("tolera respuestas vacías o raras", () => {
    expect(normalizeSearch(null, "eu")).toEqual([]);
    expect(normalizeSearch({ foo: 1 }, "eu")).toEqual([]);
  });
});

describe("normalizeCharacter (formato real)", () => {
  const ref = { region: "la" as const, serverId: "2404", characterId: "x%3D" };

  it("lee perfil, GS (stat ItemLevel con nombre en coreano) y CP", () => {
    const snap = normalizeCharacter(info, equipment, ref, new Date("2026-11-14T00:00:00Z"));
    expect(snap).toMatchObject({
      name: "Ejemplo",
      level: 45,
      combatPower: 153756,
      itemLevel: 2881,
      className: "Gladiator",
      race: "Asmodians",
      serverName: "Lumiel",
      characterId: "x=",
      warnings: [],
    });
    expect(snap.profileImage).toMatch(/^https:\/\/profileimg\.plaync\.com\//);
  });

  it("lee el equipo sin las skins y clasifica runas/Arcana", () => {
    const snap = normalizeCharacter(info, equipment, ref);
    expect(snap.equipment).toHaveLength(6);
    expect(snap.equipment?.[0]).toMatchObject({ slot: "MainHand", kind: "gear", enhance: 15, exceed: 3, grade: "Unique" });
    expect(snap.equipment?.find((p) => p.slot === "Rune1")?.kind).toBe("rune");
    expect(snap.equipment?.find((p) => p.slot === "Arcana1")?.kind).toBe("arcana");
    expect(snap.equipment?.some((p) => p.slot === "EarringR")).toBe(false);
  });

  it("tolera un formato alternativo", () => {
    const snap = normalizeCharacter(infoAlt, null, ref);
    expect(snap).toMatchObject({ name: "Otro", level: 44, combatPower: 98000, itemLevel: 1650, className: "Cleric" });
    expect(snap.equipment).toBeNull();
  });

  it("marca warnings cuando faltan campos", () => {
    const snap = normalizeCharacter({}, {}, ref);
    expect(snap.warnings).toEqual(
      expect.arrayContaining(["name_not_found", "level_not_found", "combat_power_not_found", "item_level_not_found", "equipment_not_parsed"]),
    );
  });
});

describe("regiones", () => {
  it("usa los códigos reales de PLAYNC y acepta alias viejos", async () => {
    const { parseRegion, REGIONS } = await import("@/lib/regions");
    expect(REGIONS.map((r) => r.id)).toEqual(["nae", "naw", "eu", "la", "as"]);
    expect(parseRegion("sa")).toBe("la");
    expect(parseRegion("asia")).toBe("as");
    expect(parseRegion("LA")).toBe("la");
    expect(parseRegion("xx")).toBeNull();
  });
});

describe("slotLabel", () => {
  it("traduce slots y conserva el número", async () => {
    const { slotLabel } = await import("@/data/slots");
    expect(slotLabel("Ring2", "es")).toBe("Anillo 2");
    expect(slotLabel("MainHand", "es")).toBe("Arma");
    expect(slotLabel("Bracelet1", "en")).toBe("Bracelet 1");
    expect(slotLabel("Weird", "es")).toBe("Weird");
  });
});

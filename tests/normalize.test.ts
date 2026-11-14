import { describe, expect, it } from "vitest";
import search from "./fixtures/search.json";
import info from "./fixtures/info.json";
import infoAlt from "./fixtures/info-alt.json";
import equipment from "./fixtures/equipment.json";
import { decodeId, normalizeCharacter, normalizeSearch, toNum } from "@/lib/plaync/normalize";
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

describe("normalizeSearch", () => {
  const results = normalizeSearch(search, "naw");
  it("lee resultados y descarta los incompletos", () => {
    expect(results).toHaveLength(2);
  });
  it("saca el HTML del nombre y decodifica el id", () => {
    expect(results[0]).toMatchObject({
      name: "Nyerk",
      characterId: "9PO8eUjDa8pGlEbVzGrXcPIg8uTHRHN1MEr7cEdM1Nc=",
      serverId: "2201",
      serverName: "Israphel",
      level: 45,
      className: "Gladiator",
      region: "naw",
    });
    expect(results[1]).toMatchObject({ name: "Nyerkito", characterId: "abc+def/=", level: 32 });
  });
  it("tolera respuestas vacías o raras", () => {
    expect(normalizeSearch(null, "eu")).toEqual([]);
    expect(normalizeSearch({ foo: 1 }, "eu")).toEqual([]);
  });
});

describe("normalizeCharacter", () => {
  const ref = { region: "naw" as const, serverId: "2201", characterId: "x%3D" };

  it("lee el formato documentado", () => {
    const snap = normalizeCharacter(info, equipment, ref, new Date("2026-11-02T00:00:00Z"));
    expect(snap).toMatchObject({
      name: "Nyerk",
      level: 45,
      combatPower: 152300,
      itemLevel: 2400,
      className: "Gladiator",
      serverName: "Israphel",
      characterId: "x=",
      warnings: [],
    });
    expect(snap.equipment).toHaveLength(3);
    expect(snap.equipment?.[1]).toMatchObject({ slot: "Helmet", enhance: 7, itemLevel: 70 });
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

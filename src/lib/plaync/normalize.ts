/**
 * Normalización defensiva de las respuestas de la API (no oficial) de PLAYNC.
 *
 * No hay documentación pública del formato: los nombres de campos salen de
 * proyectos comunitarios (krajetum/AION2, nuriland/aion2-api, nklsgod/AION-2-Character-Check)
 * y pueden cambiar. Por eso cada campo se busca en varias rutas posibles y, si no
 * aparece, queda en `null` con un warning. Si NCSOFT cambia algo, abrí
 * `/api/character?...&debug=1`, mirá el JSON crudo y agregá la ruta nueva acá.
 */
import type { RegionId } from "@/lib/regions";
import type { CharacterSnapshot, EquipmentPiece, SearchResult } from "./types";

type Json = unknown;
type Obj = Record<string, unknown>;

function isObj(v: Json): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Lee `a.b.c` de un objeto. */
export function getPath(obj: Json, path: string): unknown {
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (!isObj(cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

/** Primer valor no vacío entre varias rutas. */
export function pick(obj: Json, paths: string[]): unknown {
  for (const p of paths) {
    const v = getPath(obj, p);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

export function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,\s]/g, "").replace(/^\+/, "");
    if (cleaned === "") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function toStr(v: unknown): string | null {
  if (typeof v === "string") {
    const s = stripTags(v).trim();
    return s === "" ? null : s;
  }
  if (typeof v === "number") return String(v);
  return null;
}

/** La búsqueda resalta coincidencias con etiquetas HTML (<em>…</em>). */
export function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

/** El characterId puede venir %-encodeado: lo guardamos siempre decodificado. */
export function decodeId(id: string): string {
  let cur = id;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(cur);
      if (next === cur) break;
      cur = next;
    } catch {
      break;
    }
  }
  return cur;
}

/** Busca recursivamente la primera clave con alguno de estos nombres y valor numérico. */
export function deepFindNumber(obj: Json, keys: string[], depth = 0): number | null {
  if (depth > 6 || obj === null || typeof obj !== "object") return null;
  const lower = keys.map((k) => k.toLowerCase());
  if (isObj(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      if (lower.includes(k.toLowerCase())) {
        const n = toNum(v);
        if (n !== null) return n;
      }
    }
  }
  const children = Array.isArray(obj) ? obj : Object.values(obj);
  for (const child of children) {
    const n = deepFindNumber(child, keys, depth + 1);
    if (n !== null) return n;
  }
  return null;
}

const LABEL_KEYS = ["type", "name", "statName", "statType", "code", "key", "id"];
const VALUE_KEYS = ["value", "statValue", "amount", "val", "total"];

/**
 * Busca en listas de stats un objeto cuya etiqueta coincida con `label`
 * (ej. { type: "ItemLevel", value: 2400 }).
 */
export function deepFindStat(obj: Json, label: RegExp, depth = 0): number | null {
  if (depth > 6 || obj === null || typeof obj !== "object") return null;
  if (isObj(obj)) {
    const hasLabel = LABEL_KEYS.some((k) => typeof obj[k] === "string" && label.test(obj[k] as string));
    if (hasLabel) {
      for (const vk of VALUE_KEYS) {
        const n = toNum(obj[vk]);
        if (n !== null) return n;
      }
    }
  }
  const children = Array.isArray(obj) ? obj : Object.values(obj);
  for (const child of children) {
    const n = deepFindStat(child, label, depth + 1);
    if (n !== null) return n;
  }
  return null;
}

/** Busca el primer array de objetos que cumpla `test`. */
export function deepFindArray(obj: Json, test: (item: Obj) => boolean, depth = 0): Obj[] | null {
  if (depth > 6 || obj === null || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    const objs = obj.filter(isObj);
    if (objs.length > 0 && objs.some(test)) return objs;
  }
  const children = Array.isArray(obj) ? obj : Object.values(obj);
  for (const child of children) {
    const found = deepFindArray(child, test, depth + 1);
    if (found) return found;
  }
  return null;
}

// ─────────────────────────────── Búsqueda ───────────────────────────────

const ID_KEYS = ["characterId", "charId", "id", "character_id"];
const NAME_KEYS = ["name", "characterName", "charName", "nickname"];

export function normalizeSearch(raw: Json, region: RegionId): SearchResult[] {
  const list =
    (pick(raw, ["list", "data.list", "result.list", "data.characters", "characters", "items", "data.items"]) as
      | Json[]
      | undefined) ??
    (Array.isArray(raw) ? raw : undefined) ??
    deepFindArray(raw, (o) => ID_KEYS.some((k) => k in o) && NAME_KEYS.some((k) => k in o));

  if (!Array.isArray(list)) return [];

  const out: SearchResult[] = [];
  for (const item of list) {
    if (!isObj(item)) continue;
    const id = toStr(pick(item, ID_KEYS));
    const name = toStr(pick(item, NAME_KEYS));
    const serverId = toStr(pick(item, ["serverId", "server.id", "serverCode", "worldId"]));
    if (!id || !name || !serverId) continue;
    out.push({
      characterId: decodeId(id),
      serverId,
      serverName: toStr(pick(item, ["serverName", "server.name", "worldName"])),
      name,
      level: toNum(pick(item, ["level", "characterLevel", "lv"])),
      className: toStr(pick(item, ["className", "class.name", "classNameEn", "job", "classCode"])),
      race: toStr(pick(item, ["raceName", "race.name", "race"])),
      profileImage: toStr(pick(item, ["profileImageUrl", "profileImage", "profileImg", "imageUrl", "image"])),
      region,
    });
  }
  return out;
}

// ─────────────────────────────── Personaje ───────────────────────────────

const SLOT_KEYS = ["slotPosName", "slotName", "slotPos", "slot", "equipSlot", "position"];
const ENHANCE_KEYS = ["enchantLevel", "enhanceLevel", "enchant", "enhance", "reinforce", "plus"];

export function normalizeEquipment(raw: Json): EquipmentPiece[] | null {
  const list = deepFindArray(raw, (o) => SLOT_KEYS.some((k) => k in o) || ENHANCE_KEYS.some((k) => k in o));
  if (!list) return null;
  const pieces: EquipmentPiece[] = [];
  for (const item of list) {
    const slot = toStr(pick(item, SLOT_KEYS));
    const name = toStr(pick(item, ["name", "itemName", "item.name"]));
    if (!slot && !name) continue;
    pieces.push({
      slot: slot ?? "?",
      name,
      itemLevel: toNum(pick(item, ["itemLevel", "item.itemLevel", "level", "itemLv"])),
      enhance: toNum(pick(item, ENHANCE_KEYS)),
      grade: toStr(pick(item, ["grade", "gradeName", "quality", "rarity", "item.grade"])),
      icon: toStr(pick(item, ["icon", "iconUrl", "image", "imageUrl", "item.icon"])),
    });
  }
  return pieces;
}

export interface CharacterRef {
  region: RegionId;
  serverId: string;
  characterId: string;
}

export function normalizeCharacter(
  info: Json,
  equipment: Json | null,
  ref: CharacterRef,
  fetchedAt: Date = new Date(),
): CharacterSnapshot {
  const warnings: string[] = [];
  const profile = pick(info, ["profile", "data.profile", "character", "data.character", "data"]) ?? info;

  const name = toStr(pick(profile, NAME_KEYS)) ?? toStr(pick(info, NAME_KEYS));
  if (!name) warnings.push("name_not_found");

  const level = toNum(pick(profile, ["characterLevel", "level", "lv"])) ?? deepFindNumber(info, ["characterLevel"]);
  if (level === null) warnings.push("level_not_found");

  const combatPower =
    toNum(pick(profile, ["combatPower", "combat_power", "cp"])) ??
    deepFindNumber(info, ["combatPower", "combat_power"]) ??
    deepFindStat(info, /combat\s*power/i);
  if (combatPower === null) warnings.push("combat_power_not_found");

  const itemLevel =
    toNum(pick(profile, ["itemLevel", "item_level", "gearScore"])) ??
    deepFindStat(info, /^item\s*level$|^itemlevel$/i) ??
    deepFindStat(info, /item\s*level|아이템\s*레벨/i);
  if (itemLevel === null) warnings.push("item_level_not_found");

  const pieces = equipment !== null ? normalizeEquipment(equipment) : null;
  if (equipment !== null && pieces === null) warnings.push("equipment_not_parsed");

  return {
    source: "plaync",
    region: ref.region,
    serverId: ref.serverId,
    serverName: toStr(pick(profile, ["serverName", "server.name", "worldName"])),
    characterId: decodeId(ref.characterId),
    name: name ?? "?",
    className: toStr(pick(profile, ["className", "class.name", "classNameEn", "job"])),
    race: toStr(pick(profile, ["raceName", "race.name", "race"])),
    level,
    itemLevel,
    combatPower,
    profileImage: toStr(pick(profile, ["profileImage", "profileImageUrl", "profileImg", "imageUrl"])),
    equipment: pieces,
    fetchedAt: fetchedAt.toISOString(),
    warnings,
  };
}

import type { RegionId } from "@/lib/regions";

export interface SearchResult {
  /** characterId decodificado (sin %-encoding). */
  characterId: string;
  serverId: string;
  serverName: string | null;
  name: string;
  level: number | null;
  className: string | null;
  race: string | null;
  profileImage: string | null;
  region: RegionId;
}

/** "gear" = equipo que se encanta normal (+0..+15); runas y Arcana tienen otros topes. */
export type EquipmentKind = "gear" | "rune" | "arcana";

export interface EquipmentPiece {
  /** Nombre del slot tal como lo da PLAYNC (MainHand, Helmet, Ring1, Rune1, Arcana1…). */
  slot: string;
  kind: EquipmentKind;
  name: string | null;
  itemLevel: number | null;
  /** Nivel de enchant (+N). */
  enhance: number | null;
  /** Nivel de "exceed" (amplificación por encima de +15). */
  exceed: number | null;
  grade: string | null;
  icon: string | null;
}

export interface CharacterSnapshot {
  source: "plaync" | "manual";
  region: RegionId | null;
  serverId: string | null;
  serverName: string | null;
  characterId: string | null;
  name: string;
  className: string | null;
  race: string | null;
  level: number | null;
  /** Gear Score / Item Level. */
  itemLevel: number | null;
  combatPower: number | null;
  profileImage: string | null;
  equipment: EquipmentPiece[] | null;
  fetchedAt: string;
  /** Campos que no se pudieron leer de la respuesta (para depurar el mapeo). */
  warnings: string[];
}

export type ApiErrorCode =
  | "bad_request"
  | "not_found"
  | "upstream_blocked"
  | "upstream_unreachable"
  | "upstream_changed";

export interface ApiError {
  error: ApiErrorCode;
  message: string;
  status?: number;
}

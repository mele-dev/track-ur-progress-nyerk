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

export interface EquipmentPiece {
  slot: string;
  name: string | null;
  itemLevel: number | null;
  enhance: number | null;
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

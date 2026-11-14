export type RegionId = "nae" | "naw" | "eu" | "la" | "as";

export interface Region {
  id: RegionId;
  label: string;
  /** Zona horaria usada para mostrar "hora del servidor" (Artifact Siege). Aproximada. */
  tz: string;
}

/**
 * Regiones de AION 2 Global con los códigos que usa la API de PLAYNC
 * (verificados contra la búsqueda real el 2026-11-14: un código inválido
 * no da error, devuelve una lista vacía).
 */
export const REGIONS: Region[] = [
  { id: "nae", label: "NA East", tz: "America/New_York" },
  { id: "naw", label: "NA West", tz: "America/Los_Angeles" },
  { id: "eu", label: "Europe", tz: "Europe/Berlin" },
  { id: "la", label: "Latin America", tz: "America/Sao_Paulo" },
  { id: "as", label: "Asia", tz: "Asia/Singapore" },
];

/** Códigos viejos o alternativos que aceptamos en URLs y en datos guardados. */
const ALIASES: Record<string, RegionId> = {
  sa: "la",
  latam: "la",
  asia: "as",
};

export function isRegionId(value: unknown): value is RegionId {
  return typeof value === "string" && REGIONS.some((r) => r.id === value);
}

/** Convierte un valor (de la URL, localStorage, etc.) en una región válida, aceptando alias. */
export function parseRegion(value: unknown): RegionId | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (isRegionId(v)) return v;
  return ALIASES[v] ?? null;
}

export function getRegion(id: RegionId): Region {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}

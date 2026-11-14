export type RegionId = "nae" | "naw" | "eu" | "sa" | "asia";

export interface Region {
  id: RegionId;
  label: string;
  /** Zona horaria usada para mostrar "hora del servidor" (Artifact Siege). Aproximada. */
  tz: string;
}

/** Regiones de AION 2 Global (códigos que usa la API de PLAYNC). */
export const REGIONS: Region[] = [
  { id: "nae", label: "NA East", tz: "America/New_York" },
  { id: "naw", label: "NA West", tz: "America/Los_Angeles" },
  { id: "eu", label: "Europe", tz: "Europe/Berlin" },
  { id: "sa", label: "Latin America", tz: "America/Sao_Paulo" },
  { id: "asia", label: "Asia", tz: "Asia/Singapore" },
];

export function isRegionId(value: unknown): value is RegionId {
  return typeof value === "string" && REGIONS.some((r) => r.id === value);
}

export function getRegion(id: RegionId): Region {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}

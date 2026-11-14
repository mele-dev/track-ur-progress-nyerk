import type { RegionId } from "@/lib/regions";

/** Ruta interna del dashboard de un personaje. */
export function characterHref(region: RegionId, serverId: string, characterId: string): string {
  return `/c/${region}/${encodeURIComponent(serverId)}/${encodeURIComponent(characterId)}`;
}

export function manualHref(name: string, region: RegionId): string {
  return `/manual?name=${encodeURIComponent(name)}&region=${region}`;
}

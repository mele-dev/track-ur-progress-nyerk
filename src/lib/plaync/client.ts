/**
 * Cliente server-side para la API no oficial de PLAYNC (la que usa el sitio
 * oficial aion2.plaync.com). El navegador no puede llamarla directo (CORS / 403),
 * por eso solo se usa desde los Route Handlers de Next.js.
 */
import type { RegionId } from "@/lib/regions";
import { decodeId } from "./normalize";
import type { ApiErrorCode } from "./types";

export const SEARCH_URL = "https://api-search.plaync.com/aion2global/search/v2/character";
export const INFO_URL = "https://aion2.plaync.com/api/character/info";
export const EQUIPMENT_URL = "https://aion2.plaync.com/api/character/equipment";
export const PROFILE_PAGE_URL = "https://aion2.plaync.com/en-us/characters";

const TIMEOUT_MS = 10_000;
/** Cache de 30 minutos (igual que otros armories comunitarios). */
export const REVALIDATE_SECONDS = 1800;
/** Separación mínima entre llamadas al upstream desde la misma instancia. */
const MIN_GAP_MS = 250;

const HEADERS: HeadersInit = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://aion2.plaync.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
};

export class UpstreamError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

/**
 * Arma el query string a mano: cada valor se codifica UNA sola vez.
 * El characterId se decodifica primero, porque la búsqueda lo devuelve
 * ya %-encodeado y codificarlo dos veces hace que la API responda 404.
 */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => {
      const value = k === "characterId" ? decodeId(String(v)) : String(v);
      return `${encodeURIComponent(k)}=${encodeURIComponent(value)}`;
    })
    .join("&");
}

let lastCall = 0;
async function throttle() {
  const wait = lastCall + MIN_GAP_MS - Date.now();
  lastCall = Math.max(Date.now(), lastCall + MIN_GAP_MS);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

export interface FetchOptions {
  /** Saltear la cache (botón "Actualizar"). */
  fresh?: boolean;
}

async function getJson(url: string, opts: FetchOptions = {}): Promise<unknown> {
  await throttle();
  let res: Response;
  try {
    res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(opts.fresh ? { cache: "no-store" as const } : { next: { revalidate: REVALIDATE_SECONDS } }),
    });
  } catch (err) {
    throw new UpstreamError("upstream_unreachable", `No se pudo conectar con PLAYNC: ${(err as Error).message}`);
  }
  if (res.status === 404) throw new UpstreamError("not_found", "Personaje no encontrado", 404);
  if (res.status === 403 || res.status === 429) {
    throw new UpstreamError("upstream_blocked", `PLAYNC rechazó la consulta (${res.status})`, res.status);
  }
  if (!res.ok) throw new UpstreamError("upstream_unreachable", `PLAYNC respondió ${res.status}`, res.status);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new UpstreamError("upstream_changed", "PLAYNC no devolvió JSON", res.status);
  }
}

export interface SearchParams {
  keyword: string;
  region: RegionId;
  serverId?: string;
  race?: string;
}

export function searchUrl(p: SearchParams): string {
  return `${SEARCH_URL}?${buildQuery({
    keyword: p.keyword,
    region: p.region,
    serverId: p.serverId,
    race: p.race,
    localeInfo: "en-US",
  })}`;
}

export function characterUrl(base: string, region: RegionId, serverId: string, characterId: string): string {
  return `${base}?${buildQuery({ region, characterId, serverId, lang: "en-US" })}`;
}

/** Link al perfil en el sitio oficial. */
export function officialProfileUrl(region: RegionId, serverId: string, characterId: string): string {
  return `${PROFILE_PAGE_URL}/${encodeURIComponent(serverId)}/${encodeURIComponent(decodeId(characterId))}?region=${region}`;
}

export function searchCharacters(p: SearchParams): Promise<unknown> {
  return getJson(searchUrl(p));
}

export function fetchCharacterInfo(
  region: RegionId,
  serverId: string,
  characterId: string,
  opts?: FetchOptions,
): Promise<unknown> {
  return getJson(characterUrl(INFO_URL, region, serverId, characterId), opts);
}

export function fetchCharacterEquipment(
  region: RegionId,
  serverId: string,
  characterId: string,
  opts?: FetchOptions,
): Promise<unknown> {
  return getJson(characterUrl(EQUIPMENT_URL, region, serverId, characterId), opts);
}

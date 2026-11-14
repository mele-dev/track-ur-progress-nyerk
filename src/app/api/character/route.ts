import { NextResponse, type NextRequest } from "next/server";
import { fetchCharacterEquipment, fetchCharacterInfo, officialProfileUrl } from "@/lib/plaync/client";
import { errorFrom, errorJson } from "@/lib/plaync/http";
import { decodeId, normalizeCharacter } from "@/lib/plaync/normalize";
import { isRegionId } from "@/lib/regions";

export const runtime = "nodejs";

/**
 * GET /api/character?region=naw&serverId=2201&characterId=...[&fresh=1][&debug=1]
 * Con debug=1 devuelve también el JSON crudo de PLAYNC (para arreglar el mapeo si cambia).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const region = params.get("region");
  const serverId = params.get("serverId")?.trim() ?? "";
  const characterId = decodeId(params.get("characterId")?.trim() ?? "");
  const fresh = params.get("fresh") === "1";
  const debug = params.get("debug") === "1";

  if (!isRegionId(region)) return errorJson("bad_request", "Región inválida");
  if (!/^[\w-]{1,16}$/.test(serverId)) return errorJson("bad_request", "serverId inválido");
  if (characterId.length < 4 || characterId.length > 200) return errorJson("bad_request", "characterId inválido");

  const [info, equipment] = await Promise.allSettled([
    fetchCharacterInfo(region, serverId, characterId, { fresh }),
    fetchCharacterEquipment(region, serverId, characterId, { fresh }),
  ]);

  if (info.status === "rejected") return errorFrom(info.reason);

  const snapshot = normalizeCharacter(info.value, equipment.status === "fulfilled" ? equipment.value : null, {
    region,
    serverId,
    characterId,
  });
  if (equipment.status === "rejected") snapshot.warnings.push("equipment_unavailable");

  const raw = debug
    ? { info: info.value, equipment: equipment.status === "fulfilled" ? equipment.value : String(equipment.reason) }
    : undefined;

  // Si no pudimos leer nada útil, el formato probablemente cambió.
  const nothing = snapshot.level === null && snapshot.itemLevel === null && snapshot.combatPower === null;
  if (nothing && snapshot.warnings.includes("name_not_found")) {
    return errorJson("upstream_changed", "La respuesta de PLAYNC no tiene el formato esperado", undefined, raw ? { raw } : undefined);
  }

  return NextResponse.json(
    { snapshot, officialUrl: officialProfileUrl(region, serverId, characterId), ...(raw ? { raw } : {}) },
    {
      headers: {
        "Cache-Control": fresh ? "no-store" : "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    },
  );
}

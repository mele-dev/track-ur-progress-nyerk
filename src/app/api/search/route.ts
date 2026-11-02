import { NextResponse, type NextRequest } from "next/server";
import { searchCharacters } from "@/lib/plaync/client";
import { errorFrom, errorJson } from "@/lib/plaync/http";
import { normalizeSearch } from "@/lib/plaync/normalize";
import { isRegionId } from "@/lib/regions";

export const runtime = "nodejs";

/** GET /api/search?name=Nyerk&region=naw[&serverId=2201][&debug=1] */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const name = params.get("name")?.trim() ?? "";
  const region = params.get("region");
  const serverId = params.get("serverId")?.trim() || undefined;
  const debug = params.get("debug") === "1";

  if (name.length < 2 || name.length > 32) return errorJson("bad_request", "El nombre debe tener entre 2 y 32 caracteres");
  if (!isRegionId(region)) return errorJson("bad_request", "Región inválida");

  try {
    const raw = await searchCharacters({ keyword: name, region, serverId });
    const results = normalizeSearch(raw, region);
    return NextResponse.json(debug ? { results, raw } : { results }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" },
    });
  } catch (err) {
    return errorFrom(err);
  }
}

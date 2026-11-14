import { notFound, redirect } from "next/navigation";
import { CharacterView } from "@/components/CharacterView";
import { decodeId } from "@/lib/plaync/normalize";
import { characterHref } from "@/lib/links";
import { parseRegion } from "@/lib/regions";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ region: string; serverId: string; characterId: string }>;
}) {
  const p = await params;
  const region = parseRegion(p.region);
  if (!region) notFound();
  const serverId = decodeId(p.serverId);
  const characterId = decodeId(p.characterId);
  // Links viejos con un código de región alternativo (ej. "sa") → URL canónica.
  if (region !== p.region) redirect(characterHref(region, serverId, characterId));
  return <CharacterView region={region} serverId={serverId} characterId={characterId} />;
}

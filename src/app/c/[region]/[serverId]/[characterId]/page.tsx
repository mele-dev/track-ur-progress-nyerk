import { notFound } from "next/navigation";
import { CharacterView } from "@/components/CharacterView";
import { decodeId } from "@/lib/plaync/normalize";
import { isRegionId } from "@/lib/regions";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ region: string; serverId: string; characterId: string }>;
}) {
  const p = await params;
  if (!isRegionId(p.region)) notFound();
  return <CharacterView region={p.region} serverId={decodeId(p.serverId)} characterId={decodeId(p.characterId)} />;
}

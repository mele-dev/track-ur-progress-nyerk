"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { manualHref } from "@/lib/links";
import type { CharacterSnapshot } from "@/lib/plaync/types";
import { REGIONS, isRegionId, type RegionId } from "@/lib/regions";
import { loadProgress, manualKey, rememberCharacter, saveProgress } from "@/lib/storage/progress";
import { Dashboard } from "./dashboard/Dashboard";
import { Card } from "./ui";

function ManualForm({ initialName, initialRegion }: { initialName: string; initialRegion: RegionId }) {
  const { d } = useI18n();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [region, setRegion] = useState<RegionId>(initialRegion);
  const [level, setLevel] = useState("45");
  const [gs, setGs] = useState("");
  const [cp, setCp] = useState("");

  const parse = (v: string) => {
    const n = Number(v.replace(/[.,\s]/g, ""));
    return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const key = manualKey(n);
    const progress = loadProgress(key, new Date());
    const lv = parse(level);
    progress.overrides = {
      ...progress.overrides,
      level: lv !== undefined ? Math.min(lv, 99) : undefined,
      gs: parse(gs),
      cp: parse(cp),
    };
    saveProgress(key, progress);
    rememberCharacter({
      key,
      name: n,
      href: manualHref(n, region),
      region,
      gs: progress.overrides.gs ?? null,
      savedAt: new Date().toISOString(),
    });
    router.push(manualHref(n, region));
  };

  const input =
    "mt-1 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-ink tabular-nums focus:border-gold/60 focus:outline-none";

  return (
    <Card title={d.manual.title} subtitle={d.manual.intro} className="mx-auto max-w-2xl">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-muted sm:col-span-2">
          {d.manual.name}
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={32} className={input} />
        </label>
        <label className="text-sm text-muted">
          {d.search.region}
          <select value={region} onChange={(e) => setRegion(e.target.value as RegionId)} className={input}>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          {d.manual.level}
          <input inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} className={input} />
        </label>
        <label className="text-sm text-muted">
          {d.manual.gs}
          <input inputMode="numeric" value={gs} onChange={(e) => setGs(e.target.value)} placeholder="2400" className={input} />
        </label>
        <label className="text-sm text-muted">
          {d.manual.cp}
          <input inputMode="numeric" value={cp} onChange={(e) => setCp(e.target.value)} placeholder="150000" className={input} />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-gold px-6 py-3 font-semibold text-black hover:brightness-110 sm:col-span-2"
        >
          {d.manual.submit}
        </button>
      </form>
    </Card>
  );
}

export function ManualView() {
  const { d } = useI18n();
  const params = useSearchParams();
  const name = params.get("name")?.trim() ?? "";
  const regionParam = params.get("region");
  const region: RegionId = isRegionId(regionParam) ? regionParam : "nae";
  const [fetchedAt] = useState(() => new Date().toISOString());
  const showDashboard = name !== "";

  if (!showDashboard) return <ManualForm key={`${name}-${region}`} initialName={name} initialRegion={region} />;

  const snapshot: CharacterSnapshot = {
    source: "manual",
    region,
    serverId: null,
    serverName: null,
    characterId: null,
    name,
    className: null,
    race: null,
    level: null,
    itemLevel: null,
    combatPower: null,
    profileImage: null,
    equipment: null,
    fetchedAt,
    warnings: [],
  };

  return (
    <div className="space-y-3">
      <Link href={`/manual?region=${region}`} className="text-sm text-muted underline decoration-dotted hover:text-ink">
        ← {d.manual.change}
      </Link>
      <Dashboard key={name} charKey={manualKey(name)} snapshot={snapshot} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { characterHref } from "@/lib/links";
import type { ApiError, CharacterSnapshot } from "@/lib/plaync/types";
import type { RegionId } from "@/lib/regions";
import { characterKey, rememberCharacter } from "@/lib/storage/progress";
import { Dashboard } from "./dashboard/Dashboard";
import { Card, Spinner } from "./ui";

type State =
  | { status: "loading" }
  | { status: "ok"; snapshot: CharacterSnapshot; officialUrl: string | null; refreshing: boolean }
  | { status: "error"; error: ApiError };

export function CharacterView({ region, serverId, characterId }: { region: RegionId; serverId: string; characterId: string }) {
  const { d } = useI18n();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(
    async (fresh: boolean) => {
      setState((s) => (s.status === "ok" ? { ...s, refreshing: true } : { status: "loading" }));
      try {
        const qs = `region=${region}&serverId=${encodeURIComponent(serverId)}&characterId=${encodeURIComponent(characterId)}${fresh ? "&fresh=1" : ""}`;
        const res = await fetch(`/api/character?${qs}`, fresh ? { cache: "no-store" } : undefined);
        const body = (await res.json()) as { snapshot?: CharacterSnapshot; officialUrl?: string } & Partial<ApiError>;
        if (!res.ok || !body.snapshot) {
          setState({ status: "error", error: { error: body.error ?? "upstream_unreachable", message: body.message ?? "" } });
          return;
        }
        const snapshot = body.snapshot;
        setState({ status: "ok", snapshot, officialUrl: body.officialUrl ?? null, refreshing: false });
        rememberCharacter({
          key: characterKey(region, serverId, characterId),
          name: snapshot.name,
          href: characterHref(region, serverId, characterId),
          serverName: snapshot.serverName,
          className: snapshot.className,
          region,
          gs: snapshot.itemLevel,
          savedAt: new Date().toISOString(),
        });
      } catch {
        setState({ status: "error", error: { error: "upstream_unreachable", message: "" } });
      }
    },
    [region, serverId, characterId],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    void load(false);
  }, [load]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 py-10 text-muted">
        <Spinner /> {d.loading}
      </div>
    );
  }

  if (state.status === "error") {
    const text = d.errors[state.error.error] ?? d.errors.generic;
    return (
      <Card title={d.errors.generic}>
        <p className="text-bad">{text}</p>
        {state.error.message && <p className="mt-1 text-xs text-faint">{state.error.message}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            className="rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm font-medium hover:border-gold/50"
          >
            ↻ {d.errors.retry}
          </button>
          <Link
            href={`/manual?region=${region}`}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
          >
            {d.errors.useManual}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Dashboard
      charKey={characterKey(region, serverId, characterId)}
      snapshot={state.snapshot}
      officialUrl={state.officialUrl}
      onRefresh={() => void load(true)}
      refreshing={state.refreshing}
    />
  );
}

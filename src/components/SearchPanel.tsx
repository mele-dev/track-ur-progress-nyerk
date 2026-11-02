"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { characterHref } from "@/lib/links";
import type { ApiError, SearchResult } from "@/lib/plaync/types";
import { REGIONS, isRegionId, type RegionId } from "@/lib/regions";
import { forgetCharacter, loadRecent, type RecentCharacter } from "@/lib/storage/progress";
import { Badge, Card, Spinner } from "./ui";

const REGION_KEY = "aion2tracker:v1:region";

export function SearchPanel() {
  const { d, fmt, num } = useI18n();
  const [name, setName] = useState("");
  const [region, setRegion] = useState<RegionId>("nae");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REGION_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preferencia guardada en el navegador
      if (isRegionId(saved)) setRegion(saved);
    } catch {
      // ignorar
    }
  }, []);

  const onRegion = (r: RegionId) => {
    setRegion(r);
    try {
      window.localStorage.setItem(REGION_KEY, r);
    } catch {
      // ignorar
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = name.trim();
    if (q.length < 2) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/search?name=${encodeURIComponent(q)}&region=${region}`);
      const body = (await res.json()) as { results?: SearchResult[] } & Partial<ApiError>;
      if (!res.ok || !body.results) setError({ error: body.error ?? "upstream_unreachable", message: body.message ?? "" });
      else setResults(body.results);
    } catch {
      setError({ error: "upstream_unreachable", message: "" });
    } finally {
      setLoading(false);
    }
  };

  const errorText = error ? (d.errors[error.error] ?? d.errors.generic) : null;
  const manualLink = `/manual?name=${encodeURIComponent(name.trim())}&region=${region}`;

  return (
    <Card title={d.search.title}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="text-sm text-muted">
          {d.search.name}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={d.search.namePlaceholder}
            minLength={2}
            maxLength={32}
            required
            className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-ink placeholder:text-faint focus:border-gold/60 focus:outline-none"
          />
        </label>
        <label className="text-sm text-muted">
          {d.search.region}
          <select
            value={region}
            onChange={(e) => onRegion(e.target.value as RegionId)}
            className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-3 text-base text-ink"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-black hover:brightness-110 disabled:opacity-60"
        >
          {loading && <Spinner />} {loading ? d.search.searching : d.search.submit}
        </button>
      </form>

      {errorText && (
        <div className="mt-4 rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm text-bad">
          <p>{errorText}</p>
          <Link href={manualLink} className="mt-1 inline-block font-semibold underline">
            {d.errors.useManual} →
          </Link>
        </div>
      )}

      {results && (
        <div className="mt-4">
          {results.length === 0 ? (
            <p className="text-sm text-muted">{d.search.noResults}</p>
          ) : (
            <>
              <h3 className="mb-2 text-sm font-semibold text-muted">{d.search.results}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {results.map((r) => (
                  <li key={`${r.serverId}-${r.characterId}`}>
                    <Link
                      href={characterHref(r.region, r.serverId, r.characterId)}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 hover:border-gold/50"
                    >
                      {r.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element -- imagen externa del sitio oficial
                        <img src={r.profileImage} alt="" className="h-10 w-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-gold">
                          {r.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{r.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {[r.className, r.race, r.serverName ?? r.serverId].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {r.level !== null && <Badge>{fmt("{lv} {n}", { lv: d.search.level, n: num(r.level) })}</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-sm text-muted">
        {d.search.manualHint}{" "}
        <Link href={manualLink} className="font-medium text-gold underline decoration-dotted">
          {d.search.manualCta}
        </Link>
      </p>
    </Card>
  );
}

export function RecentList() {
  const { d, num } = useI18n();
  const [list, setList] = useState<RecentCharacter[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe en el cliente
    setList(loadRecent());
  }, []);

  if (!list || list.length === 0) return null;
  return (
    <Card title={d.recent.title}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((r) => (
          <li key={r.key} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 pr-2">
            <Link href={r.href} className="min-w-0 flex-1 px-3 py-2.5 hover:text-gold">
              <span className="block truncate font-medium">{r.name}</span>
              <span className="block truncate text-xs text-muted">
                {[r.className, r.serverName, r.gs ? `${num(r.gs)} GS` : null, r.key.startsWith("manual:") ? "manual" : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                forgetCharacter(r.key);
                setList(loadRecent());
              }}
              className="rounded-lg px-2 py-1 text-xs text-faint hover:text-bad"
              aria-label={`${d.recent.remove} ${r.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

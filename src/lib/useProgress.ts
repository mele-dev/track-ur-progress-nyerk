"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadProgress,
  normalizeProgress,
  saveProgress,
  type ProgressState,
  type StatOverrides,
} from "@/lib/storage/progress";
import { useNow } from "./useNow";

/** Progreso del personaje en localStorage, con expiración automática al pasar los resets. */
export function useProgress(charKey: string | null) {
  const now = useNow();
  const [state, setState] = useState<ProgressState | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe en el cliente
    setState(charKey ? loadProgress(charKey, new Date()) : null);
  }, [charKey]);

  useEffect(() => {
    if (charKey && state) saveProgress(charKey, state);
  }, [charKey, state]);

  // Si mientras la página está abierta pasa un reset, las diarias/semanales se vacían solas.
  const progress = useMemo(() => (state ? normalizeProgress(state, now) : null), [state, now]);

  const update = useCallback((fn: (s: ProgressState) => ProgressState) => {
    setState((prev) => fn(normalizeProgress(prev, new Date())));
  }, []);

  const toggle = useCallback(
    (block: "daily" | "weekly" | "once", id: string) =>
      update((s) => {
        if (block === "once") return { ...s, once: { ...s.once, [id]: !s.once[id] } };
        const b = s[block];
        return { ...s, [block]: { ...b, done: { ...b.done, [id]: !b.done[id] } } };
      }),
    [update],
  );

  const setDoing = useCallback(
    (activityId: string, tierId: string | null) =>
      update((s) => {
        const doing = { ...s.doing };
        if (tierId) doing[activityId] = tierId;
        else delete doing[activityId];
        return { ...s, doing };
      }),
    [update],
  );

  const setOverrides = useCallback(
    (overrides: StatOverrides) => update((s) => ({ ...s, overrides })),
    [update],
  );

  const setMembership = useCallback(
    (membership: boolean) => update((s) => ({ ...s, settings: { ...s.settings, membership } })),
    [update],
  );

  return { progress, now, toggle, setDoing, setOverrides, setMembership };
}

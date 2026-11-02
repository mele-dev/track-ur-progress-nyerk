"use client";

import { useEffect, useState } from "react";

/** Fecha actual que se actualiza sola (para countdowns y para expirar checklists al pasar un reset). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

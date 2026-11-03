import { PHASES } from "@/data/phases";
import type { Phase } from "@/data/types";
import type { PhaseProgress } from "./types";

/** Fase actual: la última cuyos mínimos (nivel y GS) se cumplen. */
export function resolvePhase(level: number, gs: number, phases: Phase[] = PHASES): Phase {
  let current = phases[0];
  for (const p of phases) {
    if (level >= p.minLevel && gs >= p.minGs) current = p;
  }
  return current;
}

export function nextPhaseOf(phase: Phase, phases: Phase[] = PHASES): Phase | null {
  const i = phases.findIndex((p) => p.id === phase.id);
  return i >= 0 && i < phases.length - 1 ? phases[i + 1] : null;
}

/** Barra de progreso hacia el objetivo de la fase (GS, o nivel durante el leveo). */
export function phaseProgress(phase: Phase, level: number, gs: number): PhaseProgress | null {
  if (phase.id === "leveling") {
    const to = 45;
    const current = Math.min(level, to);
    return { from: 1, to, current, pct: pct(current, 1, to), gap: Math.max(0, to - level) };
  }
  if (phase.targetGs === undefined) return null;
  const from = phase.minGs;
  const to = phase.targetGs;
  return { from, to, current: gs, pct: pct(gs, from, to), gap: Math.max(0, to - gs) };
}

function pct(value: number, from: number, to: number): number {
  if (to <= from) return 100;
  return Math.max(0, Math.min(100, Math.round(((value - from) / (to - from)) * 100)));
}

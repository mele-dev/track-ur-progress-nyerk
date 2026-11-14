/**
 * Cuándo se revisaron por última vez los datos del juego contra las notas
 * oficiales de NCSOFT. Para la próxima actualización: buscar los patch notes
 * publicados DESPUÉS de `patchNotesReviewedThrough.postedAt` (ver CLAUDE.md y
 * `npm run patch-notes`), aplicar los cambios en src/data/ y actualizar esto.
 */
export const DATA_META = {
  /** Día en que se hizo la última revisión (YYYY-MM-DD). */
  lastReviewed: "2026-11-14",
  /** Último patch note oficial leído y aplicado. */
  patchNotesReviewedThrough: {
    title: "[Notice] Patch Notes | Nov. 11",
    postedAt: "2026-11-11T08:40:57.923Z",
    url: "https://aion2.plaync.com/en-us/board/update/view?articleId=6af42a1affaccc00c265785f",
  },
} as const;

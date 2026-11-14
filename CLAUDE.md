# Aion 2 Progress: instrucciones para Claude

Dashboard (Next.js) para AION 2 Global: buscás tu personaje y te dice qué hacer hoy, esta semana y qué desbloqueás según tu GS. La explicación general está en el README.

## Actualizar los datos del juego (patch notes)

Los datos que recomienda el dashboard están en `src/data/` (`activities.ts`, `phases.ts`, `gear.ts`). Cuando pidan "actualizar la página" o "revisar los patch notes":

1. **Fijate la última revisión** en `src/data/meta.ts`:
   - `DATA_META.lastReviewed`: día de la última revisión.
   - `DATA_META.patchNotesReviewedThrough.postedAt`: fecha del último patch note oficial que ya está aplicado.
2. **Listá las notas oficiales nuevas** (posteriores a esa fecha):
   ```bash
   NODE_USE_ENV_PROXY=1 npm run patch-notes            # solo títulos y links
   NODE_USE_ENV_PROXY=1 npm run patch-notes -- --full  # con el texto completo
   ```
   - El script lee la API pública del foro oficial (`api-global-community.plaync.com/aion2_global/board/{update_en|notice_en}/article`), la misma que usa `aion2.plaync.com/en-us/board/update/list`.
   - `update_en` son los patch notes. `notice_en` son avisos (mantenimientos, problemas de reset, emparejamiento de servidores).
   - Si no hay notas nuevas, no hay nada que actualizar.
3. **Leé cada nota y aplicá solo lo que afecte al dashboard:**
   - item level de entrada, dificultades nuevas (tiers), dungeons/raids agregados o quitados;
   - cantidades de entradas, recargas y topes, horarios (Artifact Siege, Rift, Shugo), reset diario/semanal;
   - tiendas con límite semanal y recompensas que cambian qué conviene hacer.
   - No hace falta registrar skins, promociones, balance de clases ni bug fixes menores.
4. Por cada cambio:
   - agregá la nota como fuente en `src/data/sources.ts`, con id `official-YYYY-MM-DD`;
   - referenciala en `sources` de la actividad o fase;
   - si el dato está confirmado por la nota oficial, poné `confidence: "ok"`.
5. **Actualizá `src/data/meta.ts`:**
   - `lastReviewed` = hoy;
   - `patchNotesReviewedThrough` = la nota más reciente que leíste (title, postedAt, url).
6. Agregá una entrada arriba de todo en `docs/DATA_UPDATES.md` con la fecha, las notas revisadas y qué cambió.
7. Corré `npm test`, `npm run lint` y `npm run build`. Ajustá los tests de `tests/engine.test.ts` que dependan de los umbrales que cambiaron.

### Red necesaria

Para leer las notas y probar la API de personajes hacen falta estos hosts:
- `aion2.plaync.com`
- `api-search.plaync.com`
- `api-global-community.plaync.com`
- `assets.playnccdn.com` (opcional)

En este repo están habilitados en el entorno cloud `track-ur-progress-nyerk`.

En este entorno, el `fetch` de Node necesita `NODE_USE_ENV_PROXY=1` (y `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` si falla TLS). En Vercel no hace falta.

## Comandos

- `npm run dev`: servidor local.
- `npm test`: Vitest.
- `npm run lint`, `npm run typecheck`, `npm run build`.

## Convenciones

- UI bilingüe: textos en `src/i18n/dictionaries.ts`; datos del juego con `{ es, en }`.
- Mobile first: probar todas las páginas a 360–390 px de ancho, sin scroll horizontal.
- La lectura de la API de PLAYNC (`src/lib/plaync/normalize.ts`) es defensiva. El formato real verificado está documentado en el README.

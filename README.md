# Aion 2 Progress: ¿qué hago hoy?

Dashboard para **AION 2 (Global)**. Buscás tu personaje por nombre, igual que en shugo.gg, y te dice:

- **Hoy:** qué diarias te faltan (Duty Missions, Nightmare, Odyle Energy, Conquest, Transcendence, Daily Dungeon…), ordenadas según lo que más conviene en tu fase.
- **Esta semana:** lo que se pierde el miércoles si no lo hacés (Ascension Trial, Exploration, Abyss, tiendas…).
- **Tu fase** (Leveo → Tier 1…Tier 6) con una barra hacia el próximo objetivo de GS.
- **Próximos desbloqueos:** por ejemplo, con 2.400 GS te muestra "2.500 GS → Transcendence Stage 4, Ascension Trial Extreme".
- **Ya desbloqueaste: ¿lo estás aprovechando?** Marcás qué dificultad hacés y te avisa si podés subir.
- **Equipo y CP:** piezas por debajo de +10 (si la API trae el equipo), el orden de mejoras y fuentes de CP.
- **Eventos:** Shugo Festival, Spacetime Rift y Artifact Siege, con su cuenta regresiva.
- **Una sola vez:** quests regionales, Sealed Dungeons, Strongholds, Clash Runes, barras de Ascension.

Lo que marcás se guarda **en tu navegador** (localStorage), separado por personaje. Se resetea solo: las diarias a las **07:00 UTC** y las semanales los **miércoles a las 07:00 UTC**.

Interfaz en **español e inglés** (botón ES/EN arriba a la derecha).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Vitest (tests del motor, de los resets, de la normalización de la API y de las rutas)
- Sin base de datos. Las rutas `/api/*` hacen de proxy hacia el sitio oficial.

## Desarrollo local

```bash
npm install
```

```bash
npm run dev
```

Abrí http://localhost:3000.

Otros comandos:

```bash
npm test
```

```bash
npm run lint && npm run typecheck && npm run build
```

## Deploy en Vercel (gratis)

1. Entrá a https://vercel.com/new e importá este repositorio.
2. Framework: **Next.js** (lo detecta solo). No hace falta configurar variables de entorno.
3. Deploy. Listo.

> **Importante:** el proxy tiene que correr en un servidor (Vercel u otro host de Node). No funciona como sitio estático (GitHub Pages), porque el navegador no puede llamar directo a la API de PLAYNC (CORS / 403).

## De dónde salen los datos del personaje

NCSOFT **no tiene una API oficial**. Este proyecto usa los mismos endpoints que usa la página de personajes de `aion2.plaync.com`. Están documentados por proyectos comunitarios como [krajetum/AION2#67](https://github.com/krajetum/AION2/pull/67), [nuriland/aion2-api](https://github.com/nuriland/aion2-api), [kcam01/Aion2](https://github.com/kcam01/Aion2) y [nklsgod/AION-2-Character-Check](https://github.com/nklsgod/AION-2-Character-Check):

| Qué | Endpoint |
|---|---|
| Búsqueda | `https://api-search.plaync.com/aion2global/search/v2/character?keyword=&region=&localeInfo=en-US` |
| Perfil | `https://aion2.plaync.com/api/character/info?region=&characterId=&serverId=&lang=en-US` |
| Equipo | `https://aion2.plaync.com/api/character/equipment?region=&characterId=&serverId=&lang=en-US` |

Regiones: `nae` (NA East), `naw` (NA West), `eu` (Europe), `la` (Latin America), `as` (Asia). Un código inválido **no da error**: la búsqueda devuelve una lista vacía. Los códigos viejos `sa` y `asia` se aceptan como alias.

Las respuestas se cachean 30 minutos. El botón "Actualizar" del dashboard saltea la cache.

### Formato real (verificado el 14/11/2026)

- **Búsqueda:** `{ list: [{ characterId (%-encodeado), name (con <strong>), race (1 = Elyos, 2 = Asmodians), pcId, level, serverId, serverName, profileImageUrl (ruta relativa a profileimg.plaync.com), region }], pagination }`.
- **Perfil:** `profile` (characterName, characterLevel, className, raceName, combatPower, serverName, profileImage), `stat.statList` (el GS es el stat `type: "ItemLevel"`), `title`, `daevanion.boardList`.
- **Equipo:** `equipment.equipmentList` (slotPosName, enchantLevel, exceedLevel, grade, name, icon). Incluye runas (`Rune1/2`) y cartas Arcana (`Arcana1..5`), que no cuentan para las reglas de +10/+15. `skinList` son skins y se ignoran. No trae item level por pieza.

La lectura (`src/lib/plaync/normalize.ts`) igual es **defensiva**: si NCSOFT cambia un campo, ese dato queda vacío y el dashboard pide cargarlo a mano. Si la API falla del todo, siempre está el **modo manual** (`/manual`).

**Si algo deja de leerse bien** (por ejemplo, el GS aparece como "—"):

1. Abrí `https://TU-DEPLOY.vercel.app/api/character?region=...&serverId=...&characterId=...&debug=1`. Esos parámetros los tenés en la URL del dashboard, `/c/{region}/{serverId}/{characterId}`. Para la búsqueda: `/api/search?name=TuNombre&region=la&debug=1`.
2. Mirá en el campo `raw` cómo se llama el dato ahora.
3. Agregá esa ruta en `src/lib/plaync/normalize.ts`, por ejemplo en la lista de `pick(profile, [...])` de `itemLevel`.
4. Agregá un fixture en `tests/fixtures/` con la respuesta real y corré `npm test`.

## Actualizar el contenido del juego

Todo lo que el dashboard recomienda está en `src/data/`:

| Archivo | Qué tiene |
|---|---|
| `activities.ts` | Cada actividad: cadencia (diaria, semanal, recarga con tope), requisitos de nivel/GS, tiers (ej. Transcendence Stage 1–4), consejos y fuentes |
| `phases.ts` | Las fases (Leveo, Tier 1…6) con el GS objetivo y en qué enfocarse |
| `gear.ts` | Reglas de equipo (+10 seguro, chances de +11..+15, orden de mejoras, CP extra) |
| `sources.ts` | Guías usadas |

Lo que está confirmado por los patch notes oficiales de NCSOFT tiene `confidence: "ok"` y la nota como fuente (`official-YYYY-MM-DD`). Lo que sale de guías comunitarias que no coinciden tiene `confidence: "disputed"`, y la UI le muestra un ⚠ con "verificá in-game". Si NCSOFT desactiva algo temporalmente, se marca con `disabled`.

### Revisión de patch notes

- La fecha de la última revisión está en `src/data/meta.ts`: hoy, patch notes oficiales hasta el **11/11/2026**, revisados el **14/11/2026**. También se ve en el pie de la página.
- El historial de qué cambió en cada revisión está en `docs/DATA_UPDATES.md`.
- Para la próxima, `npm run patch-notes` lista las notas oficiales publicadas después de esa fecha. El paso a paso para Claude está en `CLAUDE.md`.

La lista completa de fuentes está en la página **Guía de fases** (`/roadmap`) y en `src/data/sources.ts`.

## Estructura

```
src/
  app/                      páginas y rutas API
    page.tsx                inicio: búsqueda + personajes recientes
    c/[region]/[serverId]/[characterId]/page.tsx   dashboard del personaje
    manual/page.tsx         modo manual
    roadmap/page.tsx        guía completa de fases y escalera de GS
    api/search/route.ts     proxy de búsqueda
    api/character/route.ts  proxy de perfil + equipo
  components/               UI (dashboard, paneles, búsqueda)
  data/                     contenido del juego (editable)
  i18n/                     textos ES/EN
  lib/
    engine/                 motor de recomendaciones (función pura, testeada)
    plaync/                 cliente y normalización de la API
    time/                   resets y horarios de eventos
    storage/                progreso en localStorage
tests/                      Vitest + fixtures
```

## Aviso

Sitio de fans, sin relación con NCSOFT. AION es una marca de NCSOFT Corporation.

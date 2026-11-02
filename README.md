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

Regiones: `nae` (NA East), `naw` (NA West), `eu`, `sa` (Latin America), `asia`.

Las respuestas se cachean 30 minutos. El botón "Actualizar" del dashboard saltea la cache.

### ⚠ Esto no se pudo probar contra la API real

El entorno donde se desarrolló no tenía acceso de red a `plaync.com`. Por eso:

- La lectura de la respuesta (`src/lib/plaync/normalize.ts`) es **defensiva**: busca cada dato (nombre, nivel, GS, CP, equipo) en varias rutas posibles. Si alguno no aparece, queda vacío y el dashboard te pide que lo cargues a mano.
- Si la API falla del todo, siempre podés usar el **modo manual** (`/manual`): cargás nivel, GS y CP y obtenés el mismo dashboard.

**Si después de deployar algo no se lee bien** (por ejemplo, el GS aparece como "—"):

1. Abrí `https://TU-DEPLOY.vercel.app/api/character?region=...&serverId=...&characterId=...&debug=1`. Esos parámetros los tenés en la URL del dashboard, `/c/{region}/{serverId}/{characterId}`. Para la búsqueda: `/api/search?name=TuNombre&region=sa&debug=1`.
2. Mirá en el campo `raw` cómo se llama el dato en el JSON real.
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

Cuando las guías no coinciden en un número, la actividad tiene `confidence: "disputed"` y la UI muestra un ⚠ con "verificá in-game". Si NCSOFT desactiva algo temporalmente (hoy: **Ludra**), se marca con `disabled`.

Los datos se armaron con guías comunitarias de oct–nov 2026 (después del parche del 28/10). La lista completa está en la página **Guía de fases** (`/roadmap`) y en `src/data/sources.ts`.

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

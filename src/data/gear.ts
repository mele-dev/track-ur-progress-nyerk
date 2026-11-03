import type { GearRule, L10n } from "./types";

/** Hasta este nivel de enhance no hay chance de fallar (Epic y Unique). */
export const SAFE_ENHANCE = 10;
export const MAX_ENHANCE = 15;

/** Chance de éxito al pasar de +N a +N+1 (gear Unique), según las guías. */
export const ENHANCE_RATES: Record<number, number> = {
  10: 0.65,
  11: 0.5,
  12: 0.35,
  13: 0.25,
  14: 0.2,
};

/** Orden recomendado de mejoras (1.000–2.100 GS). */
export const UPGRADE_ORDER: L10n[] = [
  { es: "Cinturón y Amuleto", en: "Belt and Amulet" },
  { es: "Brazalete Unique", en: "Unique Bracelet" },
  { es: "Guard Unique", en: "Unique Guard" },
  { es: "Puntos de Daevanion", en: "Daevanion points" },
  { es: "Manastones baratas", en: "Cheap Manastones" },
  { es: "Arma principal", en: "Main weapon" },
  { es: "Todo lo demás", en: "Everything else" },
];

export const GEAR_RULES: GearRule[] = [
  {
    id: "daevanion",
    title: { es: "Gastá todos los puntos de Daevanion", en: "Spend every Daevanion point" },
    body: {
      es: "Cada Daevanion Crystal gastado suma +1 GS. Revisalo cada vez que juntes crystals (Sealed Dungeons, Nightmare, Spacetime Rift).",
      en: "Each Daevanion Crystal spent adds +1 GS. Check it whenever you collect crystals (Sealed Dungeons, Nightmare, Spacetime Rift).",
    },
    confidence: "ok",
    sources: ["skycoach-gs", "game8-endgame"],
  },
  {
    id: "safe-10",
    title: { es: "Todo a +10 primero", en: "Everything to +10 first" },
    body: {
      es: "Hasta +10 el enhance no falla en Epic y Unique. Llená todos los slots y llevalos a +10 antes de gastar en otros sistemas.",
      en: "Up to +10, enhancing can't fail on Epic and Unique. Fill every slot and take it to +10 before spending on other systems.",
    },
    confidence: "ok",
    sources: ["fextralife-enhance", "metabot-enhance", "game8-cp"],
  },
  {
    id: "past-10",
    title: { es: "Pasar de +10 solo en piezas definitivas", en: "Past +10 only on final pieces" },
    body: {
      es: "De +11 a +15 las chances son 65/50/35/25/20 %. Cada fallo suma +5 % al siguiente intento. Ir de +0 a +15 cuesta ~15 M de Kinah y ~190.000 piedras en promedio: hacelo en el arma y en piezas que vas a conservar.",
      en: "From +11 to +15 the odds are 65/50/35/25/20%. Each failure adds +5% to the next attempt. +0 to +15 costs ~15M Kinah and ~190,000 stones on average: do it on the weapon and pieces you'll keep.",
    },
    fromGs: 1600,
    confidence: "disputed",
    sources: ["fextralife-enhance", "metabot-enhance", "daevaguides-gear"],
  },
  {
    id: "order",
    title: { es: "Orden de mejoras", en: "Upgrade order" },
    body: {
      es: "Cinturón y Amuleto → Brazalete Unique → Guard Unique → puntos de Daevanion → Manastones baratas → arma principal → resto.",
      en: "Belt and Amulet → Unique Bracelet → Unique Guard → Daevanion points → cheap Manastones → main weapon → rest.",
    },
    fromGs: 1000,
    confidence: "ok",
    sources: ["skycoach-gs"],
  },
  {
    id: "manastones",
    title: { es: "Manastones y Soul Binding solo en equipo que se queda", en: "Manastones and Soul Binding only on keeper gear" },
    body: {
      es: "Las Manastones buenas y el soul binding son caros: ponelos en piezas que vas a usar mucho tiempo.",
      en: "Good Manastones and soul binding are expensive: put them on pieces you'll use for a long time.",
    },
    fromGs: 1400,
    confidence: "ok",
    sources: ["daevaguides-gear", "metabot-enhance"],
  },
  {
    id: "arcana",
    title: { es: "Cartas Arcana", en: "Arcana cards" },
    body: {
      es: "Salen de Transcendence. Suman CP (y según la guía, GS al reemplazar grises por azules ≈ +40). Reemplazá las de menor calidad primero.",
      en: "They drop in Transcendence. They add CP (and per some guides GS when swapping greys for blues ≈ +40). Replace the lowest quality first.",
    },
    fromGs: 1600,
    confidence: "disputed",
    sources: ["skycoach-gs", "allthings-cp", "game8-transcendence"],
  },
  {
    id: "cp-extras",
    title: { es: "CP extra fuera del equipo", en: "Extra CP outside gear" },
    body: {
      es: "Stigmas (de las fuentes más grandes de CP a largo plazo), alas, mascotas, títulos, colecciones/Closet y Pantheon. Suben CP pero no GS.",
      en: "Stigmas (one of the largest long-term CP sources), wings, pets, titles, collections/Closet and Pantheon. They raise CP, not GS.",
    },
    fromGs: 1000,
    confidence: "ok",
    sources: ["allthings-cp", "game8-cp"],
  },
];

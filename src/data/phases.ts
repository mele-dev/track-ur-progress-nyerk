import type { Phase } from "./types";

/**
 * Fases de progresión. Ordenadas de menor a mayor: la fase actual es la última
 * cuya condición (nivel y GS mínimos) se cumple.
 */
export const PHASES: Phase[] = [
  {
    id: "leveling",
    short: { es: "Leveo", en: "Leveling" },
    name: { es: "Leveo 1–45", en: "Leveling 1–45" },
    minLevel: 1,
    minGs: 0,
    goal: { es: "Llegar a nivel 45", en: "Reach level 45" },
    focus: [
      {
        es: "Seguí las misiones amarillas (Episode): dan casi toda la XP.",
        en: "Follow the yellow (Episode) quests: they give almost all the XP.",
      },
      {
        es: "Cuando la historia se trabe (22, 32, 45), llená la barra de Ascension con quests verdes, Sealed Dungeons y Strongholds.",
        en: "When the story locks (22, 32, 45), fill the Ascension gauge with green quests, Sealed Dungeons and Strongholds.",
      },
      {
        es: "No farmees monstruos ni gastes recursos en equipo de leveo.",
        en: "Don't grind mobs or spend resources on leveling gear.",
      },
    ],
    boost: ["episode-quests", "ascension-gates", "regional-quests", "sealed-dungeons", "strongholds"],
    sources: ["daevaguides-leveling", "game8-leveling", "keengamer-leveling"],
  },
  {
    id: "t1",
    short: { es: "Tier 1", en: "Tier 1" },
    name: { es: "Tier 1: recién 45 (≈700 GS)", en: "Tier 1: fresh 45 (~700 GS)" },
    minLevel: 45,
    minGs: 0,
    targetGs: 1000,
    goal: { es: "Llegar a 1.000 GS", en: "Reach 1,000 GS" },
    focus: [
      {
        es: "Limpiá lo de una sola vez que dejaste: quests regionales, Sealed Dungeons y Strongholds.",
        en: "Clear the one-time content you skipped: regional quests, Sealed Dungeons and Strongholds.",
      },
      {
        es: "Equipá Clash Runes (~60 GS cada una) y gastá todos los puntos de Daevanion (+1 GS c/u).",
        en: "Equip Clash Runes (~60 GS each) and spend every Daevanion point (+1 GS each).",
      },
      {
        es: "Farmeá Draupnir / Krao Cave (Exploration + Conquest) para el set amarillo de nivel 54.",
        en: "Farm Draupnir / Krao Cave (Exploration + Conquest) for the yellow level-54 set.",
      },
      { es: "Subí todo a +10 (es seguro).", en: "Take everything to +10 (it's safe)." },
    ],
    boost: ["regional-quests", "sealed-dungeons", "strongholds", "clash-runes", "expedition-exploration", "expedition-conquest", "nightmare"],
    pieceIlvl: 54,
    sources: ["game8-endgame", "corpus-gs", "mmogah-endgame", "skycoach-gs"],
  },
  {
    id: "t2",
    short: { es: "Tier 2", en: "Tier 2" },
    name: { es: "Tier 2: 1.000–1.399 GS", en: "Tier 2: 1,000–1,399 GS" },
    minLevel: 45,
    minGs: 1000,
    targetGs: 1400,
    goal: { es: "Llegar a 1.400 GS", en: "Reach 1,400 GS" },
    focus: [
      {
        es: "Se abren el Abyss, Ascension Trial (Easy) y Subjugation: usá todas las entradas semanales.",
        en: "Abyss, Ascension Trial (Easy) and Subjugation open: use every weekly entry.",
      },
      {
        es: "Orden de mejoras: Cinturón y Amuleto → Brazalete Unique → Guard Unique → Daevanion → Manastones baratas → arma.",
        en: "Upgrade order: Belt & Amulet → Unique Bracelet → Unique Guard → Daevanion → cheap Manastones → weapon.",
      },
    ],
    boost: ["ascension-trial", "abyss", "abyss-commands", "subjugation", "nightmare"],
    pieceIlvl: 54,
    sources: ["aion2turkiye-ladder", "corpus-gs", "skycoach-gs"],
  },
  {
    id: "t3",
    short: { es: "Tier 3", en: "Tier 3" },
    name: { es: "Tier 3: 1.400–1.599 GS", en: "Tier 3: 1,400–1,599 GS" },
    minLevel: 45,
    minGs: 1400,
    targetGs: 1600,
    goal: { es: "Llegar a 1.600 GS (Transcendence)", en: "Reach 1,600 GS (Transcendence)" },
    focus: [
      {
        es: "Pasate a Urugugu Canyon y Vakron Sky Island: reemplazá el equipo de quest por piezas de nivel 70.",
        en: "Move to Urugugu Canyon and Vakron Sky Island: replace quest gear with level-70 pieces.",
      },
      {
        es: "Con 1.500 GS el Ascension Trial Normal rinde mucho más que Easy.",
        en: "At 1,500 GS, Ascension Trial Normal pays much more than Easy.",
      },
      { es: "Empezá a subir mascotas.", en: "Start upgrading pets." },
    ],
    boost: ["expedition-conquest", "expedition-exploration", "ascension-trial"],
    pieceIlvl: 70,
    sources: ["skycoach-gs", "mein-mmo-gear", "aion2turkiye-ladder"],
  },
  {
    id: "t4",
    short: { es: "Tier 4", en: "Tier 4" },
    name: { es: "Tier 4: 1.600–2.099 GS", en: "Tier 4: 1,600–2,099 GS" },
    minLevel: 45,
    minGs: 1600,
    targetGs: 2100,
    goal: { es: "Llegar a 2.100 GS", en: "Reach 2,100 GS" },
    focus: [
      {
        es: "Transcendence todos los días: cartas Arcana (cambiar una gris por una azul ≈ +40 GS).",
        en: "Transcendence every day: Arcana cards (swapping a grey for a blue ≈ +40 GS).",
      },
      {
        es: "Sacá rango S para abrir el siguiente Stage (Stage 2 a 1.900 GS).",
        en: "Get an S rank to open the next Stage (Stage 2 at 1,900 GS).",
      },
      {
        es: "Ascension Trial Hard a 2.000 GS. Completá Manastones y llevá a +10 las piezas útiles.",
        en: "Ascension Trial Hard at 2,000 GS. Fill Manastones and take useful pieces to +10.",
      },
    ],
    boost: ["transcendence", "odyle-energy", "ascension-trial"],
    pieceIlvl: 70,
    sources: ["game8-transcendence", "skycoach-gs", "mmogah-endgame"],
  },
  {
    id: "t5",
    short: { es: "Tier 5", en: "Tier 5" },
    name: { es: "Tier 5: 2.100–2.799 GS", en: "Tier 5: 2,100–2,799 GS" },
    minLevel: 45,
    minGs: 2100,
    targetGs: 2800,
    goal: { es: "Llegar a 2.800 GS (raids)", en: "Reach 2,800 GS (raids)" },
    focus: [
      {
        es: "Fire Temple y Ferocious Horn Den: farmeá equipo de nivel 86.",
        en: "Fire Temple and Ferocious Horn Den: farm level-86 gear.",
      },
      {
        es: "Transcendence Stage 3 a 2.200 y Stage 4 a 2.500. Ascension Trial Extreme a 2.500.",
        en: "Transcendence Stage 3 at 2,200 and Stage 4 at 2,500. Ascension Trial Extreme at 2,500.",
      },
      {
        es: "Conquest Hard (Krao, Draupnir) a 2.600 GS; los grupos piden ~140–160k CP.",
        en: "Conquest Hard (Krao, Draupnir) at 2,600 GS; parties ask for ~140–160k CP.",
      },
    ],
    boost: ["transcendence", "expedition-conquest", "ascension-trial", "odyle-energy"],
    pieceIlvl: 86,
    sources: ["aion2turkiye-ladder", "game8-transcendence", "timesaver-hard", "corpus-gs"],
  },
  {
    id: "t6",
    short: { es: "Tier 6", en: "Tier 6" },
    name: { es: "Tier 6: 2.800+ GS (endgame)", en: "Tier 6: 2,800+ GS (endgame)" },
    minLevel: 45,
    minGs: 2800,
    targetGs: 3500,
    goal: { es: "Llegar a 3.500 GS (Hell)", en: "Reach 3,500 GS (Hell)" },
    focus: [
      {
        es: "Raids de Sanctuary (Ludra está desactivado temporalmente en Global).",
        en: "Sanctuary raids (Ludra is temporarily disabled on Global).",
      },
      {
        es: "Pasá de +10 solo en el arma y en piezas definitivas (+11..+15 tiene chance de fallar).",
        en: "Go past +10 only on the weapon and final pieces (+11..+15 can fail).",
      },
      {
        es: "CP extra: Stigmas, Arcana, alas, mascotas, títulos y Closet.",
        en: "Extra CP: Stigmas, Arcana, wings, pets, titles and Closet.",
      },
    ],
    boost: ["sanctuary-raids", "transcendence", "expedition-conquest"],
    pieceIlvl: 86,
    sources: ["aion2turkiye-ladder", "fextralife-enhance", "allthings-cp"],
  },
];

export const PHASE_BY_ID: Record<string, Phase> = Object.fromEntries(PHASES.map((p) => [p.id, p]));

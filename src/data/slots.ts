import type { L10n } from "./types";

/** Nombres de los slots de equipo que devuelve PLAYNC (slotPosName). */
const SLOT_NAMES: Record<string, L10n> = {
  MainHand: { es: "Arma", en: "Weapon" },
  SubHand: { es: "Mano secundaria", en: "Off-hand" },
  Helmet: { es: "Casco", en: "Helmet" },
  Shoulder: { es: "Hombreras", en: "Shoulders" },
  Torso: { es: "Pechera", en: "Chest" },
  Pants: { es: "Pantalones", en: "Pants" },
  Gloves: { es: "Guantes", en: "Gloves" },
  Boots: { es: "Botas", en: "Boots" },
  Cape: { es: "Capa", en: "Cape" },
  Necklace: { es: "Collar", en: "Necklace" },
  Earring: { es: "Aro", en: "Earring" },
  Ring: { es: "Anillo", en: "Ring" },
  Bracelet: { es: "Brazalete", en: "Bracelet" },
  Belt: { es: "Cinturón", en: "Belt" },
  Amulet: { es: "Amuleto", en: "Amulet" },
  Rune: { es: "Runa", en: "Rune" },
  Arcana: { es: "Arcana", en: "Arcana" },
};

/** "Ring2" → "Anillo 2"; slots desconocidos quedan como vienen. */
export function slotLabel(slot: string, locale: keyof L10n): string {
  const m = /^([A-Za-z]+?)(\d*)$/.exec(slot);
  if (!m) return slot;
  const base = SLOT_NAMES[slot] ?? SLOT_NAMES[m[1]];
  if (!base) return slot;
  return SLOT_NAMES[slot] || !m[2] ? base[locale] : `${base[locale]} ${m[2]}`;
}

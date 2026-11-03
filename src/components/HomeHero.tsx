"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

const POINTS = {
  es: [
    ["☀", "Qué hacer hoy", "Duty Missions, Nightmare, Odyle, Transcendence… ordenado por lo que más te conviene."],
    ["📅", "Esta semana", "Lo que se pierde el miércoles si no lo hacés."],
    ["🔓", "Qué tenés desbloqueado", "Y qué se abre con los próximos GS (ej. Transcendence Stage 4 a 2.500)."],
  ],
  en: [
    ["☀", "What to do today", "Duty Missions, Nightmare, Odyle, Transcendence… sorted by what pays off most."],
    ["📅", "This week", "What's lost on Wednesday if you skip it."],
    ["🔓", "What you've unlocked", "And what opens at your next GS (e.g. Transcendence Stage 4 at 2,500)."],
  ],
} as const;

export function HomeHero() {
  const { d, locale } = useI18n();
  return (
    <section className="pt-2">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        <span className="text-gold">AION 2</span> · {locale === "es" ? "¿qué hago hoy?" : "what do I do today?"}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">{d.tagline}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {POINTS[locale].map(([icon, title, body]) => (
          <li key={title} className="rounded-2xl border border-line bg-surface/70 p-4">
            <p className="text-lg" aria-hidden>
              {icon}
            </p>
            <p className="mt-1 font-semibold">{title}</p>
            <p className="mt-0.5 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">
        <Link href="/roadmap" className="text-gold underline decoration-dotted">
          {d.nav.roadmap} →
        </Link>
      </p>
    </section>
  );
}

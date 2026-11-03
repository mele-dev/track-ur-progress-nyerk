import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { I18nProvider } from "@/i18n/I18nProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aion 2 Progress", template: "%s · Aion 2 Progress" },
  description:
    "Dashboard para AION 2: buscá tu personaje y mirá qué hacer hoy, esta semana y qué desbloqueás según tu GS.",
};

export const viewport: Viewport = {
  themeColor: "#0a0d14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans">
        <I18nProvider>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { ManualView } from "@/components/ManualView";

export const metadata: Metadata = { title: "Modo manual" };

export default function ManualPage() {
  return (
    <Suspense>
      <ManualView />
    </Suspense>
  );
}

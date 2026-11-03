import type { Metadata } from "next";
import { RoadmapView } from "@/components/RoadmapView";

export const metadata: Metadata = { title: "Guía de fases" };

export default function RoadmapPage() {
  return <RoadmapView />;
}

import { HomeHero } from "@/components/HomeHero";
import { RecentList, SearchPanel } from "@/components/SearchPanel";

export default function Home() {
  return (
    <div className="space-y-5">
      <HomeHero />
      <SearchPanel />
      <RecentList />
    </div>
  );
}

import { NewsConsolidatorDashboard } from "@/components/news/news-consolidator-dashboard";
import { getNewsItems } from "@/lib/rss";

export default async function NewsConsolidatorPage() {
  const items = await getNewsItems();

  return <NewsConsolidatorDashboard items={items} />;
}

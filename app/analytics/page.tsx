import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getInstagramDashboardData } from "@/lib/instagram";

export default async function AnalyticsPage() {
  const instagram = await getInstagramDashboardData();

  return <AnalyticsDashboard instagram={instagram} />;
}
import { InstagramDashboard } from "@/components/instagram/instagram-dashboard";
import { getInstagramDashboardData } from "@/lib/instagram";

export default async function InstagramManagerPage() {
  const instagram = await getInstagramDashboardData();

  return <InstagramDashboard instagram={instagram} />;
}
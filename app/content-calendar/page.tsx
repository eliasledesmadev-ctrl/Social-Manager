import { ContentCalendarDashboard } from "@/components/calendar/content-calendar-dashboard";
import { getInstagramDashboardData } from "@/lib/instagram";

export default async function ContentCalendarPage() {
  const instagram = await getInstagramDashboardData();

  return <ContentCalendarDashboard instagram={instagram} />;
}
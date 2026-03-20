import {
  BarChart3,
  CalendarDays,
  Instagram,
  Newspaper,
  Radar,
} from "lucide-react";

export const navigationItems = [
  {
    key: "instagramManager",
    href: "/instagram-manager",
    icon: Instagram,
  },
  {
    key: "analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    key: "contentCalendar",
    href: "/content-calendar",
    icon: CalendarDays,
  },
  {
    key: "competitorsTracker",
    href: "/competitors-tracker",
    icon: Radar,
  },
  {
    key: "newsConsolidator",
    href: "/news-consolidator",
    icon: Newspaper,
  },
] as const;
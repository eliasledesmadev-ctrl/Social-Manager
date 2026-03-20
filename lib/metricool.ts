export type MetricoolPost = {
  id: number;
  title: string;
  format: "Reel" | "Carousel" | "Story" | "Static Post";
  impressions: number;
  engagementRate: number;
  saves: number;
  publishedAt: string;
};

export type MetricoolDailyMetric = {
  date: string;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
};

export type MetricoolAnalyticsData = {
  accountName: string;
  accountHandle: string;
  dateRange: {
    start: string;
    end: string;
  };
  totals: {
    impressions: number;
    engagementRate: number;
    followerGrowth: number;
  };
  dailyMetrics: MetricoolDailyMetric[];
  topPosts: MetricoolPost[];
};

export function getMetricoolAnalyticsData(
  startDate?: string,
  endDate?: string
): MetricoolAnalyticsData {
  return {
    accountName: "",
    accountHandle: "",
    dateRange: {
      start: startDate ?? "",
      end: endDate ?? "",
    },
    totals: {
      impressions: 0,
      engagementRate: 0,
      followerGrowth: 0,
    },
    dailyMetrics: [],
    topPosts: [],
  };
}
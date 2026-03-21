import { NextResponse } from "next/server";

import { getInstagramDashboardData } from "@/lib/instagram";

export async function GET() {
  const data = await getInstagramDashboardData();

  if (!data.connected) {
    return NextResponse.json({ error: "Instagram not connected", items: [] }, { status: 200 });
  }

  const items = data.recentMedia.slice(0, 3).map((item) => ({
    id: item.id,
    caption: item.caption,
    mediaType: item.mediaType,
    mediaUrl: item.mediaUrl,
    thumbnailUrl: item.thumbnailUrl,
    permalink: item.permalink,
    timestamp: item.timestamp,
    likeCount: item.likeCount,
    commentsCount: item.commentsCount,
    engagementRate: item.engagementRate,
    accountLabel: item.accountLabel,
  }));

  return NextResponse.json({ items });
}

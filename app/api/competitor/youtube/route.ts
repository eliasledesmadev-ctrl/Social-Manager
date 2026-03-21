import { type NextRequest, NextResponse } from "next/server";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const timeoutMs = 10_000;

type ChannelIdentifier =
  | { type: "id"; value: string }
  | { type: "handle"; value: string }
  | { type: "username"; value: string };

function extractChannelIdentifier(url: string): ChannelIdentifier | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) return null;

    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts[0] === "channel" && parts[1]) {
      return { type: "id", value: parts[1] };
    }
    if (parts[0] === "user" && parts[1]) {
      return { type: "username", value: parts[1] };
    }
    if (parts[0]?.startsWith("@")) {
      return { type: "handle", value: parts[0].slice(1) };
    }
    if (parts[0] && !["watch", "playlist", "shorts", "feed"].includes(parts[0])) {
      return { type: "username", value: parts[0] };
    }
    return null;
  } catch {
    return null;
  }
}

async function ytFetch(endpoint: string, params: Record<string, string>, apiKey: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL(`${YT_BASE}/${endpoint}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(body?.error?.message ?? `HTTP ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 503 });
  }

  const url = request.nextUrl.searchParams.get("url") ?? "";
  const identifier = extractChannelIdentifier(url);
  if (!identifier) {
    return NextResponse.json({ error: "Invalid YouTube channel URL" }, { status: 400 });
  }

  try {
    // Step 1: resolve channel
    const channelParams: Record<string, string> = {
      part: "snippet,statistics,contentDetails",
    };
    if (identifier.type === "id") channelParams.id = identifier.value;
    else if (identifier.type === "handle") channelParams.forHandle = identifier.value;
    else channelParams.forUsername = identifier.value;

    const channelData = await ytFetch("channels", channelParams, apiKey) as {
      items?: Array<{
        snippet?: { title?: string; customUrl?: string };
        statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
        contentDetails?: { relatedPlaylists?: { uploads?: string } };
      }>;
    };

    const channel = channelData?.items?.[0];
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const { snippet, statistics, contentDetails } = channel;
    const uploadsPlaylistId = contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return NextResponse.json({ error: "Could not find uploads playlist" }, { status: 502 });
    }

    // Step 2: get recent video IDs from uploads playlist (up to 50)
    const playlistData = await ytFetch(
      "playlistItems",
      { part: "contentDetails,snippet", playlistId: uploadsPlaylistId, maxResults: "50" },
      apiKey,
    ) as {
      items?: Array<{
        contentDetails?: { videoId?: string; videoPublishedAt?: string };
        snippet?: { publishedAt?: string };
      }>;
    };

    const playlistItems = playlistData?.items ?? [];
    const videoIds = playlistItems
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => Boolean(id));

    // Step 3: fetch video statistics
    const videoData = videoIds.length > 0
      ? await ytFetch(
          "videos",
          { part: "statistics,snippet", id: videoIds.slice(0, 50).join(",") },
          apiKey,
        ) as {
          items?: Array<{
            snippet?: { title?: string; publishedAt?: string };
            statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
          }>;
        }
      : { items: [] };

    const videos = videoData?.items ?? [];

    // Calculate posting frequency — posts in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentVideos = videos.filter((v) => {
      const published = new Date(v.snippet?.publishedAt ?? 0).getTime();
      return published >= thirtyDaysAgo;
    });
    const recentPostCount = recentVideos.length;
    const postingFrequency = Math.round((recentPostCount / 30) * 7 * 10) / 10;

    // Engagement rate from last 10 videos
    let totalLikes = 0;
    let totalViews = 0;
    let totalComments = 0;
    const recentTitles: string[] = [];

    for (const v of videos.slice(0, 10)) {
      const stats = v.statistics ?? {};
      totalLikes += Number(stats.likeCount ?? 0);
      totalViews += Number(stats.viewCount ?? 0);
      totalComments += Number(stats.commentCount ?? 0);
      if (recentTitles.length < 3 && v.snippet?.title) {
        recentTitles.push(v.snippet.title);
      }
    }

    const engagementRate =
      totalViews > 0
        ? Math.round(((totalLikes + totalComments) / totalViews) * 100 * 10) / 10
        : 0;

    const customUrl = snippet?.customUrl;
    const handle = customUrl
      ? customUrl.startsWith("@") ? customUrl : `@${customUrl}`
      : identifier.type === "handle"
        ? `@${identifier.value}`
        : "";

    const subscribers = statistics?.hiddenSubscriberCount
      ? null
      : Number(statistics?.subscriberCount ?? 0);

    return NextResponse.json({
      name: snippet?.title ?? "",
      handle,
      subscribers,
      recentPostCount,
      postingFrequency,
      engagementRate,
      recentTitles,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch YouTube data" }, { status: 502 });
  }
}

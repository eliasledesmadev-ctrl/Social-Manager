export type InstagramAccountKey = "primary" | "secondary";
export type InstagramAccountScope = "all" | InstagramAccountKey;

export type InstagramProfile = {
  id: string;
  username: string;
  name: string;
  followersCount: number;
  mediaCount: number;
};

export type InstagramMediaItem = {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string;
  permalink: string;
  timestamp: string;
  thumbnailUrl?: string;
  likeCount: number;
  commentsCount: number;
  engagementCount: number;
  engagementRate: number;
  accountKey: InstagramAccountKey;
  accountLabel: string;
};

export type InstagramAccountData = {
  key: InstagramAccountKey;
  label: string;
  pageId?: string;
  connected: boolean;
  profile: InstagramProfile | null;
  recentMedia: InstagramMediaItem[];
  allMedia: InstagramMediaItem[];
  topPerformer: InstagramMediaItem | null;
  averageEngagementRate: number;
  totalRecentEngagement: number;
  lastSync: string;
  error?: string;
};

export type InstagramDashboardData = {
  connected: boolean;
  profile: InstagramProfile | null;
  recentMedia: InstagramMediaItem[];
  allMedia: InstagramMediaItem[];
  topPerformer: InstagramMediaItem | null;
  averageEngagementRate: number;
  totalRecentEngagement: number;
  lastSync: string;
  accounts: InstagramAccountData[];
  error?: string;
};

type InstagramProfileResponse = {
  id: string;
  username: string;
  name: string;
  followers_count: number;
  media_count: number;
};

type InstagramMediaNode = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink: string;
  timestamp: string;
  thumbnail_url?: string;
  like_count?: number;
  comments_count?: number;
};

type InstagramMediaListResponse = {
  data: InstagramMediaNode[];
  paging?: {
    next?: string;
  };
};

type InstagramSourceEnv = {
  key: InstagramAccountKey;
  label: string;
  accessToken?: string;
  accountId?: string;
  pageId?: string;
};

const graphBaseUrl = "https://graph.facebook.com/v25.0";
const mediaFields =
  "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count";
const defaultRevalidateSeconds = 900;

function getInstagramSourceEnvs(): InstagramSourceEnv[] {
  return [
    {
      key: "primary",
      label: process.env.INSTAGRAM_LABEL || "TuCuervo",
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      accountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
      pageId: process.env.FACEBOOK_PAGE_ID,
    },
    {
      key: "secondary",
      label: process.env.INSTAGRAM_SECONDARY_LABEL || "Secondary account",
      accessToken: process.env.INSTAGRAM_SECONDARY_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN,
      accountId: process.env.INSTAGRAM_SECONDARY_BUSINESS_ACCOUNT_ID,
      pageId: process.env.INSTAGRAM_SECONDARY_PAGE_ID,
    },
  ];
}

async function fetchGraph<T>(accessToken: string, path: string, params: Record<string, string> = {}) {
  const search = new URLSearchParams({ access_token: accessToken, ...params });
  const response = await fetch(`${graphBaseUrl}/${path}?${search.toString()}`, {
    next: { revalidate: defaultRevalidateSeconds },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Instagram Graph error on ${path}`);
  }

  return (await response.json()) as T;
}

async function fetchMediaPage(url: string) {
  const response = await fetch(url, { next: { revalidate: defaultRevalidateSeconds } });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Instagram media paging request failed");
  }

  return (await response.json()) as InstagramMediaListResponse;
}

async function fetchAllMedia(accessToken: string, accountId: string) {
  const pages: InstagramMediaNode[] = [];
  let response = await fetchGraph<InstagramMediaListResponse>(accessToken, `${accountId}/media`, {
    fields: mediaFields,
    limit: "50",
  });

  pages.push(...response.data);

  while (response.paging?.next && pages.length < 1000) {
    response = await fetchMediaPage(response.paging.next);
    pages.push(...response.data);
  }

  return pages.slice(0, 1000);
}

function sortNewestFirst<T extends { timestamp: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function dedupeMedia(items: InstagramMediaItem[]) {
  const unique = new Map<string, InstagramMediaItem>();

  for (const item of sortNewestFirst(items)) {
    const key = item.permalink || item.id;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }

  return [...unique.values()];
}

function mapMediaItem(
  item: InstagramMediaNode,
  followersCount: number,
  accountKey: InstagramAccountKey,
  accountLabel: string
): InstagramMediaItem {
  const likeCount = item.like_count ?? 0;
  const commentsCount = item.comments_count ?? 0;
  const engagementCount = likeCount + commentsCount;
  const engagementRate = followersCount
    ? Number(((engagementCount / followersCount) * 100).toFixed(2))
    : 0;

  return {
    id: item.id,
    caption: item.caption ?? "Post without caption or unavailable in the API.",
    mediaType: item.media_type,
    mediaUrl: item.media_url ?? item.thumbnail_url ?? "",
    permalink: item.permalink,
    timestamp: item.timestamp,
    thumbnailUrl: item.thumbnail_url,
    likeCount,
    commentsCount,
    engagementCount,
    engagementRate,
    accountKey,
    accountLabel,
  };
}

function buildSummary(profile: InstagramProfile | null, media: InstagramMediaItem[]) {
  const allMedia = sortNewestFirst(media);
  const recentMedia = allMedia.slice(0, 12);
  const topPerformer = [...allMedia].sort((a, b) => b.engagementCount - a.engagementCount)[0] ?? null;
  const totalRecentEngagement = recentMedia.reduce((sum, item) => sum + item.engagementCount, 0);
  const averageEngagementRate = recentMedia.length
    ? Number(
        (
          recentMedia.reduce((sum, item) => sum + item.engagementRate, 0) /
          recentMedia.length
        ).toFixed(2)
      )
    : 0;

  return {
    profile,
    allMedia,
    recentMedia,
    topPerformer,
    totalRecentEngagement,
    averageEngagementRate,
  };
}

async function loadInstagramAccount(source: InstagramSourceEnv): Promise<InstagramAccountData> {
  const lastSync = new Date().toISOString();

  if (!source.accessToken || !source.accountId) {
    return {
      key: source.key,
      label: source.label,
      pageId: source.pageId,
      connected: false,
      profile: null,
      recentMedia: [],
      allMedia: [],
      topPerformer: null,
      averageEngagementRate: 0,
      totalRecentEngagement: 0,
      lastSync,
      error: `Missing credentials for ${source.label}.`,
    };
  }

  try {
    const [profileResponse, mediaResponse] = await Promise.all([
      fetchGraph<InstagramProfileResponse>(source.accessToken, source.accountId, {
        fields: "id,username,name,followers_count,media_count",
      }),
      fetchAllMedia(source.accessToken, source.accountId),
    ]);

    const profile: InstagramProfile = {
      id: profileResponse.id,
      username: profileResponse.username,
      name: profileResponse.name,
      followersCount: profileResponse.followers_count,
      mediaCount: profileResponse.media_count,
    };

    const mappedMedia = mediaResponse.map((item) =>
      mapMediaItem(item, profile.followersCount, source.key, source.label)
    );

    const summary = buildSummary(profile, mappedMedia);

    return {
      key: source.key,
      label: source.label,
      pageId: source.pageId,
      connected: true,
      profile: summary.profile,
      recentMedia: summary.recentMedia,
      allMedia: summary.allMedia,
      topPerformer: summary.topPerformer,
      averageEngagementRate: summary.averageEngagementRate,
      totalRecentEngagement: summary.totalRecentEngagement,
      lastSync,
    };
  } catch (error) {
    return {
      key: source.key,
      label: source.label,
      pageId: source.pageId,
      connected: false,
      profile: null,
      recentMedia: [],
      allMedia: [],
      topPerformer: null,
      averageEngagementRate: 0,
      totalRecentEngagement: 0,
      lastSync,
      error: error instanceof Error ? error.message : `Unknown Instagram error for ${source.label}`,
    };
  }
}

export async function getInstagramDashboardData(): Promise<InstagramDashboardData> {
  const accounts = await Promise.all(getInstagramSourceEnvs().map((source) => loadInstagramAccount(source)));
  const connectedAccounts = accounts.filter((account) => account.connected && account.profile);
  const mergedMedia = dedupeMedia(connectedAccounts.flatMap((account) => account.allMedia));
  const lastSync = new Date().toISOString();

  if (connectedAccounts.length === 0) {
    return {
      connected: false,
      profile: null,
      recentMedia: [],
      allMedia: [],
      topPerformer: null,
      averageEngagementRate: 0,
      totalRecentEngagement: 0,
      lastSync,
      accounts,
      error: accounts.map((account) => account.error).filter(Boolean).join(" | ") || "No Instagram accounts connected.",
    };
  }

  const combinedProfile: InstagramProfile = connectedAccounts.length === 1
    ? connectedAccounts[0].profile!
    : {
        id: "combined-tu-cuervo",
        username: "all-accounts",
        name: "TuCuervo Combined",
        followersCount: connectedAccounts.reduce(
          (sum, account) => sum + (account.profile?.followersCount ?? 0),
          0
        ),
        mediaCount: mergedMedia.length,
      };

  const summary = buildSummary(combinedProfile, mergedMedia);

  return {
    connected: true,
    profile: summary.profile,
    recentMedia: summary.recentMedia,
    allMedia: summary.allMedia,
    topPerformer: summary.topPerformer,
    averageEngagementRate: summary.averageEngagementRate,
    totalRecentEngagement: summary.totalRecentEngagement,
    lastSync,
    accounts,
  };
}

export type NewsTopic = "tools" | "research" | "business";

export type NewsItem = {
  id: string;
  headline: string;
  source: string;
  publishDate: string;
  summary: string;
  link: string;
  topic: NewsTopic;
};

type FeedSource = {
  name: string;
  url: string;
  topic: NewsTopic;
};

const feedSources: FeedSource[] = [
  {
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
    topic: "research",
  },
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    topic: "business",
  },
  {
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/feed/",
    topic: "business",
  },
  {
    name: "MarkTechPost",
    url: "https://www.marktechpost.com/feed/",
    topic: "research",
  },
  {
    name: "OpenAI News",
    url: "https://openai.com/news/rss.xml",
    topic: "tools",
  },
];

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value: string) {
  return decodeXmlEntities(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractLink(block: string) {
  const linkTag = extractTag(block, "link");
  if (linkTag) return stripHtml(linkTag);

  const atomHref = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i);
  return atomHref ? atomHref[1] : "";
}

function summarize(value: string, maxLength = 180) {
  const clean = stripHtml(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

function normalizeDate(value?: string) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function parseFeedXml(xml: string, source: FeedSource): NewsItem[] {
  const itemBlocks = [
    ...(xml.match(/<item[\s\S]*?<\/item>/gi) || []),
    ...(xml.match(/<entry[\s\S]*?<\/entry>/gi) || []),
  ];

  return itemBlocks
    .map((block, index) => {
      const headline = stripHtml(extractTag(block, "title"));
      const summaryRaw =
        extractTag(block, "description") ||
        extractTag(block, "summary") ||
        extractTag(block, "content") ||
        extractTag(block, "content:encoded");
      const publishDateRaw =
        extractTag(block, "pubDate") ||
        extractTag(block, "published") ||
        extractTag(block, "updated");
      const link = extractLink(block) || source.url;

      if (!headline) {
        return null;
      }

      return {
        id: `${source.name}-${index}-${headline}`,
        headline,
        source: source.name,
        publishDate: normalizeDate(publishDateRaw),
        summary: summarize(summaryRaw || headline),
        link,
        topic: source.topic,
      } satisfies NewsItem;
    })
    .filter((item): item is NewsItem => Boolean(item));
}

async function fetchFeed(source: FeedSource) {
  try {
    const response = await fetch(source.url, {
      next: { revalidate: 1800 },
      headers: {
        "User-Agent": "ContentDashboardBot/1.0",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseFeedXml(xml, source);
  } catch {
    return [];
  }
}

export async function getNewsItems() {
  const settled = await Promise.all(feedSources.map((source) => fetchFeed(source)));
  const items = settled.flat().sort((a, b) => {
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });

  return items.slice(0, 24);
}

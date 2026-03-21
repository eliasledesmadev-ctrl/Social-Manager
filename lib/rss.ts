/** Tema de un artículo o fuente — cadena libre para soportar temas personalizados por el usuario. */
export type NewsTopic = string;

export type NewsItem = {
  id: string;
  headline: string;
  source: string;
  publishDate: string;
  summary: string;
  link: string;
  topic: NewsTopic;
};

export type FeedSource = {
  name: string;
  url: string;
  topic: NewsTopic;
};

/**
 * Define un tema visible en el dashboard.
 * `id`    — clave usada en feeds y artículos.
 * `label` — nombre mostrado al usuario.
 * `color` — índice en la paleta de colores del componente.
 */
export type TopicDefinition = {
  id: string;
  label: string;
  color: number;
};

/** Temas por defecto orientados al nicho de motos de TuCuervo. */
export const defaultTopics: TopicDefinition[] = [
  { id: "noticias",   label: "Noticias",   color: 0 },
  { id: "eventos",    label: "Eventos",    color: 3 },
  { id: "tendencias", label: "Tendencias", color: 1 },
  { id: "tecnica",    label: "Tecnica",    color: 4 },
  { id: "comunidad",  label: "Comunidad",  color: 2 },
];

/** Fuentes RSS predeterminadas orientadas a motos. */
export const builtinFeedSources: FeedSource[] = [
  {
    name: "RevZilla Common Tread",
    url: "https://www.revzilla.com/common-tread/feed",
    topic: "tecnica",
  },
  {
    name: "Cycle World",
    url: "https://www.cycleworld.com/rss/all.xml/",
    topic: "noticias",
  },
  {
    name: "RideApart",
    url: "https://rideapart.com/rss/",
    topic: "noticias",
  },
  {
    name: "BikeExif",
    url: "https://www.bikeexif.com/feed",
    topic: "comunidad",
  },
  {
    name: "ADV Pulse",
    url: "https://www.advpulse.com/feed/",
    topic: "eventos",
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

export function parseFeedXml(xml: string, source: FeedSource): NewsItem[] {
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
      const link = validateHttpsUrl(extractLink(block)) || source.url;

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

const rssFetchTimeoutMs = 8_000; // 8 segundos por feed
const rssMaxBytes = 2 * 1024 * 1024; // 2 MB máximo por feed

/** Valida que una URL sea https:// para evitar javascript: y otros esquemas peligrosos. */
export function validateHttpsUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

async function fetchFeed(source: FeedSource) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), rssFetchTimeoutMs);

  try {
    const response = await fetch(source.url, {
      next: { revalidate: 1800 },
      signal: controller.signal,
      headers: {
        "User-Agent": "ContentDashboardBot/1.0",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      return [];
    }

    // Limitar tamaño de respuesta para evitar feeds maliciosos enormes
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > rssMaxBytes) {
      return [];
    }

    const xml = await response.text();
    if (xml.length > rssMaxBytes) {
      return [];
    }

    return parseFeedXml(xml, source);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function getNewsItems() {
  const settled = await Promise.all(builtinFeedSources.map((source) => fetchFeed(source)));
  const items = settled.flat().sort((a, b) => {
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });

  return items.slice(0, 24);
}

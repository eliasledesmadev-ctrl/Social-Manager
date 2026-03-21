import { type NextRequest, NextResponse } from "next/server";

import { validateHttpsUrl } from "@/lib/rss";

const timeoutMs = 8_000;

function decodeEntities(value: string): string {
  return value
    .replace(/&#0*64;/gi, "@")
    .replace(/&#x0*40;/gi, "@")
    .replace(/&#x22;/gi, '"')
    .replace(/&#0*34;/gi, '"')
    .replace(/&#x2022;/gi, "•")
    .replace(/&#8226;/gi, "•")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    // strip Instagram-style suffix: "Name (@handle) • caption..."
    .replace(/\s*\(@[^)]*\).*$/, "")
    .trim();
}
const maxReadBytes = 512 * 1024; // 512 KB — enough to capture <head>

function extractMeta(html: string, property: string): string {
  const byProperty = html.match(
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
  );
  if (byProperty) return byProperty[1].trim();

  // alternate attribute order
  const byContent = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
  );
  return byContent ? byContent[1].trim() : "";
}

function extractHandle(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (hostname.includes("instagram.com") || hostname.includes("tiktok.com")) {
      const raw = parts[0] ?? "";
      return raw ? `@${raw.replace(/^@/, "")}` : "";
    }
    if (hostname.includes("linkedin.com")) {
      const idx = parts.indexOf("company");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      const idx2 = parts.indexOf("in");
      if (idx2 !== -1 && parts[idx2 + 1]) return parts[idx2 + 1];
    }
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return parts[0] ? `@${parts[0].replace(/^@/, "")}` : "";
    }
    return parts[0] ?? "";
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") ?? "";
  const safeUrl = validateHttpsUrl(url);
  if (!safeUrl) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(safeUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Profile page unavailable" }, { status: 502 });
    }

    // Stream only the first chunk we need
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    const decoder = new TextDecoder();
    let html = "";
    let bytesRead = 0;

    while (bytesRead < maxReadBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      bytesRead += value.byteLength;
      if (html.includes("</head>")) break;
    }
    reader.cancel().catch(() => {});

    const rawName =
      extractMeta(html, "og:title") ||
      extractMeta(html, "og:site_name") ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      "";
    const name = decodeEntities(rawName);

    const handle = extractHandle(safeUrl);

    return NextResponse.json({
      name,
      handle,
      note: "followers_not_available_via_og",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

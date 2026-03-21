import { type NextRequest, NextResponse } from "next/server";

import { parseFeedXml, validateHttpsUrl, type NewsTopic } from "@/lib/rss";

const timeoutMs = 8_000;
const maxBytes = 2 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get("url") ?? "";
  const name = searchParams.get("name") ?? "Custom feed";
  const topic = (searchParams.get("topic") ?? "tools") as NewsTopic;

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
        "User-Agent": "ContentDashboardBot/1.0",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Feed unavailable" }, { status: 502 });
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > maxBytes) {
      return NextResponse.json({ error: "Feed too large" }, { status: 413 });
    }

    const xml = await response.text();
    if (xml.length > maxBytes) {
      return NextResponse.json({ error: "Feed too large" }, { status: 413 });
    }

    const items = parseFeedXml(xml, { name, url: safeUrl, topic });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Feed request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

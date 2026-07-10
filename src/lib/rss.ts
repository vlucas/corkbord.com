import Parser from "rss-parser";

export interface ParsedFeedItem {
  externalId: string;
  title: string | null;
  body: string;
  publishedAt: Date;
  raw: Record<string, unknown>;
}

const parser = new Parser({
  customFields: {
    item: ["content:encoded", "media:content"],
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchRssFeed(url: string): Promise<ParsedFeedItem[]> {
  const feed = await parser.parseURL(url);
  return (feed.items ?? []).map((item) => {
    const rawContent =
      item["content:encoded"] ?? item.content ?? item.contentSnippet ?? item.summary ?? "";
    const body =
      typeof rawContent === "string" && rawContent.includes("<")
        ? stripHtml(rawContent)
        : String(rawContent || item.title || "").trim();

    const externalId = item.guid || item.link || `${item.title}-${item.pubDate}`;
    const publishedAt = item.pubDate
      ? new Date(item.pubDate)
      : item.isoDate
        ? new Date(item.isoDate)
        : new Date();

    return {
      externalId: String(externalId),
      title: item.title?.trim() || null,
      body: body || item.title || "(no content)",
      publishedAt,
      raw: item as unknown as Record<string, unknown>,
    };
  });
}

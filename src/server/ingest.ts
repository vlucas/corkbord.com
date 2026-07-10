import { addMinutes } from "date-fns";
import { and, eq } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import {
  channelAccounts,
  channelSettings,
  contentItems,
  outboundPosts,
  sources,
  type OutboundStatus,
} from "~/src/db/schema.ts";
import { ID_PREFIX, newPublicId, newUuid } from "~/src/lib/ids.ts";
import { fetchRssFeed } from "~/src/lib/rss.ts";
import { ensureOutboundRows } from "~/src/server/outbound/queries.ts";
import { publishDuePosts } from "~/src/server/publish.ts";

let schedulerStarted = false;

export function ensureScheduler() {
  if (schedulerStarted || typeof setInterval === "undefined") return;
  schedulerStarted = true;

  // Ingest RSS hourly
  setInterval(
    () => {
      void runIngestAll();
    },
    60 * 60 * 1000,
  );

  // Publish due posts every minute
  setInterval(() => {
    void publishDuePosts();
  }, 60 * 1000);
}

export async function runIngestAll() {
  const rows = await db
    .select()
    .from(sources)
    .where(and(eq(sources.type, "rss"), eq(sources.enabled, true)));

  for (const source of rows) {
    const url = source.config?.url;
    if (!url) continue;
    try {
      await ingestRssSource(source.id, source.organizationId, url);
    } catch (err) {
      console.error("[ingest]", source.publicId, err);
    }
  }
}

export async function ingestRssSource(
  sourceId: string,
  organizationId: string,
  url: string,
): Promise<number> {
  const items = await fetchRssFeed(url);
  let inserted = 0;

  for (const item of items) {
    const existing = await db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(and(eq(contentItems.sourceId, sourceId), eq(contentItems.externalId, item.externalId)))
      .limit(1);

    if (existing[0]) continue;

    const [created] = await db
      .insert(contentItems)
      .values({
        id: newUuid(),
        publicId: newPublicId(ID_PREFIX.content),
        organizationId,
        sourceId,
        externalId: item.externalId,
        title: item.title,
        body: item.body,
        publishedAt: item.publishedAt,
        raw: item.raw,
      })
      .returning({ id: contentItems.id, publicId: contentItems.publicId });

    if (created) {
      await ensureOutboundRows(organizationId, created.id);
      await maybeAutoSchedule(organizationId, created.id);
      inserted++;
    }
  }

  await db
    .update(sources)
    .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
    .where(eq(sources.id, sourceId));

  return inserted;
}

async function maybeAutoSchedule(organizationId: string, contentItemId: string) {
  const rows = await db
    .select({
      outboundId: outboundPosts.id,
      mode: channelSettings.mode,
      delayMinutes: channelSettings.delayMinutes,
      enabled: channelSettings.enabled,
      status: outboundPosts.status,
    })
    .from(outboundPosts)
    .innerJoin(channelAccounts, eq(outboundPosts.channelAccountId, channelAccounts.id))
    .innerJoin(
      channelSettings,
      and(
        eq(channelSettings.channelAccountId, channelAccounts.id),
        eq(channelSettings.organizationId, organizationId),
      ),
    )
    .where(
      and(
        eq(outboundPosts.contentItemId, contentItemId),
        eq(outboundPosts.organizationId, organizationId),
      ),
    );

  for (const row of rows) {
    if (!row.enabled || row.mode !== "auto") continue;
    if (row.status !== "draft") continue;
    const scheduledFor = addMinutes(new Date(), row.delayMinutes);
    await db
      .update(outboundPosts)
      .set({
        status: "scheduled" satisfies OutboundStatus,
        scheduledFor,
        updatedAt: new Date(),
      })
      .where(eq(outboundPosts.id, row.outboundId));
  }
}

export async function runIngestForOrganization(organizationId: string): Promise<number> {
  const rssSources = await db
    .select()
    .from(sources)
    .where(
      and(
        eq(sources.organizationId, organizationId),
        eq(sources.type, "rss"),
        eq(sources.enabled, true),
      ),
    );

  let total = 0;
  for (const source of rssSources) {
    const url = source.config?.url;
    if (!url) continue;
    total += await ingestRssSource(source.id, organizationId, url);
  }
  return total;
}

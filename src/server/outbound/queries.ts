import { and, eq } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import { channelAccounts, channelSettings, contentItems, outboundPosts } from "~/src/db/schema.ts";
import { aiAdapt } from "~/src/lib/adapt/ai.ts";
import { ID_PREFIX, newPublicId, newUuid } from "~/src/lib/ids.ts";
import { publishDuePosts } from "~/src/server/publish.ts";
import type { OutboundPostDto } from "~/src/types/dto.ts";

export async function ensureOutboundRows(organizationId: string, contentItemId: string) {
  const accounts = await db
    .select()
    .from(channelAccounts)
    .where(
      and(eq(channelAccounts.organizationId, organizationId), eq(channelAccounts.status, "active")),
    );

  for (const account of accounts) {
    const [settings] = await db
      .select()
      .from(channelSettings)
      .where(
        and(
          eq(channelSettings.channelAccountId, account.id),
          eq(channelSettings.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (settings && !settings.enabled) continue;

    const [existing] = await db
      .select({ id: outboundPosts.id })
      .from(outboundPosts)
      .where(
        and(
          eq(outboundPosts.contentItemId, contentItemId),
          eq(outboundPosts.channelAccountId, account.id),
        ),
      )
      .limit(1);

    if (existing) continue;

    await db.insert(outboundPosts).values({
      id: newUuid(),
      publicId: newPublicId(ID_PREFIX.outbound),
      organizationId,
      contentItemId,
      channelAccountId: account.id,
      status: "pending_preview",
    });
  }
}

export async function listOutboundForContent(
  organizationId: string,
  contentPublicId: string,
): Promise<OutboundPostDto[]> {
  const [content] = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.publicId, contentPublicId),
        eq(contentItems.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!content) return [];
  await ensureOutboundRows(organizationId, content.id);

  const rows = await db
    .select({
      outbound: outboundPosts,
      channel: channelAccounts,
      settings: channelSettings,
    })
    .from(outboundPosts)
    .innerJoin(channelAccounts, eq(outboundPosts.channelAccountId, channelAccounts.id))
    .leftJoin(
      channelSettings,
      and(
        eq(channelSettings.channelAccountId, channelAccounts.id),
        eq(channelSettings.organizationId, organizationId),
      ),
    )
    .where(
      and(
        eq(outboundPosts.contentItemId, content.id),
        eq(outboundPosts.organizationId, organizationId),
      ),
    );

  return rows.map(({ outbound, channel, settings }) => ({
    publicId: outbound.publicId,
    channelPublicId: channel.publicId,
    provider: channel.provider,
    channelName:
      channel.targetName ??
      (typeof channel.profileMetadata?.username === "string"
        ? channel.profileMetadata.username
        : channel.provider),
    targetType: channel.targetType,
    adaptedBody: outbound.adaptedBody,
    status: outbound.status,
    scheduledFor: outbound.scheduledFor?.toISOString() ?? null,
    postedAt: outbound.postedAt?.toISOString() ?? null,
    externalPostId: outbound.externalPostId,
    error: outbound.error,
    mode: settings?.mode ?? "review",
    delayMinutes: settings?.delayMinutes ?? 0,
    channelEnabled: settings?.enabled ?? true,
  }));
}

export async function generatePreview(organizationId: string, outboundPublicId: string) {
  const [row] = await db
    .select({
      outbound: outboundPosts,
      channel: channelAccounts,
      content: contentItems,
    })
    .from(outboundPosts)
    .innerJoin(channelAccounts, eq(outboundPosts.channelAccountId, channelAccounts.id))
    .innerJoin(contentItems, eq(outboundPosts.contentItemId, contentItems.id))
    .where(
      and(
        eq(outboundPosts.publicId, outboundPublicId),
        eq(outboundPosts.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) throw new Error("Outbound post not found");

  const adapted = await aiAdapt(row.channel.provider, row.content.title, row.content.body);

  await db
    .update(outboundPosts)
    .set({
      adaptedBody: adapted,
      status: "draft",
      error: null,
      updatedAt: new Date(),
    })
    .where(eq(outboundPosts.id, row.outbound.id));

  return adapted;
}

export async function updateOutboundBody(
  organizationId: string,
  outboundPublicId: string,
  adaptedBody: string,
) {
  await db
    .update(outboundPosts)
    .set({
      adaptedBody,
      status: "draft",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(outboundPosts.publicId, outboundPublicId),
        eq(outboundPosts.organizationId, organizationId),
      ),
    );
}

export async function approveOutbound(organizationId: string, outboundPublicId: string) {
  const [row] = await db
    .select({
      outbound: outboundPosts,
      settings: channelSettings,
    })
    .from(outboundPosts)
    .leftJoin(
      channelSettings,
      and(
        eq(channelSettings.channelAccountId, outboundPosts.channelAccountId),
        eq(channelSettings.organizationId, organizationId),
      ),
    )
    .where(
      and(
        eq(outboundPosts.publicId, outboundPublicId),
        eq(outboundPosts.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row?.outbound.adaptedBody) throw new Error("Generate a preview before approving");

  const delay = row.settings?.delayMinutes ?? 0;
  const scheduledFor = new Date(Date.now() + delay * 60 * 1000);

  await db
    .update(outboundPosts)
    .set({
      status: "scheduled",
      scheduledFor,
      approvedAt: new Date(),
      error: null,
      updatedAt: new Date(),
    })
    .where(eq(outboundPosts.id, row.outbound.id));

  void publishDuePosts();
}

export async function skipOutbound(organizationId: string, outboundPublicId: string) {
  await db
    .update(outboundPosts)
    .set({ status: "skipped", updatedAt: new Date() })
    .where(
      and(
        eq(outboundPosts.publicId, outboundPublicId),
        eq(outboundPosts.organizationId, organizationId),
      ),
    );
}

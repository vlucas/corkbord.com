import { and, eq, lte } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import { channelAccounts, outboundPosts } from "~/src/db/schema.ts";
import { decryptToken } from "~/src/lib/crypto.ts";
import { postToLinkedIn } from "~/src/lib/channels/linkedin.ts";
import { postToX } from "~/src/lib/channels/x.ts";

export async function publishDuePosts(): Promise<void> {
  const now = new Date();
  const due = await db
    .select({
      outbound: outboundPosts,
      channel: channelAccounts,
    })
    .from(outboundPosts)
    .innerJoin(channelAccounts, eq(outboundPosts.channelAccountId, channelAccounts.id))
    .where(and(eq(outboundPosts.status, "scheduled"), lte(outboundPosts.scheduledFor, now)));

  for (const { outbound, channel } of due) {
    await db
      .update(outboundPosts)
      .set({ status: "posting", updatedAt: new Date() })
      .where(eq(outboundPosts.id, outbound.id));

    try {
      if (!channel.accessToken) throw new Error("Channel not connected");
      const token = decryptToken(channel.accessToken);
      const text = outbound.adaptedBody ?? "";

      let externalId: string;
      if (channel.provider === "x") {
        externalId = await postToX(token, text);
      } else if (channel.provider === "linkedin") {
        if (!channel.targetUrn) throw new Error("LinkedIn target not configured");
        externalId = await postToLinkedIn(token, channel.targetUrn, text);
      } else {
        throw new Error(`Unknown provider: ${channel.provider}`);
      }

      await db
        .update(outboundPosts)
        .set({
          status: "posted",
          postedAt: new Date(),
          externalPostId: externalId,
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(outboundPosts.id, outbound.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      await db
        .update(outboundPosts)
        .set({
          status: "failed",
          error: message,
          updatedAt: new Date(),
        })
        .where(eq(outboundPosts.id, outbound.id));

      await db
        .update(channelAccounts)
        .set({ lastError: message, status: "error", updatedAt: new Date() })
        .where(eq(channelAccounts.id, channel.id));
    }
  }
}

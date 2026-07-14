import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import { channelAccounts, channelSettings, oauthStates } from "~/src/db/schema.ts";
import { ID_PREFIX, newPublicId, newUuid, randomSlugSuffix } from "~/src/lib/ids.ts";
import type { ChannelAccountDto } from "~/src/types/dto.ts";
import { runIngestForOrganization } from "~/src/server/ingest.ts";
import { oauthBaseUrl } from "~/src/server/channels/oauth-redirect.ts";
import { linkedInScopeString } from "~/src/config/linkedin.ts";

export async function listChannels(organizationId: string): Promise<ChannelAccountDto[]> {
  const rows = await db
    .select({ account: channelAccounts, settings: channelSettings })
    .from(channelAccounts)
    .leftJoin(
      channelSettings,
      and(
        eq(channelSettings.channelAccountId, channelAccounts.id),
        eq(channelSettings.organizationId, organizationId),
      ),
    )
    .where(eq(channelAccounts.organizationId, organizationId));

  return rows.map(({ account, settings }) => ({
    publicId: account.publicId,
    provider: account.provider,
    targetType: account.targetType,
    targetName: account.targetName,
    status: account.status,
    lastError: account.lastError,
    mode: settings?.mode ?? "review",
    delayMinutes: settings?.delayMinutes ?? 0,
    enabled: settings?.enabled ?? true,
  }));
}

export async function startChannelOAuth(
  organizationId: string,
  userId: string,
  input: { provider: "x" | "linkedin"; targetType?: "personal" | "page" },
): Promise<string> {
  const state = randomSlugSuffix(24);
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = `${oauthBaseUrl()}/api/oauth/${input.provider}/callback`;

  await db.insert(oauthStates).values({
    id: newUuid(),
    state,
    organizationId,
    userId,
    provider: input.provider,
    targetType: input.targetType,
    codeVerifier: verifier,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  if (input.provider === "x") {
    const clientId = process.env.X_CLIENT_ID;
    if (!clientId) throw new Error("X OAuth not configured (X_CLIENT_ID)");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "tweet.read tweet.write users.read offline.access",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return `https://twitter.com/i/oauth2/authorize?${params}`;
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) throw new Error("LinkedIn OAuth not configured (LINKEDIN_CLIENT_ID)");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: linkedInScopeString(input.targetType),
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function updateChannelSettings(
  organizationId: string,
  input: {
    channelPublicId: string;
    mode?: "review" | "auto";
    delayMinutes?: number;
    enabled?: boolean;
  },
) {
  const [account] = await db
    .select()
    .from(channelAccounts)
    .where(
      and(
        eq(channelAccounts.publicId, input.channelPublicId),
        eq(channelAccounts.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!account) throw new Error("Channel not found");

  const [existing] = await db
    .select()
    .from(channelSettings)
    .where(
      and(
        eq(channelSettings.channelAccountId, account.id),
        eq(channelSettings.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(channelSettings)
      .set({
        ...(input.mode !== undefined ? { mode: input.mode } : {}),
        ...(input.delayMinutes !== undefined ? { delayMinutes: input.delayMinutes } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        updatedAt: new Date(),
      })
      .where(eq(channelSettings.id, existing.id));
  } else {
    await db.insert(channelSettings).values({
      id: newUuid(),
      publicId: newPublicId(ID_PREFIX.setting),
      organizationId,
      channelAccountId: account.id,
      mode: input.mode ?? "review",
      delayMinutes: input.delayMinutes ?? 0,
      enabled: input.enabled ?? true,
    });
  }
}

export async function disconnectChannel(organizationId: string, channelPublicId: string) {
  await db
    .delete(channelAccounts)
    .where(
      and(
        eq(channelAccounts.publicId, channelPublicId),
        eq(channelAccounts.organizationId, organizationId),
      ),
    );
}

export async function fetchSourcesNow(organizationId: string): Promise<number> {
  return runIngestForOrganization(organizationId);
}

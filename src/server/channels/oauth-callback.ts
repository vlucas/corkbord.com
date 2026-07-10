import { and, eq } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import {
  channelAccounts,
  channelSettings,
  oauthStates,
  type ChannelProvider,
  type LinkedInTargetType,
} from "~/src/db/schema.ts";
import { encryptToken } from "~/src/lib/crypto.ts";
import { ID_PREFIX, newPublicId, newUuid } from "~/src/lib/ids.ts";

function baseUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

function basicAuth(clientId: string, clientSecret: string): string {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export async function completeOAuthCallback(
  provider: ChannelProvider,
  code: string,
  state: string,
): Promise<{ redirect: string; error?: string }> {
  const [oauthState] = await db
    .select()
    .from(oauthStates)
    .where(eq(oauthStates.state, state))
    .limit(1);

  if (!oauthState || oauthState.provider !== provider) {
    return { redirect: "/app/channels?error=invalid_state" };
  }

  if (oauthState.expiresAt < new Date()) {
    await db.delete(oauthStates).where(eq(oauthStates.id, oauthState.id));
    return { redirect: "/app/channels?error=expired_state" };
  }

  const redirectUri = `${baseUrl()}/api/oauth/${provider}/callback`;

  try {
    if (provider === "x") {
      await connectX(oauthState, code, redirectUri);
    } else {
      await connectLinkedIn(oauthState, code, redirectUri);
    }
    await db.delete(oauthStates).where(eq(oauthStates.id, oauthState.id));
    return { redirect: "/app/channels?connected=1" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth failed";
    return { redirect: `/app/channels?error=${encodeURIComponent(message)}` };
  }
}

async function connectX(
  oauthState: typeof oauthStates.$inferSelect,
  code: string,
  redirectUri: string,
) {
  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET!;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: oauthState.codeVerifier ?? "",
    client_id: clientId,
  });

  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth(clientId, clientSecret)}`,
    },
    body,
  });

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    error?: string;
  };
  if (!res.ok) throw new Error(json.error ?? "X token exchange failed");

  const meRes = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${json.access_token}` },
  });
  const me = (await meRes.json()) as { data?: { username: string; name: string } };

  await upsertChannelAccount({
    organizationId: oauthState.organizationId,
    provider: "x",
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    targetName: me.data?.username ? `@${me.data.username}` : "X account",
    profileMetadata: me.data ?? {},
    targetType: null,
    targetUrn: null,
  });
}

async function connectLinkedIn(
  oauthState: typeof oauthStates.$inferSelect,
  code: string,
  redirectUri: string,
) {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    error_description?: string;
  };
  if (!res.ok) throw new Error(json.error_description ?? "LinkedIn token exchange failed");

  const { fetchLinkedInProfile, fetchLinkedInOrganizations } =
    await import("~/src/lib/channels/linkedin.ts");
  const profile = await fetchLinkedInProfile(json.access_token);

  let targetType: LinkedInTargetType = oauthState.targetType ?? "personal";
  let targetUrn = `urn:li:person:${profile.sub}`;
  let targetName = profile.name ?? "LinkedIn personal";

  if (targetType === "page") {
    const orgs = await fetchLinkedInOrganizations(json.access_token);
    const first = orgs[0];
    if (!first?.urn) throw new Error("No LinkedIn company pages found for this account");
    targetUrn = first.urn;
    targetName = first.name;
  }

  await upsertChannelAccount({
    organizationId: oauthState.organizationId,
    provider: "linkedin",
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    targetName,
    profileMetadata: profile as unknown as Record<string, unknown>,
    targetType,
    targetUrn,
  });
}

async function upsertChannelAccount(input: {
  organizationId: string;
  provider: ChannelProvider;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  targetName: string;
  profileMetadata: Record<string, unknown>;
  targetType: LinkedInTargetType | null;
  targetUrn: string | null;
}) {
  const [existing] = await db
    .select()
    .from(channelAccounts)
    .where(
      and(
        eq(channelAccounts.organizationId, input.organizationId),
        eq(channelAccounts.provider, input.provider),
      ),
    )
    .limit(1);

  const values = {
    accessToken: encryptToken(input.accessToken),
    refreshToken: input.refreshToken ? encryptToken(input.refreshToken) : null,
    tokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
    profileMetadata: input.profileMetadata,
    targetType: input.targetType,
    targetUrn: input.targetUrn,
    targetName: input.targetName,
    status: "active" as const,
    lastError: null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(channelAccounts).set(values).where(eq(channelAccounts.id, existing.id));
    return;
  }

  const [created] = await db
    .insert(channelAccounts)
    .values({
      id: newUuid(),
      publicId: newPublicId(ID_PREFIX.channel),
      organizationId: input.organizationId,
      provider: input.provider,
      ...values,
    })
    .returning({ id: channelAccounts.id });

  await db.insert(channelSettings).values({
    id: newUuid(),
    publicId: newPublicId(ID_PREFIX.setting),
    organizationId: input.organizationId,
    channelAccountId: created!.id,
    mode: "review",
    delayMinutes: 0,
    enabled: true,
  });
}

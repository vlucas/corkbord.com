import { eq } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import { member } from "~/src/db/schema.ts";
import { betterAuth } from "~/src/server/auth/index.ts";
import { randomSlugSuffix } from "~/src/lib/ids.ts";

/** Create "My Organization" if the user has none; set active org on session. */
export async function ensureDefaultOrganization(userId: string, headers: Headers): Promise<string> {
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1);

  if (memberships[0]) {
    const orgId = memberships[0].organizationId;
    await betterAuth.api.setActiveOrganization({
      body: { organizationId: orgId },
      headers,
    });
    return orgId;
  }

  const slug = `my-organization-${randomSlugSuffix()}`;
  const created = await betterAuth.api.createOrganization({
    body: {
      name: "My Organization",
      slug,
      userId,
      keepCurrentActiveOrganization: false,
    },
    headers,
  });

  if (!created?.id) {
    throw new Error("Failed to create default organization");
  }

  await betterAuth.api.setActiveOrganization({
    body: { organizationId: created.id },
    headers,
  });

  return created.id;
}

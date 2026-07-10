import type { Hyperspan as HS } from "@hyperspan/framework";
import type { User } from "better-auth";
import { ensureDefaultOrganization } from "~/src/server/auth/ensure-default-org.ts";
import { requireActiveUser } from "~/src/server/auth/get-active-user.ts";
import { ensureManualSource } from "~/src/server/sources/queries.ts";

export interface ActiveOrgContext {
  user: User;
  organizationId: string;
}

export async function requireActiveOrgUser(c: HS.Context): Promise<ActiveOrgContext> {
  const user = await requireActiveUser(c);
  let organizationId = c.vars.activeOrganizationId as string | undefined;

  if (!organizationId) {
    const session = c.vars.activeSession;
    organizationId = session?.activeOrganizationId ?? undefined;
  }

  if (!organizationId) {
    organizationId = await ensureDefaultOrganization(user.id, c.req.raw.headers);
  }

  await ensureManualSource(organizationId);
  c.vars.activeOrganizationId = organizationId;

  return { user, organizationId };
}

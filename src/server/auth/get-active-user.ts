import { HTTPResponseException } from "@hyperspan/framework";
import type { User } from "better-auth";
import type { Hyperspan as HS } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";

export async function getActiveUser(c: HS.Context): Promise<User | null> {
  if (c.vars.activeUser !== undefined) {
    return c.vars.activeUser;
  }

  const session = await betterAuth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.vars.activeUser = null;
    c.vars.activeSession = null;
    return null;
  }

  c.vars.activeUser = session.user;
  c.vars.activeSession = session.session;
  return session.user;
}

export async function requireActiveUser(c: HS.Context): Promise<User> {
  const user = await getActiveUser(c);
  if (!user) {
    const returnPath = encodeURIComponent(new URL(c.req.url).pathname + new URL(c.req.url).search);
    throw new HTTPResponseException(undefined, {
      status: 302,
      headers: { Location: `/login?returnPath=${returnPath}` },
    });
  }
  return user;
}

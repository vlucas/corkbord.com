import type { Hyperspan as HS } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";

export const betterAuthMiddleware: HS.MiddlewareFunction = async (c, next) => {
  const session = await betterAuth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.res.redirect("/login");
  }

  c.vars.activeSession = session.session;
  c.vars.activeUser = session.user;
  return next();
};

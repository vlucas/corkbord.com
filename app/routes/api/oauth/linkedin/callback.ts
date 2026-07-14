import { createRoute } from "@hyperspan/framework";
import { completeOAuthCallback } from "~/src/server/channels/oauth-callback.ts";
import { parseOAuthCallback } from "~/src/server/channels/oauth-redirect.ts";

export default createRoute().get(async (c) => {
  const parsed = parseOAuthCallback(c);
  if (!parsed.ok) {
    return c.res.redirect(parsed.redirect);
  }

  const result = await completeOAuthCallback("linkedin", parsed.code, parsed.state);
  return c.res.redirect(result.redirect);
});

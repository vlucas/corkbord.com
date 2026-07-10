// app/routes/api/oauth/linkedin/callback.ts
import { createRoute } from "@hyperspan/framework";
import { completeOAuthCallback } from "~/src/server/channels/oauth-callback.ts";
var callback_default = createRoute().get(async (c) => {
  const code = c.route.query.code;
  const state = c.route.query.state;
  if (!code || !state) {
    return c.res.redirect("/app/channels?error=missing_code");
  }
  const result = await completeOAuthCallback("linkedin", String(code), String(state));
  return c.res.redirect(result.redirect);
});
export { callback_default as default };

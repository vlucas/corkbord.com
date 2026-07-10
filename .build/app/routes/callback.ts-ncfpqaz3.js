// app/routes/api/oauth/x/callback.ts
import { createRoute } from "@hyperspan/framework";
import { completeOAuthCallback } from "~/src/server/channels/oauth-callback.ts";
var callback_default = createRoute().get(async (c) => {
  const code = c.req.query.get("code");
  const state = c.req.query.get("state");
  if (!code || !state) {
    return c.res.redirect("/app/channels?error=missing_code");
  }
  const result = await completeOAuthCallback("x", String(code), String(state));
  return c.res.redirect(result.redirect);
});
export {
  callback_default as default
};

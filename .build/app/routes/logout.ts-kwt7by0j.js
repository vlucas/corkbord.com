// app/routes/logout.ts
import { createRoute } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";
var logout_default = createRoute().post(async (c) => {
  await betterAuth.api.signOut({ headers: c.req.raw.headers, asResponse: true });
  return c.res.redirect("/login");
});
export { logout_default as default };

import { createRoute } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";

export default createRoute().post(async (c) => {
  await betterAuth.api.signOut({
    headers: c.req.raw.headers,
  });
  return c.res.redirect("/login");
});

import { createRoute } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";

export default createRoute().all(async (c) => {
  return betterAuth.handler(c.req.raw);
});

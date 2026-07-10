// app/routes/api/auth/[...all].ts
import { createRoute } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";
var __all__default = createRoute().all(async (c) => {
  return betterAuth.handler(c.req.raw);
});
export {
  __all__default as default
};

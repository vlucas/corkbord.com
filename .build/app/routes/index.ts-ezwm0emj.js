// app/routes/app/index.ts
import { createRoute } from "@hyperspan/framework";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import AppLayout from "~/app/layouts/app-layout.ts";
import { renderFeedContent } from "~/src/ui/content-feed.ts";
var app_default = createRoute().get(async (c) => {
  const { user, organizationId } = await requireActiveOrgUser(c);
  const selectedId = c.req.query.get("content");
  const content = renderFeedContent(c, organizationId, selectedId);
  return AppLayout(c, {
    title: "Feed",
    userName: user.name,
    content
  });
}).use(betterAuthMiddleware);
export {
  app_default as default
};

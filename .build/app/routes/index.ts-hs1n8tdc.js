// app/routes/app/index.ts
import { createRoute } from "@hyperspan/framework";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";

// app/layouts/app-layout.ts
import { html as html2 } from "@hyperspan/html";

// app/layouts/base-layout.ts
import { html } from "@hyperspan/html";
import { hyperspanScriptTags, hyperspanStyleTags } from "@hyperspan/framework/layout";
function BaseLayout(c, { title, content }) {
  return html`<!doctype html>
    <html lang="en" data-theme="corkbord">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title} | Corkbord</title>
        ${hyperspanStyleTags(c)}
      </head>
      <body class="cork-bg min-h-screen">
        ${hyperspanScriptTags()} ${content}
      </body>
    </html>`;
}

// app/layouts/app-layout.ts
function AppLayout(c, { title, content, userName }) {
  const path = c.req.url.pathname;
  return BaseLayout(c, {
    title,
    content: html2`
      <div class="min-h-screen">
        <header class="border-base-300 bg-base-100/80 sticky top-0 z-10 border-b backdrop-blur-sm">
          <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <a href="/app" class="font-display text-primary text-xl font-semibold no-underline"
              >Corkbord</a
            >
            <nav class="flex flex-wrap items-center gap-1 text-sm">
              <a href="/app" class="btn btn-ghost btn-sm ${path === "/app" ? "btn-active" : ""}"
                >Feed</a
              >
              <a
                href="/app/sources"
                class="btn btn-ghost btn-sm ${path === "/app/sources" ? "btn-active" : ""}"
                >Sources</a
              >
              <a
                href="/app/channels"
                class="btn btn-ghost btn-sm ${path === "/app/channels" ? "btn-active" : ""}"
                >Channels</a
              >
            </nav>
            <div class="flex items-center gap-2">
              <span class="text-base-content/60 hidden text-sm sm:inline">${userName}</span>
              <form method="post" action="/logout">
                <button type="submit" class="btn btn-ghost btn-sm">Sign out</button>
              </form>
            </div>
          </div>
        </header>
        <main class="mx-auto max-w-6xl px-4 py-6">${content}</main>
      </div>
    `
  });
}

// app/routes/app/index.ts
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

// app/routes/app/sources.ts
import { html as html3, placeholder } from "@hyperspan/html";
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

// app/routes/app/sources.ts
import CreateRssSourceAction from "~/app/actions/create-rss-source-action.ts";
import FetchSourcesNowAction from "~/app/actions/fetch-sources-now-action.ts";
import ToggleSourceAction from "~/app/actions/toggle-source-action.ts";
import { listSources } from "~/src/server/sources/queries.ts";
var sources_default = createRoute().get(async (c) => {
  const { user, organizationId } = await requireActiveOrgUser(c);
  const content = html3`
      <div class="mx-auto max-w-2xl space-y-6">
        <div class="content-card shadow-sm">
          <div class="flex flex-col gap-4">
            <div>
              <h1 class="font-display text-2xl font-semibold m-0">Content sources</h1>
              <p class="text-base-content/70 mt-1 text-sm m-0">
                RSS feeds are fetched hourly and on demand. Manual entries use the built-in Manual
                source.
              </p>
            </div>
            ${CreateRssSourceAction.render(c)}
          </div>
        </div>

        <div class="flex justify-end">${FetchSourcesNowAction.render(c)}</div>

        ${placeholder(html3`<p class="text-base-content/60">Loading…</p>`, renderSourcesList(c, organizationId))}
      </div>
    `;
  return AppLayout(c, { title: "Sources", userName: user.name, content });
}).use(betterAuthMiddleware);
async function renderSourcesList(c, organizationId) {
  const sources = await listSources(organizationId);
  return html3`
    <ul class="space-y-2">
      ${sources.map((s) => html3`
          <li class="content-card shadow-sm">
            <div class="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-semibold m-0">${s.name}</p>
                <p class="text-base-content/60 text-xs m-0">
                  ${s.type}${s.config.url ? html3` · ${s.config.url}` : ""}
                </p>
                ${s.lastFetchedAt ? html3`<p class="text-base-content/50 text-xs m-0">
                      Last fetched ${new Date(s.lastFetchedAt).toLocaleString()}
                    </p>` : ""}
              </div>
              ${s.type === "rss" ? ToggleSourceAction.render(c, {
    data: { publicId: s.publicId, enabled: s.enabled ? "true" : "false" }
  }) : html3`<span class="badge badge-ghost">built-in</span>`}
            </div>
          </li>
        `)}
    </ul>
  `;
}
export {
  sources_default as default
};

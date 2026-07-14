import { html, placeholder } from "@hyperspan/html";
import { createRoute } from "@hyperspan/framework";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import AppLayout from "~/app/layouts/app-layout";
import CreateRssSourceAction from "~/app/actions/create-rss-source-action.ts";
import FetchSourcesNowAction from "~/app/actions/fetch-sources-now-action.ts";
import ToggleSourceAction from "~/app/actions/toggle-source-action.ts";
import UpdateRssSourceNameAction from "~/app/actions/update-rss-source-name-action.ts";
import { listSources } from "~/src/server/sources/queries.ts";

export default createRoute()
  .get(async (c) => {
    const { user, organizationId } = await requireActiveOrgUser(c);
    const added = c.req.query.get("added") === "1";

    const content = html`
      <div class="mx-auto max-w-2xl space-y-6">
        ${added
          ? html`<div class="alert alert-success text-sm">RSS source added and fetched.</div>`
          : ""}
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

        ${placeholder(
          html`<p class="text-base-content/60">Loading…</p>`,
          renderSourcesList(c, organizationId),
        )}
      </div>
    `;

    return AppLayout(c, { title: "Sources", userName: user.name, content });
  })
  .use(betterAuthMiddleware);

async function renderSourcesList(
  c: Parameters<typeof ToggleSourceAction.render>[0],
  organizationId: string,
) {
  const sources = await listSources(organizationId);

  return html`
    <ul class="space-y-2">
      ${sources.map(
        (s) => html`
          <li class="content-card shadow-sm">
            <div class="flex flex-col gap-3">
              <div class="flex flex-row flex-wrap items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  ${s.type === "rss"
                    ? UpdateRssSourceNameAction.render(c, {
                        data: { publicId: s.publicId, name: s.name },
                      })
                    : html`<p class="font-semibold m-0">${s.name}</p>`}
                  <p class="text-base-content/60 text-xs m-0">
                    ${s.type}${s.config.url ? html` · ${s.config.url}` : ""}
                  </p>
                  ${s.lastFetchedAt
                    ? html`<p class="text-base-content/50 text-xs m-0">
                        Last fetched ${new Date(s.lastFetchedAt).toLocaleString()}
                      </p>`
                    : ""}
                </div>
                ${s.type === "rss"
                  ? ToggleSourceAction.render(c, {
                      data: { publicId: s.publicId, enabled: s.enabled ? "true" : "false" },
                    })
                  : html`<span class="badge badge-ghost">built-in</span>`}
              </div>
            </div>
          </li>
        `,
      )}
    </ul>
  `;
}

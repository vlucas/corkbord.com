// app/routes/app/channels.ts
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

// app/routes/app/channels.ts
import DisconnectChannelAction from "~/app/actions/disconnect-channel-action.ts";
import StartChannelOAuthAction from "~/app/actions/start-channel-oauth-action.ts";
import UpdateChannelSettingsAction from "~/app/actions/update-channel-settings-action.ts";
import { listChannels } from "~/src/server/channels/queries.ts";
import { accentColor, accentDot } from "~/src/ui/accent.ts";
var channels_default = createRoute().get(async (c) => {
  const { user, organizationId } = await requireActiveOrgUser(c);
  const error = c.req.query.get("error");
  const connected = c.req.query.get("connected") === "1";
  const content = html3`
      <div class="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 class="font-display text-2xl font-semibold m-0">Outbound channels</h1>
          <p class="text-base-content/70 mt-1 text-sm m-0">
            Connect X and LinkedIn. LinkedIn can post to your personal feed or a company page you
            admin.
          </p>
        </div>

        ${error ? html3`<div class="alert alert-error text-sm">${decodeURIComponent(String(error))}</div>` : ""}
        ${connected ? html3`<div class="alert alert-success text-sm">Channel connected successfully.</div>` : ""}
        ${placeholder(html3`<p class="text-base-content/60">Loading…</p>`, renderChannelsPage(c, organizationId))}
      </div>
    `;
  return AppLayout(c, { title: "Channels", userName: user.name, content });
}).use(betterAuthMiddleware);
async function renderChannelsPage(c, organizationId) {
  const channels = await listChannels(organizationId);
  const hasX = channels.some((ch) => ch.provider === "x");
  const hasLinkedIn = channels.some((ch) => ch.provider === "linkedin");
  return html3`
    <div class="space-y-6">
      <div class="flex flex-wrap gap-2">
        ${!hasX ? StartChannelOAuthAction.render(c, { data: { provider: "x" } }) : ""}
        ${!hasLinkedIn ? html3`
              ${StartChannelOAuthAction.render(c, {
    data: { provider: "linkedin", targetType: "personal" }
  })}
              ${StartChannelOAuthAction.render(c, {
    data: { provider: "linkedin", targetType: "page" }
  })}
            ` : ""}
      </div>

      <ul class="space-y-3">
        ${channels.map((ch, i) => html3`
            <li class="content-card shadow-sm">
              <div class="flex flex-col gap-3 p-4">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 class="flex items-center gap-2 font-semibold capitalize m-0">
                      ${accentDot(accentColor(i))} ${ch.provider === "x" ? "X" : "LinkedIn"}
                    </h2>
                    <p class="text-base-content/60 text-sm m-0">${ch.targetName ?? "Connected"}</p>
                    ${ch.targetType ? html3`<p class="text-base-content/50 text-xs capitalize m-0">
                          ${ch.targetType} feed
                        </p>` : ""}
                    <span
                      class="badge badge-sm mt-1 ${ch.status === "active" ? "badge-success" : "badge-error"}"
                      >${ch.status}</span
                    >
                    ${ch.lastError ? html3`<p class="text-error mt-1 text-xs m-0">${ch.lastError}</p>` : ""}
                  </div>
                  ${DisconnectChannelAction.render(c, { data: { channelPublicId: ch.publicId } })}
                </div>
                ${UpdateChannelSettingsAction.render(c, {
    data: {
      channelPublicId: ch.publicId,
      mode: ch.mode,
      delayMinutes: ch.delayMinutes,
      enabled: ch.enabled ? "true" : "false"
    }
  })}
              </div>
            </li>
          `)}
      </ul>
    </div>
  `;
}
export {
  channels_default as default
};

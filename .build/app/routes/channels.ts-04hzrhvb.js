// app/routes/app/channels.ts
import { html, placeholder } from "@hyperspan/html";
import { createRoute } from "@hyperspan/framework";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import AppLayout from "~/app/layouts/app-layout.ts";
import DisconnectChannelAction from "~/app/actions/disconnect-channel-action.ts";
import StartChannelOAuthAction from "~/app/actions/start-channel-oauth-action.ts";
import UpdateChannelSettingsAction from "~/app/actions/update-channel-settings-action.ts";
import { listChannels } from "~/src/server/channels/queries.ts";
import { accentColor, accentDot } from "~/src/ui/accent.ts";
var channels_default = createRoute()
  .get(async (c) => {
    const { user, organizationId } = await requireActiveOrgUser(c);
    const error = c.route.query.error;
    const connected = c.route.query.connected === "1";
    const content = html`
      <div class="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 class="font-display text-2xl font-semibold m-0">Outbound channels</h1>
          <p class="text-base-content/70 mt-1 text-sm m-0">
            Connect X and LinkedIn. LinkedIn can post to your personal feed or a company page you
            admin.
          </p>
        </div>

        ${error
          ? html`<div class="alert alert-error text-sm">${decodeURIComponent(String(error))}</div>`
          : ""}
        ${connected
          ? html`<div class="alert alert-success text-sm">Channel connected successfully.</div>`
          : ""}
        ${placeholder(
          html`<p class="text-base-content/60">Loading…</p>`,
          renderChannelsPage(c, organizationId),
        )}
      </div>
    `;
    return AppLayout(c, { title: "Channels", userName: user.name, content });
  })
  .use(betterAuthMiddleware);
async function renderChannelsPage(c, organizationId) {
  const channels = await listChannels(organizationId);
  const hasX = channels.some((ch) => ch.provider === "x");
  const hasLinkedIn = channels.some((ch) => ch.provider === "linkedin");
  return html`
    <div class="space-y-6">
      <div class="flex flex-wrap gap-2">
        ${!hasX ? StartChannelOAuthAction.render(c, { data: { provider: "x" } }) : ""}
        ${!hasLinkedIn
          ? html`
              ${StartChannelOAuthAction.render(c, {
                data: { provider: "linkedin", targetType: "personal" },
              })}
              ${StartChannelOAuthAction.render(c, {
                data: { provider: "linkedin", targetType: "page" },
              })}
            `
          : ""}
      </div>

      <ul class="space-y-3">
        ${channels.map(
          (ch, i) => html`
            <li class="content-card shadow-sm">
              <div class="flex flex-col gap-3 p-4">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 class="flex items-center gap-2 font-semibold capitalize m-0">
                      ${accentDot(accentColor(i))} ${ch.provider === "x" ? "X" : "LinkedIn"}
                    </h2>
                    <p class="text-base-content/60 text-sm m-0">${ch.targetName ?? "Connected"}</p>
                    ${ch.targetType
                      ? html`<p class="text-base-content/50 text-xs capitalize m-0">
                          ${ch.targetType} feed
                        </p>`
                      : ""}
                    <span
                      class="badge badge-sm mt-1 ${ch.status === "active"
                        ? "badge-success"
                        : "badge-error"}"
                      >${ch.status}</span
                    >
                    ${ch.lastError
                      ? html`<p class="text-error mt-1 text-xs m-0">${ch.lastError}</p>`
                      : ""}
                  </div>
                  ${DisconnectChannelAction.render(c, { data: { channelPublicId: ch.publicId } })}
                </div>
                ${UpdateChannelSettingsAction.render(c, {
                  data: {
                    channelPublicId: ch.publicId,
                    mode: ch.mode,
                    delayMinutes: ch.delayMinutes,
                    enabled: ch.enabled ? "true" : "false",
                  },
                })}
              </div>
            </li>
          `,
        )}
      </ul>
    </div>
  `;
}
export { channels_default as default };

// app/actions/disconnect-channel-action.ts
import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { disconnectChannel } from "~/src/server/channels/queries.ts";
var disconnect_channel_action_default = createAction({
  name: "disconnect-channel-action",
  schema: z.object({ channelPublicId: z.string() })
}).form((_c, { data, error }) => html`
      <form method="post" data-confirm="Disconnect this channel?">
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <input type="hidden" name="channelPublicId" value="${data?.channelPublicId ?? ""}" />
        <button type="submit" class="btn btn-ghost btn-xs">Disconnect</button>
      </form>
    `).post(async (c, { data }) => {
  const { organizationId } = await requireActiveOrgUser(c);
  await disconnectChannel(organizationId, data.channelPublicId);
  return c.res.redirect("/app/channels");
}).use(betterAuthMiddleware);
export {
  disconnect_channel_action_default as default
};

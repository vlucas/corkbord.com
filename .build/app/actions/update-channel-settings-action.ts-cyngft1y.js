// app/actions/update-channel-settings-action.ts
import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { updateChannelSettings } from "~/src/server/channels/queries.ts";
var update_channel_settings_action_default = createAction({
  name: "update-channel-settings-action",
  schema: z.object({
    channelPublicId: z.string(),
    mode: z.enum(["review", "auto"]),
    delayMinutes: z.coerce.number().int().min(0).max(60 * 24 * 30),
    enabled: z.enum(["true", "false"])
  })
}).form((_c, { data, error }) => html`
      <form class="flex flex-wrap items-end gap-3">
        ${error ? html`<div class="alert alert-error text-sm w-full">${error.message}</div>` : ""}
        <input type="hidden" name="channelPublicId" value="${data?.channelPublicId ?? ""}" />
        <label class="form-control">
          <span class="label-text text-xs">Mode</span>
          <select name="mode" class="select select-bordered select-sm">
            <option value="review" ${data?.mode === "review" ? "selected" : ""}>Review</option>
            <option value="auto" ${data?.mode === "auto" ? "selected" : ""}>Auto</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text text-xs">Delay (min)</span>
          <input
            type="number"
            name="delayMinutes"
            class="input input-bordered input-sm w-24"
            min="0"
            value="${data?.delayMinutes ?? "0"}"
          />
        </label>
        <label class="form-control">
          <span class="label-text text-xs">Enabled</span>
          <select name="enabled" class="select select-bordered select-sm">
            <option value="true" ${data?.enabled === "true" ? "selected" : ""}>Yes</option>
            <option value="false" ${data?.enabled === "false" ? "selected" : ""}>No</option>
          </select>
        </label>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </form>
    `).post(async (c, { data }) => {
  const { organizationId } = await requireActiveOrgUser(c);
  await updateChannelSettings(organizationId, {
    channelPublicId: data.channelPublicId,
    mode: data.mode,
    delayMinutes: data.delayMinutes,
    enabled: data.enabled === "true"
  });
  return c.res.redirect("/app/channels");
}).use(betterAuthMiddleware);
export {
  update_channel_settings_action_default as default
};

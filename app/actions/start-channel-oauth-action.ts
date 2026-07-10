import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { startChannelOAuth } from "~/src/server/channels/queries.ts";

const schema = z.object({
  provider: z.enum(["x", "linkedin"]),
  targetType: z.enum(["personal", "page"]).optional(),
});

export default createAction({
  name: "start-channel-oauth-action",
  schema,
})
  .form((_c, { data, error }) => {
    const label =
      data?.provider === "x"
        ? "Connect X"
        : data?.targetType === "page"
          ? "Connect LinkedIn (page)"
          : "Connect LinkedIn (personal)";
    const btnClass =
      data?.provider === "x"
        ? "btn btn-primary btn-sm"
        : data?.targetType === "page"
          ? "btn btn-outline btn-sm"
          : "btn btn-secondary btn-sm";

    return html`
      <form>
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <input type="hidden" name="provider" value="${data?.provider ?? ""}" />
        ${data?.targetType
          ? html`<input type="hidden" name="targetType" value="${data.targetType}" />`
          : ""}
        <button type="submit" class="${btnClass}">${label}</button>
      </form>
    `;
  })
  .post(async (c, { data }) => {
    const { organizationId, user } = await requireActiveOrgUser(c);
    const url = await startChannelOAuth(organizationId, user.id, data);
    return c.res.redirect(url);
  })
  .use(betterAuthMiddleware);

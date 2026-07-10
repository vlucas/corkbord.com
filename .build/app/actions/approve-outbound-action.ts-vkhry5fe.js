// app/actions/approve-outbound-action.ts
import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { approveOutbound } from "~/src/server/outbound/queries.ts";
var approve_outbound_action_default = createAction({
  name: "approve-outbound-action",
  schema: z.object({
    outboundPublicId: z.string(),
    contentPublicId: z.string(),
  }),
})
  .form(
    (_c, { data, error }) => html`
      <form>
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <input type="hidden" name="outboundPublicId" value="${data?.outboundPublicId ?? ""}" />
        <input type="hidden" name="contentPublicId" value="${data?.contentPublicId ?? ""}" />
        <button type="submit" class="btn btn-primary btn-sm">Approve & schedule</button>
      </form>
    `,
  )
  .post(async (c, { data }) => {
    const { organizationId } = await requireActiveOrgUser(c);
    await approveOutbound(organizationId, data.outboundPublicId);
    return c.res.redirect(`/app?content=${data.contentPublicId}`);
  })
  .use(betterAuthMiddleware);
export { approve_outbound_action_default as default };

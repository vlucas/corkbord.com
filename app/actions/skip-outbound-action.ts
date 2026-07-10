import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { skipOutbound } from "~/src/server/outbound/queries.ts";

export default createAction({
  name: "skip-outbound-action",
  schema: z.object({
    outboundPublicId: z.string(),
    contentPublicId: z.string(),
  }),
})
  .form(
    (_c, { data, error }) => html`
      <form method="post" data-confirm="Skip posting to this channel?">
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <input type="hidden" name="outboundPublicId" value="${data?.outboundPublicId ?? ""}" />
        <input type="hidden" name="contentPublicId" value="${data?.contentPublicId ?? ""}" />
        <button type="submit" class="btn btn-ghost btn-sm">Skip</button>
      </form>
    `,
  )
  .post(async (c, { data }) => {
    const { organizationId } = await requireActiveOrgUser(c);
    await skipOutbound(organizationId, data.outboundPublicId);
    return c.res.redirect(`/app?content=${data.contentPublicId}`);
  })
  .use(betterAuthMiddleware);

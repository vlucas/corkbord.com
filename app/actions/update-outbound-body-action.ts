import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { updateOutboundBody } from "~/src/server/outbound/queries.ts";

export default createAction({
  name: "update-outbound-body-action",
  schema: z.object({
    outboundPublicId: z.string(),
    contentPublicId: z.string(),
    adaptedBody: z.string().min(1),
  }),
})
  .form(
    (_c, { data, error }) => html`
      <form class="mt-2 space-y-2">
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <input type="hidden" name="outboundPublicId" value="${data?.outboundPublicId ?? ""}" />
        <input type="hidden" name="contentPublicId" value="${data?.contentPublicId ?? ""}" />
        <textarea name="adaptedBody" class="textarea textarea-bordered w-full min-h-24 text-sm">
${data?.adaptedBody ?? ""}</textarea>
        <button type="submit" class="btn btn-outline btn-sm">Save edits</button>
      </form>
    `,
  )
  .post(async (c, { data }) => {
    const { organizationId } = await requireActiveOrgUser(c);
    await updateOutboundBody(organizationId, data.outboundPublicId, data.adaptedBody);
    return c.res.redirect(`/app?content=${data.contentPublicId}`);
  })
  .use(betterAuthMiddleware);

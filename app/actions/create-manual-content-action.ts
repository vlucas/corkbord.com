import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { createManualContent } from "~/src/server/content/queries.ts";

export default createAction({
  name: "create-manual-content-action",
  schema: z.object({
    title: z.string().max(500).optional(),
    body: z.string().min(1),
  }),
})
  .form(
    (_c, { data, error }) => html`
      <form class="space-y-3">
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <input
          type="text"
          name="title"
          class="input input-bordered w-full"
          placeholder="Title (optional)"
          value="${data?.title ?? ""}"
        />
        <textarea
          name="body"
          class="textarea textarea-bordered w-full min-h-28"
          placeholder="Note body"
          required
        >
${data?.body ?? ""}</textarea>
        <button type="submit" class="btn btn-primary btn-sm">Pin note</button>
      </form>
    `,
  )
  .post(async (c, { data }) => {
    const { organizationId } = await requireActiveOrgUser(c);
    const publicId = await createManualContent(organizationId, data);
    return c.res.redirect(`/app?content=${publicId}`);
  })
  .use(betterAuthMiddleware);

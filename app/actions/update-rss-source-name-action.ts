import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { updateRssSourceName } from "~/src/server/sources/queries.ts";

export default createAction({
  name: "update-rss-source-name-action",
  schema: z.object({
    publicId: z.string(),
    name: z.string().trim().min(1).max(120),
  }),
})
  .form(
    (_c, { data, error }) => html`
      <form class="flex flex-wrap items-center gap-2">
        ${error ? html`<div class="alert alert-error text-sm w-full">${error.message}</div>` : ""}
        <input type="hidden" name="publicId" value="${data?.publicId ?? ""}" />
        <input
          type="text"
          name="name"
          class="input input-bordered input-sm min-w-0 flex-1"
          value="${data?.name ?? ""}"
          aria-label="Source name"
          required
        />
        <button type="submit" class="btn btn-ghost btn-sm">Save name</button>
      </form>
    `,
  )
  .post(async (c, { data }) => {
    const { organizationId } = await requireActiveOrgUser(c);
    await updateRssSourceName(organizationId, data.publicId, data.name);
    return c.res.redirect("/app/sources");
  })
  .use(betterAuthMiddleware);

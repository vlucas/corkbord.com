// app/actions/create-rss-source-action.ts
import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { createRssSource } from "~/src/server/sources/queries.ts";
var create_rss_source_action_default = createAction({
  name: "create-rss-source-action",
  schema: z.object({
    name: z.string().min(1).max(120),
    url: z.string().url(),
  }),
})
  .form(
    (_c, { data, error }) => html`
      <form>
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <div class="space-y-2">
          <input
            type="text"
            name="name"
            class="input input-bordered w-full"
            placeholder="Source name"
            value="${data?.name ?? ""}"
            required
          />
          <input
            type="url"
            name="url"
            class="input input-bordered w-full"
            placeholder="RSS feed URL"
            value="${data?.url ?? ""}"
            required
          />
          <button type="submit" class="btn btn-primary btn-sm">Add RSS source</button>
        </div>
      </form>
    `,
  )
  .post(async (c, { data }) => {
    const { organizationId } = await requireActiveOrgUser(c);
    await createRssSource(organizationId, data);
    return c.res.redirect("/app/sources");
  })
  .use(betterAuthMiddleware);
export { create_rss_source_action_default as default };

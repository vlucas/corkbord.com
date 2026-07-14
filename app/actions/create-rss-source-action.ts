import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { createRssSource } from "~/src/server/sources/queries.ts";

const schema = z.object({
  name: z
    .string()
    .max(120)
    .optional()
    .transform((value) => value?.trim() || undefined),
  url: z.string().url(),
});

export default createAction({
  name: "create-rss-source-action",
  schema,
})
  .form(
    (_c, { data, error }) => html`
      <form>
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <div class="space-y-2">
          <input
            type="url"
            name="url"
            class="input input-bordered w-full"
            placeholder="RSS feed URL"
            value="${data?.url ?? ""}"
            required
          />
          <details class="text-sm">
            <summary class="text-base-content/70 cursor-pointer select-none">
              Custom name (optional)
            </summary>
            <input
              type="text"
              name="name"
              class="input input-bordered mt-2 w-full"
              placeholder="Source name"
              value="${data?.name ?? ""}"
            />
          </details>
          <button type="submit" class="btn btn-primary btn-sm">Add RSS source</button>
        </div>
      </form>
    `,
  )
  .post(async (c, { data }) => {
    const { organizationId } = await requireActiveOrgUser(c);
    await createRssSource(organizationId, data);
    return c.res.redirect("/app/sources?added=1");
  })
  .use(betterAuthMiddleware);

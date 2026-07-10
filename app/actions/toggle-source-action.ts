import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { z } from "zod";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { toggleSource } from "~/src/server/sources/queries.ts";

export default createAction({
  name: "toggle-source-action",
  schema: z.object({
    publicId: z.string(),
    enabled: z.enum(["true", "false"]),
  }),
})
  .form(
    (_c, { data, error }) => html`
      <form>
        ${error ? html`<div class="alert alert-error text-sm">${error.message}</div>` : ""}
        <input type="hidden" name="publicId" value="${data?.publicId ?? ""}" />
        <input type="hidden" name="enabled" value="${data?.enabled ?? "true"}" />
        <input
          type="checkbox"
          class="toggle toggle-primary"
          ${data?.enabled === "true" ? "checked" : ""}
          onchange="this.form.querySelector('[name=enabled]').value = this.checked ? 'true' : 'false'; this.form.requestSubmit()"
        />
      </form>
    `,
  )
  .post(async (c, { data }) => {
    const { organizationId } = await requireActiveOrgUser(c);
    await toggleSource(organizationId, data.publicId, data.enabled === "true");
    return c.res.redirect("/app/sources");
  })
  .use(betterAuthMiddleware);

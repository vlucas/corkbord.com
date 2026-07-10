// app/actions/fetch-sources-now-action.ts
import { html } from "@hyperspan/html";
import { createAction } from "@hyperspan/framework/actions";
import { betterAuthMiddleware } from "~/src/server/auth/middleware.ts";
import { requireActiveOrgUser } from "~/src/server/auth/get-active-org.ts";
import { fetchSourcesNow } from "~/src/server/channels/queries.ts";
var fetch_sources_now_action_default = createAction({
  name: "fetch-sources-now-action"
}).form(() => html`
      <form>
        <button type="submit" class="btn btn-outline btn-sm">Fetch all now</button>
      </form>
    `).post(async (c) => {
  const { organizationId } = await requireActiveOrgUser(c);
  await fetchSourcesNow(organizationId);
  const returnPath = new URL(c.req.url).searchParams.get("returnPath") ?? "/app";
  return c.res.redirect(returnPath);
}).use(betterAuthMiddleware);
export {
  fetch_sources_now_action_default as default
};

// app/routes/index.ts
import { html } from "@hyperspan/html";
import { createRoute } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";
import MarketingLayout from "~/app/layouts/marketing-layout.ts";
import { accentDot } from "~/src/ui/accent.ts";
var routes_default = createRoute().get(async (c) => {
  const session = await betterAuth.api.getSession({ headers: c.req.raw.headers });
  if (session?.user) {
    return c.res.redirect("/app");
  }
  const content = html`
    <div class="text-center">
      ${html`
        <div class="content-card mb-8 w-full max-w-md shadow-lg">
          <div class="flex flex-col items-center gap-4 p-6 text-center">
            <h1
              class="font-display text-primary flex items-center justify-center gap-2.5 text-5xl font-bold tracking-tight m-0"
            >
              ${accentDot("accent-yellow", "size-2.5")} Corkbord
            </h1>
            <p class="text-base-content/75 text-lg m-0">
              One content feed. Repurpose everywhere — on autopilot when you're ready.
            </p>
            <div class="flex flex-wrap justify-center gap-3 pt-2">
              <a href="/signup" class="btn btn-primary">Get started</a>
              <a href="/login" class="btn btn-outline">Sign in</a>
            </div>
          </div>
        </div>
      `}
      <p class="text-base-content/50 max-w-md text-sm mx-auto">
        Import RSS, pin notes manually, then preview and post to X and LinkedIn — personal or
        company page.
      </p>
    </div>
  `;
  return MarketingLayout(c, { title: "Home", content });
});
export {
  routes_default as default
};

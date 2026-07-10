// app/routes/index.ts
import { html as html3 } from "@hyperspan/html";
import { createRoute } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";

// app/layouts/marketing-layout.ts
import { html as html2 } from "@hyperspan/html";

// app/layouts/base-layout.ts
import { html } from "@hyperspan/html";
import { hyperspanScriptTags, hyperspanStyleTags } from "@hyperspan/framework/layout";
function BaseLayout(c, { title, content }) {
  return html`<!doctype html>
    <html lang="en" data-theme="corkbord">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title} | Corkbord</title>
        ${hyperspanStyleTags(c)}
      </head>
      <body class="cork-bg min-h-screen">
        ${hyperspanScriptTags()} ${content}
      </body>
    </html>`;
}

// app/layouts/marketing-layout.ts
function MarketingLayout(c, { title, content }) {
  return BaseLayout(c, {
    title,
    content: html2`
      <div
        class="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16"
      >
        ${content}
      </div>
    `
  });
}

// app/routes/index.ts
import { accentDot } from "~/src/ui/accent.ts";
var routes_default = createRoute().get(async (c) => {
  const session = await betterAuth.api.getSession({ headers: c.req.raw.headers });
  if (session?.user) {
    return c.res.redirect("/app");
  }
  const content = html3`
    <div class="text-center">
      ${html3`
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

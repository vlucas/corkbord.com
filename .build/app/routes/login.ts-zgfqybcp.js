// app/routes/login.ts
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

// app/routes/login.ts
import { accentDot } from "~/src/ui/accent.ts";
var login_default = createRoute().get((c) => {
  const error = c.req.query.get("error");
  const content = html3`
      <div class="content-card w-full max-w-md shadow-lg">
        <form method="POST" class="space-y-4 p-4">
          <div class="flex items-center gap-2">
            ${accentDot("accent-mint")}
            <span class="font-display text-primary text-2xl font-semibold">Corkbord</span>
          </div>
          <h1 class="text-lg font-semibold m-0">Sign in</h1>
          ${error ? html3`<div class="alert alert-error text-sm">
                Sign in failed. Check your email and password.
              </div>` : ""}
          <input
            type="email"
            name="email"
            required
            class="input input-bordered w-full"
            placeholder="Email"
          />
          <input
            type="password"
            name="password"
            required
            minlength="6"
            class="input input-bordered w-full"
            placeholder="Password"
          />
          <button type="submit" class="btn btn-primary w-full">Sign in</button>
          <p class="text-base-content/60 text-center text-sm m-0">
            No account? <a href="/signup" class="link link-primary">Sign up</a>
          </p>
        </form>
      </div>
    `;
  return MarketingLayout(c, { title: "Sign in", content });
}).post(async (c) => {
  const formData = await c.req.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const res = await betterAuth.api.signInEmail({
    body: { email, password },
    asResponse: true
  });
  if (res.status === 200) {
    const returnPath = c.req.query.get("returnPath") ?? "/app";
    const headers = res.headers;
    headers.set("Location", returnPath);
    return new Response(null, { status: 302, headers });
  }
  return c.res.redirect("/login?error=1");
});
export {
  login_default as default
};

// app/routes/signup.ts
import { html as html3 } from "@hyperspan/html";
import { createRoute } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";
import { ensureDefaultOrganization } from "~/src/server/auth/ensure-default-org.ts";
import { ensureManualSource } from "~/src/server/sources/queries.ts";

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

// app/routes/signup.ts
import { accentDot } from "~/src/ui/accent.ts";
var signup_default = createRoute().get((c) => {
  const error = c.req.query.get("error");
  const content = html3`
      <div class="content-card w-full max-w-md shadow-lg">
        <form method="POST" class="space-y-4 p-4">
          <div class="flex items-center gap-2">
            ${accentDot("accent-blush")}
            <span class="font-display text-primary text-2xl font-semibold">Corkbord</span>
          </div>
          <h1 class="text-lg font-semibold m-0">Create account</h1>
          <p class="text-base-content/60 text-sm m-0">
            We'll create your workspace as "My Organization".
          </p>
          ${error ? html3`<div class="alert alert-error text-sm">
                Could not create account. Try a different email.
              </div>` : ""}
          <input type="text" name="name" class="input input-bordered w-full" placeholder="Name" />
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
            placeholder="Password (min 6 characters)"
          />
          <button type="submit" class="btn btn-primary w-full">Sign up</button>
          <p class="text-base-content/60 text-center text-sm m-0">
            Already have an account? <a href="/login" class="link link-primary">Sign in</a>
          </p>
        </form>
      </div>
    `;
  return MarketingLayout(c, { title: "Sign up", content });
}).post(async (c) => {
  const formData = await c.req.formData();
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const res = await betterAuth.api.signUpEmail({
    body: {
      name: name || email.split("@")[0] || "User",
      email,
      password: String(formData.get("password") ?? "")
    },
    asResponse: true
  });
  if (res.status === 200) {
    const data = await res.clone().json().catch(() => null);
    const userId = data?.user?.id;
    if (userId) {
      const orgId = await ensureDefaultOrganization(userId, res.headers);
      await ensureManualSource(orgId);
    }
    const headers = res.headers;
    headers.set("Location", "/app");
    return new Response(null, { status: 302, headers });
  }
  return c.res.redirect("/signup?error=1");
});
export {
  signup_default as default
};

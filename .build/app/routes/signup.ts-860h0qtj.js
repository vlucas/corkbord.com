// app/routes/signup.ts
import { html } from "@hyperspan/html";
import { createRoute } from "@hyperspan/framework";
import { betterAuth } from "~/src/server/auth/index.ts";
import { ensureDefaultOrganization } from "~/src/server/auth/ensure-default-org.ts";
import { ensureManualSource } from "~/src/server/sources/queries.ts";
import MarketingLayout from "~/app/layouts/marketing-layout.ts";
import { accentDot } from "~/src/ui/accent.ts";
var signup_default = createRoute()
  .get((c) => {
    const error = c.route.query.error;
    const content = html`
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
          ${error
            ? html`<div class="alert alert-error text-sm">
                Could not create account. Try a different email.
              </div>`
            : ""}
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
  })
  .post(async (c) => {
    const formData = await c.req.formData();
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const res = await betterAuth.api.signUpEmail({
      body: {
        name: name || email.split("@")[0] || "User",
        email,
        password: String(formData.get("password") ?? ""),
      },
      asResponse: true,
    });
    if (res.status === 200) {
      const data = await res
        .clone()
        .json()
        .catch(() => null);
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
export { signup_default as default };

import { html } from "@hyperspan/html";
import type { Hyperspan as HS } from "@hyperspan/framework";
import BaseLayout from "./base-layout";

export default function AppLayout(
  c: HS.Context,
  { title, content, userName }: { title: string; content: unknown; userName: string },
) {
  const path = c.req.url.pathname;

  return BaseLayout(c, {
    title,
    content: html`
      <div class="min-h-screen">
        <header class="border-base-300 bg-base-100/80 sticky top-0 z-10 border-b backdrop-blur-sm">
          <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <a href="/app" class="font-display text-primary text-xl font-semibold no-underline"
              >Corkbord</a
            >
            <nav class="flex flex-wrap items-center gap-1 text-sm">
              <a href="/app" class="btn btn-ghost btn-sm ${path === "/app" ? "btn-active" : ""}"
                >Feed</a
              >
              <a
                href="/app/sources"
                class="btn btn-ghost btn-sm ${path === "/app/sources" ? "btn-active" : ""}"
                >Sources</a
              >
              <a
                href="/app/channels"
                class="btn btn-ghost btn-sm ${path === "/app/channels" ? "btn-active" : ""}"
                >Channels</a
              >
            </nav>
            <div class="flex items-center gap-2">
              <span class="text-base-content/60 hidden text-sm sm:inline">${userName}</span>
              <form method="post" action="/logout">
                <button type="submit" class="btn btn-ghost btn-sm">Sign out</button>
              </form>
            </div>
          </div>
        </header>
        <main class="mx-auto max-w-6xl px-4 py-6">${content}</main>
      </div>
    `,
  });
}

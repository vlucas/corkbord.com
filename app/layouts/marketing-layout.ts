import { html } from "@hyperspan/html";
import type { Hyperspan as HS } from "@hyperspan/framework";
import BaseLayout from "./base-layout";

export default function MarketingLayout(
  c: HS.Context,
  { title, content }: { title: string; content: unknown },
) {
  return BaseLayout(c, {
    title,
    content: html`
      <div
        class="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16"
      >
        ${content}
      </div>
    `,
  });
}

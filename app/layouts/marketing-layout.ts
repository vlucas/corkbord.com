import { html } from "@hyperspan/html";
import type { Hyperspan as HS } from "@hyperspan/framework";
import BaseLayout from "./base-layout";
import { marketingFooter } from "~/src/ui/marketing-footer.ts";

export default function MarketingLayout(
  c: HS.Context,
  {
    title,
    content,
    variant = "center",
  }: { title: string; content: unknown; variant?: "center" | "legal" },
) {
  const shellClass =
    variant === "legal"
      ? "mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12"
      : "mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16";

  return BaseLayout(c, {
    title,
    content: html`
      <div class="${shellClass}">
        <div class="${variant === "legal" ? "w-full flex-1" : ""}">${content}</div>
        ${marketingFooter()}
      </div>
    `,
  });
}

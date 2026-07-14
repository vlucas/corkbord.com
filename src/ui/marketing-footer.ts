import { html } from "@hyperspan/html";
import { site } from "~/src/config/site.ts";

export function marketingFooter() {
  return html`
    <footer
      class="border-base-300 text-base-content/60 mt-auto w-full border-t pt-8 pb-4 text-center text-sm"
    >
      <nav class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <a href="/" class="link link-hover">Home</a>
        <a href="/privacy" class="link link-hover">Privacy Policy</a>
        <a href="/terms" class="link link-hover">Terms of Service</a>
      </nav>
      <p class="mt-3 text-xs">
        © ${new Date().getFullYear()} ${site.companyName}. ${site.name} is a product of
        <a href="${site.companyUrl}" class="link link-hover">${site.companyName}</a>.
      </p>
    </footer>
  `;
}

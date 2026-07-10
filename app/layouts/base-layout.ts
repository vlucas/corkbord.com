import { html } from "@hyperspan/html";
import { hyperspanScriptTags, hyperspanStyleTags } from "@hyperspan/framework/layout";
import type { Hyperspan as HS } from "@hyperspan/framework";
import "~/app/styles/global.css";

export default function BaseLayout(
  c: HS.Context,
  { title, content }: { title: string; content: unknown },
) {
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

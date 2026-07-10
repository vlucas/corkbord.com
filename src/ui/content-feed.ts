import { formatDistanceToNow } from "date-fns";
import { html, placeholder } from "@hyperspan/html";
import type { Hyperspan as HS } from "@hyperspan/framework";
import FetchSourcesNowAction from "~/app/actions/fetch-sources-now-action.ts";
import CreateManualContentAction from "~/app/actions/create-manual-content-action.ts";
import { listContent, getContent } from "~/src/server/content/queries.ts";
import { accentColor, accentDot, contentCard } from "~/src/ui/accent.ts";
import { renderOutboundPanel } from "~/src/ui/outbound-panel.ts";
import type { ContentItemDto } from "~/src/types/dto.ts";

export function renderContentListItem(
  item: ContentItemDto,
  index: number,
  selectedId: string | null,
) {
  const color = accentColor(index);
  const isManual = item.sourceType === "manual";
  const heading = isManual || item.title ? item.title : null;
  const selected = selectedId === item.publicId;

  return html`
    <a
      href="/app?content=${item.publicId}"
      class="content-card content-card-feed-item block no-underline text-inherit transition ${selected
        ? "content-item-selected"
        : ""}"
    >
      <div class="flex flex-col gap-2">
        ${heading
          ? html`
              <h3
                class="flex items-center gap-2 font-semibold ${isManual
                  ? "line-clamp-1"
                  : "line-clamp-2 text-sm"} m-0"
              >
                ${accentDot(color)} ${heading}
              </h3>
              <p class="text-base-content/80 line-clamp-3 text-sm m-0">${item.body}</p>
            `
          : html`
              <div class="flex items-start gap-2.5">
                ${accentDot(color, "mt-1.5")}
                <p class="text-base-content/80 line-clamp-3 text-sm font-medium m-0">
                  ${item.body}
                </p>
              </div>
            `}
        <p class="text-base-content/50 text-xs m-0">
          ${item.sourceName} ·
          ${formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
        </p>
      </div>
    </a>
  `;
}

export function renderContentDetail(
  c: HS.Context,
  item: ContentItemDto,
  index: number,
  organizationId: string,
) {
  const color = accentColor(index);

  return html`
    ${contentCard(html`
      <div class="flex flex-col gap-2">
        ${item.title
          ? html`
              <h2 class="font-display flex items-center gap-2 text-lg font-semibold m-0">
                ${accentDot(color)} ${item.title}
              </h2>
              <p class="text-sm whitespace-pre-wrap m-0">${item.body}</p>
            `
          : html`
              <div class="flex items-start gap-2.5">
                ${accentDot(color, "mt-1.5")}
                <p class="text-sm whitespace-pre-wrap m-0">${item.body}</p>
              </div>
            `}
        <p class="text-base-content/50 text-xs m-0">
          ${item.sourceName} ·
          ${formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
        </p>
      </div>
    `)}
    ${renderOutboundPanel(c, organizationId, item.publicId)}
  `;
}

export function renderEmptyFeed(c: HS.Context) {
  return contentCard(
    html`
      <div class="flex flex-col items-center gap-4 text-center">
        <h2 class="font-display flex items-center justify-center gap-2 text-2xl font-semibold m-0">
          ${accentDot("accent-yellow")} Your corkboard is empty
        </h2>
        <p class="text-base-content/70 m-0">
          Connect an RSS feed to import content, or pin your first note manually.
        </p>
        <div class="flex flex-wrap justify-center gap-2 pt-2">
          <a href="/app/sources" class="btn btn-primary btn-sm">Add RSS source</a>
        </div>
        <div id="manual" class="w-full max-w-md pt-4 text-left">
          ${CreateManualContentAction.render(c)}
        </div>
      </div>
    `,
    "mx-auto max-w-lg shadow-md",
  );
}

export function renderFeedContent(
  c: HS.Context,
  organizationId: string,
  selectedId: string | null,
) {
  return placeholder(
    html`<div class="space-y-3">
      ${[1, 2, 3].map(() => html`<div class="skeleton h-24 w-full"></div>`)}
    </div>`,
    renderFeed(c, organizationId, selectedId),
  );
}

async function renderFeed(c: HS.Context, organizationId: string, selectedId: string | null) {
  const items = await listContent(organizationId);
  const selected = selectedId ? await getContent(organizationId, selectedId) : null;
  const selectedIndex = selected ? items.findIndex((i) => i.publicId === selected.publicId) : -1;

  if (items.length === 0) {
    return renderEmptyFeed(c);
  }

  return html`
    <div class="feed-split">
      <section class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h1 class="font-display text-2xl font-semibold m-0">Feed</h1>
          ${FetchSourcesNowAction.render(c)}
        </div>
        <div class="flex max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto pr-1">
          ${items.map((item, i) => renderContentListItem(item, i, selectedId))}
        </div>
      </section>
      <section class="flex flex-col gap-4">
        ${selected
          ? renderContentDetail(c, selected, selectedIndex >= 0 ? selectedIndex : 0, organizationId)
          : html`<p class="text-base-content/60 text-sm m-0">Select an item from the feed</p>`}
      </section>
    </div>
  `;
}

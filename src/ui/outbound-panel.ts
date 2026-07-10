import { formatDistanceToNow } from "date-fns";
import { html, placeholder } from "@hyperspan/html";
import type { Hyperspan as HS } from "@hyperspan/framework";
import ApproveOutboundAction from "~/app/actions/approve-outbound-action.ts";
import GeneratePreviewAction from "~/app/actions/generate-preview-action.ts";
import SkipOutboundAction from "~/app/actions/skip-outbound-action.ts";
import UpdateOutboundBodyAction from "~/app/actions/update-outbound-body-action.ts";
import { listOutboundForContent } from "~/src/server/outbound/queries.ts";
import { accentColor, accentDot, contentCard } from "~/src/ui/accent.ts";
import type { OutboundPostDto } from "~/src/types/dto.ts";

export function renderOutboundPanel(
  c: HS.Context,
  organizationId: string,
  contentPublicId: string,
) {
  return placeholder(
    html`<div class="skeleton h-32 w-full"></div>`,
    loadOutboundPanel(c, organizationId, contentPublicId),
  );
}

async function loadOutboundPanel(c: HS.Context, organizationId: string, contentPublicId: string) {
  const posts = await listOutboundForContent(organizationId, contentPublicId);

  if (posts.length === 0) {
    return contentCard(html`
      <div class="flex flex-col gap-2">
        <h3 class="flex items-center gap-2 font-semibold m-0">
          ${accentDot("accent-sky")} No channels connected
        </h3>
        <p class="text-base-content/70 text-sm m-0">
          Connect X or LinkedIn to generate previews and schedule posts.
        </p>
        <a href="/app/channels" class="btn btn-primary btn-sm w-fit">Connect channels</a>
      </div>
    `);
  }

  return html`
    <div class="flex flex-col gap-3">
      <h3 class="font-display text-lg font-semibold m-0">Outbound</h3>
      ${posts.map((post, i) => renderOutboundCard(c, post, i, contentPublicId))}
    </div>
  `;
}

function renderOutboundCard(
  c: HS.Context,
  post: OutboundPostDto,
  index: number,
  contentPublicId: string,
) {
  const providerLabel = post.provider === "x" ? "X" : "LinkedIn";
  const statusBadge =
    post.status === "posted"
      ? "badge-success"
      : post.status === "failed"
        ? "badge-error"
        : "badge-ghost";

  return contentCard(html`
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 class="flex items-center gap-2 text-base font-semibold m-0">
            ${accentDot(accentColor(index))} ${providerLabel}
          </h4>
          <p class="text-base-content/60 text-sm m-0">${post.channelName}</p>
        </div>
        <span class="badge badge-sm ${statusBadge}">${post.status.replace("_", " ")}</span>
      </div>

      ${post.error ? html`<div class="alert alert-error text-sm py-2">${post.error}</div>` : ""}
      ${post.adaptedBody
        ? html`
            <div class="rounded-box bg-base-200 p-3 text-sm whitespace-pre-wrap">
              ${post.adaptedBody}
            </div>
            ${UpdateOutboundBodyAction.render(c, {
              data: {
                outboundPublicId: post.publicId,
                contentPublicId,
                adaptedBody: post.adaptedBody,
              },
            })}
          `
        : html`<p class="text-base-content/60 text-sm m-0">No preview yet.</p>`}

      <div class="flex flex-wrap gap-2">
        ${post.status === "pending_preview" || post.status === "draft"
          ? GeneratePreviewAction.render(c, {
              data: { outboundPublicId: post.publicId, contentPublicId },
            })
          : ""}
        ${post.status === "draft" && post.adaptedBody
          ? html`
              ${ApproveOutboundAction.render(c, {
                data: { outboundPublicId: post.publicId, contentPublicId },
              })}
              ${SkipOutboundAction.render(c, {
                data: { outboundPublicId: post.publicId, contentPublicId },
              })}
            `
          : ""}
        ${post.scheduledFor
          ? html`<p class="text-base-content/50 text-xs m-0">
              Scheduled ${new Date(post.scheduledFor).toLocaleString()}
            </p>`
          : ""}
        ${post.postedAt
          ? html`<p class="text-base-content/50 text-xs m-0">
              Posted ${new Date(post.postedAt).toLocaleString()}
            </p>`
          : ""}
      </div>
    </div>
  `);
}

import { html } from "@hyperspan/html";

export const ACCENT_COLORS = [
  "accent-yellow",
  "accent-mint",
  "accent-blush",
  "accent-sky",
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];

export function accentColor(index: number): AccentColor {
  return ACCENT_COLORS[index % ACCENT_COLORS.length]!;
}

export function accentDot(color: AccentColor, className = "") {
  return html`<span class="accent-dot ${color} ${className}" aria-hidden="true"></span>`;
}

export function contentCard(content: unknown, className = "") {
  return html`<div class="content-card ${className}">${content}</div>`;
}

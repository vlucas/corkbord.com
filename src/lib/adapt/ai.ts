import type { ChannelProvider } from "~/src/db/schema.ts";

const X_MAX = 280;
const LINKEDIN_MAX = 3000;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function baseText(title: string | null, body: string): string {
  if (title && !body.startsWith(title)) {
    return `${title}\n\n${body}`.trim();
  }
  return body.trim();
}

export function ruleBasedAdapt(
  provider: ChannelProvider,
  title: string | null,
  body: string,
): string {
  const text = baseText(title, body);
  if (provider === "x") {
    return truncate(text.replace(/\n{3,}/g, "\n\n"), X_MAX);
  }
  return truncate(text, LINKEDIN_MAX);
}

export async function aiAdapt(
  provider: ChannelProvider,
  title: string | null,
  body: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return ruleBasedAdapt(provider, title, body);
  }

  const channelName = provider === "x" ? "X (Twitter)" : "LinkedIn";
  const limits =
    provider === "x"
      ? "Keep under 280 characters. No hashtags unless essential."
      : "Professional tone for LinkedIn. Can use line breaks. Under 3000 characters.";

  const prompt = `Rewrite this content for ${channelName}. ${limits}
Return only the post text, no quotes or labels.

Title: ${title ?? "(none)"}
Body:
${body}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    return ruleBasedAdapt(provider, title, body);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) return ruleBasedAdapt(provider, title, body);
  return provider === "x" ? truncate(content, X_MAX) : truncate(content, LINKEDIN_MAX);
}

type OAuthCallbackContext = {
  req: {
    query: { get: (key: string) => string | null | undefined };
  };
};

/** Canonical public URL for OAuth redirect URIs (set to your portless URL in dev). */
export function oauthBaseUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export function parseOAuthCallback(
  c: OAuthCallbackContext,
): { ok: false; redirect: string } | { ok: true; code: string; state: string } {
  const oauthError = c.req.query.get("error");
  if (oauthError) {
    const description = c.req.query.get("error_description");
    const message = description?.trim() || oauthError;
    return { ok: false, redirect: `/app/channels?error=${encodeURIComponent(message)}` };
  }

  const code = c.req.query.get("code");
  const state = c.req.query.get("state");
  if (!code || !state) {
    return { ok: false, redirect: "/app/channels?error=missing_code" };
  }

  return { ok: true, code: String(code), state: String(state) };
}

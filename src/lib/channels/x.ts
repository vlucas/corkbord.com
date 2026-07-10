export async function postToX(accessToken: string, text: string): Promise<string> {
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const json = (await res.json()) as {
    data?: { id: string };
    detail?: string;
    errors?: Array<{ message: string }>;
  };

  if (!res.ok) {
    const msg = json.detail ?? json.errors?.[0]?.message ?? `X API error ${res.status}`;
    throw new Error(msg);
  }

  if (!json.data?.id) throw new Error("X API returned no tweet id");
  return json.data.id;
}

export async function refreshXToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("X OAuth not configured");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body,
  });

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    error?: string;
  };

  if (!res.ok) throw new Error(json.error ?? "Failed to refresh X token");

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
  };
}

const LINKEDIN_API = "https://api.linkedin.com";

export async function postToLinkedIn(
  accessToken: string,
  authorUrn: string,
  commentary: string,
): Promise<string> {
  const version = process.env.LINKEDIN_API_VERSION ?? "202601";

  const res = await fetch(`${LINKEDIN_API}/rest/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": version,
    },
    body: JSON.stringify({
      author: authorUrn,
      commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!res.ok) {
    let detail = `LinkedIn API error ${res.status}`;
    try {
      const json = (await res.json()) as { message?: string };
      detail = json.message ?? detail;
    } catch {
      /* empty body */
    }
    throw new Error(detail);
  }

  const postId = res.headers.get("x-restli-id");
  if (!postId) throw new Error("LinkedIn returned no post id");
  return postId;
}

export interface LinkedInProfile {
  sub: string;
  name?: string;
}

export async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const res = await fetch(`${LINKEDIN_API}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch LinkedIn profile");
  return (await res.json()) as LinkedInProfile;
}

export interface LinkedInOrganization {
  urn: string;
  name: string;
}

/** List company pages the member can administer. */
export async function fetchLinkedInOrganizations(
  accessToken: string,
): Promise<LinkedInOrganization[]> {
  const res = await fetch(
    `${LINKEDIN_API}/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": process.env.LINKEDIN_API_VERSION ?? "202601",
      },
    },
  );

  if (!res.ok) return [];

  const json = (await res.json()) as {
    elements?: Array<{ organization?: string; "organization~"?: { localizedName?: string } }>;
  };

  return (json.elements ?? []).map((el) => ({
    urn: el.organization ?? "",
    name: el["organization~"]?.localizedName ?? "Company page",
  }));
}

export async function refreshLinkedInToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("LinkedIn OAuth not configured");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    error_description?: string;
  };

  if (!res.ok) throw new Error(json.error_description ?? "Failed to refresh LinkedIn token");

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
  };
}

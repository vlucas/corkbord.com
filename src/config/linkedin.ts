/** Personal feed — Sign In with LinkedIn (OIDC) + Share on LinkedIn. */
export const linkedInPersonalScopes = ["openid", "profile", "email", "w_member_social"] as const;

/**
 * Company page — Community Management API.
 * Do not mix OIDC scopes (openid/profile/email) with these; LinkedIn rejects invalid combinations.
 */
export const linkedInPageScopes = [
  "r_basicprofile",
  "w_member_social",
  "rw_organization_admin",
  "w_organization_social",
] as const;

export function linkedInScopeString(targetType?: "personal" | "page"): string {
  const scopes = targetType === "page" ? linkedInPageScopes : linkedInPersonalScopes;
  return scopes.join(" ");
}

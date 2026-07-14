import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// better-auth core + organization plugin
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("owner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Corkbord app tables (UUIDv7 PK + TypeID public_id)
// ---------------------------------------------------------------------------

export type SourceType = "rss" | "manual";
export type ChannelProvider = "x" | "linkedin";
export type LinkedInTargetType = "personal" | "page";
export type ChannelAccountStatus = "active" | "error" | "disconnected";
export type ChannelMode = "review" | "auto";
export type OutboundStatus =
  | "pending_preview"
  | "draft"
  | "approved"
  | "scheduled"
  | "posting"
  | "posted"
  | "failed"
  | "skipped";

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  type: text("type").$type<SourceType>().notNull(),
  name: text("name").notNull(),
  config: jsonb("config").$type<{ url?: string; autoName?: boolean }>().notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    externalId: text("external_id"),
    title: text("title"),
    body: text("body").notNull(),
    publishedAt: timestamp("published_at").notNull().defaultNow(),
    raw: jsonb("raw").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.sourceId, t.externalId)],
);

export const channelAccounts = pgTable("channel_accounts", {
  id: uuid("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  provider: text("provider").$type<ChannelProvider>().notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  profileMetadata: jsonb("profile_metadata").$type<Record<string, unknown>>(),
  targetType: text("target_type").$type<LinkedInTargetType>(),
  targetUrn: text("target_urn"),
  targetName: text("target_name"),
  status: text("status").$type<ChannelAccountStatus>().notNull().default("active"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const channelSettings = pgTable(
  "channel_settings",
  {
    id: uuid("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    channelAccountId: uuid("channel_account_id")
      .notNull()
      .references(() => channelAccounts.id, { onDelete: "cascade" }),
    mode: text("mode").$type<ChannelMode>().notNull().default("review"),
    delayMinutes: integer("delay_minutes").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.channelAccountId)],
);

export const outboundPosts = pgTable(
  "outbound_posts",
  {
    id: uuid("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    channelAccountId: uuid("channel_account_id")
      .notNull()
      .references(() => channelAccounts.id, { onDelete: "cascade" }),
    adaptedBody: text("adapted_body"),
    media: jsonb("media").$type<Record<string, unknown>>(),
    status: text("status").$type<OutboundStatus>().notNull().default("pending_preview"),
    scheduledFor: timestamp("scheduled_for"),
    postedAt: timestamp("posted_at"),
    externalPostId: text("external_post_id"),
    error: text("error"),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.contentItemId, t.channelAccountId)],
);

/** Pending OAuth state for channel connections. */
export const oauthStates = pgTable("oauth_states", {
  id: uuid("id").primaryKey(),
  state: text("state").notNull().unique(),
  organizationId: text("organization_id").notNull(),
  userId: text("user_id").notNull(),
  provider: text("provider").$type<ChannelProvider>().notNull(),
  targetType: text("target_type").$type<LinkedInTargetType>(),
  codeVerifier: text("code_verifier"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

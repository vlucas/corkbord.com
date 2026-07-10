export interface SourceDto {
  publicId: string;
  type: "rss" | "manual";
  name: string;
  config: { url?: string };
  enabled: boolean;
  lastFetchedAt: string | null;
}

export interface ContentItemDto {
  publicId: string;
  sourcePublicId: string;
  sourceType: "rss" | "manual";
  sourceName: string;
  externalId: string | null;
  title: string | null;
  body: string;
  publishedAt: string;
}

export interface OutboundPostDto {
  publicId: string;
  channelPublicId: string;
  provider: "x" | "linkedin";
  channelName: string;
  targetType: "personal" | "page" | null;
  adaptedBody: string | null;
  status: string;
  scheduledFor: string | null;
  postedAt: string | null;
  externalPostId: string | null;
  error: string | null;
  mode: "review" | "auto";
  delayMinutes: number;
  channelEnabled: boolean;
}

export interface ChannelAccountDto {
  publicId: string;
  provider: "x" | "linkedin";
  targetType: "personal" | "page" | null;
  targetName: string | null;
  status: string;
  lastError: string | null;
  mode: "review" | "auto";
  delayMinutes: number;
  enabled: boolean;
}

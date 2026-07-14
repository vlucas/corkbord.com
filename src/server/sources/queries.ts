import { and, eq } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import { sources } from "~/src/db/schema.ts";
import { ID_PREFIX, newPublicId, newUuid } from "~/src/lib/ids.ts";
import { fetchRssFeed, resolveRssSourceName } from "~/src/lib/rss.ts";
import { ingestRssSource } from "~/src/server/ingest.ts";
import type { SourceDto } from "~/src/types/dto.ts";

export async function ensureManualSource(organizationId: string): Promise<SourceDto> {
  const [existing] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.organizationId, organizationId), eq(sources.type, "manual")))
    .limit(1);

  if (existing) {
    return toSourceDto(existing);
  }

  const [created] = await db
    .insert(sources)
    .values({
      id: newUuid(),
      publicId: newPublicId(ID_PREFIX.source),
      organizationId,
      type: "manual",
      name: "Manual",
      config: {},
    })
    .returning();

  return toSourceDto(created!);
}

function toSourceDto(row: typeof sources.$inferSelect): SourceDto {
  return {
    publicId: row.publicId,
    type: row.type,
    name: row.name,
    config: row.config ?? {},
    enabled: row.enabled,
    lastFetchedAt: row.lastFetchedAt?.toISOString() ?? null,
  };
}

export async function listSources(organizationId: string): Promise<SourceDto[]> {
  await ensureManualSource(organizationId);
  const { desc } = await import("drizzle-orm");
  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.organizationId, organizationId))
    .orderBy(desc(sources.createdAt));

  return rows.map(toSourceDto);
}

export async function createRssSource(
  organizationId: string,
  input: { name?: string; url: string },
): Promise<SourceDto> {
  let feed;
  try {
    feed = await fetchRssFeed(input.url);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Could not fetch a valid RSS feed from that URL (${detail})`);
  }

  const name = resolveRssSourceName(input.url, feed.title, input.name);

  const [created] = await db
    .insert(sources)
    .values({
      id: newUuid(),
      publicId: newPublicId(ID_PREFIX.source),
      organizationId,
      type: "rss",
      name,
      config: { url: input.url, autoName: false },
    })
    .returning();

  await ingestRssSource(created!.id, organizationId, input.url, feed);

  const [updated] = await db.select().from(sources).where(eq(sources.id, created!.id)).limit(1);

  return toSourceDto(updated!);
}

export async function updateRssSourceName(
  organizationId: string,
  publicId: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Source name is required");
  }

  const [existing] = await db
    .select({ config: sources.config })
    .from(sources)
    .where(and(eq(sources.publicId, publicId), eq(sources.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    throw new Error("Source not found");
  }

  await db
    .update(sources)
    .set({
      name: trimmed,
      config: { ...existing.config, autoName: false },
      updatedAt: new Date(),
    })
    .where(and(eq(sources.publicId, publicId), eq(sources.organizationId, organizationId)));
}

export async function toggleSource(
  organizationId: string,
  publicId: string,
  enabled: boolean,
): Promise<void> {
  await db
    .update(sources)
    .set({ enabled, updatedAt: new Date() })
    .where(and(eq(sources.publicId, publicId), eq(sources.organizationId, organizationId)));
}

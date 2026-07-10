import { and, eq } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import { sources } from "~/src/db/schema.ts";
import { ID_PREFIX, newPublicId, newUuid } from "~/src/lib/ids.ts";
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
  input: { name: string; url: string },
): Promise<SourceDto> {
  const [created] = await db
    .insert(sources)
    .values({
      id: newUuid(),
      publicId: newPublicId(ID_PREFIX.source),
      organizationId,
      type: "rss",
      name: input.name,
      config: { url: input.url },
    })
    .returning();

  return toSourceDto(created!);
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

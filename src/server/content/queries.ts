import { and, desc, eq } from "drizzle-orm";
import { db } from "~/src/db/index.ts";
import { contentItems, sources } from "~/src/db/schema.ts";
import { ID_PREFIX, newPublicId, newUuid } from "~/src/lib/ids.ts";
import { ensureOutboundRows } from "~/src/server/outbound/queries.ts";
import { ensureManualSource } from "~/src/server/sources/queries.ts";
import type { ContentItemDto } from "~/src/types/dto.ts";

function toContentDto(
  item: typeof contentItems.$inferSelect,
  source: typeof sources.$inferSelect,
): ContentItemDto {
  return {
    publicId: item.publicId,
    sourcePublicId: source.publicId,
    sourceType: source.type,
    sourceName: source.name,
    externalId: item.externalId,
    title: item.title,
    body: item.body,
    publishedAt: item.publishedAt.toISOString(),
  };
}

export async function listContent(organizationId: string): Promise<ContentItemDto[]> {
  const rows = await db
    .select({ item: contentItems, source: sources })
    .from(contentItems)
    .innerJoin(sources, eq(contentItems.sourceId, sources.id))
    .where(eq(contentItems.organizationId, organizationId))
    .orderBy(desc(contentItems.publishedAt));

  return rows.map(({ item, source }) => toContentDto(item, source));
}

export async function getContent(
  organizationId: string,
  publicId: string,
): Promise<ContentItemDto | null> {
  const [row] = await db
    .select({ item: contentItems, source: sources })
    .from(contentItems)
    .innerJoin(sources, eq(contentItems.sourceId, sources.id))
    .where(
      and(eq(contentItems.publicId, publicId), eq(contentItems.organizationId, organizationId)),
    )
    .limit(1);

  if (!row) return null;
  await ensureOutboundRows(organizationId, row.item.id);
  return toContentDto(row.item, row.source);
}

export async function createManualContent(
  organizationId: string,
  input: { title?: string; body: string },
): Promise<string> {
  const manual = await ensureManualSource(organizationId);

  const [sourceRow] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(eq(sources.publicId, manual.publicId))
    .limit(1);

  const [created] = await db
    .insert(contentItems)
    .values({
      id: newUuid(),
      publicId: newPublicId(ID_PREFIX.content),
      organizationId,
      sourceId: sourceRow!.id,
      externalId: null,
      title: input.title?.trim() || null,
      body: input.body.trim(),
      publishedAt: new Date(),
    })
    .returning({ id: contentItems.id, publicId: contentItems.publicId });

  await ensureOutboundRows(organizationId, created!.id);
  return created!.publicId;
}

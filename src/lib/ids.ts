import { typeid, TypeID, type TypeID as TypeIDType } from "typeid-js";
import { uuidv7 } from "uuidv7";

export const ID_PREFIX = {
  source: "src",
  content: "cnt",
  channel: "cha",
  outbound: "out",
  setting: "cfg",
} as const;

export type IdPrefix = (typeof ID_PREFIX)[keyof typeof ID_PREFIX];

/** UUIDv7 for database primary keys. */
export function newUuid(): string {
  return uuidv7();
}

/** TypeID string for public URLs and APIs. */
export function newPublicId(prefix: IdPrefix): string {
  return typeid(prefix).toString();
}

export function parsePublicId<T extends IdPrefix>(value: string, prefix: T): TypeIDType<T> | null {
  try {
    return TypeID.fromString(value, prefix) as TypeIDType<T>;
  } catch {
    return null;
  }
}

export function randomSlugSuffix(length = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

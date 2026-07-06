export interface Tag {
  _id: string;
  name: string;
  color: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Raw shape of an entity's `tags` field as returned by the backend.
 *
 * List endpoints (candidates / jobs / clients) sometimes return `tags`
 * unpopulated — i.e. as a raw `string[]` of tag ObjectIds — even though the
 * detail endpoints populate them into full `Tag` objects. Both shapes need
 * to be handled at runtime; resolve via `lib/tags.ts` `useResolvedTags` /
 * `normalizeTags` before reading `name` or `color`.
 */
export type RawTag = string | Tag;

export interface CreateTagDto {
  name: string;
  color: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

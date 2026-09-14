export const MAX_SONG_TAGS = 7;
export const MAX_CUSTOM_TAGS = 5;
export const MAX_TAG_CHARS = 24;

/** Lowercase, trim, dedupe, and cap tag lists for storage. */
export function normalizeTags(
  input: string[] | null | undefined,
  max = MAX_SONG_TAGS,
  maxChars = MAX_TAG_CHARS,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of input ?? []) {
    const tag = raw.trim().toLowerCase().slice(0, maxChars);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
    if (result.length >= max) break;
  }

  return result;
}

export function normalizeCustomTags(
  input: string[] | null | undefined,
): string[] {
  return normalizeTags(input, MAX_CUSTOM_TAGS, MAX_TAG_CHARS);
}

export function tagsFromItunesGenre(genre: string | null | undefined): string[] {
  if (!genre?.trim()) return [];
  return normalizeTags([genre]);
}

/** Keep catalog/default tags; replace the custom-tag portion with the selection. */
export function mergeSongTags(
  currentTags: string[] | null | undefined,
  customCatalog: string[] | null | undefined,
  selectedCustom: string[] | null | undefined,
): string[] {
  const customSet = new Set(normalizeCustomTags(customCatalog));
  const catalog = (currentTags ?? []).filter(
    (tag) => !customSet.has(tag.trim().toLowerCase()),
  );
  const selected = normalizeCustomTags(selectedCustom).filter((tag) =>
    customSet.has(tag),
  );
  return normalizeTags([...catalog, ...selected]);
}

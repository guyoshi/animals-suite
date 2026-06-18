export type BookmarkKind = 'mission' | 'guide' | 'script' | 'entity' | 'test';

export function bookmarkKey(kind: BookmarkKind, id: string): string {
  return `${kind}:${id}`;
}

export function parseBookmark(value: string): { kind: BookmarkKind; id: string } | undefined {
  const separator = value.indexOf(':');
  if (separator <= 0) return undefined;
  const kind = value.slice(0, separator) as BookmarkKind;
  if (!['mission', 'guide', 'script', 'entity', 'test'].includes(kind)) return undefined;
  return { kind, id: value.slice(separator + 1) };
}

export function toggleBookmark(bookmarks: string[], value: string): string[] {
  return bookmarks.includes(value) ? bookmarks.filter(item => item !== value) : [value, ...bookmarks];
}

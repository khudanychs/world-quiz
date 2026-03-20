const TRAILING_INDEX_SUFFIX_RE = /\s\(\d+\)$/;

export function toPhysicalFeatureDisplayName(name: string): string {
  return name.replace(TRAILING_INDEX_SUFFIX_RE, "").trim();
}

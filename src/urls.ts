// Only canonical HTTPS GitHub Pages repository roots owned by econDS.
// Validate raw bytes before URL parsing: normalization must never hide an unsafe input.
export function approvedUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 256 && value === value.trim() &&
    /^https:\/\/econds\.github\.io\/[A-Za-z0-9][A-Za-z0-9_-]*\/$/.test(value);
}

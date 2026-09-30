// Production allowlist. Test fixtures use request routing; never ship localhost URLs.
export const approvedUrls = new Set([
  'https://econds.github.io/ro_tools_portal/',
  'https://econds.github.io/ro-leveling-map/',
  'https://econds.github.io/ro-reform-preparation/',
  'https://econds.github.io/dim_glacier_planner/',
  'https://econds.github.io/sessrumnir-ocean-week-guide/',
]);
export function approvedUrl(value: unknown): value is string {
  return typeof value === 'string' && approvedUrls.has(value);
}

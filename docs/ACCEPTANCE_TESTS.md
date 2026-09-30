# Acceptance tests to implement in Codex

## Catalog and portal

1. Exactly the intended apps appear; stable IDs unique; all related IDs exist.
2. Every launch URL is approved HTTPS without credentials, query payload or traversal. Planned tools have no launch anchor.
3. Rendering does not require a GitHub API token or a successful runtime API call.
4. With JavaScript disabled, the four declared destinations remain discoverable through static HTML links.
5. Thai/English alias search and filters work, including no-results state and clear filters.
6. Favorites and recent portal launches store only portal-owned metadata; the UI does not call them all browser visits.
7. Old event is labelled historical, not broken or active; unknown live check remains unverified.
8. A failed network check does not delete a valid registry entry or label it retired.

## Common navigation

9. Each integration has one portal link and current-tool identity; no duplicated top-level bar after initialization.
10. CSS does not alter the tool's table, buttons, headings or modals.
11. Local nav still works if catalog fetch is blocked, malformed or unsupported; app startup does not await it.
12. With nav JavaScript blocked, light-DOM fallback links remain visible.
13. Keyboard open/close/focus return and target sizes work at 360/390/768/1440 px.
14. Switching tools uses correct absolute destinations; docs/ source does not leak into Ocean URL.
15. All assets load under real repository subpaths; no root-relative /assets/ mistakes.

## Storage, state and imports

16. Open all apps on same origin, write each legacy key, reset portal, confirm all unrelated bytes unchanged.
17. Existing Reform migration flags and user prices are unaffected by nav install.
18. Existing Leveling shared links and saved settings load as before.
19. Existing Dim JSON/CSV/XLSX exports/imports remain compatible, including rate direction.
20. Storage blocked/quota error gives a warning but does not disable links or calculations.
21. Import preview cancellation performs zero writes; invalid payload performs zero writes.
22. Duplicate transfer/segment does not increase totals or inventory; future unsupported major schema rejected.
23. Dim total already including Refine is not added wholesale to a new Refine result.
24. Reform material plan cannot enter equipment calculator without explicit equipment identification.
25. Simulation and export never decrement real inventory. Two scenario copies are labelled hypothetical, not two copies of available stock.
26. Unknown grade/refine remains unknown and triggers confirmation, not silent +0/None.
27. Pricebook import cannot affect all apps on simple navigation; explicit per-app selection required.
28. Domain/scheme/port changes fall back to file transfer; no false claim that same-origin storage is universal.

## Security and provenance

29. Reject script URLs, executable catalog content, unapproved redirects and oversized data.
30. Metadata review date, game-data verification date and HTTP health check date remain independent.
31. Portal search does not claim to search full tool contents until a tested index exporter exists.
32. No secrets/PATs in frontend, no runtime latest executable dependency, no broad service-worker scope.
33. Each existing app baseline calculation/behavior tests pass without altered outputs after nav-only changes.
34. Cross-repo changes have separate review/rollback points; portal downtime does not become calculator downtime.

## Test honesty

The Python suite in this design kit checks its JSON/schema/registration invariants only.
These 34 browser/integration acceptance cases remain implementation work. Do not report them as passed before running the actual app tests.

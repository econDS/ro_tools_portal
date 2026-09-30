# Architecture decision record

## Decision A — Independent tools, one discovery portal

Runtime dependency graph:

```text
Portal --ordinary HTTPS links--> each tool
Each tool --local version-pinned nav bundle--> its own static assets
Each tool --optional, bounded JSON fetch--> public portal catalog
Each calculator --> its own local rules/data (never portal availability)
```

Not selected: iframe embedding, monorepo migration, microfrontend runtime composition, shared unversioned application state.
Reasons: preserve deployed URLs, old imports and existing calculation tests; portal outage must not disable tools; no framework migration required.

## Proposed repository layout (to implement, not already present in this kit)

```text
ro-tools-portal/
  src/
    data/tools.json
    data/journeys.json
    portal/                 search, category filters, cards, preferences
    styles/                 portal-scoped tokens and styles
  integrations/
    nav/src/                independent TypeScript custom element
    nav/contract.md
    manifests/              examples, schemas
    handoff/                versioned schemas, pure validators
  public/catalog/v1/        generated public JSON; no private user state
  scripts/                  build-time HTML generation, catalog validation
  tests/                    unit, accessibility, multisite fixtures
  docs/
  .github/workflows/
```

No runtime fetch is required to render primary portal cards. Generate real HTML anchors from the same catalog at build time; use one data source rather than manually duplicating card data.
MVP uses root page with query filters, not a router requiring server rewrites. Optional future detail pages should be static output files.
Choose and lock supported toolchain versions at implementation time; this kit does not prescribe guessed future package versions.

## Catalog ownership

Portal catalog is editorial truth for inclusion and launch URLs. Tool manifest is local truth for implemented capabilities.
Build/deploy checks can read app manifests, but must never auto-upgrade capability claims simply because catalog says planned.
Schema major versions must match. Additional optional minor fields can be ignored by older readers. Unsupported major versions cause a clear warning, not partial mutation.
Published catalog runtime projection should include only required navigation fields, not research evidence or credentials.

## Updating navigation

Bundle and fallback links are pinned locally per app. Snapshot version and bundle digest are recorded in a lock file.
Catalog fetch is optional and read-only, timeout bounded, validated by schema and URL allowlist before rendering, with a local fallback.
No dynamic import of catalog-provided scripts; no HTML from catalog inserted as markup.
Portal catalog update makes new links visible immediately on portal. Child menus see them when optional fetch succeeds or the snapshot is upgraded by PR. Calculator support still requires an app release.

## CI and deploy

Portal: validate catalog → validate examples → unit tests → build → browser test under /ro-tools-portal/ → deploy only from an authorized workflow.
Do not deploy during this planning handoff. Use minimum permissions and pin reviewed action revisions when implementing workflows.
Other repos: retain current publishing method. A portal integration PR must not unexpectedly change default branch, rename repository, or switch publishing source.
Health checks: GET, bounded redirects, allowlisted final host/path, timeout/retry, distinguish DNS/network error from HTTP 404. Verify HTML/title marker, not HTTP 200 alone.
Health snapshots carry check time; no fabricated live status badge. Schedule in CI can be added when useful, but this kit creates no scheduled task.

## Local multisite test

Serve fixtures for all repo subpaths under ONE local origin to catch storage and URL collisions. Also test separate local ports to ensure JSON-file transfer remains viable across origins.
Use a test-only URL resolver/config, never hardcode localhost into production catalog.
Freeze the clock for event classification tests; use Asia/Bangkok date interpretation and preserve date-only before-maintenance uncertainty.

## Non-goals for MVP

No accounts, cloud sync, centralized warehouse, real-time market scraping, automatic in-game actions, analytics tracking, game-rule ownership in portal, or runtime remote code loading.
A claim such as “ไม่มีระบบส่งข้อมูลการใช้งานของเรา” must not become “ไม่มี request ออกนอกเครื่องเลย”: pages, host infrastructure and any intentionally loaded resources still use the network [D1].

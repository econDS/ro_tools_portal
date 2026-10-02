# Portal PWA

This is a progressive enhancement of the existing static portal. It does not turn the linked calculators into offline apps or change their storage, formulas, navigation, catalog, or immutable nav releases.

## Installation and use

The production URL is `https://econds.github.io/ro_tools_portal/`. Supporting desktop/Android browsers expose their own install action; iOS/iPadOS users can use Safari's Share → Add to Home Screen. Availability and menu wording depend on the browser and OS. No automatic install prompt, permission request, tracking, or push notification is added.

The shell must load online and finish caching at least once before offline use. The first service worker takes control on a subsequent navigation. Offline mode supports the portal, local search, pins, history and theme. Links remain normal anchors to separate online sites. Cached catalog descriptions can be older, and browser storage can be evicted. A visible Thai notice distinguishes a saved fallback from current online content.

## Cache and update contract

- `manifest.webmanifest` has an explicit ID, start URL and scope of `/ro_tools_portal/`, with standalone display. Browser chrome follows the current portal theme; launch background defaults to the existing dark theme.
- `sw.js` is registered only from `/ro_tools_portal/` or `/ro_tools_portal/index.html`, at that exact scope, with `updateViaCache: 'none'`.
- Only the two entry documents are handled for navigation. Online navigation is network-first, bypasses HTTP cache revalidation delay, and falls back after network failure, 5xx or a 5-second timeout. Real 4xx responses are preserved. Query/hash search state works without storing query-bearing responses.
- The generated allowlist includes only this build's HTML, hashed JS/CSS, manifest, favicon and PNG install icons. No runtime cache writes, catalog JSON, shared-nav releases, cross-origin requests, sibling tools, or user state. Non-GET and query-bearing asset requests pass through unchanged.
- Every shell response is fetched without credentials/redirects and verified against a build-generated SHA-256 digest before cache writes. A partial or skewed CDN deployment cannot install an HTML/bundle mismatch. Vite preview and committed Pages HTML use identical relative asset links.
- Each complete build has a content-derived cache version. New workers wait for all existing controlled portal tabs/app windows to close; there is no `skipWaiting`, client claim, or automatic reload. The page explains when an update is waiting. Activation only deletes old `ro-tools-portal:pwa:` caches, leaving all other origin caches and localStorage keys alone.
- Online users always request current HTML even while an older worker waits. The older version's complete offline cache remains intact until its worker retires. Once activated, the new build replaces that offline snapshot.

## Source and publication

`pwa/` is source. `scripts/build-pwa.mjs` runs after Vite, validates icon presence, computes content digests, and writes `dist/sw.js`. The existing `npm run publish:root` copies generated assets into the Pages root; it does not deploy anything. Commit those generated files with source changes. Do not edit root `index.html`, `assets/`, `icons/`, `manifest.webmanifest`, or `sw.js` manually.

The icon artwork reuses the repository's existing green/white RO favicon. `icons/icon.svg` is its editable source; `icons/maskable.svg` adds an opaque background and safe inset. PNGs are committed, so no image-generation or production dependency is needed. To regenerate after editing SVGs, an optional local CairoSVG installation can render 192/512px regular icons, a 512px maskable icon, and a 180px Apple touch icon with `#2d5a41` background. Review the actual PNGs and maskable safe circle before committing.

## Verification

```
npm ci
npx playwright install chromium
npm run check
npm run publish:root
git diff --check
```

`test:pwa` runs Node tests against built output: manifest/PNG dimensions, allowlist, no credential transmission, partial/skewed installs, cache isolation, fallback, timeout and online freshness. Browser tests cover Chromium manifest/installability diagnostics, real registration and control, offline relaunch with persisted preferences, subpath and sibling boundaries, blocked workers, and waiting/activation updates on an isolated fixture server. Existing portal, accessibility and nav tests remain in the aggregate check. PR CI is read-only and uploads screenshots/traces; it never deploys or pushes.

Browser E2E is not an actual OS installation. Before release, manually verify desktop installation and Safari iOS/Android home-screen launch, icons/splash, exiting to linked calculators, offline reopening after an online visit, and closing/reopening multiple tabs across an update. Those physical-device installation flows are not automated here.

References: [MDN installation guidance](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [MDN icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons), [service-worker lifecycle](https://web.dev/articles/service-worker-lifecycle).

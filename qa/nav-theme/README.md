# Navigation 1.4.1 → 1.5.1 regression plan

## Status
Prepared scripts only. No browser pass or contrast measurements are claimed. Attempting the actual 1.4.1 baseline with installed /usr/bin/chromium failed before any page opened: Chromium process_singleton socket() Operation not permitted, with a read-only crashpad settings path. The failed local report was not copied into this suite; there are no manufactured baseline screenshots. Run the following in authorized CI with Playwright Chromium installed. Existing 1.4.1 evidence under /workspace/shared/nav140 is historical context, not new 1.5.1 evidence.

## Deliverables and reuse
- `capture-nav-layout.mjs`: existing production-page capture, copied unchanged except configurable Axe import. Six widths, actual getBoundingClientRect geometry, native disclosure, untouched theme/state, lossless PNGs, nav-scoped Axe on 390px
- `candidate-support.mjs`: immutable consumer commit and release-byte/provenance validation retained; accepts only 1.4.1 and 1.5.1 and allows explicit Portal repositoryRoot for git source lookup
- `candidate-behavior.mjs`: original complete keyboard, state, six destination activation, blocked local-module fallback, separate remote-catalog failure tests retained; optional Axe import path supports external dependencies
- `compare-nav-layout.mjs`: preserves existing assertions, replaces obsolete “strictly shorter than before” with 53px ±0.5px and equal old/new height; additionally compares all six border-box coordinates for nav/bar/shell/header/headerInner when closed (±0.5px), horizontal geometry when open, and unchanged closed header gap; optional boxes can both be absent. Open vertical size is reported without requiring identical glyph wrapping
- `computed-theme-audit.mjs`: actual foreground/background from computed styles, resolves sRGB alpha against ancestor colors across shadow boundary, fails closed for images/opacity/blend backgrounds, checks normal/menu/muted/current/current-label/button text ≥4.5:1; actual keyboard-modality focus style ≥2px and contrast ≥3:1 against control and surrounding backgrounds; reports full unrounded ratios and computed font strings; captures each focused control; records all font requests and CDP initiators
- `baseline.json`: pins present host checkouts at their current 40-character SHAs. Read only; no synthetic CSS replacement
- `candidate.json`: must fill actual candidate checkout paths and immutable commits, after all five integrations are committed
- Source component tests are part of tests/browser/nav.spec.ts: 8 tokens, legacy precedence, same-page theme changes, and no font requests
- `run-pair.sh`: full paired invocation with `classify-baseline.mjs`; baseline contrast-only deficiencies are recorded separately in baseline-deficiencies.json. Missing reports, incomplete captures, runtime errors, invalid focus style or any non-contrast failure still block. Candidate contrast and all candidate checks must pass

Run from Portal root with copied qa-draft scripts in qa/nav-theme (or set PLAYWRIGHT_MODULE and AXE_MODULE to absolute package module entries). Example:

    bash qa/nav-theme/run-pair.sh qa/nav-theme/baseline.json qa/nav-theme/candidate.json qa-results/nav-theme

Run both versions on the same Chromium version, OS fonts, locale, viewport and color-scheme. Fresh browser context per width/theme/state scenario; no manipulating app styles to force a pass. Pin all release files and SHA manifests in artifacts.

## Required matrix
Actual supported combinations: Leveling light/dark, Reform light/dark, Dim fixed light, Best fixed dark, Ocean fixed light. Do not label forced unsupported variants as real app behavior.

- All 7 combinations × 6 widths (320,360,390,430,768,1440) × 2 states × 2 versions = 168 measured geometry states
- 1440 and 390 × open and closed × 7 theme combinations × before/after = 56 primary screenshots; capture adds 14 supplementary 768px closed screenshots
- Actual closed strip is 53px; shell padding/edges/header gap/title position and open-menu geometry compare old/new. All targets ≥44px; no horizontal overflow or clipping at six widths; unchanged current identity full accessible name even when visually ellipsized
- All 7 combinations × 2 primary widths × 2 versions: keyboard Tab/Shift+Tab ordering, Enter/Space toggling, Escape closure/focus return, no focus trap, repeated opens, full URL/query/hash/storage/form preservation
- Same-page opposite-system switch and restore: automatic apps follow, fixed-theme apps remain stable. Then test real application theme toggle where one exists; do not substitute host attribute mutation in consumer captures. Attribute mutation belongs only in labeled source fixtures
- Block only local nav.js on all 7 combinations at 320/390/430 for both versions; visible Portal fallback, keyboard exit, 44px target, shell alignment/no overflow, usable application defaults. Computed-color supplement adds 1440 fallback color/focus evidence
- Separate optional-catalog fixture: lazy request, pending live region, remote failure, bundled 6 destinations preserved, no retry loop. Never present it as consumer default integration
- Native link activation to exact approved destinations retains harmless intercepted landing fixture labeling
- No new nav font dependencies: inspect CDP font initiators on real apps, compare before/after request sets, retain pre-existing app font requests separately. Also inspect release for new @font-face, @import, fonts.google* or font URL loading; run isolated source fixture with request recording and no app font sheets. CDP alone is useful attribution, not a proof about indirect stylesheet fetches

## Contrast/manual review
Normal/muted/current/button text use conservative 4.5:1 regardless of styling. Focus uses 3:1 against both control background and outside surface; transparent controls resolve to actual ancestor surface. Inspect normal, hovered, and focused states visually in both desktop/mobile states, especially current marker and focus near edges. For gradients or other unresolved backgrounds, do not substitute invented solid colors: sample actual rendered pixels or perform manual review and attach images. Axe incomplete records remain review obligations, not passes. Decorative icon identity colors are not text-ratio requirements; current marker and focus still need discernible visual contrast.

## Minimal CI adaptations
1. Preserve existing Portal `npm run check` and committed Pages-output verification unchanged
2. Reuse pinned checkout actions/dependency setup from nav-layout-candidate.yml, but remove old branch-only gate or replace it with the exact theming rollout branch; include 1.5.1 and qa/nav-theme paths
3. Pin current 1.4.1 consumer SHAs from baseline manifest as baseline, not the historic pre-1.4 rollout SHAs in old apps.json. Pin candidate integration SHAs separately; Ocean uses docs root
4. Fetch full Portal history for lock.sourceCommit provenance. Source release files must match lock and consumers byte for byte before behavior runs
5. Run complete paired script, upload qa-results with if:always, and use adequate timeout (45–60 minutes). The old strict-shorter assertion and original saved pre-1.4 baseline must not gate 1.5 theming
6. Preserve every consumer’s application regressions and first-run suites; source them from each repository’s existing workflows. Consumer branch-gated historical workflows need the same rollout gate adaptation, not deletion
7. Evidence PR should contain paired screenshot index, exact commits, browser/OS/font info, report JSONs, computed color/contrast table, request-initiation report, keyboard/fallback traces, and explicit unresolved/incomplete entries

## Existing application regression obligations
- Leveling: existing ro-suite-nav, nav-1.4.0, and first-run workflow script chains (static checks plus leveling/application/browser paths)
- Reform: existing nav-1.4.0 and first-run/default app scripts; preserve calculator and form regressions
- Dim: node --test tests/*.test.*; tests/dim-nav.browser.cjs; tests/first-run.browser.cjs; existing price-metadata QA
- Best: node --test tests/*.test.* / npm test; qa/best-status-nav/browser.cjs; tests/first-run.browser.cjs
- Ocean: node --test tests/*.test.cjs plus workflow browser suite, tests/suite130.browser.cjs and tests/suite-first-run.browser.cjs where enabled; serving docs root retained
- Portal: npm run check retains browser Portal/task-first/PWA/accessibility/nav and unit nav-release/PWA suites, plus release/publish output consistency

## Known draft limitations requiring verification
Local sandbox prevented browser execution, so computed-theme-audit is syntax-checked, not run-tested. It conservatively marks background images unresolved; host gradients will need rendered-pixel evidence when inherited into a transparent nav. Computed audit also records hovered text/focus colors, but source fixture coverage does not substitute for running the entire consumer matrix. For fixed fonts the suite must wait document.fonts.ready before screenshot or geometry claims. Version baseline deficiencies must be reported, not silently treated as new-candidate failures.


## 1.5.1 inherited-token regression gate
The immutable 1.5.0 release remains untouched. Candidate manifest now targets 1.5.1, whose private source defaults use namespaced variables. Computed audit loads `host-theme-audit.json` and compares all eight public properties to the exact audited mode values. It separately reads host body custom properties for each var()-based binding and checks consumed surface, hover/current, text, muted, border, accent, font, and keyboard focus styles. This catches neutral fallback colors that accidentally pass contrast. Baseline 1.4.1 has no eight-token expectations. Fixed light/dark consumers are exercised under both OS color schemes, including blocked-module fallback; automatic consumers use both supported schemes. Fallback checks all eight declared mappings plus its rendered surface/text/border/font/focus, since no expanded menu is present.

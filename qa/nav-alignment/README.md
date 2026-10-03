# Actual navigation layout evidence

`capture-nav-layout.mjs` serves five read-only local static checkouts and measures their rendered Chromium DOM. It does not modify app DOM, CSS, storage, theme attributes, or source files. Every width/theme uses a fresh context. Service workers are blocked in this geometry-only harness so a stale deployment cannot replace the pinned fixture; app-specific offline tests remain separate.

The baseline config pins all five latest-default commits as verified on 2026-10-02. A before run rejects wrong commits and tracked changes. The workflow checks these exact SHAs out, runs the harness and uploads its evidence even on failure. Run the baseline once before app changes. Keep its downloaded artifact unchanged for later comparison.

## What it records

- Actual 320, 360, 390, 430, 768, 1440px viewports at 1000px height
- Leveling/Reform automatic light and dark; Dim/Ocean real fixed-light; Best real fixed-dark
- Shadow `.bar` left/right edges against the selected app's actual content perimeter, independently of the nav surface perimeter
- Nav/host/bar/shell/header border and content boxes, computed padding/margins/colors, closed and open heights, header/title gaps and text line counts
- All visible suite links/buttons, actual hit sizes, overflow, Enter/Space/Escape and return-focus behavior
- Source SHAs, original index hashes, requested and actual themes, fonts, browser version, page errors, failed network requests and HTTP errors
- 35 viewport PNGs: 1440 closed/open, 768 closed, 390 closed/open across seven actual app-theme pairs
- `report.json` with 42 viewport/theme samples (84 closed/open states), and `geometry.tsv`

The primary alignment field is `barEdgeDelta`. `navBorderEdgeDelta` is recorded separately, since the new full-width surface intentionally need not share the app-content edge. Reform's target is `.header-inner` content (18px at 641–900px), not `main` (28px there). Leveling uses `main` content; its existing app header has different mobile/wide padding. Dim/Ocean have zero-padding content containers, so their content and border horizontal edges coincide. Best uses `main.shell` content to detect accidental double padding.

## Run and compare

Install repository dependencies and Chromium normally. Do not ignore browser certificate errors. The optional `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE` environment variables select an existing local installation.

    node qa/nav-alignment/capture-nav-layout.mjs --config qa/nav-alignment/apps.json --out qa-results/nav-alignment-before --stage before

For a candidate, copy the config into a new file, point checkouts at reviewed candidate commits and update `expectedCommit` to those exact SHAs. The app/theme/width keys must stay equal for direct comparison.

    node qa/nav-alignment/capture-nav-layout.mjs --config qa/nav-alignment/candidates.json --out qa-results/nav-alignment-after --stage after
    node qa/nav-alignment/compare-nav-layout.mjs qa-results/nav-alignment-before/report.json qa-results/nav-alignment-after/report.json qa-results/nav-alignment-comparison.json

The comparator gates 1px bar alignment, no increased closed height, 44px suite targets, no new page overflow, no nav overflow, no overlap, no additional identity wrapping, actual keyboard behavior, and no new page errors. Browser screenshots still need visual review. App calculation, storage, share, custom-price, PWA, module-failure and offline regressions are covered by the individual app suites, not inferred from this geometry run.

## Local environment limit

The assigned cloud execution sandbox rejected Chromium's local process socket during both normal and approved escalated launch. Those attempts produced no screenshots or geometry and are not a baseline. The CI artifact is the first browser evidence if its capture completes successfully. The local script passed `node --check`; `apps.json` passed JSON parsing before publication.

## Candidate contract additions

Use `candidates.json` for the five exact reviewed child commit pins. `candidates.template.json` is a placeholder reference only and deliberately fails if run without replacing its SHAs. The candidate workflow reruns the immutable baseline source commits, captures candidates, compares to both that replay and the compact, provenance-linked projection of the original baseline artifact, then runs the separate behavior suite.

The candidate geometry comparison additionally verifies supported real themes; a genuinely smaller single-row closed bar; full current accessible name (mobile visual ellipsis is explicitly permitted); six exact anchor destinations; all full open-menu names; a non-launchable Grade & Refine item; named toggle; actual disclosure state; unchanged app body colors; unchanged storage values and query/hash after navigation; and no new HTTP or request failures. It normalizes ephemeral local server ports when comparing failed requests. The original Leveling manifest ERR_ABORTED entries are retained in baseline evidence and are not mistaken for new failures.

`candidate-support.mjs` verifies source hashes at the immutable Portal source commit, checks the release lock's bundle digests, and requires all three local consumer artifacts to be byte-identical to Portal 1.4.1. Candidate checkouts must be clean at exact recorded commits.

`candidate-behavior.mjs` covers:

- Actual app integrations at 390 and 1440 in all supported themes: Portal→toggle→five links→outside Tab order, Shift+Tab back to Portal, Enter/Space/Escape, focus return, repeated toggles, exact link identity and current state
- Same-page automatic light/dark changes for Leveling/Reform; fixed theme stability under the opposite OS preference for Dim/Best/Ocean; unchanged URL/storage/form state through the change
- A clearly labeled state-preservation scenario adds harmless query/hash sentinels with history.replaceState only after saving untouched defaults; neither defaults nor screenshots are presented as that fixture
- 30 real native anchor activations from the five candidate apps to their six exact, unchanged canonical destination URLs. Request routing supplies explicit harmless landing fixtures. This proves native activation and destination URLs; individual child suites establish calculator/app behavior
- Actual blocked-local-module fallback at 320/390/430 in every app/theme; aligned content edges, 44px link, no overlap/overflow, keyboard exit, unchanged default form values, and 390px screenshots
- Seven separately labeled optional-catalogue-failure component fixtures. They deliberately add the opt-in catalog attribute and abort the catalogue endpoint. Actual app integrations remain untouched. Checks cover lazy fetch, snapshot preservation, failure notice and no retry loop
- Axe WCAG2A/AA and2.1AA, including rendered color contrast: real app nav closed/open at 390 for both immutable baseline replay and candidate; candidate fallback nav at 390. Incomplete/manual findings are retained for review rather than silently called passing

The geometry capture and the normal app scenarios do not swallow the intentional fixture failures into production errors. No Chromium certificate warnings are bypassed. The assigned process sandbox still cannot launch Chromium; source/syntax checks are local, while actual geometry and behavior claims require successful CI artifacts.

Final candidate version is 1.4.1. The optional catalogue fixture holds its request pending and verifies that the connected, empty role=status node is displayed and visible inside the open panel before releasing the network failure. This establishes rendered live-region availability, not actual screen-reader speech. Immutable 1.4.0 bytes remain preserved.

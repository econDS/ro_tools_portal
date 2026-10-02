# RO Tools Portal — Task-First Navigation

## Baseline
Base: `f17c9fd03c33b4519a9594999123ac8ca7ef9add`, latest main checked 2026-10-02. Fresh isolated checkout was clean. Root publishing at `/ro_tools_portal/`. No local user work overwritten.

Before: three repeated general entry surfaces (Hero destination list, catalog, late journeys), plus personal shortcuts and search. Hero repeats all six tools. Empty Quick Access renders two full panels. Journeys have four entries, no crafting task, and two planned handoffs. Five listed tools were counted together as “พร้อมใช้”, including the archived guide.

Baseline immutable source is run separately in the PR-only CI job, with original tests and initial/returning screenshots in both themes at 360/390/768/1440px. The capture records actual Hero, empty Quick Access and search positions in metrics.json; it never substitutes modified HTML for the baseline.

## Changes
Compact purpose-led Hero with two anchor CTAs. Four active, data-driven tasks before search/catalog. Archived Ocean task copy stays with the archived catalog group. Grade & Refine remains non-launchable in its own planned group. Returning shortcuts remain above tasks; empty individual panels and the empty container hide, leaving one short pin hint. Search hides empty groups without changing its URL behavior. Existing source titles replace opaque S-number labels.

## Scope guard
Registry, public catalog, nav releases/source, IDs/URLs, preference store, PWA runtime and service-worker template are byte-identical to baseline. Generated root assets and service-worker content digest are rebuilt normally. No child repository or business logic changes.

## Verification
Local build/typecheck, immutable nav and PWA unit tests run. Local browser install failed because its download was not a valid archive; no local browser pass claimed. Full original baseline and final candidate browser suites run in read-only PR CI. New cases cover hierarchy/grouping, all six requested search terms, empty/returning shortcuts, both real stored themes, keyboard/skip link/focus, touch targets, duplicate IDs and four widths. Existing full suite retains URL/category/no-results, malformed/blocked/quota storage, pin/recent/reset, static fallback, nav release and offline/update coverage.

Screenshots and baseline geometry are CI artifacts. Each run identifies its exact head; baseline screenshots identify f17c9fd. Real devices, Safari/WebKit/Firefox, manual app installation and Pages after merge are not tested. No conversion or usability uplift is claimed.

## Rollback
Revert this feature commit to restore old generated and source UI together. No storage migration or registry rollback required.

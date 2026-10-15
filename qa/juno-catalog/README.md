# Juno catalog integration

Stable ID: `juno-festival-2026`. URL: https://econds.github.io/RO-Juno-Fall-Academic-Festival-2026/ . Source metadata is pinned to Juno commit `c5d1aaf4eecccbcdbb876dee2d3eaa61615b11ea` in `data/sources.json`. The guide states 14 October–11 November 2026 before maintenance; `dated-period` describes that source, without asserting a live event, live HTTP health, or game-server verification. No existing tool metadata changed except the registry review date/version.

`npm run publish:root` generates the public catalog and Portal card from the registry. The frozen 2.0.0 fallback and every historical release file remain unchanged. No child rebuild or new navigation release is required. Juno itself installs the same approved 2.0.0 files in its separate PR.

## Verification

- `CHROMIUM_PATH=/usr/bin/chromium PORTAL_TEST_PORT=4191 npm run check`: build/typecheck, release and PWA unit checks, complete browser suite including six new Juno checks.
- `python -m unittest tests/test_design_kit.py`: 21 tests, 19 passed, two existing local-only planning checks skipped.
- `node qa/juno-catalog/verify-children.cjs`: archives each child's pinned deployed commit into a temporary directory, loads its actual HTML and unchanged local bundle, routes only the exact central JSON endpoint to the generated candidate catalog, and verifies discovery before opening, mobile search, Escape, all three artifact hashes and all Portal historical release bytes. See `children-evidence.json`. Requires the five sibling repositories and Chromium locally; the repeatable frozen-bundle five-ID regression also runs in ordinary CI.

The actual-child check runs no child builds and edits no sibling files. External app resources are blocked for deterministic navigation testing; this is not new calculator coverage. Live public HTTP/CORS checks remain unavailable from this execution network. Existing generic hostile-catalog, offline, timeout, keyboard, theme, accessibility and Portal regression tests remain enabled.

## Rollout and rollback

Review and approve both Portal and Juno PRs before deployment. Deploy this Portal catalog first, then Juno integration. Existing five children discover Juno on their next load. Before catalog deployment, Juno still has a visible local fallback and V2 safely handles its unknown current ID. Removing/hiding the registry entry and regenerating Portal output rolls back discovery without touching child bundles. Do not regenerate the frozen snapshot or alter historical releases for catalog changes.

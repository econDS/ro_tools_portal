# RO Tools Suite dynamic navigation — coordination evidence

This report records implementation verification for six Draft PRs. No PR was merged, no application deployed, and no Pages settings changed. All repositories use `feat/dynamic-ro-suite-nav`. The implementation-head CI runs below succeeded. A later documentation-only Portal commit carrying this report is verified separately in Portal PR #8; the table intentionally retains the exact implementation heads to which this evidence applies.

## Coordination table

| Repository | Branch | Draft PR | Verified implementation head | Tests / CI | Blockers and readiness |
| --- | --- | --- | --- | --- | --- |
| ro_tools_portal | feat/dynamic-ro-suite-nav | [#8](https://github.com/econDS/ro_tools_portal/pull/8) | `e68d567230c798e70bb351bc8d67f71c68f6c0d1` | [Passed](https://github.com/econDS/ro_tools_portal/actions/runs/38652210683): 94 browser, 6 release-provenance, 11 PWA unit tests; immutable rebuild and generated-root verification | Ready for review; no implementation blocker |
| ro-leveling-map | feat/dynamic-ro-suite-nav | [#6](https://github.com/econDS/ro-leveling-map/pull/6) | `cc5b0150a3804316aedeceaeca46c146a9d1d47e` | [Passed](https://github.com/econDS/ro-leveling-map/actions/runs/38652015802): 47 Node, 4 Python, full legacy browser and dynamic scenarios | Ready for review; local Google Fonts proxy failure did not recur in CI |
| ro-reform-preparation | feat/dynamic-ro-suite-nav | [#8](https://github.com/econDS/ro-reform-preparation/pull/8) | `d777741e5a4a9ec584e187ff3175601f4d59d4bc` | [Passed](https://github.com/econDS/ro-reform-preparation/actions/runs/38652015655): 91 unit and 81 browser checks | Ready for review; no implementation blocker |
| dim_glacier_planner | feat/dynamic-ro-suite-nav | [#12](https://github.com/econDS/dim_glacier_planner/pull/12) | `0b93fdfca36d70955efdd625c5b83e4f92dcf92d` | [Scoped CI passed](https://github.com/econDS/dim_glacier_planner/actions/runs/38651867679): 7 source tests and V2 browser scenarios at 320/390/1440px | Reviewable with explicit coverage caveat: full historical suite still has seven base failures; JSON roundtrip passed, broader file-format browser suite unrun. See [Glacier evidence](glacier/README.md) |
| sessrumnir-ocean-week-guide | feat/dynamic-ro-suite-nav | [#10](https://github.com/econDS/sessrumnir-ocean-week-guide/pull/10) | `7f7f6ecb08a9f63920cde09477e96b8280ff99ca` | [Passed](https://github.com/econDS/sessrumnir-ocean-week-guide/actions/runs/38652348425): 24 static, 6,238 browser assertions, 10 dynamic scenarios; [46 screenshots/report](https://github.com/econDS/sessrumnir-ocean-week-guide/actions/runs/38652348425/artifacts/11935382544) | Ready for review; preserves master/docs publishing |
| ro-best-status | feat/dynamic-ro-suite-nav | [#7](https://github.com/econDS/ro-best-status/pull/7) | `9180d9cb2c94cfb2eebead59fe240644ab632ea6` | [Passed](https://github.com/econDS/ro-best-status/actions/runs/38651853752): 37 source tests, full calculator/theme/keyboard/persistence, dynamic and first-run comparisons | Ready for review; no implementation blocker |

Historical workflows restricted to earlier feature-branch names were skipped, not counted as successful coverage. New scoped workflows run the relevant candidate checks. Glacier's full historical suite is explicitly not green.

## Architecture and immutable artifacts

See the [V2 contract](../V2-CONTRACT.md). The component stays local and versioned. It renders a frozen fallback immediately, then automatically fetches `https://econds.github.io/ro_tools_portal/catalog/v1/tools.json` on connection, before the menu opens. Schema major 1 remains; raw canonical URLs are restricted to HTTPS repository roots on `econds.github.io`, without credentials, ports, queries, fragments or encoded/normalized paths. Loading is bounded to 500 tools, 262,144 bytes and 1.5 seconds, including response body reads. No remote executable code is loaded. The compact searchable menu preserves theme/alignment APIs and keyboard focus.

Live registry publishing is decoupled from immutable fallback generation. New origins or path shapes require a reviewed component release; adding another approved repository root does not. HTTP cache is revalidated on load; a reload retries a failed fetch. There is no persistent catalog cache or polling loop.

The [2.0.0 release](../releases/2.0.0/) records source commit `e2712f1cc4d7c72ccd31f384e5292c3d9bb19529`, committed before packaging. Source ancestry and source hashes were verified.

| Artifact | SHA-256 |
| --- | --- |
| nav.js | `4dbb1926029f87aa7ba9b8bbd826d579feae3b1938e7a203fd8f6a0df5961e6a` |
| catalog.snapshot.json | `a198338ddcb7857094ef950fb1315c532840cf53ac8e7a69b331d8cb4a87dd5d` |
| nav.lock.json | `7c195d008803b8e19248dffba327b3824edf2c8eeeefbb94e4ad308bb8c11d58` |

Independent coordinator checks confirmed identical copies of all three artifacts in all five children and 111 byte-identical historical release files. Each child's production HTML matches its original bytes after reversing only the module version from 2.0.0 to 1.5.1. No formula, storage, application style, import/export implementation or publishing path changed. The [machine-readable verification record](independent-verification.json) records exact heads, checks and CI run IDs.

## Mandatory proof: no child rebuild/redeployment

The [automated registry test](../../../tests/browser/nav-dynamic.spec.ts) copies Portal sources to an isolated directory, adds `future-tool` to the actual registry, runs a real Vite build, checks the generated Portal discovers it, and serves the generated JSON to an unchanged local navigation bundle. The unknown current tool resolves to the new title and URL. The test hashes the bundle and historical releases before and after and requires unchanged bytes. Additional isolated builds test registry-only hiding/removal and reject dangling registry references.

Separately, the coordinator loaded the actual five child pages at a mobile viewport, supplied 120 new central catalog entries, and verified a request before opening, discovery/search and Escape behavior without changing any child bundle. This is a controlled browser demonstration, not a claim of production rollout. Runtime tests also cover rename/removal/reorder, unknown IDs, hostile URLs/schema/duplicates/oversize, offline/timeout/script failure, keyboard/mobile/themes and application regressions, subject to Glacier's documented scope.

## Migration, rollback and rollout order

1. Review the Portal and five child Draft PRs together. Preserve the release source commit's ancestry with a normal Portal merge; do not squash/rebase away the recorded source commit.
2. After separate production approval, publish the Portal catalog first. Root output is generated locally with `npm run publish:root`; this task did not deploy it.
3. Roll out one child canary (Leveling is a suitable first check), then the other children independently. Keep Ocean on master/docs and the others on their established main/root paths.
4. Future additions, renames and ordering changes are registry-only publication changes. Hide a tool to retire it; physical deletion also cleans its related IDs within the registry. Stale editorial journeys are safely omitted. No child rebuild is needed.
5. Roll back a child by restoring its retained `assets/ro-suite/1.5.1/nav.js` script path. This removes dynamic discovery but does not migrate or clear saved data. Revert an invalid central registry change and republish the catalog separately; invalid runtime responses already retain local fallback.

No merge, deployment or production approval is implied by green CI or this report.

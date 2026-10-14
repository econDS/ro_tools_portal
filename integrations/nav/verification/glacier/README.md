# Glacier historical failures and coverage boundary

The V2 scoped CI is green; the full historical suite is not. This evidence distinguishes unchanged base failures, byte-preservation checks and executed application behavior. No historical failure was removed, skipped inside its test, or changed to pass.

## Fresh unchanged-base reproduction

On Node `v24.19.0`, independent pristine `git archive` extractions were tested without editing their source files:

| Revision | Exact commit | Command | Exit | Result |
| --- | --- | --- | --- | --- |
| Unchanged main base | `08d2d0e7c70a7057dce5272abe2e44716fcb927c` | `node --test --test-reporter=tap tests/*.test.*` | 1 | 24 tests: 17 pass, 7 fail |
| V2 candidate | `0b93fdfca36d70955efdd625c5b83e4f92dcf92d` | same | 1 | 27 tests: 20 pass, 7 fail |

The three added candidate tests pass. The seven failing names and error signatures match exactly, including assertion messages, error codes, expected/actual values, operators and the module-loading assertion. Only timings, archive-specific absolute paths and stack frames are excluded from signature comparison. This is fresh reproduction, not reliance on a prior narrative or CI skip.

Evidence: [base TAP](base.tap), [candidate TAP](candidate.tap), [machine-readable comparison](comparison.json), [comparison script](compare.py), [SHA-256 manifest](manifest.json). Run `python3 compare.py` from this directory to recompute the comparison from the preserved logs. To rerun the tests, fetch both commits in a Glacier checkout, extract each with `git archive <commit> | tar -x -C <separate-empty-directory>`, then execute the test command in each directory. Exit 1 is expected in both. Do not normalize or edit the archived source before running.

## Exact seven failing tests

| Source | Exact failing test name | Same failure on base and candidate |
| --- | --- | --- |
| `tests/dim-nav.test.cjs` | `tests/dim-nav.test.cjs` (file-level load failure) | `price-metadata-normalize.cjs` expects one reviewed old price-label fragment and finds zero (`0 !== 1`); file fails before its tests run |
| `tests/first-run.test.cjs` | `only exact first-run HTML/CSS delta; entire calculation and persistence implementation unchanged` | Historical reconstructed-HTML hash mismatch; actual `48129ee9…`, expected `ab6eb4f0…` |
| `tests/nav130-rollout.test.cjs` | `1.3.0 exact source artifacts, lock, Best Status, planned status, and additive rollback` | Same missing old price-label fragment (`0 !== 1`) |
| `tests/nav140.test.cjs` | `nav140 reverses exactly to untouched latest main, preserving every original app/first-run byte` | Historical reconstructed-HTML hash mismatch; actual `bf5e06ff…`, expected `8f0a58b9…` |
| `tests/price-metadata.test.cjs` | `only exact reviewed metadata/labels edits; old default inputs, styles, business logic and nav reconstruct unchanged` | Same missing old price-label fragment (`0 !== 1`) |
| `tests/price-metadata.test.cjs` | `all original export functions, parser, formulas and default prices remain exact bytes` | Same normalizer failure (`0 !== 1`) before the export/parser comparison completes; this check did **not** pass |
| `tests/ui-cohesion.test.cjs` | `only the reviewed presentation delta: reversing it reproduces the previous index byte for byte` | Historical reconstructed-HTML hash mismatch; actual `f62b5f5b…`, expected `8c133587…` |

Full hash values and exact errors are retained in `comparison.json` and both TAP logs. These prove the failures predate the V2 change; they do not resolve the historical drift or establish every calculator behavior as tested.

## What CI included and excluded

The [candidate workflow](https://github.com/econDS/dim_glacier_planner/blob/0b93fdfca36d70955efdd625c5b83e4f92dcf92d/.github/workflows/nav200-qa.yml) runs only on same-repository PRs to main from `feat/dynamic-ro-suite-nav`, with read-only permissions. [Run 38651867679](https://github.com/econDS/dim_glacier_planner/actions/runs/38651867679) passed on the candidate. CI uses Node 22.14.0 and Playwright 1.55.1; the fresh full-suite reproduction above separately uses local Node 24.19.0.

Included source command: `node --test tests/nav200.test.cjs tests/nav150.test.cjs` (7 tests):

- Four retained nav150 guards: exact host tokens/font, pinned release integrity/catalog, read-only rollout QA, and frozen original 1.5.0 bytes.
- Three new V2 guards: raw candidate markup/ID/fallback; exact full-HTML reversal to current main plus every old asset hash; immutable V2 bundle/catalog lock and central endpoint.

Excluded from the scoped CI command, but rerun in full locally for the evidence above: `dim-nav.test.cjs`, `first-run.test.cjs`, `nav130-rollout.test.cjs`, `nav140.test.cjs`, `price-metadata.test.cjs`, and `ui-cohesion.test.cjs`. Exclusion is by whole file, so it excludes passing checks in those files as well as their seven failures. The new workflow isolates this navigation change from pre-existing historical-normalizer drift; it does not repair or waive those failures.

Included browser command: `node tests/nav200.browser.cjs`, at 320/390/1440px. It covers automatic catalog loading before menu opening, add/rename/removal/reorder without bundle changes, 126 tools/search, unknown-to-known identity, Escape focus restoration, fixed light theme under OS dark preference, bounded layout, offline/invalid/oversized/timeout fallback, blocked local module fallback and actual JSON persistence/roundtrip behavior.

Not executed by this scoped CI: `dim-nav.browser.cjs`, `first-run.browser.cjs`, `ui-cohesion.browser.cjs`, and `price-metadata.browser.cjs` (a module used by the historical runner). The historical workflows remain restricted to their original feature branches and were skipped. Keeping those gates and adding focused V2 coverage avoided treating old historical baseline reconstruction as a new navigation failure. **This means the broader historical browser matrices are unrun, not passed.** Full details and workflow names are in [coverage.json](coverage.json).

## Import/export: passed versus unrun

| Coverage | Result |
| --- | --- |
| Actual JSON export download, parsed app marker and cube quantity | Passed in scoped CI at all three widths |
| Actual file-chooser JSON import after modifying the cube input; restores cube quantity and same calculated total | Passed at all three widths |
| Local persistence across reload, same total under offline navigation and blocked nav script | Passed |
| Full HTML and old-asset byte preservation relative to current main | Passed; establishes unchanged implementation, not all runtime behavior |
| Historical test named “all original export functions, parser, formulas and default prices remain exact bytes” | Failed on both base and candidate before that comparison completes |
| CSV export/import; XLSX export/import through SheetJS; legacy XLS import | **Unrun in scoped CI** |
| Historical baseline-download compatibility and malformed/partial/rejected import cases, price-timestamp import semantics | **Unrun in scoped CI** |
| Full calculator scenario matrix, migrations, clipboard, all destination/back interactions, historical first-run/pixel comparisons | **Unrun in scoped CI** |

Readiness: the navigation change is reviewable with passing scoped CI and exact application-byte preservation. There is no evidence of a new failure among the rerun source tests. Broader file-format/runtime regression coverage remains a limitation; green scoped CI must not be represented as a green complete historical suite.

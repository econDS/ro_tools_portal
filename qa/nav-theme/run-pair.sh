#!/usr/bin/env bash
set -u
# Run from Portal checkout; all manifests require immutable commits and exact release files.
HERE="$(cd "$(dirname "$0")" && pwd)"
BASELINE="${1:?baseline manifest required}"
CANDIDATE="${2:?candidate manifest required}"
OUT="${3:?output directory required}"
mkdir -p "$OUT"
status=0
# Capture/provenance failures block. Historical contrast alone is documented separately.
node "$HERE/capture-nav-layout.mjs" --config "$BASELINE" --out "$OUT/before" --stage before || status=1
node "$HERE/capture-nav-layout.mjs" --config "$CANDIDATE" --out "$OUT/after" --stage after || status=1
node "$HERE/compare-nav-layout.mjs" "$OUT/before/report.json" "$OUT/after/report.json" "$OUT/comparison.json" || status=1
node "$HERE/candidate-behavior.mjs" --config "$BASELINE" --out "$OUT/before-behavior" || true
node "$HERE/computed-theme-audit.mjs" --config "$BASELINE" --out "$OUT/before-colors" || true
node "$HERE/classify-baseline.mjs" "$OUT" || status=1
node "$HERE/candidate-behavior.mjs" --config "$CANDIDATE" --out "$OUT/after-behavior" || status=1
node "$HERE/computed-theme-audit.mjs" --config "$CANDIDATE" --out "$OUT/after-colors" || status=1
exit "$status"

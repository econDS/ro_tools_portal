# งานปรับปรุงราย repository

ทุกงานเริ่มจากอ่าน branch/โครงสร้างจริง ตรวจ baseline และเก็บการเปลี่ยนเป็น PR แยก ไม่แก้สูตรกับ UI integration ใน PR เดียวกันโดยไม่มีเหตุจำเป็น
ชื่อไฟล์เป้าหมายใหม่ในเอกสารนี้เป็นข้อเสนอ ไม่ได้อ้างว่ามีอยู่แล้ว

## 1. ro-tools-portal — repository ใหม่

P0: catalog, static cards, ordinary links, search/category filters, planned state, event archive distinction, metadata sources.
P1: favorites, recent portal launches, help/report issue, nav component and snapshots, mobile/keyboard tests.
P2: tool manifests, actual capability status, related workflows and link checks.
P3: validated JSON handoff UI and optional pricebook, only after receiving tools implement support.
Do not copy all map/recipe data into portal or add backend/account scaffolding for MVP.

## 2. sessrumnir-ocean-week-guide — first integration pilot

Observed: master branch; public source under docs [S5]. Existing content includes dated event header, NPC /navi and opening quest directions [S6].
Touch: docs/index.html for common nav and historical-edition banner; add docs/assets/ro-suite/<version>/; add docs/tool-manifest.json after implementation.
Add stable section anchors such as #warp-npcs, #opening-quest, #daily-quests, #rewards only after identifying the actual section boundary; do not register these anchors before they exist.
Keep existing anchors, copy actions, images and text. Do not guess current event recurrence from the old edition. If a new edition comes, preserve the 2026 guide as an archived edition rather than silently replacing historical dates.
Tests: /navi copied text unchanged, section anchor works, gallery/modal behavior unchanged, original relative images load, date status not active at 2026-09-19, nav failure leaves guide usable.
Do not change master to main or add /docs/ to the public link.

## 3. ro-reform-preparation

Observed: root app and calculator separated; existing namespace reform-workshop.v1 with migration flags [S2,S3].
Touch: index.html for nav and related-tools section; isolated app.js adapter for import/export later; assets/ro-suite/<version>/ and tool-manifest.json.
Do not touch calculator.js merely to add navigation. Keep default price migration behavior and item ID mappings intact.
P1: portal link, tools menu, source/data coverage note; explain that not every item-specific recipe is included.
P2: export material-plan.v1 with requirements, actual inventory snapshot, cash-required vs material value and NPC fees. It is not proof of an equipment outcome.
P3: when the user identifies a real resulting item (or a verified recipe supplies it), offer a separate reviewed equipment snapshot to Grade/Refine; preserve unknown grade/refine as unknown until confirmed.
Tests: identical inputs yield identical existing totals; shared BSB/ores not double-used; reset portal leaves reform keys/flags unchanged; cancel import leaves state unchanged; import legacy data behavior remains.

## 4. ro-leveling-map

Observed: root index.html with assets/ui.js; existing settings-share flow and historical Spotlight selection [S1,S7].
Touch: index.html for nav; new adapter in assets/ without modifying formulas; inspect actual settings/serializer module before extending it.
P1: common navigation and concise related tools, no forced full-page redesign.
P2: stable landing targets for settings/results and optional selected map detail; use existing share encoding/decoding, not a competing state serializer.
P3: optional lightweight profile with player level and explicitly supported values; do not overwrite saved buffs or current event selection on arrival from portal.
Keep descriptions precise: area score ≠ EXP/hour; portal does not compute map results itself.
Tests: saved settings, shared URLs, sort, selected map modal, return focus, copy link and event expiry unchanged; invalid incoming settings rejected; header not overlaid on sticky controls.

## 5. dim_glacier_planner

Observed: root index.html and assets; README documents JSON/CSV/Excel interchange, prices, Enchant and Refine budget [S4].
Touch: index.html and isolated suite adapter after identifying current state/import/export logic; local nav artifact and tool-manifest.json.
P1: common nav and related Grade/Refine description (non-launching while planned).
P2: opt-in JSON equipment snapshot with explicit item/grade/refine/enchant confirmation, input materials and separate cost stages. Existing exporters remain compatible.
P3: optional “ให้ Grade & Refine คำนวณช่วงนี้” action when destination supports it; keep Cube/Device/manual-budget mode as fallback unless intentionally replaced in a separate tested change.
Tests: golden craft/enchant/refine examples unchanged; old JSON/CSV/XLSX round-trip still works; exchange-rate units correct; importing returned Refine cost replaces nominated estimate rather than adding the same stage twice.
Do not turn an estimated target refine into a claim that the user already owns that refine state.

## 6. ro-grade-refine-planner — future app

Not verified as deployed in this research; preserve planned status.
Build with nav and manifest contracts from the start, and implement import types only as rules/state support becomes available.
Accept equipment snapshots with explicit grade/refine, item identity, rule context, prior cost segments and user confirmation.
Do not reinterpret Reform materials as final equipment. Offer returned cost summary with non-overlapping segments and ruleset/price snapshot, not a mutation of the source app.
Upgrade portal listing to launchable only after canonical URL and actual manifest are tested.

## Suggested merge/release order

Portal standalone → versioned nav artifact → Ocean pilot → Reform → Leveling → Dim Glacier → manifest/deep-link release → supported Grade/Refine handoff.
Existing app functional changes and any extraction into modules happen in separate small changes after baseline tests, not a simultaneous rewrite.

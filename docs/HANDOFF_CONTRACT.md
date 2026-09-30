# การส่งต่อข้อมูลระหว่างเครื่องมือ — ร่างสัญญา

เอกสารนี้ระบุข้อกำหนดการ implement ในระยะหลัง ไม่ได้อ้างว่าเครื่องมือเดิมรองรับ suite schema แล้ว

## Layers

L0 links: universal, no app-state change.
L1 targeted URLs: use the existing app serializer and add only namespaced routing/context fields that the receiving app actually supports. Preserve unknown pre-existing query/fragment fields on share.
L2 portable JSON: explicit export → import preview → validation → confirmation → local commit. This is the default shared data transport before same-origin shortcuts.
L3 optional same-browser one-click handoff: opaque transferId, bounded TTL, targetToolId, sourceToolId, schema version, size limit, and an explicit import screen. Failure falls back to JSON export/import.

Do not rely on shared localStorage when apps are on different hosts, protocols or development ports [D2,D3]. Keep file transfer working when storage is disabled.
A same-origin transfer ID is not authentication. Treat payload as untrusted; namespace is not a security boundary.

## Envelope

```json
{
  "schema": "ro-suite/handoff",
  "schemaVersion": 1,
  "transferId": "opaque-random-id",
  "kind": "equipment-plan.v1",
  "source": {"toolId": "dim-glacier", "appVersion": "record-real-version"},
  "targetToolId": "grade-refine",
  "createdAt": "ISO-8601 actual export time",
  "serverProfileId": "user-confirmed-profile",
  "payload": {}
}
```

This is a documentation skeleton; literal placeholders are not valid production payload values. Implement strict schemas for each supported kind, not one arbitrary object that accepts everything.

Supported kinds to develop independently: `material-plan.v1`, `equipment-plan.v1`, `pricebook.v1`. Declare import/export capabilities in the receiving/sending tool manifest only after tests pass.

## Equipment identity

Use canonical server-qualified item identifiers when verified; retain source-specific identifiers and name for display. Never guess an item ID from approximate spelling.
Keep grade and refine as separate fields. An unknown value is null and blocks a calculation needing that field; do not treat unknown as None/+0 silently.
Equipment identity, cards, enchant options, item level/category, planned vs owned state, provenance, and rule version must remain distinguishable.
Do not automatically assert that a material preparation plan means an equipment item has been crafted or reformed.

## Pricebook

Store exact currency unit and quantity unit, item identity, server, quote time, provenance, and whether purchase is enabled.
Missing is not zero. An intentionally free item must be explicit. Preserve the legacy app's meaning of empty/zero through a per-app adapter rather than rewriting its old format.
Currency examples: ZENY, THB, CASH_POINT; express millions of Zeny in UI only. Use decimal strings or safe exact arithmetic when implementing money representation.
Carry exchange rate with its direction and unit, e.g. THB per 1,000,000 Zeny, timestamp and source. Never infer exchange direction from a naked number.
Imported prices require a preview with keep-existing / replace-selected choice. Theme or opening a link cannot update prices.

## Cost lineage / avoid duplicate totals

Represent individual non-overlapping cost segments with stable IDs, stage, estimate/actual status, basis, currency, source plan ID and source version.
Do not sum mixed cost bases such as cash-required and market-value or sum different currencies without a declared conversion.
Examples of stages: acquisition, craft, reform, enchant, grade, refine.
Dim Glacier handoff must state whether incoming refine calculation replaces an earlier refine estimate or begins after a confirmed current refine state. Carry existing acquisition/enchant costs without duplicating them.
Return summary can be imported into Dim Glacier as an explicit external segment; do not maintain bidirectional live overwriting loops.
Reimport of transferId/segmentId must be idempotent: show already imported or allow explicit replacement of the same segment, never append duplicates automatically.

## Inventory

Shared payload is a snapshot, not a ledger mutation. Keep original inventory intact on export, cancellation, validation error or simulation.
If the user copies a snapshot into multiple independent scenarios, label them as separate hypothetical plans, not one finite warehouse available for spending multiple times.
A future shared warehouse requires transactional ownership, reservation/commit semantics and concurrency control (e.g. IndexedDB transactions or a later backend), with idempotency keys. Do not make a central localStorage blob that all apps edit.

## Validation and safety

Bound bytes, string lengths and collection counts; validate schema major, tool IDs, target, item identity and numeric ranges before showing/importing.
Reject executable markup, javascript: URLs, prototype-polluting keys and unknown mutation types. Render text safely.
Do not embed inventory, budgets or personal names in URLs by default. Share data only through deliberate user export.
Store unknown fields for round-trip only in a safe metadata container or reject them; never apply them as object mutations.
Do not auto-switch normal/event rules based on a global event flag. Spotlight, refine events and event guides use distinct rule identities and validity windows.

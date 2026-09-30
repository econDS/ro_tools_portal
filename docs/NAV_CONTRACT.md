# เมนูร่วม ro-suite-nav — สัญญารุ่น 1

## Public interface

Custom element: `ro-suite-nav`.
Attributes: `tool-id`, `portal-url`, optional `catalog-url`.
Configuration: bundled snapshot, strict production URL allowlist, navigation bundle version, locale support flags.
`tool-id` must map to a known catalog item; an unknown value shows a safe generic return link and no invented tool identity.

The HTML integration example is in examples/nav-integration.html.txt. It is an installation template, not a working built bundle.

## Required UX

Show portal home, current tool name, and a tools switcher. Keep source-code/help links secondary.
Use ordinary anchors with current-tab navigation by default; normal browser modifiers retain open-new-tab behavior.
Current tool has aria-current="page". Menu keyboard operation: Enter/Space, Escape close, predictable Tab order, focus return.
Do not capture Ctrl/Cmd+K or slash inside text inputs/editors. Search shortcut is optional, not part of initial compliance.
Do not force a theme on an app until the app implements it. A shared theme preference may affect navigation only.

## Resilience

Provide a visible light-DOM fallback nav before JavaScript executes. Component enhancement can replace/hide fallback only after successful initialization, not before.
Local code may not await a remote fetch before showing fallback or allowing app startup. A remote request failure must not throw into the calculator.
Use a local snapshot if fetch fails, times out, is malformed, has an unsupported schema major, or contains unsafe URLs.
No infinite retry loop. Cache safe public catalog by version only; do not cache or publish private user payloads.

## CSS and integration

Use Shadow DOM for interior styles [D4], with explicit font/color/box-sizing defaults inside the component. CSS variables and inherited properties still require deliberate defaults.
Prefix public custom properties --ro-suite-*. No host-page selectors like body, header, button, * outside the component.
The custom-element host is in normal document flow in v1. Do not add global body padding for a fixed bar.
If moving to sticky later, agree z-index/offsets with existing sticky controls and modals and test small screens.
For Ocean, insert outside its constrained `.page` content unless the intended layout is validated. Do not delete the existing themed header.

## What it must not do

No change to domain calculation, local prices, inventory, old import formats, URL payload, hash or event mode.
No token/PAT/credential in frontend. No executable URL in catalog. No reading arbitrary legacy app keys to populate summaries.
No Web Component or Shadow DOM claim as a security sandbox [D4].

## Delivery

Publish a versioned nav artifact, record source commit and SHA-256, vendor it into assets/ro-suite/<version>/ in each app.
Pin and upgrade by review; no `<script src=".../latest.js">` dependency.
Publish the public catalog JSON separately; adding a tool to that data does not require executable updates when the schema remains compatible.

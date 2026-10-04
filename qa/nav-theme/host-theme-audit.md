# Host theme audit

Read-only source audit. All six default-branch checkouts clean at audit time. Proposed semantic values use actual host palettes; no repository changes. Contrast uses WCAG sRGB luminance, minimum across surface + hover; text/muted/accent ≥4.5, focus ≥3. Fonts sourced from body/root UI declarations, not decorative headings. Runtime browser computed-style QA still needed.

## ro-leveling-map
- `main` at `aa6b4c9a9d4bbde0f527e3128c5fdce6a1648bb9`; clean: True
- Theme: Device preference via prefers-color-scheme:dark; no manual toggle
- Layout: index.html:89-92; max 1540px; 24px gutters, 12px at <=980px
- Bindings: `{"surface": "var(--panel)", "surface-hover": "var(--soft)", "text": "var(--text)", "muted": "var(--muted)", "border": "var(--line)", "accent": "var(--accent)", "focus": "var(--accent)", "font-family": "var(--font-body)"}`
### light
`{"surface": "#ffffff", "surface-hover": "#eef5f4", "text": "#1f252d", "muted": "#647082", "border": "#d8dee8", "accent": "#0b7a75", "focus": "#0b7a75", "font-family": "\"IBM Plex Sans Thai\",\"Segoe UI\",Tahoma,sans-serif"}`
Contrast minima: `{"text": 13.965, "muted": 4.544, "accent": 4.686, "focus": 4.686}`
- https://github.com/econDS/ro-leveling-map/blob/aa6b4c9a9d4bbde0f527e3128c5fdce6a1648bb9/index.html#L14-L17
- https://github.com/econDS/ro-leveling-map/blob/aa6b4c9a9d4bbde0f527e3128c5fdce6a1648bb9/assets/theme.css#L2-L4
- https://github.com/econDS/ro-leveling-map/blob/aa6b4c9a9d4bbde0f527e3128c5fdce6a1648bb9/assets/theme.css#L28
### dark
`{"surface": "#171e27", "surface-hover": "#17302d", "text": "#e3e9f0", "muted": "#9aa7b7", "border": "#2c3744", "accent": "#3cc0b6", "focus": "#3cc0b6", "font-family": "\"IBM Plex Sans Thai\",\"Segoe UI\",Tahoma,sans-serif"}`
Contrast minima: `{"text": 11.475, "muted": 5.735, "accent": 6.284, "focus": 6.284}`
- https://github.com/econDS/ro-leveling-map/blob/aa6b4c9a9d4bbde0f527e3128c5fdce6a1648bb9/index.html#L66-L85
- https://github.com/econDS/ro-leveling-map/blob/aa6b4c9a9d4bbde0f527e3128c5fdce6a1648bb9/assets/theme.css#L2-L4
## ro-reform-preparation
- `main` at `4db99b1037c01ab35beea01b2541ad28d264bc06`; clean: True
- Theme: Device preference via prefers-color-scheme:dark; no manual toggle
- Layout: index.html:12-16; max 1320px; 28px gutters,18px <=900px,16px <=640px
- Bindings: `{"surface": "var(--paper)", "surface-hover": "var(--paper-2)", "text": "var(--ink)", "muted": "var(--muted)", "border": "var(--line)", "accent": "var(--soft-ink)", "focus": "var(--field-focus)", "font-family": "var(--font)"}`
### light
`{"surface": "#ffffff", "surface-hover": "#faf9f5", "text": "#18211e", "muted": "#646f69", "border": "#e7e3d9", "accent": "#2f5a26", "focus": "#2f7d62", "font-family": "'IBM Plex Sans Thai',system-ui,Tahoma,sans-serif"}`
Contrast minima: `{"text": 15.633, "muted": 4.959, "accent": 7.634, "focus": 4.712}`
- https://github.com/econDS/ro-reform-preparation/blob/4db99b1037c01ab35beea01b2541ad28d264bc06/styles.css#L7-L23
- https://github.com/econDS/ro-reform-preparation/blob/4db99b1037c01ab35beea01b2541ad28d264bc06/styles.css#L43-L48
### dark
`{"surface": "#131a17", "surface-hover": "#18201d", "text": "#e8efea", "muted": "#98a59e", "border": "#232d29", "accent": "#c8e79b", "focus": "#8fd46a", "font-family": "'IBM Plex Sans Thai',system-ui,Tahoma,sans-serif"}`
Contrast minima: `{"text": 14.223, "muted": 6.5, "accent": 12.159, "focus": 9.336}`
- https://github.com/econDS/ro-reform-preparation/blob/4db99b1037c01ab35beea01b2541ad28d264bc06/styles.css#L25-L38
## dim_glacier_planner
- `main` at `986b7d5cac0e163ccfc41b39e6f91ef02925489a`; clean: True
- Theme: Fixed light; theme="light" on nav; no host dark palette
- Layout: assets/ro-suite/nav140-host.css:1-24; max 1400px; zero nav gutters inside existing body 20px padding
- Bindings: `{"surface": "var(--card-bg)", "surface-hover": "#eaf2f8", "text": "var(--primary)", "muted": "#555", "border": "var(--border)", "accent": "var(--primary)", "focus": "var(--accent)", "font-family": "'Sarabun', 'Segoe UI', Tahoma, sans-serif"}`
- Caution: Host blue accent #2980b9 yields only 3.80:1 on hover and 4.30:1 on white, so use actual primary slate for accent text and retain blue for focus. No invented new color.
### light
`{"surface": "#ffffff", "surface-hover": "#eaf2f8", "text": "#2c3e50", "muted": "#555555", "border": "#e0e0e0", "accent": "#2c3e50", "focus": "#2980b9", "font-family": "'Sarabun', 'Segoe UI', Tahoma, sans-serif"}`
Contrast minima: `{"text": 9.704, "muted": 6.587, "accent": 9.704, "focus": 3.8}`
- https://github.com/econDS/dim_glacier_planner/blob/986b7d5cac0e163ccfc41b39e6f91ef02925489a/index.html#L10-L26
- https://github.com/econDS/dim_glacier_planner/blob/986b7d5cac0e163ccfc41b39e6f91ef02925489a/index.html#L67-L70
- https://github.com/econDS/dim_glacier_planner/blob/986b7d5cac0e163ccfc41b39e6f91ef02925489a/index.html#L96-L97
- https://github.com/econDS/dim_glacier_planner/blob/986b7d5cac0e163ccfc41b39e6f91ef02925489a/index.html#L478
- https://github.com/econDS/dim_glacier_planner/blob/986b7d5cac0e163ccfc41b39e6f91ef02925489a/index.html#L702
## ro-best-status
- `main` at `81b8e316bfc4a81c3457c265da96586d9949a8e0`; clean: True
- Theme: Fixed dark; color-scheme:dark and nav theme="dark"
- Layout: assets/ro-suite/nav140-host.css:1-38;1392px max,1488px >=1500px;48px gutters,30 <=1199,22 <=720,16 <=380
- Bindings: `{"surface": "var(--panel)", "surface-hover": "var(--panel2)", "text": "var(--text)", "muted": "var(--muted)", "border": "var(--line)", "accent": "var(--mint)", "focus": "var(--mint)", "font-family": "\"Noto Sans Thai\",\"Leelawadee UI\",Tahoma,system-ui,-apple-system,sans-serif"}`
- Caution: Old integration.css fallback retains Portal green colors and focus despite nav140 alignment override; replace nav fallback colors with host semantic tokens too.
### dark
`{"surface": "#14212d", "surface-hover": "#172633", "text": "#edf2ef", "muted": "#8d9fa8", "border": "#293945", "accent": "#88dfbf", "focus": "#88dfbf", "font-family": "\"Noto Sans Thai\",\"Leelawadee UI\",Tahoma,system-ui,-apple-system,sans-serif"}`
Contrast minima: `{"text": 13.624, "muted": 5.624, "accent": 9.809, "focus": 9.809}`
- https://github.com/econDS/ro-best-status/blob/81b8e316bfc4a81c3457c265da96586d9949a8e0/styles.css#L1-L15
- https://github.com/econDS/ro-best-status/blob/81b8e316bfc4a81c3457c265da96586d9949a8e0/styles.css#L24-L32
- https://github.com/econDS/ro-best-status/blob/81b8e316bfc4a81c3457c265da96586d9949a8e0/styles.css#L54-L56
## sessrumnir-ocean-week-guide
- `master` at `7d0862765923d6b7df9ec60a16132fc375af9ba0`; clean: True
- Theme: Fixed light; nav theme="light"; publishing master/docs preserved
- Layout: docs/index.html:1413-1439;980px max; zero nav gutter inside existing body28px/16px mobile
- Bindings: `{"surface": "var(--card)", "surface-hover": "var(--ocean-soft)", "text": "var(--ink)", "muted": "var(--muted)", "border": "var(--line)", "accent": "var(--accent-dark)", "focus": "var(--accent-dark)", "font-family": "\"Sarabun\",system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif"}`
- Caution: Use accent-dark, not bright cyan accent, for readable link text/focus. Existing fallback is hard-coded Portal green at docs/index.html:1426-1437 and needs host mapping.
### light
`{"surface": "#ffffff", "surface-hover": "#dff4fb", "text": "#102b43", "muted": "#557086", "border": "rgba(28,117,159,.18)", "accent": "#0b5d83", "focus": "#0b5d83", "font-family": "\"Sarabun\",system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif"}`
Contrast minima: `{"text": 12.751, "muted": 4.563, "accent": 6.352, "focus": 6.352}`
- https://github.com/econDS/sessrumnir-ocean-week-guide/blob/7d0862765923d6b7df9ec60a16132fc375af9ba0/docs/index.html#L13-L27
- https://github.com/econDS/sessrumnir-ocean-week-guide/blob/7d0862765923d6b7df9ec60a16132fc375af9ba0/docs/index.html#L32-L42
- https://github.com/econDS/sessrumnir-ocean-week-guide/blob/7d0862765923d6b7df9ec60a16132fc375af9ba0/docs/index.html#L1410
## ro_tools_portal
- `main` at `4caf4c4cc305d2771bcb72184234bdb0a474a2b4`; clean: True
- Theme: Manual light/dark data-theme toggle; default dark from stored preference fallback; src/portal.ts:93-100
- Layout: No ro-suite-nav host in Portal current page; own site-header/app-shell max1200px with40/24/16px responsive gutters (src/styles.css:31-44,171-180)
- Bindings: `{"surface": "var(--surface)", "surface-hover": "var(--soft)", "text": "var(--ink)", "muted": "var(--muted)", "border": "var(--line)", "accent": "var(--green)", "focus": "var(--green)", "font-family": "\"Leelawadee UI\",Tahoma,system-ui,sans-serif"}`
### light
`{"surface": "#ffffff", "surface-hover": "#e8f0e2", "text": "#1f2823", "muted": "#58625a", "border": "#dbe2d5", "accent": "#2d5a41", "focus": "#2d5a41", "font-family": "\"Leelawadee UI\",Tahoma,system-ui,sans-serif"}`
Contrast minima: `{"text": 12.982, "muted": 5.437, "accent": 6.789, "focus": 6.789}`
- https://github.com/econDS/ro_tools_portal/blob/4caf4c4cc305d2771bcb72184234bdb0a474a2b4/src/styles.css#L2-L8
- https://github.com/econDS/ro_tools_portal/blob/4caf4c4cc305d2771bcb72184234bdb0a474a2b4/src/styles.css#L23
- https://github.com/econDS/ro_tools_portal/blob/4caf4c4cc305d2771bcb72184234bdb0a474a2b4/src/styles.css#L43
### dark
`{"surface": "#1b2620", "surface-hover": "#23342a", "text": "#ecf2e8", "muted": "#b3c1b6", "border": "#2f3f35", "accent": "#b6d7a8", "focus": "#b6d7a8", "font-family": "\"Leelawadee UI\",Tahoma,system-ui,sans-serif"}`
Contrast minima: `{"text": 11.549, "muted": 7.03, "accent": 8.317, "focus": 8.317}`
- https://github.com/econDS/ro_tools_portal/blob/4caf4c4cc305d2771bcb72184234bdb0a474a2b4/src/styles.css#L9-L13
- https://github.com/econDS/ro_tools_portal/blob/4caf4c4cc305d2771bcb72184234bdb0a474a2b4/src/styles.css#L23

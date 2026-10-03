# RO Suite Nav — Alignment & Visual Weight Reduction

## Summary

ปรับ shared navigation และเตรียม rollout **1.4.1** ใน Draft PR ทั้งห้าเว็บลูกแล้ว แถบปิดลดจาก **98px → 53px บนมือถือ** และ **68px → 53px บน tablet/desktop** ขอบเนื้อหา navbar ตรงกับ shell ที่กำหนด **0px ทั้งซ้าย/ขวา** ครบ 42 viewport/theme samples

ยังไม่ merge หรือ deploy เว็บจริง ภาพและผลด้านล่างเป็น candidate ที่ pin commit แน่นอน ไม่ใช่ภาพ live Pages หลัง merge

## Shared nav changes

- ลดกรอบโค้งและแถบสีล่างหนา เหลือ utility surface กับเส้นบาง 1px; icon เล็กลง โดยคง accent/icon เดิม
- Full-width outer surface + inner border-box shell รองรับ `--ro-suite-content-max-width` และ `--ro-suite-inline-padding` ไม่มี CSS เฉพาะ repo ใน shared component
- แถบปิดอยู่แถวเดียว; ชื่อยาวใช้ visual ellipsis แต่ข้อความและ accessible name เต็ม ปุ่ม native ยังคง Enter/Space/Escape/Tab เดิม
- Portal label แสดง “RO Tools” และ accessible name “กลับ RO Tools Portal”; URL เดิม
- Light/dark tokens เดิม, inline-flow menu เดิม ไม่มี animation/dependency/storage ใหม่
- **ใช้ 1.4.1 แทน candidate 1.4.0**: review พบว่า `display:none` ของ empty live region อาจทำให้ screen reader ไม่ประกาศข้อความ optional-catalog ที่มาทีหลัง จึงใช้ `margin:0` เพื่อคง region ไว้ก่อนข้อความมา ไม่ได้อ้างว่าทดสอบเสียงจาก screen reader แล้ว
- เก็บ artifact 1.4.0 ทุก byte พร้อมรุ่น 1.0–1.3; ไม่แก้ release ย้อนหลัง

Source commit: `ac62659a26539d802111d255edb92b09ec68382b`  
Artifact commit: `7771389b1a055d80a97bc14b14a27a1281a77d1c`  
Candidate evidence Portal head: `f2b14755104a348b24ffe7b038a23cd408c2acbd`

| 1.4.1 file | SHA-256 |
| --- | --- |
| nav.js | a51d69610e73c2c25d5167c1001d2cded4770e7af67f1fc92695fabafd07b590 |
| catalog.snapshot.json | a198338ddcb7857094ef950fb1315c532840cf53ac8e7a69b331d8cb4a87dd5d |
| nav.lock.json | 28543178d99fb8269d3a41ead7105e7c0a9db3fa7654c4910ca05bc94099bde7 |

Build ซ้ำได้ byte เดิม และ source commit อยู่ใน ancestry; source lock ตรวจ hashes ทั้งหมดจาก commit จริง Catalog snapshot เท่ากับ 1.3.0

## Measurements

วัดด้วย Chromium 153.0.8010.12 ผ่าน DOM geometry จริง, viewport สูง 1000px, fresh contexts, พาธ publishing จริง รวม Ocean ที่ serve จาก docs/ โดย URL ไม่มี /docs/ ไม่ใช่ตัวเลขคาดจาก CSS

Alignment = `.bar` ซ้าย/ขวาเทียบกับ main content ของ Leveling, `.header-inner` ของ Reform, `.container` ของ Dim, `.shell` content ของ Best Status และ `.page` ของ Ocean

| Repository / theme | Viewport px | Height Before px | Height After px | Alignment L / R Before → After px |
| --- | ---: | ---: | ---: | --- |
| Leveling (light) | 320 | 98 | 53 | -3 / 3 → 0 / 0 |
| Leveling (light) | 360 | 98 | 53 | -3 / 3 → 0 / 0 |
| Leveling (light) | 390 | 98 | 53 | -3 / 3 → 0 / 0 |
| Leveling (light) | 430 | 98 | 53 | -3 / 3 → 0 / 0 |
| Leveling (light) | 768 | 68 | 53 | 3 / -3 → 0 / 0 |
| Leveling (light) | 1440 | 68 | 53 | -9 / 9 → 0 / 0 |
| Leveling (dark) | 320 | 98 | 53 | -3 / 3 → 0 / 0 |
| Leveling (dark) | 360 | 98 | 53 | -3 / 3 → 0 / 0 |
| Leveling (dark) | 390 | 98 | 53 | -3 / 3 → 0 / 0 |
| Leveling (dark) | 430 | 98 | 53 | -3 / 3 → 0 / 0 |
| Leveling (dark) | 768 | 68 | 53 | 3 / -3 → 0 / 0 |
| Leveling (dark) | 1440 | 68 | 53 | -9 / 9 → 0 / 0 |
| Reform (light) | 320 | 98 | 53 | -7 / 7 → 0 / 0 |
| Reform (light) | 360 | 98 | 53 | -7 / 7 → 0 / 0 |
| Reform (light) | 390 | 98 | 53 | -7 / 7 → 0 / 0 |
| Reform (light) | 430 | 98 | 53 | -7 / 7 → 0 / 0 |
| Reform (light) | 768 | 68 | 53 | -3 / 3 → 0 / 0 |
| Reform (light) | 1440 | 68 | 53 | -73 / 73 → 0 / 0 |
| Reform (dark) | 320 | 98 | 53 | -7 / 7 → 0 / 0 |
| Reform (dark) | 360 | 98 | 53 | -7 / 7 → 0 / 0 |
| Reform (dark) | 390 | 98 | 53 | -7 / 7 → 0 / 0 |
| Reform (dark) | 430 | 98 | 53 | -7 / 7 → 0 / 0 |
| Reform (dark) | 768 | 68 | 53 | -3 / 3 → 0 / 0 |
| Reform (dark) | 1440 | 68 | 53 | -73 / 73 → 0 / 0 |
| Dim Glacier (light) | 320 | 98 | 53 | 9 / -9 → 0 / 0 |
| Dim Glacier (light) | 360 | 98 | 53 | 9 / -9 → 0 / 0 |
| Dim Glacier (light) | 390 | 98 | 53 | 9 / -9 → 0 / 0 |
| Dim Glacier (light) | 430 | 98 | 53 | 9 / -9 → 0 / 0 |
| Dim Glacier (light) | 768 | 68 | 53 | 15 / -15 → 0 / 0 |
| Dim Glacier (light) | 1440 | 68 | 53 | 15 / -15 → 0 / 0 |
| Best Status (dark) | 320 | 98 | 53 | 9 / -9 → 0 / 0 |
| Best Status (dark) | 360 | 98 | 53 | 9 / -9 → 0 / 0 |
| Best Status (dark) | 390 | 98 | 53 | 9 / -9 → 0 / 0 |
| Best Status (dark) | 430 | 98 | 53 | 9 / -9 → 0 / 0 |
| Best Status (dark) | 768 | 68 | 53 | 15 / -15 → 0 / 0 |
| Best Status (dark) | 1440 | 68 | 53 | 15 / -15 → 0 / 0 |
| Ocean Week (light) | 320 | 98 | 53 | 9 / -9 → 0 / 0 |
| Ocean Week (light) | 360 | 98 | 53 | 9 / -9 → 0 / 0 |
| Ocean Week (light) | 390 | 98 | 53 | 9 / -9 → 0 / 0 |
| Ocean Week (light) | 430 | 98 | 53 | 9 / -9 → 0 / 0 |
| Ocean Week (light) | 768 | 68 | 53 | 15 / -15 → 0 / 0 |
| Ocean Week (light) | 1440 | 68 | 53 | -187 / 187 → 0 / 0 |

ช่องว่าง nav → header ไม่เพิ่ม: Leveling/Reform/Best/Ocean 0px; Dim 18.75px เท่าเดิมจาก heading margin ของแอป Best Status ยังลด padding-top เฉพาะ nav เดิม 12px ทำให้ host จาก 110/80px เหลือ 53px

Opened menu ยังคงดันเนื้อหาใน flow ตามเดิม: desktop ทั่วไป 143→110px; Ocean desktop 143→158px เพราะชื่อเต็มและ 44px targets ต้องขึ้นสองแถวใน shell 980px ที่จัดแนวถูกต้อง ไม่มี overlay หรือการตัดชื่อในเมนูเปิด มือถือ 390px แถบเปิดสูง 330px

## Repository rollout

| Repository | Before | After candidate | Tests ที่รันจริง | PR / head |
| --- | --- | --- | --- | --- |
| ro_tools_portal | source 1.3.0 | source + immutable 1.4.1 | build/typecheck/rebuild, 5 nav unit, 11 PWA unit, 78 Chromium, generated-output check; Python 19 pass / 2 optional skips | [#6](https://github.com/econDS/ro_tools_portal/pull/6) · evidence head f2b14755 |
| ro-leveling-map | 1.3.0 | 1.4.1 | 44 Node + 4 Python + 43 browser + 8 historic first-run + 8 current-main comparisons | [#4](https://github.com/econDS/ro-leveling-map/pull/4) · 3fb15909885adf02d9cd1b632c3dba0a58bfa623 |
| ro-reform-preparation | 1.3.0 | 1.4.1 | 81 Node + 66 browser + 8 historic first-run + 8 current-main comparisons | [#4](https://github.com/econDS/ro-reform-preparation/pull/4) · a7900d509ee1f3d624d57ecf2e19e719ba2d476a |
| dim_glacier_planner | 1.3.0 | 1.4.1 | 25 Node + 668 browser checks / 18 scenarios + first-run 4 widths / 3 cases | [#5](https://github.com/econDS/dim_glacier_planner/pull/5) · 7aacf1e620581ec4d588cc50204932f52b4cf24d |
| ro-best-status | 1.3.0 | 1.4.1 | 27 Node + 364 browser checks / 36 scenarios + first-run 4 widths / 3 cases | [#4](https://github.com/econDS/ro-best-status/pull/4) · 84af5003981c04b9c4bee2f0c18609c3360df214 |
| sessrumnir-ocean-week-guide | 1.3.0 | 1.4.1 | 16 Node + 6,238 guide/nav checks + 40 alignment/fallback scenarios | [#5](https://github.com/econDS/sessrumnir-ocean-week-guide/pull/5) · 5978d3071ea4ff825f9ea3df3fee6d0e17acd91d |

Baseline commits: Portal `8a368357`, Leveling `87b50f72`, Reform `b49eeb42`, Dim `92e2ee6e`, Best `3b7dd2ce`, Ocean `159a9d12` (master/docs). Clean checkouts verified before edits

### Exact-head CI

- [Portal source](https://github.com/econDS/ro_tools_portal/actions/runs/37079690182)
- [Cross-suite 1.4.1](https://github.com/econDS/ro_tools_portal/actions/runs/37079690223)
- [Leveling](https://github.com/econDS/ro-leveling-map/actions/runs/37079278834)
- [Reform](https://github.com/econDS/ro-reform-preparation/actions/runs/37079302872)
- [Dim](https://github.com/econDS/dim_glacier_planner/actions/runs/37079290869)
- [Best Status](https://github.com/econDS/ro-best-status/actions/runs/37079310262)
- [Ocean](https://github.com/econDS/sessrumnir-ocean-week-guide/actions/runs/37079515464)

Commands: Portal `npm run check`, `npm run publish:root` + clean generated-output diff, `python -m unittest tests/test_design_kit.py`; consumer Node/Python suites and original browser/first-run scripts run by each linked workflow. Shared `capture-nav-layout.mjs`, `compare-nav-layout.mjs` and `candidate-behavior.mjs` run against exact pinned children

## Screenshots

- [Durable before/after comparisons](SCREENSHOTS.md): 28 original-pixel, lossless WebP images, 390px and 1440px closed across all actual themes
- [Untouched baseline artifact](https://github.com/econDS/ro_tools_portal/actions/runs/37075741836/artifacts/11255584700): 35 original PNGs
- [Final 1.4.1 full artifact](https://github.com/econDS/ro_tools_portal/actions/runs/37079690223/artifacts/11258480194): before replay, 35 after screenshots (1440 closed/open, 768 closed, 390 closed/open), 7 mobile blocked-module fallbacks, 7 separate catalog-failure fixtures, JSON/TSV measurements and comparisons

Fallback images were captured after returning to exact top and waiting for scrolling/layout to settle. Images identify source commits in the report/manifest. Artifact retention is finite; committed key comparisons remain available. The final documentation/image commit contains no production changes relative to the recorded candidate evidence

## Accessibility

- All shared-nav interactive targets meet 44×44px, including fallback; names remain complete despite closed-state mobile ellipsis
- Actual nav closed/open: 14 Axe WCAG2A/AA + WCAG2.1AA scans, no violations or incomplete findings
- Fallback: five automatic Axe passes; Leveling light/dark contrast is manually reviewed because its body radial gradient produces an Axe incomplete. Conservative gradient bounds give ≥12.50:1 light and ≥13.40:1 dark against the required 4.5:1. These are manual checks, not automatic Axe passes
- Empty `role=status` stays available before asynchronous failure text; real screen-reader speech remains untested
- No decorative motion was introduced; reduced-motion contexts tested

## Fallback / keyboard checks

900 cross-suite behavior checks passed: 14 normal scenarios, 21 blocked-module scenarios (320/390/430 across supported themes), seven optional-catalog failure fixtures and 30 native anchor activations

Tab order, Shift+Tab, Enter/Space, repeated open/close, Escape/focus return, aria-expanded and aria-current are preserved. Grade & Refine remains non-launchable. Automatic themes change on the same page; fixed themes stay fixed under the opposite OS preference. URL/query/hash, storage values and form state remain unchanged

Optional catalog failures are explicitly separate component fixtures, because actual consumer integrations do not enable catalog-url. Native destination activation uses harmless landing fixtures at the exact canonical URLs: this proves activation/URL preservation, not a new live HTTP-health assessment

## Regression checks

All five copies of each 1.4.1 file match Portal; retained 1.4.0 also matches. All 1,361 recorded pre-rollout file hashes were checked against real Git objects, and precise HTML reversals reconstruct the original files. URLs, tool IDs, theme values, storage schema, formulas/data, first-run UX and existing app assets are unchanged

| Calculator case | Before | After | Result |
| --- | --- | --- | --- |
| Leveling Lv100 / no event | jor_dun02; EXP 136,001.2; score 13.9M | identical | PASS |
| Leveling Lv200 / party12 | jor_dun01; EXP 117,182.7; score 10.8M | identical | PASS |
| Leveling Lv210 / solo | jor_twig; EXP 539,172.4; score 20.9M | identical | PASS |
| Reform Supreme100 | 114,473,000z; buy2700 Low; Low2700→Medium900→High300→Supreme100 | identical | PASS |
| Reform Medium10 | 1,149,700z; buy30 Low; Low30→Medium10 | identical | PASS |
| Reform High5 +6 Shadowdecon/4 Zelunium | 1,948,530z; buy45 Low+optional materials; Low45→Medium15→High5 | identical | PASS |
| Dim default craft | 1,167,842,750z / 8,642THB | identical | PASS |
| Dim owned Slot2 Lv3→Lv5 | 528,036,250z / 3,907THB | identical | PASS |
| Dim mixed refine fixture | refine197,447,567z; total1,365,290,317z /10,103THB | identical | PASS |
| Best Rune default fixture | DEX69/LUK115; raw70.60%;1273 used/0left | identical | PASS |
| Best Poison default fixture | DEX106/LUK90; raw84.80%;1269/4 | identical | PASS |
| Best Potion default fixture | INT42/DEX91/LUK95; raw86.95–96.95%;1270/3 | identical | PASS |

Full result objects, not just formatting, compare exactly. Dim includes192 calculation snapshot comparisons and Best462 plus three first-run cases each. These are model outputs, not new server/formula verification

Leveling share/storage/table behavior; Reform inventory/price/routes; Dim price-date metadata/native labels/JSON/CSV/XLSX/XLS/shopping/refine; Best activity/comparison/migration/raw-rate cautions; Ocean /navi/copy/lightbox/archive/dates/official links remain functional. HTTP failures intentionally injected for module/catalog tests are separated from normal failures. Original Leveling manifest ERR_ABORTED records are preserved in the baseline comparison

## Out-of-scope visual findings

- Leveling's original header/main gutters differ at some sizes. Nav aligns main; header was not redesigned
- Reform's main differs from header-inner at intermediate widths. Nav follows the requested header-inner
- Ocean's aligned980px open menu needs two rows at1440px; kept full names,44px targets and inline flow instead of introducing an overlay
- Ocean เดิมมีปุ่มคัดลอกบางตัวต่ำกว่า44px เช่น inline “ra_temple” วัดได้82×23.72px ทั้งก่อน/หลัง เป็น follow-up ของตัวคู่มือ ไม่ใช่ navbar และไม่ได้แก้ในงานนี้
- Actual devices, Firefox/WebKit, audible screen-reader tests and Pages after merge were not tested. Local Chromium could not launch; browser assertions ran in CI

## Rollback

Keep the released artifacts immutable. For each child, revert only this PR's integration change back to the retained local1.3.0 module and original fallback/host styles. In Best Status also restore the nav's original shell class and remove the new nav-only stylesheet link. Ocean keeps docs/ on master and its public path without /docs/. No calculator state or storage migration is involved

Do not overwrite1.4.0 or1.4.1 when rolling back. After approval, normal-merge Portal first so source commit ac62659 remains in history, then merge consumers. Avoid squash/rebase that removes the pinned source ancestor

## Recommendation

All six Draft PRs pass the production/candidate review gates. The final evidence-only Portal head must also pass before handoff; its exact head/check links are recorded in the PR body. Consumers are pinned to1.4.1; source provenance, geometry, accessibility, fallback and app regressions pass. No merge/deployment or Pages-setting change was performed

# RO Tools Portal — Task-First Navigation

## Summary

ปรับ Portal ให้เริ่มจากงานที่ผู้ใช้ต้องการทำก่อนดูรายชื่อผลิตภัณฑ์ คงข้อมูลและความสามารถเดิม โดยไม่มีการแก้เว็บลูกหรือ shared-nav release

Base: `f17c9fd03c33b4519a9594999123ac8ca7ef9add` (main ล่าสุด ณ เริ่มงาน 2 ต.ค. 2026) เป็น checkout ใหม่สะอาด ไม่มีงานค้างของผู้อื่น Publishing root/path ยังคง root และ `/ro_tools_portal/`

## UX structure before / after

| Section | Before | After |
| --- | --- | --- |
| Hero | แนะนำ Portal พร้อมรายชื่อครบ 6 เครื่องมือซ้ำ | บอกประโยชน์ พร้อม CTA เริ่มตามงานและค้นหา/ดูทั้งหมด |
| Primary entry surfaces | 3 ส่วนทั่วไปทำหน้าที่ซ้ำ: Hero destinations, catalog, journeys ท้ายหน้า | งานเป็นทางหลัก 1 ส่วน; catalog เป็นรายละเอียด, search เป็นทางตรง |
| Quick Access | สอง panel เสมอแม้ไม่มีข้อมูล | เหลือ hint บรรทัดเดียวเมื่อว่าง; แสดงเฉพาะ panel ที่มีข้อมูลไว้ก่อน tasks |
| Tasks | 4 journeys ไม่มีคราฟต์ และมี planned handoff | 4 active tasks จาก journeys data; คำอธิบาย Ocean อยู่กับ archive |
| Search | ก่อน catalog หลัง Hero และ Quick Access | หลัง tasks; มี Hero anchor ข้ามมาตรงนี้ได้ |
| Catalog | listed 5 และ planned 1 อยู่ร่วมกัน | เครื่องคำนวณ 4 / คู่มือย้อนหลัง 1 / กำลังพัฒนา 1 |
| Evidence | รองรายละเอียด แหล่งข้อมูลชื่อ S1/S2 | คงรายละเอียด; ใช้ source title ที่มีอยู่แทนรหัส |
| About | ขอบเขตข้อมูลและ PWA | คงข้อความและความสามารถ |

Baseline Chromium วัด Hero ที่ mobile 390px สูง 920.84px และ empty Quick Access 174.38px ส่วนรุ่นใหม่ซ่อน container ว่างจริงและ Hero ผ่าน assertion ว่าสูงไม่ถึง viewport 900px ทุกความกว้างที่ทดสอบ ไม่มีการอ้าง conversion/usability uplift

## Primary user paths

- First-time user: Hero → งาน 4 แบบ → เปิดเครื่องมือ; อ่านรายละเอียดเพิ่มใน catalog ได้
- Returning user: ทางลัดใช้บ่อย/เปิดล่าสุดอยู่หลัง Hero ก่อน tasks, เก็บและ reset ตามเดิม
- Search-driven user: CTA “ค้นหา / ดูเครื่องมือทั้งหมด” ข้ามไป search โดยตรง หรือเลื่อนผ่าน tasks; Thai/English aliases, query/category และ no-results ยังคงทำงาน

## Tool grouping

| Tool | Group | Primary task |
| --- | --- | --- |
| แผนที่เก็บเลเวล | เครื่องมือพร้อมใช้ | หาแมพเก็บเลเวล |
| Reform Workshop | เครื่องมือพร้อมใช้ | เตรียมของสำหรับ Reform |
| Dim Glacier Planner | เครื่องมือพร้อมใช้ | วางแผน Dim Glacier |
| Best Status — STAT FORGE | เครื่องมือพร้อมใช้ | หา Status สำหรับสายคราฟต์ |
| Sessrumnir Ocean Week | คู่มือย้อนหลัง | ดูคู่มือรอบที่ผ่านมา ใน archive section |
| Grade & Refine Workshop | กำลังพัฒนา | ไม่มี primary task/launch link |

## Files changed

- `data/journeys.v1.json`: one-task/tool copy และคราฟต์ ใช้ข้อมูลแหล่งเดียว
- `scripts/render.ts`: Hero, tasks, grouping, source titles
- `src/portal.ts`: ซ่อน Quick Access/group ที่ว่าง; ไม่เปลี่ยน storage/launch logic
- `src/styles.css`: spacing และ hierarchy ภายใน identity/palette เดิม
- `tests/browser/portal.spec.ts`, `accessibility.spec.ts`, `task-first.spec.ts`: regression และสองธีมจริง
- `tests/unit/pwa.test.mjs`: ปรับเพียง expected Hero copy 2 จุด
- `.github/workflows/portal-checks.yml`: baseline job เฉพาะ PR branch นี้ อ่านอย่างเดียว
- `qa/task-first/REPORT.md`, `capture-baseline.mjs`, `screenshots/`: รายงานและหลักฐาน
- Generated `index.html`, hashed `assets/index-*.js/css`, `sw.js`: build output และ content digest ปกติ; ลบเฉพาะ hashed output เก่าที่ build script จัดการ

## Tests

คำสั่งที่รันจริง:

- `npm ci`
- `npm run publish:root`: PASS (รวม typecheck/build)
- `npm run build:nav && npm run test:nav`: 3 PASS, release bytes ไม่เปลี่ยน
- `npm run test:pwa`: 11 PASS
- `python -m unittest tests/test_design_kit.py`: 19 PASS / 2 optional checks skipped
- CI `npm run check`: candidate 71 Playwright PASS, baseline เดิม 56 Playwright PASS; ทั้งคู่ 3 nav + 11 PWA PASS
- CI `npm run publish:root` + `git diff --exit-code` และ untracked-file check: PASS
- `git diff --check`: PASS

[หลักฐาน CI ของ production candidate 735f3a99](https://github.com/econDS/ro_tools_portal/actions/runs/37028315982) — baseline แยก checkout ของ commit เดิม และ candidate แต่ละชุดทดสอบจริง ไม่สร้างภาพก่อนแก้จากโค้ดใหม่

การรัน browser ใน cloud เครื่องนี้ถูกจำกัด: executable เดิมไม่มี และ download ที่ได้ไม่ใช่ ZIP สมบูรณ์ จึงใช้ Chromium CI ที่ล็อกรุ่นจริง ไม่มีการอ้าง local browser pass

## Mobile / accessibility checks

360, 390, 768, 1440px × stored light/dark: PASS, initial และ returning users ไม่มี horizontal overflow; Hero ต่ำกว่า viewport; CTA task สูงอย่างน้อย 44px; skip link/Tab/Enter/focus-visible; ไม่มี duplicate IDs; filter aria-pressed และ pin Space; ไม่มี page error ใหม่

axe WCAG 2 A/AA และ 2.1 AA: PASS ทั้ง light/dark จริง ทั้งแบบ details ปิด/เปิด (แก้ test เดิมซึ่งเพียง emulate system theme แต่แอปยัง default dark)

การค้นหา เก็บเวล, Reform, Rune, STAT FORGE, Dim Glacier, Ocean Week แสดงเครื่องมือถูกต้อง; URL query อื่น/hash คงเดิม; กลุ่มที่ไม่มีผลลัพธ์ถูกซ่อน

## Preserved behavior

- Search/category/query/no-results: full suite PASS
- Favorites/recent/reset/launch tracking/Back/reload/blocked-quota-corrupt storage: PASS
- Theme และ persistence: PASS
- PWA manifest, Portal-only scope, offline search/pins/theme, update lifecycle และ sibling-cache isolation: PASS
- URLs, IDs, registry, public catalog, navigation releases 1.0.0–1.3.0, preference store, PWA runtime/template: byte-identical เทียบ base
- Ocean คง archived round และ gameDataVerifiedOn=null; Grade & Refine ไม่ launch ได้

## Out-of-scope findings

- local browser install ไม่พร้อม จึงใช้ CI; ไม่ใช่ defect หน้า Portal
- ไม่ทดสอบอุปกรณ์จริง, Firefox/WebKit/Safari, manual install หรือ Pages หลัง merge
- หลักฐาน link launch ใน browser ใช้ destination fixture ตาม test เดิม ไม่อ้างว่าได้ตรวจเนื้อหาหรือระบบเครื่องคิดเลขเว็บลูกใหม่
- ก่อนหน้านี้ accessibility test ไม่ได้สลับ app theme จริง; ปรับ coverage ให้ถูกต้องในงานนี้

## Screenshots / evidence

ภาพ before จาก base `f17c9fd`; after จาก `735f3a99225258ffa9be7c4f6380acf7745ca19a`. ภาพที่เก็บใน repo เป็น crop ส่วนบนจากภาพจริง ไม่มีการจัด layout ใหม่เพื่อถ่ายภาพ; commits รายงานภายหลังไม่เปลี่ยน production UI

- [ก่อน mobile dark](screenshots/before-mobile-dark.webp) / [หลัง mobile dark](screenshots/after-mobile-dark.webp)
- [ก่อน desktop dark](screenshots/before-desktop-dark.webp) / [หลัง desktop dark](screenshots/after-desktop-dark.webp)
- [CI artifacts](https://github.com/econDS/ro_tools_portal/actions/runs/37028315982): full-page before/after ทุก 4 widths, light/dark, initial/returning รวม baseline geometry JSON; artifacts อายุ 14 วัน

## PR / Commit

[Draft PR #5](https://github.com/econDS/ro_tools_portal/pull/5), branch `feat/task-first-portal`, target `main`. ดู checks บน PR สำหรับ head ล่าสุด ไม่มี merge หรือ deploy

## Recommendation

พร้อม review หลัง final-head CI เป็นสีเขียว ควร merge ผ่าน PR เพื่อให้ generated source/assets เข้าพร้อมกัน

Rollback: revert feature commits ทั้ง source/generated output ร่วมกัน ไม่มี storage migration และไม่ต้อง rollback registry/shared navigation

# RO Tools Portal

รวมลิงก์เครื่องมือและคู่มือ Ragnarok Online ของ econDS พร้อมค้นหา หมวดเครื่องมือ ปักหมุด และโหมดสว่าง/มืด
เว็บ: https://econds.github.io/ro_tools_portal/

อ่าน `AGENTS.md` ก่อนแก้งาน เอกสารแผน (`PLAN.md`, `docs/`, prompt ช่วงออกแบบ) เก็บไว้ในเครื่องเท่านั้น ไม่อยู่ใน repository นี้

## โครงสร้าง

- `index.html`, `assets/`, `catalog/`, `favicon.svg`, `icons/`, `manifest.webmanifest`, `sw.js` ที่ root คือไฟล์ที่ GitHub Pages เสิร์ฟจาก branch `main` ห้ามแก้ด้วยมือ ให้สร้างจาก `npm run publish:root`
- `pwa/` ซอร์ส manifest, install icons และ service worker เฉพาะ Portal อ่าน [ข้อจำกัดออฟไลน์และวิธีอัปเดต](pwa/README.md)
- `src/` ซอร์สหน้าเว็บ (`src/index.html` คือแม่แบบ), `scripts/render.ts` สร้าง HTML ของการ์ดตอน build
- `data/tools.registry.v1.json` ข้อมูลเครื่องมือ รวม `identity` (สีประจำเครื่องมือ + ไอคอน) ตรวจด้วย `schemas/`
- `integrations/nav/` แถบร่วม `ro-suite-nav` ที่เว็บลูกนำไปติดตั้ง รุ่นที่ออกแล้วอยู่ใน `releases/<version>/` และห้ามแก้ภายหลัง
- `prompts/child-nav/` prompt สำหรับสั่ง agent ใน repo ลูกให้ติดตั้งแถบร่วม สร้างจาก `install.md` ด้วย `npm run prompts:nav`

## คำสั่ง

```bash
npm ci
npx playwright install chromium
npm run check          # build พอร์ทัล + build nav + PWA unit tests + Playwright ทั้งหมด
npm run publish:root   # build แล้วคัดลอกผลไปที่ root เพื่อ commit ขึ้น Pages
```

ถ้าพอร์ต 4173 ไม่ว่าง ให้ตั้ง `PORTAL_TEST_PORT` เช่น `PORTAL_TEST_PORT=4191 npx playwright test`
ตรวจ design kit: `pip install -r tests/requirements.txt` แล้ว `python -m unittest tests/test_design_kit.py`

## ออก nav รุ่นใหม่

1. แก้ source/registry แล้วเพิ่มเลขรุ่นใน `scripts/nav-version.mjs` ห้ามเขียนทับโฟลเดอร์รุ่นเดิม
2. `node scripts/generate-nav-snapshot.mjs` แล้ว commit source ทั้งหมดก่อน build
3. `npm run build:nav` แล้ว `npm test` ตรวจ `sourceCommit` และ SHA-256; commit artifact แยกจาก source
4. `npm run prompts:nav` ใช้เฉพาะเมื่ออัปเกรด prompt ของ repo ลูกเป็นงานที่อนุมัติแล้ว
5. งาน utility-nav เตรียม 1.4.1 พร้อม alignment API สำหรับ Draft PR และ rollout ห้าแอป ไม่มี tag/release/deploy; เก็บรุ่นเดิมไว้สำหรับ rollback ดู [ขอบเขตและลำดับการรวมงาน](integrations/nav/README.md)

## สถานะข้อมูลและหลักฐาน

สถานะการเปิดอ่าน (`listingStatus`), อายุเนื้อหา (`contentLifecycle`), การติดตั้งเมนูร่วม, ผลตรวจลิงก์จริง, วันที่ทบทวน metadata และการยืนยันข้อมูลในเกมเป็นคนละด้านกัน คู่มือ Ocean Week ยังเปิดอ่านได้ แต่รอบ 6 พ.ค.–4 มิ.ย. 2569 สิ้นสุดแล้ว วันที่สิ้นสุดเป็นก่อนปิดปรับปรุงเซิร์ฟเวอร์ ไม่ได้ระบุเวลานาฬิกา และไม่ได้ยืนยันข้อมูลสำหรับกิจกรรมรอบใหม่

การแก้ metadata ใน registry ไม่ออก nav รุ่นใหม่เมื่อ navigation projection และ bundle เหมือนเดิมทุก byte: release lock ยังตรวจ source hashes จาก commit ประวัติเดิม ซอร์ส runtime ปัจจุบันยังต้องตรง ยกเว้น registry ส่วน metadata ที่ไม่ส่งออกสู่ snapshot

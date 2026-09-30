# RO Tools Portal

รวมลิงก์เครื่องมือและคู่มือ Ragnarok Online ของ econDS พร้อมค้นหา หมวดเครื่องมือ ปักหมุด และโหมดสว่าง/มืด
เว็บ: https://econds.github.io/ro_tools_portal/

อ่าน `AGENTS.md`, `PLAN.md` และ `docs/` ก่อนแก้งาน

## โครงสร้าง

- `index.html`, `assets/`, `catalog/`, `favicon.svg` ที่ root คือไฟล์ที่ GitHub Pages เสิร์ฟจาก branch `main` ห้ามแก้ด้วยมือ ให้สร้างจาก `npm run publish:root`
- `src/` ซอร์สหน้าเว็บ (`src/index.html` คือแม่แบบ), `scripts/render.ts` สร้าง HTML ของการ์ดตอน build
- `data/tools.registry.v1.json` ข้อมูลเครื่องมือ รวม `identity` (สีประจำเครื่องมือ + ไอคอน) ตรวจด้วย `schemas/`
- `integrations/nav/` แถบร่วม `ro-suite-nav` ที่เว็บลูกนำไปติดตั้ง รุ่นที่ออกแล้วอยู่ใน `releases/<version>/` และห้ามแก้ภายหลัง
- `prompts/child-nav/` prompt สำหรับสั่ง agent ใน repo ลูกให้ติดตั้งแถบร่วม สร้างจาก `install.md` ด้วย `npm run prompts:nav`

## คำสั่ง

```bash
npm ci
npx playwright install chromium
npm run check          # build พอร์ทัล + build nav + Playwright ทั้งหมด
npm run publish:root   # build แล้วคัดลอกผลไปที่ root เพื่อ commit ขึ้น Pages
```

ถ้าพอร์ต 4173 ไม่ว่าง ให้ตั้ง `PORTAL_TEST_PORT` เช่น `PORTAL_TEST_PORT=4191 npx playwright test`
ตรวจ design kit: `pip install -r tests/requirements.txt` แล้ว `python -m unittest tests/test_design_kit.py`

## ออก nav รุ่นใหม่

1. แก้ `integrations/nav/src/` แล้วเพิ่มเลขรุ่นใน `scripts/nav-version.mjs` ห้ามเขียนทับโฟลเดอร์รุ่นเดิม
2. `npm run build:nav` แล้ว `npm test`
3. `npm run prompts:nav` เพื่ออัปเดต prompt ของ repo ลูกให้ชี้รุ่นใหม่และ SHA-256 ใหม่
4. commit แล้วสร้าง tag `nav-v<version>` เพื่อให้ repo ลูกดึงไฟล์จาก tag นั้น

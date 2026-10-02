# ro-suite-nav 1.3.0 — local artifact

Standalone Web Component มี snapshot อยู่ใน bundle; `releases/1.3.0/nav.js`, `catalog.snapshot.json` และ `nav.lock.json` สร้างด้วย `npm run build:nav`

## เปลี่ยนใน 1.3.0
- เพิ่ม `best-status` / **Best Status** ใน snapshot และ exact URL allowlist: `https://econds.github.io/ro-best-status/`
- ใช้ไอคอน `gem` ที่มีอยู่แล้วและสี `#7047a8` (white contrast ≥ 4.5) สำหรับการ์ด Portal และแถบใน Best Status
- Registry อ้างอิง README/app source แบบ pinned commit; ไม่ยืนยันกฎเกม ผล HTTP ปัจจุบัน หรือ suite import/share ที่ยังไม่ได้ทดสอบ
- มีหมวดคราฟต์และค่าสเตตัส พร้อมคำค้น Rune/Poison/Potion และภาษาไทย
- รุ่น 1.0.0–1.2.0 คงเดิมทุก byte; build ใน staging แล้วตรวจ release เดิมแทนการเขียนทับ

งานนี้เตรียม artifact สำหรับ review เท่านั้น ไม่สร้าง tag/release, merge หรือ deploy และไม่อัปเกรด bundle ในแอปอื่นที่ยัง pin 1.2.0 จึงยังไม่มี Best Status ในเมนูของแอปเหล่านั้นจนกว่าจะมีงานอัปเกรดแยก Optional catalog แก้ข้อนี้ไม่ได้ เพราะ allowlist ของ 1.2.0 ยังไม่มี URL ใหม่

## สร้าง release แบบตรวจซ้ำได้

1. เพิ่มเลขรุ่นใน `scripts/nav-version.mjs` แล้วแก้ source/registry
2. `node scripts/generate-nav-snapshot.mjs` และ commit source ทั้งหมดก่อน
3. `npm run build:nav` สร้างใน `.nav-build/` ก่อน package ไปยังโฟลเดอร์รุ่นใหม่ โดยทุก `sourceHashes` ต้องตรงกับ `sourceCommit` ที่ commit แล้ว
4. ตรวจ SHA-256 และ tests แล้ว commit artifact แยกจาก source
5. การ build ซ้ำต้องได้ byte เดิมและเก็บ `sourceCommit` เดิม ไม่เขียนทับไฟล์รุ่นเก่า หากเปลี่ยน source ให้เพิ่มรุ่นใหม่

Source commit ต้องอยู่ใน Git history ของ checkout (CI ใช้ `fetch-depth: 0`) ไม่ใช้ source hash แทน Git commit ก่อน merge ให้ตรวจ Portal และ Best Status Draft PR คู่กัน; merge Portal ก่อนเป็นลำดับที่แนะนำเพื่อให้ catalog/navigation source อยู่บน main จากนั้น Best Status ใช้ไฟล์ local ที่ตรวจ hash แล้วโดยไม่ต้องรอ tag หรือโหลด remote executable code

## ติดตั้งใน selected checkout ของแอป (งานแยก)

1. เก็บ baseline การคำนวณ storage keys share URLs และ publishing path ก่อนแก้
2. คัดลอก release ทั้งสามจาก commit ที่ review แล้วลง `assets/ro-suite/1.3.0/` ใน publishing root แล้วตรวจ SHA-256 ตาม lock
3. ใส่ light-DOM fallback ก่อน script; ใช้ `tool-id` จากทะเบียน ไม่เปลี่ยน header เดิม
4. Ocean ยังคงใช้ `docs/` บน branch `master` และ URL สาธารณะไม่มี `/docs/` แต่ไม่ได้แก้ Ocean ในงานนี้
5. ทดสอบมือถือ คีย์บอร์ด modal ตาราง share/export และกรณีบล็อก nav.js/catalog
6. Rollback เฉพาะ integration/ไฟล์เมนู ไม่ย้อนสูตรหรือข้อมูลคลัง

```html
<ro-suite-nav tool-id="best-status"
  portal-url="https://econds.github.io/ro_tools_portal/">
  <nav aria-label="เครื่องมือ RO">
    <a href="https://econds.github.io/ro_tools_portal/">กลับ RO Tools Portal</a>
  </nav>
</ro-suite-nav>
<script type="module" src="./assets/ro-suite/1.3.0/nav.js"></script>
```

## Optional catalog และความปลอดภัย

`catalog-url="https://econds.github.io/ro_tools_portal/catalog/v1/tools.json"` เป็นตัวเลือกหลังปลายทางพร้อมเท่านั้น ไม่จำเป็นต่อการเปิดเมนู
เริ่ม request เมื่อเปิดเมนูครั้งแรก ใช้ snapshot ทันที, timeout 1.5 วินาที, สูงสุด 32 KiB และ 50 รายการ, schema major 1, ไม่ส่ง credentials, ปฏิเสธ redirect และ URL นอก exact allowlist
JSON ไม่ประมวลผลเป็นโค้ด ข้อความใช้ textContent; ไม่มี cache หรือ retry loop เพิ่มปลายทางนอก allowlist ต้อง review และอัปเกรด bundle
Grade & Refine ยังคงเป็น planned/non-launchable

## Styling and behavior

รองรับ `theme="light"` หรือ `theme="dark"`; ถ้าไม่ระบุหรือค่าอื่นจะตาม prefers-color-scheme แถบรับธีมจากแอปเท่านั้น ไม่อ่าน localStorage หรือเปลี่ยนธีมของแอป
Shadow DOM แยก CSS แต่ไม่ใช่ security boundary; component อยู่ใน document flow ไม่เขียน body/global styles
ปรับ `--ro-suite-background` และ `--ro-suite-color` ได้ โดยแอปต้องตรวจ contrast เอง
Enter/Space เปิดปิด, Escape ปิดและคืน focus, Tab ตามลำดับลิงก์; `aria-current="page"` ระบุเครื่องมือปัจจุบัน
ไม่ intercept shortcuts ไม่แก้ URL hash/query ไม่อ่าน localStorage ไม่เปลี่ยนสูตรหรือราคาของแอป

รุ่นเก่า: 1.2.0 เพิ่ม theme support; 1.1.0 แก้ URL Portal และเพิ่ม identity; 1.0.0 ชี้ URL Portal เก่าที่ไม่ถูกต้อง จึงห้ามติดตั้งใหม่

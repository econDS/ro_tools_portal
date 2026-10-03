# ro-suite-nav 1.4.1 — local artifact

Standalone Web Component มี snapshot อยู่ใน bundle; `releases/1.4.1/nav.js`, `catalog.snapshot.json` และ `nav.lock.json` สร้างด้วย `npm run build:nav`

## เปลี่ยนใน 1.4.1
- แก้ accessibility ของ optional catalog: empty `role="status"` คงอยู่ใน accessibility tree ก่อนข้อความ async มาถึง โดยใช้ margin:0 แทน display:none
- เป้าหมายความสูง/การจัดแนวและพฤติกรรมผู้ใช้ทั่วไปเหมือน 1.4.0; ไม่มีค่า catalog-url ใน consumer ทั้งห้า
- 1.4.0 เป็น candidate ที่พบความเสี่ยงนี้ระหว่าง review และไม่เคย merge/deploy ในงานนี้ เก็บ artifact เดิมทุก byte และใช้ patch 1.4.1 สำหรับ rollout แทน ไม่เขียนทับ release เดิม
- Browser tests ตรวจ empty-region exposure ก่อน fetch ล้มเหลว; การฟังด้วย screen reader จริงยังไม่ได้ทดสอบ

## เปลี่ยนใน 1.4.0
- Utility surface เส้นล่างบาง 1px ไม่มีกรอบการ์ดโค้งหรือแถบสีหนา; ลดขนาด icon/padding โดยยังคง hit target อย่างน้อย 44×44px
- แถบปิดอยู่แถวเดียว ชื่อเครื่องมือยาวย่อด้วย ellipsis แต่ DOM text/accessibility name ครบ; ปุ่ม native ใช้ icon บนจอแคบและยังชื่อ “เครื่องมืออื่น”
- Portal แสดง “RO Tools” และมี accessible name “กลับ RO Tools Portal”; URL เดิม
- Full-width outer surface + inner border-box shell: `--ro-suite-content-max-width` (default `none`) และ `--ro-suite-inline-padding` (default `16px`)
- Inner shell มี margin-inline:auto; max-width **รวม padding** แอปต้องส่งค่าจาก shell จริง ห้ามเพิ่ม padding ซ้ำกับ wrapper เดิม
- ตัวอย่าง: `ro-suite-nav { --ro-suite-content-max-width: 1200px; --ro-suite-inline-padding: 24px; }` ปรับตาม breakpoint ของแอปได้
- Fallback อยู่ใน light DOM และต้องใช้ค่า alignment เดียวกันผ่าน integration CSS ของแอป; min-height 44px ของลิงก์ต้องคงอยู่
- เมนูยังอยู่ใน document flow; interaction, snapshot, URL allowlist และธีมเหมือนเดิม ไม่มี storage, runtime remote executable หรือ dependency ใหม่
- รุ่น 1.0.0–1.3.0 คงเดิมทุก byte; 1.4.0 เป็น backward-compatible visual/alignment API enhancement

## เปลี่ยนใน 1.3.0
- เพิ่ม `best-status` / **Best Status** ใน snapshot และ exact URL allowlist: `https://econds.github.io/ro-best-status/`
- ใช้ไอคอน `gem` ที่มีอยู่แล้วและสี `#7047a8` (white contrast ≥ 4.5) สำหรับการ์ด Portal และแถบใน Best Status
- Registry อ้างอิง README/app source แบบ pinned commit; ไม่ยืนยันกฎเกม ผล HTTP ปัจจุบัน หรือ suite import/share ที่ยังไม่ได้ทดสอบ
- มีหมวดคราฟต์และค่าสเตตัส พร้อมคำค้น Rune/Poison/Potion และภาษาไทย
- รุ่น 1.0.0–1.2.0 คงเดิมทุก byte; build ใน staging แล้วตรวจ release เดิมแทนการเขียนทับ

งานนี้เตรียม 1.4.1 สำหรับ review และ rollout แบบ additive ไปยังทั้งห้าแอป ไม่สร้าง tag/release ไม่ merge/deploy จนได้รับอนุมัติ แหล่งจริงคือ Portal; consumer ต้องคัดลอก artifact ทั้งสามแบบ byte-identical และเก็บ 1.3.0 สำหรับ rollback

## สร้าง release แบบตรวจซ้ำได้

1. เพิ่มเลขรุ่นใน `scripts/nav-version.mjs` แล้วแก้ source/registry
2. `node scripts/generate-nav-snapshot.mjs` และ commit source ทั้งหมดก่อน
3. `npm run build:nav` สร้างใน `.nav-build/` ก่อน package ไปยังโฟลเดอร์รุ่นใหม่ โดยทุก `sourceHashes` ต้องตรงกับ `sourceCommit` ที่ commit แล้ว
4. ตรวจ SHA-256 และ tests แล้ว commit artifact แยกจาก source
5. การ build ซ้ำต้องได้ byte เดิมและเก็บ `sourceCommit` เดิม ไม่เขียนทับไฟล์รุ่นเก่า หากเปลี่ยน source ให้เพิ่มรุ่นใหม่

Source commit ต้องอยู่ใน Git history ของ checkout (CI ใช้ `fetch-depth: 0`) ไม่ใช้ source hash แทน Git commit ก่อน merge ให้ตรวจ Portal และ consumer Draft PR ทั้งห้าคู่กัน; merge Portal ก่อนโดยรักษา source commit ใน history (normal merge ไม่ squash/rebase) จากนั้น consumer ใช้ไฟล์ local ที่ตรวจ hash แล้วโดยไม่ต้องรอ tag หรือโหลด remote executable code

## ติดตั้งใน selected checkout ของแอป (งานแยก)

1. เก็บ baseline การคำนวณ storage keys share URLs และ publishing path ก่อนแก้
2. คัดลอก release ทั้งสามจาก commit ที่ review แล้วลง `assets/ro-suite/1.4.1/` ใน publishing root แล้วตรวจ SHA-256 ตาม lock
3. ใส่ light-DOM fallback ก่อน script; ใช้ `tool-id` จากทะเบียน ไม่เปลี่ยน header เดิม
4. Ocean ยังคงใช้ `docs/` บน branch `master` และ URL สาธารณะไม่มี `/docs/` ใน rollout นี้ต้องรักษาโครงสร้างดังกล่าว
5. ทดสอบมือถือ คีย์บอร์ด modal ตาราง share/export และกรณีบล็อก nav.js/catalog
6. Rollback เฉพาะ integration/ไฟล์เมนู ไม่ย้อนสูตรหรือข้อมูลคลัง

```html
<ro-suite-nav tool-id="best-status"
  portal-url="https://econds.github.io/ro_tools_portal/">
  <nav aria-label="เครื่องมือ RO">
    <a href="https://econds.github.io/ro_tools_portal/">กลับ RO Tools Portal</a>
  </nav>
</ro-suite-nav>
<script type="module" src="./assets/ro-suite/1.4.1/nav.js"></script>
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

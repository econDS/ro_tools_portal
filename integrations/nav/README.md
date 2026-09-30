# ro-suite-nav 1.2.0 — local artifact

Standalone Web Component มี snapshot อยู่ใน bundle; `releases/1.2.0/nav.js`, `catalog.snapshot.json` และ `nav.lock.json` สร้างด้วย `npm run build:nav`
ทดสอบใน fixture แล้วตามรายงานโครงการ แต่ยังไม่ได้ติดตั้งใน repository ของแอปใด

## เปลี่ยนใน 1.2.0
- รองรับธีมมืด: attribute `theme="light"` หรือ `theme="dark"` บังคับสีแถบให้ตรงกับธีมของแอป ถ้าไม่ใส่หรือใส่ค่าอื่นจะเปลี่ยนตาม prefers-color-scheme
- แถบรับธีมจากแอปเท่านั้น ไม่อ่าน localStorage และไม่แก้ธีมของแอป ส่วน `--ro-suite-background` กับ `--ro-suite-color` ยังใช้ override ได้เหมือนเดิม
- ห้ามติดตั้ง 1.1.0 ใช้ 1.2.0 แทน

## เปลี่ยนจาก 1.0.0 (ใน 1.1.0)
- URL พอร์ทัลเปลี่ยนเป็นของจริง `https://econds.github.io/ro_tools_portal/` (1.0.0 ชี้ไป `ro-tools-portal` ซึ่งตอบ 404) โฟลเดอร์ 1.0.0 เก็บไว้เป็นประวัติ ห้ามนำไปติดตั้ง
- แสดงตัวตนของเครื่องมือจากแคตตาล็อก (`identity.accent` + `identity.icon`): ช่องไอคอนหน้าชื่อเครื่องมือปัจจุบัน เส้นสีใต้แถบ และไอคอนในเมนูสลับเครื่องมือ
- `identity` เป็นฟิลด์ไม่บังคับใน catalog schema major 1 ต้องเป็น hex ที่ไอคอนสีขาวอ่านได้ (contrast ≥ 4.5) และชื่อไอคอนที่รู้จัก ไม่งั้นทั้ง catalog ถูกปฏิเสธแล้วใช้ snapshot ถ้า catalog ระยะไกลไม่มี identity จะใช้ของ snapshot แทน

## ก่อนติดตั้ง

ตรวจ URL พอร์ทัลจริงก่อนใช้ในแอปที่เผยแพร่ ขณะนี้ทะเบียนยังระบุพอร์ทัลเป็น planned
workspace เริ่มต้นไม่มี Git repository จึงบันทึก `sourceCommit: null` อย่างชัดเจน พร้อม SHA-256 ของ source files และ artifact; ต้องบันทึก commit ที่ review แล้วก่อน release จริง ห้ามอ้าง source hash ว่าเป็น Git commit
เมื่อ release แล้ว ให้ถือไฟล์ของรุ่นนั้น immutable; เปลี่ยนเลขรุ่นและ review เมื่อแก้ bundle

## ติดตั้งใน selected checkout ของแอป (งานแยก)

1. เก็บ baseline การคำนวณ storage keys share URLs และ publishing path ก่อนแก้
2. คัดลอกไฟล์ release ทั้งสามลง `assets/ro-suite/1.2.0/` ใน publishing root ของแอป ตรวจ SHA-256 ตาม lock
3. ใส่ light-DOM fallback ก่อน script ตาม `examples/nav-integration.html.txt` ใช้ `tool-id` จากทะเบียน ไม่เปลี่ยน header เดิม
4. Ocean ใช้ `docs/assets/ro-suite/1.2.0/` บน branch ที่ตรวจพบ `master` และวางเมนูนอก `.page` โดยทดสอบ layout จริง; URL สาธารณะไม่มี `/docs/`
5. รัน baseline เดิม พร้อมตรวจมือถือ คีย์บอร์ด modal ตาราง share/export และกรณีบล็อก nav.js/catalog
6. Rollback โดยย้อนเฉพาะ integration/ไฟล์เมนู ไม่ย้อนสูตรหรือข้อมูลคลัง

```html
<ro-suite-nav tool-id="reform-workshop"
  portal-url="https://econds.github.io/ro_tools_portal/">
  <nav aria-label="เครื่องมือ RO">
    <a href="https://econds.github.io/ro_tools_portal/">กลับ RO Tools Portal</a>
  </nav>
</ro-suite-nav>
<script type="module" src="./assets/ro-suite/1.2.0/nav.js"></script>
```

ตัวอย่าง URL นี้เป็นเป้าหมายที่เสนอจนกว่าจะเผยแพร่และตรวจจริง ไม่ใช่คำยืนยันว่าเว็บเปิดแล้ว

## Optional catalog

เพิ่ม `catalog-url="https://econds.github.io/ro_tools_portal/catalog/v1/tools.json"` หลังปลายทางพร้อมเท่านั้น
เริ่ม request เมื่อผู้ใช้เปิดเมนูครั้งแรก ใช้ snapshot ทันที, timeout 1.5 วินาที, สูงสุด 32 KiB และ 50 รายการ, schema major 1, ไม่ส่ง credentials, ปฏิเสธ redirect และ URL นอก allowlist
JSON ไม่ถูกประมวลผลเป็นโค้ด ข้อความใช้ textContent ค่า optional ที่ไม่ใช้ไม่ถูกนำไปเขียน state; ไม่ cache หรือ retry loop
เพิ่มปลายทางนอก allowlist ต้อง review และอัปเกรด bundle เดิมด้วย การอัปเดต JSON ภายในปลายทางที่อนุมัติแล้วไม่ต้องเปลี่ยน component

## Styling and behavior

Shadow DOM แยก CSS ภายใน แต่ไม่ใช่ security boundary; component อยู่ใน document flow และไม่เขียน body/global styles
ปรับเฉพาะ `--ro-suite-background` และ `--ro-suite-color` ได้ โดยแอปต้องตรวจ contrast เอง; ไม่บังคับธีมของเครื่องคิดเลข
ปุ่มเปิด/ปิดรองรับ Enter/Space, Escape ปิดและคืน focus, Tab เดินตามลำดับลิงก์ `aria-current="page"` อยู่ที่เครื่องมือปัจจุบัน
ไม่ intercept shortcuts ไม่แก้ URL hash/query ไม่อ่าน localStorage และไม่เปลี่ยนสูตรหรือราคาของแอป

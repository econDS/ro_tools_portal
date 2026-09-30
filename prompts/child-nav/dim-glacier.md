# ติดตั้งแถบร่วม ro-suite-nav ในเว็บลูก

ทำงานใน repository นี้เท่านั้น: econDS/dim_glacier_planner (branch: main, publishing root: root ของ repo)
tool-id ของเว็บนี้: `dim-glacier` · สีประจำเครื่องมือ `#2b6fa3` · ไอคอน `snowflake`

## เป้าหมาย
ใส่แถบร่วม `ro-suite-nav` ไว้บนสุดของหน้า เพื่อให้ผู้ใช้รู้ว่าเว็บนี้อยู่ในเครือ RO Tools เดียวกับพอร์ทัล
ธีมเดิมของเว็บนี้ต้องอยู่ครบ แถบร่วมแสดงแค่ตัวตนของเครื่องมือ (จุดสี ไอคอน และเส้นสีใต้แถบ) ส่วนเนื้อหาใต้แถบเป็นธีมของเว็บนี้เหมือนเดิมทุกอย่าง

## แหล่งไฟล์ (อ่านอย่างเดียว ห้ามแก้)
ไฟล์ nav อยู่ใน repository `econDS/ro_tools_portal` ที่ tag `nav-v1.2.0` โฟลเดอร์ `integrations/nav/releases/1.2.0/`
- https://raw.githubusercontent.com/econDS/ro_tools_portal/nav-v1.2.0/integrations/nav/releases/1.2.0/nav.js
- https://raw.githubusercontent.com/econDS/ro_tools_portal/nav-v1.2.0/integrations/nav/releases/1.2.0/catalog.snapshot.json
- https://raw.githubusercontent.com/econDS/ro_tools_portal/nav-v1.2.0/integrations/nav/releases/1.2.0/nav.lock.json
- ถ้าดาวน์โหลดทีละไฟล์ไม่ได้ ใช้ `git clone --depth 1 --branch nav-v1.2.0 https://github.com/econDS/ro_tools_portal` ไว้นอก repo นี้แทน ถ้ายังไม่ได้อีก ให้หยุดแล้วรายงานกลับ ห้ามเขียน nav.js ขึ้นเอง

SHA-256 ที่ต้องได้ (ต้องตรงกับ `nav.lock.json` ด้วย):
- `nav.js`: `d75be916445feb4febeaada437841a1b3be68db16a00673198c78fd6f6c8dc5f`
- `catalog.snapshot.json`: `800bb9c9d2b52a7fbae58e436b05529e69820fee3627d199da545a6f5e28f7dd`

อ่านเอกสารก่อนเริ่ม: `integrations/nav/README.md` และ `docs/NAV_CONTRACT.md` ใน repo เดียวกันที่ tag นั้น
URL จริงของพอร์ทัลคือ `https://econds.github.io/ro_tools_portal/` (มีขีดล่าง)

## ขั้นตอน
1. เริ่มจากรัน `git status` แล้วจดไว้ว่ามีไฟล์ไหนถูกแก้ค้างอยู่ ไฟล์พวกนั้นห้ามแตะ ห้าม revert ห้าม reset และห้าม stash ถ้าไฟล์ที่ต้องแก้ (เช่น index.html) มีการแก้ค้างอยู่ ให้แก้ต่อจากของเดิมโดยไม่ทิ้งของเดิม
2. บันทึก baseline ก่อนแก้: ผลคำนวณตัวอย่าง 2–3 กรณี, localStorage keys ที่แอปใช้, รูปแบบ share URL/hash/query, export/import และ path ที่ใช้เผยแพร่
3. ดาวน์โหลดไฟล์ release ทั้งสามมาไว้ที่ `assets/ro-suite/1.2.0/` แล้วตรวจ SHA-256 ให้ตรงกับค่าข้างบนทุกไฟล์ ถ้าไม่ตรงให้หยุด หน้าเว็บต้องโหลด nav.js จากไฟล์ในเว็บนี้เท่านั้น ห้ามอ้าง raw.githubusercontent หรือ URL ภายนอก และห้ามใช้ `latest`
4. ใส่โค้ดนี้เป็นอย่างแรกใน `<body>` ต่อจาก skip link ถ้ามี (Ocean ต้องวางไว้นอก `.page`) ห้ามลบ header หรือธีมเดิม:
   ```html
   <ro-suite-nav tool-id="dim-glacier" portal-url="https://econds.github.io/ro_tools_portal/">
     <nav aria-label="เครื่องมือ RO">
       <a href="https://econds.github.io/ro_tools_portal/">กลับ RO Tools Portal</a>
     </nav>
   </ro-suite-nav>
   <script type="module" src="./assets/ro-suite/1.2.0/nav.js"></script>
   ```
   ยังไม่ต้องใส่ `catalog-url`
   ตั้ง `theme` ของแถบให้ตรงกับธีมของแอป:
   - แอปมีแต่ธีมมืด ใส่ `theme="dark"` / แอปมีแต่ธีมสว่าง ใส่ `theme="light"`
   - แอปมีปุ่มสลับธีม ให้ตั้งค่า `theme` ของ `<ro-suite-nav>` ตามธีมปัจจุบันตอนโหลดหน้าและทุกครั้งที่สลับ (แก้แค่ attribute ไม่ต้องแก้ระบบธีมเดิม และห้ามเพิ่ม localStorage key ใหม่)
   - แอปที่เปลี่ยนตามระบบ (prefers-color-scheme) ไม่ต้องใส่ `theme`
   แถบรับธีมจากแอปเท่านั้น ห้ามให้แถบหรือพอร์ทัลเปลี่ยนธีมของแอป
5. ห้ามเพิ่ม CSS ที่มีผลทั้งหน้า เช่น body padding, `*`, หรือ selector ของ header/button และห้ามบังคับธีมของแอปให้ตามพอร์ทัล
   ถ้าแถบซ้อนกับ sticky header หรือ modal เดิม ให้แก้เฉพาะจุดนั้นแล้วระบุในรายงาน
6. ห้ามเปลี่ยนสูตรคำนวณ ราคา คลัง storage keys รูปแบบ import/export share URL และ event mode

## ตรวจก่อนส่งงาน
- ผลคำนวณ, share URL และ export/import ต้องตรงกับ baseline ในข้อ 2
- ที่ความกว้าง 360, 390, 768 และ 1440px แถบต้องไม่ล้น ไม่บังเนื้อหา ปุ่มสูงอย่างน้อย 44px และไม่มี horizontal scroll
- คีย์บอร์ด: Tab ไปถึงแถบได้ Enter/Space เปิดเมนูสลับเครื่องมือ Escape ปิดเมนูแล้ว focus กลับที่เดิม และเครื่องมือปัจจุบันมี `aria-current="page"`
- ถ้าบล็อก nav.js ลิงก์สำรอง "กลับ RO Tools Portal" ต้องยังกดได้ และเครื่องคิดเลขต้องยังใช้งานได้ปกติ
- console ต้องไม่มี error ใหม่
- ตรวจทั้งธีมสว่างและมืด ถ้าแอปมีทั้งสองธีม: สีแถบต้องตรงกับธีมของแอปทุกครั้งที่สลับ และข้อความในแถบต้องอ่านได้ชัด

## ห้าม
ห้าม commit, push, deploy หรือแก้การตั้งค่า GitHub Pages จนกว่าผมจะอนุมัติ
ห้ามแก้ไฟล์ใน ro-tools-portal ห้ามใช้ iframe และห้ามใช้ `localStorage.clear()`

## รายงานกลับ
ส่งรายการไฟล์ที่แก้, SHA-256 ที่ตรวจแล้ว, คำสั่งทดสอบที่รันจริงพร้อมผล, ภาพหน้าจอมือถือและเดสก์ท็อป, และสิ่งที่ยังไม่ได้ทดสอบ

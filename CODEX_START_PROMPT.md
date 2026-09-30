สร้าง repository งานใหม่ชื่อ ro-tools-portal ตามชุดสเปกนี้ เพื่อเป็นทางเข้าหลักของเครื่องมือ RO ของ econDS

อ่าน AGENTS.md, PLAN.md, docs/ARCHITECTURE.md, docs/NAV_CONTRACT.md, docs/REPOSITORY_ROLLOUT.md, docs/ACCEPTANCE_TESTS.md และ data/ ทั้งหมดก่อนทำงาน
ใช้ data/tools.registry.v1.json เป็นข้อมูลตั้งต้น แต่ตรวจ URL และสภาพจริงก่อนอ้างว่าใช้งานได้ กรณีตรวจเครือข่ายไม่ได้ให้คงสถานะ unverified

รอบแรกให้ทำเฉพาะพอร์ทัล:
- Vite + TypeScript เว็บสถิต หน้าเดียว ไม่ต้องมี backend/login
- การ์ด 4 เว็บเดิม พร้อมการค้นไทย/อังกฤษ ตัวกรอง ปักหมุด และรายการที่เปิดจากพอร์ทัลล่าสุด
- แสดง Grade & Refine ว่าอยู่ในแผน ไม่มี launch link ปลอม
- Ocean Week เป็นคู่มือรอบที่ผ่านมา ตามช่วงที่หน้าเดิมระบุ ไม่ใช่กิจกรรมกำลังเปิดอยู่
- มีลิงก์จริงใน HTML จากทะเบียน แม้ JavaScript ถูกปิดหรือ storage ใช้ไม่ได้
- ออกแบบมือถือ คีย์บอร์ด ภาวะโหลดผิดพลาด และความต่างระหว่างสถานะเว็บ/สถานะเนื้อหา/วันที่ตรวจข้อมูล
- ทดสอบ build ใต้ /ro-tools-portal/ ไม่ใช้ SPA rewrite ที่ GitHub Pages ไม่ได้ตั้งให้
- ห้ามแก้ repository เดิม สร้าง remote, push หรือ deploy ในรอบนี้

หลังพอร์ทัลทำงานและ tests ผ่าน ให้พัฒนา ro-suite-nav เป็นส่วนประกอบอิสระที่ล็อกรุ่น พร้อม local fallback และ fixture tests โดยยังไม่ติดตั้งใน repo อื่นอัตโนมัติ
จัดทำ artifact/คู่มือติดตั้งและใช้ prompts/ สำหรับการปรับแต่ละ repo แยก task

ชะลอ shared pricebook, handoff และ warehouse จนกว่าระดับ navigation จะเสถียร แต่รักษา schema/version และโครงสร้างสำหรับเพิ่มภายหลังตามสเปก
ใช้ docs/ACCEPTANCE_TESTS.md เป็นเกณฑ์ ไม่อ้างว่าผ่านกรณีที่ยังไม่ได้ implement/run
จบแต่ละระยะสรุปไฟล์ที่แก้ ผลการทดสอบจริง และข้อจำกัดที่ยังเหลือ

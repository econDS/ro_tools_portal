เมื่อพัฒนา ro-grade-refine-planner ให้รองรับสัญญา RO suite ตั้งแต่ต้น
อ่านสเปก Grade/Refine ของโครงการเองร่วมกับ NAV_CONTRACT.md และ HANDOFF_CONTRACT.md จากพอร์ทัล
ใช้ navigation bundle ล็อกรุ่น local fallback และ manifest ที่ประกาศเฉพาะ capability ที่ผ่าน tests
นำเข้า equipment-plan.v1 ต้องยืนยันชนิดไอเท็ม grade/refine และ ruleset; unknown ไม่ใช่ None/+0
Reform material-plan ไม่ใช่อุปกรณ์สำเร็จและต้องไม่รับเข้าแบบเดาค่า
แบ่ง prior cost segments ออกจากต้นทุนเพิ่ม รวมกลับโดยไม่ซ้ำและไม่ให้การจำลองแก้คลังจริง
เมื่อ deploy URL จริงและ test ผ่าน ค่อยเตรียม PR อัปเดตทะเบียนพอร์ทัลจาก planned เป็น listed
ห้ามอ้างว่า repo/หน้าเว็บมีอยู่แล้วจนได้ตรวจจริง และไม่ deploy โดยไม่ได้รับคำสั่ง

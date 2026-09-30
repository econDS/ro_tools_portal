เพิ่ม RO suite navigation ให้ checkout ของ econDS/dim_glacier_planner เท่านั้น
อ่านข้อกำหนดเมนูและ rollout ตรวจ index.html กับ state/import/export/ราคา/refine ของจริงก่อนแก้
เก็บ baseline Craft, Enchant และ Refine ให้เทียบผลก่อนหลังได้ ติดเมนูโดยไม่เปลี่ยนสูตรหรือ format เก่า
รักษา JSON/CSV/Excel import/export และความหมายอัตรา Zeny เป็นบาท ไม่เปลี่ยนชื่อ repo หรือ URL ที่มี underscore
ยังไม่ต่อ Grade & Refine แบบใช้จริงจนปลายทางมี manifest และข้อมูลยืนยัน
หากได้ task handoff แยก ต้องระบุว่าค่า Refine ใหม่แทนช่วงเดิมหรือทำต่อจากสถานะที่มี ห้าม Grand Total เดิม + Refine ใหม่ซ้ำ
ทดสอบ old exports round-trip, currencies, cancellation และราคาผู้ใช้หลัง reset portal
ห้ามแก้ repo อื่น push หรือ deploy โดยไม่ได้รับคำสั่งแยก

เพิ่ม RO suite navigation ให้ checkout ของ econDS/ro-leveling-map เท่านั้น
อ่านข้อกำหนดเมนูและ rollout ตรวจ index.html, assets/ui.js และโมดูล settings/share ที่ repo ใช้จริงก่อนแก้
รักษารูปแบบลิงก์การตั้งค่า ค่าที่บันทึก สูตร EXP และ logic Spotlight เดิม
ติดเมนูที่ไม่ชน sticky controls/ตาราง/modal เพิ่มเพียง adapter ที่จำเป็น ไม่บังคับย้าย framework
deep link รายแผนที่ทำได้เมื่อเพิ่มและทดสอบ parser จริงแล้ว ห้ามลง manifest ว่ารองรับก่อนเสร็จ
ไม่ตีความคะแนนพื้นที่เป็น EXP/hour และไม่อ้างว่าแผนที่มีวัตถุดิบของสูตรอื่นโดยไม่มีข้อมูล
ทดสอบ link round-trip, sort, modal focus, saved settings, event expiry และ failure ของ nav/catalog
ห้ามเปลี่ยน key เดิม push หรือ deploy โดยไม่ได้รับคำสั่งแยก

# Implementation — 2026-09-19

รอบนี้ทำ standalone portal และ artifact เมนูร่วมตาม `CODEX_START_PROMPT.md` โดยไม่แก้แอปเดิม

## Portal

- Vite + TypeScript สร้าง `dist/index.html` จากทะเบียนที่ผ่าน JSON Schema และ URL allowlist ตอน build
- 4 ลิงก์จริงอยู่ใน HTML ก่อน JavaScript ทำงาน; ค้นหาภาษาไทย/อังกฤษ หมวด ปักหมุด เปิดจากพอร์ทัลล่าสุด ธีม และล้างข้อมูลพอร์ทัลเป็น progressive enhancement
- หน้าเดียวที่ `/ro-tools-portal/`; query `q` และ `category` เก็บตัวกรองโดยรักษา query อื่นและ hash
- Grade & Refine ไม่มี launch link; Ocean แสดงรอบย้อนหลังพร้อมวันที่และข้อจำกัด before-maintenance ตามทะเบียน
- วันที่ทบทวนคำอธิบาย วันที่ตรวจเกม และวันที่ตรวจ HTTP แสดงแยกกัน ไม่เปลี่ยน `data/sources.json` หรืออ้างผล HTTP ใหม่
- `dist/catalog/v1/tools.json` มีเฉพาะ schemaVersion, catalogVersion และข้อมูลนำทาง ไม่เผยแพร่ความชอบของผู้ใช้
- ไม่โหลดฟอนต์ รูป หรือ JavaScript จาก CDN; ไม่มี service worker หรือ analytics

## Storage contract

| Key | เจ้าของและค่า | การล้าง |
| --- | --- | --- |
| `ro-suite:portal:v1` | Portal: `{version:1,favorites:string[],recent:string[]}`; รับเฉพาะ ID ที่เปิดได้, recent ไม่เกิน 5 | ปุ่มล้างหมุดและประวัติลบเฉพาะ key นี้ |
| `ro-suite:prefs:v1` | Portal: `{version:1,theme:"light"\|"dark"}` | เปลี่ยนผ่านปุ่มธีม; ปุ่มล้างหมุดคงธีมไว้ |

Recent หมายถึงผู้ใช้กดลิงก์เปิดจากพอร์ทัล ไม่ยืนยันว่าปลายทางโหลดสำเร็จ และไม่ใช่ browser history ทั้งหมด
การเปิด URL ใหม่ไม่ส่งราคา คลัง หรือแผน การอ่าน/เขียน storage ล้มเหลวมีข้อความแจ้งและใช้หน่วยความจำของหน้านั้นได้
ไม่มี migration ของ key เดิม ไม่เรียก `localStorage.clear()` เมนูร่วมไม่อ่าน/เขียน storage ใดเลย

## เปลี่ยนทะเบียน

แก้ `data/tools.registry.v1.json` ซึ่งเป็นแหล่งข้อมูลหลัก เพิ่ม URL ที่ผ่านการทบทวนใน `src/urls.ts` เมื่อมีปลายทางใหม่ และคงสถานะ/วันที่ตามหลักฐานจริง
แก้ journeys ใน `data/journeys.v1.json` แล้วรัน `npm run check` การเพิ่มลิงก์ไม่ประกาศความสามารถ import/export ให้แอป
สร้างใหม่ด้วย `npm run build:nav` เพื่ออัปเดต snapshot; bundle ที่แจกไปแล้วต้องอัปเกรดด้วยการ review และรุ่นใหม่เมื่อเปลี่ยน executable หรือ allowlist

## ขอบเขตทดสอบ

ผลที่รันจริงและรายการไฟล์อยู่ใน `docs/IMPLEMENTATION_REPORT.md` Browser tests เป็น Chromium ของ portal และ fixture เมนู ไม่ใช่ E2E ของแอปเดิม
ขั้นต่อไปคือ Ocean pilot ใน selected checkout แยก task ตาม `prompts/01-ocean-week.md` หลังมี URL พอร์ทัลที่เผยแพร่และตรวจจริงแล้ว

# PaceSet Frontend (`prese-set-fn`)

Next.js (App Router) + TypeScript + Tailwind — UI สำหรับ PaceSet

> ตอนนี้ใช้ **mock data** ในเครื่อง — ยังไม่เรียก Backend  
> คู่มือรันทั้งระบบ: ดู [`../README.md`](../README.md)

## รัน local

```bash
cd prese-set-fn
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## หน้าหลัก

| Path | หน้าที่ |
|------|---------|
| `/` → welcome | หน้าต้อนรับ |
| `/home` | หน้าหลัก |
| `/programs` | รายการโปรแกรม |
| `/programs/edit` | สร้าง/แก้โปรแกรม |
| `/schedule` | ตารางรายวัน |
| `/workout/interval` | โหมด Interval |
| `/workout/reps` | โหมด Reps & Sets |
| `/summary` | สรุปหลัง workout |
| `/history` | ประวัติ |
| `/profile` | โปรไฟล์ / ตั้งค่า (เสียง, น้ำ, ภาษา) |

## Scripts

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | development server (port 3000) |
| `npm run build` | production build |
| `npm run start` | รันหลัง build |
| `npm run lint` | ESLint |

## หมายเหตุ

- ถ้าพอร์ต 3000 ถูกใช้แล้ว: `npx next dev -p 3002`
- เมื่อเชื่อม API จะชี้ไปที่ `http://localhost:3001/api` (ดู BN README)

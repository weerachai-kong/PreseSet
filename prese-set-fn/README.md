# PaceSet Frontend (`prese-set-fn`)

Next.js (App Router) + TypeScript + Tailwind — UI สำหรับ PaceSet

> คู่มือรันทั้งระบบ: ดู [`../README.md`](../README.md)

## รัน local (เชื่อม BN)

**Terminal 1 — Backend + DB**

```bash
cd prese-set-bn
npm run db:up
npm run start:dev
```

**Terminal 2 — Frontend**

```bash
cd prese-set-fn
cp .env.local.example .env.local   # ครั้งแรก
npm install
npm run dev
```

เปิด [http://localhost:3000/welcome](http://localhost:3000/welcome) → สมัคร/เข้าสู่ระบบ → ข้อมูลมาจาก API ที่ `http://localhost:3001/api`

Env (`prese-set-fn/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

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

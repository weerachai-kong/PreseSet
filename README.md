# PaceSet — Local Setup

Mobile workout pacing app (Interval + Reps & Sets)

| ส่วน | โฟลเดอร์ | พอร์ต | สถานะตอนนี้ |
|------|----------|-------|-------------|
| Frontend (FN) | `prese-set-fn` | **3000** | UI + mock data |
| Backend (BN) | `prese-set-bn` | **3001** | Nest API + PostgreSQL |
| Database | Docker (`paceset-postgres`) | **5434** → 5432 ใน container | Prisma migrations |

> FN ยังใช้ mock data อยู่ — รันแยกจาก BN ได้เลย  
> BN ต้องมี Docker + Postgres ก่อน `start:dev`

---

## สิ่งที่ต้องมีก่อน

- **Node.js** 20+ (แนะนำ LTS)
- **npm** (มากับ Node)
- **Docker Desktop** (สำหรับ Postgres ของ BN)

ตรวจเวอร์ชัน:

```bash
node -v
npm -v
docker -v
```

---

## รันทั้งระบบ (แนะนำเปิด 2 terminal)

### Terminal 1 — Backend + DB

```bash
cd prese-set-bn

# 1) ติดตั้ง dependency (ครั้งแรก)
npm install

# 2) สร้างไฟล์ env
cp .env.example .env

# 3) เปิด Postgres (ต้องเปิด Docker Desktop ก่อน)
npm run db:up

# 4) apply schema
npx prisma migrate deploy
npx prisma generate

# 5) รัน API
npm run start:dev
```

รอจนเห็นประมาณ:

```text
PaceSet API running on http://localhost:3001/api
```

ทดสอบเร็ว:

```bash
curl -s -X POST http://localhost:3001/api/health
# {"ok":true,"service":"prese-set-bn"}
```

### Terminal 2 — Frontend

```bash
cd prese-set-fn

# 1) ติดตั้ง dependency (ครั้งแรก)
npm install

# 2) รัน Next.js
npm run dev
```

เปิดเบราว์เซอร์: [http://localhost:3000](http://localhost:3000)

---

## เช็คว่าพร้อมใช้งาน

### Frontend

1. เปิด `http://localhost:3000` → ไปหน้า Welcome / Home ได้
2. สลับภาษา TH/EN ได้
3. เปิด Programs / Schedule / Workout screens ได้ (ข้อมูลเป็น mock)

### Backend

1. Health: `POST http://localhost:3001/api/health`
2. Register ตัวอย่าง:

```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@paceset.app","password":"secret12","displayName":"Demo"}'
```

3. ได้ `accessToken` แล้วลองสร้างโปรแกรม:

```bash
# แทน <TOKEN> ด้วย accessToken จากข้อ 2
curl -s -X POST http://localhost:3001/api/programs/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sprint","mode":"INTERVAL","steps":[{"order":1,"title":"Run","workSeconds":20,"restSeconds":10}]}'
```

รายการ endpoint ทั้งหมดดูที่ [`prese-set-bn/README.md`](prese-set-bn/README.md)

---

## Env ของ Backend

ไฟล์: `prese-set-bn/.env` (คัดจาก `.env.example`)

```env
DATABASE_URL="postgresql://paceset:paceset@localhost:5434/paceset?schema=public"
JWT_SECRET="change-me-in-production"
PORT=3001
```

> พอร์ต **5434** เพราะเครื่องอาจมี Postgres อื่นใช้ 5432 อยู่แล้ว

---

## คำสั่งที่ใช้บ่อย

### Backend (`prese-set-bn`)

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run db:up` | เปิด Postgres container |
| `npm run db:down` | ปิด Postgres container |
| `npx prisma migrate deploy` | apply migrations |
| `npx prisma studio` | เปิด DB GUI |
| `npm run start:dev` | รัน API แบบ watch |
| `npm run build` | build production |

### Frontend (`prese-set-fn`)

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | รัน Next.js (port 3000) |
| `npm run build` | build production |
| `npm run start` | รันหลัง build |

---

## แก้ปัญหาที่พบบ่อย

### `db:up` ไม่ขึ้น / Docker error

- เปิด **Docker Desktop** ให้พร้อมก่อน
- เช็คว่า container ทำงาน: `docker ps` ควรเห็น `paceset-postgres`

### พอร์ตชน

| พอร์ต | ใช้โดย | แก้ |
|-------|--------|-----|
| 3000 | FN | `npx next dev -p 3002` หรือปิด process ที่ใช้ 3000 |
| 3001 | BN | เปลี่ยน `PORT` ใน `.env` |
| 5434 | Postgres | แก้ใน `docker-compose.yml` + `DATABASE_URL` ให้ตรงกัน |

หา process ที่ค้าง (macOS):

```bash
lsof -i :3000
lsof -i :3001
```

### Prisma / DB connection failed

1. `npm run db:up` แล้วรอสักครู่
2. ตรวจว่า `.env` มี `localhost:5434`
3. รันใหม่: `npx prisma migrate deploy`

### FN ขึ้น แต่ไม่มีข้อมูลจาก API

ปกติ — ตอนนี้ FN ยังเป็น mock data ยังไม่ได้เชื่อม `http://localhost:3001/api`  
BN ทดสอบด้วย `curl` หรือ REST client ได้ตาม README ของ bn

---

## โครงสร้างโปรเจกต์

```text
PreseSet/
├── README.md              ← ไฟล์นี้ (รัน local ทั้งระบบ)
├── prese-set-fn/          ← Next.js UI
├── prese-set-bn/          ← Nest.js API + Prisma + Docker Postgres
├── redme.txt              ← project charter
└── canva.text             ← Canva design export
```

Architecture BN:

```text
Controller → Service (rules) → Repository (raw SQL) → PostgreSQL
```

# PaceSet Backend (`prese-set-bn`)

Nest.js + Prisma + PostgreSQL API for PaceSet

> คู่มือรันทั้งระบบ (FN + BN): ดู [`../README.md`](../README.md)

API style: **POST only** (action paths) — ไม่ใช้ GET/PATCH/PUT/DELETE

## Architecture

```
Controller → Service (authz / business rules) → Repository (raw SQL) → PostgreSQL
```

- Prisma ใช้สำหรับ connection + migrations / `schema.prisma`
- Query เขียน SQL เองใน `*.repository.ts` ผ่าน `$queryRawUnsafe` / `$executeRawUnsafe`

## Quick start

```bash
cd prese-set-bn
npm install
cp .env.example .env

# ต้องเปิด Docker Desktop ก่อน
npm run db:up
npx prisma migrate deploy
npx prisma generate

npm run start:dev
```

API: `http://localhost:3001/api`

Health check:

```bash
curl -s -X POST http://localhost:3001/api/health
```

## Env

คัดจาก `.env.example` → `.env`

```env
DATABASE_URL="postgresql://paceset:paceset@localhost:5434/paceset?schema=public"
JWT_SECRET="change-me-in-production"
PORT=3001
```

> Postgres map เป็น **5434** เพราะเครื่องอาจมี Postgres อื่นใช้ 5432 อยู่แล้ว

## Auth

| Method | Path | Body |
|--------|------|------|
| POST | `/api/auth/register` | `{ email, password, displayName }` |
| POST | `/api/auth/login` | `{ email, password }` |

Protected routes: header `Authorization: Bearer <accessToken>`

## Main endpoints (all POST)

| Path | Description | Body |
|------|-------------|------|
| `/api/users/me` | Profile | — |
| `/api/users/update-me` | Update profile / settings | profile fields |
| `/api/programs/list` | List programs | — |
| `/api/programs/get` | Get one program | `{ id }` |
| `/api/programs/create` | Create program | program + steps |
| `/api/programs/update` | Update program | `{ id, ...fields }` |
| `/api/programs/delete` | Delete program | `{ id }` |
| `/api/schedule/list` | Weekly schedule | — |
| `/api/schedule/today` | Today's program | — |
| `/api/schedule/upsert` | Assign program to day | `{ dayOfWeek, programId }` |
| `/api/schedule/delete` | Clear day | `{ dayOfWeek }` |
| `/api/sessions/list` | Workout history | — |
| `/api/sessions/create` | Create session | session fields |
| `/api/sessions/update` | Update session | `{ id, ...fields }` |

### Session create body ตัวอย่าง

```json
{
  "programId": "<id>",
  "mode": "INTERVAL",
  "startedAt": "2026-08-02T09:00:00.000Z",
  "endedAt": "2026-08-02T09:01:30.000Z",
  "completed": true,
  "summaryJson": { "name": "Sprint" }
}
```

## Scripts

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run db:up` | เปิด Postgres container |
| `npm run db:down` | ปิด Postgres container |
| `npx prisma migrate deploy` | apply migrations |
| `npx prisma studio` | DB GUI |
| `npm run start:dev` | API watch mode |
| `npm run build` | production build |

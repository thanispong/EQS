# EQS

## Requirements

- Node.js และ npm
- PostgreSQL (สร้างฐานข้อมูลชื่อ `eqs_db`)

## Clone

```bash
git clone https://github.com/thanispong/EQS.git
cd EQS
```

## Backend

```cmd
cd eqs-api
npm i
copy .env.example .env
npm run db:setup
npm run start:dev
```

ก่อนรัน `db:setup` ให้แก้ `DATABASE_URL` และ `JWT_SECRET` ใน `eqs-api/.env`

Backend: <http://localhost:3000>

### บัญชีทดลอง

```text
Admin: admin1@example.com / 12345678
Student: student1@example.com / 12345678
```

## Frontend

เปิด Terminal ใหม่:

```cmd
cd eqs-web
npm i
copy .env.example .env.local
npm run dev
```

Frontend: <http://localhost:3001>

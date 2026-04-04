# Setup Guide - Phase 1

## Prerequisites

- Node.js `>=20`
- npm `>=10`
- PostgreSQL `>=14`

## 1) Environment Setup

```bash
cp apps/api/.env.example apps/api/.env
```

Update `apps/api/.env` values:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## 2) Install Dependencies

```bash
npm install
```

## 3) Run Database Migration

```bash
npm run db:migrate --workspace @vedas/api
```

## 4) Seed Super Admin (Optional)

```bash
npm run db:seed-super-admin --workspace @vedas/api
```

## 5) Start Backend Server

```bash
npm run dev --workspace @vedas/api
```

Expected local URL:
- `http://localhost:4000`

## 6) Start Admin Frontend

```bash
npm run dev --workspace web-admin
```

Expected local URL:
- `http://localhost:3000`

## 6) Test Health Endpoint

```bash
curl http://localhost:4000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-29T00:00:00.000Z"
}
```

# Deployment (Testing Environment)

## Goal
Run the backend + admin frontend in a cloud testing environment for demo purposes.

## Minimal Steps (Generic)

1. Provision a small PostgreSQL instance.
2. Create an app/service for the API.
3. Set environment variables from `apps/api/.env.example`.
4. Run migrations.
5. Start the API service.
6. Deploy the admin frontend and point it to the API base URL.

## Recommended Environment Variables

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PORT`
- `CORS_ORIGIN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `APP_BASE_URL`

## Post-Deploy Sanity Check

- `GET /api/v1/health`
- `GET /api/v1/plans`
- `POST /api/v1/auth/register-institute`
- `POST /api/v1/auth/login`
- `GET /api/v1/dashboard/summary`

## Docker (Local)

Use `docker-compose.yml` from the repo root:

```bash
docker compose up --build
```

Services:
- API: `http://localhost:4000`
- Admin Web: `http://localhost:3000`
- Postgres: `localhost:5432`

## Frontend Environment

Create `apps/web-admin/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

## Production (Free Tier)

### 1) Database: Neon.tech
1. Create a Neon project.
2. Copy the connection string.
3. Use it as `DATABASE_URL` on Render.

### 2) Backend: Render (Node.js)
1. Create a new Web Service.
2. Connect your GitHub repo.
3. Set build command:
   - `npm install && npm run build --workspace @vedas/api`
4. Set start command:
   - `npm run start --workspace @vedas/api`
5. Add environment variables:
   - `DATABASE_URL` (Neon)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `ACCESS_TOKEN_TTL_MIN`
   - `REFRESH_TOKEN_TTL_DAYS`
   - `CORS_ORIGIN` (Vercel domain)
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `APP_BASE_URL` (Vercel domain)

### 3) Frontend: Vercel (Next.js)
1. Import the repo into Vercel.
2. Set the project root to `apps/web-admin`.
3. Add environment variables:
   - `NEXT_PUBLIC_API_BASE_URL` (Render API URL + `/api/v1`)
4. Deploy.

### 4) End-to-End Checks
- `POST /api/v1/auth/login`
- `GET /api/v1/dashboard/summary`
- Login to admin UI and verify dashboard cards.

## Phase 2 Enhancements

- Real email provider (SendGrid/SES)
- HTTPS + custom domain
- CDN for static assets

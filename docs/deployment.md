# Deployment (Testing Environment)

## Goal
Run a minimal backend in a cloud testing environment for demo purposes.

## Minimal Steps (Generic)

1. Provision a small PostgreSQL instance.
2. Create an app/service for the API.
3. Set environment variables from `apps/api/.env.example`.
4. Run migrations.
5. Start the API service.

## Recommended Environment Variables

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PORT`
- `CORS_ORIGIN`

## Post-Deploy Sanity Check

- `GET /api/v1/health`
- `GET /api/v1/plans`
- `POST /api/v1/auth/register-institute`

## Phase 2 Enhancements

- Real email provider (SendGrid/SES)
- HTTPS + custom domain
- CDN for static assets

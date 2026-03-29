# VEDAS - Coaching Institute SaaS

Phase 1 foundation for a multi-tenant SaaS platform where each coaching institute gets isolated data, role-based access, and secure JWT authentication.

## Monorepo Structure

- `apps/api`: Express + TypeScript backend (implemented in Phase 1)
- `apps/web`: Next.js frontend placeholder (Phase 2)
- `packages/common`: Shared types/utilities
- `docs`: Architecture, API, and setup documentation

## Tech Stack (Phase 1 Finalized)

- Frontend (next phase): `Next.js + React + TypeScript`
- Backend: `Node.js + Express + TypeScript`
- Database: `PostgreSQL`
- Auth: `JWT access + refresh tokens`
- Security baseline: `helmet`, `cors`, `rate-limit`, `bcrypt`
- Deployment target: `AWS`

## Quick Start

1. Copy environment file.
2. Start PostgreSQL locally.
3. Install dependencies.
4. Run migration.
5. Seed super admin (optional but recommended).
6. Start API server.

```bash
cp apps/api/.env.example apps/api/.env
npm install
npm run db:migrate --workspace @vedas/api
npm run db:seed-super-admin --workspace @vedas/api
npm run dev --workspace @vedas/api
```

## Core Implemented Features (Phase 1)

- Multi-tenant foundation using shared tables + `tenant_id` isolation
- Institute registration (`tenant` + `institute_admin` user bootstrap)
- Institute profile/KYC update + subdomain/custom domain storage
- Subscription plan listing
- JWT login, refresh, logout
- Email verification token flow (dev-mode token return)
- Password reset (token-based)
- RBAC roles:
  - `super_admin`
  - `institute_admin`
  - `teacher`
  - `student`
  - `staff`
- Tenant-protected endpoints
- Basic admin dashboard summary counts
- Student & teacher portal dashboards (basic)
- Email notification system (stub)
- Course & batch management (Phase 1.6)
- Security baseline and validation

## Documentation

- `docs/architecture.md`
- `docs/api-spec.md`
- `docs/setup-guide.md`

## External Resources You Need To Provide

- AWS account (Phase 2+ deployment)
- Domain name for institute websites/subdomains
- SMTP/SMS provider for notifications (Phase 2)
- Payment gateway credentials (Phase 2)

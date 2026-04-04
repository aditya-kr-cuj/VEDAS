# Testing - Phase 1

## Unit Tests (Critical Modules)

Jest + Supertest tests added:
- Auth service (register/login/refresh)
- User routes (list + role change)
- Batch-teacher assignment route

Files:
- `apps/api/src/__tests__/auth.service.jest.test.ts`
- `apps/api/src/__tests__/user.routes.jest.test.ts`
- `apps/api/src/__tests__/batch-teacher.routes.jest.test.ts`

Run tests:

```bash
npm run test --workspace @vedas/api
npm run test:jest --workspace @vedas/api
```

## Future Test Targets (Phase 2)

- Auth flow (register/login/refresh)
- Tenant isolation (cross-tenant access blocked)
- Course & batch assignment rules
- Notification delivery status

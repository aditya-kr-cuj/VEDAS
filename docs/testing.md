# Testing - Phase 1

## Unit Tests (Critical Modules)

Covered in `apps/api/src/__tests__/utils.test.ts`:
- CSV parsing utility
- Date helpers used for token expiry

Run tests:

```bash
npm run test --workspace @vedas/api
```

## Future Test Targets (Phase 2)

- Auth flow (register/login/refresh)
- Tenant isolation (cross-tenant access blocked)
- Course & batch assignment rules
- Notification delivery status

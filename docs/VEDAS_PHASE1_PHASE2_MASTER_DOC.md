# VEDAS - Complete Development Documentation (Day 1 to Current Stage)

Document Version: 1.0  
Generated On: 2026-04-20  
Project: VEDAS  
Prepared By: Architecture/Engineering Reconstruction (from codebase + commit history)

---

## 1. Executive Summary

VEDAS is a multi-tenant coaching-institute SaaS platform with institute onboarding, RBAC, academic operations, assessment, communication, and financial management.

Current architecture status:
- Backend: production-style modular Express + TypeScript API
- Frontend: Next.js admin + portal app
- Database: PostgreSQL with migration-led schema evolution (`001` to `030` + compatibility migration `027b` pending commit)
- Integrations: S3, Resend, Razorpay, MSG91, WhatsApp Cloud API, FCM, Redis/Bull queues (configurable by env)

Important accuracy note:
- This document is reconstructed from repository state and Git history.
- Day-level records include explicit facts from commits and explicit assumptions where the repository does not preserve intermediate planning artifacts.

---

## 2. Day-Wise Development Plan (Day 1 -> Present)

### Timeline Basis
- Day 1 inferred from first meaningful commit date: **2026-03-29**.
- Present snapshot: **2026-04-20**.
- For dates without commits, progress is inferred from neighboring commits and migration/module sequence.

| Day | Date | Planned | Implemented | Why | Output/Result |
|---|---|---|---|---|---|
| 1 | 2026-03-29 | Monorepo and backend foundation | Workspace setup, Express app skeleton, env parsing, DB client, migrations `001-004`, auth/password/users/tenant/plan/core modules | Establish secure SaaS base | MVP backend foundation operational |
| 2 | 2026-03-30 | Stabilize integration branches | Merge sync from remote | Keep baseline aligned | Unified mainline branch |
| 3 | 2026-03-31 | Phase 1 hardening | (Assumed) Local validation and bug fixes | Prepare for Phase 1 sign-off | Internal stabilization |
| 4 | 2026-04-01 | Docs and deploy prep | (Assumed) setup/deployment/report documentation drafting | B.Tech documentation requirement | Draft docs ready |
| 5 | 2026-04-02 | QA and RBAC pass | (Assumed) Auth flows + tenant isolation checks | Reduce early regressions | Improved reliability |
| 6 | 2026-04-03 | Finalize Phase 1 UI direction | (Assumed) web-admin readiness planning | Move from API-only to full stack | UI architecture decided |
| 7 | 2026-04-04 | Phase 1 closure | Added `005_batch_teachers.sql`, staff/student/teacher module expansion, Docker/Jest setup, web-admin code moved into repo, dashboards/profile/auth pages | Complete Phase 1 scope and make demo-ready | Phase 1 Final commit achieved |
| 8 | 2026-04-05 | Phase 2.1 design | (Assumed) timetable data model + route contracts | Start feature expansion | Implementation plan for scheduling |
| 9 | 2026-04-06 | Phase 2.1/2.2 prep | (Assumed) API/frontend integration planning | Reduce integration churn | Ready for bulk feature delivery |
| 10 | 2026-04-07 | Timetable + attendance + fees core | Added migrations `006-009`, timetable/rooms/time-slots/autogen, attendance + QR, fee structures/payments/reports/reminders, admin UI pages for timetable/attendance/fees | Build core institutional operations | Steps 2.1, 2.2, 2.3 largely implemented |
| 11 | 2026-04-07 | Study materials | Added migrations `010-012`, material upload/search/tags/categories/versioning/access/analytics, S3 utility, admin+student material UIs | Content management for teaching | Step 2.4 implemented |
| 12 | 2026-04-07 | Exam module base | Added `013_question_bank.sql`, question CRUD + UI | Start digital assessment | Step 2.5 foundation complete |
| 13 | 2026-04-07 | Test creation/execution | Added `014_tests.sql`, test CRUD/publish/archive + UI | End-to-end exam lifecycle | Test authoring operational |
| 14 | 2026-04-07 | Student test-taking | Added `015_test_attempts.sql`, attempt/start/save/submit/review/result flow | Student exam experience | Student test workflow live |
| 15 | 2026-04-07 | Grading improvements | Added `016_fill_blank_acceptables.sql`, auto + manual grading interfaces | Improve grading quality and flexibility | Evaluation workflow improved |
| 16 | 2026-04-07 | Analytics & leaderboard | Added `017_test_analytics_archive.sql`, analytics/leaderboard/submissions | Insight + ranking requirements | Advanced test analytics live |
| 17 | 2026-04-07 | Performance system | Added `018_performance_summary.sql`, performance APIs + summary script | Progress tracking | Step 2.6 foundation delivered |
| 18 | 2026-04-07 | Trend & comparisons | Performance trends/test comparison/batch comparison + student perf UI | Higher-order analytics | Step 2.6 expanded |
| 19 | 2026-04-08 | Reports/report cards | Added `019_reports.sql`, PDF report routes + reports page | Formal reporting deliverables | Progress report generation live |
| 20 | 2026-04-08 | Teacher performance | Added teacher performance repository/APIs/UIs | Academic quality KPIs | Teacher performance dashboards added |
| 21 | 2026-04-08 | Communication module | Added `020-024` migrations: announcements, email, SMS, WhatsApp, push + calendar APIs and pages | Multi-channel communication | Step 2.7 implemented |
| 22 | 2026-04-09 to 2026-04-18 | Financial module development window | (Inferred) Financial tracking implementation from migrations `025-030` and finance/budget code | Complete Phase 2 finance | Step 2.8 implementation completed in code |
| 23 | 2026-04-19 | Phase 2 completion checkpoint | `complete_phase_2` commit | Milestone closure | Phase 2 tagged complete |
| 24 | 2026-04-20 | Post-audit critical fixes | Applied missing DB migration path to include `030_tax_and_tally.sql`; created compatibility migration `027b_budget_schema_compat.sql`; DB verification executed | Resolve blocking schema inconsistency | Tax/GST/Tally schema now migrates successfully |

---

## 3. Project Architecture

### 3.1 High-Level System Design

Logical layers:
1. Experience Layer
- `apps/web-admin` Next.js app serves admin + student + teacher portals.

2. API Layer
- `apps/api` Express app with modular route mounting and middleware pipeline.

3. Domain/Service Layer
- Module-specific controllers/services coordinate validation, auth checks, and repository calls.

4. Data Layer
- PostgreSQL with migration-managed schema.
- Repository pattern per module for SQL encapsulation.

5. Integration Layer
- S3 for study materials.
- Redis + Bull for async notifications.
- Resend/MSG91/WhatsApp/FCM/Razorpay integrations via utilities/controllers.

### 3.2 Data Flow (End-to-End)

1. User authenticates (`/api/v1/auth/login`) and receives JWT token pair.
2. Frontend stores token and sends Bearer token with API calls.
3. Express middleware validates token, role, and tenant context.
4. Controller validates payload (`zod`) and delegates to repository/service.
5. Repository executes tenant-scoped SQL (`tenant_id` in filter path).
6. Response is returned to frontend and rendered on role-specific page.
7. For async comms, API enqueues jobs and worker scripts process channels.

### 3.3 Frontend/Backend/ML Interaction

Current verified state:
- Frontend and backend are fully integrated via REST.
- ML runtime pipeline is **not yet implemented** in repository.

AI-ready architecture assumption (for your stated AI/ML direction):
- Add `apps/ml-service` (FastAPI or Python worker).
- Sync feature views from PostgreSQL/warehouse.
- Serve predictions to backend via internal API.
- Persist prediction logs and drift metrics for retraining.

### 3.4 Text Diagram Explanation

```text
[Web Admin / Student Portal / Teacher Portal]
                |
                v
      [Express API Gateway - /api/v1]
                |
   +------------+------------------------------+
   |            |                              |
[Auth/RBAC] [Business Modules]          [Integration Adapters]
   |            |                              |
   |            +------> [PostgreSQL] <--------+
   |                                           |
   +-----------------> [Redis/Bull Workers] --> [Email/SMS/WA/Push]
                               |
                               +--> [S3 Storage] (materials)
                               +--> [Razorpay] (payments)
```

---

## 4. Complete Directory Structure

> Tree shows project-owned source/config/doc files. Generated/vendor folders (`node_modules`, `.next`, `dist`) excluded.

```text
VEDAS/
├── .gitignore
├── README.md
├── docker-compose.yml
├── package.json
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── eslint.config.cjs
│   │   ├── jest.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── app.ts
│   │       ├── index.ts
│   │       ├── config/
│   │       ├── db/
│   │       │   ├── client.ts
│   │       │   ├── migrations/*.sql
│   │       │   └── seed-super-admin.ts
│   │       ├── middleware/
│   │       ├── modules/
│   │       ├── scripts/
│   │       ├── types/
│   │       └── utils/
│   ├── web-admin/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── components.json
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (admin)/**
│   │   │   │   ├── (portal)/**
│   │   │   │   ├── login/**
│   │   │   │   └── reset-password/**
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── public/
│   └── web/
│       ├── README.md
│       └── landing.html
├── docs/
│   ├── architecture.md
│   ├── api-spec.md
│   ├── setup-guide.md
│   ├── deployment.md
│   ├── testing.md
│   ├── report*.md
│   ├── presentation*.md
│   └── VEDAS_PHASE1_PHASE2_MASTER_DOC.md
└── packages/
    └── common/
        ├── package.json
        └── src/index.ts
```

---

## 5. Technology Stack

### 5.1 Programming Languages
- TypeScript (backend + frontend)
- SQL (PostgreSQL migrations)
- JavaScript (migration runner)
- HTML/CSS (landing + UI styling)

### 5.2 Frameworks and Runtime
- Node.js 20+
- Express 4.x
- Next.js 16.x + React 19
- Tailwind CSS 4

### 5.3 Backend/Infra Libraries
- `pg`, `zod`, `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `express-rate-limit`
- `pdfkit` (receipts/reports), `xlsx` (Excel export), `archiver`
- `bull` + Redis (queue)
- `@aws-sdk/*` (S3), `resend`, `razorpay`

### 5.4 Testing/Tooling
- Node test runner + Jest + Supertest
- ESLint + TypeScript compiler
- Docker + docker-compose
- Git workspaces monorepo

---

## 6. Backend Details

### 6.1 API Namespace
- Base URL: `/api/v1`

### 6.2 Module and Endpoint Inventory

Core and foundation:
- Health: `GET /health`
- Plans: `GET /plans`
- Auth: register/login/refresh/logout/me + teacher/student/staff + bulk student creation
- Password reset: request/confirm
- Tenant: get/update own tenant
- Users: list/update/status/role/delete
- Dashboard: summary
- Portals: student dashboard, teacher dashboard

Academic operations:
- Courses: CRUD + assign teacher
- Batches: CRUD + assign/list students + assign/list/remove teachers
- Timetable: time slots CRUD, rooms CRUD, entries CRUD, auto-generate/apply
- Attendance: mark/list/update + QR generate/scan

Fees and payments:
- Fee structures, assignment, payments, due/overdue, reports, student statement, receipt PDF
- Razorpay payment link + webhook

Study materials:
- upload/bulk upload/search/filter/tags/categories/download tracking/versioning/bookmarks/access rules/analytics

Assessment and performance:
- Question bank CRUD + bulk import
- Tests CRUD/publish/archive/analytics/leaderboard/submissions
- Student test lifecycle: list/start/save/submit/result
- Performance APIs: overview/trend/subject/batch comparison/test comparison/teacher performance
- Reports: generate PDF and bulk report generation

Communication:
- Announcements CRUD/read
- Notifications send/list + email/sms/whatsapp logs and template operations
- Push register/unregister/send
- Calendar events CRUD
- Public notice board endpoint

Financial tracking:
- Expense categories CRUD + expense CRUD + summary
- Other income CRUD
- Profit & loss, balance sheet
- Monthly/yearly financial reports
- Budget APIs (set/list by year/years/delete)
- Tax settings upsert/get
- GST report
- Tally export (XML/Excel format switch)

### 6.3 Typical Request/Response Contracts

Pattern:
- Request: JWT Bearer + JSON body/query
- Response: JSON object with domain payload (`{ data }` or named object like `{ income }`, `{ teachers }`)
- Errors: centralized error handler returns status + message

Examples:
- `POST /api/v1/budgets`: `{ budget_year, category_budgets[] }`
- `GET /api/v1/budgets/:year`: budget vs spent per category
- `GET /api/v1/financial/gst-report?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/v1/financial/export/tally?from=...&to=...&format=xml|excel`

### 6.4 Security Design
- JWT access/refresh strategy
- Refresh token storage and revocation
- Password hashing (bcrypt)
- Role checks via `authorize([...])`
- Tenant isolation with `requireTenant`
- Request validation via zod schemas
- Helmet + CORS + login rate limit

---

## 7. Frontend Details

### 7.1 App Areas

Admin area (`/(admin)`):
- Dashboard, students, teachers, staff, courses, batches
- Timetable and attendance screens
- Fees payment/reports
- Materials management + analytics
- Question bank and full tests management
- Performance, announcements, reports
- Communication settings and logs
- Financial pages: expenses/income/P&L/balance-sheet/budget/GST/export/settings

Portal area (`/(portal)`):
- Student dashboard + materials + announcements + QR attendance + tests + performance
- Teacher dashboard + performance
- Notification settings

Auth area:
- Login
- Password reset request/confirm

### 7.2 UI Composition
- Shared shell: admin and portal layouts
- Shared components: sidebar, topbar, material-card, availability-grid
- UI primitives: button/card/dialog/input/label/table
- API client abstraction: `src/lib/api.ts`

### 7.3 Frontend-to-Backend Integration
- `NEXT_PUBLIC_API_BASE_URL` points to `/api/v1`
- Pages call API helpers with auth token context
- Role-based navigation aligned with backend RBAC

---

## 8. Machine Learning Pipeline (Current + Designed Extension)

### 8.1 Current Repository State (Verified)
- No dedicated ML training/inference service committed yet.
- Analytics currently SQL/statistics-driven in backend repositories.

### 8.2 AI/ML Pipeline Blueprint for Phase 3 (Assumed, recommended)

1. Data Collection
- Sources: attendance, fees, tests, performance, engagement, communication logs.
- Ingestion: periodic ETL from PostgreSQL to feature store tables.

2. Preprocessing
- Null handling, encoding categorical fields, date/time windowing.
- Tenant-aware partitions to prevent cross-tenant leakage.

3. Feature Engineering
- Attendance streaks, fee delinquency ratio, test velocity, content engagement rate.

4. Model Training
- Baselines: XGBoost/LightGBM for risk prediction; collaborative/content hybrid for recommendations.

5. Evaluation
- Metrics: AUC/F1 for risk classifiers; MAP@K/NDCG for recommendations.
- Slice by tenant, course, and grade level.

6. Deployment
- Serve model via internal `ml-service` endpoint.
- Backend caches prediction outputs and stores prediction audit rows.

7. Monitoring
- Drift checks, periodic retraining jobs, prediction confidence thresholds.

---

## 9. Phase-Wise Breakdown

### 9.1 Phase 1 (Foundation & B.Tech Core)
Delivered:
- Multi-tenant architecture with `tenant_id` isolation
- JWT auth + RBAC + password reset + email verification
- Institute onboarding and tenant profile handling
- Core user management for admin/students/teachers/staff
- Basic student/teacher portals and admin dashboard
- Courses and batches with assignments
- Foundational tests and documentation/deployment scaffolding

### 9.2 Phase 2 (Feature Expansion)
Delivered additions:
- Timetable management with room and slot handling + generation
- Attendance tracking with QR flow and reports
- Fee & payment management with receipts, due tracking, Razorpay support
- Study materials with storage, search, analytics, access controls, versioning
- Online exams from question bank to grading, analytics, leaderboard
- Performance tracking, trends, comparisons, report cards
- Communication stack: announcements + email/SMS/WhatsApp/push + calendar
- Financial tracking: expenses, incomes, P&L, balance sheet, budget planning, GST, Tally export

---

## 10. Challenges and Solutions

1. Schema drift in budgets during finance rollout
- Problem: Existing `budgets` table shape differed from later migrations expecting `budget_year`/`allocated_amount`.
- Solution: Added compatibility migration `027b_budget_schema_compat.sql` and then applied `028-030`.

2. Multi-tenant safety across many modules
- Problem: High risk of accidental cross-tenant data exposure.
- Solution: Standardized `requireTenant` + repository tenant filters.

3. Rapid Phase 2 feature expansion
- Problem: Cross-module complexity increased quickly.
- Solution: Consistent module structure (`routes/controller/repository/schema`) and migration-per-feature pattern.

4. Multi-channel notifications reliability
- Problem: Sync sends can block user flows.
- Solution: Queue + worker scripts for email/SMS/WhatsApp channels.

5. Financial compliance feature breadth
- Problem: Budget, tax, GST, exports needed in same phase.
- Solution: Dedicated finance/budget modules plus explicit migration series `025-030`.

---

## 11. Current Status (as of 2026-04-20)

### 11.1 Completed and Working
- Migration chain through `030_tax_and_tally.sql` is now runnable (after compatibility migration fix).
- Financial tax settings table and GST columns verified present.
- Most Phase 1 and Phase 2 modules are implemented end-to-end in code.

### 11.2 Known Critical/Important Gaps
- Critical runtime issue: `apps/api/src/modules/performance/performance.controller.ts` uses `findTeacherProfileByUserId` without import.
- Fee payment UX gap remains in admin page due missing/limited student-fee listing API behavior.
- Full smoke test coverage for all Phase 2 flows is incomplete.
- Environment setup docs for third-party services require formalized deployment checklist (recommended as mandatory handover doc).

### 11.3 Operational Readiness View
- Architecture and feature breadth: strong.
- Stability and release hygiene: needs final hardening pass.
- Realistic readiness before Phase 3: high but not 100% until remaining blockers are fixed.

---

## 12. Future Scope (Phase 3)

### 12.1 Scalability and Platform Engineering
- Query optimization and index audit for heavy report endpoints.
- Read replicas and partitioning strategy for large tenants.
- Queue observability dashboards and DLQ handling.
- Full CI/CD with migration checks and rollback playbooks.

### 12.2 Product Features
- E-invoice generation and compliance trails
- TDS calculations and advanced accounting integrations
- Parent portal extensions and engagement workflows
- Richer analytics dashboards with cohort views

### 12.3 AI/ML Roadmap
- At-risk student prediction (drop-off, low performance, fee default)
- Smart timetable optimization recommender
- Adaptive learning content recommendation engine
- Notification send-time optimization

---

## 13. Rebuild-From-Scratch Checklist

1. Clone repo and install workspace deps.
2. Configure env files for API and web-admin.
3. Bring up PostgreSQL (and Redis when needed).
4. Run all migrations in order.
5. Seed super admin.
6. Start API and web-admin services.
7. Validate auth, tenant isolation, and key module flows.
8. Configure third-party integrations one by one.
9. Run tests and smoke checks.
10. Execute pre-production checklist (security, backups, observability, rollback).

---

## 14. Full File-by-File Explanation Appendix

# VEDAS Master Development Documentation (Phase 1 + Phase 2)

> Generated on 2026-04-20 from repository state. This document mixes **verified implementation details** and **clearly marked assumptions** where historical granularity is unavailable.

## File-by-File Catalog

Each entry includes: `file`, `purpose`, and `integration links`.

### root

- `.gitignore`
  - Purpose: VCS ignore patterns.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `README.md`
  - Purpose: Human-readable setup and usage documentation.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docker-compose.yml`
  - Purpose: Local multi-service orchestration (API, DB, cache).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `package.json`
  - Purpose: Project metadata, scripts, and dependencies.
  - Integration: Referenced by workspace scripts/build or imported by related modules.

### apiCore

- `apps/api/Dockerfile`
  - Purpose: Container build definition for deployment/runtime.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/eslint.config.cjs`
  - Purpose: Linting configuration and static code quality rules.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/jest.config.ts`
  - Purpose: Project source/configuration file.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/package.json`
  - Purpose: Project metadata, scripts, and dependencies.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/app.ts`
  - Purpose: Express app assembly, middleware, and route mounts.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/config/env.ts`
  - Purpose: Runtime environment parsing/validation.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/db/client.ts`
  - Purpose: PostgreSQL connection pool/client wrapper.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/db/seed-super-admin.ts`
  - Purpose: Seed script to bootstrap platform super admin user.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/index.ts`
  - Purpose: API bootstrap entrypoint (HTTP server start).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/middleware/async-handler.ts`
  - Purpose: Cross-cutting middleware for auth, validation, error handling.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/middleware/auth.ts`
  - Purpose: Cross-cutting middleware for auth, validation, error handling.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/middleware/error-handler.ts`
  - Purpose: Cross-cutting middleware for auth, validation, error handling.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/middleware/validate.ts`
  - Purpose: Cross-cutting middleware for auth, validation, error handling.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/tsconfig.json`
  - Purpose: TypeScript compiler configuration.
  - Integration: Referenced by workspace scripts/build or imported by related modules.

### apiMigrations

- `apps/api/src/db/migrations/001_init.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/002_onboarding_and_users.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/003_portals_and_notifications.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/004_courses_batches.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/005_batch_teachers.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/006_timetable.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/007_attendance.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/008_attendance_qr.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/009_fees.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/010_study_materials.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/011_material_search.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/012_materials_extras.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/013_question_bank.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/014_tests.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/015_test_attempts.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/016_fill_blank_acceptables.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/017_test_analytics_archive.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/018_performance_summary.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/019_reports.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/020_announcements.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/021_email_notifications.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/022_sms_notifications.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/023_whatsapp_notifications.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/024_push_and_calendar.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/025_financial_tracking.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/026_expense_schema_fix.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/027_other_income.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/028_budgets.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/029_budget_spent_amount.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/030_tax_and_tally.sql`
  - Purpose: Incremental database schema migration applied in order.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.
- `apps/api/src/db/migrations/run-migrations.js`
  - Purpose: Migration runner that applies pending SQL files and tracks history.
  - Integration: Executed by apps/api/src/db/migrations/run-migrations.js; consumed by runtime repositories.

### apiTests

- `apps/api/src/__tests__/auth.service.jest.test.ts`
  - Purpose: Automated tests for module behavior and regressions.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/__tests__/batch-teacher.routes.jest.test.ts`
  - Purpose: Automated tests for module behavior and regressions.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/__tests__/user.routes.jest.test.ts`
  - Purpose: Automated tests for module behavior and regressions.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/__tests__/utils.test.ts`
  - Purpose: Automated tests for module behavior and regressions.
  - Integration: Referenced by workspace scripts/build or imported by related modules.

### apiScripts

- `apps/api/src/scripts/attendance-alerts.ts`
  - Purpose: Operational cron/worker script for scheduled or async tasks.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/scripts/email-worker.ts`
  - Purpose: Operational cron/worker script for scheduled or async tasks.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/scripts/fee-reminders.ts`
  - Purpose: Operational cron/worker script for scheduled or async tasks.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/scripts/performance-summary.ts`
  - Purpose: Operational cron/worker script for scheduled or async tasks.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/scripts/sms-worker.ts`
  - Purpose: Operational cron/worker script for scheduled or async tasks.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/scripts/whatsapp-worker.ts`
  - Purpose: Operational cron/worker script for scheduled or async tasks.
  - Integration: Referenced by workspace scripts/build or imported by related modules.

### apiTypesUtils

- `apps/api/src/types/auth.ts`
  - Purpose: Type declarations shared across backend layers.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/types/express.d.ts`
  - Purpose: Type declarations shared across backend layers.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/crypto.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/csv.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/date.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/email-templates.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/email.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/http-error.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/push.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/sms.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/storage.ts`
  - Purpose: Utility helper (crypto/date/email/storage/integration).
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/api/src/utils/whatsapp.ts`
  - Purpose: Express app assembly, middleware, and route mounts.
  - Integration: Referenced by workspace scripts/build or imported by related modules.

### apiModules

- `apps/api/src/modules/announcements/announcement.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/announcements/announcement.routes.ts, apps/api/src/modules/announcements/announcement.repository.ts, apps/api/src/modules/announcements/announcement.schema.ts
- `apps/api/src/modules/announcements/announcement.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/announcements/announcement.routes.ts, apps/api/src/modules/announcements/announcement.controller.ts, apps/api/src/modules/announcements/announcement.schema.ts
- `apps/api/src/modules/announcements/announcement.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/announcements/announcement.controller.ts, apps/api/src/modules/announcements/announcement.repository.ts, apps/api/src/modules/announcements/announcement.schema.ts
- `apps/api/src/modules/announcements/announcement.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/announcements/announcement.routes.ts, apps/api/src/modules/announcements/announcement.controller.ts, apps/api/src/modules/announcements/announcement.repository.ts
- `apps/api/src/modules/attendance/attendance.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/attendance/attendance.routes.ts, apps/api/src/modules/attendance/attendance.repository.ts, apps/api/src/modules/attendance/attendance.schema.ts
- `apps/api/src/modules/attendance/attendance.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/attendance/attendance.routes.ts, apps/api/src/modules/attendance/attendance.controller.ts, apps/api/src/modules/attendance/attendance.schema.ts
- `apps/api/src/modules/attendance/attendance.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/attendance/attendance.controller.ts, apps/api/src/modules/attendance/attendance.repository.ts, apps/api/src/modules/attendance/attendance.schema.ts
- `apps/api/src/modules/attendance/attendance.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/attendance/attendance.routes.ts, apps/api/src/modules/attendance/attendance.controller.ts, apps/api/src/modules/attendance/attendance.repository.ts
- `apps/api/src/modules/attendance/qr.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/attendance/qr.repository.ts, apps/api/src/modules/attendance/qr.schema.ts
- `apps/api/src/modules/attendance/qr.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/attendance/qr.controller.ts, apps/api/src/modules/attendance/qr.schema.ts
- `apps/api/src/modules/attendance/qr.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/attendance/qr.controller.ts, apps/api/src/modules/attendance/qr.repository.ts
- `apps/api/src/modules/auth/auth.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/auth/auth.routes.ts, apps/api/src/modules/auth/auth.schema.ts, apps/api/src/modules/auth/auth.service.ts
- `apps/api/src/modules/auth/auth.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/auth/auth.controller.ts, apps/api/src/modules/auth/auth.schema.ts, apps/api/src/modules/auth/auth.service.ts
- `apps/api/src/modules/auth/auth.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/auth/auth.routes.ts, apps/api/src/modules/auth/auth.controller.ts, apps/api/src/modules/auth/auth.service.ts
- `apps/api/src/modules/auth/auth.service.ts`
  - Purpose: Business/service logic shared across controllers.
  - Integration: apps/api/src/modules/auth/auth.routes.ts, apps/api/src/modules/auth/auth.controller.ts, apps/api/src/modules/auth/auth.schema.ts
- `apps/api/src/modules/auth/email-verification.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/auth/refresh-token.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/auth/token.service.ts`
  - Purpose: Business/service logic shared across controllers.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/batches/batch-teacher.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/batches/batch-teacher.repository.ts, apps/api/src/modules/batches/batch-teacher.schema.ts, apps/api/src/modules/batches/batch-teacher.service.ts
- `apps/api/src/modules/batches/batch-teacher.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/batches/batch-teacher.controller.ts, apps/api/src/modules/batches/batch-teacher.schema.ts, apps/api/src/modules/batches/batch-teacher.service.ts
- `apps/api/src/modules/batches/batch-teacher.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/batches/batch-teacher.controller.ts, apps/api/src/modules/batches/batch-teacher.repository.ts, apps/api/src/modules/batches/batch-teacher.service.ts
- `apps/api/src/modules/batches/batch-teacher.service.ts`
  - Purpose: Business/service logic shared across controllers.
  - Integration: apps/api/src/modules/batches/batch-teacher.controller.ts, apps/api/src/modules/batches/batch-teacher.repository.ts, apps/api/src/modules/batches/batch-teacher.schema.ts
- `apps/api/src/modules/batches/batch.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/batches/batch.routes.ts, apps/api/src/modules/batches/batch.repository.ts, apps/api/src/modules/batches/batch.schema.ts
- `apps/api/src/modules/batches/batch.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/batches/batch.routes.ts, apps/api/src/modules/batches/batch.controller.ts, apps/api/src/modules/batches/batch.schema.ts
- `apps/api/src/modules/batches/batch.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/batches/batch.controller.ts, apps/api/src/modules/batches/batch.repository.ts, apps/api/src/modules/batches/batch.schema.ts
- `apps/api/src/modules/batches/batch.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/batches/batch.routes.ts, apps/api/src/modules/batches/batch.controller.ts, apps/api/src/modules/batches/batch.repository.ts
- `apps/api/src/modules/budget/budget.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/budget/budget.routes.ts, apps/api/src/modules/budget/budget.repository.ts, apps/api/src/modules/budget/budget.schema.ts
- `apps/api/src/modules/budget/budget.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/budget/budget.routes.ts, apps/api/src/modules/budget/budget.controller.ts, apps/api/src/modules/budget/budget.schema.ts
- `apps/api/src/modules/budget/budget.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/budget/budget.controller.ts, apps/api/src/modules/budget/budget.repository.ts, apps/api/src/modules/budget/budget.schema.ts
- `apps/api/src/modules/budget/budget.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/budget/budget.routes.ts, apps/api/src/modules/budget/budget.controller.ts, apps/api/src/modules/budget/budget.repository.ts
- `apps/api/src/modules/calendar/calendar.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/calendar/calendar.routes.ts, apps/api/src/modules/calendar/calendar.repository.ts, apps/api/src/modules/calendar/calendar.schema.ts
- `apps/api/src/modules/calendar/calendar.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/calendar/calendar.routes.ts, apps/api/src/modules/calendar/calendar.controller.ts, apps/api/src/modules/calendar/calendar.schema.ts
- `apps/api/src/modules/calendar/calendar.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/calendar/calendar.controller.ts, apps/api/src/modules/calendar/calendar.repository.ts, apps/api/src/modules/calendar/calendar.schema.ts
- `apps/api/src/modules/calendar/calendar.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/calendar/calendar.routes.ts, apps/api/src/modules/calendar/calendar.controller.ts, apps/api/src/modules/calendar/calendar.repository.ts
- `apps/api/src/modules/courses/course.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/courses/course.routes.ts, apps/api/src/modules/courses/course.repository.ts, apps/api/src/modules/courses/course.schema.ts
- `apps/api/src/modules/courses/course.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/courses/course.routes.ts, apps/api/src/modules/courses/course.controller.ts, apps/api/src/modules/courses/course.schema.ts
- `apps/api/src/modules/courses/course.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/courses/course.controller.ts, apps/api/src/modules/courses/course.repository.ts, apps/api/src/modules/courses/course.schema.ts
- `apps/api/src/modules/courses/course.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/courses/course.routes.ts, apps/api/src/modules/courses/course.controller.ts, apps/api/src/modules/courses/course.repository.ts
- `apps/api/src/modules/dashboard/dashboard.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/dashboard/dashboard.routes.ts, apps/api/src/modules/dashboard/dashboard.repository.ts
- `apps/api/src/modules/dashboard/dashboard.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/dashboard/dashboard.routes.ts, apps/api/src/modules/dashboard/dashboard.controller.ts
- `apps/api/src/modules/dashboard/dashboard.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/dashboard/dashboard.controller.ts, apps/api/src/modules/dashboard/dashboard.repository.ts
- `apps/api/src/modules/exams/question-bank.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/exams/question.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/exams/question.routes.ts, apps/api/src/modules/exams/question.schema.ts
- `apps/api/src/modules/exams/question.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/exams/question.controller.ts, apps/api/src/modules/exams/question.schema.ts
- `apps/api/src/modules/exams/question.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/exams/question.routes.ts, apps/api/src/modules/exams/question.controller.ts
- `apps/api/src/modules/expenses/expense.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/expenses/expense.routes.ts, apps/api/src/modules/expenses/expense.repository.ts, apps/api/src/modules/expenses/expense.schema.ts
- `apps/api/src/modules/expenses/expense.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/expenses/expense.routes.ts, apps/api/src/modules/expenses/expense.controller.ts, apps/api/src/modules/expenses/expense.schema.ts
- `apps/api/src/modules/expenses/expense.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/expenses/expense.controller.ts, apps/api/src/modules/expenses/expense.repository.ts, apps/api/src/modules/expenses/expense.schema.ts
- `apps/api/src/modules/expenses/expense.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/expenses/expense.routes.ts, apps/api/src/modules/expenses/expense.controller.ts, apps/api/src/modules/expenses/expense.repository.ts
- `apps/api/src/modules/fees/fee-report.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/fees/fee-report.repository.ts
- `apps/api/src/modules/fees/fee-report.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/fees/fee-report.controller.ts
- `apps/api/src/modules/fees/fee.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/fees/fee.routes.ts, apps/api/src/modules/fees/fee.repository.ts, apps/api/src/modules/fees/fee.schema.ts
- `apps/api/src/modules/fees/fee.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/fees/fee.routes.ts, apps/api/src/modules/fees/fee.controller.ts, apps/api/src/modules/fees/fee.schema.ts
- `apps/api/src/modules/fees/fee.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/fees/fee.controller.ts, apps/api/src/modules/fees/fee.repository.ts, apps/api/src/modules/fees/fee.schema.ts
- `apps/api/src/modules/fees/fee.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/fees/fee.routes.ts, apps/api/src/modules/fees/fee.controller.ts, apps/api/src/modules/fees/fee.repository.ts
- `apps/api/src/modules/fees/payment.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/fees/payment.repository.ts
- `apps/api/src/modules/fees/payment.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/fees/payment.controller.ts
- `apps/api/src/modules/fees/razorpay.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/fees/razorpay.service.ts
- `apps/api/src/modules/fees/razorpay.service.ts`
  - Purpose: Business/service logic shared across controllers.
  - Integration: apps/api/src/modules/fees/razorpay.controller.ts
- `apps/api/src/modules/finance/finance.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/finance/finance.routes.ts, apps/api/src/modules/finance/finance.repository.ts, apps/api/src/modules/finance/finance.schema.ts
- `apps/api/src/modules/finance/finance.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/finance/finance.routes.ts, apps/api/src/modules/finance/finance.controller.ts, apps/api/src/modules/finance/finance.schema.ts
- `apps/api/src/modules/finance/finance.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/finance/finance.controller.ts, apps/api/src/modules/finance/finance.repository.ts, apps/api/src/modules/finance/finance.schema.ts
- `apps/api/src/modules/finance/finance.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/finance/finance.routes.ts, apps/api/src/modules/finance/finance.controller.ts, apps/api/src/modules/finance/finance.repository.ts
- `apps/api/src/modules/finance/tax.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/health/health.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/materials/material.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/materials/material.routes.ts, apps/api/src/modules/materials/material.repository.ts, apps/api/src/modules/materials/material.schema.ts
- `apps/api/src/modules/materials/material.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/materials/material.routes.ts, apps/api/src/modules/materials/material.controller.ts, apps/api/src/modules/materials/material.schema.ts
- `apps/api/src/modules/materials/material.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/materials/material.controller.ts, apps/api/src/modules/materials/material.repository.ts, apps/api/src/modules/materials/material.schema.ts
- `apps/api/src/modules/materials/material.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/materials/material.routes.ts, apps/api/src/modules/materials/material.controller.ts, apps/api/src/modules/materials/material.repository.ts
- `apps/api/src/modules/notifications/email.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/notifications/email.repository.ts
- `apps/api/src/modules/notifications/email.queue.ts`
  - Purpose: Bull/queue producer and queue configuration.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/notifications/email.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/notifications/email.controller.ts
- `apps/api/src/modules/notifications/email.worker.ts`
  - Purpose: Background worker process consuming queue jobs.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/notifications/notification.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/notifications/notification.routes.ts, apps/api/src/modules/notifications/notification.repository.ts, apps/api/src/modules/notifications/notification.schema.ts, apps/api/src/modules/notifications/notification.service.ts
- `apps/api/src/modules/notifications/notification.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/notifications/notification.routes.ts, apps/api/src/modules/notifications/notification.controller.ts, apps/api/src/modules/notifications/notification.schema.ts, apps/api/src/modules/notifications/notification.service.ts
- `apps/api/src/modules/notifications/notification.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/notifications/notification.controller.ts, apps/api/src/modules/notifications/notification.repository.ts, apps/api/src/modules/notifications/notification.schema.ts, apps/api/src/modules/notifications/notification.service.ts
- `apps/api/src/modules/notifications/notification.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/notifications/notification.routes.ts, apps/api/src/modules/notifications/notification.controller.ts, apps/api/src/modules/notifications/notification.repository.ts, apps/api/src/modules/notifications/notification.service.ts
- `apps/api/src/modules/notifications/notification.service.ts`
  - Purpose: Business/service logic shared across controllers.
  - Integration: apps/api/src/modules/notifications/notification.routes.ts, apps/api/src/modules/notifications/notification.controller.ts, apps/api/src/modules/notifications/notification.repository.ts, apps/api/src/modules/notifications/notification.schema.ts
- `apps/api/src/modules/notifications/sms.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/notifications/sms.repository.ts
- `apps/api/src/modules/notifications/sms.queue.ts`
  - Purpose: Bull/queue producer and queue configuration.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/notifications/sms.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/notifications/sms.controller.ts
- `apps/api/src/modules/notifications/sms.worker.ts`
  - Purpose: Background worker process consuming queue jobs.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/notifications/whatsapp.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/notifications/whatsapp.repository.ts
- `apps/api/src/modules/notifications/whatsapp.queue.ts`
  - Purpose: Bull/queue producer and queue configuration.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/notifications/whatsapp.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/notifications/whatsapp.controller.ts
- `apps/api/src/modules/notifications/whatsapp.worker.ts`
  - Purpose: Background worker process consuming queue jobs.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/password/password.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/password/password.routes.ts, apps/api/src/modules/password/password.repository.ts, apps/api/src/modules/password/password.schema.ts, apps/api/src/modules/password/password.service.ts
- `apps/api/src/modules/password/password.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/password/password.routes.ts, apps/api/src/modules/password/password.controller.ts, apps/api/src/modules/password/password.schema.ts, apps/api/src/modules/password/password.service.ts
- `apps/api/src/modules/password/password.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/password/password.controller.ts, apps/api/src/modules/password/password.repository.ts, apps/api/src/modules/password/password.schema.ts, apps/api/src/modules/password/password.service.ts
- `apps/api/src/modules/password/password.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/password/password.routes.ts, apps/api/src/modules/password/password.controller.ts, apps/api/src/modules/password/password.repository.ts, apps/api/src/modules/password/password.service.ts
- `apps/api/src/modules/password/password.service.ts`
  - Purpose: Business/service logic shared across controllers.
  - Integration: apps/api/src/modules/password/password.routes.ts, apps/api/src/modules/password/password.controller.ts, apps/api/src/modules/password/password.repository.ts, apps/api/src/modules/password/password.schema.ts
- `apps/api/src/modules/performance/performance.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/performance/performance.routes.ts, apps/api/src/modules/performance/performance.repository.ts
- `apps/api/src/modules/performance/performance.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/performance/performance.routes.ts, apps/api/src/modules/performance/performance.controller.ts
- `apps/api/src/modules/performance/performance.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/performance/performance.controller.ts, apps/api/src/modules/performance/performance.repository.ts
- `apps/api/src/modules/performance/teacher-performance.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: Connected via module imports and route mounting in apps/api/src/app.ts.
- `apps/api/src/modules/plans/plan.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/plans/plan.routes.ts, apps/api/src/modules/plans/plan.repository.ts
- `apps/api/src/modules/plans/plan.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/plans/plan.routes.ts, apps/api/src/modules/plans/plan.controller.ts
- `apps/api/src/modules/plans/plan.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/plans/plan.controller.ts, apps/api/src/modules/plans/plan.repository.ts
- `apps/api/src/modules/portal/portal.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/portal/portal.routes.ts
- `apps/api/src/modules/portal/portal.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/portal/portal.controller.ts
- `apps/api/src/modules/public/notice-board.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/public/notice-board.routes.ts
- `apps/api/src/modules/public/notice-board.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/public/notice-board.controller.ts
- `apps/api/src/modules/push/push.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/push/push.routes.ts, apps/api/src/modules/push/push.repository.ts
- `apps/api/src/modules/push/push.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/push/push.routes.ts, apps/api/src/modules/push/push.controller.ts
- `apps/api/src/modules/push/push.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/push/push.controller.ts, apps/api/src/modules/push/push.repository.ts
- `apps/api/src/modules/reports/report.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/reports/report.routes.ts, apps/api/src/modules/reports/report.repository.ts
- `apps/api/src/modules/reports/report.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/reports/report.routes.ts, apps/api/src/modules/reports/report.controller.ts
- `apps/api/src/modules/reports/report.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/reports/report.controller.ts, apps/api/src/modules/reports/report.repository.ts
- `apps/api/src/modules/staff/staff.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/staff/staff.routes.ts, apps/api/src/modules/staff/staff.schema.ts
- `apps/api/src/modules/staff/staff.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/staff/staff.controller.ts, apps/api/src/modules/staff/staff.schema.ts
- `apps/api/src/modules/staff/staff.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/staff/staff.routes.ts, apps/api/src/modules/staff/staff.controller.ts
- `apps/api/src/modules/students/student.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/students/student.routes.ts, apps/api/src/modules/students/student.repository.ts, apps/api/src/modules/students/student.schema.ts
- `apps/api/src/modules/students/student.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/students/student.routes.ts, apps/api/src/modules/students/student.controller.ts, apps/api/src/modules/students/student.schema.ts
- `apps/api/src/modules/students/student.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/students/student.controller.ts, apps/api/src/modules/students/student.repository.ts, apps/api/src/modules/students/student.schema.ts
- `apps/api/src/modules/students/student.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/students/student.routes.ts, apps/api/src/modules/students/student.controller.ts, apps/api/src/modules/students/student.repository.ts
- `apps/api/src/modules/super-admin/super-admin.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/super-admin/super-admin.routes.ts, apps/api/src/modules/super-admin/super-admin.repository.ts
- `apps/api/src/modules/super-admin/super-admin.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/super-admin/super-admin.routes.ts, apps/api/src/modules/super-admin/super-admin.controller.ts
- `apps/api/src/modules/super-admin/super-admin.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/super-admin/super-admin.controller.ts, apps/api/src/modules/super-admin/super-admin.repository.ts
- `apps/api/src/modules/teachers/availability.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/teachers/availability.repository.ts, apps/api/src/modules/teachers/availability.schema.ts
- `apps/api/src/modules/teachers/availability.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/teachers/availability.controller.ts, apps/api/src/modules/teachers/availability.schema.ts
- `apps/api/src/modules/teachers/availability.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/teachers/availability.controller.ts, apps/api/src/modules/teachers/availability.repository.ts
- `apps/api/src/modules/teachers/teacher.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/teachers/teacher.routes.ts, apps/api/src/modules/teachers/teacher.repository.ts, apps/api/src/modules/teachers/teacher.schema.ts
- `apps/api/src/modules/teachers/teacher.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/teachers/teacher.routes.ts, apps/api/src/modules/teachers/teacher.controller.ts, apps/api/src/modules/teachers/teacher.schema.ts
- `apps/api/src/modules/teachers/teacher.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/teachers/teacher.controller.ts, apps/api/src/modules/teachers/teacher.repository.ts, apps/api/src/modules/teachers/teacher.schema.ts
- `apps/api/src/modules/teachers/teacher.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/teachers/teacher.routes.ts, apps/api/src/modules/teachers/teacher.controller.ts, apps/api/src/modules/teachers/teacher.repository.ts
- `apps/api/src/modules/tenants/tenant.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/tenants/tenant.routes.ts, apps/api/src/modules/tenants/tenant.repository.ts, apps/api/src/modules/tenants/tenant.schema.ts
- `apps/api/src/modules/tenants/tenant.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/tenants/tenant.routes.ts, apps/api/src/modules/tenants/tenant.controller.ts, apps/api/src/modules/tenants/tenant.schema.ts
- `apps/api/src/modules/tenants/tenant.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/tenants/tenant.controller.ts, apps/api/src/modules/tenants/tenant.repository.ts, apps/api/src/modules/tenants/tenant.schema.ts
- `apps/api/src/modules/tenants/tenant.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/tenants/tenant.routes.ts, apps/api/src/modules/tenants/tenant.controller.ts, apps/api/src/modules/tenants/tenant.repository.ts
- `apps/api/src/modules/tests/analytics.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/tests/analytics.repository.ts
- `apps/api/src/modules/tests/analytics.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/tests/analytics.controller.ts
- `apps/api/src/modules/tests/grading.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/tests/grading.repository.ts
- `apps/api/src/modules/tests/grading.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/tests/grading.controller.ts
- `apps/api/src/modules/tests/student-test.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/tests/student-test.routes.ts, apps/api/src/modules/tests/student-test.repository.ts
- `apps/api/src/modules/tests/student-test.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/tests/student-test.routes.ts, apps/api/src/modules/tests/student-test.controller.ts
- `apps/api/src/modules/tests/student-test.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/tests/student-test.controller.ts, apps/api/src/modules/tests/student-test.repository.ts
- `apps/api/src/modules/tests/test.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/tests/test.routes.ts, apps/api/src/modules/tests/test.repository.ts, apps/api/src/modules/tests/test.schema.ts
- `apps/api/src/modules/tests/test.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/tests/test.routes.ts, apps/api/src/modules/tests/test.controller.ts, apps/api/src/modules/tests/test.schema.ts
- `apps/api/src/modules/tests/test.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/tests/test.controller.ts, apps/api/src/modules/tests/test.repository.ts, apps/api/src/modules/tests/test.schema.ts
- `apps/api/src/modules/tests/test.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/tests/test.routes.ts, apps/api/src/modules/tests/test.controller.ts, apps/api/src/modules/tests/test.repository.ts
- `apps/api/src/modules/timetable/room.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/timetable/room.routes.ts, apps/api/src/modules/timetable/room.repository.ts, apps/api/src/modules/timetable/room.schema.ts
- `apps/api/src/modules/timetable/room.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/timetable/room.routes.ts, apps/api/src/modules/timetable/room.controller.ts, apps/api/src/modules/timetable/room.schema.ts
- `apps/api/src/modules/timetable/room.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/timetable/room.controller.ts, apps/api/src/modules/timetable/room.repository.ts, apps/api/src/modules/timetable/room.schema.ts
- `apps/api/src/modules/timetable/room.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/timetable/room.routes.ts, apps/api/src/modules/timetable/room.controller.ts, apps/api/src/modules/timetable/room.repository.ts
- `apps/api/src/modules/timetable/time-slot.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/timetable/time-slot.routes.ts, apps/api/src/modules/timetable/time-slot.repository.ts, apps/api/src/modules/timetable/time-slot.schema.ts
- `apps/api/src/modules/timetable/time-slot.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/timetable/time-slot.routes.ts, apps/api/src/modules/timetable/time-slot.controller.ts, apps/api/src/modules/timetable/time-slot.schema.ts
- `apps/api/src/modules/timetable/time-slot.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/timetable/time-slot.controller.ts, apps/api/src/modules/timetable/time-slot.repository.ts, apps/api/src/modules/timetable/time-slot.schema.ts
- `apps/api/src/modules/timetable/time-slot.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/timetable/time-slot.routes.ts, apps/api/src/modules/timetable/time-slot.controller.ts, apps/api/src/modules/timetable/time-slot.repository.ts
- `apps/api/src/modules/timetable/timetable-entry.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/timetable/timetable-entry.routes.ts, apps/api/src/modules/timetable/timetable-entry.repository.ts, apps/api/src/modules/timetable/timetable-entry.schema.ts
- `apps/api/src/modules/timetable/timetable-entry.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/timetable/timetable-entry.routes.ts, apps/api/src/modules/timetable/timetable-entry.controller.ts, apps/api/src/modules/timetable/timetable-entry.schema.ts
- `apps/api/src/modules/timetable/timetable-entry.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/timetable/timetable-entry.controller.ts, apps/api/src/modules/timetable/timetable-entry.repository.ts, apps/api/src/modules/timetable/timetable-entry.schema.ts
- `apps/api/src/modules/timetable/timetable-entry.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/timetable/timetable-entry.routes.ts, apps/api/src/modules/timetable/timetable-entry.controller.ts, apps/api/src/modules/timetable/timetable-entry.repository.ts
- `apps/api/src/modules/timetable/timetable-generate.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/timetable/timetable-generate.schema.ts, apps/api/src/modules/timetable/timetable-generate.service.ts
- `apps/api/src/modules/timetable/timetable-generate.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/timetable/timetable-generate.controller.ts, apps/api/src/modules/timetable/timetable-generate.service.ts
- `apps/api/src/modules/timetable/timetable-generate.service.ts`
  - Purpose: Business/service logic shared across controllers.
  - Integration: apps/api/src/modules/timetable/timetable-generate.controller.ts, apps/api/src/modules/timetable/timetable-generate.schema.ts
- `apps/api/src/modules/users/user.controller.ts`
  - Purpose: HTTP handler layer: validates context, calls repository/service, returns API response.
  - Integration: apps/api/src/modules/users/user.routes.ts, apps/api/src/modules/users/user.repository.ts, apps/api/src/modules/users/user.schema.ts
- `apps/api/src/modules/users/user.repository.ts`
  - Purpose: Data-access layer for SQL queries and persistence logic.
  - Integration: apps/api/src/modules/users/user.routes.ts, apps/api/src/modules/users/user.controller.ts, apps/api/src/modules/users/user.schema.ts
- `apps/api/src/modules/users/user.routes.ts`
  - Purpose: Defines Express routes and middleware chain for module endpoints.
  - Integration: apps/api/src/modules/users/user.controller.ts, apps/api/src/modules/users/user.repository.ts, apps/api/src/modules/users/user.schema.ts
- `apps/api/src/modules/users/user.schema.ts`
  - Purpose: Zod validation schemas for request payload/query validation.
  - Integration: apps/api/src/modules/users/user.routes.ts, apps/api/src/modules/users/user.controller.ts, apps/api/src/modules/users/user.repository.ts

### webAdminConfig

- `apps/web-admin/.gitignore`
  - Purpose: VCS ignore patterns.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/AGENTS.md`
  - Purpose: Project source/configuration file.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/CLAUDE.md`
  - Purpose: Project source/configuration file.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/Dockerfile`
  - Purpose: Container build definition for deployment/runtime.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/README.md`
  - Purpose: Human-readable setup and usage documentation.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/components.json`
  - Purpose: UI component generator/config metadata.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/eslint.config.mjs`
  - Purpose: Linting configuration and static code quality rules.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/next.config.ts`
  - Purpose: Next.js runtime/build configuration.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/package.json`
  - Purpose: Project metadata, scripts, and dependencies.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/postcss.config.mjs`
  - Purpose: PostCSS/Tailwind build pipeline config.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/public/file.svg`
  - Purpose: Static frontend asset.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/public/globe.svg`
  - Purpose: Static frontend asset.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/public/next.svg`
  - Purpose: Static frontend asset.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/public/vercel.svg`
  - Purpose: Static frontend asset.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/public/window.svg`
  - Purpose: Static frontend asset.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web-admin/tsconfig.json`
  - Purpose: TypeScript compiler configuration.
  - Integration: Referenced by workspace scripts/build or imported by related modules.

### webAdminPages

- `apps/web-admin/src/app/(admin)/announcements/new/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/announcements/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/attendance/history/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/attendance/mark/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/attendance/reports/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/batches/[id]/performance/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/batches/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/calendar/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/courses/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/dashboard/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/expenses/new/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/expenses/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/fees/payments/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/fees/reports/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/financial/balance-sheet/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/financial/budget/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/financial/dashboard/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/financial/export/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/financial/gst/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/financial/income/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/financial/pnl/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/financial/settings/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/layout.tsx`
  - Purpose: Next.js layout wrapper providing shared navigation/session shell.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/materials/[id]/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/materials/analytics/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/materials/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/materials/upload/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/profile/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/questions/new/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/questions/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/reports/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/settings/email-logs/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/settings/notifications/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/settings/sms-credits/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/settings/sms-logs/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/settings/whatsapp-logs/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/settings/whatsapp/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/staff/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/students/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/teachers/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/teachers/performance/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/tests/[id]/analytics/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/tests/[id]/evaluate/[attemptId]/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/tests/[id]/evaluate/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/tests/[id]/leaderboard/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/tests/new/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/tests/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(admin)/timetable/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/layout.tsx`
  - Purpose: Next.js layout wrapper providing shared navigation/session shell.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/settings/notifications/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/announcements/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/materials/[id]/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/materials/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/performance/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/qr/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/tests/[id]/attempt/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/tests/[id]/result/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/tests/[id]/review/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/tests/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/student/tests/performance/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/teacher/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/(portal)/portal/teacher/performance/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/favicon.ico`
  - Purpose: Static frontend asset.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/globals.css`
  - Purpose: Global CSS and utility style definitions.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/layout.tsx`
  - Purpose: Next.js layout wrapper providing shared navigation/session shell.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/login/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/page.tsx`
  - Purpose: Project source/configuration file.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/reset-password/confirm/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.
- `apps/web-admin/src/app/reset-password/page.tsx`
  - Purpose: Next.js route page component for user-facing UI screen.
  - Integration: Uses apps/web-admin/src/lib/api.ts and shared components for API/UI integration.

### webAdminComponents

- `apps/web-admin/src/components/availability-grid.tsx`
  - Purpose: Reusable domain component used by multiple pages.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/material-card.tsx`
  - Purpose: Reusable domain component used by multiple pages.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/sidebar.tsx`
  - Purpose: Reusable domain component used by multiple pages.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/topbar.tsx`
  - Purpose: Reusable domain component used by multiple pages.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/ui/button.tsx`
  - Purpose: Reusable UI primitive component.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/ui/card.tsx`
  - Purpose: Reusable UI primitive component.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/ui/dialog.tsx`
  - Purpose: Reusable UI primitive component.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/ui/input.tsx`
  - Purpose: Reusable UI primitive component.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/ui/label.tsx`
  - Purpose: Reusable UI primitive component.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.
- `apps/web-admin/src/components/ui/table.tsx`
  - Purpose: Reusable UI primitive component.
  - Integration: Imported into page routes under apps/web-admin/src/app/**.

### webAdminLib

- `apps/web-admin/src/lib/api.ts`
  - Purpose: Frontend API client abstraction for backend requests.
  - Integration: Used by route pages and components across web-admin.
- `apps/web-admin/src/lib/auth.tsx`
  - Purpose: Frontend auth state/provider utilities.
  - Integration: Used by route pages and components across web-admin.
- `apps/web-admin/src/lib/utils.ts`
  - Purpose: Shared frontend utility helpers.
  - Integration: Used by route pages and components across web-admin.

### webPlaceholder

- `apps/web/README.md`
  - Purpose: Human-readable setup and usage documentation.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `apps/web/landing.html`
  - Purpose: Project source/configuration file.
  - Integration: Referenced by workspace scripts/build or imported by related modules.

### docs

- `docs/api-spec.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docs/architecture.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docs/deployment.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docs/presentation-outline.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docs/presentation.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docs/report-outline.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docs/report.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docs/setup-guide.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `docs/testing.md`
  - Purpose: Project documentation artifact.
  - Integration: Referenced by workspace scripts/build or imported by related modules.

### packages

- `packages/common/package.json`
  - Purpose: Project metadata, scripts, and dependencies.
  - Integration: Referenced by workspace scripts/build or imported by related modules.
- `packages/common/src/index.ts`
  - Purpose: Project source/configuration file.
  - Integration: Referenced by workspace scripts/build or imported by related modules.


- `apps/api/src/db/migrations/027b_budget_schema_compat.sql`
  - Purpose: Compatibility migration to align legacy budgets schema with Phase 2 finance migrations (`028-030`).
  - Integration: Must run before/with `028_budgets.sql` and later finance migrations; created during post-audit remediation.

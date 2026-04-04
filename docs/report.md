# VEDAS Phase 1 Report (Draft)

## Abstract
VEDAS is a multi-tenant SaaS platform for coaching institutes to manage onboarding, users, courses, and batches. Phase 1 delivers a working MVP with authentication, tenant isolation, institute onboarding, and admin dashboards.

## Problem Statement
Local coaching institutes manage student records, staff, and course operations using spreadsheets or fragmented tools, leading to operational inefficiencies and poor communication.

## Objectives
- Provide a secure, multi-tenant system for institutes
- Enable onboarding, user management, and academic structure setup
- Deliver basic dashboards for admins, students, and teachers

## System Requirements
- Web frontend (Next.js)
- API backend (Node.js + Express)
- PostgreSQL database
- JWT authentication and RBAC

## System Design
See `docs/architecture.md` for diagrams and multi-tenant strategy.

## Modules & Implementation
- Authentication & RBAC
- Institute onboarding + KYC
- User management (students/teachers/staff)
- Courses & batches
- Email verification + password reset

## Testing
Unit + route tests with Jest and Supertest. See `docs/testing.md`.

## Results
MVP supports onboarding, core user flows, and dashboards.

## Future Scope
- Attendance, fees, exams, analytics
- Advanced notifications and in-app messaging
- Dedicated tenant databases for premium institutes

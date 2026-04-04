# API Structure - Phase 1

Base URL: `/api/v1`

## Health

- `GET /health`
  - Purpose: Health check
  - Auth: No

## Plans

- `GET /plans`
  - Purpose: List active subscription plans
  - Auth: No

## Authentication

- `POST /auth/register-institute`
  - Purpose: Create tenant + institute admin user
  - Auth: No

- `POST /auth/login`
  - Purpose: Login with email/password
  - Auth: No

- `POST /auth/refresh`
  - Purpose: Rotate refresh token and issue new access token
  - Auth: No

- `POST /auth/verify-email`
  - Purpose: Verify email with token
  - Auth: No

## Password Reset

- `POST /password/request`
  - Purpose: Request password reset email token
  - Auth: No

- `POST /password/confirm`
  - Purpose: Confirm password reset using token
  - Auth: No

- `POST /auth/logout`
  - Purpose: Revoke refresh token(s)
  - Auth: Yes

- `GET /auth/me`
  - Purpose: Current user profile
  - Auth: Yes

- `POST /auth/teacher`
  - Purpose: Create teacher login under current tenant
  - Auth: Yes (`institute_admin`)

- `POST /auth/student`
  - Purpose: Create student login under current tenant
  - Auth: Yes (`institute_admin`)

- `POST /auth/staff`
  - Purpose: Create staff login under current tenant
  - Auth: Yes (`institute_admin`)

- `POST /auth/students/bulk`
  - Purpose: Bulk create students via CSV string
  - Auth: Yes (`institute_admin`)

## Students (File Upload + Profiles)

- `POST /students/bulk-upload`
  - Purpose: Bulk create students via CSV/XLSX file
  - Auth: Yes (`institute_admin`)

- `GET /students/csv-template`
  - Purpose: Download CSV template
  - Auth: Yes (`institute_admin`)

- `GET /students/:id`
  - Purpose: Get student profile details
  - Auth: Yes (`institute_admin`)

- `PUT /students/:id`
  - Purpose: Update student profile details
  - Auth: Yes (`institute_admin`)

- `DELETE /students/:id`
  - Purpose: Soft delete student (deactivate)
  - Auth: Yes (`institute_admin`)

## Tenant

- `GET /tenant/me`
  - Purpose: Fetch current tenant profile
  - Auth: Yes + tenant required

- `PUT /tenant/me`
  - Purpose: Update institute profile / KYC / plan / custom domain
  - Auth: Yes (`institute_admin`)

## Users

- `GET /users`
  - Purpose: List users of current tenant
  - Auth: Yes (`institute_admin`)

- `PUT /users/me`
  - Purpose: Update current user profile
  - Auth: Yes

- `PATCH /users/:id/status`
  - Purpose: Activate/deactivate user
  - Auth: Yes (`institute_admin`)

- `PUT /users/:id`
  - Purpose: Update user name/profile
  - Auth: Yes (`institute_admin`)

- `PATCH /users/:id/role`
  - Purpose: Change user role (student/teacher/staff)
  - Auth: Yes (`institute_admin`)

- `DELETE /users/:id`
  - Purpose: Delete user
  - Auth: Yes (`institute_admin`)

## Dashboard

- `GET /dashboard/summary`
  - Purpose: Basic institute admin dashboard counts
  - Auth: Yes

## Portals

- `GET /portal/student/dashboard`
  - Purpose: Student basic dashboard with notifications
  - Auth: Yes (`student`)

- `GET /portal/teacher/dashboard`
  - Purpose: Teacher basic dashboard with notifications
  - Auth: Yes (`teacher`)

## Notifications

- `POST /notifications/send`
  - Purpose: Send email notification to a user
  - Auth: Yes (`institute_admin` or `teacher`)

- `GET /notifications/my`
  - Purpose: List notifications for current user
  - Auth: Yes

## Courses

- `POST /courses`
  - Purpose: Create course
  - Auth: Yes (`institute_admin`)

- `GET /courses`
  - Purpose: List courses
  - Auth: Yes

- `GET /courses/:id`
  - Purpose: Get course info
  - Auth: Yes

- `PUT /courses/:id`
  - Purpose: Update course
  - Auth: Yes (`institute_admin`)

- `DELETE /courses/:id`
  - Purpose: Delete course
  - Auth: Yes (`institute_admin`)

- `POST /courses/:id/assign-teacher`
  - Purpose: Assign teacher to course
  - Auth: Yes (`institute_admin`)

## Batches

- `POST /batches`
  - Purpose: Create batch
  - Auth: Yes (`institute_admin`)

- `GET /batches`
  - Purpose: List batches
  - Auth: Yes

- `PUT /batches/:id`
  - Purpose: Update batch
  - Auth: Yes (`institute_admin`)

- `DELETE /batches/:id`
  - Purpose: Delete batch
  - Auth: Yes (`institute_admin`)

- `POST /batches/:id/assign-student`
  - Purpose: Assign student to batch
  - Auth: Yes (`institute_admin`)

- `GET /batches/:id/students`
  - Purpose: List students in a batch
  - Auth: Yes (`institute_admin`)

- `POST /batches/:id/assign-teacher`
  - Purpose: Assign teacher to batch
  - Auth: Yes (`institute_admin`)

- `GET /batches/:id/teachers`
  - Purpose: List teachers assigned to a batch
  - Auth: Yes (`institute_admin`)

- `DELETE /batches/:batchId/teachers/:teacherId`
  - Purpose: Remove teacher from batch
  - Auth: Yes (`institute_admin`)

## Super Admin

- `GET /super-admin/tenants`
  - Purpose: Platform-level tenant summary
  - Auth: Yes (`super_admin`)

## Staff

- `GET /staff`
  - Purpose: List staff members
  - Auth: Yes (`institute_admin`)

- `POST /staff`
  - Purpose: Create staff member
  - Auth: Yes (`institute_admin`)

- `GET /staff/:id`
  - Purpose: Get staff member
  - Auth: Yes (`institute_admin`)

- `PUT /staff/:id`
  - Purpose: Update staff member
  - Auth: Yes (`institute_admin`)

- `DELETE /staff/:id`
  - Purpose: Deactivate staff member
  - Auth: Yes (`institute_admin`)

## Teachers

- `GET /teachers/:id/batches`
  - Purpose: List batches for a teacher
  - Auth: Yes (`institute_admin`)

## Standard Headers

- `Authorization: Bearer <access_token>` for protected routes.
- `Content-Type: application/json`

## Auth Response Model

Login/Register returns:

```json
{
  "user": {
    "id": "uuid",
    "tenantId": "uuid-or-null",
    "fullName": "Name",
    "email": "mail@example.com",
    "role": "institute_admin"
  },
  "tokens": {
    "accessToken": "jwt",
    "refreshToken": "opaque-random-token",
    "refreshTokenExpiresAt": "ISO date"
  }
}
```

Note:
- `/auth/register-institute` also returns `emailVerificationToken` (dev only). In production, this should be emailed.

## Bulk CSV Format

```csv
fullName,email,password
Student One,one@example.com,Password123
Student Two,two@example.com,Password123
```

Notes:
- CSV parser is basic (no quoted commas). Keep simple.

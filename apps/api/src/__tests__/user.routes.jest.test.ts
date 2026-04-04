import request from 'supertest';
import { buildApp } from '../app.js';

jest.mock('../middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.auth = { userId: 'user-1', tenantId: 'tenant-1', role: 'institute_admin', tokenVersion: 0 };
    req.tenantId = 'tenant-1';
    req.role = 'institute_admin';
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  requireTenant: (req: any, _res: any, next: any) => {
    req.tenantId = 'tenant-1';
    next();
  }
}));

jest.mock('../modules/users/user.repository.js', () => ({
  listUsersByTenant: jest.fn(async () => [{ id: 'u1', full_name: 'Test', email: 't@test.com', role: 'student', is_active: true, created_at: new Date() }]),
  listUsersByTenantAndRole: jest.fn(async () => [{ id: 'u1', full_name: 'Test', email: 't@test.com', role: 'student', is_active: true, created_at: new Date() }]),
  setUserActiveStatus: jest.fn(async () => undefined),
  updateUserName: jest.fn(async () => undefined),
  deleteUser: jest.fn(async () => undefined),
  findUserById: jest.fn(async () => ({ id: 'u1', tenant_id: 'tenant-1', role: 'student', full_name: 'Test', email: 't@test.com', is_active: true })),
  updateUserRole: jest.fn(async () => undefined),
  updateUserProfile: jest.fn(async () => undefined)
}));

jest.mock('../modules/students/student.repository.js', () => ({
  createStudentProfile: jest.fn(async () => undefined),
  findStudentProfileByUserId: jest.fn(async () => null)
}));

jest.mock('../modules/teachers/teacher.repository.js', () => ({
  createTeacherProfile: jest.fn(async () => undefined),
  findTeacherProfileByUserId: jest.fn(async () => null)
}));

jest.mock('../db/client.js', () => ({
  withTransaction: async (fn: any) => fn({ query: jest.fn(async () => ({ rows: [] })) })
}));

describe('user routes', () => {
  const app = buildApp();

  it('lists users by role', async () => {
    const res = await request(app).get('/api/v1/users?role=student');
    expect(res.status).toBe(200);
    expect(res.body.users?.length).toBe(1);
  });

  it('updates user role', async () => {
    const res = await request(app).patch('/api/v1/users/u1/role').send({ role: 'student' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User role updated');
  });
});

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

jest.mock('../modules/batches/batch-teacher.service.js', () => ({
  assignTeacherToBatchService: jest.fn(async () => ({ id: 'bt1' })),
  listTeachersForBatchService: jest.fn(async () => []),
  removeTeacherFromBatchService: jest.fn(async () => undefined)
}));

describe('batch-teacher routes', () => {
  const app = buildApp();

  it('assigns a teacher to a batch', async () => {
    const res = await request(app)
      .post('/api/v1/batches/b1/assign-teacher')
      .send({ teacherUserId: 't1' });
    expect(res.status).toBe(201);
  });
});

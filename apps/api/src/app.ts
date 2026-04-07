import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { passwordRouter } from './modules/password/password.routes.js';
import { planRouter } from './modules/plans/plan.routes.js';
import { portalRouter } from './modules/portal/portal.routes.js';
import { courseRouter } from './modules/courses/course.routes.js';
import { batchRouter } from './modules/batches/batch.routes.js';
import { studentRouter } from './modules/students/student.routes.js';
import { teacherRouter } from './modules/teachers/teacher.routes.js';
import { staffRouter } from './modules/staff/staff.routes.js';
import { timeSlotRouter } from './modules/timetable/time-slot.routes.js';
import { roomRouter } from './modules/timetable/room.routes.js';
import { timetableEntryRouter } from './modules/timetable/timetable-entry.routes.js';
import { attendanceRouter } from './modules/attendance/attendance.routes.js';
import { feeRouter } from './modules/fees/fee.routes.js';
import { superAdminRouter } from './modules/super-admin/super-admin.routes.js';
import { tenantRouter } from './modules/tenants/tenant.routes.js';
import { userRouter } from './modules/users/user.routes.js';

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        if (req.originalUrl === '/api/v1/fees/webhook/razorpay') {
          req.bodyRaw = buf.toString('utf8');
        }
      }
    })
  );

  app.use(
    '/api/v1/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many login attempts. Try again after 15 minutes.' }
    })
  );

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/plans', planRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/password', passwordRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/portal', portalRouter);
  app.use('/api/v1/courses', courseRouter);
  app.use('/api/v1/batches', batchRouter);
  app.use('/api/v1/students', studentRouter);
  app.use('/api/v1/teachers', teacherRouter);
  app.use('/api/v1/staff', staffRouter);
  app.use('/api/v1/time-slots', timeSlotRouter);
  app.use('/api/v1/rooms', roomRouter);
  app.use('/api/v1/timetable', timetableEntryRouter);
  app.use('/api/v1/attendance', attendanceRouter);
  app.use('/api/v1/fees', feeRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/tenant', tenantRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/super-admin', superAdminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

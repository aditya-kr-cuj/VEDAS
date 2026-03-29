import type { Request, Response } from 'express';
import { listNotificationsForUser } from '../notifications/notification.repository.js';
import { HttpError } from '../../utils/http-error.js';

export async function studentDashboardHandler(req: Request, res: Response): Promise<void> {
  const role = req.role;
  if (role !== 'student') {
    throw new HttpError(403, 'Student access only');
  }

  const notifications = await listNotificationsForUser(req.auth!.userId);

  res.status(200).json({
    message: 'Welcome student',
    notifications
  });
}

export async function teacherDashboardHandler(req: Request, res: Response): Promise<void> {
  const role = req.role;
  if (role !== 'teacher') {
    throw new HttpError(403, 'Teacher access only');
  }

  const notifications = await listNotificationsForUser(req.auth!.userId);

  res.status(200).json({
    message: 'Welcome teacher',
    notifications
  });
}

import type { Request, Response } from 'express';
import { HttpError } from '../../utils/http-error.js';
import {
  assignTeacherToCourse,
  createCourse,
  deleteCourse,
  findCourseById,
  listCourses,
  updateCourse
} from './course.repository.js';

export async function createCourseHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const course = await createCourse({
    tenantId,
    name: req.body.name,
    description: req.body.description,
    subjectCode: req.body.subjectCode
  });

  res.status(201).json({ course });
}

export async function listCoursesHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const courses = await listCourses(tenantId);
  res.status(200).json({ courses });
}

export async function getCourseHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  const course = await findCourseById(tenantId, req.params.id);
  if (!course) {
    throw new HttpError(404, 'Course not found');
  }

  res.status(200).json({ course });
}

export async function updateCourseHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await updateCourse({
    tenantId,
    courseId: req.params.id,
    name: req.body.name,
    description: req.body.description,
    subjectCode: req.body.subjectCode,
    isActive: req.body.isActive
  });

  res.status(200).json({ message: 'Course updated' });
}

export async function deleteCourseHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await deleteCourse({ tenantId, courseId: req.params.id });
  res.status(200).json({ message: 'Course deleted' });
}

export async function assignTeacherHandler(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new HttpError(400, 'Tenant context is required');
  }

  await assignTeacherToCourse({
    courseId: req.params.id,
    teacherUserId: req.body.teacherUserId
  });

  res.status(200).json({ message: 'Teacher assigned to course' });
}

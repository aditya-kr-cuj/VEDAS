import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { HttpError } from '../utils/http-error.js';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      errors: err.flatten().fieldErrors
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof Error && err.message === 'Only .csv or .xlsx files are allowed') {
    res.status(400).json({ message: err.message });
    return;
  }

  const maybePgError = err as { code?: string; detail?: string };
  if (maybePgError.code === '23505') {
    res.status(409).json({ message: 'Duplicate value violates unique constraint', detail: maybePgError.detail });
    return;
  }

  const maybeError = err as Error;
  res.status(500).json({ message: maybeError?.message ?? 'Internal server error' });
}

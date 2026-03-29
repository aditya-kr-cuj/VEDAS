import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload, UserRole } from '../types/auth.js';
import { HttpError } from '../utils/http-error.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new HttpError(401, 'Missing authorization token'));
    return;
  }

  const token = header.replace('Bearer ', '').trim();

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.auth = payload;
    req.tenantId = payload.tenantId;
    req.role = payload.role;
    next();
  } catch (_error) {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function authorize(roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.role || !roles.includes(req.role)) {
      next(new HttpError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}

export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.tenantId) {
    next(new HttpError(400, 'Tenant context is required'));
    return;
  }

  next();
}

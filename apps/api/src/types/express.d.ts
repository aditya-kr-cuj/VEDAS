import type { JwtPayload, UserRole } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
      tenantId?: string | null;
      role?: UserRole;
      bodyRaw?: string;
    }
  }
}

export {};

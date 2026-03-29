export type UserRole = 'super_admin' | 'institute_admin' | 'teacher' | 'student' | 'staff';

export interface JwtPayload {
  userId: string;
  tenantId: string | null;
  role: UserRole;
  tokenVersion: number;
}

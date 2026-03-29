import type { PoolClient } from 'pg';
import type { UserRole } from '../../types/auth.js';

export interface UserRecord {
  id: string;
  tenant_id: string | null;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  token_version: number;
  is_active: boolean;
  email_verified: boolean;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(
  client: PoolClient,
  payload: {
    tenantId: string | null;
    fullName: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }
): Promise<UserRecord> {
  const result = await client.query<UserRecord>(
    `
      INSERT INTO users (tenant_id, full_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [payload.tenantId, payload.fullName, payload.email.toLowerCase(), payload.passwordHash, payload.role]
  );

  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { query } = await import('../../db/client.js');
  const rows = await query<UserRecord>('SELECT * FROM users WHERE email = $1 LIMIT 1', [
    email.toLowerCase()
  ]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { query } = await import('../../db/client.js');
  const rows = await query<UserRecord>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function bumpUserTokenVersion(userId: string): Promise<void> {
  const { query } = await import('../../db/client.js');
  await query('UPDATE users SET token_version = token_version + 1, updated_at = NOW() WHERE id = $1', [
    userId
  ]);
}

export async function listUsersByTenant(tenantId: string): Promise<
  Array<Pick<UserRecord, 'id' | 'full_name' | 'email' | 'role' | 'is_active' | 'created_at'>>
> {
  const { query } = await import('../../db/client.js');
  return query(
    `
      SELECT id, full_name, email, role, is_active, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `,
    [tenantId]
  );
}

export async function listUsersByTenantAndRole(
  tenantId: string,
  role: UserRole
): Promise<Array<Pick<UserRecord, 'id' | 'full_name' | 'email' | 'role' | 'is_active' | 'created_at'>>> {
  const { query } = await import('../../db/client.js');
  return query(
    `
      SELECT id, full_name, email, role, is_active, created_at
      FROM users
      WHERE tenant_id = $1 AND role = $2
      ORDER BY created_at DESC
    `,
    [tenantId, role]
  );
}

export async function updateUserProfile(payload: {
  userId: string;
  tenantId: string | null;
  fullName: string;
}): Promise<void> {
  const { query } = await import('../../db/client.js');
  await query('UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2 AND tenant_id IS NOT DISTINCT FROM $3', [
    payload.fullName,
    payload.userId,
    payload.tenantId
  ]);
}

export async function updateUserName(payload: { userId: string; tenantId: string; fullName: string }): Promise<void> {
  const { query } = await import('../../db/client.js');
  await query('UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3', [
    payload.fullName,
    payload.userId,
    payload.tenantId
  ]);
}

export async function setUserActiveStatus(payload: {
  userId: string;
  tenantId: string;
  isActive: boolean;
}): Promise<void> {
  const { query } = await import('../../db/client.js');
  await query(
    'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
    [payload.isActive, payload.userId, payload.tenantId]
  );
}

export async function deleteUser(payload: { userId: string; tenantId: string }): Promise<void> {
  const { query } = await import('../../db/client.js');
  await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [payload.userId, payload.tenantId]);
}

export async function updateUserPassword(payload: { userId: string; passwordHash: string }): Promise<void> {
  const { query } = await import('../../db/client.js');
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
    payload.passwordHash,
    payload.userId
  ]);
}

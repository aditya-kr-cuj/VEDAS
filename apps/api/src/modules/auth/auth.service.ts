import { withTransaction } from '../../db/client.js';
import { comparePassword, generateSecureToken, hashPassword, sha256 } from '../../utils/crypto.js';
import { HttpError } from '../../utils/http-error.js';
import { createTenant } from '../tenants/tenant.repository.js';
import {
  bumpUserTokenVersion,
  createUser,
  findUserByEmail,
  findUserById,
  type UserRecord
} from '../users/user.repository.js';
import {
  findValidRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeRefreshTokenByHash
} from './refresh-token.repository.js';
import { issueRefreshToken, signAccessToken } from './token.service.js';
import type { UserRole } from '../../types/auth.js';
import { createStudentProfile } from '../students/student.repository.js';
import { createTeacherProfile } from '../teachers/teacher.repository.js';
import { addDays } from '../../utils/date.js';
import { buildVerificationEmail, buildWelcomeEmail } from '../../utils/email-templates.js';
import { sendEmail } from '../../utils/email.js';
import {
  createEmailVerificationToken,
  findValidEmailVerificationToken,
  markEmailVerified,
  markTokenVerified
} from './email-verification.repository.js';

function toAuthPayload(user: UserRecord) {
  return {
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
    tokenVersion: user.token_version
  };
}

export async function registerInstituteAdmin(payload: {
  instituteName: string;
  instituteSlug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  password: string;
  planKey?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  kycIdNumber?: string;
  kycDocumentUrl?: string;
  customDomain?: string;
}) {
  const existing = await findUserByEmail(payload.ownerEmail);
  if (existing) {
    throw new HttpError(409, 'A user with this email already exists');
  }

  const passwordHash = await hashPassword(payload.password);

  const subdomain = `${payload.instituteSlug}.vedas.app`;

  const registered = await withTransaction(async (client) => {
    const tenant = await createTenant(client, {
      name: payload.instituteName,
      slug: payload.instituteSlug,
      ownerEmail: payload.ownerEmail,
      phone: payload.ownerPhone,
      planKey: payload.planKey,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2,
      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
      kycIdNumber: payload.kycIdNumber,
      kycDocumentUrl: payload.kycDocumentUrl,
      subdomain,
      customDomain: payload.customDomain
    });

    const adminUser = await createUser(client, {
      tenantId: tenant.id,
      fullName: payload.ownerName,
      email: payload.ownerEmail,
      passwordHash,
      role: 'institute_admin'
    });

    return { tenant, adminUser };
  });

  const accessToken = signAccessToken(toAuthPayload(registered.adminUser));
  const refreshToken = await issueRefreshToken(registered.adminUser.id);
  const emailVerificationToken = await issueEmailVerificationToken({
    userId: registered.adminUser.id,
    fullName: registered.adminUser.full_name,
    email: registered.adminUser.email
  });

  const welcome = buildWelcomeEmail({
    fullName: registered.adminUser.full_name,
    instituteName: registered.tenant.name
  });
  await sendEmail({ to: registered.adminUser.email, subject: welcome.subject, body: welcome.html });

  return {
    tenant: {
      id: registered.tenant.id,
      name: registered.tenant.name,
      slug: registered.tenant.slug,
      subdomain: registered.tenant.subdomain,
      customDomain: registered.tenant.custom_domain,
      planKey: registered.tenant.plan_key
    },
    user: {
      id: registered.adminUser.id,
      fullName: registered.adminUser.full_name,
      email: registered.adminUser.email,
      role: registered.adminUser.role,
      emailVerified: registered.adminUser.email_verified
    },
    tokens: {
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt.toISOString()
    },
    emailVerificationToken
  };
}

export async function login(payload: { email: string; password: string }) {
  const user = await findUserByEmail(payload.email);

  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }

  if (!user.is_active) {
    throw new HttpError(403, 'User account is inactive');
  }

  const matches = await comparePassword(payload.password, user.password_hash);
  if (!matches) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const accessToken = signAccessToken(toAuthPayload(user));
  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      tenantId: user.tenant_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      emailVerified: user.email_verified
    },
    tokens: {
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt.toISOString()
    }
  };
}

export async function refreshAccessToken(payload: { refreshToken: string }) {
  const tokenHash = sha256(payload.refreshToken);
  const tokenRecord = await findValidRefreshToken(tokenHash);

  if (!tokenRecord) {
    throw new HttpError(401, 'Invalid refresh token');
  }

  const user = await findUserById(tokenRecord.user_id);
  if (!user || !user.is_active) {
    throw new HttpError(401, 'User not found or inactive');
  }

  await revokeRefreshTokenByHash(tokenHash);

  const accessToken = signAccessToken(toAuthPayload(user));
  const refreshToken = await issueRefreshToken(user.id);

  return {
    accessToken,
    refreshToken: refreshToken.token,
    refreshTokenExpiresAt: refreshToken.expiresAt.toISOString()
  };
}

export async function logout(payload: { refreshToken?: string; userId?: string }) {
  if (payload.refreshToken) {
    await revokeRefreshTokenByHash(sha256(payload.refreshToken));
  }

  if (payload.userId) {
    await revokeAllRefreshTokensForUser(payload.userId);
    await bumpUserTokenVersion(payload.userId);
  }
}

export async function createTenantUser(payload: {
  tenantId: string;
  fullName: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'teacher' | 'student' | 'staff'>;
}) {
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new HttpError(409, 'A user with this email already exists');
  }

  const passwordHash = await hashPassword(payload.password);

  const created = await withTransaction(async (client) => {
    const user = await createUser(client, {
      tenantId: payload.tenantId,
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
      role: payload.role
    });

    if (payload.role === 'student') {
      await createStudentProfile(client, { tenantId: payload.tenantId, userId: user.id });
    }

    if (payload.role === 'teacher') {
      await createTeacherProfile(client, { tenantId: payload.tenantId, userId: user.id });
    }

    return user;
  });

  return {
    id: created.id,
    tenantId: created.tenant_id,
    fullName: created.full_name,
    email: created.email,
    role: created.role,
    emailVerified: created.email_verified
  };
}

async function issueEmailVerificationToken(payload: { userId: string; fullName: string; email: string }) {
  const rawToken = generateSecureToken(32);
  const tokenHash = sha256(rawToken);
  const expiresAt = addDays(new Date(), 2);

  await createEmailVerificationToken({ userId: payload.userId, tokenHash, expiresAt });

  const template = buildVerificationEmail({ fullName: payload.fullName, token: rawToken });
  await sendEmail({ to: payload.email, subject: template.subject, body: template.html });
  return rawToken;
}

export async function verifyEmailToken(payload: { token: string }) {
  const tokenHash = sha256(payload.token);
  const record = await findValidEmailVerificationToken(tokenHash);

  if (!record) {
    throw new HttpError(400, 'Invalid or expired verification token');
  }

  await markTokenVerified(tokenHash);
  await markEmailVerified(record.user_id);

  return { verified: true };
}

export async function getCurrentUserProfile(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return {
    id: user.id,
    tenantId: user.tenant_id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    emailVerified: user.email_verified,
    isActive: user.is_active,
    createdAt: user.created_at
  };
}

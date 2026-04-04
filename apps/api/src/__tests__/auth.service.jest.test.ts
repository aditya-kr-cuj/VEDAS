import { login, refreshAccessToken, registerInstituteAdmin } from '../modules/auth/auth.service.js';

jest.mock('../modules/users/user.repository.js', () => ({
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
  bumpUserTokenVersion: jest.fn()
}));

jest.mock('../modules/tenants/tenant.repository.js', () => ({
  createTenant: jest.fn()
}));

jest.mock('../modules/auth/refresh-token.repository.js', () => ({
  findValidRefreshToken: jest.fn(),
  revokeRefreshTokenByHash: jest.fn(),
  revokeAllRefreshTokensForUser: jest.fn()
}));

jest.mock('../modules/auth/token.service.js', () => ({
  signAccessToken: jest.fn(() => 'access-token'),
  issueRefreshToken: jest.fn(async () => ({ token: 'refresh-token', expiresAt: new Date('2030-01-01') }))
}));

jest.mock('../modules/auth/email-verification.repository.js', () => ({
  createEmailVerificationToken: jest.fn(),
  findValidEmailVerificationToken: jest.fn(),
  markEmailVerified: jest.fn(),
  markTokenVerified: jest.fn()
}));

jest.mock('../modules/students/student.repository.js', () => ({
  createStudentProfile: jest.fn()
}));

jest.mock('../modules/teachers/teacher.repository.js', () => ({
  createTeacherProfile: jest.fn()
}));

jest.mock('../utils/crypto.js', () => ({
  hashPassword: jest.fn(async () => 'hashed'),
  comparePassword: jest.fn(async () => true),
  generateSecureToken: jest.fn(() => 'raw-token'),
  sha256: jest.fn(() => 'hash')
}));

jest.mock('../db/client.js', () => ({
  withTransaction: async (fn: (client: { query: jest.Mock }) => Promise<unknown>) =>
    fn({ query: jest.fn(async () => ({ rows: [] })) })
}));

jest.mock('../utils/email.js', () => ({
  sendEmail: jest.fn(async () => undefined)
}));

jest.mock('../utils/email-templates.js', () => ({
  buildVerificationEmail: jest.fn(() => ({ subject: 'Verify', html: '<p>Verify</p>' })),
  buildWelcomeEmail: jest.fn(() => ({ subject: 'Welcome', html: '<p>Welcome</p>' }))
}));

describe('auth.service', () => {
  it('registerInstituteAdmin returns tokens and verification token', async () => {
    const { createTenant } = await import('../modules/tenants/tenant.repository.js');
    const { createUser } = await import('../modules/users/user.repository.js');

    (createTenant as jest.Mock).mockResolvedValue({
      id: 'tenant-1',
      name: 'Institute',
      slug: 'inst',
      subdomain: 'inst.vedas.app',
      custom_domain: null,
      plan_key: 'starter'
    });

    (createUser as jest.Mock).mockResolvedValue({
      id: 'user-1',
      tenant_id: 'tenant-1',
      full_name: 'Owner',
      email: 'owner@test.com',
      role: 'institute_admin',
      token_version: 0,
      email_verified: false
    });

    const result = await registerInstituteAdmin({
      instituteName: 'Institute',
      instituteSlug: 'inst',
      ownerName: 'Owner',
      ownerEmail: 'owner@test.com',
      password: 'Secret123'
    });

    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe('refresh-token');
    expect(result.emailVerificationToken).toBe('raw-token');
  });

  it('login returns access and refresh tokens', async () => {
    const { findUserByEmail } = await import('../modules/users/user.repository.js');
    (findUserByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      tenant_id: 'tenant-1',
      full_name: 'User',
      email: 'user@test.com',
      role: 'student',
      token_version: 0,
      password_hash: 'hashed',
      is_active: true,
      email_verified: true
    });

    const result = await login({ email: 'user@test.com', password: 'Secret123' });
    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe('refresh-token');
  });

  it('refreshAccessToken rotates token', async () => {
    const { findValidRefreshToken } = await import('../modules/auth/refresh-token.repository.js');
    const { findUserById } = await import('../modules/users/user.repository.js');
    (findValidRefreshToken as jest.Mock).mockResolvedValue({ user_id: 'user-1' });
    (findUserById as jest.Mock).mockResolvedValue({
      id: 'user-1',
      tenant_id: 'tenant-1',
      full_name: 'User',
      email: 'user@test.com',
      role: 'student',
      token_version: 0,
      is_active: true
    });

    const result = await refreshAccessToken({ refreshToken: 'r1' });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });
});

import { z } from 'zod';
import { withTransaction } from './client.js';
import { findUserByEmail, createUser } from '../modules/users/user.repository.js';
import { hashPassword } from '../utils/crypto.js';

const seedSchema = z.object({
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  SUPER_ADMIN_NAME: z.string().min(3).default('Platform Super Admin')
});

async function run() {
  const parsed = seedSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid SUPER_ADMIN_* env variables', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  const { SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, SUPER_ADMIN_PASSWORD } = parsed.data;

  const existing = await findUserByEmail(SUPER_ADMIN_EMAIL);
  if (existing) {
    console.log('Super admin already exists. Skipping seed.');
    process.exit(0);
  }

  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);

  await withTransaction(async (client) => {
    await createUser(client, {
      tenantId: null,
      fullName: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      role: 'super_admin'
    });
  });

  console.log('Super admin created successfully.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

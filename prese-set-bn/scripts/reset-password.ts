/**
 * Reset a user's password (admin / recovery).
 *
 * Usage:
 *   DATABASE_URL='...' npm run reset:password -- user@email.com 'NewPass123!'
 *
 * Password in DB is bcrypt-hashed — it cannot be reversed.
 * This script writes a new hash instead.
 */
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: npm run reset:password -- <email> <newPassword>');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const now = new Date();

  const rows = await prisma.$queryRawUnsafe<{ id: string; email: string }[]>(
    `SELECT id, email FROM users WHERE lower(email) = $1 AND is_delete = false LIMIT 1`,
    email,
  );

  const user = rows[0];
  if (!user) {
    console.error(`User not found: ${email}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$executeRawUnsafe(
    `
    UPDATE users
    SET password_hash = $1,
        update_date = $2,
        update_by = $3
    WHERE id = $4
    `,
    passwordHash,
    now,
    'reset-password',
    user.id,
  );

  console.log('');
  console.log('Password updated.');
  console.log('  Email:    ', user.email);
  console.log('  Password: ', newPassword);
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

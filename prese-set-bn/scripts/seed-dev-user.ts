/**
 * Dev test user — รัน: npm run seed:dev-user
 * Login: admin@paceset.app / PassW0rd!
 */
import { createId } from '@paralleldrive/cuid2';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const DEV_EMAIL = 'admin@paceset.app';
const DEV_PASSWORD = 'PassW0rd!';
const DEV_DISPLAY_NAME = 'admin';

async function main() {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  const now = new Date();

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM users WHERE email = $1 AND is_delete = false LIMIT 1`,
    DEV_EMAIL,
  );

  if (existing[0]) {
    await prisma.$executeRawUnsafe(
      `
      UPDATE users
      SET password_hash = $1,
          display_name = $2,
          update_date = $3,
          update_by = $4
      WHERE id = $5
      `,
      passwordHash,
      DEV_DISPLAY_NAME,
      now,
      'seed',
      existing[0].id,
    );
    console.log('Updated dev user password.');
  } else {
    const id = createId();
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO users (
        id, email, password_hash, display_name,
        beep_enabled, locale, water_reminder_enabled, water_reminder_interval_minutes,
        create_date, create_by, update_date, update_by, is_delete
      ) VALUES (
        $1, $2, $3, $4,
        true, 'en'::"Locale", false, 60,
        $5, $6, $7, $8, false
      )
      `,
      id,
      DEV_EMAIL,
      passwordHash,
      DEV_DISPLAY_NAME,
      now,
      'seed',
      now,
      'seed',
    );
    console.log('Created dev user.');
  }

  console.log('');
  console.log('  Email:    ', DEV_EMAIL);
  console.log('  Password: ', DEV_PASSWORD);
  console.log('  Name:     ', DEV_DISPLAY_NAME);
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Locale } from '@prisma/client';
import { auditCreate, auditUpdate } from '../common/audit';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from '../auth/dto/auth.dto';

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  beepEnabled: boolean;
  locale: Locale;
  waterReminderEnabled: boolean;
  waterReminderIntervalMinutes: number;
};

type UserProfileRow = {
  id: string;
  email: string;
  display_name: string;
  beep_enabled: boolean;
  locale: Locale;
  water_reminder_enabled: boolean;
  water_reminder_interval_minutes: number;
};

type AuthUserRow = {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProfileById(id: string): Promise<UserProfile | null> {
    const rows = await this.prisma.$queryRawUnsafe<UserProfileRow[]>(
      `
      SELECT
        id,
        email,
        display_name,
        beep_enabled,
        locale,
        water_reminder_enabled,
        water_reminder_interval_minutes
      FROM users
      WHERE id = $1
        AND is_delete = false
      LIMIT 1
      `,
      id,
    );
    return rows[0] ? mapProfile(rows[0]) : null;
  }

  async findAuthByEmail(email: string): Promise<{
    id: string;
    email: string;
    displayName: string;
    passwordHash: string;
  } | null> {
    const rows = await this.prisma.$queryRawUnsafe<AuthUserRow[]>(
      `
      SELECT id, email, display_name, password_hash
      FROM users
      WHERE email = $1
        AND is_delete = false
      LIMIT 1
      `,
      email,
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      passwordHash: row.password_hash,
    };
  }

  async existsByEmail(email: string): Promise<boolean> {
    const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `
      SELECT id
      FROM users
      WHERE email = $1
        AND is_delete = false
      LIMIT 1
      `,
      email,
    );
    return Boolean(rows[0]);
  }

  async createUser(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    createBy: string;
  }): Promise<{ id: string; email: string; displayName: string }> {
    const id = createId();
    const audit = auditCreate(input.createBy);
    await this.prisma.$executeRawUnsafe(
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
      input.email,
      input.passwordHash,
      input.displayName,
      audit.createDate,
      audit.createBy,
      audit.updateDate,
      audit.updateBy,
    );
    return { id, email: input.email, displayName: input.displayName };
  }

  async updatePasswordByEmail(
    email: string,
    passwordHash: string,
  ): Promise<boolean> {
    const audit = auditUpdate(email);
    const result = await this.prisma.$executeRawUnsafe(
      `
      UPDATE users
      SET
        password_hash = $1,
        update_date = $2,
        update_by = $3
      WHERE email = $4
        AND is_delete = false
      `,
      passwordHash,
      audit.updateDate,
      audit.updateBy,
      email,
    );
    return Number(result) > 0;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile | null> {
    const audit = auditUpdate(userId);
    await this.prisma.$executeRawUnsafe(
      `
      UPDATE users
      SET
        display_name = COALESCE($1, display_name),
        beep_enabled = COALESCE($2, beep_enabled),
        locale = COALESCE($3::"Locale", locale),
        water_reminder_enabled = COALESCE($4, water_reminder_enabled),
        water_reminder_interval_minutes = COALESCE($5, water_reminder_interval_minutes),
        update_date = $6,
        update_by = $7
      WHERE id = $8
        AND is_delete = false
      `,
      dto.displayName ?? null,
      dto.beepEnabled ?? null,
      dto.locale ?? null,
      dto.waterReminderEnabled ?? null,
      dto.waterReminderIntervalMinutes ?? null,
      audit.updateDate,
      audit.updateBy,
      userId,
    );
    return this.findProfileById(userId);
  }
}

function mapProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    beepEnabled: row.beep_enabled,
    locale: row.locale,
    waterReminderEnabled: row.water_reminder_enabled,
    waterReminderIntervalMinutes: row.water_reminder_interval_minutes,
  };
}

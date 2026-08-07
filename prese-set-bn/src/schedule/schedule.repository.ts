import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { ProgramMode } from '@prisma/client';
import { auditCreate, auditUpdate } from '../common/audit';
import { PrismaService } from '../prisma/prisma.service';

export type ScheduleView = {
  id: string;
  userId: string;
  dayOfWeek: number;
  programId: string;
  program: {
    id: string;
    name: string;
    mode: ProgramMode;
  } | null;
};

type ScheduleRow = {
  id: string;
  user_id: string;
  day_of_week: number;
  program_id: string;
  program_name: string | null;
  program_mode: ProgramMode | null;
};

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByUserId(userId: string): Promise<ScheduleView[]> {
    const rows = await this.prisma.$queryRawUnsafe<ScheduleRow[]>(
      `
      SELECT
        pd.id,
        pd.user_id,
        pd.day_of_week,
        pd.program_id,
        p.name AS program_name,
        p.mode AS program_mode
      FROM program_days pd
      LEFT JOIN programs p
        ON p.id = pd.program_id
       AND p.is_delete = false
      WHERE pd.user_id = $1
        AND pd.is_delete = false
      ORDER BY pd.day_of_week ASC
      `,
      userId,
    );
    return rows.map(mapSchedule);
  }

  async findToday(userId: string, dayOfWeek: number): Promise<ScheduleView | null> {
    const rows = await this.prisma.$queryRawUnsafe<ScheduleRow[]>(
      `
      SELECT
        pd.id,
        pd.user_id,
        pd.day_of_week,
        pd.program_id,
        p.name AS program_name,
        p.mode AS program_mode
      FROM program_days pd
      LEFT JOIN programs p
        ON p.id = pd.program_id
       AND p.is_delete = false
      WHERE pd.user_id = $1
        AND pd.day_of_week = $2
        AND pd.is_delete = false
      LIMIT 1
      `,
      userId,
      dayOfWeek,
    );
    return rows[0] ? mapSchedule(rows[0]) : null;
  }

  async findActiveProgramOwner(
    programId: string,
  ): Promise<{ id: string; userId: string } | null> {
    const rows = await this.prisma.$queryRawUnsafe<
      { id: string; user_id: string }[]
    >(
      `
      SELECT id, user_id
      FROM programs
      WHERE id = $1
        AND is_delete = false
      LIMIT 1
      `,
      programId,
    );
    const row = rows[0];
    return row ? { id: row.id, userId: row.user_id } : null;
  }

  async upsert(
    userId: string,
    dayOfWeek: number,
    programId: string,
  ): Promise<ScheduleView> {
    const created = auditCreate(userId);
    const updated = auditUpdate(userId);
    const id = createId();

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO program_days (
        id, user_id, day_of_week, program_id,
        create_date, create_by, update_date, update_by, is_delete
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, false
      )
      ON CONFLICT (user_id, day_of_week)
      DO UPDATE SET
        program_id = EXCLUDED.program_id,
        is_delete = false,
        update_date = $9,
        update_by = $10
      `,
      id,
      userId,
      dayOfWeek,
      programId,
      created.createDate,
      created.createBy,
      created.updateDate,
      created.updateBy,
      updated.updateDate,
      updated.updateBy,
    );

    const row = await this.findToday(userId, dayOfWeek);
    if (!row) throw new Error('Schedule upsert failed');
    return row;
  }

  async softDeleteByDay(userId: string, dayOfWeek: number): Promise<boolean> {
    const result = await this.prisma.$executeRawUnsafe(
      `
      UPDATE program_days
      SET
        is_delete = true,
        update_date = $1,
        update_by = $2
      WHERE user_id = $3
        AND day_of_week = $4
        AND is_delete = false
      `,
      new Date(),
      userId,
      dayOfWeek,
    );
    // $executeRawUnsafe returns number of rows in Prisma
    return Number(result) > 0;
  }
}

function mapSchedule(row: ScheduleRow): ScheduleView {
  return {
    id: row.id,
    userId: row.user_id,
    dayOfWeek: row.day_of_week,
    programId: row.program_id,
    program:
      row.program_name && row.program_mode
        ? {
            id: row.program_id,
            name: row.program_name,
            mode: row.program_mode,
          }
        : null,
  };
}

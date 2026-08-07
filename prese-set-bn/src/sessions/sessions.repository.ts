import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { ProgramMode } from '@prisma/client';
import { auditCreate, auditUpdate } from '../common/audit';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';

export type SessionView = {
  id: string;
  userId: string;
  programId: string | null;
  mode: ProgramMode;
  startedAt: Date;
  endedAt: Date | null;
  completed: boolean;
  summaryJson: unknown;
  program: {
    id: string;
    name: string;
    mode: ProgramMode;
  } | null;
};

type SessionRow = {
  id: string;
  user_id: string;
  program_id: string | null;
  mode: ProgramMode;
  started_at: Date;
  ended_at: Date | null;
  completed: boolean;
  summary_json: unknown;
  program_name: string | null;
  program_mode: ProgramMode | null;
};

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByUserId(userId: string): Promise<SessionView[]> {
    const rows = await this.prisma.$queryRawUnsafe<SessionRow[]>(
      `
      SELECT
        s.id,
        s.user_id,
        s.program_id,
        s.mode,
        s.started_at,
        s.ended_at,
        s.completed,
        s.summary_json,
        p.name AS program_name,
        p.mode AS program_mode
      FROM workout_sessions s
      LEFT JOIN programs p
        ON p.id = s.program_id
       AND p.is_delete = false
      WHERE s.user_id = $1
        AND s.is_delete = false
      ORDER BY s.started_at DESC
      `,
      userId,
    );
    return rows.map(mapSession);
  }

  async findMeta(
    id: string,
  ): Promise<{ id: string; userId: string } | null> {
    const rows = await this.prisma.$queryRawUnsafe<
      { id: string; user_id: string }[]
    >(
      `
      SELECT id, user_id
      FROM workout_sessions
      WHERE id = $1
        AND is_delete = false
      LIMIT 1
      `,
      id,
    );
    const row = rows[0];
    return row ? { id: row.id, userId: row.user_id } : null;
  }

  async create(userId: string, dto: CreateSessionDto): Promise<SessionView> {
    const id = createId();
    const audit = auditCreate(userId);

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO workout_sessions (
        id, user_id, program_id, mode, started_at, ended_at, completed, summary_json,
        create_date, create_by, update_date, update_by, is_delete
      ) VALUES (
        $1, $2, $3, $4::"ProgramMode", $5, $6, $7, $8::jsonb,
        $9, $10, $11, $12, false
      )
      `,
      id,
      userId,
      dto.programId ?? null,
      dto.mode,
      new Date(dto.startedAt),
      dto.endedAt ? new Date(dto.endedAt) : null,
      dto.completed ?? false,
      dto.summaryJson ? JSON.stringify(dto.summaryJson) : null,
      audit.createDate,
      audit.createBy,
      audit.updateDate,
      audit.updateBy,
    );

    const created = await this.findById(id);
    if (!created) throw new Error('Session create failed');
    return created;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateSessionDto,
  ): Promise<SessionView> {
    const audit = auditUpdate(userId);
    await this.prisma.$executeRawUnsafe(
      `
      UPDATE workout_sessions
      SET
        ended_at = COALESCE($1, ended_at),
        completed = COALESCE($2, completed),
        summary_json = COALESCE($3::jsonb, summary_json),
        update_date = $4,
        update_by = $5
      WHERE id = $6
        AND is_delete = false
      `,
      dto.endedAt ? new Date(dto.endedAt) : null,
      dto.completed ?? null,
      dto.summaryJson ? JSON.stringify(dto.summaryJson) : null,
      audit.updateDate,
      audit.updateBy,
      id,
    );

    const updated = await this.findById(id);
    if (!updated) throw new Error('Session update failed');
    return updated;
  }

  private async findById(id: string): Promise<SessionView | null> {
    const rows = await this.prisma.$queryRawUnsafe<SessionRow[]>(
      `
      SELECT
        s.id,
        s.user_id,
        s.program_id,
        s.mode,
        s.started_at,
        s.ended_at,
        s.completed,
        s.summary_json,
        p.name AS program_name,
        p.mode AS program_mode
      FROM workout_sessions s
      LEFT JOIN programs p
        ON p.id = s.program_id
       AND p.is_delete = false
      WHERE s.id = $1
        AND s.is_delete = false
      LIMIT 1
      `,
      id,
    );
    return rows[0] ? mapSession(rows[0]) : null;
  }
}

function mapSession(row: SessionRow): SessionView {
  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    mode: row.mode,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    completed: row.completed,
    summaryJson: row.summary_json,
    program:
      row.program_id && row.program_name && row.program_mode
        ? {
            id: row.program_id,
            name: row.program_name,
            mode: row.program_mode,
          }
        : null,
  };
}

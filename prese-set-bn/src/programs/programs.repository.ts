import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import { auditCreate, auditUpdate } from '../common/audit';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProgramDto,
  ExerciseStepDto,
  UpdateProgramDto,
} from './dto/program.dto';

import {
  ExerciseStepRow,
  mapProgram,
  ProgramRow,
  ProgramView,
} from './programs.types';

@Injectable()
export class ProgramsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByUserId(userId: string): Promise<ProgramView[]> {
    const programs = await this.prisma.$queryRawUnsafe<ProgramRow[]>(
      `
      SELECT id, user_id, name, mode
      FROM programs
      WHERE user_id = $1
        AND is_delete = false
      ORDER BY create_date DESC
      `,
      userId,
    );

    const result: ProgramView[] = [];
    for (const program of programs) {
      const steps = await this.findStepsByProgramId(program.id);
      result.push(mapProgram(program, steps));
    }
    return result;
  }

  async findById(id: string): Promise<ProgramView | null> {
    const rows = await this.prisma.$queryRawUnsafe<ProgramRow[]>(
      `
      SELECT id, user_id, name, mode
      FROM programs
      WHERE id = $1
        AND is_delete = false
      LIMIT 1
      `,
      id,
    );
    const program = rows[0];
    if (!program) return null;
    const steps = await this.findStepsByProgramId(program.id);
    return mapProgram(program, steps);
  }

  async findOwnerId(id: string): Promise<string | null> {
    const rows = await this.prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `
      SELECT user_id
      FROM programs
      WHERE id = $1
        AND is_delete = false
      LIMIT 1
      `,
      id,
    );
    return rows[0]?.user_id ?? null;
  }

  async create(userId: string, dto: CreateProgramDto): Promise<ProgramView> {
    const id = createId();
    const audit = auditCreate(userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
        INSERT INTO programs (
          id, user_id, name, mode,
          create_date, create_by, update_date, update_by, is_delete
        ) VALUES (
          $1, $2, $3, $4::"ProgramMode",
          $5, $6, $7, $8, $9
        )
        `,
        id,
        userId,
        dto.name,
        dto.mode,
        audit.createDate,
        audit.createBy,
        audit.updateDate,
        audit.updateBy,
        audit.isDelete,
      );

      if (dto.steps?.length) {
        await this.insertSteps(tx, id, userId, dto.steps, audit.createDate);
      }
    });

    const created = await this.findById(id);
    if (!created) throw new Error('Program create failed');
    return created;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProgramDto,
  ): Promise<ProgramView> {
    const audit = auditUpdate(userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
        UPDATE programs
        SET
          name = COALESCE($1, name),
          mode = COALESCE($2::"ProgramMode", mode),
          update_date = $3,
          update_by = $4
        WHERE id = $5
          AND is_delete = false
        `,
        dto.name ?? null,
        dto.mode ?? null,
        audit.updateDate,
        audit.updateBy,
        id,
      );

      if (dto.steps) {
        await tx.$executeRawUnsafe(
          `
          DELETE FROM exercise_steps
          WHERE program_id = $1
          `,
          id,
        );
        await this.insertSteps(tx, id, userId, dto.steps, audit.updateDate);
      }
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error('Program update failed');
    return updated;
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
        DELETE FROM exercise_steps
        WHERE program_id = $1
        `,
        id,
      );
      await tx.$executeRawUnsafe(
        `
        UPDATE programs
        SET
          is_delete = true,
          update_date = $1,
          update_by = $2
        WHERE id = $3
          AND is_delete = false
        `,
        now,
        userId,
        id,
      );
    });
  }

  private async findStepsByProgramId(
    programId: string,
  ): Promise<ExerciseStepRow[]> {
    return this.prisma.$queryRawUnsafe<ExerciseStepRow[]>(
      `
      SELECT
        id,
        program_id,
        "order",
        title,
        instruction,
        media_url,
        work_seconds,
        rest_seconds,
        rounds,
        reps,
        sets,
        rest_between_sets_seconds
      FROM exercise_steps
      WHERE program_id = $1
        AND is_delete = false
      ORDER BY "order" ASC
      `,
      programId,
    );
  }

  private async insertSteps(
    tx: Prisma.TransactionClient,
    programId: string,
    userId: string,
    steps: ExerciseStepDto[],
    createDate: Date,
  ): Promise<void> {
    for (const step of steps) {
      await tx.$executeRawUnsafe(
        `
        INSERT INTO exercise_steps (
          id, program_id, "order", title, instruction, media_url,
          work_seconds, rest_seconds, rounds, reps, sets, rest_between_sets_seconds,
          create_date, create_by, update_date, update_by, is_delete
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, NULL, NULL, false
        )
        `,
        createId(),
        programId,
        step.order,
        step.title,
        step.instruction ?? null,
        step.mediaUrl ?? null,
        step.workSeconds ?? null,
        step.restSeconds ?? null,
        step.rounds ?? null,
        step.reps ?? null,
        step.sets ?? null,
        step.restBetweenSetsSeconds ?? null,
        createDate,
        userId,
      );
    }
  }
}

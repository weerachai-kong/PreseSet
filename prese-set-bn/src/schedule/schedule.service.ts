import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpsertScheduleDto } from './dto/schedule.dto';
import { ScheduleRepository } from './schedule.repository';

@Injectable()
export class ScheduleService {
  constructor(private readonly scheduleRepo: ScheduleRepository) {}

  list(userId: string) {
    return this.scheduleRepo.listByUserId(userId);
  }

  today(userId: string) {
    return this.scheduleRepo.findToday(userId, new Date().getDay());
  }

  async upsert(userId: string, dto: UpsertScheduleDto) {
    const program = await this.scheduleRepo.findActiveProgramOwner(
      dto.programId,
    );
    if (!program) throw new NotFoundException('Program not found');
    if (program.userId !== userId) throw new ForbiddenException();
    return this.scheduleRepo.upsert(userId, dto.dayOfWeek, dto.programId);
  }

  async remove(userId: string, dayOfWeek: number) {
    const ok = await this.scheduleRepo.softDeleteByDay(userId, dayOfWeek);
    if (!ok) throw new NotFoundException('Schedule not found');
    return { ok: true };
  }
}

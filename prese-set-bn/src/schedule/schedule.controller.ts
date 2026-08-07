import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertScheduleDto } from './dto/schedule.dto';
import { ScheduleService } from './schedule.service';

class DeleteScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;
}

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Post('list')
  list(@CurrentUser() user: { id: string }) {
    return this.schedule.list(user.id);
  }

  @Post('today')
  today(@CurrentUser() user: { id: string }) {
    return this.schedule.today(user.id);
  }

  @Post('upsert')
  upsert(@CurrentUser() user: { id: string }, @Body() dto: UpsertScheduleDto) {
    return this.schedule.upsert(user.id, dto);
  }

  @Post('delete')
  remove(@CurrentUser() user: { id: string }, @Body() dto: DeleteScheduleDto) {
    return this.schedule.remove(user.id, dto.dayOfWeek);
  }
}

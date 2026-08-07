import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { SessionsService } from './sessions.service';

class UpdateSessionBodyDto extends UpdateSessionDto {
  @IsString()
  @MinLength(1)
  id!: string;
}

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post('list')
  list(@CurrentUser() user: { id: string }) {
    return this.sessions.list(user.id);
  }

  @Post('create')
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateSessionDto) {
    return this.sessions.create(user.id, dto);
  }

  @Post('update')
  update(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSessionBodyDto,
  ) {
    const { id, ...data } = dto;
    return this.sessions.update(user.id, id, data);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { ProgramsService } from './programs.service';

class ProgramIdDto {
  @IsString()
  @MinLength(1)
  id!: string;
}

class UpdateProgramBodyDto extends UpdateProgramDto {
  @IsString()
  @MinLength(1)
  id!: string;
}

@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Post('list')
  list(@CurrentUser() user: { id: string }) {
    return this.programs.list(user.id);
  }

  @Post('get')
  get(@CurrentUser() user: { id: string }, @Body() dto: ProgramIdDto) {
    return this.programs.get(user.id, dto.id);
  }

  @Post('create')
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateProgramDto) {
    return this.programs.create(user.id, dto);
  }

  @Post('update')
  update(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProgramBodyDto,
  ) {
    const { id, ...data } = dto;
    return this.programs.update(user.id, id, data);
  }

  @Post('delete')
  remove(@CurrentUser() user: { id: string }, @Body() dto: ProgramIdDto) {
    return this.programs.remove(user.id, dto.id);
  }
}

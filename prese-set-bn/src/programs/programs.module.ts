import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsRepository } from './programs.repository';
import { ProgramsService } from './programs.service';

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService, ProgramsRepository],
  exports: [ProgramsService],
})
export class ProgramsModule {}

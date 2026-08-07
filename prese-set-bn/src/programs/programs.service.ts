import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { ProgramsRepository } from './programs.repository';

@Injectable()
export class ProgramsService {
  constructor(private readonly programsRepo: ProgramsRepository) {}

  list(userId: string) {
    return this.programsRepo.listByUserId(userId);
  }

  async get(userId: string, id: string) {
    const program = await this.programsRepo.findById(id);
    if (!program) throw new NotFoundException('Program not found');
    if (program.userId !== userId) throw new ForbiddenException();
    return program;
  }

  create(userId: string, dto: CreateProgramDto) {
    return this.programsRepo.create(userId, dto);
  }

  async update(userId: string, id: string, dto: UpdateProgramDto) {
    await this.get(userId, id);
    return this.programsRepo.update(userId, id, dto);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.programsRepo.softDelete(userId, id);
    return { ok: true };
  }
}

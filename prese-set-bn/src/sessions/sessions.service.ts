import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { SessionsRepository } from './sessions.repository';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepo: SessionsRepository) {}

  list(userId: string) {
    return this.sessionsRepo.listByUserId(userId);
  }

  create(userId: string, dto: CreateSessionDto) {
    return this.sessionsRepo.create(userId, dto);
  }

  async update(userId: string, id: string, dto: UpdateSessionDto) {
    const session = await this.sessionsRepo.findMeta(id);
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return this.sessionsRepo.update(userId, id, dto);
  }
}

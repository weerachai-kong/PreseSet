import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from '../auth/dto/auth.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getProfile(userId: string) {
    const user = await this.usersRepo.findProfileById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.usersRepo.findProfileById(userId);
    if (!existing) throw new NotFoundException('User not found');
    const updated = await this.usersRepo.updateProfile(userId, dto);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
}

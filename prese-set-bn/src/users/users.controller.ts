import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateProfileDto } from '../auth/dto/auth.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post('me')
  me(@CurrentUser() user: { id: string }) {
    return this.users.getProfile(user.id);
  }

  @Post('update-me')
  update(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}

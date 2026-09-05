import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    if (await this.usersRepo.existsByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepo.createUser({
      email,
      passwordHash,
      displayName: dto.displayName,
      createBy: email,
    });

    return this.tokenResponse(user.id, user.email, user.displayName);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findAuthByEmail(dto.email.toLowerCase());
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.tokenResponse(user.id, user.email, user.displayName);
  }

  /** MVP: set a new password by email (no email verification yet). */
  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.usersRepo.findAuthByEmail(email);
    if (!user) throw new NotFoundException('Account not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.updatePasswordByEmail(email, passwordHash);
    return { ok: true };
  }

  private tokenResponse(id: string, email: string, displayName: string) {
    const accessToken = this.jwt.sign({ sub: id, email });
    return { accessToken, user: { id, email, displayName } };
  }
}

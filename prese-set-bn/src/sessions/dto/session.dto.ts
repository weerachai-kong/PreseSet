import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProgramMode } from '@prisma/client';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  programId?: string;

  @IsEnum(ProgramMode)
  mode!: ProgramMode;

  @IsDateString()
  startedAt!: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsObject()
  summaryJson?: Record<string, unknown>;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsObject()
  summaryJson?: Record<string, unknown>;
}

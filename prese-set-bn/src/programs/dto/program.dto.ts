import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProgramMode } from '@prisma/client';

export class ExerciseStepDto {
  @IsInt()
  @Min(1)
  order!: number;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsInt()
  workSeconds?: number;

  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @IsOptional()
  @IsInt()
  rounds?: number;

  @IsOptional()
  @IsInt()
  reps?: number;

  @IsOptional()
  @IsInt()
  sets?: number;

  @IsOptional()
  @IsInt()
  restBetweenSetsSeconds?: number;
}

export class CreateProgramDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(ProgramMode)
  mode!: ProgramMode;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseStepDto)
  steps?: ExerciseStepDto[];
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(ProgramMode)
  mode?: ProgramMode;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseStepDto)
  steps?: ExerciseStepDto[];
}

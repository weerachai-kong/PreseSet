import { IsInt, IsString, Max, Min } from 'class-validator';

export class UpsertScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  programId!: string;
}

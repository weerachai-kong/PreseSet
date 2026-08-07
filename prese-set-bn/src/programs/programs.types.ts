import { ProgramMode } from '@prisma/client';

export type ProgramRow = {
  id: string;
  user_id: string;
  name: string;
  mode: ProgramMode;
};

export type ExerciseStepRow = {
  id: string;
  program_id: string;
  order: number;
  title: string;
  instruction: string | null;
  media_url: string | null;
  work_seconds: number | null;
  rest_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  sets: number | null;
  rest_between_sets_seconds: number | null;
};

export type ProgramView = {
  id: string;
  userId: string;
  name: string;
  mode: ProgramMode;
  steps: {
    id: string;
    order: number;
    title: string;
    instruction: string | null;
    mediaUrl: string | null;
    workSeconds: number | null;
    restSeconds: number | null;
    rounds: number | null;
    reps: number | null;
    sets: number | null;
    restBetweenSetsSeconds: number | null;
  }[];
};

export function mapProgram(
  program: ProgramRow,
  steps: ExerciseStepRow[],
): ProgramView {
  return {
    id: program.id,
    userId: program.user_id,
    name: program.name,
    mode: program.mode,
    steps: steps.map((s) => ({
      id: s.id,
      order: s.order,
      title: s.title,
      instruction: s.instruction,
      mediaUrl: s.media_url,
      workSeconds: s.work_seconds,
      restSeconds: s.rest_seconds,
      rounds: s.rounds,
      reps: s.reps,
      sets: s.sets,
      restBetweenSetsSeconds: s.rest_between_sets_seconds,
    })),
  };
}

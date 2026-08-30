export type ProgramMode = "INTERVAL" | "REPS_SETS" | "MIXED";
export type StepKind = "INTERVAL" | "REPS_SETS";
export type Locale = "en" | "th";

export type ExerciseStep = {
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
};

export type Program = {
  id: string;
  userId: string;
  name: string;
  mode: ProgramMode;
  steps: ExerciseStep[];
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  beepEnabled: boolean;
  locale: Locale;
  waterReminderEnabled: boolean;
  waterReminderIntervalMinutes: number;
};

export type ScheduleEntry = {
  id: string;
  userId: string;
  dayOfWeek: number;
  programId: string;
  program: {
    id: string;
    name: string;
    mode: ProgramMode;
  } | null;
};

export type WorkoutSession = {
  id: string;
  userId: string;
  programId: string | null;
  mode: ProgramMode;
  startedAt: string;
  endedAt: string | null;
  completed: boolean;
  summaryJson: unknown;
  program: {
    id: string;
    name: string;
    mode: ProgramMode;
  } | null;
};

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

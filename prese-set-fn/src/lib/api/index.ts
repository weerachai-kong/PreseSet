import { apiPost } from "./client";
import type {
  AuthResponse,
  Program,
  ScheduleEntry,
  UserProfile,
  WorkoutSession,
} from "./types";

export { ApiError } from "./types";
export type {
  AuthResponse,
  Program,
  ScheduleEntry,
  UserProfile,
  WorkoutSession,
} from "./types";

export const authApi = {
  register(body: { email: string; password: string; displayName: string }) {
    return apiPost<AuthResponse>("/auth/register", body);
  },
  login(body: { email: string; password: string }) {
    return apiPost<AuthResponse>("/auth/login", body);
  },
  resetPassword(body: { email: string; newPassword: string }) {
    return apiPost<{ ok: boolean }>("/auth/reset-password", body);
  },
};

export const usersApi = {
  me(token: string) {
    return apiPost<UserProfile>("/users/me", {}, token);
  },
  updateMe(token: string, body: Partial<UserProfile>) {
    return apiPost<UserProfile>("/users/update-me", body, token);
  },
};

export const programsApi = {
  list(token: string) {
    return apiPost<Program[]>("/programs/list", {}, token);
  },
  get(token: string, id: string) {
    return apiPost<Program>("/programs/get", { id }, token);
  },
  create(
    token: string,
    body: {
      name: string;
      mode: Program["mode"];
      steps?: {
        order: number;
        title: string;
        instruction?: string;
        workSeconds?: number;
        restSeconds?: number;
        rounds?: number;
        reps?: number;
        sets?: number;
        restBetweenSetsSeconds?: number;
      }[];
    },
  ) {
    return apiPost<Program>("/programs/create", body, token);
  },
  update(
    token: string,
    id: string,
    body: {
      name?: string;
      mode?: Program["mode"];
      steps?: {
        order: number;
        title: string;
        instruction?: string;
        workSeconds?: number;
        restSeconds?: number;
        rounds?: number;
        reps?: number;
        sets?: number;
        restBetweenSetsSeconds?: number;
      }[];
    },
  ) {
    return apiPost<Program>("/programs/update", { id, ...body }, token);
  },
  delete(token: string, id: string) {
    return apiPost<{ ok: boolean }>("/programs/delete", { id }, token);
  },
};

export const scheduleApi = {
  list(token: string) {
    return apiPost<ScheduleEntry[]>("/schedule/list", {}, token);
  },
  today(token: string) {
    return apiPost<ScheduleEntry | null>("/schedule/today", {}, token);
  },
  upsert(token: string, dayOfWeek: number, programId: string) {
    return apiPost<ScheduleEntry>("/schedule/upsert", { dayOfWeek, programId }, token);
  },
  remove(token: string, dayOfWeek: number) {
    return apiPost<{ ok: boolean }>("/schedule/delete", { dayOfWeek }, token);
  },
};

export const sessionsApi = {
  list(token: string) {
    return apiPost<WorkoutSession[]>("/sessions/list", {}, token);
  },
  create(
    token: string,
    body: {
      programId?: string;
      mode: Program["mode"];
      startedAt: string;
      endedAt?: string;
      completed?: boolean;
      summaryJson?: Record<string, unknown>;
    },
  ) {
    return apiPost<WorkoutSession>("/sessions/create", body, token);
  },
};

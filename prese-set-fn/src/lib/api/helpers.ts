import type { ExerciseStep, Program, ProgramMode } from "./types";

/** UI day index: 0=Mon … 6=Sun → JS getDay(): 0=Sun … 6=Sat */
export function uiDayToApiDay(uiIndex: number) {
  return uiIndex === 6 ? 0 : uiIndex + 1;
}

export function apiDayToUiDay(apiDay: number) {
  return apiDay === 0 ? 6 : apiDay - 1;
}

export function estimateProgramMinutes(steps: ExerciseStep[]): number {
  if (steps.length === 0) return 0;
  let totalSec = 0;
  for (const step of steps) {
    if (step.workSeconds != null) {
      const rounds = step.rounds ?? 1;
      const rest = step.restSeconds ?? 0;
      totalSec += (step.workSeconds + rest) * rounds;
    } else if (step.reps != null && step.sets != null) {
      totalSec += step.reps * step.sets * 4;
      totalSec += (step.restBetweenSetsSeconds ?? 30) * Math.max(step.sets - 1, 0);
    } else {
      totalSec += 60;
    }
  }
  return Math.max(1, Math.round(totalSec / 60));
}

export function programSummary(program: Program) {
  return {
    id: program.id,
    name: program.name,
    mode: program.mode,
    stepCount: program.steps.length,
    durationMin: estimateProgramMinutes(program.steps),
  };
}

export function stepDetail(step: ExerciseStep, mode: ProgramMode): string {
  if (step.reps != null && step.sets != null) {
    const work =
      step.workSeconds != null ? ` · ${step.workSeconds}s work` : "";
    const rest =
      step.restBetweenSetsSeconds != null
        ? ` · rest ${step.restBetweenSetsSeconds}s`
        : "";
    return `${step.reps} reps × ${step.sets} sets${work}${rest}`;
  }
  if (step.workSeconds != null) {
    const rest = step.restSeconds ?? 0;
    const rounds = step.rounds != null ? ` × ${step.rounds} rounds` : "";
    return `${step.workSeconds}s work / ${rest}s rest${rounds}`;
  }
  if (mode === "INTERVAL") return "";
  return "";
}

export function formatSessionDuration(
  startedAt: string,
  endedAt: string | null,
): string {
  if (!endedAt) return "—";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatSessionDate(iso: string, locale: "en" | "th") {
  return new Date(iso).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

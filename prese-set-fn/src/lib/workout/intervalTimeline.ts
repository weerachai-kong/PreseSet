import { inferStepKind } from "@/lib/api/helpers";
import type { ExerciseStep, StepKind } from "@/lib/api/types";

export type IntervalPhase = "WORK" | "REST";

export type WorkoutSegment = {
  phase: IntervalPhase;
  /** Timed length, or estimate used for progress when `awaitConfirm` is true. */
  durationSec: number;
  stepTitle: string;
  stepOrder: number;
  stepKind: StepKind;
  round: number;
  totalRounds: number;
  /** Shown during reps work phases, e.g. "12 reps". */
  repsLabel?: string;
  repsTarget?: number;
  /** User must tap Complete Set — no countdown / no auto-advance. */
  awaitConfirm?: boolean;
};

/** @deprecated alias */
export type IntervalSegment = WorkoutSegment;

export function buildWorkoutTimeline(steps: ExerciseStep[]): WorkoutSegment[] {
  const segments: WorkoutSegment[] = [];

  for (const step of steps) {
    const kind = inferStepKind(step);

    if (kind === "INTERVAL" && step.workSeconds != null) {
      const rounds = Math.max(1, step.rounds ?? 1);
      const work = Math.max(1, step.workSeconds);
      const rest = Math.max(0, step.restSeconds ?? 0);

      for (let round = 1; round <= rounds; round++) {
        segments.push({
          phase: "WORK",
          durationSec: work,
          stepTitle: step.title,
          stepOrder: step.order,
          stepKind: "INTERVAL",
          round,
          totalRounds: rounds,
        });
        if (rest > 0) {
          segments.push({
            phase: "REST",
            durationSec: rest,
            stepTitle: step.title,
            stepOrder: step.order,
            stepKind: "INTERVAL",
            round,
            totalRounds: rounds,
          });
        }
      }
      continue;
    }

    if (kind === "REPS_SETS" && step.reps != null && step.sets != null) {
      const sets = Math.max(1, step.sets);
      const reps = Math.max(1, step.reps);
      const rest = Math.max(0, step.restBetweenSetsSeconds ?? 30);
      // Progress estimate only — work phase is manual confirm, not a timer.
      const estimateWork = Math.max(1, step.workSeconds ?? reps * 4);

      for (let set = 1; set <= sets; set++) {
        segments.push({
          phase: "WORK",
          durationSec: estimateWork,
          awaitConfirm: true,
          stepTitle: step.title,
          stepOrder: step.order,
          stepKind: "REPS_SETS",
          round: set,
          totalRounds: sets,
          repsLabel: `${reps} reps`,
          repsTarget: reps,
        });
        if (set < sets && rest > 0) {
          segments.push({
            phase: "REST",
            durationSec: rest,
            stepTitle: step.title,
            stepOrder: step.order,
            stepKind: "REPS_SETS",
            round: set,
            totalRounds: sets,
          });
        }
      }
    }
  }

  return segments;
}

export function buildIntervalTimeline(steps: ExerciseStep[]): WorkoutSegment[] {
  return buildWorkoutTimeline(steps);
}

export function firstSegmentIndexForStep(
  timeline: WorkoutSegment[],
  stepOrder: number,
): number {
  return timeline.findIndex((s) => s.stepOrder === stepOrder);
}

export function lastSegmentIndexForStep(
  timeline: WorkoutSegment[],
  stepOrder: number,
): number {
  let last = -1;
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].stepOrder === stepOrder) last = i;
  }
  return last;
}

export function totalTimelineSeconds(timeline: WorkoutSegment[]): number {
  return timeline.reduce((sum, seg) => sum + seg.durationSec, 0);
}

export function remainingTotalSeconds(
  timeline: WorkoutSegment[],
  segmentIndex: number,
  secondsLeft: number,
): number {
  const current = timeline[segmentIndex];
  if (!current) return 0;
  let rem = current.awaitConfirm ? current.durationSec : secondsLeft;
  for (let i = segmentIndex + 1; i < timeline.length; i++) {
    rem += timeline[i].durationSec;
  }
  return rem;
}

export function completedSeconds(
  timeline: WorkoutSegment[],
  segmentIndex: number,
  secondsLeft: number,
): number {
  let done = 0;
  for (let i = 0; i < segmentIndex; i++) {
    done += timeline[i].durationSec;
  }
  const current = timeline[segmentIndex];
  if (!current) return done;
  if (current.awaitConfirm) return done;
  return done + Math.max(0, current.durationSec - secondsLeft);
}

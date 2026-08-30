import { inferStepKind } from "@/lib/api/helpers";
import type { ExerciseStep, StepKind } from "@/lib/api/types";

export type IntervalPhase = "WORK" | "REST";

export type WorkoutSegment = {
  phase: IntervalPhase;
  durationSec: number;
  stepTitle: string;
  stepOrder: number;
  stepKind: StepKind;
  round: number;
  totalRounds: number;
  /** Shown during reps work phases, e.g. "12 reps". */
  repsLabel?: string;
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
      const work = Math.max(1, step.workSeconds ?? 45);
      const rest = Math.max(0, step.restBetweenSetsSeconds ?? 30);

      for (let set = 1; set <= sets; set++) {
        segments.push({
          phase: "WORK",
          durationSec: work,
          stepTitle: step.title,
          stepOrder: step.order,
          stepKind: "REPS_SETS",
          round: set,
          totalRounds: sets,
          repsLabel: `${step.reps} reps`,
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
  let rem = secondsLeft;
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
  const total = totalTimelineSeconds(timeline);
  return total - remainingTotalSeconds(timeline, segmentIndex, secondsLeft);
}

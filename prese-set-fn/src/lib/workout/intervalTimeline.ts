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
  /** True when this segment is part of a multi-exercise HIIT circuit. */
  inCircuit?: boolean;
  /** All step orders in this circuit (for playlist highlight during rest). */
  circuitStepOrders?: number[];
};

/** @deprecated alias */
export type IntervalSegment = WorkoutSegment;

/**
 * All consecutive INTERVAL steps form one circuit of N exercises:
 *   for round r = 1..maxRounds:
 *     work every step whose rounds >= r
 *     then rest (duration from the last step in the block)
 *
 * Example: Step1×2, Step2×2, Step3×3 →
 *   R1: S1 → S2 → S3 → Rest(S3)
 *   R2: S1 → S2 → S3 → Rest(S3)
 *   R3: S3 → Rest(S3)
 */
function takeIntervalCircuitBlock(
  steps: ExerciseStep[],
  start: number,
): ExerciseStep[] {
  const first = steps[start];
  if (!first || inferStepKind(first) !== "INTERVAL" || first.workSeconds == null) {
    return [];
  }

  const block: ExerciseStep[] = [first];
  let k = start;

  while (k + 1 < steps.length) {
    const next = steps[k + 1];
    if (
      !next ||
      inferStepKind(next) !== "INTERVAL" ||
      next.workSeconds == null
    ) {
      break;
    }
    block.push(next);
    k += 1;
  }

  return block;
}

function stepRounds(step: ExerciseStep): number {
  return Math.max(1, step.rounds ?? 1);
}

function pushIntervalCircuit(
  segments: WorkoutSegment[],
  block: ExerciseStep[],
) {
  const circuitRounds = Math.max(...block.map(stepRounds));
  const last = block[block.length - 1];
  const circuitRest = Math.max(0, last.restSeconds ?? 0);
  const multi = block.length > 1;
  const circuitStepOrders = block.map((s) => s.order);
  const circuitTitle = multi
    ? block.map((s) => s.title).join(" → ")
    : last.title;

  for (let round = 1; round <= circuitRounds; round++) {
    const active = block.filter((s) => stepRounds(s) >= round);
    if (active.length === 0) continue;

    for (const s of active) {
      segments.push({
        phase: "WORK",
        durationSec: Math.max(1, s.workSeconds ?? 1),
        stepTitle: s.title,
        stepOrder: s.order,
        stepKind: "INTERVAL",
        round,
        totalRounds: stepRounds(s),
        inCircuit: multi,
        circuitStepOrders: multi ? circuitStepOrders : undefined,
      });
    }

    if (circuitRest > 0) {
      segments.push({
        phase: "REST",
        durationSec: circuitRest,
        stepTitle: circuitTitle,
        stepOrder: last.order,
        stepKind: "INTERVAL",
        round,
        totalRounds: circuitRounds,
        inCircuit: multi,
        circuitStepOrders: multi ? circuitStepOrders : undefined,
      });
    }
  }
}

export function buildWorkoutTimeline(steps: ExerciseStep[]): WorkoutSegment[] {
  const segments: WorkoutSegment[] = [];
  let i = 0;

  while (i < steps.length) {
    const step = steps[i];
    const kind = inferStepKind(step);

    if (kind === "INTERVAL" && step.workSeconds != null) {
      const block = takeIntervalCircuitBlock(steps, i);
      pushIntervalCircuit(segments, block);
      i += block.length;
      continue;
    }

    if (kind === "REPS_SETS" && step.reps != null && step.sets != null) {
      const sets = Math.max(1, step.sets);
      const reps = Math.max(1, step.reps);
      const rest = Math.max(0, step.restBetweenSetsSeconds ?? 30);
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

    i += 1;
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

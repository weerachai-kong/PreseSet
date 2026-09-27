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
  /** Order of the first step in the circuit — identifies segments of one circuit. */
  circuitId?: number;
};

/** @deprecated alias */
export type IntervalSegment = WorkoutSegment;

function stepRounds(step: ExerciseStep): number {
  return Math.max(1, step.rounds ?? 1);
}

function isIntervalStep(step: ExerciseStep | undefined): step is ExerciseStep {
  return (
    step != null &&
    inferStepKind(step) === "INTERVAL" &&
    step.workSeconds != null
  );
}

/** An Interval step with 0s work is an explicit rest ("พัก (Rest)"). */
function isRestOnlyStep(step: ExerciseStep): boolean {
  return (step.workSeconds ?? 0) <= 0;
}

/**
 * Groups consecutive Interval steps into one HIIT circuit. The circuit ends:
 * - after a rest-only step (0s work) — that step is the round rest
 * - before a step with a different number of rounds (e.g. Plank ×4 after ×5)
 * - before a Reps/Sets step
 *
 * Example: Jump×5, HighKnees×5, Rest(0s work, 30s rest)×5, Plank×4 →
 *   (Jump → HighKnees → Rest 30s) × 5, then (Plank → Rest) × 4
 */
function takeIntervalCircuitBlock(
  steps: ExerciseStep[],
  start: number,
): ExerciseStep[] {
  const first = steps[start];
  if (!isIntervalStep(first)) return [];

  const block: ExerciseStep[] = [first];
  if (isRestOnlyStep(first)) return block;

  const rounds = stepRounds(first);
  let k = start;

  while (k + 1 < steps.length) {
    const next = steps[k + 1];
    if (!isIntervalStep(next)) break;
    if (isRestOnlyStep(next)) {
      block.push(next);
      break;
    }
    if (stepRounds(next) !== rounds) break;
    block.push(next);
    k += 1;
  }

  return block;
}

function pushIntervalCircuit(
  segments: WorkoutSegment[],
  block: ExerciseStep[],
) {
  const last = block[block.length - 1];
  const restStep = isRestOnlyStep(last) ? last : null;
  const workSteps = restStep ? block.slice(0, -1) : block;
  const circuitRounds = Math.max(
    ...(workSteps.length > 0 ? workSteps : block).map(stepRounds),
  );
  const restOwner = restStep ?? last;
  const circuitRest = Math.max(0, restOwner.restSeconds ?? 0);
  const multi = block.length > 1;
  const circuitId = block[0].order;

  for (let round = 1; round <= circuitRounds; round++) {
    for (const s of workSteps) {
      segments.push({
        phase: "WORK",
        durationSec: Math.max(1, s.workSeconds ?? 1),
        stepTitle: s.title,
        stepOrder: s.order,
        stepKind: "INTERVAL",
        round,
        totalRounds: circuitRounds,
        inCircuit: multi,
        circuitId,
      });
    }

    if (circuitRest > 0) {
      segments.push({
        phase: "REST",
        durationSec: circuitRest,
        stepTitle: restOwner.title,
        stepOrder: restOwner.order,
        stepKind: "INTERVAL",
        round,
        totalRounds: circuitRounds,
        inCircuit: multi,
        circuitId,
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

import { inferStepKind } from "@/lib/api/helpers";
import type { ExerciseStep } from "@/lib/api/types";

export type IntervalPhase = "WORK" | "REST";

export type IntervalSegment = {
  phase: IntervalPhase;
  durationSec: number;
  stepTitle: string;
  stepOrder: number;
  round: number;
  totalRounds: number;
};

export function buildIntervalTimeline(steps: ExerciseStep[]): IntervalSegment[] {
  const segments: IntervalSegment[] = [];

  for (const step of steps) {
    if (inferStepKind(step) !== "INTERVAL" || step.workSeconds == null) continue;

    const rounds = Math.max(1, step.rounds ?? 1);
    const work = Math.max(1, step.workSeconds);
    const rest = Math.max(0, step.restSeconds ?? 0);

    for (let round = 1; round <= rounds; round++) {
      segments.push({
        phase: "WORK",
        durationSec: work,
        stepTitle: step.title,
        stepOrder: step.order,
        round,
        totalRounds: rounds,
      });
      if (rest > 0) {
        segments.push({
          phase: "REST",
          durationSec: rest,
          stepTitle: step.title,
          stepOrder: step.order,
          round,
          totalRounds: rounds,
        });
      }
    }
  }

  return segments;
}

export function totalTimelineSeconds(timeline: IntervalSegment[]): number {
  return timeline.reduce((sum, seg) => sum + seg.durationSec, 0);
}

export function remainingTotalSeconds(
  timeline: IntervalSegment[],
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
  timeline: IntervalSegment[],
  segmentIndex: number,
  secondsLeft: number,
): number {
  const total = totalTimelineSeconds(timeline);
  return total - remainingTotalSeconds(timeline, segmentIndex, secondsLeft);
}

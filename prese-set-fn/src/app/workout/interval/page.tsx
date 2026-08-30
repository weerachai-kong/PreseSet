"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Pause, Play, SkipForward, Square } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageLoading } from "@/components/LoginPrompt";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi, scheduleApi, sessionsApi } from "@/lib/api";
import type { Program } from "@/lib/api/types";
import { inferStepKind, stepDetail } from "@/lib/api/helpers";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useSettings } from "@/lib/settings/SettingsContext";
import { formatClock } from "@/lib/workout/formatTime";
import {
  beepVolumeGain,
  playPhaseEndBeeps,
  playWorkoutCompleteBeeps,
  primeWorkoutAudio,
} from "@/lib/workout/workoutBeeps";
import {
  buildWorkoutTimeline,
  completedSeconds,
  firstSegmentIndexForStep,
  lastSegmentIndexForStep,
  remainingTotalSeconds,
  totalTimelineSeconds,
  type WorkoutSegment,
} from "@/lib/workout/intervalTimeline";
import { storeSessionSummary } from "@/lib/workout/sessionSummary";

function IntervalWorkoutContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");
  const { token, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingProgram, setMissingProgram] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(true);
  const [finished, setFinished] = useState(false);
  /** Per-step segment index to resume when jumping back in the playlist. */
  const [stepResumeIndex, setStepResumeIndex] = useState<Record<number, number>>(
    {},
  );
  const prevSegmentRef = useRef<number | null>(null);
  const finishedBeepRef = useRef(false);
  const workoutStartedAtRef = useRef<Date | null>(null);
  const sessionSaveRef = useRef(false);

  const timeline = useMemo(
    () => (program ? buildWorkoutTimeline(program.steps) : []),
    [program],
  );

  const playlist = useMemo(() => {
    if (!program) return [];
    return program.steps.map((step) => {
      const kind = inferStepKind(step);
      const firstIdx = firstSegmentIndexForStep(timeline, step.order);
      const lastIdx = lastSegmentIndexForStep(timeline, step.order);
      const hasTimeline = firstIdx >= 0;
      const resumeIdx = stepResumeIndex[step.order] ?? firstIdx;
      const isActive =
        hasTimeline && segmentIndex >= firstIdx && segmentIndex <= lastIdx;
      const isDone = hasTimeline && resumeIdx > lastIdx;
      return {
        step,
        kind,
        detail: stepDetail(step, kind),
        firstIdx,
        isActive,
        isDone,
        hasTimeline,
      };
    });
  }, [program, timeline, segmentIndex, stepResumeIndex]);

  const current: WorkoutSegment | null = timeline[segmentIndex] ?? null;
  const totalSec = totalTimelineSeconds(timeline);
  const remainingTotal = remainingTotalSeconds(timeline, segmentIndex, secondsLeft);
  const progress =
    totalSec > 0
      ? Math.min(
          100,
          (completedSeconds(timeline, segmentIndex, secondsLeft) / totalSec) *
            100,
        )
      : 0;

  const setSegmentAt = useCallback(
    (idx: number) => {
      const seg = timeline[idx];
      if (seg) {
        setStepResumeIndex((prev) => ({
          ...prev,
          [seg.stepOrder]: idx,
        }));
      }
      setSegmentIndex(idx);
      setSecondsLeft(timeline[idx]?.durationSec ?? 0);
    },
    [timeline],
  );

  const jumpToStep = useCallback(
    (stepOrder: number) => {
      const first = firstSegmentIndexForStep(timeline, stepOrder);
      const last = lastSegmentIndexForStep(timeline, stepOrder);
      if (first < 0) return;

      let idx = stepResumeIndex[stepOrder] ?? first;
      if (idx > last) idx = first;

      primeWorkoutAudio();
      setSegmentAt(idx);
      setFinished(false);
    },
    [timeline, stepResumeIndex, setSegmentAt],
  );

  const markStepCompleteIfNeeded = useCallback(
    (idx: number) => {
      const seg = timeline[idx];
      if (!seg) return;
      const last = lastSegmentIndexForStep(timeline, seg.stepOrder);
      if (idx === last) {
        setStepResumeIndex((prev) => ({
          ...prev,
          [seg.stepOrder]: last + 1,
        }));
      }
    },
    [timeline],
  );

  const advanceSegment = useCallback(() => {
    setSegmentIndex((idx) => {
      markStepCompleteIfNeeded(idx);
      const next = idx + 1;
      if (next >= timeline.length) {
        setFinished(true);
        return idx;
      }
      const seg = timeline[next];
      if (seg) {
        setStepResumeIndex((prev) => ({
          ...prev,
          [seg.stepOrder]: next,
        }));
      }
      setSecondsLeft(timeline[next].durationSec);
      return next;
    });
  }, [timeline, markStepCompleteIfNeeded]);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.replace("/welcome");
      return;
    }

    let cancelled = false;

    async function loadProgram() {
      if (!token) return;
      setLoading(true);
      setMissingProgram(false);

      try {
        let id = programId;
        if (!id) {
          const today = await scheduleApi.today(token);
          id = today?.programId ?? null;
        }

        if (!id) {
          if (!cancelled) setMissingProgram(true);
          return;
        }

        const data = await programsApi.get(token, id);
        if (cancelled) return;

        setProgram(data);
        const built = buildWorkoutTimeline(data.steps);
        const first = built[0];
        setStepResumeIndex(first ? { [first.stepOrder]: 0 } : {});
        setSegmentIndex(0);
        setSecondsLeft(first?.durationSec ?? 0);
        setPaused(true);
        setFinished(false);
        prevSegmentRef.current = null;
        finishedBeepRef.current = false;
        workoutStartedAtRef.current = null;
        sessionSaveRef.current = false;
        primeWorkoutAudio();
      } catch {
        if (!cancelled) router.replace("/home");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProgram();

    return () => {
      cancelled = true;
    };
  }, [programId, token, authLoading, router]);

  useEffect(() => {
    if (loading || !settings.beepEnabled || timeline.length === 0) return;

    if (prevSegmentRef.current === null) {
      prevSegmentRef.current = segmentIndex;
      return;
    }

    if (prevSegmentRef.current === segmentIndex) return;

    const ended = timeline[prevSegmentRef.current];
    if (ended) {
      playPhaseEndBeeps(
        ended.phase,
        beepVolumeGain(settings.beepVolume),
        settings.beepSoundPreset,
      );
    }
    prevSegmentRef.current = segmentIndex;
  }, [
    segmentIndex,
    loading,
    timeline,
    settings.beepEnabled,
    settings.beepVolume,
    settings.beepSoundPreset,
  ]);

  useEffect(() => {
    if (!finished || !settings.beepEnabled || finishedBeepRef.current) return;
    finishedBeepRef.current = true;
    playWorkoutCompleteBeeps(
      beepVolumeGain(settings.beepVolume),
      settings.beepSoundPreset,
    );
  }, [finished, settings.beepEnabled, settings.beepVolume, settings.beepSoundPreset]);

  useEffect(() => {
    if (loading || paused || finished || !current || secondsLeft <= 0) return;

    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [loading, paused, finished, current, secondsLeft]);

  useEffect(() => {
    if (!finished || !program || !token || sessionSaveRef.current) return;
    sessionSaveRef.current = true;

    const endedAt = new Date();
    const startedAt = workoutStartedAtRef.current ?? endedAt;
    const elapsedSec = Math.max(
      0,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );
    const workSegments = timeline.filter((segment) => segment.phase === "WORK");
    const summary = {
      programId: program.id,
      programName: program.name,
      mode: program.mode,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      totalSeconds: elapsedSec,
      roundsCompleted: workSegments.length,
      roundsTotal: workSegments.length,
      saved: false,
    };

    void (async () => {
      try {
        await sessionsApi.create(token, {
          programId: program.id,
          mode: program.mode,
          startedAt: summary.startedAt,
          endedAt: summary.endedAt,
          completed: true,
          summaryJson: {
            programName: program.name,
            totalSeconds: elapsedSec,
            roundsCompleted: summary.roundsCompleted,
            roundsTotal: summary.roundsTotal,
          },
        });
        storeSessionSummary({ ...summary, saved: true });
      } catch {
        storeSessionSummary(summary);
      }
      router.push("/summary");
    })();
  }, [finished, program, token, timeline, router]);

  useEffect(() => {
    if (loading || paused || finished || secondsLeft > 0) return;
    queueMicrotask(() => advanceSegment());
  }, [loading, paused, finished, secondsLeft, advanceSegment]);

  const onSkip = () => {
    if (finished || timeline.length === 0) return;
    if (segmentIndex >= timeline.length - 1) {
      markStepCompleteIfNeeded(segmentIndex);
      setFinished(true);
      return;
    }
    markStepCompleteIfNeeded(segmentIndex);
    const next = segmentIndex + 1;
    setSegmentAt(next);
  };

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (missingProgram) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-medium text-foreground">
          {t("noProgramAssigned")}
        </p>
        <p className="mt-2 text-sm text-muted">{t("workoutNoProgram")}</p>
        <Link href="/home" className="mt-6 text-sm font-medium text-lime underline">
          {t("backHome")}
        </Link>
      </div>
    );
  }

  if (!program || timeline.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted">{t("noIntervalSteps")}</p>
        <Link href="/home" className="mt-4 text-sm font-medium text-lime underline">
          {t("backHome")}
        </Link>
      </div>
    );
  }

  const phaseLabel = current?.phase === "REST" ? t("rest") : t("work");
  const roundLabel =
    current?.stepKind === "REPS_SETS"
      ? `${current.round} / ${current.totalRounds} ${t("setsCount")}`
      : current
        ? `${current.round} / ${current.totalRounds}`
        : "—";

  return (
    <div className="flex h-full min-h-0 flex-col px-6 pt-8 pb-6">
      <div className="shrink-0 rounded-2xl bg-surface p-4 app-card">
        <p className="truncate text-center text-xs font-bold uppercase tracking-wide text-muted">
          {program.name}
        </p>

        <div className="mt-3 rounded-2xl border-2 border-lime/35 bg-display px-3 py-4 text-center">
          <span className="inline-block rounded-xl bg-lime px-3 py-1 text-xs font-bold text-white">
            {phaseLabel}
          </span>
          <div className="timer-font mt-1 text-5xl font-extrabold text-accent-dark">
            {formatClock(secondsLeft)}
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {current?.stepTitle}
          </p>
          {current?.phase === "WORK" && current.repsLabel ? (
            <p className="mt-0.5 text-xs font-semibold text-lime">
              {current.repsLabel}
            </p>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface-muted p-2.5 text-center">
            <p className="text-sm font-bold text-foreground">{roundLabel}</p>
            <p className="text-[10px] text-muted">{t("rounds")}</p>
          </div>
          <div className="rounded-xl bg-surface-muted p-2.5 text-center">
            <p className="text-sm font-bold text-foreground">
              {formatClock(remainingTotal)}
            </p>
            <p className="text-[10px] text-muted">{t("remainingTotal")}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          {t("workoutPlaylist")}
        </p>
        <ul className="space-y-2 pb-2">
          {playlist.map(({ step, kind, detail, isActive, isDone, hasTimeline }) => (
            <li key={step.id}>
              <button
                type="button"
                disabled={!hasTimeline || isActive}
                onClick={() => jumpToStep(step.order)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                  isActive
                    ? "border-lime/50 bg-lime/10"
                    : isDone
                      ? "border-border bg-surface-muted/80 opacity-70"
                      : "border-border bg-surface app-card hover:border-lime/30"
                } disabled:cursor-default`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-lime text-white"
                      : isDone
                        ? "bg-surface-muted text-muted"
                        : "bg-surface-muted text-foreground/70"
                  }`}
                >
                  {step.order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isActive ? "text-foreground" : "text-foreground/90"
                      }`}
                    >
                      {step.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-muted">
                      {kind === "INTERVAL"
                        ? t("stepModeInterval")
                        : t("stepModeReps")}
                    </span>
                  </div>
                  {detail ? (
                    <p className="mt-0.5 truncate text-xs text-muted">{detail}</p>
                  ) : null}
                  <p className="mt-1 text-[10px] font-medium text-lime">
                    {isActive
                      ? t("workoutStepActive")
                      : isDone
                        ? t("workoutStepDone")
                        : t("workoutStepUpcoming")}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 pt-3">
        <div className="mb-4 h-1 w-full rounded-full bg-surface-muted">
          <div
            className="h-1 rounded-full bg-lime transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-center gap-6">
          <Link
            href="/home"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-surface app-card"
          >
            <Square className="h-5 w-5 text-muted" />
          </Link>
          <button
            type="button"
            onClick={() => {
              primeWorkoutAudio();
              setPaused((p) => {
                if (p && !workoutStartedAtRef.current) {
                  workoutStartedAtRef.current = new Date();
                }
                return !p;
              });
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-lime app-card"
          >
            {paused ? (
              <Play className="h-7 w-7 text-white" />
            ) : (
              <Pause className="h-7 w-7 text-white" />
            )}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-surface app-card"
            aria-label={t("skip")}
          >
            <SkipForward className="h-5 w-5 text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntervalWorkoutPage() {
  return (
    <PhoneShell>
      <Suspense fallback={<PageLoading />}>
        <IntervalWorkoutContent />
      </Suspense>
    </PhoneShell>
  );
}

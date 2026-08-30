"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Pause, Play, SkipForward, Square } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageLoading } from "@/components/LoginPrompt";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi, scheduleApi } from "@/lib/api";
import type { Program } from "@/lib/api/types";
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
  buildIntervalTimeline,
  completedSeconds,
  remainingTotalSeconds,
  totalTimelineSeconds,
  type IntervalSegment,
} from "@/lib/workout/intervalTimeline";

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
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const prevSegmentRef = useRef<number | null>(null);
  const finishedBeepRef = useRef(false);

  const timeline = useMemo(
    () => (program ? buildIntervalTimeline(program.steps) : []),
    [program],
  );

  const current: IntervalSegment | null = timeline[segmentIndex] ?? null;
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

  const advanceSegment = useCallback(() => {
    setSegmentIndex((idx) => {
      const next = idx + 1;
      if (next >= timeline.length) {
        setFinished(true);
        return idx;
      }
      setSecondsLeft(timeline[next].durationSec);
      return next;
    });
  }, [timeline]);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.replace("/welcome");
      return;
    }

    let cancelled = false;

    async function loadProgram() {
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
        const built = buildIntervalTimeline(data.steps);
        setSegmentIndex(0);
        setSecondsLeft(built[0]?.durationSec ?? 0);
        setPaused(false);
        setFinished(false);
        prevSegmentRef.current = null;
        finishedBeepRef.current = false;
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
    if (finished) {
      router.push("/summary");
    }
  }, [finished, router]);

  useEffect(() => {
    if (loading || paused || finished || secondsLeft > 0) return;
    queueMicrotask(() => advanceSegment());
  }, [loading, paused, finished, secondsLeft, advanceSegment]);

  const onSkip = () => {
    if (finished || timeline.length === 0) return;
    if (segmentIndex >= timeline.length - 1) {
      setFinished(true);
      return;
    }
    const next = segmentIndex + 1;
    setSegmentIndex(next);
    setSecondsLeft(timeline[next].durationSec);
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
  const roundLabel = current
    ? `${current.round} / ${current.totalRounds}`
    : "—";

  return (
    <div className="flex h-full flex-col px-6 pt-10 pb-8">
      <div className="flex flex-1 flex-col">
        <div className="rounded-3xl bg-surface p-5 app-card">
          <p className="truncate text-center text-xs font-bold uppercase tracking-wide text-muted">
            {program.name}
          </p>

          <div className="mt-4 rounded-2xl border-2 border-lime/35 bg-display px-4 py-6 text-center">
            <span className="inline-block rounded-xl bg-lime px-3 py-1 text-xs font-bold text-white">
              {phaseLabel}
            </span>
            <div className="timer-font mt-2 text-7xl font-extrabold text-accent-dark">
              {formatClock(secondsLeft)}
            </div>
            <p className="mt-2 text-base font-medium text-foreground">
              {current?.stepTitle}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-surface-muted p-3 text-center">
              <p className="text-base font-bold text-foreground">{roundLabel}</p>
              <p className="text-[11px] text-muted">{t("rounds")}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-3 text-center">
              <p className="text-base font-bold text-foreground">
                {formatClock(remainingTotal)}
              </p>
              <p className="text-[11px] text-muted">{t("remainingTotal")}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="mb-6 h-1 w-full rounded-full bg-surface-muted">
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
                setPaused((p) => !p);
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
            >
              <SkipForward className="h-5 w-5 text-muted" />
            </button>
          </div>
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

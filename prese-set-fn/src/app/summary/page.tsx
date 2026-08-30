"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { sessionsApi } from "@/lib/api";
import { programModeLabel } from "@/lib/api/helpers";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { formatClock } from "@/lib/workout/formatTime";
import {
  clearSessionSummary,
  readSessionSummary,
  storeSessionSummary,
  subscribeSessionSummary,
  type SessionSummary,
} from "@/lib/workout/sessionSummary";

export default function SummaryPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { token } = useAuth();
  const summary = useSyncExternalStore(
    subscribeSessionSummary,
    readSessionSummary,
    () => null,
  );
  const [saving, setSaving] = useState(false);

  const saveSession = useCallback(
    async (data: SessionSummary) => {
      if (!token) return false;
      setSaving(true);
      try {
        await sessionsApi.create(token, {
          programId: data.programId,
          mode: data.mode,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          completed: true,
          summaryJson: {
            programName: data.programName,
            totalSeconds: data.totalSeconds,
            roundsCompleted: data.roundsCompleted,
            roundsTotal: data.roundsTotal,
          },
        });
        const saved = { ...data, saved: true };
        storeSessionSummary(saved);
        return true;
      } catch {
        return false;
      } finally {
        setSaving(false);
      }
    },
    [token],
  );

  const onSaveDone = async () => {
    if (!summary) {
      router.push("/history");
      return;
    }

    if (!summary.saved) {
      const ok = await saveSession(summary);
      if (!ok) return;
    }

    clearSessionSummary();
    router.push("/history");
  };

  if (!summary) {
    return (
      <PhoneShell>
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="text-sm text-muted">{t("workoutNoProgram")}</p>
          <Link href="/home" className="mt-6 text-sm font-medium text-lime underline">
            {t("backHome")}
          </Link>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div
        className="flex h-full flex-col items-center justify-center px-8 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, #fff3e0 0%, #f0f2f5 60%)",
        }}
      >
        <div className="timer-font mb-2 text-sm font-bold uppercase tracking-widest text-muted">
          Pace<span className="text-lime">Set</span>
        </div>
        <h2 className="timer-font mb-10 text-4xl font-black text-foreground">
          {t("sessionComplete")}
        </h2>

        <div className="w-full space-y-4 rounded-2xl bg-surface p-6 text-left app-card">
          <div className="flex justify-between">
            <span className="text-sm text-muted">{t("totalTime")}</span>
            <span className="font-bold text-foreground">
              {formatClock(summary.totalSeconds)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">{t("mode")}</span>
            <span className="font-bold text-foreground">
              {programModeLabel(summary.mode, t)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">{t("rounds")}</span>
            <span className="font-bold text-foreground">
              {summary.roundsCompleted} / {summary.roundsTotal}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">{t("program")}</span>
            <span className="font-bold text-foreground">{summary.programName}</span>
          </div>
        </div>

        {!summary.saved ? (
          <p className="mt-4 text-sm text-danger">{t("sessionSaveFailed")}</p>
        ) : null}

        <button
          type="button"
          disabled={saving}
          onClick={() => void onSaveDone()}
          className="mt-8 w-full rounded-xl bg-lime py-4 text-lg font-bold text-white disabled:opacity-60"
        >
          {saving ? "…" : t("saveDone")}
        </button>
        <Link href="/home" className="mt-4 text-sm text-muted underline">
          {t("backHome")}
        </Link>
      </div>
    </PhoneShell>
  );
}

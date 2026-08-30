"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi, scheduleApi } from "@/lib/api";
import { estimateProgramMinutes } from "@/lib/api/helpers";
import type { Program } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function HomePage() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [todayProgram, setTodayProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    scheduleApi
      .today(token)
      .then(async (entry) => {
        if (!entry?.programId) {
          setTodayProgram(null);
          return;
        }
        const program = await programsApi.get(token, entry.programId);
        setTodayProgram(program);
      })
      .catch(() => setTodayProgram(null))
      .finally(() => setLoading(false));
  }, [token]);

  const workoutHref =
    todayProgram?.mode === "REPS_SETS"
      ? "/workout/reps"
      : "/workout/interval";

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-6 pt-14 pb-4">
          <span className="timer-font text-xl font-bold text-white">
            Pace<span className="text-lime">Set</span>
          </span>
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface"
          >
            <User className="h-5 w-5 text-white" />
          </Link>
        </div>

        <div className="px-6 pt-6">
          <h2 className="mb-6 text-2xl font-bold text-white">{t("today")}</h2>

          {!token ? (
            <p className="rounded-2xl bg-surface p-6 text-sm text-muted">
              {t("loginRequired")}{" "}
              <Link href="/welcome" className="text-lime underline">
                {t("signIn")}
              </Link>
            </p>
          ) : loading ? (
            <p className="text-sm text-muted">{t("loading")}</p>
          ) : todayProgram ? (
            <div className="rounded-2xl bg-surface p-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-[#1a2a0a] px-2 py-0.5 text-xs font-semibold text-lime">
                  {todayProgram.mode === "INTERVAL"
                    ? t("interval")
                    : t("repsSets")}
                </span>
                <span className="text-xs text-muted">
                  {estimateProgramMinutes(todayProgram.steps)} {t("minutes")}
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold text-white">
                {todayProgram.name}
              </h3>
              <p className="text-sm text-muted">
                {todayProgram.steps.length} {t("steps")}
              </p>
            </div>
          ) : (
            <p className="rounded-2xl bg-surface p-6 text-sm text-muted">
              {t("noProgramAssigned")}{" "}
              <Link href="/schedule" className="text-lime underline">
                {t("schedule")}
              </Link>
            </p>
          )}

          {token && todayProgram ? (
            <Link
              href={workoutHref}
              className="mt-8 block w-full rounded-xl bg-lime py-4 text-center text-lg font-bold text-black"
            >
              {t("startWorkout")}
            </Link>
          ) : null}
        </div>
      </div>
    </PhoneShell>
  );
}

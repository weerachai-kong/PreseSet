"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeHeader } from "@/components/PageHeader";
import { PageContent } from "@/components/PageContent";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi, scheduleApi } from "@/lib/api";
import { estimateProgramMinutes, programModeLabel } from "@/lib/api/helpers";
import type { Program } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

type FetchResult = {
  key: string;
  program: Program | null;
};

export default function HomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const { token, isGuest, isLoading: authLoading } = useAuth();
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token && !isGuest) {
      router.replace("/welcome");
    }
  }, [authLoading, token, isGuest, router]);

  useEffect(() => {
    if (authLoading || !token) return;

    let cancelled = false;

    scheduleApi
      .today(token)
      .then(async (entry) => {
        if (cancelled) return;
        if (!entry?.programId) {
          setFetchResult({ key: token, program: null });
          return;
        }
        const program = await programsApi.get(token, entry.programId);
        if (!cancelled) setFetchResult({ key: token, program });
      })
      .catch(() => {
        if (!cancelled) setFetchResult({ key: token, program: null });
      });

    return () => {
      cancelled = true;
    };
  }, [token, authLoading]);

  const todayProgram =
    token && fetchResult?.key === token ? fetchResult.program : null;
  const loading = authLoading || Boolean(token && fetchResult?.key !== token);

  const workoutHref = todayProgram
    ? `/workout/interval?programId=${todayProgram.id}`
    : "/workout/interval";

  if (!authLoading && !token && !isGuest) {
    return (
      <PhoneShell showNav>
        <div className="flex h-full items-center justify-center px-6">
          <p className="text-sm text-muted">{t("loading")}</p>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <HomeHeader
          title={t("today")}
          subtitle={t("homeSubtitle")}
          profileHref="/profile"
          profileLabel={t("profile")}
        />

        <PageContent className="pb-6">
          {loading ? (
            <div className="flex flex-1 items-center justify-center pt-4">
              <p className="text-sm text-muted">{t("loading")}</p>
            </div>
          ) : isGuest ? (
            <div className="flex flex-1 flex-col justify-center space-y-4">
              <div className="rounded-2xl bg-surface p-6 app-card">
                <p className="text-base font-medium text-foreground">
                  {t("guestHomeTitle")}
                </p>
                <p className="mt-2 text-sm text-muted">{t("guestHomeHint")}</p>
              </div>
              <Link
                href="/programs"
                className="block w-full rounded-xl border border-lime/40 py-3 text-center text-sm font-medium text-lime"
              >
                {t("programs")}
              </Link>
              <Link
                href="/welcome"
                className="block w-full rounded-xl bg-lime py-4 text-center text-lg font-bold text-white"
              >
                {t("signIn")}
              </Link>
            </div>
          ) : todayProgram ? (
            <>
              <div className="rounded-2xl bg-surface p-6 app-card">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-lime/15 px-2 py-0.5 text-xs font-semibold text-lime">
                    {programModeLabel(todayProgram.mode, t)}
                  </span>
                  <span className="text-sm text-muted">
                    {estimateProgramMinutes(todayProgram.steps)} {t("minutes")}
                  </span>
                </div>
                <h3 className="mb-1 text-xl font-bold text-foreground">
                  {todayProgram.name}
                </h3>
                <p className="text-sm text-muted">
                  {todayProgram.steps.length} {t("steps")}
                </p>
              </div>
              <Link
                href={workoutHref}
                className="mt-8 block w-full rounded-xl bg-lime py-4 text-center text-lg font-bold text-white"
              >
                {t("startWorkout")}
              </Link>
            </>
          ) : (
            <div className="flex flex-1 flex-col justify-center">
              <div className="rounded-2xl bg-surface p-6 app-card">
                <p className="text-sm text-muted">
                  {t("noProgramAssigned")}
                </p>
                <Link
                  href="/schedule"
                  className="mt-4 inline-block text-sm font-medium text-lime underline"
                >
                  {t("schedule")}
                </Link>
              </div>
            </div>
          )}
        </PageContent>
      </div>
    </PhoneShell>
  );
}

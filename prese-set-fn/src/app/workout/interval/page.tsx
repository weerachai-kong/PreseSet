"use client";

import Link from "next/link";
import { Pause, SkipForward, Square } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function IntervalWorkoutPage() {
  const { t } = useLocale();

  return (
    <PhoneShell>
      <div className="flex h-full flex-col px-6 pt-14 pb-8">
        <div className="flex flex-1 flex-col">
          <div className="rounded-3xl bg-surface p-5 app-card">
            <p className="text-center text-xs font-bold uppercase tracking-wide text-muted">
              HIIT CARDIO WORKOUT
            </p>

            <div className="mt-4 rounded-2xl border-2 border-lime/35 bg-display px-4 py-6 text-center">
              <span className="inline-block rounded-xl bg-lime px-3 py-1 text-xs font-bold text-white">
                {t("work")}
              </span>
              <div className="timer-font mt-2 text-7xl font-extrabold text-accent-dark">
                00:15
              </div>
              <p className="mt-2 text-base font-medium text-foreground">
                High Knees
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-surface-muted p-3 text-center">
                <p className="text-base font-bold text-foreground">3 / 8</p>
                <p className="text-[11px] text-muted">{t("rounds")}</p>
              </div>
              <div className="rounded-xl bg-surface-muted p-3 text-center">
                <p className="text-base font-bold text-foreground">12:30</p>
                <p className="text-[11px] text-muted">{t("remaining")}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="mb-6 h-1 w-full rounded-full bg-surface-muted">
              <div className="h-1 rounded-full bg-lime" style={{ width: "37%" }} />
            </div>
            <div className="flex justify-center gap-6">
              <Link
                href="/summary"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-surface app-card"
              >
                <Square className="h-5 w-5 text-muted" />
              </Link>
              <button
                type="button"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-lime app-card"
              >
                <Pause className="h-7 w-7 text-white" />
              </button>
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-surface app-card"
              >
                <SkipForward className="h-5 w-5 text-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

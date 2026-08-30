"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function RepsWorkoutPage() {
  const { t } = useLocale();

  return (
    <PhoneShell>
      <div className="flex h-full flex-col px-6 pt-14 pb-8">
        <div className="flex flex-1 flex-col">
          <div className="rounded-3xl bg-surface p-5 app-card">
            <p className="text-center text-xl font-bold text-foreground">Squat</p>

            <div className="mt-6 text-center">
              <div className="timer-font mb-2 text-5xl font-black text-foreground">
                SET 2 / 4
              </div>
              <div className="timer-font mb-6 text-7xl font-black text-accent-dark">
                7 REPS
              </div>
              <div className="inline-block rounded-2xl bg-display px-8 py-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-lime">
                  {t("rest")}
                </p>
                <div className="timer-font text-5xl font-black text-accent-dark">
                  00:45
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-6">
            <Link
              href="/summary"
              className="block w-full rounded-xl bg-lime py-4 text-center text-lg font-bold text-white"
            >
              {t("completeSet")}
            </Link>
            <div className="flex justify-center gap-4">
              <button type="button" className="text-sm font-medium text-muted">
                {t("pause")}
              </button>
              <button type="button" className="text-sm font-medium text-muted">
                {t("skipRest")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

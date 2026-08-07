"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function RepsWorkoutPage() {
  const { t } = useLocale();

  return (
    <PhoneShell>
      <div className="relative flex h-full flex-col">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, #3a2010 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col">
          <div className="px-6 pt-14 text-center">
            <p className="text-xl font-bold text-white">Squat</p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="timer-font mb-2 text-5xl font-black text-white">
              SET 2 / 4
            </div>
            <div className="timer-font mb-8 text-7xl font-black text-white">
              7 REPS
            </div>
            <div className="inline-block rounded-2xl bg-[#2a1510] px-8 py-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-danger">
                {t("rest")}
              </p>
              <div className="timer-font text-5xl font-black text-danger">
                00:45
              </div>
            </div>
          </div>

          <div className="space-y-3 px-6 pb-8">
            <Link
              href="/summary"
              className="block w-full rounded-xl bg-lime py-4 text-center text-lg font-bold text-black"
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

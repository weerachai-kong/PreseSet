"use client";

import Link from "next/link";
import { Pause, SkipForward, Square } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function IntervalWorkoutPage() {
  const { t } = useLocale();

  return (
    <PhoneShell>
      <div className="relative flex h-full flex-col">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, #2a3a10 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col">
          <div className="px-6 pt-14 text-center">
            <span className="timer-font text-3xl font-black uppercase tracking-wider text-lime">
              {t("work")}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="timer-font text-[120px] leading-none font-black text-white">
              00:15
            </div>
            <p className="mt-4 text-lg font-medium text-white">High Knees</p>
            <p className="mt-1 text-sm text-muted">
              {t("rounds")} 3 / 8
            </p>
          </div>

          <div className="px-6 pb-6">
            <div className="mb-6 h-1 w-full rounded-full bg-[#222]">
              <div className="h-1 rounded-full bg-lime" style={{ width: "37%" }} />
            </div>
            <div className="flex justify-center gap-6">
              <Link
                href="/summary"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-surface"
              >
                <Square className="h-5 w-5 text-muted" />
              </Link>
              <button
                type="button"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-lime"
              >
                <Pause className="h-7 w-7 text-black" />
              </button>
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-surface"
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

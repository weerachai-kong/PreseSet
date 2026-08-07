"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function SummaryPage() {
  const { t } = useLocale();

  return (
    <PhoneShell>
      <div
        className="flex h-full flex-col items-center justify-center px-8 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, #1a2a0a 0%, #0B0D0F 60%)",
        }}
      >
        <div className="timer-font mb-2 text-sm font-bold uppercase tracking-widest text-muted">
          Pace<span className="text-lime">Set</span>
        </div>
        <h2 className="timer-font mb-10 text-4xl font-black text-white">
          {t("sessionComplete")}
        </h2>

        <div className="w-full space-y-4 rounded-2xl bg-surface p-6 text-left">
          <div className="flex justify-between">
            <span className="text-sm text-muted">{t("totalTime")}</span>
            <span className="font-bold text-white">18:42</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">{t("mode")}</span>
            <span className="font-bold text-white">{t("interval")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">{t("rounds")}</span>
            <span className="font-bold text-white">8 / 8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">{t("program")}</span>
            <span className="font-bold text-white">HIIT Burn 20</span>
          </div>
        </div>

        <Link
          href="/history"
          className="mt-8 w-full rounded-xl bg-lime py-4 text-lg font-bold text-black"
        >
          {t("saveDone")}
        </Link>
        <Link href="/home" className="mt-4 text-sm text-muted underline">
          {t("backHome")}
        </Link>
      </div>
    </PhoneShell>
  );
}

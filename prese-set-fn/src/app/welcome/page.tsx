"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function WelcomePage() {
  const { t } = useLocale();

  return (
    <PhoneShell>
      <div
        className="flex h-full flex-col items-center justify-center px-10 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 80%, #1a2010 0%, #0B0D0F 70%)",
        }}
      >
        <div className="timer-font mb-2 text-6xl font-black tracking-tight text-white">
          Pace<span className="text-lime">Set</span>
        </div>
        <p className="mt-4 mb-10 text-base text-muted">{t("tagline")}</p>
        <Link
          href="/home"
          className="w-full rounded-xl bg-lime py-4 text-lg font-bold text-black"
        >
          {t("startTraining")}
        </Link>
        <Link href="/home" className="mt-5 text-sm text-muted underline">
          {t("continueGuest")}
        </Link>
      </div>
    </PhoneShell>
  );
}

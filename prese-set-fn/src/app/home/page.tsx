"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { mockPrograms } from "@/lib/mock-data";
// import { mockPrograms } from "@/lib/mock-data";


export default function HomePage() {
  const { t } = useLocale();
  const today = mockPrograms[0];

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
          <div className="rounded-2xl bg-surface p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-[#1a2a0a] px-2 py-0.5 text-xs font-semibold text-lime">
                {t("interval")}
              </span>
              <span className="text-xs text-muted">
                {today.durationMin} {t("minutes")}
              </span>
            </div>
            <h3 className="mb-1 text-xl font-bold text-white">{today.name}</h3>
            <p className="text-sm text-muted">{today.description}</p>
          </div>
          <Link
            href="/workout/interval"
            className="mt-8 block w-full rounded-xl bg-lime py-4 text-center text-lg font-bold text-black"
          >
            {t("startWorkout")}
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}

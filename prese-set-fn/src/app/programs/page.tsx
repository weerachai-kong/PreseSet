"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { mockPrograms } from "@/lib/mock-data";

export default function ProgramsPage() {
  const { t } = useLocale();
  const list = mockPrograms.slice(1);

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-6 pt-14 pb-4">
          <Link href="/home">
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
          <h2 className="text-xl font-bold text-white">{t("programs")}</h2>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6">
          {list.map((program) => (
            <Link
              key={program.id}
              href={
                program.mode === "REPS_SETS" ? "/workout/reps" : "/programs/edit"
              }
              className="flex items-center justify-between rounded-xl bg-surface p-4"
            >
              <div>
                <p className="font-semibold text-white">{program.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {program.mode === "INTERVAL" ? t("interval") : t("repsSets")} ·{" "}
                  {program.stepCount} {t("steps")}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted" />
            </Link>
          ))}
        </div>

        <div className="px-6 pt-4 pb-4">
          <Link
            href="/programs/edit"
            className="block w-full rounded-xl bg-lime py-4 text-center font-bold text-black"
          >
            {t("newProgram")}
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}

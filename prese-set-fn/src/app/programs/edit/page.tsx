"use client";

import Link from "next/link";
import { ChevronLeft, ImageIcon } from "lucide-react";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { mockEditSteps } from "@/lib/mock-data";

export default function EditProgramPage() {
  const { t } = useLocale();
  const [mode, setMode] = useState<"INTERVAL" | "REPS_SETS">("INTERVAL");
  const [name, setName] = useState("HIIT Burn 20");

  return (
    <PhoneShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-6 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/programs">
              <ChevronLeft className="h-6 w-6 text-white" />
            </Link>
            <h2 className="text-xl font-bold text-white">{t("editProgram")}</h2>
          </div>
          <Link href="/programs" className="text-sm font-bold text-lime">
            {t("save")}
          </Link>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-8">
          <div>
            <label className="mb-1 block text-xs text-muted">{t("programName")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-white outline-none focus:border-lime"
            />
          </div>

          <div className="flex overflow-hidden rounded-lg bg-surface">
            <button
              type="button"
              onClick={() => setMode("INTERVAL")}
              className={`flex-1 py-2.5 text-sm font-bold ${
                mode === "INTERVAL" ? "bg-lime text-black" : "text-muted"
              }`}
            >
              {t("interval")}
            </button>
            <button
              type="button"
              onClick={() => setMode("REPS_SETS")}
              className={`flex-1 py-2.5 text-sm font-medium ${
                mode === "REPS_SETS" ? "bg-lime text-black" : "text-muted"
              }`}
            >
              {t("repsSets")}
            </button>
          </div>

          <div className="space-y-3">
            {mockEditSteps.map((step) => (
              <div
                key={step.order}
                className="flex items-center gap-3 rounded-xl bg-surface p-4"
              >
                <span className="text-xs font-bold text-muted">{step.order}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#222]">
                  <ImageIcon className="h-5 w-5 text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <p className="text-xs text-muted">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="w-full rounded-xl border border-dashed border-[#444] py-3 text-sm font-medium text-muted"
          >
            + {t("addStep")}
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

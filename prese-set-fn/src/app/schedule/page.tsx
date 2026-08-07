"use client";

import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";

const days = [
  { key: "M", labelEn: "Monday", labelTh: "จันทร์" },
  { key: "T", labelEn: "Tuesday", labelTh: "อังคาร" },
  { key: "W", labelEn: "Wednesday", labelTh: "พุธ" },
  { key: "T2", labelEn: "Thursday", labelTh: "พฤหัส" },
  { key: "F", labelEn: "Friday", labelTh: "ศุกร์" },
  { key: "S", labelEn: "Saturday", labelTh: "เสาร์" },
  { key: "S2", labelEn: "Sunday", labelTh: "อาทิตย์" },
];

export default function SchedulePage() {
  const { t, locale } = useLocale();
  const [selected, setSelected] = useState(2);
  const day = days[selected];

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <div className="px-6 pt-14 pb-4">
          <h2 className="text-xl font-bold text-white">{t("weeklySchedule")}</h2>
        </div>

        <div className="px-6">
          <div className="mb-8 flex justify-between">
            {days.map((d, i) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelected(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                  selected === i
                    ? "bg-lime text-black"
                    : "text-muted"
                }`}
              >
                {d.key.replace("2", "")}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-surface p-6">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">
              {locale === "th" ? day.labelTh : day.labelEn}
            </p>
            <p className="text-lg font-bold text-white">HIIT Burn 20</p>
            <p className="mt-1 text-sm text-muted">
              {t("interval")} · 18 {t("minutes")}
            </p>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-lime py-4 font-bold text-black"
          >
            {t("assignProgram")}
          </button>
          <p className="mt-4 text-center text-xs text-muted">{t("scheduleHint")}</p>
        </div>
      </div>
    </PhoneShell>
  );
}

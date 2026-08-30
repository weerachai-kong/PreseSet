"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi, scheduleApi } from "@/lib/api";
import { apiDayToUiDay, estimateProgramMinutes, uiDayToApiDay } from "@/lib/api/helpers";
import type { Program, ScheduleEntry } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
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
  const { token } = useAuth();
  const [selected, setSelected] = useState(() => {
    const jsDay = new Date().getDay();
    return apiDayToUiDay(jsDay);
  });
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programDetails, setProgramDetails] = useState<Record<string, Program>>(
    {},
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(!!token);
  const [saving, setSaving] = useState(false);

  const day = days[selected];
  const apiDay = uiDayToApiDay(selected);
  const entry = schedule.find((s) => s.dayOfWeek === apiDay);
  const assigned = entry?.programId
    ? programDetails[entry.programId]
    : null;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([scheduleApi.list(token), programsApi.list(token)])
      .then(([scheduleList, programList]) => {
        setSchedule(scheduleList);
        setPrograms(programList);
        const map: Record<string, Program> = {};
        for (const p of programList) map[p.id] = p;
        setProgramDetails(map);
      })
      .catch(() => {
        setSchedule([]);
        setPrograms([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const durationMin = useMemo(
    () => (assigned ? estimateProgramMinutes(assigned.steps) : 0),
    [assigned],
  );

  const assignProgram = async (programId: string) => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await scheduleApi.upsert(token, apiDay, programId);
      setSchedule((prev) => {
        const rest = prev.filter((s) => s.dayOfWeek !== apiDay);
        return [...rest, updated];
      });
      const program = programs.find((p) => p.id === programId);
      if (program) {
        setProgramDetails((prev) => ({ ...prev, [program.id]: program }));
      }
      setPickerOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <div className="px-6 pt-14 pb-4">
          <h2 className="text-xl font-bold text-white">{t("weeklySchedule")}</h2>
        </div>

        <div className="px-6">
          {!token ? (
            <p className="text-sm text-muted">
              {t("loginRequired")}{" "}
              <Link href="/welcome" className="text-lime underline">
                {t("signIn")}
              </Link>
            </p>
          ) : loading ? (
            <p className="text-sm text-muted">{t("loading")}</p>
          ) : (
            <>
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
                {assigned ? (
                  <>
                    <p className="text-lg font-bold text-white">
                      {assigned.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {assigned.mode === "INTERVAL"
                        ? t("interval")
                        : t("repsSets")}{" "}
                      · {durationMin} {t("minutes")}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">{t("noProgramAssigned")}</p>
                )}
              </div>

              <button
                type="button"
                disabled={saving || programs.length === 0}
                onClick={() => setPickerOpen(true)}
                className="mt-6 w-full rounded-xl bg-lime py-4 font-bold text-black disabled:opacity-50"
              >
                {saving ? t("loading") : t("assignProgram")}
              </button>
              <p className="mt-4 text-center text-xs text-muted">
                {t("scheduleHint")}
              </p>

              {pickerOpen ? (
                <div className="mt-4 space-y-2 rounded-xl border border-border bg-[#111] p-4">
                  {programs.map((program) => (
                    <button
                      key={program.id}
                      type="button"
                      onClick={() => assignProgram(program.id)}
                      className="block w-full rounded-lg bg-surface px-4 py-3 text-left text-sm text-white"
                    >
                      {program.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="w-full py-2 text-xs text-muted"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

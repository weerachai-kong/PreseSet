"use client";

import { useEffect, useMemo, useState } from "react";
import { LoginPrompt, PageLoading } from "@/components/LoginPrompt";
import { PageContent } from "@/components/PageContent";
import { PageHeader } from "@/components/PageHeader";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi, scheduleApi } from "@/lib/api";
import { apiDayToUiDay, estimateProgramMinutes, programModeLabel, uiDayToApiDay } from "@/lib/api/helpers";
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
  const { token, isLoading: authLoading } = useAuth();
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
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const day = days[selected];
  const apiDay = uiDayToApiDay(selected);
  const entry = schedule.find((s) => s.dayOfWeek === apiDay);
  const assigned = entry?.programId
    ? programDetails[entry.programId]
    : null;

  useEffect(() => {
    if (authLoading || !token) return;

    let cancelled = false;
    Promise.all([scheduleApi.list(token), programsApi.list(token)])
      .then(([scheduleList, programList]) => {
        if (cancelled) return;
        setSchedule(scheduleList);
        setPrograms(programList);
        const map: Record<string, Program> = {};
        for (const p of programList) map[p.id] = p;
        setProgramDetails(map);
      })
      .catch(() => {
        if (cancelled) return;
        setSchedule([]);
        setPrograms([]);
      })
      .finally(() => {
        if (!cancelled) setLoadedToken(token);
      });

    return () => {
      cancelled = true;
    };
  }, [token, authLoading]);

  const loading = authLoading || (Boolean(token) && loadedToken !== token);

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
        <PageHeader
          title={t("weeklySchedule")}
          subtitle={t("scheduleSubtitle")}
        />

        <PageContent>
          {loading ? (
            <PageLoading />
          ) : !token ? (
            <LoginPrompt />
          ) : (
            <>
              <div className="mb-6 grid grid-cols-7 gap-2">
                {days.map((d, i) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelected(i)}
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      selected === i
                        ? "bg-lime text-white shadow-sm"
                        : "border border-border bg-surface text-foreground/65"
                    }`}
                  >
                    {d.key.replace("2", "")}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-surface p-6 app-card">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/70">
                  {locale === "th" ? day.labelTh : day.labelEn}
                </p>
                {assigned ? (
                  <>
                    <p className="text-lg font-bold text-foreground">
                      {assigned.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {programModeLabel(assigned.mode, t)} · {durationMin}{" "}
                      {t("minutes")}
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
                className="mt-6 w-full rounded-xl bg-lime py-4 font-bold text-white disabled:opacity-50"
              >
                {saving ? t("loading") : t("assignProgram")}
              </button>
              <p className="mt-4 text-center text-sm text-muted">
                {t("scheduleHint")}
              </p>

              {pickerOpen ? (
                <div className="mt-4 space-y-2 rounded-xl border border-border bg-surface-muted p-4">
                  {programs.map((program) => (
                    <button
                      key={program.id}
                      type="button"
                      onClick={() => assignProgram(program.id)}
                      className="block w-full rounded-lg border border-border bg-surface px-4 py-3 text-left text-base font-medium text-foreground"
                    >
                      {program.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="w-full py-2 text-sm font-medium text-muted"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </>
          )}
        </PageContent>
      </div>
    </PhoneShell>
  );
}

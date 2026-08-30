"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi } from "@/lib/api";
import { programSummary } from "@/lib/api/helpers";
import type { Program } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function ProgramsPage() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    programsApi
      .list(token)
      .then(setPrograms)
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, [token]);

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
          {!token ? (
            <p className="text-sm text-muted">
              {t("loginRequired")}{" "}
              <Link href="/welcome" className="text-lime underline">
                {t("signIn")}
              </Link>
            </p>
          ) : loading ? (
            <p className="text-sm text-muted">{t("loading")}</p>
          ) : programs.length === 0 ? (
            <p className="text-sm text-muted">{t("noProgramAssigned")}</p>
          ) : (
            programs.map((program) => {
              const summary = programSummary(program);
              return (
                <Link
                  key={program.id}
                  href={`/programs/edit?id=${program.id}`}
                  className="flex items-center justify-between rounded-xl bg-surface p-4"
                >
                  <div>
                    <p className="font-semibold text-white">{program.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {program.mode === "INTERVAL"
                        ? t("interval")
                        : t("repsSets")}{" "}
                      · {summary.stepCount} {t("steps")}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted" />
                </Link>
              );
            })
          )}
        </div>

        <div className="px-6 pt-4 pb-4">
          <Link
            href={token ? "/programs/edit" : "/welcome"}
            className="block w-full rounded-xl bg-lime py-4 text-center font-bold text-black"
          >
            {t("newProgram")}
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}

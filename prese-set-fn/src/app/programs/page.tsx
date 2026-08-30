"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoginPrompt, PageLoading } from "@/components/LoginPrompt";
import { PhoneShell } from "@/components/PhoneShell";
import { programsApi } from "@/lib/api";
import { programSummary, programModeLabel } from "@/lib/api/helpers";
import type { Program } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function ProgramsPage() {
  const { t } = useLocale();
  const { token, isLoading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !token) return;

    let cancelled = false;
    programsApi
      .list(token)
      .then((data) => {
        if (!cancelled) setPrograms(data);
      })
      .catch(() => {
        if (!cancelled) setPrograms([]);
      })
      .finally(() => {
        if (!cancelled) setLoadedToken(token);
      });

    return () => {
      cancelled = true;
    };
  }, [token, authLoading]);

  const loading = authLoading || (Boolean(token) && loadedToken !== token);

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-6 pt-14 pb-4">
          <Link href="/home">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </Link>
          <h2 className="text-2xl font-bold text-foreground">{t("programs")}</h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6">
          {loading ? (
            <PageLoading />
          ) : !token ? (
            <LoginPrompt />
          ) : programs.length === 0 ? (
            <p className="text-sm text-muted">{t("noProgramAssigned")}</p>
          ) : (
            programs.map((program) => {
              const summary = programSummary(program);
              return (
                <Link
                  key={program.id}
                  href={`/programs/edit?id=${program.id}`}
                  className="mb-3 flex items-center justify-between rounded-xl bg-surface p-4 app-card"
                >
                  <div>
                    <p className="font-bold text-foreground">{program.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {programModeLabel(program.mode, t)} · {summary.stepCount}{" "}
                      {t("steps")}
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
            className="block w-full rounded-xl bg-lime py-4 text-center font-bold text-white"
          >
            {t("newProgram")}
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}

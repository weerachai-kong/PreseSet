"use client";

import { useEffect, useState } from "react";
import { LoginPrompt, PageLoading } from "@/components/LoginPrompt";
import { PhoneShell } from "@/components/PhoneShell";
import { sessionsApi } from "@/lib/api";
import {
  formatSessionDate,
  formatSessionDuration,
  programModeLabel,
} from "@/lib/api/helpers";
import type { WorkoutSession } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function HistoryPage() {
  const { t, locale } = useLocale();
  const { token, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !token) return;

    let cancelled = false;
    sessionsApi
      .list(token)
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
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
        <div className="px-6 pt-14 pb-4">
          <h2 className="text-2xl font-bold text-foreground">{t("history")}</h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-4">
          {loading ? (
            <PageLoading />
          ) : !token ? (
            <LoginPrompt />
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted">{t("noProgramAssigned")}</p>
          ) : (
            sessions.map((item) => (
              <div key={item.id} className="mb-3 rounded-xl bg-surface p-4 app-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {item.program?.name ?? t("program")}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {programModeLabel(item.mode, t)} ·{" "}
                      {formatSessionDuration(item.startedAt, item.endedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted">
                      {formatSessionDate(item.startedAt, locale)}
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        item.completed ? "text-lime" : "text-danger"
                      }`}
                    >
                      {item.completed ? t("completed") : t("stopped")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

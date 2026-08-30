"use client";

import { useEffect, useState } from "react";
import { LoginPrompt, PageLoading } from "@/components/LoginPrompt";
import { PageContent } from "@/components/PageContent";
import { PageHeader, HeaderMeta } from "@/components/PageHeader";
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
        <PageHeader
          title={t("history")}
          subtitle={t("historySubtitle")}
          trailing={
            !loading && token ? (
              <HeaderMeta>{sessions.length}</HeaderMeta>
            ) : null
          }
        />

        <PageContent className="overflow-y-auto">
          {loading ? (
            <PageLoading />
          ) : !token ? (
            <LoginPrompt />
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl bg-surface app-card p-8 text-center">
              <p className="text-base font-medium text-foreground">
                {t("historyEmpty")}
              </p>
              <p className="mt-2 text-sm text-muted">{t("historySubtitle")}</p>
            </div>
          ) : (
            sessions.map((item) => (
              <div key={item.id} className="mb-4 rounded-xl bg-surface p-4 app-card">
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
        </PageContent>
      </div>
    </PhoneShell>
  );
}

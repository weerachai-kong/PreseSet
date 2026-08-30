"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
import { sessionsApi } from "@/lib/api";
import {
  formatSessionDate,
  formatSessionDuration,
} from "@/lib/api/helpers";
import type { WorkoutSession } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function HistoryPage() {
  const { t, locale } = useLocale();
  const { token } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    sessionsApi
      .list(token)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <div className="px-6 pt-14 pb-4">
          <h2 className="text-xl font-bold text-white">{t("history")}</h2>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 pb-4">
          {!token ? (
            <p className="text-sm text-muted">
              {t("loginRequired")}{" "}
              <Link href="/welcome" className="text-lime underline">
                {t("signIn")}
              </Link>
            </p>
          ) : loading ? (
            <p className="text-sm text-muted">{t("loading")}</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted">{t("noProgramAssigned")}</p>
          ) : (
            sessions.map((item) => (
              <div key={item.id} className="rounded-xl bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.program?.name ?? t("program")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.mode === "INTERVAL"
                        ? t("interval")
                        : t("repsSets")}{" "}
                      · {formatSessionDuration(item.startedAt, item.endedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">
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

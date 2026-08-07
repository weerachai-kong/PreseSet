"use client";

import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { mockHistory } from "@/lib/mock-data";

export default function HistoryPage() {
  const { t } = useLocale();

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <div className="px-6 pt-14 pb-4">
          <h2 className="text-xl font-bold text-white">{t("history")}</h2>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 pb-4">
          {mockHistory.map((item) => (
            <div key={item.id} className="rounded-xl bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {item.programName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {item.mode === "INTERVAL" ? t("interval") : t("repsSets")} ·{" "}
                    {item.duration}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">{item.dateKey}</p>
                  <span
                    className={`text-xs font-medium ${
                      item.status === "completed" ? "text-lime" : "text-danger"
                    }`}
                  >
                    {item.status === "completed" ? t("completed") : t("stopped")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

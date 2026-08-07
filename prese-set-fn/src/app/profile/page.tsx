"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhoneShell } from "@/components/PhoneShell";
import { useLocale } from "@/lib/i18n/LocaleContext";
import {
  useSettings,
  type WaterIntervalMinutes,
} from "@/lib/settings/SettingsContext";
import { ensureNotificationPermission } from "@/lib/water/WaterReminder";

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const { settings, updateSettings } = useSettings();
  const [permNote, setPermNote] = useState<string | null>(null);

  const toggleWater = async () => {
    if (!settings.waterReminderEnabled) {
      const perm = await ensureNotificationPermission();
      if (perm !== "granted") {
        setPermNote(
          perm === "denied"
            ? t("waterPermissionDenied")
            : t("waterPermissionNeeded"),
        );
        return;
      }
      setPermNote(null);
      updateSettings({ waterReminderEnabled: true });
      return;
    }
    setPermNote(null);
    updateSettings({ waterReminderEnabled: false });
  };

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="px-6 pt-14 pb-4">
          <h2 className="text-xl font-bold text-white">{t("profile")}</h2>
        </div>

        <div className="space-y-6 px-6 pb-8">
          <div>
            <label className="mb-1 block text-xs text-muted">
              {t("displayName")}
            </label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-white outline-none focus:border-lime"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">{t("email")}</label>
            <p className="rounded-lg bg-surface px-4 py-3 text-white">
              {settings.email}
            </p>
          </div>

          <LanguageSwitcher />

          <label className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <span className="pr-4 text-sm text-white">{t("audioBeeps")}</span>
            <input
              type="checkbox"
              checked={settings.beepEnabled}
              onChange={(e) => updateSettings({ beepEnabled: e.target.checked })}
              className="h-5 w-5 accent-lime"
            />
          </label>

          <div className="space-y-3 rounded-xl bg-surface p-4">
            <label className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-medium text-white">
                  {t("waterReminder")}
                </p>
                <p className="mt-1 text-xs text-muted">{t("waterReminderDesc")}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.waterReminderEnabled}
                onChange={toggleWater}
                className="h-5 w-5 accent-lime"
              />
            </label>

            {settings.waterReminderEnabled ? (
              <div>
                <p className="mb-2 text-xs text-muted">{t("waterInterval")}</p>
                <div className="flex gap-2">
                  {(
                    [
                      [60, "waterInterval60"],
                      [90, "waterInterval90"],
                      [120, "waterInterval120"],
                    ] as const
                  ).map(([mins, key]) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        updateSettings({
                          waterReminderIntervalMinutes: mins as WaterIntervalMinutes,
                        })
                      }
                      className={`flex-1 rounded-lg py-2 text-xs font-bold ${
                        settings.waterReminderIntervalMinutes === mins
                          ? "bg-lime text-black"
                          : "bg-[#222] text-muted"
                      }`}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {permNote ? (
              <p className="text-xs text-danger">{permNote}</p>
            ) : null}
          </div>

          <p className="text-xs text-muted">{t("wakeLockNote")}</p>

          {settings.waterReminderEnabled ? (
            <button
              type="button"
              onClick={async () => {
                const perm = await ensureNotificationPermission();
                if (perm !== "granted") {
                  setPermNote(t("waterPermissionNeeded"));
                  return;
                }
                new Notification(t("waterNotifyTitle"), {
                  body: t("waterNotifyBody"),
                  tag: "paceset-water-test",
                });
              }}
              className="w-full rounded-xl border border-lime/40 py-3 text-sm font-medium text-lime"
            >
              {locale === "th" ? "ทดสอบแจ้งเตือนกินน้ำ" : "Test water notification"}
            </button>
          ) : null}

          <Link
            href="/welcome"
            className="block w-full rounded-xl border border-border py-3 text-center text-sm font-medium text-muted"
          >
            {t("logOut")}
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}

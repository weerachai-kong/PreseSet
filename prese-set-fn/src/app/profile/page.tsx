"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginPrompt, PageLoading } from "@/components/LoginPrompt";
import { PhoneShell } from "@/components/PhoneShell";
import { usersApi } from "@/lib/api";
import { useAuth, getAuthErrorMessage } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import {
  useSettings,
  type WaterIntervalMinutes,
} from "@/lib/settings/SettingsContext";
import {
  ensureNotificationPermission,
  getNotificationPermission,
  showWaterNotification,
} from "@/lib/water/WaterReminder";

export default function ProfilePage() {
  const { t } = useLocale();
  const router = useRouter();
  const { token, user, logout, refreshProfile, isLoading: authLoading } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [permNote, setPermNote] = useState<string | null>(null);
  const [testNote, setTestNote] = useState<string | null>(null);
  const [showTestPreview, setShowTestPreview] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayName =
    displayNameDraft ?? user?.displayName ?? settings.displayName;

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      updateSettings({
        displayName: user.displayName,
        email: user.email,
        beepEnabled: user.beepEnabled,
        waterReminderEnabled: user.waterReminderEnabled,
        waterReminderIntervalMinutes:
          user.waterReminderIntervalMinutes as WaterIntervalMinutes,
      });
    });
  }, [user, updateSettings]);

  useEffect(() => {
    queueMicrotask(() => {
      if (!settings.waterReminderEnabled) {
        setPermNote(null);
        return;
      }
      const perm = getNotificationPermission();
      if (perm === "granted") {
        setPermNote(null);
        return;
      }
      if (perm === "denied") {
        setPermNote(`${t("waterPermissionDenied")} ${t("waterReloadHint")}`);
        return;
      }
      setPermNote(t("waterPermissionStale"));
    });
  }, [settings.waterReminderEnabled, t]);

  const syncToApi = async (patch: {
    displayName?: string;
    beepEnabled?: boolean;
    locale?: "en" | "th";
    waterReminderEnabled?: boolean;
    waterReminderIntervalMinutes?: number;
  }) => {
    if (!token) return;
    try {
      await usersApi.updateMe(token, patch);
      await refreshProfile();
      setSaveError(null);
    } catch (err) {
      setSaveError(getAuthErrorMessage(err));
    }
  };

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
      await syncToApi({ waterReminderEnabled: true });
      return;
    }
    setPermNote(null);
    updateSettings({ waterReminderEnabled: false });
    await syncToApi({ waterReminderEnabled: false });
  };

  const onTestWater = async () => {
    setTestNote(null);
    setShowTestPreview(false);

    const perm = await ensureNotificationPermission();
    if (perm === "unsupported") {
      setTestNote(t("waterTestFailed"));
      return;
    }
    if (perm !== "granted") {
      setTestNote(
        perm === "denied"
          ? `${t("waterPermissionDenied")} ${t("waterReloadHint")}`
          : t("waterPermissionNeeded"),
      );
      return;
    }

    const notification = showWaterNotification(
      t("waterNotifyTitle"),
      t("waterNotifyBody"),
      `paceset-water-test-${Date.now()}`,
    );

    if (!notification) {
      setTestNote(t("waterTestFailed"));
      return;
    }

    setTestNote(t("waterTestSent"));
    setShowTestPreview(true);
    window.setTimeout(() => setShowTestPreview(false), 6000);
  };

  const onLogout = () => {
    logout();
    router.push("/welcome");
  };

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <div className="px-6 pt-14 pb-4">
          <h2 className="text-2xl font-bold text-foreground">{t("profile")}</h2>
        </div>

        {authLoading ? (
          <PageLoading />
        ) : !token ? (
          <LoginPrompt />
        ) : (
        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-8">
          {saveError ? (
            <p className="text-xs text-danger">{saveError}</p>
          ) : null}

          <div>
            <label className="field-label">
              {t("displayName")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              onBlur={() => {
                updateSettings({ displayName });
                void syncToApi({ displayName }).finally(() =>
                  setDisplayNameDraft(null),
                );
              }}
              className="app-input"
            />
          </div>

          <div>
            <label className="field-label">{t("email")}</label>
            <p className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-base text-foreground">
              {token ? (user?.email ?? settings.email) : settings.email}
            </p>
          </div>

          <LanguageSwitcher
            onLocaleChange={(next) => syncToApi({ locale: next })}
          />

          <label className="flex items-center justify-between rounded-xl border border-border bg-surface app-card px-4 py-3">
            <span className="pr-4 text-sm text-foreground">{t("audioBeeps")}</span>
            <input
              type="checkbox"
              checked={settings.beepEnabled}
              onChange={(e) => {
                updateSettings({ beepEnabled: e.target.checked });
                syncToApi({ beepEnabled: e.target.checked });
              }}
              className="h-5 w-5 accent-lime"
            />
          </label>

          <div className="space-y-3 rounded-xl border border-border bg-surface app-card p-4">
            <label className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-medium text-foreground">
                  {t("waterReminder")}
                </p>
                <p className="mt-1 text-sm text-muted">{t("waterReminderDesc")}</p>
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
                <p className="mb-2 text-sm font-medium text-foreground/80">{t("waterInterval")}</p>
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
                      onClick={() => {
                        updateSettings({
                          waterReminderIntervalMinutes: mins as WaterIntervalMinutes,
                        });
                        syncToApi({ waterReminderIntervalMinutes: mins });
                      }}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold ${
                        settings.waterReminderIntervalMinutes === mins
                          ? "bg-lime text-white"
                          : "bg-surface-muted text-muted"
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

          <p className="text-sm text-muted">{t("wakeLockNote")}</p>

          {settings.waterReminderEnabled ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onTestWater}
                className="w-full rounded-xl border border-lime/40 py-3 text-sm font-medium text-lime"
              >
                {t("waterTestButton")}
              </button>

              {showTestPreview ? (
                <div className="rounded-xl border border-lime/30 bg-display p-4 text-left shadow-lg">
                  <p className="text-sm font-bold text-lime">
                    {t("waterNotifyTitle")}
                  </p>
                  <p className="mt-1 text-xs text-foreground">{t("waterNotifyBody")}</p>
                  <p className="mt-2 text-[10px] text-muted">
                    {t("waterTestSent")}
                  </p>
                </div>
              ) : null}

              {testNote ? (
                <p
                  className={`text-xs leading-relaxed ${
                    showTestPreview ? "text-lime" : "text-danger"
                  }`}
                >
                  {testNote}
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onLogout}
            className="block w-full rounded-xl border border-border py-3 text-center text-sm font-medium text-muted"
          >
            {t("logOut")}
          </button>
        </div>
        )}
      </div>
    </PhoneShell>
  );
}

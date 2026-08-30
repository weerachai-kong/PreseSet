"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginPrompt, PageLoading } from "@/components/LoginPrompt";
import { PageContent } from "@/components/PageContent";
import { PageHeader } from "@/components/PageHeader";
import { PhoneShell } from "@/components/PhoneShell";
import { usersApi } from "@/lib/api";
import { useAuth, getAuthErrorMessage } from "@/lib/auth/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import {
  useSettings,
  type WaterIntervalMinutes,
} from "@/lib/settings/SettingsContext";
import {
  BEEP_SOUND_PRESETS,
  beepVolumeGain,
  playPhaseEndBeeps,
  playWorkoutCompleteBeeps,
  primeWorkoutAudio,
  type BeepSoundPreset,
} from "@/lib/workout/workoutBeeps";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import {
  ensureNotificationPermission,
  getNotificationPermission,
  showWaterNotification,
} from "@/lib/water/WaterReminder";

const BEEP_PRESET_LABELS: Record<BeepSoundPreset, MessageKey> = {
  classic: "beepSoundClassic",
  soft: "beepSoundSoft",
  bell: "beepSoundBell",
  whistle: "beepSoundWhistle",
  chime: "beepSoundChime",
  pulse: "beepSoundPulse",
};

export default function ProfilePage() {
  const { t } = useLocale();
  const router = useRouter();
  const { token, user, logout, refreshProfile, isLoading: authLoading } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [permNote, setPermNote] = useState<string | null>(null);
  const [testNote, setTestNote] = useState<string | null>(null);
  const [beepTestNote, setBeepTestNote] = useState<string | null>(null);
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

  const onTestBeep = (kind: "WORK" | "REST" | "COMPLETE") => {
    setBeepTestNote(null);
    primeWorkoutAudio();
    const gain = beepVolumeGain(settings.beepVolume);
    const preset = settings.beepSoundPreset;
    if (kind === "COMPLETE") {
      playWorkoutCompleteBeeps(gain, preset);
    } else {
      playPhaseEndBeeps(kind, gain, preset);
    }
    setBeepTestNote(t("beepTestSent"));
    window.setTimeout(() => setBeepTestNote(null), 4000);
  };

  const onSelectBeepPreset = (preset: BeepSoundPreset) => {
    updateSettings({ beepSoundPreset: preset });
    primeWorkoutAudio();
    playPhaseEndBeeps(
      "WORK",
      beepVolumeGain(settings.beepVolume),
      preset,
    );
  };

  const onLogout = () => {
    logout();
    router.push("/welcome");
  };

  return (
    <PhoneShell showNav>
      <div className="flex h-full flex-col">
        <PageHeader
          title={t("profile")}
          subtitle={t("profileSubtitle")}
          trailing={
            user?.displayName ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-foreground/70">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            ) : null
          }
        />

        {authLoading ? (
          <PageLoading />
        ) : !token ? (
          <LoginPrompt />
        ) : (
        <PageContent className="space-y-6 overflow-y-auto">
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

          <div className="space-y-3 rounded-xl border border-border bg-surface app-card p-4">
            <label className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-medium text-foreground">
                  {t("soundSettings")}
                </p>
                <p className="mt-1 text-sm text-muted">{t("soundSettingsDesc")}</p>
              </div>
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

            {settings.beepEnabled ? (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground/80">
                    {t("beepSoundStyle")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {BEEP_SOUND_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => onSelectBeepPreset(preset)}
                        className={`rounded-lg px-2 py-2.5 text-xs font-bold ${
                          settings.beepSoundPreset === preset
                            ? "bg-lime text-white"
                            : "bg-surface-muted text-muted"
                        }`}
                      >
                        {t(BEEP_PRESET_LABELS[preset])}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground/80">
                      {t("beepVolume")}
                    </p>
                    <span className="text-xs text-muted">{settings.beepVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={settings.beepVolume}
                    onChange={(e) =>
                      updateSettings({ beepVolume: Number(e.target.value) })
                    }
                    className="w-full accent-lime"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onTestBeep("WORK")}
                    className="w-full rounded-lg border border-lime/40 py-2.5 text-sm font-medium text-lime"
                  >
                    {t("beepTestWork")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onTestBeep("REST")}
                    className="w-full rounded-lg border border-lime/40 py-2.5 text-sm font-medium text-lime"
                  >
                    {t("beepTestRest")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onTestBeep("COMPLETE")}
                    className="w-full rounded-lg border border-lime/40 py-2.5 text-sm font-medium text-lime"
                  >
                    {t("beepTestComplete")}
                  </button>
                </div>

                {beepTestNote ? (
                  <p className="text-xs text-lime">{beepTestNote}</p>
                ) : null}
              </>
            ) : null}
          </div>

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
        </PageContent>
        )}
      </div>
    </PhoneShell>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useSettings } from "@/lib/settings/SettingsContext";

export function WaterReminder() {
  const { settings } = useSettings();
  const { t } = useLocale();
  const lastFiredRef = useRef<number>(0);

  useEffect(() => {
    if (!settings.waterReminderEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    let cancelled = false;
    const intervalMs = settings.waterReminderIntervalMinutes * 60 * 1000;

    const fire = () => {
      if (cancelled) return;
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      if (now - lastFiredRef.current < intervalMs - 1000) return;
      lastFiredRef.current = now;
      new Notification(t("waterNotifyTitle"), {
        body: t("waterNotifyBody"),
        tag: "paceset-water",
      });
    };

    const id = window.setInterval(fire, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    settings.waterReminderEnabled,
    settings.waterReminderIntervalMinutes,
    t,
  ]);

  return null;
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

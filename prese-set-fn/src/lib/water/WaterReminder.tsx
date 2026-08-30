"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useSettings } from "@/lib/settings/SettingsContext";

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function ensureNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  const current = getNotificationPermission();
  if (current === "unsupported") return "unsupported";
  if (current === "granted") return "granted";
  if (current === "denied") return "denied";
  return Notification.requestPermission();
}

export function showWaterNotification(
  title: string,
  body: string,
  tag = "paceset-water",
): Notification | null {
  if (getNotificationPermission() !== "granted") return null;
  try {
    return new Notification(title, {
      body,
      tag,
      silent: false,
    });
  } catch {
    return null;
  }
}

export function WaterReminder() {
  const { settings } = useSettings();
  const { t } = useLocale();
  const lastFiredRef = useRef<number>(0);

  useEffect(() => {
    if (!settings.waterReminderEnabled) return;
    if (getNotificationPermission() === "unsupported") return;

    let cancelled = false;
    const intervalMs = settings.waterReminderIntervalMinutes * 60 * 1000;

    const fire = () => {
      if (cancelled) return;
      if (getNotificationPermission() !== "granted") return;
      const now = Date.now();
      if (now - lastFiredRef.current < intervalMs - 1000) return;
      lastFiredRef.current = now;
      showWaterNotification(t("waterNotifyTitle"), t("waterNotifyBody"));
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

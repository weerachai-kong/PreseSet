"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type BeepSoundPreset,
  isBeepSoundPreset,
} from "@/lib/workout/workoutBeeps";

const STORAGE_KEY = "paceset.settings";

export type { BeepSoundPreset };

export type WaterIntervalMinutes = 60 | 90 | 120;

export type AppSettings = {
  beepEnabled: boolean;
  beepVolume: number;
  beepSoundPreset: BeepSoundPreset;
  waterReminderEnabled: boolean;
  waterReminderIntervalMinutes: WaterIntervalMinutes;
  displayName: string;
  email: string;
};

const defaults: AppSettings = {
  beepEnabled: true,
  beepVolume: 70,
  beepSoundPreset: "classic",
  waterReminderEnabled: false,
  waterReminderIntervalMinutes: 60,
  displayName: "Athlete",
  email: "athlete@paceset.app",
};

type SettingsContextValue = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      if (
        parsed.beepSoundPreset &&
        !isBeepSoundPreset(parsed.beepSoundPreset)
      ) {
        delete parsed.beepSoundPreset;
      }
      setSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

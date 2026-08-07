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

const STORAGE_KEY = "paceset.settings";

export type WaterIntervalMinutes = 60 | 90 | 120;

export type AppSettings = {
  beepEnabled: boolean;
  waterReminderEnabled: boolean;
  waterReminderIntervalMinutes: WaterIntervalMinutes;
  displayName: string;
  email: string;
};

const defaults: AppSettings = {
  beepEnabled: true,
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

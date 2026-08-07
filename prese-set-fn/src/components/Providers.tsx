"use client";

import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { SettingsProvider } from "@/lib/settings/SettingsContext";
import { WaterReminder } from "@/lib/water/WaterReminder";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <SettingsProvider>
        <WaterReminder />
        {children}
      </SettingsProvider>
    </LocaleProvider>
  );
}

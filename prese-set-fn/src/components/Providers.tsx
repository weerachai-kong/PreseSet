"use client";

import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { SettingsProvider } from "@/lib/settings/SettingsContext";
import { WaterReminder } from "@/lib/water/WaterReminder";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <SettingsProvider>
          <WaterReminder />
          {children}
        </SettingsProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}

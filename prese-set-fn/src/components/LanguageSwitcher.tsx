"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher({
  onLocaleChange,
}: {
  onLocaleChange?: (locale: Locale) => void;
}) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div>
      <p className="field-label">{t("language")}</p>
      <div className="flex overflow-hidden rounded-xl border border-border bg-surface-muted p-1">
        {(["th", "en"] as Locale[]).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              setLocale(code);
              onLocaleChange?.(code);
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${
              locale === code
                ? "bg-lime text-white shadow-sm"
                : "text-foreground/70"
            }`}
          >
            {code === "th" ? "ไทย" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}

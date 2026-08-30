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
      <p className="mb-2 text-xs text-muted">{t("language")}</p>
      <div className="flex overflow-hidden rounded-lg bg-surface">
        {(["th", "en"] as Locale[]).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              setLocale(code);
              onLocaleChange?.(code);
            }}
            className={`flex-1 py-2.5 text-sm font-bold ${
              locale === code ? "bg-lime text-black" : "text-muted"
            }`}
          >
            {code === "th" ? "ไทย" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}

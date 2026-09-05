"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher({
  onLocaleChange,
  compact = false,
}: {
  onLocaleChange?: (locale: Locale) => void;
  /** Compact toggle for welcome / header (no label). */
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useLocale();

  const switcher = (
    <div
      className={`flex overflow-hidden rounded-xl border border-border bg-surface-muted p-1 ${
        compact ? "w-auto" : ""
      }`}
    >
      {(["th", "en"] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => {
            setLocale(code);
            onLocaleChange?.(code);
          }}
          className={`rounded-lg font-bold transition-colors ${
            compact ? "px-2.5 py-1.5 text-xs" : "flex-1 py-2.5 text-sm"
          } ${
            locale === code
              ? "bg-lime text-white shadow-sm"
              : "text-foreground/70"
          }`}
        >
          {compact
            ? code === "th"
              ? "ไทย"
              : "EN"
            : code === "th"
              ? "ไทย"
              : "English"}
        </button>
      ))}
    </div>
  );

  if (compact) return switcher;

  return (
    <div>
      <p className="field-label">{t("language")}</p>
      {switcher}
    </div>
  );
}

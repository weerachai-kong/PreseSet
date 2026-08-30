"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";

export function LoginPrompt() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-8 text-center">
      <p className="max-w-xs text-base text-muted">{t("loginRequired")}</p>
      <Link
        href="/welcome"
        className="mt-6 w-full max-w-xs rounded-xl bg-lime py-4 text-lg font-bold text-white"
      >
        {t("signIn")}
      </Link>
      <Link
        href="/welcome"
        className="mt-4 text-sm text-muted underline"
      >
        {t("continueGuest")}
      </Link>
    </div>
  );
}

export function PageLoading() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-6">
      <p className="text-base text-muted">{t("loading")}</p>
    </div>
  );
}

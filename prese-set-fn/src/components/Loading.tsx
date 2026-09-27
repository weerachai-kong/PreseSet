"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

/**
 * PaceSet loading patterns — use these everywhere, never plain "Loading…" text:
 * - LogoLoader: app boot / auth check / route fallback
 * - ListSkeleton / CardSkeleton: data being fetched inside a page
 * - ButtonSpinner (via ButtonLoadingLabel): save / delete / submit buttons
 */

export function LogoLoader({ className = "" }: { className?: string }) {
  const { t } = useLocale();

  return (
    <div
      role="status"
      aria-label={t("loading")}
      className={`flex min-h-0 flex-1 items-center justify-center px-6 ${className}`}
    >
      <div className="logo-pulse timer-font text-4xl font-black tracking-tight text-foreground">
        Pace<span className="text-lime">Set</span>
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-2xl bg-surface p-5 app-card ${className}`}
    >
      <SkeletonBlock className="h-4 w-2/5" />
      <SkeletonBlock className="mt-3 h-3 w-full" />
      <SkeletonBlock className="mt-2 h-3 w-3/4" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  const { t } = useLocale();

  return (
    <div role="status" aria-label={t("loading")} className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

type SpinnerTone = "light" | "brand";

const SPINNER_TONE: Record<SpinnerTone, string> = {
  /** On filled buttons (orange / red). */
  light: "border-white/40 border-t-white",
  /** On text-only buttons (e.g. header Save). */
  brand: "border-lime/30 border-t-lime",
};

export function ButtonSpinner({
  tone = "light",
  className = "",
}: {
  tone?: SpinnerTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-[3px] ${SPINNER_TONE[tone]} ${className}`}
    />
  );
}

/** Button content: spinner + "Loading…" while busy, otherwise the label. */
export function ButtonLoadingLabel({
  loading,
  children,
  loadingText,
  tone = "light",
}: {
  loading: boolean;
  children: ReactNode;
  loadingText?: ReactNode;
  tone?: SpinnerTone;
}) {
  const { t } = useLocale();

  if (!loading) return <>{children}</>;
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <ButtonSpinner tone={tone} />
      {loadingText ?? t("loading")}
    </span>
  );
}

import Link from "next/link";
import { ChevronLeft, User } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: ReactNode;
  backHref?: string;
  onBackClick?: () => void;
  trailing?: ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  backHref,
  onBackClick,
  trailing,
}: PageHeaderProps) {
  const backClassName =
    "-ml-1 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground";

  return (
    <header className="border-b border-border/70 px-6 pt-12 pb-5">
      <div className="flex items-start gap-3">
        {onBackClick ? (
          <button
            type="button"
            onClick={onBackClick}
            aria-label="Back"
            className={backClassName}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : backHref ? (
          <Link href={backHref} aria-label="Back" className={backClassName}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="timer-font mb-1 text-[13px] font-semibold tracking-tight text-foreground/75">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
          ) : null}
        </div>

        {trailing ? (
          <div className="mt-0.5 shrink-0">{trailing}</div>
        ) : null}
      </div>
    </header>
  );
}

export function HomeHeader({
  title,
  subtitle,
  profileHref,
  profileLabel,
}: {
  title: string;
  subtitle: string;
  profileHref: string;
  profileLabel: string;
}) {
  return (
    <header className="border-b border-border/70 px-6 pt-12 pb-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="timer-font text-lg font-bold tracking-tight text-foreground">
          Pace<span className="text-lime">Set</span>
        </span>
        <HeaderIconButton href={profileHref} ariaLabel={profileLabel}>
          <User className="h-5 w-5" />
        </HeaderIconButton>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
    </header>
  );
}

export function HeaderMeta({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block text-sm font-medium tabular-nums text-muted">
      {children}
    </span>
  );
}

export function HeaderIconButton({
  href,
  children,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}

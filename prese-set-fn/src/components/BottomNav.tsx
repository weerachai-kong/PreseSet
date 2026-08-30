"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Clock, Home, Layers, User } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";

const items = [
  { href: "/home", icon: Home, labelKey: "home" as const },
  { href: "/programs", icon: Layers, labelKey: "programs" as const },
  { href: "/schedule", icon: Calendar, labelKey: "schedule" as const },
  { href: "/history", icon: Clock, labelKey: "history" as const },
  { href: "/profile", icon: User, labelKey: "profile" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="absolute bottom-0 left-0 right-0 border-t border-border bg-surface px-2 py-2 shadow-[0_-4px_16px_rgba(26,35,50,0.06)]">
      <div className="flex justify-around">
        {items.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors ${
                active
                  ? "bg-lime/15 text-accent-dark"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span
                className={`text-[11px] leading-tight ${
                  active ? "font-bold" : "font-medium"
                }`}
              >
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

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
    <nav className="absolute bottom-0 left-0 right-0 flex justify-around border-t border-[#222] bg-base/95 px-4 py-3 backdrop-blur">
      {items.map(({ href, icon: Icon, labelKey }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 ${active ? "text-lime" : "text-muted"}`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

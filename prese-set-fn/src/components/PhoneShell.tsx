import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type PhoneShellProps = {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
};

/**
 * Full-bleed on real phones; phone-frame mockup only on md+ screens.
 * Content scrolls inside; bottom nav stays pinned.
 */
export function PhoneShell({
  children,
  showNav = false,
  className = "",
}: PhoneShellProps) {
  return (
    <div className="flex h-dvh items-stretch justify-center bg-frame md:items-center md:p-4">
      <div
        className={`relative flex h-dvh w-full flex-col overflow-hidden bg-base md:mx-auto md:h-[min(844px,100dvh)] md:max-w-[390px] md:rounded-[40px] md:border-2 md:border-border md:app-card ${className}`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}

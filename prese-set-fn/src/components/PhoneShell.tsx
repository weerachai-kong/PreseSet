import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type PhoneShellProps = {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
};

/**
 * Full-bleed on phones; on tablet/desktop use a wide app panel (not a tiny
 * phone mockup) so iPad / Mac layouts stay usable.
 */
export function PhoneShell({
  children,
  showNav = false,
  className = "",
}: PhoneShellProps) {
  return (
    <div className="flex h-dvh items-stretch justify-center bg-frame md:items-center md:p-4 lg:p-6">
      <div
        className={`relative flex h-dvh w-full flex-col overflow-hidden bg-base md:mx-auto md:h-[min(100dvh-2rem,1024px)] md:w-full md:max-w-[820px] md:rounded-3xl md:border-2 md:border-border md:app-card xl:max-w-[920px] ${className}`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}

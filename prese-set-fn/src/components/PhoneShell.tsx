import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type PhoneShellProps = {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
};

export function PhoneShell({
  children,
  showNav = false,
  className = "",
}: PhoneShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-frame p-4">
      <div
        className={`relative mx-auto flex h-[min(844px,100dvh)] w-full max-w-[390px] flex-col overflow-hidden rounded-[40px] border-2 border-border bg-base app-card ${className}`}
      >
        <div className={`relative flex h-full flex-col ${showNav ? "pb-16" : ""}`}>
          {children}
        </div>
        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}

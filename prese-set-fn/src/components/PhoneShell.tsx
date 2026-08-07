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
    <div className="flex min-h-dvh items-center justify-center bg-[#050607] p-4">
      <div
        className={`relative mx-auto flex h-[min(844px,100dvh)] w-full max-w-[390px] flex-col overflow-hidden rounded-[40px] border-[3px] border-border bg-base shadow-[0_25px_60px_rgba(0,0,0,0.5)] ${className}`}
      >
        <div className={`relative flex h-full flex-col ${showNav ? "pb-16" : ""}`}>
          {children}
        </div>
        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}

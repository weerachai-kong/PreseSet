import type { ReactNode } from "react";

type PageContentProps = {
  children: ReactNode;
  className?: string;
};

export function PageContent({ children, className = "" }: PageContentProps) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col px-6 pt-6 pb-6 ${className}`}
    >
      {children}
    </div>
  );
}

import type { ReactNode } from "react";

interface ToolShellProps {
  children: ReactNode;
  title: string;
}

// Hallmark · design-system: design.md · Window chrome.
// Nav lives in the StartBar only — no rail, no header home button.
export function ToolShell({ children, title }: ToolShellProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-24 sm:px-6">
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <header>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}

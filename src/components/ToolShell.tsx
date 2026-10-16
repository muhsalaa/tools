import type { ReactNode } from "react";
import { HomeButton } from "../components/HomeButton";

interface ToolShellProps {
  children: ReactNode;
  title: string;
}

export function ToolShell({ children, title }: ToolShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <HomeButton />
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <span aria-hidden="true" className="w-[104px]" />
      </header>
      {children}
    </main>
  );
}

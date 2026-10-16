import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { HomeButton } from "../components/HomeButton";

interface ToolShellProps {
  children: ReactNode;
  title: string;
}

// Spec: side-rail/home shell — slim icon rail with home + tools on sm+
// screens; the header HomeButton stays as the small-screen way home.
const RAIL = [
  { icon: "⌂", label: "Home", to: "/" },
  { icon: "◷", label: "Pomodoro", to: "/pomodoro" },
  { icon: "✎", label: "Notes", to: "/notes" },
] as const;

export function ToolShell({ children, title }: ToolShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl gap-4 px-4 py-6 sm:px-6">
      <aside
        aria-label="Tools"
        className="sticky top-6 hidden h-fit w-14 shrink-0 flex-col items-center gap-2 rounded-[20px] bg-[#F4FBF7] p-2 shadow-sm sm:flex"
      >
        {RAIL.map((item) => (
          <Link
            aria-label={item.label}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#D9EFE4] text-lg text-[#173E3A] transition hover:bg-[#173E3A] hover:text-[#D9EFE4]"
            key={item.to}
            title={item.label}
            to={item.to}
          >
            <span aria-hidden="true">{item.icon}</span>
          </Link>
        ))}
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="flex items-center justify-between">
          <HomeButton />
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <span aria-hidden="true" className="w-[104px]" />
        </header>
        {children}
      </main>
    </div>
  );
}

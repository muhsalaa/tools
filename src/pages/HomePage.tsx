import { Link } from "@tanstack/react-router";

const tools = [
  {
    blurb: "Focus blocks with today's log",
    icon: "◷",
    name: "Pomodoro",
    to: "/pomodoro",
  },
  {
    blurb: "Quick temporary pastes",
    icon: "✎",
    name: "Notes",
    to: "/notes",
  },
] as const;

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
        <p className="mt-2 text-sm opacity-70">Pick a tool to get started. Works offline.</p>
      </div>
      <nav aria-label="Tools" className="grid w-full grid-cols-2 gap-4 sm:gap-5">
        {tools.map((tool) => (
          <Link
            className="flex flex-col items-center gap-3 rounded-[20px] bg-[#F4FBF7] px-6 py-10 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            key={tool.to}
            to={tool.to}
          >
            <span
              aria-hidden="true"
              className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-[#173E3A] text-4xl text-[#D9EFE4]"
            >
              {tool.icon}
            </span>
            <span className="text-lg font-bold">{tool.name}</span>
            <span className="text-xs opacity-60">{tool.blurb}</span>
          </Link>
        ))}
        {/* Spec story 20: empty-slot tile keeps the grid extensible — future
            Tools slot in here without a redesign. */}
        <div
          aria-label="Empty slot — more tools coming soon"
          className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-dashed border-[#173E3A]/20 px-6 py-10 text-center"
        >
          <span
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-[#173E3A]/10 text-4xl text-[#173E3A]/40"
          >
            +
          </span>
          <span className="text-lg font-bold opacity-40">More soon</span>
          <span className="text-xs opacity-40">Empty slot for a future tool</span>
        </div>
      </nav>
    </main>
  );
}

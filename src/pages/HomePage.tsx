import { Link } from "@tanstack/react-router";
import { NotesIcon, PomodoroIcon } from "../components/icons";

// Hallmark · design-system: design.md · Desktop-icon-grid home.
// Icons dock top-left like a desktop; StartBar is the second way in.
const APPS = [
  { to: "/pomodoro", name: "Pomodoro", Icon: PomodoroIcon },
  { to: "/notes", name: "Notes", Icon: NotesIcon },
] as const;

export function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col px-5 pt-6 pb-20">
      <ul className="flex flex-col items-start gap-6">
        {APPS.map(({ to, name, Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex w-24 flex-col items-center gap-1.5 rounded-[16px] p-2 focus-visible:outline-2 focus-visible:outline-[#173E3A]"
            >
              <Icon size={56} />
              <span className="rounded-md bg-[#173E3A]/85 px-2 py-0.5 text-xs font-semibold text-[#F4FBF7]">
                {name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HouseIcon, NotesIcon, PomodoroIcon, StartMark } from "../components/icons";

const APPS = [
  { to: "/", name: "Home", Icon: HouseIcon },
  { to: "/pomodoro", name: "Pomodoro", Icon: PomodoroIcon },
  { to: "/notes", name: "Notes", Icon: NotesIcon },
] as const;

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="text-sm font-semibold tabular-nums">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export function StartBar() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="fixed inset-x-0 bottom-0 z-40">
      {open && (
        <div className="mx-3 mb-2 w-60 rounded-[20px] bg-[#F4FBF7] p-2 shadow-xl ring-1 ring-[#173E3A]/10">
          {APPS.map(({ to, name, Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-[14px] px-3 py-2 hover:bg-[#D9EFE4]"
            >
              <Icon size={32} />
              <span className="text-sm font-bold">{name}</span>
            </Link>
          ))}
        </div>
      )}
      <footer className="flex items-center gap-3 bg-[#173E3A] px-3 py-2 text-[#D9EFE4]">
        <button
          type="button"
          aria-expanded={open}
          aria-label="Start menu"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-[#D9EFE4] py-1 pr-4 pl-1 text-sm font-bold text-[#173E3A] transition hover:brightness-95"
        >
          <StartMark size={24} />
          Start
        </button>
        <span className="ml-auto opacity-80">
          <Clock />
        </span>
      </footer>
    </div>
  );
}

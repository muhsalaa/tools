import { ToolShell } from "../components/ToolShell";

// Thin stub owned by ticket 01. Ticket 03 replaces this with the Pomodoro Tool.
export function PomodoroStub() {
  return (
    <ToolShell title="Pomodoro">
      <section className="rounded-[20px] bg-[#F4FBF7] p-8 text-center shadow-sm">
        <p className="text-lg font-semibold">Pomodoro timer lands here.</p>
        <p className="mt-2 text-sm opacity-60">Ticket 03 builds the focus timer + DayLog.</p>
      </section>
    </ToolShell>
  );
}

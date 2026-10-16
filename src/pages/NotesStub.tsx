import { ToolShell } from "../components/ToolShell";

// Thin stub owned by ticket 01. Ticket 04 replaces this with the Notes Tool.
export function NotesStub() {
  return (
    <ToolShell title="Notes">
      <section className="rounded-[20px] bg-[#F4FBF7] p-8 text-center shadow-sm">
        <p className="text-lg font-semibold">Temp notes land here.</p>
        <p className="mt-2 text-sm opacity-60">Ticket 04 builds NoteCards + search.</p>
      </section>
    </ToolShell>
  );
}

import { useEffect, useState } from "react";
import { ToolShell } from "../components/ToolShell";
import {
  addNote,
  loadNotes,
  removeNote,
  searchNotes,
  setPinned,
  titleOf,
  type NoteCard,
} from "../lib/db";
import { pastelFor } from "../lib/pastel";

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard unavailable offline / insecure context: fail silently.
  }
}

function restOf(body: string): string {
  const idx = body.indexOf("\n");
  return idx === -1 ? "" : body.slice(idx + 1).trimStart();
}

export function NotesPage() {
  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadNotes().then(setNotes);
  }, []);

  const visible = searchNotes(notes, query);

  const handleAdd = async () => {
    const body = draft.trim();
    if (!body) return;
    const note = await addNote(body);
    setNotes((prev) => [...prev, note]);
    setDraft("");
  };

  const handlePin = async (id: string, pinned: boolean) => {
    setNotes(await setPinned(id, !pinned));
  };

  const handleDelete = async (id: string) => {
    setNotes(await removeNote(id));
  };

  return (
    <ToolShell title="Notes">
      <section className="rounded-[20px] bg-[#F4FBF7] p-4 shadow-sm sm:p-5">
        <label className="text-sm font-semibold" htmlFor="note-draft">
          Quick add
        </label>
        <textarea
          className="mt-2 min-h-20 w-full resize-y rounded-[16px] border border-[#173E3A]/15 bg-white/70 p-3 text-sm outline-none placeholder:opacity-50 focus:border-[#173E3A]/40"
          id="note-draft"
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste anything temporary…"
          value={draft}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <input
            aria-label="Search notes"
            className="w-full rounded-full border border-[#173E3A]/15 bg-white/70 px-4 py-2 text-sm outline-none placeholder:opacity-50 focus:border-[#173E3A]/40"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            type="search"
            value={query}
          />
          <button
            className="shrink-0 rounded-full bg-[#173E3A] px-5 py-2 text-sm font-semibold text-[#D9EFE4] transition hover:opacity-90 disabled:opacity-40"
            disabled={!draft.trim()}
            onClick={() => void handleAdd()}
            type="button"
          >
            Add
          </button>
        </div>
      </section>

      {visible.length === 0 ? (
        <p className="rounded-[20px] bg-[#F4FBF7] p-8 text-center text-sm opacity-60 shadow-sm">
          {notes.length === 0
            ? "No notes yet — paste something above."
            : "No notes match your search."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((note) => (
            <li
              className="flex flex-col gap-3 rounded-[20px] p-4 shadow-sm"
              key={note.id}
              style={{ backgroundColor: pastelFor(note.id) }}
            >
              <div className="flex items-center gap-2">
                {note.pinned && (
                  <span className="rounded-full bg-[#173E3A] px-3 py-0.5 text-xs font-semibold text-[#D9EFE4]">
                    Pinned
                  </span>
                )}
                <h2 className="min-w-0 flex-1 truncate text-sm font-bold">{titleOf(note.body)}</h2>
              </div>
              {restOf(note.body) && (
                <p className="text-sm whitespace-pre-wrap opacity-80">{restOf(note.body)}</p>
              )}
              <div className="mt-auto flex items-center gap-2 pt-1">
                <button
                  aria-label={note.pinned ? "Unpin note" : "Pin note"}
                  aria-pressed={note.pinned}
                  className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold transition hover:bg-white"
                  onClick={() => void handlePin(note.id, note.pinned)}
                  type="button"
                >
                  {note.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  aria-label="Copy note"
                  className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold transition hover:bg-white"
                  onClick={() => void copyText(note.body)}
                  type="button"
                >
                  Copy
                </button>
                <button
                  aria-label="Delete note"
                  className="ml-auto rounded-full bg-white/70 px-3 py-1 text-xs font-semibold transition hover:bg-red-100"
                  onClick={() => void handleDelete(note.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ToolShell>
  );
}

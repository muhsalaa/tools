/** Soft pastel card backgrounds for NoteCards (pastel-notes axis). */
export const PASTELS = ["#FDEBD7", "#FCE4EC", "#E8E0F3", "#DFF3EC", "#FEF6D8", "#DCEBF7"] as const;

/** Deterministic pastel per NoteCard id, so colors survive reload. */
export function pastelFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PASTELS[h % PASTELS.length];
}

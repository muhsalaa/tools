import { useCallback, useEffect, useRef, useState } from "react";
import { ToolShell } from "../components/ToolShell";
import { appendSession, loadDayLog, todayKey, uid, type DayLog } from "../lib/db";
import {
  dayStats,
  durationOf,
  formatTime,
  nextModeAfter,
  playBeep,
  type PomodoroMode,
} from "../lib/pomodoro";

type Status = "idle" | "running" | "paused";

const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

const PILL =
  "rounded-full px-5 py-2 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";

export function PomodoroPage() {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [status, setStatus] = useState<Status>("idle");
  const [remainingSec, setRemainingSec] = useState(durationOf("focus"));
  const [focusDone, setFocusDone] = useState(0);
  const [label, setLabel] = useState("");
  const [muted, setMuted] = useState(false);
  const [log, setLog] = useState<DayLog>({ date: todayKey(), sessions: [] });

  const targetRef = useRef(0);
  const blockStartRef = useRef(0);
  const stateRef = useRef({ mode, focusDone, label, muted });
  stateRef.current = { mode, focusDone, label, muted };

  useEffect(() => {
    let cancelled = false;
    void loadDayLog().then((loaded) => {
      if (cancelled) return;
      setLog(loaded);
      setFocusDone(loaded.sessions.length);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const completeBlock = useCallback(async () => {
    const { mode: m, focusDone: done, label: rawLabel, muted: isMuted } = stateRef.current;
    const end = Date.now();
    if (!isMuted) playBeep();
    if (m === "focus") {
      const trimmed = rawLabel.trim();
      const date = todayKey(new Date(end));
      const next = await appendSession(date, {
        id: uid(),
        start: blockStartRef.current,
        end,
        durationSec: durationOf("focus"),
        ...(trimmed ? { label: trimmed } : {}),
      });
      setLog(next);
      const nextMode = nextModeAfter("focus", done);
      setFocusDone(done + 1);
      setMode(nextMode);
      setRemainingSec(durationOf(nextMode));
    } else {
      setMode("focus");
      setRemainingSec(durationOf("focus"));
    }
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      const left = (targetRef.current - Date.now()) / 1000;
      if (left <= 0) {
        window.clearInterval(id);
        setRemainingSec(0);
        void completeBlock();
      } else {
        setRemainingSec(left);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [status, completeBlock]);

  const start = () => {
    blockStartRef.current = Date.now() - (durationOf(mode) - remainingSec) * 1000;
    targetRef.current = Date.now() + remainingSec * 1000;
    setStatus("running");
  };

  const pause = () => {
    setRemainingSec(Math.max(0, (targetRef.current - Date.now()) / 1000));
    setStatus("paused");
  };

  const reset = () => {
    // Interrupted blocks are never logged — reset just restores the block.
    setStatus("idle");
    setRemainingSec(durationOf(mode));
  };

  const stats = dayStats(log.sessions);
  const running = status === "running";

  return (
    <ToolShell title="Pomodoro">
      <section className="rounded-[20px] bg-[#F4FBF7] p-6 text-center shadow-sm sm:p-8">
        <div className="flex items-center justify-center gap-2">
          {(["focus", "short", "long"] as PomodoroMode[]).map((m) => (
            <span
              key={m}
              className={`rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide ${
                mode === m ? "bg-[#173E3A] text-[#D9EFE4]" : "bg-[#D9EFE4] text-[#173E3A]/50"
              }`}
            >
              {MODE_LABEL[m]}
            </span>
          ))}
        </div>

        <p className="mt-4 text-2xl font-bold tabular-nums" aria-live="polite">
          {MODE_LABEL[mode]}
        </p>
        <p className="mt-1 text-7xl font-black tabular-nums tracking-tight">
          {formatTime(remainingSec)}
        </p>
        <p className="mt-2 text-sm opacity-60">
          {status === "idle"
            ? `Block ${focusDone + 1} · press start when ready`
            : running
              ? "Focusing…"
              : "Paused"}
        </p>

        {mode === "focus" && status === "idle" && (
          <input
            aria-label="Label for this focus block (optional)"
            className="mx-auto mt-4 block w-full max-w-xs rounded-full border border-[#173E3A]/15 bg-white px-5 py-2 text-center text-sm outline-none placeholder:text-[#173E3A]/40 focus:border-[#173E3A]/40"
            maxLength={80}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional) — e.g. deep work"
            value={label}
          />
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {status !== "running" ? (
            <button
              className={`${PILL} bg-[#173E3A] text-[#D9EFE4] hover:opacity-90`}
              onClick={start}
              type="button"
            >
              {status === "paused" ? "Resume" : "Start"}
            </button>
          ) : (
            <button
              className={`${PILL} bg-[#173E3A] text-[#D9EFE4] hover:opacity-90`}
              onClick={pause}
              type="button"
            >
              Pause
            </button>
          )}
          <button
            className={`${PILL} bg-[#D9EFE4] text-[#173E3A] hover:brightness-95`}
            disabled={status === "idle" && remainingSec === durationOf(mode)}
            onClick={reset}
            type="button"
          >
            Reset
          </button>
          <button
            aria-pressed={muted}
            className={`${PILL} bg-[#D9EFE4] text-[#173E3A] hover:brightness-95`}
            onClick={() => setMuted((m) => !m)}
            type="button"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </section>

      <section className="rounded-[20px] bg-[#F4FBF7] p-6 shadow-sm sm:p-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Today&rsquo;s DayLog</h2>
          <p className="text-sm font-semibold tabular-nums">
            {stats.count} {stats.count === 1 ? "session" : "sessions"} · {stats.totalMinutes} min
          </p>
        </div>
        {log.sessions.length === 0 ? (
          <p className="mt-3 text-sm opacity-60">
            No focus blocks yet today. Complete one to log it here.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {log.sessions.map((s) => (
              <li
                className="flex items-center justify-between gap-3 rounded-[14px] bg-[#D9EFE4] px-4 py-2 text-sm"
                key={s.id}
              >
                <span className="truncate font-semibold">
                  {s.label?.trim() ? s.label : "Focus"}
                </span>
                <span className="shrink-0 tabular-nums opacity-60">
                  {new Date(s.start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}
                  {Math.round(s.durationSec / 60)} min
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ToolShell>
  );
}

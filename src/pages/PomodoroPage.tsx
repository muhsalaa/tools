import { useCallback, useEffect, useRef, useState } from "react";
import { ToolShell } from "../components/ToolShell";
import {
  appendSession,
  incrementStreak,
  loadDayLog,
  loadSnapshot,
  loadStreak,
  purgeStaleDayLogs,
  resumeRemaining,
  saveSnapshot,
  todayKey,
  uid,
  type DayLog,
} from "../lib/db";
import {
  activeMs,
  activeSec,
  dayStats,
  durationOf,
  formatTime,
  MODE_LABEL,
  nextModeAfter,
  playBeep,
  type PomodoroMode,
} from "../lib/pomodoro";

type Status = "idle" | "running" | "paused";

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
  const remainingRef = useRef(durationOf("focus"));
  // Truthful timing: wall-clock block start + accumulated active (unpaused)
  // ms + the open run interval. Paused stretches never enter durationSec.
  const wallStartRef = useRef(0);
  const activeMsRef = useRef(0);
  const resumedAtRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const stateRef = useRef({ mode, focusDone, label, muted });
  stateRef.current = { mode, focusDone, label, muted };
  const logRef = useRef(log);
  logRef.current = log;

  const refreshIfNewDay = useCallback(async () => {
    const today = todayKey();
    if (logRef.current.date === today) return;
    await purgeStaleDayLogs(today);
    const [freshLog, freshStreak] = await Promise.all([loadDayLog(today), loadStreak(today)]);
    setLog(freshLog);
    setFocusDone(freshStreak.focusCount);
    setMode("focus");
    setStatus("idle");
    setRemainingSec(durationOf("focus"));
    startedRef.current = false;
    resumedAtRef.current = null;
    activeMsRef.current = 0;
  }, []);

  const persist = useCallback(
    (
      status: "idle" | "running" | "paused",
      opts?: { mode?: PomodoroMode; remain?: number; label?: string; muted?: boolean },
    ) => {
      const s = stateRef.current;
      const mode = opts?.mode ?? s.mode;
      const left =
        opts?.remain ??
        (status === "running"
          ? Math.max(0, (targetRef.current - Date.now()) / 1000)
          : remainingRef.current);
      remainingRef.current = left;
      void saveSnapshot({
        mode,
        status,
        targetAt: targetRef.current,
        remainingSec: left,
        wallStart: wallStartRef.current,
        activeMs:
          status === "running" && resumedAtRef.current !== null
            ? activeMsRef.current + (Date.now() - resumedAtRef.current)
            : activeMsRef.current,
        started: startedRef.current,
        label: opts?.label ?? s.label,
        muted: opts?.muted ?? s.muted,
        savedAt: Date.now(),
      });
    },
    [],
  );

  // Autosave while running: refresh mid-block loses at most ~5s.
  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => persist("running"), 5000);
    return () => window.clearInterval(id);
  }, [status, persist]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const today = todayKey();
      await purgeStaleDayLogs(today);
      const [loaded, streak, snap] = await Promise.all([
        loadDayLog(today),
        loadStreak(today),
        loadSnapshot(),
      ]);
      if (cancelled) return;
      setLog(loaded);
      setFocusDone(streak.focusCount);
      // Refresh restores the timer where it was — running timers resume.
      if (!snap) return;
      setMode(snap.mode);
      setLabel(snap.label);
      setMuted(snap.muted);
      wallStartRef.current = snap.wallStart;
      activeMsRef.current = snap.activeMs;
      startedRef.current = snap.started;
      targetRef.current = snap.targetAt;
      if (snap.status === "running" && snap.started) {
        resumedAtRef.current = Date.now();
        const left = resumeRemaining(snap, Date.now());
        remainingRef.current = left;
        setRemainingSec(left);
        setStatus("running");
      } else {
        resumedAtRef.current = null;
        remainingRef.current = snap.remainingSec;
        setRemainingSec(snap.remainingSec);
        setStatus(snap.status === "running" && !snap.started ? "paused" : snap.status);
      }
    })();
    // Midnight-rollover re-check: tab left open overnight starts clean.
    const onVisible = () => {
      if (document.visibilityState !== "hidden") void refreshIfNewDay();
    };
    const onFocus = () => void refreshIfNewDay();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshIfNewDay]);

  const completeBlock = useCallback(async () => {
    const { mode: m, label: rawLabel, muted: isMuted } = stateRef.current;
    const end = Date.now();
    if (!isMuted) playBeep();
    // Re-check the date immediately before logging (rollover guard).
    await refreshIfNewDay();
    if (m === "focus") {
      const trimmed = rawLabel.trim();
      // Actual active seconds — paused time excluded (spec: truthful Session).
      const durationSec = activeSec(activeMsRef.current, resumedAtRef.current, end);
      const date = todayKey(new Date(end));
      const next = await appendSession(date, {
        id: uid(),
        start: wallStartRef.current || end,
        end,
        durationSec,
        ...(trimmed ? { label: trimmed } : {}),
      });
      setLog(next);
      const streak = await incrementStreak(date);
      const nextMode = nextModeAfter("focus", streak.focusCount - 1);
      setFocusDone(streak.focusCount);
      setMode(nextMode);
      setRemainingSec(durationOf(nextMode));
      persist("idle", { mode: nextMode, remain: durationOf(nextMode) });
    } else {
      setMode("focus");
      setRemainingSec(durationOf("focus"));
      persist("idle", { mode: "focus", remain: durationOf("focus") });
    }
    setStatus("idle");
    startedRef.current = false;
    resumedAtRef.current = null;
    activeMsRef.current = 0;
  }, [refreshIfNewDay, persist]);

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
    const now = Date.now();
    if (!startedRef.current) {
      wallStartRef.current = now;
      activeMsRef.current = 0;
      startedRef.current = true;
    }
    resumedAtRef.current = now;
    targetRef.current = now + remainingSec * 1000;
    setStatus("running");
    persist("running");
  };

  const pause = () => {
    const now = Date.now();
    activeMsRef.current = activeMs(activeMsRef.current, resumedAtRef.current, now);
    resumedAtRef.current = null;
    const left = Math.max(0, (targetRef.current - now) / 1000);
    remainingRef.current = left;
    setRemainingSec(left);
    setStatus("paused");
    persist("paused", { remain: left });
  };

  const reset = () => {
    // Interrupted blocks are never logged — reset just restores the block.
    // Manual restart: the only way back to a fresh block.
    const full = durationOf(mode);
    setStatus("idle");
    setRemainingSec(full);
    startedRef.current = false;
    resumedAtRef.current = null;
    activeMsRef.current = 0;
    persist("idle", { mode, remain: full });
  };

  const switchMode = (m: PomodoroMode) => {
    // Manual switch never logs — just parks the timer on a fresh block.
    const full = durationOf(m);
    setMode(m);
    setRemainingSec(full);
    remainingRef.current = full;
    setStatus("idle");
    startedRef.current = false;
    resumedAtRef.current = null;
    activeMsRef.current = 0;
    persist("idle", { mode: m, remain: full });
  };

  const stats = dayStats(log.sessions);
  const running = status === "running";

  return (
    <ToolShell title="Pomodoro">
      <section className="rounded-[20px] bg-[#F4FBF7] p-6 text-center shadow-sm sm:p-8">
        <div className="flex items-center justify-center gap-2">
          {(["focus", "short", "long"] as PomodoroMode[]).map((m) => {
            // Breaks unlock after the first completed focus Session of the day.
            const locked = m !== "focus" && log.sessions.length === 0 && focusDone === 0;
            return (
              <button
                key={m}
                type="button"
                disabled={locked || status === "running"}
                title={locked ? "Complete one focus block to unlock breaks" : MODE_LABEL[m]}
                onClick={() => switchMode(m)}
                className={`rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  mode === m
                    ? "bg-[#173E3A] text-[#D9EFE4]"
                    : "bg-[#D9EFE4] text-[#173E3A]/50 hover:brightness-95"
                }`}
              >
                {MODE_LABEL[m]}
              </button>
            );
          })}
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
            onBlur={(e) => persist(status, { label: e.target.value })}
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
            onClick={() => {
              const next = !muted;
              setMuted(next);
              persist(status, { muted: next });
            }}
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

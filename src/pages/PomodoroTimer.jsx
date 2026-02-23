/* eslint-disable no-empty */
import { useState, useEffect, useRef, useCallback } from "react";
import "./PomodoroTimer.css";
import { Helmet } from "react-helmet";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  X,
  Check,
  Plus,
  Minus,
  Coffee,
  Zap,
  Moon,
  Flame,
  Volume2,
  VolumeX,
  ChevronRight,
  Circle,
  CheckCircle2,
  Trash2,
} from "lucide-react";

/* ── Session Types ── */
const SESSION_TYPES = {
  focus:       { label: "Focus",        icon: Zap,    color: "var(--pt-focus)",  bg: "var(--pt-focus-bg)",  desc: "Time to concentrate" },
  short_break: { label: "Short Break",  icon: Coffee, color: "var(--pt-short)",  bg: "var(--pt-short-bg)",  desc: "Quick breather" },
  long_break:  { label: "Long Break",   icon: Moon,   color: "var(--pt-long)",   bg: "var(--pt-long-bg)",   desc: "Recharge fully" },
};

const DEFAULT_SETTINGS = {
  focusDuration:      25,
  shortBreakDuration: 5,
  longBreakDuration:  15,
  sessionsUntilLong:  4,
  soundEnabled:       true,
};

/* ── Utility ── */
function pad(n) { return String(n).padStart(2, "0"); }

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

/* ── Soft beep using Web Audio ── */
function useBeep() {
  const ctxRef = useRef(null);

  const beep = useCallback((frequency = 880, duration = 0.15, volume = 0.3) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  const chime = useCallback(() => {
    setTimeout(() => beep(660, 0.15, 0.25), 0);
    setTimeout(() => beep(880, 0.15, 0.25), 180);
    setTimeout(() => beep(1100, 0.25, 0.2), 360);
  }, [beep]);

  return { beep, chime };
}

/* ── Component ── */
export default function PomodoroTimer() {
  const [settings,        setSettings]       = useState(DEFAULT_SETTINGS);
  const [settingsOpen,    setSettingsOpen]    = useState(false);
  const [draftSettings,   setDraftSettings]  = useState(DEFAULT_SETTINGS);

  const [sessionType,     setSessionType]    = useState("focus");
  const [timeLeft,        setTimeLeft]       = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [isRunning,       setIsRunning]      = useState(false);
  const [sessionsDone,    setSessionsDone]   = useState(0);
  const [totalFocusMin,   setTotalFocusMin]  = useState(0);

  const [tasks,           setTasks]          = useState([]);
  const [newTask,         setNewTask]        = useState("");
  const [activeTask,      setActiveTask]     = useState(null);

  const intervalRef = useRef(null);
  const { chime, beep } = useBeep();

  /* ── Derive total duration for progress ring ── */
  const totalDuration = sessionType === "focus"
    ? settings.focusDuration * 60
    : sessionType === "short_break"
    ? settings.shortBreakDuration * 60
    : settings.longBreakDuration * 60;

  const progress = (timeLeft / totalDuration) * 100;

  /* ── Circumference math for SVG ring ── */
  const RADIUS = 88;
  const CIRC   = 2 * Math.PI * RADIUS;
  const strokeDash = CIRC;
  const strokeOffset = CIRC * (1 - progress / 100);

  /* ── Tick ── */
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleSessionEnd();
            return 0;
          }
          if (prev <= 4 && settings.soundEnabled) beep(440, 0.1, 0.15);
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  /* ── Update page title ── */
  useEffect(() => {
    document.title = isRunning
      ? `${formatTime(timeLeft)} — ${SESSION_TYPES[sessionType].label} | Pomodoro`
      : "Pomodoro Focus Timer | ShauryaTools";
    return () => { document.title = "Pomodoro Focus Timer | ShauryaTools"; };
  }, [timeLeft, isRunning, sessionType]);

  function handleSessionEnd() {
    setIsRunning(false);
    if (settings.soundEnabled) chime();

    if (sessionType === "focus") {
      const newDone = sessionsDone + 1;
      setSessionsDone(newDone);
      setTotalFocusMin(prev => prev + settings.focusDuration);

      if (newDone % settings.sessionsUntilLong === 0) {
        switchTo("long_break");
      } else {
        switchTo("short_break");
      }
    } else {
      switchTo("focus");
    }
  }

  function switchTo(type) {
    setSessionType(type);
    setIsRunning(false);
    const dur =
      type === "focus"       ? settings.focusDuration      :
      type === "short_break" ? settings.shortBreakDuration  :
                               settings.longBreakDuration;
    setTimeLeft(dur * 60);
  }

  function handlePlayPause() {
    if (settings.soundEnabled) beep(660, 0.08, 0.2);
    setIsRunning(v => !v);
  }

  function handleReset() {
    setIsRunning(false);
    const dur =
      sessionType === "focus"       ? settings.focusDuration      :
      sessionType === "short_break" ? settings.shortBreakDuration  :
                                      settings.longBreakDuration;
    setTimeLeft(dur * 60);
  }

  function handleSkip() {
    setIsRunning(false);
    handleSessionEnd();
  }

  /* ── Settings ── */
  function openSettings() {
    setDraftSettings({ ...settings });
    setSettingsOpen(true);
  }

  function saveSettings() {
    setSettings({ ...draftSettings });
    setSettingsOpen(false);
    // Reset current session with new duration
    const dur =
      sessionType === "focus"       ? draftSettings.focusDuration      :
      sessionType === "short_break" ? draftSettings.shortBreakDuration  :
                                      draftSettings.longBreakDuration;
    setTimeLeft(dur * 60);
    setIsRunning(false);
  }

  function adjustDraft(key, delta, min, max) {
    setDraftSettings(prev => ({
      ...prev,
      [key]: Math.min(max, Math.max(min, prev[key] + delta)),
    }));
  }

  /* ── Tasks ── */
  function addTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTask.trim(), done: false }]);
    setNewTask("");
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTask === id) setActiveTask(null);
  }

  const sessionInfo = SESSION_TYPES[sessionType];
  const SessionIcon = sessionInfo.icon;
  const doneSessions = Array.from({ length: settings.sessionsUntilLong });

  return (
    <>
      <Helmet>
        <title>Free Pomodoro Focus Timer – Productivity Timer Online | ShauryaTools</title>
        <meta name="description" content="Free online Pomodoro timer with customizable focus sessions, short & long breaks, task tracking, and sound alerts. Boost deep work and stay productive." />
        <meta name="keywords" content="pomodoro timer, focus timer, productivity timer, pomodoro technique, online timer, deep work timer, study timer, time management tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/pomodoro-timer" />
      </Helmet>

      <div className="pt-page" data-session={sessionType}>
        <div className="pt-inner">

          {/* ── Header ── */}
          <div className="pt-header">
            <div className="pt-header-left">
              <div className="pt-icon">
                <Timer size={20} strokeWidth={2} />
              </div>
              <div>
                <span className="pt-cat">Focus Tools</span>
                <h1>Pomodoro Focus Timer</h1>
              </div>
            </div>
            <button className="pt-settings-btn" onClick={openSettings} title="Settings">
              <Settings size={18} strokeWidth={2} />
            </button>
          </div>

          {/* ── Session Tabs ── */}
          <div className="pt-session-tabs">
            {Object.entries(SESSION_TYPES).map(([key, val]) => {
              const Icon = val.icon;
              return (
                <button
                  key={key}
                  className={`pt-session-tab ${sessionType === key ? "pt-tab-on" : ""}`}
                  onClick={() => { if (!isRunning) switchTo(key); }}
                  data-type={key}
                >
                  <Icon size={13} strokeWidth={2.5} />
                  {val.label}
                </button>
              );
            })}
          </div>

          {/* ── Timer Card ── */}
          <div className="pt-timer-card" data-session={sessionType}>

            {/* SVG Ring */}
            <div className="pt-ring-wrap">
              <svg className="pt-ring-svg" viewBox="0 0 200 200">
                {/* Track */}
                <circle
                  cx="100" cy="100" r={RADIUS}
                  fill="none"
                  stroke="var(--pt-ring-track)"
                  strokeWidth="8"
                />
                {/* Progress */}
                <circle
                  cx="100" cy="100" r={RADIUS}
                  fill="none"
                  stroke={sessionInfo.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 100 100)"
                  className="pt-ring-progress"
                />
              </svg>

              <div className="pt-ring-inner">
                <div className="pt-session-label" data-session={sessionType}>
                  <SessionIcon size={14} strokeWidth={2.5} />
                  {sessionInfo.label}
                </div>
                <div className="pt-time-display">{formatTime(timeLeft)}</div>
                <div className="pt-session-desc">{sessionInfo.desc}</div>
              </div>
            </div>

            {/* Session dots */}
            <div className="pt-dots">
              {doneSessions.map((_, i) => (
                <span
                  key={i}
                  className={`pt-dot ${i < (sessionsDone % settings.sessionsUntilLong) || (sessionsDone > 0 && sessionsDone % settings.sessionsUntilLong === 0 && sessionType !== "focus") ? "pt-dot-done" : ""}`}
                  data-session={sessionType}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="pt-controls">
              <button className="pt-ctrl-btn pt-ctrl-secondary" onClick={handleReset} title="Reset">
                <RotateCcw size={18} strokeWidth={2} />
              </button>

              <button
                className={`pt-play-btn ${isRunning ? "pt-playing" : ""}`}
                onClick={handlePlayPause}
                data-session={sessionType}
              >
                {isRunning
                  ? <Pause size={28} strokeWidth={2} />
                  : <Play  size={28} strokeWidth={2} style={{ marginLeft: 3 }} />}
              </button>

              <button className="pt-ctrl-btn pt-ctrl-secondary" onClick={handleSkip} title="Skip to next">
                <SkipForward size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Sound toggle */}
            <button
              className={`pt-sound-btn ${settings.soundEnabled ? "pt-sound-on" : ""}`}
              onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
            >
              {settings.soundEnabled
                ? <><Volume2 size={14} strokeWidth={2} /> Sound On</>
                : <><VolumeX size={14} strokeWidth={2} /> Sound Off</>}
            </button>
          </div>

          {/* ── Stats Row ── */}
          <div className="pt-stats-row">
            <div className="pt-stat">
              <Flame size={16} strokeWidth={2} className="pt-stat-icon" />
              <span className="pt-stat-value">{sessionsDone}</span>
              <span className="pt-stat-label">Sessions done</span>
            </div>
            <div className="pt-stat-divider" />
            <div className="pt-stat">
              <Timer size={16} strokeWidth={2} className="pt-stat-icon" />
              <span className="pt-stat-value">{totalFocusMin}</span>
              <span className="pt-stat-label">Focus minutes</span>
            </div>
            <div className="pt-stat-divider" />
            <div className="pt-stat">
              <Zap size={16} strokeWidth={2} className="pt-stat-icon" />
              <span className="pt-stat-value">{Math.floor(totalFocusMin / 60)}h {totalFocusMin % 60}m</span>
              <span className="pt-stat-label">Total focus time</span>
            </div>
          </div>

          {/* ── Task List ── */}
          <div className="pt-task-card">
            <div className="pt-task-header">
              <span className="pt-task-title">
                <CheckCircle2 size={15} strokeWidth={2.5} />
                Tasks
              </span>
              <span className="pt-task-count">{tasks.filter(t => t.done).length}/{tasks.length}</span>
            </div>

            <form className="pt-task-form" onSubmit={addTask}>
              <input
                type="text"
                className="pt-task-input"
                placeholder="Add a task for this session..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                maxLength={120}
              />
              <button type="submit" className="pt-task-add-btn" disabled={!newTask.trim()}>
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </form>

            {tasks.length === 0 && (
              <div className="pt-task-empty">
                <Circle size={28} strokeWidth={1.5} />
                <span>No tasks yet — add one above</span>
              </div>
            )}

            <ul className="pt-task-list">
              {tasks.map(task => (
                <li
                  key={task.id}
                  className={`pt-task-item ${task.done ? "pt-task-done" : ""} ${activeTask === task.id ? "pt-task-active" : ""}`}
                  onClick={() => setActiveTask(activeTask === task.id ? null : task.id)}
                >
                  <button
                    className="pt-task-check"
                    onClick={e => { e.stopPropagation(); toggleTask(task.id); }}
                  >
                    {task.done
                      ? <CheckCircle2 size={17} strokeWidth={2} />
                      : <Circle       size={17} strokeWidth={2} />}
                  </button>
                  <span className="pt-task-text">{task.text}</span>
                  {activeTask === task.id && (
                    <ChevronRight size={13} strokeWidth={2.5} className="pt-task-arrow" />
                  )}
                  <button
                    className="pt-task-del"
                    onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                    title="Delete"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── Settings Modal ── */}
      {settingsOpen && (
        <div className="pt-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="pt-modal" onClick={e => e.stopPropagation()}>
            <div className="pt-modal-header">
              <span className="pt-modal-title">
                <Settings size={16} strokeWidth={2.5} />
                Timer Settings
              </span>
              <button className="pt-modal-close" onClick={() => setSettingsOpen(false)}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="pt-modal-body">

              {[
                { key: "focusDuration",      label: "Focus Duration",       icon: Zap,    unit: "min", min: 1,  max: 90  },
                { key: "shortBreakDuration", label: "Short Break Duration", icon: Coffee, unit: "min", min: 1,  max: 30  },
                { key: "longBreakDuration",  label: "Long Break Duration",  icon: Moon,   unit: "min", min: 5,  max: 60  },
                { key: "sessionsUntilLong",  label: "Sessions until Long Break", icon: Flame, unit: "sessions", min: 2, max: 8 },
              ].map(({ key, label, icon: Icon, unit, min, max }) => (
                <div key={key} className="pt-setting-row">
                  <div className="pt-setting-label">
                    <Icon size={14} strokeWidth={2.5} />
                    {label}
                  </div>
                  <div className="pt-setting-ctrl">
                    <button
                      className="pt-adj-btn"
                      onClick={() => adjustDraft(key, -1, min, max)}
                      disabled={draftSettings[key] <= min}
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </button>
                    <span className="pt-setting-val">{draftSettings[key]} <em>{unit}</em></span>
                    <button
                      className="pt-adj-btn"
                      onClick={() => adjustDraft(key, +1, min, max)}
                      disabled={draftSettings[key] >= max}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}

            </div>

            <div className="pt-modal-footer">
              <button className="pt-modal-cancel" onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button className="pt-modal-save"   onClick={saveSettings}>
                <Check size={15} strokeWidth={2.5} /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
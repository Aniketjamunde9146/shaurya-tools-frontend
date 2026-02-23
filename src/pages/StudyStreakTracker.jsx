import { useState, useEffect, useRef, useCallback } from "react";
import "./StudyStreakTracker.css";
import { Helmet } from "react-helmet";
import {
  Flame,
  Plus,
  BookOpen,
  Clock,
  Target,
  BarChart2,
  Calendar,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Zap,
  Brain,
  Hash,
  FileText,
} from "lucide-react";

/* ── Constants ── */
const SUBJECTS = [
  "Math", "Science", "History", "Language", "Literature",
  "Programming", "Art", "Music", "Geography", "Other",
];

const SUBJECT_COLORS = {
  Math:        "#4f46e5",
  Science:     "#0d9488",
  History:     "#d97706",
  Language:    "#7c3aed",
  Literature:  "#db2777",
  Programming: "#2563eb",
  Art:         "#f97316",
  Music:       "#16a34a",
  Geography:   "#0891b2",
  Other:       "#737373",
};

const DURATIONS = [
  { id: "15",  label: "15m" },
  { id: "30",  label: "30m" },
  { id: "45",  label: "45m" },
  { id: "60",  label: "1h"  },
  { id: "90",  label: "1.5h"},
  { id: "120", label: "2h"  },
];

/* ── Helpers ── */
function toDateStr(date) {
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function todayStr() { return toDateStr(new Date()); }

function formatDate(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMins(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/* ── Storage helpers ── */
function loadData(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveData(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ── Streak computation ── */
function computeStreaks(sessions) {
  if (!sessions.length) return { current: 0, longest: 0 };
  const days = [...new Set(sessions.map(s => s.date))].sort();
  let current = 0, longest = 0, streak = 1;

  // Longest
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i]) - new Date(days[i - 1])) / 86400000;
    if (diff === 1) { streak++; } else { longest = Math.max(longest, streak); streak = 1; }
  }
  longest = Math.max(longest, streak);

  // Current (must include today or yesterday)
  const today = new Date(); today.setHours(0,0,0,0);
  const lastDate = new Date(days[days.length - 1] + "T00:00:00");
  const gapFromToday = (today - lastDate) / 86400000;
  if (gapFromToday > 1) return { current: 0, longest };

  current = 1;
  for (let i = days.length - 2; i >= 0; i--) {
    const diff = (new Date(days[i + 1]) - new Date(days[i])) / 86400000;
    if (diff === 1) current++; else break;
  }
  return { current, longest };
}

/* ── Generate heatmap cells (last 16 weeks) ── */
function buildHeatmap(sessions) {
  const map = {};
  for (const s of sessions) {
    map[s.date] = (map[s.date] || 0) + s.duration;
  }

  const weeks = 16;
  const today = new Date(); today.setHours(0,0,0,0);
  // Start from the Sunday of (16 weeks ago)
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7);

  const cols = [];
  let cur = new Date(start);
  while (cur <= today) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      if (cur > today) { col.push(null); }
      else {
        const key = toDateStr(cur);
        col.push({ date: key, mins: map[key] || 0 });
      }
      cur.setDate(cur.getDate() + 1);
    }
    cols.push(col);
  }
  return cols;
}

function heatLevel(mins) {
  if (!mins) return 0;
  if (mins <= 20) return 1;
  if (mins <= 45) return 2;
  if (mins <= 90) return 3;
  return 4;
}

/* ── Subject breakdown ── */
function subjectBreakdown(sessions) {
  const map = {};
  for (const s of sessions) {
    map[s.subject] = (map[s.subject] || 0) + s.duration;
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, mins]) => ({ name, mins, pct: total ? Math.round((mins / total) * 100) : 0 }));
}

/* ── Main Component ── */
export default function StudyStreakTracker() {
  // ─── State ───────────────────────────────────────────
  const [sessions,    setSessions]  = useState(() => loadData("sst_sessions", []));
  const [dailyGoal,   setDailyGoal] = useState(() => loadData("sst_goal", 60)); // minutes
  const [goalDraft,   setGoalDraft] = useState("");
  const [editingGoal, setEditGoal]  = useState(false);

  // Form
  const [subject,  setSubject]  = useState("Math");
  const [duration, setDuration] = useState("30");
  const [notes,    setNotes]    = useState("");
  const [date,     setDate]     = useState(todayStr());
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  // Tooltip
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  // Persist
  useEffect(() => saveData("sst_sessions", sessions), [sessions]);
  useEffect(() => saveData("sst_goal", dailyGoal), [dailyGoal]);

  // ─── Derived ─────────────────────────────────────────
  const { current: currentStreak, longest: longestStreak } = computeStreaks(sessions);

  const todaySessions = sessions.filter(s => s.date === todayStr());
  const todayMins     = todaySessions.reduce((a, s) => a + s.duration, 0);
  const goalPct       = Math.min(Math.round((todayMins / dailyGoal) * 100), 100);

  const totalDays   = new Set(sessions.map(s => s.date)).size;
  const totalMins   = sessions.reduce((a, s) => a + s.duration, 0);
  const totalHours  = (totalMins / 60).toFixed(1);
  const breakdown   = subjectBreakdown(sessions);
  const topSubject  = breakdown[0]?.name || "—";

  const heatmap    = buildHeatmap(sessions);
  const studiedToday = todayMins > 0;

  // ─── Handlers ────────────────────────────────────────
  function handleLog() {
    if (!subject) { setError("Please pick a subject."); return; }
    if (!date)    { setError("Please pick a date.");    return; }
    setError("");
    const session = {
      id:       Date.now(),
      subject,
      duration: parseInt(duration, 10),
      notes:    notes.trim(),
      date,
    };
    setSessions(prev => [session, ...prev]);
    setNotes("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2200);
  }

  function handleDelete(id) {
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  function handleGoalSave() {
    const v = parseInt(goalDraft, 10);
    if (!isNaN(v) && v > 0) { setDailyGoal(v); }
    setEditGoal(false);
  }

  function handleHeatHover(e, cell) {
    if (!cell) return;
    const text = cell.mins
      ? `${formatDate(cell.date)}: ${formatMins(cell.mins)}`
      : `${formatDate(cell.date)}: No study`;
    setTooltip({ visible: true, text, x: e.clientX + 12, y: e.clientY - 32 });
  }

  function handleHeatLeave() { setTooltip(t => ({ ...t, visible: false })); }

  const recentSessions = sessions.slice(0, 12);

  return (
    <>
      <Helmet>
        <title>Study Streak Tracker – Track Daily Study Sessions | ShauryaTools</title>
        <meta name="description" content="Track your daily study streaks, log study sessions by subject, visualise your progress with a heatmap calendar, and hit your daily study goals. Free tool." />
        <meta name="keywords" content="study streak tracker, study habit tracker, daily study log, study heatmap, study goals, study sessions, habit tracker" />
        <link rel="canonical" href="https://shauryatools.vercel.app/study-streak-tracker" />
      </Helmet>

      {/* Global tooltip */}
      <div
        className={`sst-tooltip ${tooltip.visible ? "sst-tooltip-visible" : ""}`}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        {tooltip.text}
      </div>

      <div className="sst-page">
        <div className="sst-inner">

          {/* ── Header ── */}
          <div className="sst-header">
            <div className="sst-icon"><Flame size={22} strokeWidth={2} /></div>
            <div>
              <span className="sst-cat">AI Study Tools</span>
              <h1>Study Streak Tracker</h1>
              <p>Log your daily study sessions, build streaks, hit your goals — all in one place.</p>
            </div>
          </div>

          {/* ── Streak Hero ── */}
          <div className="sst-streak-hero sst-animate">
            <div className="sst-streak-left">
              <span className="sst-streak-label">🔥 Current Streak</span>
              <div className="sst-streak-count">{currentStreak}</div>
              <p className="sst-streak-sub">
                {currentStreak === 0
                  ? "Log a session to start your streak!"
                  : currentStreak === 1
                    ? "Day in a row — keep going!"
                    : `Days in a row — incredible!`}
              </p>
            </div>
            <div className="sst-streak-right">
              <div className="sst-streak-stat">
                <span className="sst-streak-stat-val">{longestStreak}</span>
                <span className="sst-streak-stat-lbl">Best Streak</span>
              </div>
              <div className="sst-streak-stat">
                <span className="sst-streak-stat-val">{totalDays}</span>
                <span className="sst-streak-stat-lbl">Days Studied</span>
              </div>
              <div className="sst-fire-emoji" role="img" aria-label="fire">
                {currentStreak >= 7 ? "🏆" : currentStreak >= 3 ? "🔥" : "✨"}
              </div>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="sst-stats-grid sst-animate">
            <div className="sst-stat-box">
              <div className="sst-stat-icon sst-stat-icon-accent"><Clock size={14} strokeWidth={2.5} /></div>
              <span className="sst-stat-val">{formatMins(todayMins || 0)}</span>
              <span className="sst-stat-lbl">Today</span>
            </div>
            <div className="sst-stat-box">
              <div className="sst-stat-icon sst-stat-icon-violet"><Trophy size={14} strokeWidth={2.5} /></div>
              <span className="sst-stat-val">{totalHours}h</span>
              <span className="sst-stat-lbl">Total Hours</span>
            </div>
            <div className="sst-stat-box">
              <div className="sst-stat-icon sst-stat-icon-amber"><Brain size={14} strokeWidth={2.5} /></div>
              <span className="sst-stat-val">{topSubject}</span>
              <span className="sst-stat-lbl">Top Subject</span>
            </div>
            <div className="sst-stat-box">
              <div className="sst-stat-icon sst-stat-icon-green"><Hash size={14} strokeWidth={2.5} /></div>
              <span className="sst-stat-val">{sessions.length}</span>
              <span className="sst-stat-lbl">Sessions</span>
            </div>
          </div>

          {/* ── Today's Goal ── */}
          <div className="sst-card sst-animate">
            <div className="sst-card-title">
              <Target size={15} strokeWidth={2.5} />
              Today's Goal
              {studiedToday && (
                <span className="sst-today-badge" style={{ marginLeft: "auto" }}>
                  <CheckCircle2 size={11} strokeWidth={2.5} />
                  {goalPct >= 100 ? "Goal smashed! 🎉" : `${goalPct}% done`}
                </span>
              )}
            </div>

            <div className="sst-goal-wrap">
              <div className="sst-goal-row">
                <span className="sst-goal-label">
                  {formatMins(todayMins)} studied · Goal: {formatMins(dailyGoal)}
                </span>
                {!editingGoal ? (
                  <button
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.74rem", fontWeight: 600, color: "var(--fg-accent)", fontFamily: "var(--font-body)" }}
                    onClick={() => { setGoalDraft(String(dailyGoal)); setEditGoal(true); }}
                  >
                    Edit goal
                  </button>
                ) : (
                  <div className="sst-goal-edit">
                    <input
                      type="number" min="5" max="600"
                      value={goalDraft}
                      onChange={e => setGoalDraft(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleGoalSave()}
                      autoFocus
                    />
                    <span className="sst-goal-edit-lbl">min</span>
                    <button className="sst-goal-save" onClick={handleGoalSave}>Save</button>
                  </div>
                )}
              </div>
              <div className="sst-goal-track">
                <div
                  className={`sst-goal-fill ${goalPct >= 100 ? "sst-goal-fill-over" : ""}`}
                  style={{ width: `${goalPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Log Session ── */}
          <div className="sst-card sst-animate">
            <div className="sst-card-title">
              <Plus size={15} strokeWidth={2.5} />
              Log a Session
            </div>

            {/* Subject */}
            <div className="sst-field">
              <label className="sst-label"><BookOpen size={14} strokeWidth={2.5} className="sst-lbl-icon" />Subject</label>
              <div className="sst-chips">
                {SUBJECTS.map(s => (
                  <button
                    key={s}
                    className={`sst-chip ${subject === s ? "sst-chip-on" : ""}`}
                    onClick={() => setSubject(s)}
                    style={subject === s ? { background: `${SUBJECT_COLORS[s]}18`, borderColor: `${SUBJECT_COLORS[s]}66`, color: SUBJECT_COLORS[s] } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="sst-divider" />

            <div className="sst-row-2">
              {/* Duration */}
              <div className="sst-field">
                <label className="sst-label"><Clock size={14} strokeWidth={2.5} className="sst-lbl-icon" />Duration</label>
                <div className="sst-chips">
                  {DURATIONS.map(d => (
                    <button
                      key={d.id}
                      className={`sst-chip ${duration === d.id ? "sst-chip-on" : ""}`}
                      onClick={() => setDuration(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="sst-field">
                <label className="sst-label"><Calendar size={14} strokeWidth={2.5} className="sst-lbl-icon" />Date</label>
                <input
                  className="sst-input"
                  type="date"
                  value={date}
                  max={todayStr()}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="sst-field">
              <label className="sst-label"><FileText size={14} strokeWidth={2.5} className="sst-lbl-icon" />Notes <span style={{ fontWeight: 400, color: "var(--grey-3)", fontSize: "0.8rem" }}>(optional)</span></label>
              <textarea
                className="sst-textarea"
                placeholder="What did you study today? Any key takeaways..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="sst-error"><AlertCircle size={14} strokeWidth={2.5} />{error}</div>
            )}

            <button
              className={`sst-submit ${success ? "sst-submit-success" : ""}`}
              onClick={handleLog}
            >
              {success
                ? <><CheckCircle2 size={16} strokeWidth={2} />Session Logged!</>
                : <><Plus size={16} strokeWidth={2.5} />Log Study Session</>}
            </button>
          </div>

          {/* ── Heatmap ── */}
          <div className="sst-card sst-animate">
            <div className="sst-card-title">
              <BarChart2 size={15} strokeWidth={2.5} />
              Activity Heatmap
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 500, color: "var(--grey-3)" }}>
                Last 16 weeks
              </span>
            </div>
            <div className="sst-heatmap-scroll">
              <div className="sst-heatmap">
                {heatmap.map((col, ci) => (
                  <div key={ci} className="sst-heatmap-col">
                    {col.map((cell, di) =>
                      cell === null
                        ? <div key={di} className="sst-heatmap-day" style={{ visibility: "hidden" }} />
                        : (
                          <div
                            key={di}
                            className={`sst-heatmap-day sst-heat-${heatLevel(cell.mins)}`}
                            onMouseMove={e => handleHeatHover(e, cell)}
                            onMouseLeave={handleHeatLeave}
                          />
                        )
                    )}
                  </div>
                ))}
              </div>
              <div className="sst-heatmap-legend" style={{ marginTop: 10 }}>
                <span className="sst-legend-label">Less</span>
                {[0,1,2,3,4].map(l => (
                  <div
                    key={l}
                    className={`sst-legend-sq sst-heat-${l}`}
                  />
                ))}
                <span className="sst-legend-label">More</span>
              </div>
            </div>
          </div>

          {/* ── Subject Breakdown ── */}
          {breakdown.length > 0 && (
            <div className="sst-card sst-animate">
              <div className="sst-card-title">
                <Brain size={15} strokeWidth={2.5} />
                Subject Breakdown
              </div>
              <div className="sst-subject-bars">
                {breakdown.map(({ name, mins, pct }) => (
                  <div key={name} className="sst-subj-row">
                    <div className="sst-subj-top">
                      <span className="sst-subj-name">{name}</span>
                      <span className="sst-subj-mins">{formatMins(mins)} · {pct}%</span>
                    </div>
                    <div className="sst-subj-track">
                      <div
                        className="sst-subj-fill"
                        style={{ width: `${pct}%`, background: SUBJECT_COLORS[name] || "var(--fg-accent)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recent Sessions ── */}
          <div className="sst-card sst-animate">
            <div className="sst-card-title">
              <Zap size={15} strokeWidth={2.5} />
              Recent Sessions
              {sessions.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 500, color: "var(--grey-3)" }}>
                  {sessions.length} total
                </span>
              )}
            </div>

            {recentSessions.length === 0 ? (
              <div className="sst-empty">
                <div className="sst-empty-icon">📚</div>
                <p className="sst-empty-text">No sessions yet. Log your first one above to start your streak!</p>
              </div>
            ) : (
              <div className="sst-sessions">
                {recentSessions.map(s => (
                  <div key={s.id} className="sst-session-row">
                    <div className={`sst-session-dot ${s.date === todayStr() ? "sst-session-dot-today" : ""}`} />
                    <div className="sst-session-info">
                      <div className="sst-session-top">
                        <span className="sst-session-subject">{s.subject}</span>
                        {s.date === todayStr() && (
                          <span className="sst-session-pill">Today</span>
                        )}
                      </div>
                      <div className="sst-session-bottom">
                        <span className="sst-session-date">{formatDate(s.date)}</span>
                        {s.notes && <span className="sst-session-note">{s.notes.slice(0, 60)}{s.notes.length > 60 ? "…" : ""}</span>}
                      </div>
                    </div>
                    <span className="sst-session-dur">{formatMins(s.duration)}</span>
                    <button className="sst-session-del" onClick={() => handleDelete(s.id)} title="Delete session">
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
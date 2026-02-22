/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./StudyTimeCalculator.css";
import { Helmet } from "react-helmet";
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Target,
  Brain,
  Zap,
  Coffee,
  Moon,
  Sun,
  BarChart2,
  ListChecks,
  ChevronDown,
  AlignLeft,
  Timer,
  Flame,
  Star,
} from "lucide-react";

/* ── Study Techniques ── */
const TECHNIQUES = [
  { id: "pomodoro",    label: "Pomodoro (25/5)"  },
  { id: "pomodoro50", label: "Deep Work (50/10)" },
  { id: "timeblock",  label: "Time Blocking"     },
  { id: "spaced",     label: "Spaced Repetition" },
  { id: "feynman",    label: "Feynman Method"    },
  { id: "free",       label: "Free Flow"         },
];

/* ── Session Lengths ── */
const SESSION_LENGTHS = [
  { id: "25",  label: "25 min" },
  { id: "45",  label: "45 min" },
  { id: "60",  label: "60 min" },
  { id: "90",  label: "90 min" },
];

/* ── Study Days Per Week ── */
const DAYS_OPTIONS = [
  { id: "3",  label: "3 days" },
  { id: "4",  label: "4 days" },
  { id: "5",  label: "5 days" },
  { id: "6",  label: "6 days" },
  { id: "7",  label: "Every day" },
];

/* ── Difficulty options ── */
const DIFFICULTIES = [
  { id: "easy", label: "Easy"   },
  { id: "med",  label: "Medium" },
  { id: "hard", label: "Hard"   },
];

/* ── Goal types ── */
const GOAL_TYPES = [
  { id: "exam",      label: "Exam Prep",      icon: Target,    desc: "Prepare for a test" },
  { id: "semester",  label: "Semester Plan",  icon: Calendar,  desc: "Manage coursework"  },
  { id: "skill",     label: "Skill Learning", icon: Brain,     desc: "Learn something new" },
  { id: "revision",  label: "Quick Revision", icon: Zap,       desc: "Short-term review"  },
];

/* ── Peak time ── */
const PEAK_TIMES = [
  { id: "morning",   label: "Morning",   icon: Sun   },
  { id: "afternoon", label: "Afternoon", icon: Coffee },
  { id: "evening",   label: "Evening",   icon: Moon  },
];

/* ── Include options ── */
const INCLUDES = [
  { key: "includeSchedule", icon: <Calendar size={13} strokeWidth={2}/>, label: "Daily Schedule"  },
  { key: "includeTips",     icon: <Zap       size={13} strokeWidth={2}/>, label: "Study Tips"      },
  { key: "includeBreaks",   icon: <Coffee    size={13} strokeWidth={2}/>, label: "Break Strategy"  },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ── Component ── */
export default function StudyTimeCalculator() {
  /* Inputs */
  const [goalType,         setGoalType]         = useState("exam");
  const [technique,        setTechnique]         = useState("pomodoro");
  const [sessionLength,    setSessionLength]     = useState("25");
  const [daysPerWeek,      setDaysPerWeek]       = useState("5");
  const [peakTime,         setPeakTime]          = useState("morning");
  const [examDate,         setExamDate]          = useState("");
  const [hoursAvailable,   setHoursAvailable]    = useState("");
  const [notes,            setNotes]             = useState("");

  const [subjects, setSubjects] = useState([
    { id: uid(), name: "", hours: "", difficulty: "med" },
    { id: uid(), name: "", hours: "", difficulty: "med" },
  ]);

  const [includeSchedule, setIncludeSchedule] = useState(true);
  const [includeTips,     setIncludeTips]     = useState(true);
  const [includeBreaks,   setIncludeBreaks]   = useState(true);

  /* Output */
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState(null);
  const [copied,    setCopied]    = useState("");
  const [activeTab, setActiveTab] = useState("plan");

  const charMax    = 400;
  const canSubmit  = !loading;

  /* ── Subject helpers ── */
  function addSubject() {
    setSubjects(s => [...s, { id: uid(), name: "", hours: "", difficulty: "med" }]);
  }
  function removeSubject(id) {
    if (subjects.length <= 1) return;
    setSubjects(s => s.filter(x => x.id !== id));
  }
  function updateSubject(id, key, val) {
    setSubjects(s => s.map(x => x.id === id ? { ...x, [key]: val } : x));
  }

  /* ── Includes toggle helper ── */
  const setMap = { includeSchedule: setIncludeSchedule, includeTips: setIncludeTips, includeBreaks: setIncludeBreaks };
  const stateMap = { includeSchedule, includeTips, includeBreaks };

  /* ── Generate ── */
  async function handleGenerate() {
    if (!canSubmit) return;
    const validSubjects = subjects.filter(s => s.name.trim() && s.hours);
    if (!validSubjects.length) { setError("Please add at least one subject with a name and hours."); return; }
    setError(""); setLoading(true); setResult(null);

    const selectedGoal = GOAL_TYPES.find(g => g.id === goalType);

    const prompt = `You are an expert academic coach and study planner. Create a personalized, detailed study time plan.

Goal Type: ${selectedGoal?.label} — ${selectedGoal?.desc}
Study Technique: ${technique}
Session Length: ${sessionLength} minutes
Study Days Per Week: ${daysPerWeek}
Peak Study Time: ${peakTime}
${examDate ? `Exam / Deadline Date: ${examDate}` : ""}
${hoursAvailable ? `Total Daily Hours Available: ${hoursAvailable} hours` : ""}
${notes.trim() ? `Extra Notes: ${notes.trim()}` : ""}

Subjects:
${validSubjects.map(s => `  - ${s.name}: ${s.hours} hours total needed, difficulty: ${s.difficulty}`).join("\n")}

Include Daily Schedule: ${includeSchedule}
Include Study Tips: ${includeTips}
Include Break Strategy: ${includeBreaks}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro, no markdown, no text outside JSON.
Exact required shape:
{
  "title": "...",
  "summary": "...",
  "totalHours": "...",
  "totalSessions": "...",
  "subjects": [
    {
      "name": "...",
      "totalHours": "...",
      "dailyMinutes": "...",
      "sessionsPerWeek": "...",
      "difficulty": "easy|med|hard",
      "strategy": "...",
      "note": "..."
    }
  ],
  "weeklySchedule": [
    {
      "day": "Monday",
      "items": ["Subject: X min — topic focus", "..."]
    }
  ],
  "breakStrategy": "...",
  "tips": ["...", "..."],
  "affirmation": "..."
}

RULES:
- "title": short personalized plan title (e.g. "Alex's 3-Week Exam Prep Plan")
- "summary": 1-2 sentence overview of the plan strategy
- "totalHours": total study hours across all subjects
- "totalSessions": estimated total study sessions
- "subjects": one entry per subject with:
  - "sessionsPerWeek": how many sessions per week for this subject
  - "dailyMinutes": recommended daily minutes
  - "strategy": brief approach (e.g. "Active recall + past papers in final week")
  - "note": one practical tip for this subject
- "weeklySchedule": only if includeSchedule is true; array of day objects for a sample week (${daysPerWeek} days). Each day has:
  - "day": day name
  - "items": 2-4 strings describing what to study and for how long
- "breakStrategy": only if includeBreaks is true; 1-2 sentence break recommendation using ${technique} technique. Else ""
- "tips": only if includeTips is true; 3-4 actionable study tips. Else []
- "affirmation": one short motivational sentence
- Prioritize harder subjects with more time
- Use the ${technique} technique in session structure
- Respect the ${sessionLength}-minute session length
- Keep all text concise and practical
- Return ONLY the JSON object, nothing else`;

    try {
      const res = await generateAI("study-calc", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.subjects || !Array.isArray(parsed.subjects)) throw new Error("Invalid format");

      setResult(parsed);
      setActiveTab("plan");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Build raw text ── */
  function buildRawText() {
    if (!result) return "";
    let t = `${result.title}\n${"─".repeat(44)}\n${result.summary}\n\n`;
    t += `Total Study Time: ${result.totalHours} | Sessions: ${result.totalSessions}\n\n`;
    t += `SUBJECTS\n${"─".repeat(20)}\n`;
    result.subjects.forEach(s => {
      t += `  ${s.name} (${s.difficulty.toUpperCase()})\n`;
      t += `    Time: ${s.totalHours} | ${s.sessionsPerWeek} sessions/week | ${s.dailyMinutes} min/day\n`;
      t += `    Strategy: ${s.strategy}\n`;
      if (s.note) t += `    ↳ ${s.note}\n`;
    });
    if (result.weeklySchedule?.length) {
      t += `\nWEEKLY SCHEDULE\n${"─".repeat(20)}\n`;
      result.weeklySchedule.forEach(d => {
        t += `  ${d.day}\n`;
        d.items.forEach(item => { t += `    • ${item}\n`; });
      });
    }
    if (result.breakStrategy) t += `\nBREAK STRATEGY\n${"─".repeat(20)}\n${result.breakStrategy}\n`;
    if (result.tips?.length) {
      t += `\nTIPS\n${"─".repeat(20)}\n`;
      result.tips.forEach(tip => { t += `• ${tip}\n`; });
    }
    if (result.affirmation) t += `\n"${result.affirmation}"`;
    return t;
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildRawText());
    setCopied("all");
    setTimeout(() => setCopied(""), 2500);
  }
  function handleDownload() {
    const blob = new Blob([buildRawText()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "study-plan.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function handleReset() {
    setGoalType("exam"); setTechnique("pomodoro"); setSessionLength("25");
    setDaysPerWeek("5"); setPeakTime("morning"); setExamDate(""); setHoursAvailable(""); setNotes("");
    setSubjects([{ id: uid(), name: "", hours: "", difficulty: "med" }, { id: uid(), name: "", hours: "", difficulty: "med" }]);
    setIncludeSchedule(true); setIncludeTips(true); setIncludeBreaks(true);
    setResult(null); setError(""); setCopied("");
  }

  const selectedGoalData  = GOAL_TYPES.find(g => g.id === goalType);
  const GoalIcon          = selectedGoalData?.icon;
  const totalSubjectHours = subjects.reduce((a, s) => a + (parseFloat(s.hours) || 0), 0);

  /* ── Difficulty class map ── */
  const diffClass = { easy: "st-diff-easy-on", med: "st-diff-med-on", hard: "st-diff-hard-on" };

  /* ── Progress percent (for result bar) ── */
  function pct(subj) {
    if (!result) return 0;
    const total = result.subjects.reduce((a, s) => a + parseFloat(s.totalHours) || 0, 0);
    return total > 0 ? Math.round(((parseFloat(subj.totalHours) || 0) / total) * 100) : 0;
  }

  return (
    <>
      <Helmet>
        <title>Free AI Study Time Calculator – Personalized Study Plans | ShauryaTools</title>
        <meta name="description" content="Generate a personalized study schedule with AI. Add subjects, set difficulty, pick your technique and get a full weekly plan with tips. Free AI study planner." />
        <meta name="keywords" content="study time calculator, ai study planner, study schedule generator, pomodoro study plan, exam prep planner, free study calculator" />
        <link rel="canonical" href="https://shauryatools.vercel.app/study-time-calculator" />
      </Helmet>

      <div className="st-page">
        <div className="st-inner">

          {/* ── Header ── */}
          <div className="st-header">
            <div className="st-icon-box">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="st-cat">AI Productivity Tools</span>
              <h1>Study Time Calculator</h1>
              <p>Add your subjects and goals — get a smart, personalized study schedule with session breakdowns instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="st-card">

            {/* Goal Type */}
            <div className="st-field">
              <div className="st-label-row">
                <label className="st-label">
                  <Target size={14} className="st-label-icon" /> Study Goal
                </label>
                {selectedGoalData && (
                  <span className="st-badge">
                    {GoalIcon && <GoalIcon size={11} strokeWidth={2.5} />}
                    {selectedGoalData.label}
                  </span>
                )}
              </div>
              <div className="st-two-col" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {GOAL_TYPES.map(g => {
                  const Icon = g.icon;
                  const on = goalType === g.id;
                  return (
                    <button
                      key={g.id}
                      className={`st-subject-row${on ? " st-goal-on" : ""}`}
                      style={{ flexDirection: "column", alignItems: "flex-start", cursor: "pointer",
                               background: on ? "var(--st-bg)" : "", borderColor: on ? "var(--st-bd)" : "",
                               boxShadow: on ? "0 0 0 1px var(--st-bd)" : "" }}
                      onClick={() => setGoalType(g.id)}
                    >
                      <Icon size={15} strokeWidth={2} color={on ? "var(--st)" : "#8a8a9a"} style={{ marginBottom: 4 }} />
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: on ? "var(--st-dk)" : "#0d0d0d", lineHeight: 1.2 }}>
                        {g.label}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: on ? "var(--st-light)" : "#8a8a9a", lineHeight: 1.3 }}>
                        {g.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="st-divider" />

            {/* Technique + Session Length */}
            <div className="st-two-col">
              <div className="st-field">
                <label className="st-label">
                  <Brain size={14} className="st-label-icon" /> Study Technique
                </label>
                <div className="st-pills">
                  {TECHNIQUES.map(t => (
                    <button
                      key={t.id}
                      className={`st-pill ${technique === t.id ? "st-pill-on" : ""}`}
                      onClick={() => setTechnique(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="st-field">
                <label className="st-label">
                  <Timer size={14} className="st-label-icon" /> Session Length
                </label>
                <div className="st-pills">
                  {SESSION_LENGTHS.map(s => (
                    <button
                      key={s.id}
                      className={`st-pill ${sessionLength === s.id ? "st-pill-on" : ""}`}
                      onClick={() => setSessionLength(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="st-divider" />

            {/* Days per week + Peak time + Exam date + Hours */}
            <div className="st-two-col">
              <div className="st-field">
                <label className="st-label">
                  <Calendar size={14} className="st-label-icon" /> Study Days / Week
                </label>
                <div className="st-pills">
                  {DAYS_OPTIONS.map(d => (
                    <button
                      key={d.id}
                      className={`st-pill ${daysPerWeek === d.id ? "st-pill-on" : ""}`}
                      onClick={() => setDaysPerWeek(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="st-field">
                <label className="st-label">
                  Peak Study Time
                </label>
                <div className="st-pills">
                  {PEAK_TIMES.map(p => {
                    const Icon = p.icon;
                    const on = peakTime === p.id;
                    return (
                      <button
                        key={p.id}
                        className={`st-pill ${on ? "st-pill-on" : ""}`}
                        onClick={() => setPeakTime(p.id)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Icon size={12} strokeWidth={2} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="st-divider" />

            {/* Exam date + Daily hours */}
            <div className="st-two-col">
              <div className="st-field">
                <label className="st-label">
                  <Target size={14} className="st-label-icon" />
                  Exam / Deadline Date
                  <span className="st-optional">(optional)</span>
                </label>
                <input
                  className="st-input"
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                />
              </div>
              <div className="st-field">
                <label className="st-label">
                  <Clock size={14} className="st-label-icon" />
                  Daily Hours Available
                  <span className="st-optional">(optional)</span>
                </label>
                <div className="st-input-wrap">
                  <input
                    className="st-input st-input-pad-r"
                    type="number"
                    min="0.5" max="16" step="0.5"
                    placeholder="e.g. 3"
                    value={hoursAvailable}
                    onChange={e => setHoursAvailable(e.target.value)}
                  />
                  <span className="st-input-suf">hrs</span>
                </div>
              </div>
            </div>

            <div className="st-divider" />

            {/* Subjects */}
            <div className="st-field">
              <div className="st-label-row">
                <label className="st-label">
                  <BookOpen size={14} className="st-label-icon" />
                  Subjects &amp; Study Hours
                  {totalSubjectHours > 0 && (
                    <span className="st-badge" style={{ marginLeft: 8 }}>
                      <Clock size={10} />
                      {totalSubjectHours}h total
                    </span>
                  )}
                </label>
              </div>

              <div className="st-subjects-list">
                {subjects.map((s, i) => (
                  <div key={s.id} className="st-subject-row" style={{ gridTemplateColumns: "24px 1fr 120px auto" }}>
                    {/* Index */}
                    <div className="st-subject-num">{i + 1}</div>

                    {/* Subject name */}
                    <input
                      className="st-input"
                      placeholder={`Subject ${i + 1} (e.g. Mathematics)`}
                      value={s.name}
                      onChange={e => updateSubject(s.id, "name", e.target.value)}
                    />

                    {/* Hours needed */}
                    <div className="st-input-wrap">
                      <input
                        className="st-input st-input-pad-r"
                        type="number"
                        min="0.5"
                        step="0.5"
                        placeholder="Hours"
                        value={s.hours}
                        onChange={e => updateSubject(s.id, "hours", e.target.value)}
                      />
                      <span className="st-input-suf" style={{ right: 8 }}>h</span>
                    </div>

                    {/* Difficulty */}
                    <div className="st-diff-row" style={{ flexShrink: 0 }}>
                      {DIFFICULTIES.map(d => (
                        <button
                          key={d.id}
                          className={`st-diff-chip ${s.difficulty === d.id ? diffClass[d.id] : ""}`}
                          onClick={() => updateSubject(s.id, "difficulty", d.id)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>

                    {/* Remove */}
                    <button
                      className="st-remove-btn"
                      onClick={() => removeSubject(s.id)}
                      disabled={subjects.length <= 1}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <button className="st-add-subject-btn" onClick={addSubject}>
                <Plus size={14} strokeWidth={2.5} /> Add Subject
              </button>
            </div>

            <div className="st-divider" />

            {/* Notes */}
            <div className="st-field">
              <div className="st-label-row">
                <label className="st-label">
                  <AlignLeft size={14} className="st-label-icon" />
                  Extra Notes &amp; Preferences
                  <span className="st-optional">(optional)</span>
                </label>
                <span className={`st-char-count ${notes.length > charMax * 0.9 ? "st-char-warn" : ""}`}>
                  {notes.length}/{charMax}
                </span>
              </div>
              <textarea
                className="st-textarea"
                value={notes}
                onChange={e => { if (e.target.value.length <= charMax) { setNotes(e.target.value); setError(""); } }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder="e.g. I struggle with calculus, prefer visual learning, have a mock test every Friday..."
                rows={3}
              />
            </div>

            <div className="st-divider" />

            {/* Include toggles */}
            <div className="st-field">
              <label className="st-label">Include in Plan</label>
              <div className="st-toggles">
                {INCLUDES.map(({ key, icon, label }) => {
                  const on = stateMap[key];
                  return (
                    <button
                      key={key}
                      className={`st-toggle-chip ${on ? "st-chip-on" : ""}`}
                      onClick={() => setMap[key](v => !v)}
                    >
                      <span className="st-chip-icon">{icon}</span>
                      {label}
                      {on && <Check size={12} strokeWidth={2.5} className="st-chip-check" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="st-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <button className="st-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="st-spinner" /> Building Your Study Plan...</>
                : <><Sparkles size={16} strokeWidth={2} /> Calculate Study Time</>}
            </button>

            <p className="st-hint">Press Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="st-card st-skel-card st-animate">
              <div className="st-skel st-skel-short" />
              <div className="st-skel" />
              <div className="st-skel-blocks">
                {[1, 2, 3].map(i => (
                  <div key={i} className="st-skel-block">
                    <div className="st-skel" style={{ width: "35%" }} />
                    <div className="st-skel" />
                    <div className="st-skel st-skel-med" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="st-card st-animate">

              {/* Top bar */}
              <div className="st-result-top">
                <div className="st-result-meta">
                  {GoalIcon && (
                    <span className="st-badge">
                      <GoalIcon size={11} strokeWidth={2.5} />
                      {selectedGoalData?.label}
                    </span>
                  )}
                  <span className="st-badge st-badge-orange">
                    <Clock size={11} strokeWidth={2.5} />
                    {result.totalHours}
                  </span>
                  <span className="st-badge st-badge-green">
                    <BarChart2 size={11} strokeWidth={2.5} />
                    {result.totalSessions} sessions
                  </span>
                </div>

                <div className="st-tabs">
                  {["plan", "schedule", "raw"].map(tab => (
                    <button
                      key={tab}
                      className={`st-tab ${activeTab === tab ? "st-tab-on" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="st-actions">
                  <button className="st-action-btn" onClick={handleReset}>
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="st-action-btn" onClick={handleDownload}>
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`st-copy-btn ${copied === "all" ? "st-copied" : ""}`} onClick={handleCopy}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* ── Plan Tab ── */}
              {activeTab === "plan" && (
                <div className="st-preview">

                  {/* Header */}
                  <div className="st-plan-header">
                    <div className="st-plan-title">{result.title}</div>
                    {result.summary && <p className="st-plan-summary">{result.summary}</p>}
                  </div>

                  {/* Total bar */}
                  <div className="st-total-bar">
                    <span className="st-total-label">Total Study Time</span>
                    <span className="st-total-time">{result.totalHours}</span>
                    <span className="st-total-sessions">
                      <Timer size={11} strokeWidth={2.5} style={{ display: "inline", marginRight: 4 }} />
                      {result.totalSessions} sessions
                    </span>
                  </div>

                  {/* Subject breakdown */}
                  <div className="st-subject-results">
                    {result.subjects.map((s, i) => (
                      <div key={i} className="st-subj-result">
                        <div className="st-subj-result-top">
                          <div className="st-subj-avatar">{s.name?.charAt(0)?.toUpperCase() || "?"}</div>
                          <div className="st-subj-name">{s.name}</div>
                          <div className="st-subj-time">{s.totalHours}</div>
                        </div>

                        <div className="st-progress-wrap">
                          <div className="st-progress-bar" style={{ width: `${pct(s)}%` }} />
                        </div>

                        <div className="st-sessions-row">
                          <span className="st-session-tag">
                            <BarChart2 size={10} /> {s.sessionsPerWeek} sessions/week
                          </span>
                          <span className="st-session-tag">
                            <Clock size={10} /> {s.dailyMinutes} min/day
                          </span>
                          <span className={`st-session-tag ${
                            s.difficulty === "easy" ? "st-diff-easy-on"
                            : s.difficulty === "hard" ? "st-diff-hard-on"
                            : "st-diff-med-on"
                          }`}>
                            <Flame size={10} /> {s.difficulty?.toUpperCase()}
                          </span>
                        </div>

                        {s.strategy && <p className="st-subj-note">📌 {s.strategy}</p>}
                        {s.note     && <p className="st-subj-note">💡 {s.note}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Break strategy */}
                  {includeBreaks && result.breakStrategy && (
                    <div className="st-schedule-block st-tips-block" style={{ background: "#f0f9ff", borderColor: "#bae6fd" }}>
                      <div className="st-block-header">
                        <Coffee size={13} className="st-block-icon-blue" /> Break Strategy
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#0c4a6e", lineHeight: 1.6 }}>{result.breakStrategy}</p>
                    </div>
                  )}

                  {/* Tips */}
                  {includeTips && result.tips?.length > 0 && (
                    <div className="st-tips-block">
                      <div className="st-block-header">
                        <Zap size={13} className="st-block-icon-orange" /> Study Tips
                      </div>
                      <ul className="st-tips-list">
                        {result.tips.map((tip, i) => (
                          <li key={i} className="st-tip-item">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Affirmation */}
                  {result.affirmation && (
                    <div className="st-affirmation">
                      <Star size={13} className="st-aff-icon" strokeWidth={2.5} />
                      <span className="st-aff-text">"{result.affirmation}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Schedule Tab ── */}
              {activeTab === "schedule" && (
                <div className="st-preview">
                  <div className="st-plan-header">
                    <div className="st-plan-title">Weekly Study Schedule</div>
                    <p className="st-plan-summary">Your personalized day-by-day study plan.</p>
                  </div>

                  {!includeSchedule || !result.weeklySchedule?.length ? (
                    <div style={{ padding: "24px", textAlign: "center", fontSize: "0.85rem", color: "#8a8a9a" }}>
                      Enable "Daily Schedule" to see the weekly breakdown.
                    </div>
                  ) : (
                    <div className="st-schedule-block">
                      <div className="st-schedule-grid">
                        {result.weeklySchedule.map((day, i) => (
                          <div key={i} className="st-schedule-day">
                            <div className="st-day-label">{day.day}</div>
                            <ul className="st-day-items">
                              {day.items?.map((item, j) => (
                                <li key={j} className="st-day-item">{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Raw Tab ── */}
              {activeTab === "raw" && (
                <pre className="st-raw">{buildRawText()}</pre>
              )}

              {/* Footer */}
              <div className="st-result-footer">
                <span className="st-footer-count">
                  {result.subjects.length} subject{result.subjects.length !== 1 ? "s" : ""} ·{" "}
                  {result.totalHours} · {result.totalSessions} sessions
                </span>
                <button
                  className={`st-copy-full ${copied === "all" ? "st-copy-full-copied" : ""}`}
                  onClick={handleCopy}
                >
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Full Plan</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
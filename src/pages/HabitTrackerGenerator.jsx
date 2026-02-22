/* eslint-disable no-empty */
import { useState, useRef } from "react";
import { generateAI } from "../api";
import "./HabitTrackerGenerator.css";
import { Helmet } from "react-helmet";
import {
  CheckSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Printer,
  Download,
  ChevronDown,
  Check,
  Grid3x3,
  List,
  Circle,
  Palette,
  Quote,
  Star,
  Target,
  Zap,
  Heart,
  Users,
  Leaf,
  LayoutGrid,
  StickyNote,
} from "lucide-react";

/* ── Tracker Layouts ── */
const LAYOUTS = [
  {
    id: "grid",
    label: "Grid Tracker",
    desc: "31-day checkbox grid",
    icon: Grid3x3,
    preview: "grid",
  },
  {
    id: "list",
    label: "List + Circles",
    desc: "Per-habit circle rows",
    icon: List,
    preview: "list",
  },
  {
    id: "circle",
    label: "Bubble Grid",
    desc: "Compact bubble layout",
    icon: Circle,
    preview: "circle",
  },
];

/* ── Months ── */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/* ── Years ── */
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear + 1];

/* ── Themes ── */
const THEMES = [
  { id: "amber",   label: "Amber",   swatch: "#b45309", stripe: "#b45309", border: "#92400e", header: "#78350f", light: "#fef3c7", text: "#0e0e0e", sub: "#92400e", cellBorder: "#fde68a",  rowBorder: "#f5e7c8" },
  { id: "rose",    label: "Rose",    swatch: "#be185d", stripe: "#be185d", border: "#9d174d", header: "#831843", light: "#fdf2f8", text: "#0e0e0e", sub: "#9d174d", cellBorder: "#fbcfe8",  rowBorder: "#fce7f3" },
  { id: "teal",    label: "Teal",    swatch: "#0f766e", stripe: "#0f766e", border: "#0d9488", header: "#134e4a", light: "#f0fdfa", text: "#0e0e0e", sub: "#0f766e", cellBorder: "#99f6e4",  rowBorder: "#ccfbf1" },
  { id: "indigo",  label: "Indigo",  swatch: "#4338ca", stripe: "#4338ca", border: "#3730a3", header: "#312e81", light: "#eef2ff", text: "#0e0e0e", sub: "#3730a3", cellBorder: "#c7d2fe",  rowBorder: "#e0e7ff" },
  { id: "slate",   label: "Slate",   swatch: "#334155", stripe: "#334155", border: "#1e293b", header: "#0f172a", light: "#f8fafc", text: "#0e0e0e", sub: "#334155", cellBorder: "#cbd5e1",  rowBorder: "#f1f5f9" },
  { id: "forest",  label: "Forest",  swatch: "#166534", stripe: "#166534", border: "#14532d", header: "#052e16", light: "#f0fdf4", text: "#0e0e0e", sub: "#166534", cellBorder: "#bbf7d0",  rowBorder: "#dcfce7" },
];

/* ── Categories ── */
const CATEGORIES = [
  { id: "health",  label: "Health",  icon: Heart,  cls: "ht-cat-health" },
  { id: "mind",    label: "Mind",    icon: Zap,    cls: "ht-cat-mind"   },
  { id: "body",    label: "Body",    icon: Target, cls: "ht-cat-body"   },
  { id: "social",  label: "Social",  icon: Users,  cls: "ht-cat-social" },
  { id: "custom",  label: "Custom",  icon: Leaf,   cls: "ht-cat-custom" },
];

/* ── Include Options ── */
const INCLUDE_OPTS = [
  { key: "includeNotes",   icon: <StickyNote size={13} strokeWidth={2}/>, label: "Notes Section"   },
  { key: "includeQuote",   icon: <Quote      size={13} strokeWidth={2}/>, label: "Motivational Quote" },
  { key: "includeStats",   icon: <Star       size={13} strokeWidth={2}/>, label: "Stats Legend"    },
];

/* ── Suggested Habits ── */
const HABIT_SUGGESTIONS = [
  { name: "Drink 8 glasses of water", cat: "health" },
  { name: "Exercise 30 min",          cat: "body"   },
  { name: "Read 20 pages",            cat: "mind"   },
  { name: "Meditate 10 min",          cat: "mind"   },
  { name: "Sleep by 11pm",            cat: "health" },
  { name: "No social media after 9pm",cat: "mind"   },
  { name: "Eat vegetables",           cat: "health" },
  { name: "Gratitude journal",        cat: "mind"   },
  { name: "Walk 10,000 steps",        cat: "body"   },
  { name: "Call a friend/family",     cat: "social" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

function getDaysInMonth(month, year) {
  return new Date(year, MONTHS.indexOf(month) + 1, 0).getDate();
}

/* ═════════════════════════════════════
   COMPONENT
═════════════════════════════════════ */
export default function HabitTrackerGenerator() {
  /* Form state */
  const [layout,        setLayout]        = useState("grid");
  const [month,         setMonth]         = useState(MONTHS[new Date().getMonth()]);
  const [year,          setYear]          = useState(currentYear);
  const [themeId,       setThemeId]       = useState("amber");
  const [trackerName,   setTrackerName]   = useState("");
  const [habits, setHabits] = useState([
    { id: uid(), name: "Drink 8 glasses of water", cat: "health" },
    { id: uid(), name: "Exercise 30 min",          cat: "body"   },
    { id: uid(), name: "Read 20 pages",            cat: "mind"   },
  ]);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeQuote, setIncludeQuote] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);

  /* Output state */
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [result,     setResult]     = useState(null);
  const [activeTab,  setActiveTab]  = useState("preview");
  const sheetRef = useRef(null);

  const theme   = THEMES.find(t => t.id === themeId) || THEMES[0];
  const days    = getDaysInMonth(month, year);
  const daysArr = Array.from({ length: days }, (_, i) => i + 1);

  const setMap = {
    includeNotes: setIncludeNotes,
    includeQuote: setIncludeQuote,
    includeStats: setIncludeStats,
  };
  const stateMap = { includeNotes, includeQuote, includeStats };

  /* Habit helpers */
  function addHabit()        { setHabits(h => [...h, { id: uid(), name: "", cat: "health" }]); }
  function removeHabit(id)   { if (habits.length <= 1) return; setHabits(h => h.filter(x => x.id !== id)); }
  function updateHabit(id, key, val) { setHabits(h => h.map(x => x.id === id ? { ...x, [key]: val } : x)); }
  function addSuggestion(s) {
    if (habits.some(h => h.name === s.name)) return;
    setHabits(h => [...h, { id: uid(), ...s }]);
  }

  /* ── Generate (AI fetches quote + affirmation) ── */
  async function handleGenerate() {
    const validHabits = habits.filter(h => h.name.trim());
    if (!validHabits.length) { setError("Add at least one habit name."); return; }
    setError(""); setLoading(true); setResult(null);

    const prompt = `You are a habit coach. Given this habit tracker setup, return ONE raw JSON object.

Month: ${month} ${year}
Habits: ${validHabits.map(h => `${h.name} (${h.cat})`).join(", ")}
Include Quote: ${includeQuote}
Include Stats: ${includeStats}

Required JSON shape:
{
  "quote": "...",
  "quoteAuthor": "...",
  "affirmation": "...",
  "habitTips": { "HabitName": "one short tip", ... }
}

RULES:
- "quote": only if includeQuote is true — a real motivational quote about habits or consistency. Else ""
- "quoteAuthor": the real author of the quote. Else ""
- "affirmation": one short personal affirmation (e.g. "I show up for myself every single day.")
- "habitTips": one-liner tip for EACH habit. Key = exact habit name.
- Return ONLY the JSON object. No markdown, no extra text.`;

    try {
      const res = await generateAI("habit-tracker", prompt);
      if (!res.data.success) throw new Error("fail");
      let raw = res.data.data.trim()
        .replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("bad json");
      const parsed = JSON.parse(m[0]);
      setResult({ ...parsed, habits: validHabits, month, year, layout, theme });
      setActiveTab("preview");
    } catch {
      // Graceful fallback — render without AI content
      setResult({
        quote: includeQuote ? "We are what we repeatedly do. Excellence, then, is not an act, but a habit." : "",
        quoteAuthor: includeQuote ? "Aristotle" : "",
        affirmation: "I show up for myself every single day.",
        habitTips: {},
        habits: validHabits,
        month, year, layout, theme,
      });
      setActiveTab("preview");
    } finally {
      setLoading(false);
    }
  }

  /* ── Print ── */
  function handlePrint() {
    window.print();
  }

  /* ── Reset ── */
  function handleReset() {
    setLayout("grid"); setMonth(MONTHS[new Date().getMonth()]); setYear(currentYear);
    setThemeId("amber"); setTrackerName("");
    setHabits([
      { id: uid(), name: "Drink 8 glasses of water", cat: "health" },
      { id: uid(), name: "Exercise 30 min",          cat: "body"   },
      { id: uid(), name: "Read 20 pages",            cat: "mind"   },
    ]);
    setIncludeNotes(true); setIncludeQuote(true); setIncludeStats(true);
    setResult(null); setError("");
  }

  /* ── Category cls helper ── */
  const catCls = (id) => CATEGORIES.find(c => c.id === id)?.cls || "ht-cat-custom";

  /* ─────────────────────────────────────
     PRINTABLE SHEET RENDERERS
  ───────────────────────────────────── */
  function renderSheet(r) {
    if (!r) return null;
    const t     = r.theme;
    const days2 = getDaysInMonth(r.month, r.year);
    const da    = Array.from({ length: days2 }, (_, i) => i + 1);
    const name  = trackerName.trim() || `${r.month} ${r.year} Habit Tracker`;

    return (
      <div className="ht-sheet" ref={sheetRef} style={{ fontFamily: "var(--font-head)" }}>
        {/* Top stripe */}
        <div className="ht-sheet-stripe" style={{ background: t.stripe }} />

        {/* Header */}
        <div className="ht-sheet-header" style={{ borderColor: t.cellBorder }}>
          <div>
            <div className="ht-sheet-title" style={{ color: t.header }}>{name}</div>
            {r.affirmation && (
              <div className="ht-sheet-sub" style={{ color: t.sub }}>{r.affirmation}</div>
            )}
          </div>
          <div className="ht-sheet-meta">
            <span style={{ color: t.header, fontWeight: 800 }}>{r.month} {r.year}</span>
            <span>{days2} days · {r.habits.length} habits</span>
            <span>Name: ______________________</span>
          </div>
        </div>

        {/* Stats legend */}
        {includeStats && (
          <div className="ht-stats-row">
            {[["✓ = Done", t.stripe], ["✗ = Missed", "#ef4444"], ["— = N/A", "#8c8b86"]].map(([lbl, color]) => (
              <span key={lbl} className="ht-stat-chip" style={{ borderColor: color, color }}>
                {lbl}
              </span>
            ))}
          </div>
        )}

        {/* ── GRID LAYOUT ── */}
        {r.layout === "grid" && (
          <table className="ht-tracker-grid">
            <thead>
              <tr>
                <th style={{ color: t.header, borderColor: t.border }}>Habit</th>
                {da.map(d => (
                  <th key={d} className="day-col" style={{ color: t.sub, borderColor: t.border }}>
                    {d}
                  </th>
                ))}
                <th style={{ color: t.header, borderColor: t.border, textAlign: "center" }}>✓</th>
              </tr>
            </thead>
            <tbody>
              {r.habits.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? t.light : "transparent" }}>
                  <td className="habit-name" style={{ color: t.text, borderColor: t.rowBorder, height: 32 }}>
                    {h.name}
                  </td>
                  {da.map(d => (
                    <td key={d} className="day-cell" style={{ borderColor: t.rowBorder }}>
                      <span className="ht-day-box" style={{ borderColor: t.cellBorder }} />
                    </td>
                  ))}
                  <td className="day-cell" style={{ borderColor: t.rowBorder, fontWeight: 800, color: t.sub }}>
                    /31
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── LIST LAYOUT ── */}
        {r.layout === "list" && (
          <div className="ht-list-style">
            {r.habits.map((h, i) => {
              const catObj = CATEGORIES.find(c => c.id === h.cat);
              return (
                <div key={i} className="ht-list-habit" style={{ borderColor: t.rowBorder }}>
                  <div className="ht-list-habit-header">
                    <span className="ht-list-habit-name" style={{ color: t.header }}>{h.name}</span>
                    <span
                      className={`ht-list-habit-cat ${catCls(h.cat)}`}
                    >
                      {catObj?.label}
                    </span>
                    {r.habitTips?.[h.name] && (
                      <span style={{ fontSize: "0.7rem", color: "#8c8b86", fontStyle: "italic", marginLeft: 4 }}>
                        💡 {r.habitTips[h.name]}
                      </span>
                    )}
                  </div>
                  <div className="ht-list-circles">
                    {da.map(d => (
                      <div
                        key={d}
                        className="ht-list-circle"
                        style={{ borderColor: t.cellBorder }}
                        title={`Day ${d}`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── BUBBLE LAYOUT ── */}
        {r.layout === "circle" && (
          <div className="ht-circle-style">
            {r.habits.map((h, i) => (
              <div key={i} className="ht-circle-habit" style={{ borderColor: t.cellBorder, background: t.light }}>
                <div className="ht-circle-habit-name" style={{ color: t.header }}>{h.name}</div>
                <div className="ht-circle-dots">
                  {da.map(d => (
                    <div
                      key={d}
                      className="ht-circle-dot"
                      style={{ borderColor: t.cellBorder }}
                      title={`Day ${d}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {(includeNotes || includeQuote) && (
          <div className="ht-sheet-footer" style={{ borderColor: t.cellBorder }}>
            {includeNotes && (
              <div className="ht-notes-box">
                <div className="ht-notes-label" style={{ color: t.sub }}>Notes</div>
                <div className="ht-notes-lines">
                  {[1,2,3,4].map(i => <div key={i} className="ht-notes-line" />)}
                </div>
              </div>
            )}
            {includeQuote && r.quote && (
              <div className="ht-quote-box">
                <div className="ht-quote-text" style={{ color: t.sub }}>"{r.quote}"</div>
                <div className="ht-quote-attr" style={{ color: t.sub }}>— {r.quoteAuthor}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ─────────────────────────────────
     RENDER
  ───────────────────────────────── */
  return (
    <>
      <Helmet>
        <title>Free AI Habit Tracker Generator – Printable PDF Templates | ShauryaTools</title>
        <meta name="description" content="Generate a beautiful printable habit tracker PDF. Choose your layout, theme, habits and month — get a ready-to-print tracker with motivational quotes instantly." />
        <meta name="keywords" content="habit tracker generator, printable habit tracker, habit tracker pdf, monthly habit tracker, habit tracker template, free habit tracker" />
        <link rel="canonical" href="https://shauryatools.vercel.app/habit-tracker-generator" />
      </Helmet>

      <div className="ht-page">
        <div className="ht-inner">

          {/* ── Header ── */}
          <div className="ht-header">
            <div className="ht-icon-box">
              <CheckSquare size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="ht-cat-badge">AI Productivity Tools</span>
              <h1>Habit Tracker Generator</h1>
              <p>Design your habits, pick a layout and theme — generate a beautiful printable tracker in seconds.</p>
            </div>
          </div>

          {/* ══════════════════════════════
              INPUT CARD
          ══════════════════════════════ */}
          <div className="ht-card">

            {/* Month + Year + Tracker Name */}
            <div className="ht-three-col">
              <div className="ht-field">
                <label className="ht-label">
                  <Calendar size={14} className="ht-label-icon" /> Month
                </label>
                <div className="ht-select-wrap">
                  <select className="ht-select" value={month} onChange={e => setMonth(e.target.value)}>
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={13} className="ht-select-arrow" />
                </div>
              </div>
              <div className="ht-field">
                <label className="ht-label">Year</label>
                <div className="ht-select-wrap">
                  <select className="ht-select" value={year} onChange={e => setYear(Number(e.target.value))}>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                  <ChevronDown size={13} className="ht-select-arrow" />
                </div>
              </div>
              <div className="ht-field">
                <label className="ht-label">
                  Tracker Name <span className="ht-optional">(optional)</span>
                </label>
                <input
                  className="ht-input"
                  placeholder={`${month} ${year} Habits`}
                  value={trackerName}
                  onChange={e => setTrackerName(e.target.value)}
                />
              </div>
            </div>

            <div className="ht-divider" />

            {/* Layout */}
            <div className="ht-field">
              <label className="ht-label">
                <LayoutGrid size={14} className="ht-label-icon" /> Tracker Layout
              </label>
              <div className="ht-style-grid">
                {LAYOUTS.map(l => {
                  const Icon = l.icon;
                  const on   = layout === l.id;
                  return (
                    <button
                      key={l.id}
                      className={`ht-style-btn ${on ? "ht-style-on" : ""}`}
                      onClick={() => setLayout(l.id)}
                    >
                      {/* mini preview */}
                      <div className="ht-style-preview">
                        {l.preview === "grid" && (
                          <div className="ht-prev-grid">
                            {Array.from({ length: 14 }).map((_, i) => (
                              <div key={i} className={`ht-prev-cell ${i < 5 ? "filled" : ""}`} />
                            ))}
                          </div>
                        )}
                        {l.preview === "list" && (
                          <div className="ht-prev-list">
                            {[1,2,3].map(i => (
                              <div key={i} className="ht-prev-row">
                                <div className={`ht-prev-dot ${i === 1 ? "filled" : ""}`} />
                                <div className={`ht-prev-dot ${i === 1 ? "filled" : ""}`} />
                                <div className="ht-prev-dot" />
                                <div className="ht-prev-line" />
                              </div>
                            ))}
                          </div>
                        )}
                        {l.preview === "circle" && (
                          <div className="ht-prev-circles">
                            {Array.from({ length: 7 }).map((_, i) => (
                              <div key={i} className={`ht-prev-circle ${i < 3 ? "filled" : ""}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <Icon size={14} strokeWidth={2} color={on ? "var(--ht)" : "#8c8b86"} />
                      <span className="ht-style-lbl">{l.label}</span>
                      <span className="ht-style-desc">{l.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ht-divider" />

            {/* Theme */}
            <div className="ht-field">
              <label className="ht-label">
                <Palette size={14} className="ht-label-icon" /> Color Theme
              </label>
              <div className="ht-theme-row">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    className={`ht-theme-pill ${themeId === t.id ? "ht-pill-on" : ""}`}
                    onClick={() => setThemeId(t.id)}
                  >
                    <span className="ht-theme-swatch" style={{ background: t.swatch }} />
                    {t.label}
                    {themeId === t.id && <Check size={11} strokeWidth={3} style={{ color: "var(--ht)" }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="ht-divider" />

            {/* Habits */}
            <div className="ht-field">
              <div className="ht-label-row">
                <label className="ht-label">
                  <CheckSquare size={14} className="ht-label-icon" />
                  Habits
                  <span className="ht-badge" style={{ marginLeft: 8 }}>
                    {habits.filter(h => h.name.trim()).length} added
                  </span>
                </label>
              </div>

              <div className="ht-habits-list">
                {habits.map((h, i) => (
                  <div key={h.id} className="ht-habit-row">
                    <div className="ht-habit-num">{i + 1}</div>

                    <input
                      className="ht-input"
                      placeholder={`Habit ${i + 1}  (e.g. Drink water)`}
                      value={h.name}
                      onChange={e => updateHabit(h.id, "name", e.target.value)}
                    />

                    <div className="ht-cat-wrap">
                      <select
                        className={`ht-cat-select ${catCls(h.cat)}`}
                        value={h.cat}
                        onChange={e => updateHabit(h.id, "cat", e.target.value)}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="ht-cat-arrow" />
                    </div>

                    <button
                      className="ht-remove-btn"
                      onClick={() => removeHabit(h.id)}
                      disabled={habits.length <= 1}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <button className="ht-add-habit-btn" onClick={addHabit}>
                <Plus size={14} strokeWidth={2.5} /> Add Habit
              </button>

              {/* Quick suggestions */}
              <div style={{ marginTop: 4 }}>
                <p style={{ fontSize: "0.72rem", color: "var(--grey-3)", marginBottom: 6, fontWeight: 600 }}>
                  Quick add:
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {HABIT_SUGGESTIONS.map(s => (
                    <button
                      key={s.name}
                      onClick={() => addSuggestion(s)}
                      disabled={habits.some(h => h.name === s.name)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.73rem", fontWeight: 600,
                        border: "1.5px solid var(--grey-2)",
                        borderRadius: "100px",
                        background: habits.some(h => h.name === s.name) ? "var(--grey-1)" : "var(--white)",
                        color: habits.some(h => h.name === s.name) ? "var(--grey-3)" : "var(--grey-4)",
                        cursor: habits.some(h => h.name === s.name) ? "default" : "pointer",
                        opacity: habits.some(h => h.name === s.name) ? 0.5 : 1,
                        fontFamily: "var(--font-body)",
                        transition: "all 0.12s",
                      }}
                    >
                      {habits.some(h => h.name === s.name) ? "✓ " : "+ "}{s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ht-divider" />

            {/* Include options */}
            <div className="ht-field">
              <label className="ht-label">Include on Tracker</label>
              <div className="ht-toggles">
                {INCLUDE_OPTS.map(({ key, icon, label }) => {
                  const on = stateMap[key];
                  return (
                    <button
                      key={key}
                      className={`ht-toggle-chip ${on ? "ht-chip-on" : ""}`}
                      onClick={() => setMap[key](v => !v)}
                    >
                      <span className="ht-chip-icon">{icon}</span>
                      {label}
                      {on && <Check size={12} strokeWidth={2.5} className="ht-chip-check" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="ht-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <button className="ht-gen-btn" onClick={handleGenerate} disabled={loading}>
              {loading
                ? <><span className="ht-spinner" /> Generating Your Tracker...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Habit Tracker</>}
            </button>

            <p className="ht-hint">AI adds a motivational quote and habit tips to your printable sheet</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="ht-card ht-animate" style={{ gap: 14 }}>
              <div className="ht-skel ht-skel-short" />
              <div className="ht-skel" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8,
                    padding: 14, border: "1.5px solid var(--grey-2)", borderRadius: 12 }}>
                    <div className="ht-skel" style={{ width: "40%" }} />
                    <div className="ht-skel" />
                    <div className="ht-skel ht-skel-med" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════
              RESULT CARD
          ══════════════════════════════ */}
          {result && !loading && (
            <div className="ht-card ht-animate">

              {/* Top bar */}
              <div className="ht-result-top">
                <div className="ht-result-meta">
                  <span className="ht-badge">
                    <Calendar size={10} /> {result.month} {result.year}
                  </span>
                  <span className="ht-badge ht-badge-orange">
                    <CheckSquare size={10} /> {result.habits.length} habits
                  </span>
                  <span className="ht-badge ht-badge-green">
                    <Grid3x3 size={10} /> {result.layout} layout
                  </span>
                  <span
                    className="ht-badge"
                    style={{ background: result.theme.light, borderColor: result.theme.cellBorder, color: result.theme.header }}
                  >
                    <Palette size={10} /> {themeId}
                  </span>
                </div>

                <div className="ht-tabs">
                  {["preview", "info"].map(tab => (
                    <button
                      key={tab}
                      className={`ht-tab ${activeTab === tab ? "ht-tab-on" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="ht-actions">
                  <button className="ht-action-btn" onClick={handleReset}>
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="ht-print-btn" onClick={handlePrint}>
                    <Printer size={13} strokeWidth={2.5} /> Print / Save PDF
                  </button>
                </div>
              </div>

              {/* ── Preview Tab ── */}
              {activeTab === "preview" && (
                <div className="ht-preview-wrap">
                  {renderSheet(result)}
                </div>
              )}

              {/* ── Info Tab ── */}
              {activeTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {result.quote && (
                    <div style={{ padding: "16px 20px", background: result.theme.light,
                      border: `1.5px solid ${result.theme.cellBorder}`, borderRadius: 12 }}>
                      <p style={{ fontFamily: "var(--font-serif)", fontSize: "0.92rem",
                        fontStyle: "italic", color: result.theme.header, lineHeight: 1.7, marginBottom: 6 }}>
                        "{result.quote}"
                      </p>
                      <p style={{ fontSize: "0.73rem", fontWeight: 700, color: result.theme.sub,
                        textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        — {result.quoteAuthor}
                      </p>
                    </div>
                  )}

                  {result.habitTips && Object.keys(result.habitTips).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--grey-3)",
                        textTransform: "uppercase", letterSpacing: "0.08em" }}>Habit Tips</p>
                      {Object.entries(result.habitTips).map(([habit, tip]) => (
                        <div key={habit} style={{ padding: "10px 14px", background: "var(--grey-1)",
                          border: "1.5px solid var(--grey-2)", borderRadius: 10,
                          display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <Zap size={13} color="var(--ht)" style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--black)", marginBottom: 2 }}>{habit}</p>
                            <p style={{ fontSize: "0.78rem", color: "var(--grey-4)", lineHeight: 1.5 }}>{tip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.affirmation && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8,
                      padding: "14px 20px", background: "var(--ht-bg)",
                      border: "1.5px solid var(--ht-bd)", borderRadius: 12 }}>
                      <Star size={14} color="var(--ht)" style={{ flexShrink: 0 }} />
                      <span style={{ fontStyle: "italic", fontWeight: 600, color: "var(--ht-dk)", fontSize: "0.88rem" }}>
                        "{result.affirmation}"
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="ht-result-footer">
                <span className="ht-footer-count">
                  {result.habits.length} habits · {getDaysInMonth(result.month, result.year)} days · {result.month} {result.year}
                </span>
                <button className="ht-print-full-btn" onClick={handlePrint}>
                  <Printer size={14} strokeWidth={2.5} /> Print / Save as PDF
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
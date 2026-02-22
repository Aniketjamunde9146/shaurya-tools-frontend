/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./DailyPlannerGenerator.css";
import { Helmet } from "react-helmet";
import {
  CalendarDays,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Home,
  Palette,
  Heart,
  ChevronDown,
  Clock,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Zap,
  Target,
  AlignLeft,
  User,
  Battery,
} from "lucide-react";

/* ── Day Focus Types ── */
const DAY_TYPES = [
  { id: "work",       label: "Work Day",        icon: Briefcase,    desc: "Professional & meetings"  },
  { id: "study",      label: "Study Day",        icon: GraduationCap,desc: "Learning & focus"         },
  { id: "fitness",    label: "Fitness Day",      icon: Dumbbell,     desc: "Health & exercise"        },
  { id: "creative",   label: "Creative Day",     icon: Palette,      desc: "Art, writing, ideas"      },
  { id: "selfcare",   label: "Self-Care Day",    icon: Heart,        desc: "Rest & recharge"          },
  { id: "errands",    label: "Errands Day",      icon: Home,         desc: "Tasks & chores"           },
  { id: "balanced",   label: "Balanced Day",     icon: CalendarDays, desc: "Mix of everything"        },
  { id: "custom",     label: "Custom",           icon: AlignLeft,    desc: "Your own priorities"      },
];

/* ── Wake Up Times ── */
const WAKE_TIMES = [
  { id: "5am",  label: "5:00 AM" },
  { id: "6am",  label: "6:00 AM" },
  { id: "7am",  label: "7:00 AM" },
  { id: "8am",  label: "8:00 AM" },
  { id: "9am",  label: "9:00 AM" },
  { id: "10am", label: "10:00 AM" },
];

/* ── Sleep Times ── */
const SLEEP_TIMES = [
  { id: "9pm",  label: "9:00 PM"  },
  { id: "10pm", label: "10:00 PM" },
  { id: "11pm", label: "11:00 PM" },
  { id: "12am", label: "12:00 AM" },
  { id: "1am",  label: "1:00 AM"  },
];

/* ── Energy Level ── */
const ENERGY_LEVELS = [
  { id: "low",    label: "Low",    desc: "Easy & gentle"   },
  { id: "medium", label: "Medium", desc: "Steady pace"     },
  { id: "high",   label: "High",   desc: "Full throttle"   },
];

/* ── Planning Style ── */
const STYLES = [
  { id: "timeblocked", label: "Time-Blocked",  desc: "Exact hours per task"  },
  { id: "priority",    label: "Priority List", desc: "Ranked to-do list"     },
  { id: "flexible",    label: "Flexible",      desc: "Loose flow, no strict times" },
];

/* ── Tone / Vibe ── */
const VIBES = [
  { id: "motivational", label: "Motivational" },
  { id: "calm",         label: "Calm"         },
  { id: "strict",       label: "Strict"       },
  { id: "friendly",     label: "Friendly"     },
  { id: "minimalist",   label: "Minimalist"   },
  { id: "detailed",     label: "Detailed"     },
];

/* ── Language Options ── */
const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Hindi", "Arabic", "Chinese (Simplified)",
  "Japanese", "Korean",
];

/* ── Component ── */
export default function DailyPlannerGenerator() {
  const [dayType,     setDayType]     = useState("work");
  const [goals,       setGoals]       = useState("");
  const [name,        setName]        = useState("");
  const [wakeTime,    setWakeTime]    = useState("7am");
  const [sleepTime,   setSleepTime]   = useState("11pm");
  const [energyLevel, setEnergyLevel] = useState("medium");
  const [style,       setStyle]       = useState("timeblocked");
  const [vibe,        setVibe]        = useState("motivational");
  const [language,    setLanguage]    = useState("English");
  const [includeBreaks,   setIncludeBreaks]   = useState(true);
  const [includeMorning,  setIncludeMorning]  = useState(true);
  const [includeNight,    setIncludeNight]    = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState(null);
  const [copied,      setCopied]      = useState("");
  const [activeTab,   setActiveTab]   = useState("preview");

  const charMax   = 600;
  const canSubmit = goals.trim().length > 3 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectedDayType    = DAY_TYPES.find(t => t.id === dayType);
    const selectedWake       = WAKE_TIMES.find(t => t.id === wakeTime);
    const selectedSleep      = SLEEP_TIMES.find(t => t.id === sleepTime);
    const selectedEnergy     = ENERGY_LEVELS.find(e => e.id === energyLevel);
    const selectedStyle      = STYLES.find(s => s.id === style);

    const prompt = `You are an expert productivity coach and daily planner. Create a personalized, practical daily schedule.

Day Focus: ${selectedDayType?.label} — ${selectedDayType?.desc}
Goals / Tasks for today: ${goals.trim()}
${name.trim() ? `Person's Name: ${name.trim()}` : ""}
Wake Up Time: ${selectedWake?.label}
Sleep Time: ${selectedSleep?.label}
Energy Level: ${selectedEnergy?.label} — ${selectedEnergy?.desc}
Planning Style: ${selectedStyle?.label} — ${selectedStyle?.desc}
Vibe / Tone: ${vibe}
Include Morning Routine: ${includeMorning ? "Yes" : "No"}
Include Breaks: ${includeBreaks ? "Yes" : "No"}
Include Evening/Night Wind-down: ${includeNight ? "Yes" : "No"}
Language: ${language}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro text, no explanation, no markdown.
Exact required shape:
{
  "title": "...",
  "greeting": "...",
  "blocks": [
    { "period": "Morning Routine", "icon": "sunrise", "items": [ { "time": "7:00 AM", "task": "...", "duration": "30 min", "note": "..." } ] },
    { "period": "Work Session", "icon": "work", "items": [ ... ] },
    ...
  ],
  "tip": "...",
  "affirmation": "..."
}

RULES:
• "title" — short personalized title for the day plan (e.g. "Alex's Productive Work Day").
• "greeting" — one warm, vibe-matched opening sentence to start the day (in ${language}).
• "blocks" — array of 3–6 time period blocks. Each block has:
    - "period": name of the time block (e.g. "Morning Routine", "Deep Work", "Lunch Break", "Evening Wind-down")
    - "icon": one of: sunrise | work | study | fitness | food | break | creative | self | night
    - "items": 2–5 schedule items. Each item:
        - "time": the clock time (e.g. "9:00 AM") — only if style is time-blocked, else ""
        - "task": the activity (in ${language})
        - "duration": estimated time (e.g. "45 min") — if applicable, else ""
        - "note": optional short helpful tip or context for this task (in ${language}), else ""
• Only include Morning Routine block if includeMorning is Yes.
• Only include break items/blocks if includeBreaks is Yes.
• Only include Evening/Wind-down block if includeNight is Yes.
• Match the energy level: low = gentle tasks, high = intense focused sessions.
• "tip" — one productivity tip relevant to today's plan (in English, max 20 words).
• "affirmation" — one short motivational affirmation for the day (in ${language}, max 15 words).
• Write all tasks, greeting, and affirmation in ${language}.
• Do NOT include markdown, code fences, or any text outside the JSON object.`;

    try {
      const res = await generateAI("planner-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/, "")
        .trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.blocks || !Array.isArray(parsed.blocks)) throw new Error("Invalid response format");

      setResult(parsed);
      setActiveTab("preview");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function buildRawText() {
    if (!result) return "";
    let text = `${result.title}\n${"─".repeat(40)}\n${result.greeting}\n\n`;
    result.blocks.forEach(block => {
      text += `[ ${block.period} ]\n`;
      block.items.forEach(item => {
        const time = item.time ? `${item.time}  ` : "";
        const dur  = item.duration ? ` (${item.duration})` : "";
        text += `  ${time}${item.task}${dur}\n`;
        if (item.note) text += `       ↳ ${item.note}\n`;
      });
      text += "\n";
    });
    text += `Tip: ${result.tip}\n`;
    text += `Affirmation: ${result.affirmation}`;
    return text;
  }

  function handleCopy(part) {
    const text = part === "all" ? buildRawText() : buildRawText();
    navigator.clipboard.writeText(text);
    setCopied(part);
    setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    const blob = new Blob([buildRawText()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "daily-plan.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setGoals(""); setName("");
    setResult(null); setError(""); setCopied("");
    setDayType("work"); setWakeTime("7am"); setSleepTime("11pm");
    setEnergyLevel("medium"); setStyle("timeblocked"); setVibe("motivational");
    setLanguage("English");
    setIncludeBreaks(true); setIncludeMorning(true); setIncludeNight(true);
  }

  const PERIOD_ICONS = {
    sunrise:  <Sun    size={14} strokeWidth={2} />,
    work:     <Briefcase size={14} strokeWidth={2} />,
    study:    <GraduationCap size={14} strokeWidth={2} />,
    fitness:  <Dumbbell size={14} strokeWidth={2} />,
    food:     <Coffee size={14} strokeWidth={2} />,
    break:    <Coffee size={14} strokeWidth={2} />,
    creative: <Palette size={14} strokeWidth={2} />,
    self:     <Heart size={14} strokeWidth={2} />,
    night:    <Moon size={14} strokeWidth={2} />,
  };

  const selectedDayTypeData = DAY_TYPES.find(t => t.id === dayType);
  const TypeIcon = selectedDayTypeData?.icon;

  const totalTasks = result
    ? result.blocks.reduce((acc, b) => acc + b.items.length, 0)
    : 0;

  return (
    <>
      <Helmet>
        <title>Free AI Daily Planner Generator – Personalized Daily Schedule | ShauryaTools</title>
        <meta name="description" content="Generate a personalized daily planner and schedule instantly with AI. Choose your focus, energy level, wake time, and planning style. Free AI daily planner tool." />
        <meta name="keywords" content="daily planner generator, ai planner, daily schedule maker, productivity planner, ai daily schedule, time block planner, day planner tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/daily-planner-generator" />
      </Helmet>

      <div className="eg-page">
        <div className="eg-inner">

          {/* ── Header ── */}
          <div className="eg-header">
            <div className="eg-icon dp-icon">
              <CalendarDays size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="eg-cat dp-cat">AI Productivity Tools</span>
              <h1>Daily Planner Generator</h1>
              <p>Tell us your goals and preferences — get a structured, ready-to-follow daily schedule instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="eg-card">

            {/* Day Type */}
            <div className="eg-field">
              <div className="eg-label-row">
                <label className="eg-label">Day Focus</label>
                {selectedDayTypeData && (
                  <span className="eg-selected-badge dp-selected-badge">
                    {TypeIcon && <TypeIcon size={11} strokeWidth={2.5} />}
                    {selectedDayTypeData.label}
                  </span>
                )}
              </div>
              <div className="eg-types">
                {DAY_TYPES.map(t => {
                  const Icon = t.icon;
                  const isOn = dayType === t.id;
                  return (
                    <button
                      key={t.id}
                      className={`eg-type-btn ${isOn ? "dp-type-on" : ""}`}
                      onClick={() => setDayType(t.id)}
                    >
                      <Icon size={15} strokeWidth={2} className={`eg-type-icon ${isOn ? "dp-icon-on" : ""}`} />
                      <span className={`eg-type-label ${isOn ? "dp-label-on" : ""}`}>{t.label}</span>
                      <span className={`eg-type-desc  ${isOn ? "dp-desc-on"  : ""}`}>{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eg-divider" />

            {/* Goals */}
            <div className="eg-field">
              <div className="eg-label-row">
                <label className="eg-label">
                  <Target size={14} strokeWidth={2.5} className="eg-label-icon dp-label-icon" />
                  Today's Goals & Tasks
                </label>
                <span className={`eg-char-count ${goals.length > charMax * 0.9 ? "eg-char-warn" : ""}`}>
                  {goals.length}/{charMax}
                </span>
              </div>
              <textarea
                className="eg-textarea dp-textarea"
                value={goals}
                onChange={e => {
                  if (e.target.value.length <= charMax) {
                    setGoals(e.target.value);
                    setError("");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder={
                  dayType === "work"     ? "e.g. Finish Q4 report, 3 client calls, review PR, team standup at 10am..." :
                  dayType === "study"    ? "e.g. Study chapters 4–6, complete 2 practice problems sets, review notes..." :
                  dayType === "fitness"  ? "e.g. Morning run 5km, strength training (chest/back), stretching session..." :
                  dayType === "creative" ? "e.g. Write 1000 words for novel, sketch 3 logo concepts, edit podcast ep..." :
                  dayType === "selfcare" ? "e.g. Meditate, long bath, journaling, read for fun, cook a healthy meal..." :
                  dayType === "errands"  ? "e.g. Grocery shopping, post office, bank, clean apartment, fix car appointment..." :
                                          "List your goals, tasks, or anything you want to get done today..."
                }
                rows={4}
              />
            </div>

            <div className="eg-divider" />

            {/* Name + Language */}
            <div className="eg-row">
              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <User size={14} strokeWidth={2.5} className="eg-label-icon dp-label-icon" />
                  Your Name <span className="dp-optional">(optional)</span>
                </label>
                <input
                  className="eg-input dp-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex"
                />
              </div>
              <div className="eg-field eg-field-half">
                <label className="eg-label">Language</label>
                <div className="eg-select-wrap">
                  <select
                    className="eg-select dp-select"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="eg-select-arrow" />
                </div>
              </div>
            </div>

            <div className="eg-divider" />

            {/* Wake + Sleep times */}
            <div className="eg-row">
              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <Sun size={14} strokeWidth={2.5} className="eg-label-icon dp-label-icon" />
                  Wake Up Time
                </label>
                <div className="eg-select-wrap">
                  <select
                    className="eg-select dp-select"
                    value={wakeTime}
                    onChange={e => setWakeTime(e.target.value)}
                  >
                    {WAKE_TIMES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="eg-select-arrow" />
                </div>
              </div>
              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <Moon size={14} strokeWidth={2.5} className="eg-label-icon dp-label-icon" />
                  Bedtime
                </label>
                <div className="eg-select-wrap">
                  <select
                    className="eg-select dp-select"
                    value={sleepTime}
                    onChange={e => setSleepTime(e.target.value)}
                  >
                    {SLEEP_TIMES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="eg-select-arrow" />
                </div>
              </div>
            </div>

            <div className="eg-divider" />

            {/* Energy Level */}
            <div className="eg-field">
              <label className="eg-label">
                <Battery size={14} strokeWidth={2.5} className="eg-label-icon dp-label-icon" />
                Energy Level Today
              </label>
              <div className="dp-energy-row">
                {ENERGY_LEVELS.map(e => {
                  const isOn = energyLevel === e.id;
                  return (
                    <button
                      key={e.id}
                      className={`dp-energy-btn ${isOn ? "dp-energy-on" : ""}`}
                      onClick={() => setEnergyLevel(e.id)}
                    >
                      <span className="dp-energy-label">{e.label}</span>
                      <span className="dp-energy-desc">{e.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eg-divider" />

            {/* Style + Vibe */}
            <div className="eg-row">
              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <Clock size={14} strokeWidth={2.5} className="eg-label-icon dp-label-icon" />
                  Planning Style
                </label>
                <div className="eg-lengths">
                  {STYLES.map(s => {
                    const isOn = style === s.id;
                    return (
                      <button
                        key={s.id}
                        className={`eg-length-btn ${isOn ? "dp-style-on" : ""}`}
                        onClick={() => setStyle(s.id)}
                      >
                        <span className={`eg-len-label ${isOn ? "dp-style-label" : ""}`}>{s.label}</span>
                        <span className={`eg-len-desc  ${isOn ? "dp-style-desc"  : ""}`}>{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <Zap size={14} strokeWidth={2.5} className="eg-label-icon dp-label-icon" />
                  Vibe / Tone
                </label>
                <div className="eg-tones">
                  {VIBES.map(v => (
                    <button
                      key={v.id}
                      className={`eg-tone-btn ${vibe === v.id ? "eg-tone-on" : ""}`}
                      onClick={() => setVibe(v.id)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="eg-divider" />

            {/* Toggle Options */}
            <div className="eg-field">
              <label className="eg-label">Include in Plan</label>
              <div className="dp-toggles-row">
                {[
                  { state: includeMorning,  setter: setIncludeMorning,  icon: <Sun  size={13} strokeWidth={2}/>, label: "Morning Routine"  },
                  { state: includeBreaks,   setter: setIncludeBreaks,   icon: <Coffee size={13} strokeWidth={2}/>, label: "Breaks"         },
                  { state: includeNight,    setter: setIncludeNight,    icon: <Moon size={13} strokeWidth={2}/>, label: "Evening Wind-down" },
                ].map(({ state, setter, icon, label }) => (
                  <button
                    key={label}
                    className={`dp-toggle-chip ${state ? "dp-chip-on" : ""}`}
                    onClick={() => setter(v => !v)}
                  >
                    <span className="dp-chip-icon">{icon}</span>
                    {label}
                    {state && <Check size={12} strokeWidth={2.5} className="dp-chip-check" />}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="eg-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button className="eg-gen-btn dp-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="eg-spinner" /> Building Your Plan...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Daily Plan</>}
            </button>

            <p className="eg-hint">Press Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="eg-card eg-skeleton-card animate-in">
              <div className="eg-skel eg-skel-short" />
              <div className="eg-skel" />
              <div className="dp-skel-blocks">
                {[1,2,3].map(i => (
                  <div key={i} className="dp-skel-block">
                    <div className="eg-skel eg-skel-short" style={{ width: "35%" }} />
                    <div className="eg-skel" />
                    <div className="eg-skel eg-skel-med" />
                    <div className="eg-skel" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="eg-card animate-in">

              {/* Top bar */}
              <div className="eg-result-top">
                <div className="eg-result-meta">
                  {TypeIcon && (
                    <span className="eg-result-badge dp-result-badge">
                      <TypeIcon size={11} strokeWidth={2.5} />
                      {selectedDayTypeData?.label}
                    </span>
                  )}
                  <span className="eg-result-badge eg-badge-tone">{vibe}</span>
                  <span className="eg-result-badge dp-tasks-badge">
                    <Target size={11} strokeWidth={2.5} />
                    {totalTasks} tasks
                  </span>
                  {language !== "English" && (
                    <span className="eg-result-badge eg-badge-lang">
                      {language}
                    </span>
                  )}
                </div>

                <div className="eg-tabs">
                  <button className={`eg-tab ${activeTab === "preview" ? "eg-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`eg-tab ${activeTab === "raw"     ? "eg-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw Text</button>
                </div>

                <div className="eg-actions">
                  <button className="eg-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="eg-action-btn" onClick={handleDownload} title="Download plan">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`eg-copy-btn ${copied === "all" ? "eg-copied" : ""}`} onClick={() => handleCopy("all")}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* Preview */}
              {activeTab === "preview" && (
                <div className="dp-planner-preview">

                  {/* Plan header */}
                  <div className="dp-plan-header">
                    <div className="dp-plan-title">{result.title}</div>
                    {result.greeting && (
                      <p className="dp-plan-greeting">{result.greeting}</p>
                    )}
                  </div>

                  {/* Blocks */}
                  <div className="dp-blocks">
                    {result.blocks.map((block, bi) => (
                      <div key={bi} className="dp-block">
                        <div className="dp-block-header">
                          <span className="dp-block-icon">
                            {PERIOD_ICONS[block.icon] || <Clock size={14} strokeWidth={2} />}
                          </span>
                          <span className="dp-block-period">{block.period}</span>
                        </div>
                        <div className="dp-items">
                          {block.items.map((item, ii) => (
                            <div key={ii} className="dp-item">
                              {item.time && (
                                <span className="dp-item-time">{item.time}</span>
                              )}
                              <div className="dp-item-body">
                                <div className="dp-item-task-row">
                                  <span className="dp-item-task">{item.task}</span>
                                  {item.duration && (
                                    <span className="dp-item-dur">{item.duration}</span>
                                  )}
                                </div>
                                {item.note && (
                                  <p className="dp-item-note">{item.note}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tip + Affirmation */}
                  {(result.tip || result.affirmation) && (
                    <div className="dp-footer-blocks">
                      {result.tip && (
                        <div className="dp-tip-block">
                          <Zap size={13} strokeWidth={2.5} className="dp-tip-icon" />
                          <span><strong>Productivity tip:</strong> {result.tip}</span>
                        </div>
                      )}
                      {result.affirmation && (
                        <div className="dp-affirmation-block">
                          <Sparkles size={13} strokeWidth={2.5} className="dp-aff-icon" />
                          <span className="dp-aff-text">"{result.affirmation}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Raw */}
              {activeTab === "raw" && (
                <pre className="eg-raw">{buildRawText()}</pre>
              )}

              {/* Footer */}
              <div className="eg-result-footer">
                <span className="eg-footer-count">
                  {result.blocks.length} time blocks · {totalTasks} tasks
                </span>
                <button
                  className={`eg-copy-full dp-copy-full ${copied === "all" ? "eg-copied dp-copy-full-copied" : ""}`}
                  onClick={() => handleCopy("all")}
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
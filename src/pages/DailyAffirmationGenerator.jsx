/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./DailyAffirmationGenerator.css";
import { Helmet } from "react-helmet";
import {
  Sun,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Heart,
  Star,
  Moon,
  Zap,
  Shield,
  Smile,
  Leaf,
  Flame,
  AlignLeft,
  BarChart2,
  BookOpen,
  Coffee,
  Music,
  Repeat,
  Clock,
  ChevronRight,
  Quote,
} from "lucide-react";

/* ── Focus Areas ── */
const FOCUS_AREAS = [
  { id: "confidence",  label: "Confidence",      icon: Shield  },
  { id: "growth",      label: "Personal Growth",  icon: Leaf    },
  { id: "love",        label: "Love & Relationships", icon: Heart },
  { id: "success",     label: "Success & Career", icon: Star    },
  { id: "health",      label: "Health & Wellness",icon: Smile   },
  { id: "abundance",   label: "Abundance",        icon: Zap     },
  { id: "peace",       label: "Inner Peace",      icon: Moon    },
  { id: "motivation",  label: "Motivation",       icon: Flame   },
];

/* ── Tone ── */
const TONES = [
  { id: "gentle",    label: "Gentle & Soft"       },
  { id: "powerful",  label: "Powerful & Bold"      },
  { id: "spiritual", label: "Spiritual & Mindful"  },
  { id: "practical", label: "Practical & Grounded" },
  { id: "poetic",    label: "Poetic & Lyrical"     },
];

/* ── Time of Day ── */
const TIMES = [
  { id: "morning",   label: "Morning",   icon: Sun    },
  { id: "midday",    label: "Midday",    icon: Coffee },
  { id: "evening",   label: "Evening",   icon: Moon   },
  { id: "anytime",   label: "Anytime",   icon: Clock  },
];

/* ── Count ── */
const COUNTS = ["5", "7", "10", "14", "21"];

/* ── Include options ── */
const INCLUDES = [
  { key: "includeMeditation", icon: <Repeat  size={13} strokeWidth={2}/>, label: "Meditation Prompt" },
  { key: "includeJournal",    icon: <BookOpen size={13} strokeWidth={2}/>, label: "Journal Prompt"    },
  { key: "includeMantras",    icon: <Music    size={13} strokeWidth={2}/>, label: "Short Mantras"     },
];

/* ── Mood tags ── */
const MOODS = [
  "Anxious", "Tired", "Hopeful", "Excited",
  "Sad", "Grateful", "Overwhelmed", "Focused",
  "Lonely", "Inspired", "Uncertain", "Joyful",
];

export default function DailyAffirmationGenerator() {
  /* Inputs */
  const [focusArea,          setFocusArea]          = useState("confidence");
  const [tone,               setTone]               = useState("powerful");
  const [timeOfDay,          setTimeOfDay]          = useState("morning");
  const [count,              setCount]              = useState("7");
  const [currentMood,        setCurrentMood]        = useState("");
  const [selectedMoods,      setSelectedMoods]      = useState([]);
  const [name,               setName]               = useState("");
  const [extraContext,       setExtraContext]        = useState("");

  const [includeMeditation,  setIncludeMeditation]  = useState(true);
  const [includeJournal,     setIncludeJournal]     = useState(true);
  const [includeMantras,     setIncludeMantras]     = useState(true);

  /* Output */
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState(null);
  const [copied,    setCopied]    = useState("");
  const [activeTab, setActiveTab] = useState("affirmations");
  const [saved,     setSaved]     = useState([]);

  const charMax   = 300;
  const canSubmit = !loading;

  /* ── Mood toggle ── */
  function toggleMood(m) {
    setSelectedMoods(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  }

  /* ── Save toggle ── */
  function toggleSave(id) {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  /* ── Includes ── */
  const setMap   = { includeMeditation: setIncludeMeditation, includeJournal: setIncludeJournal, includeMantras: setIncludeMantras };
  const stateMap = { includeMeditation, includeJournal, includeMantras };

  /* ── Generate ── */
  async function handleGenerate() {
    if (!canSubmit) return;
    setError(""); setLoading(true); setResult(null); setSaved([]);

    const selectedFocus = FOCUS_AREAS.find(f => f.id === focusArea);
    const selectedTone  = TONES.find(t => t.id === tone);
    const selectedTime  = TIMES.find(t => t.id === timeOfDay);

    const prompt = `You are a compassionate mindfulness coach and affirmation expert. Create deeply personal, uplifting daily affirmations.

Focus Area: ${selectedFocus?.label}
Tone: ${selectedTone?.label}
Time of Day: ${selectedTime?.label}
Number of Affirmations: ${count}
${name.trim()           ? `Person's Name: ${name.trim()}`                         : ""}
${selectedMoods.length  ? `Current Mood / Feelings: ${selectedMoods.join(", ")}`  : ""}
${extraContext.trim()   ? `Extra Context: ${extraContext.trim()}`                  : ""}

Include Meditation Prompt: ${includeMeditation}
Include Journal Prompts: ${includeJournal}
Include Short Mantras: ${includeMantras}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro, no markdown, no text outside JSON.
Exact required shape:
{
  "title": "...",
  "subtitle": "...",
  "affirmations": [
    {
      "id": 1,
      "text": "...",
      "category": "...",
      "breathwork": "...",
      "mantra": "..."
    }
  ],
  "meditationPrompt": "...",
  "journalPrompts": ["...", "...", "..."],
  "dailyRitual": "...",
  "affirmation_of_the_day": "...",
  "closing": "..."
}

RULES:
- "title": warm, personal title e.g. "Your Morning Confidence Ritual" or "Sarah's 7-Day Affirmation Journey"
- "subtitle": 1 gentle sentence framing the practice
- "affirmations": array of ${count} affirmation objects, each with:
  - "id": number 1 to ${count}
  - "text": the affirmation itself — written in first person ("I am...", "I have...", "I choose..."). Make it specific, powerful, and resonant. Should feel personal, NOT generic.
  - "category": one-word theme label (e.g. "Courage", "Worthiness", "Abundance")
  - "breathwork": a very short 1-sentence breathing instruction to pair with this affirmation (e.g. "Inhale for 4 counts, exhale slowly as you repeat this.")
  - "mantra": only if includeMantras is true — a 2-6 word ultra-short version of the affirmation (e.g. "I am enough"). Else ""
- "meditationPrompt": only if includeMeditation is true — a 2-3 sentence guided visualization or meditation prompt to accompany this set. Else ""
- "journalPrompts": only if includeJournal is true — 3 reflective journaling questions related to the focus area. Else []
- "dailyRitual": a 2-3 sentence suggested morning/evening ritual for using these affirmations
- "affirmation_of_the_day": the single most powerful affirmation from the set — highlight this one
- "closing": one warm, encouraging closing sentence
- Use ${selectedTone?.label} tone throughout
- Make affirmations appropriate for ${selectedTime?.label} time
- Infuse the ${selectedFocus?.label} focus area deeply
${selectedMoods.length ? `- Acknowledge and gently transform these feelings: ${selectedMoods.join(", ")}` : ""}
${name.trim() ? `- Personalize where natural for: ${name.trim()}` : ""}
- Avoid clichés. Make each affirmation feel fresh, specific, and emotionally resonant
- Return ONLY the JSON object, nothing else`;

    try {
      const res = await generateAI("affirmation-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.affirmations || !Array.isArray(parsed.affirmations)) throw new Error("Invalid format");

      setResult(parsed);
      setActiveTab("affirmations");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Build raw text ── */
  function buildRawText() {
    if (!result) return "";
    let t = `${result.title}\n${result.subtitle}\n${"─".repeat(44)}\n\n`;
    t += `✨ AFFIRMATION OF THE DAY\n"${result.affirmation_of_the_day}"\n\n`;
    t += `AFFIRMATIONS\n${"─".repeat(20)}\n`;
    result.affirmations.forEach(a => {
      t += `\n${a.id}. ${a.text}\n`;
      t += `   [${a.category}]`;
      if (a.mantra) t += ` · Mantra: "${a.mantra}"`;
      t += `\n   Breathwork: ${a.breathwork}\n`;
    });
    if (result.meditationPrompt) t += `\nMEDITATION\n${"─".repeat(20)}\n${result.meditationPrompt}\n`;
    if (result.journalPrompts?.length) {
      t += `\nJOURNAL PROMPTS\n${"─".repeat(20)}\n`;
      result.journalPrompts.forEach(q => { t += `• ${q}\n`; });
    }
    if (result.dailyRitual) t += `\nDAILY RITUAL\n${"─".repeat(20)}\n${result.dailyRitual}\n`;
    if (result.closing) t += `\n"${result.closing}"`;
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
    a.download = "affirmations.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function handleReset() {
    setFocusArea("confidence"); setTone("powerful"); setTimeOfDay("morning");
    setCount("7"); setCurrentMood(""); setSelectedMoods([]); setName(""); setExtraContext("");
    setIncludeMeditation(true); setIncludeJournal(true); setIncludeMantras(true);
    setResult(null); setError(""); setCopied(""); setSaved([]);
  }

  const selectedFocusData = FOCUS_AREAS.find(f => f.id === focusArea);
  const FocusIcon = selectedFocusData?.icon;

  /* ── Category color map ── */
  const catColors = [
    { bg: "#eef2ff", bd: "#c7d2fe", color: "#3730a3" },
    { bg: "#f0fdf4", bd: "#bbf7d0", color: "#14532d" },
    { bg: "#fff7ed", bd: "#fed7aa", color: "#7c2d12" },
    { bg: "#fdf4ff", bd: "#e9d5ff", color: "#581c87" },
    { bg: "#eff6ff", bd: "#bfdbfe", color: "#1e3a8a" },
    { bg: "#fef2f2", bd: "#fecaca", color: "#7f1d1d" },
    { bg: "#f0fdfa", bd: "#99f6e4", color: "#134e4a" },
  ];
  function catStyle(i) { return catColors[i % catColors.length]; }

  return (
    <>
      <Helmet>
        <title>Free AI Daily Affirmation Generator – Personalized Affirmations | ShauryaTools</title>
        <meta name="description" content="Generate personalized daily affirmations with AI. Choose your focus, tone, and mood to receive uplifting affirmations with meditation and journal prompts. Free." />
        <meta name="keywords" content="daily affirmation generator, ai affirmations, positive affirmations, morning affirmations, mindfulness tool, free affirmation generator" />
        <link rel="canonical" href="https://shauryatools.vercel.app/daily-affirmation-generator" />
      </Helmet>

      <div className="da-page">
        <div className="da-inner">

          {/* ── Header ── */}
          <div className="da-header">
            <div className="da-icon-box">
              <Sun size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="da-cat">AI Wellness Tools</span>
              <h1>Daily Affirmation Generator</h1>
              <p>Choose your focus and mood — receive personalized affirmations, meditation prompts, and journal questions crafted just for you.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="da-card">

            {/* Focus Area */}
            <div className="da-field">
              <div className="da-label-row">
                <label className="da-label">
                  <Star size={14} className="da-label-icon" /> Focus Area
                </label>
                {selectedFocusData && (
                  <span className="da-badge">
                    {FocusIcon && <FocusIcon size={11} strokeWidth={2.5} />}
                    {selectedFocusData.label}
                  </span>
                )}
              </div>
              <div className="da-focus-grid">
                {FOCUS_AREAS.map(f => {
                  const Icon = f.icon;
                  const on = focusArea === f.id;
                  return (
                    <button
                      key={f.id}
                      className={`da-focus-card${on ? " da-focus-on" : ""}`}
                      onClick={() => setFocusArea(f.id)}
                    >
                      <Icon size={15} strokeWidth={2} color={on ? "var(--da)" : "#8a8a9a"} style={{ marginBottom: 4 }} />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="da-divider" />

            {/* Tone + Time */}
            <div className="da-two-col">
              <div className="da-field">
                <label className="da-label">
                  <Sparkles size={14} className="da-label-icon" /> Tone
                </label>
                <div className="da-pills">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      className={`da-pill ${tone === t.id ? "da-pill-on" : ""}`}
                      onClick={() => setTone(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="da-field">
                <label className="da-label">
                  <Clock size={14} className="da-label-icon" /> Time of Day
                </label>
                <div className="da-pills">
                  {TIMES.map(t => {
                    const Icon = t.icon;
                    const on = timeOfDay === t.id;
                    return (
                      <button
                        key={t.id}
                        className={`da-pill ${on ? "da-pill-on" : ""}`}
                        onClick={() => setTimeOfDay(t.id)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <Icon size={12} strokeWidth={2} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="da-divider" />

            {/* Name + Count */}
            <div className="da-two-col">
              <div className="da-field">
                <label className="da-label">
                  <Heart size={14} className="da-label-icon" />
                  Your Name
                  <span className="da-optional">(optional)</span>
                </label>
                <input
                  className="da-input"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="da-field">
                <label className="da-label">
                  <BarChart2 size={14} className="da-label-icon" /> How Many Affirmations?
                </label>
                <div className="da-pills">
                  {COUNTS.map(c => (
                    <button
                      key={c}
                      className={`da-pill ${count === c ? "da-pill-on" : ""}`}
                      onClick={() => setCount(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="da-divider" />

            {/* Mood */}
            <div className="da-field">
              <div className="da-label-row">
                <label className="da-label">
                  <Smile size={14} className="da-label-icon" />
                  How Are You Feeling?
                  <span className="da-optional">(pick any)</span>
                </label>
                {selectedMoods.length > 0 && (
                  <span className="da-badge">{selectedMoods.length} selected</span>
                )}
              </div>
              <div className="da-pills">
                {MOODS.map(m => (
                  <button
                    key={m}
                    className={`da-pill ${selectedMoods.includes(m) ? "da-pill-on" : ""}`}
                    onClick={() => toggleMood(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="da-divider" />

            {/* Extra context */}
            <div className="da-field">
              <div className="da-label-row">
                <label className="da-label">
                  <AlignLeft size={14} className="da-label-icon" />
                  Anything You'd Like to Share
                  <span className="da-optional">(optional)</span>
                </label>
                <span className={`da-char-count ${extraContext.length > charMax * 0.9 ? "da-char-warn" : ""}`}>
                  {extraContext.length}/{charMax}
                </span>
              </div>
              <textarea
                className="da-textarea"
                value={extraContext}
                onChange={e => { if (e.target.value.length <= charMax) { setExtraContext(e.target.value); setError(""); } }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder="e.g. I'm going through a career change and need encouragement around taking risks…"
                rows={3}
              />
            </div>

            <div className="da-divider" />

            {/* Include toggles */}
            <div className="da-field">
              <label className="da-label">Include in Results</label>
              <div className="da-toggles">
                {INCLUDES.map(({ key, icon, label }) => {
                  const on = stateMap[key];
                  return (
                    <button
                      key={key}
                      className={`da-toggle-chip ${on ? "da-chip-on" : ""}`}
                      onClick={() => setMap[key](v => !v)}
                    >
                      <span className="da-chip-icon">{icon}</span>
                      {label}
                      {on && <Check size={12} strokeWidth={2.5} className="da-chip-check" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="da-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <button className="da-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="da-spinner" /> Crafting Your Affirmations...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Affirmations</>}
            </button>

            <p className="da-hint">Press Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="da-card da-skel-card da-animate">
              <div className="da-skel da-skel-short" />
              <div className="da-skel" />
              <div className="da-skel-blocks">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="da-skel-block">
                    <div className="da-skel" style={{ width: "30%" }} />
                    <div className="da-skel" />
                    <div className="da-skel da-skel-med" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="da-card da-animate">

              {/* Top bar */}
              <div className="da-result-top">
                <div className="da-result-meta">
                  {selectedFocusData && FocusIcon && (
                    <span className="da-badge">
                      <FocusIcon size={11} strokeWidth={2.5} />
                      {selectedFocusData.label}
                    </span>
                  )}
                  <span className="da-badge da-badge-orange">
                    <Quote size={11} strokeWidth={2.5} />
                    {result.affirmations.length} affirmations
                  </span>
                  {saved.length > 0 && (
                    <span className="da-badge da-badge-green">
                      <Heart size={11} strokeWidth={2.5} />
                      {saved.length} saved
                    </span>
                  )}
                </div>

                <div className="da-tabs">
                  {["affirmations", "practice", "raw"].map(tab => (
                    <button
                      key={tab}
                      className={`da-tab ${activeTab === tab ? "da-tab-on" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="da-actions">
                  <button className="da-action-btn" onClick={handleReset}>
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="da-action-btn" onClick={handleDownload}>
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`da-copy-btn ${copied === "all" ? "da-copied" : ""}`} onClick={handleCopy}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* ── Affirmations Tab ── */}
              {activeTab === "affirmations" && (
                <div className="da-preview">

                  {/* Header */}
                  <div className="da-plan-header">
                    <div className="da-plan-title">{result.title}</div>
                    {result.subtitle && <p className="da-plan-summary">{result.subtitle}</p>}
                  </div>

                  {/* Affirmation of the day */}
                  {result.affirmation_of_the_day && (
                    <div className="da-aotd">
                      <div className="da-aotd-label">
                        <Star size={12} strokeWidth={2.5} /> Affirmation of the Day
                      </div>
                      <div className="da-aotd-text">"{result.affirmation_of_the_day}"</div>
                    </div>
                  )}

                  {/* Affirmations list */}
                  <div className="da-affirmations-list">
                    {result.affirmations.map((a, i) => {
                      const cs = catStyle(i);
                      const isSaved = saved.includes(a.id);
                      return (
                        <div key={a.id} className={`da-aff-card${isSaved ? " da-aff-saved" : ""}`}>
                          <div className="da-aff-top">
                            <div className="da-aff-num">{a.id}</div>
                            <div className="da-aff-text">"{a.text}"</div>
                            <button
                              className={`da-save-btn${isSaved ? " da-save-on" : ""}`}
                              onClick={() => toggleSave(a.id)}
                              title={isSaved ? "Unsave" : "Save"}
                            >
                              <Heart size={13} strokeWidth={isSaved ? 0 : 2} fill={isSaved ? "currentColor" : "none"} />
                            </button>
                          </div>

                          <div className="da-aff-meta">
                            <span
                              className="da-cat-tag"
                              style={{ color: cs.color, background: cs.bg, border: `1px solid ${cs.bd}` }}
                            >
                              {a.category}
                            </span>
                            {a.mantra && (
                              <span className="da-mantra-tag">
                                <Music size={9} strokeWidth={2} /> {a.mantra}
                              </span>
                            )}
                          </div>

                          {a.breathwork && (
                            <div className="da-breathwork">
                              <ChevronRight size={11} strokeWidth={2.5} style={{ color: "var(--da)", flexShrink: 0, marginTop: 1 }} />
                              <span>{a.breathwork}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Closing */}
                  {result.closing && (
                    <div className="da-affirmation">
                      <Star size={13} className="da-aff-icon" strokeWidth={2.5} />
                      <span className="da-aff-text">"{result.closing}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Practice Tab ── */}
              {activeTab === "practice" && (
                <div className="da-preview">
                  <div className="da-plan-header">
                    <div className="da-plan-title">Your Practice Guide</div>
                    <p className="da-plan-summary">Deepen your affirmation practice with these tools.</p>
                  </div>

                  {/* Daily Ritual */}
                  {result.dailyRitual && (
                    <div className="da-practice-block da-ritual-block">
                      <div className="da-block-header">
                        <Sun size={13} className="da-block-icon-orange" /> Daily Ritual
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#78350f", lineHeight: 1.65 }}>{result.dailyRitual}</p>
                    </div>
                  )}

                  {/* Meditation */}
                  {includeMeditation && result.meditationPrompt && (
                    <div className="da-practice-block da-meditation-block">
                      <div className="da-block-header">
                        <Moon size={13} className="da-block-icon-purple" /> Meditation Prompt
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#4c1d95", lineHeight: 1.65 }}>{result.meditationPrompt}</p>
                    </div>
                  )}

                  {/* Journal Prompts */}
                  {includeJournal && result.journalPrompts?.length > 0 && (
                    <div className="da-practice-block da-journal-block">
                      <div className="da-block-header">
                        <BookOpen size={13} className="da-block-icon-green" /> Journal Prompts
                      </div>
                      <ul className="da-journal-list">
                        {result.journalPrompts.map((q, i) => (
                          <li key={i} className="da-journal-item">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Saved affirmations */}
                  {saved.length > 0 && (
                    <div className="da-practice-block da-saved-block">
                      <div className="da-block-header">
                        <Heart size={13} className="da-block-icon-red" /> Your Saved Affirmations
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {result.affirmations.filter(a => saved.includes(a.id)).map(a => (
                          <div key={a.id} className="da-saved-aff">
                            <Quote size={11} style={{ color: "var(--da)", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.85rem", color: "var(--da-dk)", fontStyle: "italic" }}>{a.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Raw Tab ── */}
              {activeTab === "raw" && (
                <pre className="da-raw">{buildRawText()}</pre>
              )}

              {/* Footer */}
              <div className="da-result-footer">
                <span className="da-footer-count">
                  {result.affirmations.length} affirmations · {saved.length} saved
                </span>
                <button
                  className={`da-copy-full ${copied === "all" ? "da-copy-full-copied" : ""}`}
                  onClick={handleCopy}
                >
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy All Affirmations</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
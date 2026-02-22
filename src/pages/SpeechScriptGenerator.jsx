/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./SpeechScriptGenerator.css";
import { Helmet } from "react-helmet";
import {
  Mic,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Clock,
  Target,
  Users,
  Zap,
  Star,
  Heart,
  BookOpen,
  AlignLeft,
  BarChart2,
  ChevronRight,
  Award,
  MessageSquare,
  Volume2,
  Pause,
  List,
  Layers,
  TrendingUp,
  Coffee,
  Globe,
  Lightbulb,
} from "lucide-react";

/* ── Speech Types ── */
const SPEECH_TYPES = [
  { id: "persuasive",   label: "Persuasive",       icon: TrendingUp,   desc: "Win your audience over" },
  { id: "informative",  label: "Informative",       icon: BookOpen,     desc: "Educate & inform"       },
  { id: "motivational", label: "Motivational",      icon: Zap,          desc: "Inspire & energize"     },
  { id: "wedding",      label: "Wedding / Toast",   icon: Heart,        desc: "Celebrate & honor"      },
  { id: "debate",       label: "Debate",            icon: MessageSquare,desc: "Argue your position"    },
  { id: "presentation", label: "Presentation",      icon: Layers,       desc: "Pitch or present"       },
  { id: "eulogy",       label: "Eulogy / Tribute",  icon: Award,        desc: "Honor someone's life"   },
  { id: "interview",    label: "Interview / Q&A",   icon: Users,        desc: "Answer with confidence" },
];

/* ── Audience Types ── */
const AUDIENCES = [
  { id: "professional", label: "Professional / Corporate" },
  { id: "academic",     label: "Academic / Classroom"     },
  { id: "general",      label: "General Public"           },
  { id: "peers",        label: "Peers / Friends"          },
  { id: "executives",   label: "Executives / Leaders"     },
  { id: "youth",        label: "Youth / Students"         },
];

/* ── Speech Duration ── */
const DURATIONS = [
  { id: "1",  label: "1 min"  },
  { id: "2",  label: "2 min"  },
  { id: "3",  label: "3 min"  },
  { id: "5",  label: "5 min"  },
  { id: "7",  label: "7 min"  },
  { id: "10", label: "10 min" },
];

/* ── Tone ── */
const TONES = [
  { id: "formal",       label: "Formal"         },
  { id: "conversational", label: "Conversational" },
  { id: "inspirational",label: "Inspirational"  },
  { id: "humorous",     label: "Humorous"       },
  { id: "empathetic",   label: "Empathetic"     },
  { id: "authoritative",label: "Authoritative"  },
];

/* ── Skill Level ── */
const SKILL_LEVELS = [
  { id: "beginner",     label: "Beginner",      desc: "First-time speaker" },
  { id: "intermediate", label: "Intermediate",  desc: "Some experience"    },
  { id: "advanced",     label: "Advanced",      desc: "Confident speaker"  },
];

/* ── Include options ── */
const INCLUDES = [
  { key: "includeCues",     icon: <Pause       size={13} strokeWidth={2}/>, label: "Delivery Cues"    },
  { key: "includePractice", icon: <Volume2     size={13} strokeWidth={2}/>, label: "Practice Tips"    },
  { key: "includeOutline",  icon: <List        size={13} strokeWidth={2}/>, label: "Speech Outline"   },
];

export default function SpeechScriptGenerator() {
  /* Inputs */
  const [speechType,       setSpeechType]       = useState("persuasive");
  const [audience,         setAudience]         = useState("professional");
  const [duration,         setDuration]         = useState("3");
  const [tone,             setTone]             = useState("conversational");
  const [skillLevel,       setSkillLevel]       = useState("intermediate");
  const [topic,            setTopic]            = useState("");
  const [keyPoints,        setKeyPoints]        = useState("");
  const [speakerName,      setSpeakerName]      = useState("");
  const [context,          setContext]          = useState("");

  const [includeCues,      setIncludeCues]      = useState(true);
  const [includePractice,  setIncludePractice]  = useState(true);
  const [includeOutline,   setIncludeOutline]   = useState(true);

  /* Output */
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState(null);
  const [copied,    setCopied]    = useState("");
  const [activeTab, setActiveTab] = useState("script");

  const charMaxTopic  = 200;
  const charMaxPoints = 400;
  const charMaxCtx    = 300;
  const canSubmit     = !loading && topic.trim().length > 0;

  /* ── Includes ── */
  const setMap   = { includeCues: setIncludeCues, includePractice: setIncludePractice, includeOutline: setIncludeOutline };
  const stateMap = { includeCues, includePractice, includeOutline };

  /* ── Generate ── */
  async function handleGenerate() {
    if (!canSubmit) return;
    setError(""); setLoading(true); setResult(null);

    const selectedType     = SPEECH_TYPES.find(s => s.id === speechType);
    const selectedAudience = AUDIENCES.find(a => a.id === audience);
    const selectedTone     = TONES.find(t => t.id === tone);
    const selectedLevel    = SKILL_LEVELS.find(s => s.id === skillLevel);

    const prompt = `You are an expert speech coach and professional scriptwriter. Create a complete, practice-ready speech script.

Speech Type: ${selectedType?.label} — ${selectedType?.desc}
Topic: ${topic.trim()}
Audience: ${selectedAudience?.label}
Duration: ${duration} minutes (approximately ${Math.round(parseInt(duration) * 130)} words at average speaking pace)
Tone: ${selectedTone?.label}
Speaker Skill Level: ${selectedLevel?.label} — ${selectedLevel?.desc}
${speakerName.trim() ? `Speaker Name: ${speakerName.trim()}` : ""}
${keyPoints.trim()   ? `Key Points to Cover:\n${keyPoints.trim()}` : ""}
${context.trim()     ? `Additional Context: ${context.trim()}` : ""}

Include Delivery Cues: ${includeCues}
Include Practice Tips: ${includePractice}
Include Speech Outline: ${includeOutline}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro, no markdown, no text outside JSON.
Exact required shape:
{
  "title": "...",
  "summary": "...",
  "wordCount": 390,
  "estimatedDuration": "3 minutes",
  "readabilityLevel": "...",
  "outline": [
    { "section": "Introduction", "duration": "30 sec", "purpose": "..." }
  ],
  "script": [
    {
      "section": "Introduction",
      "text": "...",
      "cue": "...",
      "tip": "..."
    }
  ],
  "openingHook": "...",
  "closingLine": "...",
  "practiceTips": ["...", "...", "..."],
  "commonMistakes": ["...", "..."],
  "bodyLanguageTips": ["...", "..."],
  "affirmation": "..."
}

RULES:
- "title": e.g. "3-Minute Persuasive Speech: Why Remote Work Boosts Productivity"
- "summary": 1 sentence describing the speech's core argument or purpose
- "wordCount": integer — total word count of the script
- "estimatedDuration": e.g. "3 minutes 10 seconds"
- "readabilityLevel": e.g. "Easy — 8th grade reading level" or "Intermediate" based on vocabulary used
- "outline": only if includeOutline is true — array of 3-5 section objects, each with:
  - "section": section name (Introduction, Point 1, Point 2, Conclusion, etc.)
  - "duration": estimated time for that section
  - "purpose": 1 sentence purpose of that section
  Else []
- "script": array of section objects, each with:
  - "section": section name matching outline
  - "text": the actual speech text for that section. Write naturally spoken language. Use short sentences. Include rhetorical questions, pauses, repetition where appropriate. Make it feel human and authentic.
  - "cue": only if includeCues is true — a delivery instruction in brackets e.g. "[Pause 2 seconds for effect]", "[Make eye contact with audience]", "[Slow down here — emphasize each word]". Else ""
  - "tip": a brief coaching note for a ${selectedLevel?.label} speaker (e.g. "Breathe before starting this section", "Plant your feet here"). Else ""
- "openingHook": the single most powerful first sentence — a question, bold statement, or statistic that grabs attention immediately
- "closingLine": the very last line of the speech — memorable, punchy, quotable
- "practiceTips": only if includePractice is true — 4-5 specific practice exercises tailored to a ${selectedLevel?.label} speaker and this speech type. Else []
- "commonMistakes": 3 mistakes ${selectedLevel?.label} speakers commonly make with ${selectedType?.label} speeches, and how to avoid them
- "bodyLanguageTips": 3 body language tips specific to this speech type and audience
- "affirmation": one short encouraging sentence for the speaker before they go on stage
- Calibrate vocabulary, complexity, and structure to the ${selectedLevel?.label} level
- Write the script in ${selectedTone?.label} tone
- Aim for approximately ${Math.round(parseInt(duration) * 130)} words in the script sections combined
- Return ONLY the JSON object, nothing else`;

    try {
      const res = await generateAI("speech-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.script || !Array.isArray(parsed.script)) throw new Error("Invalid format");

      setResult(parsed);
      setActiveTab("script");
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
    t += `Duration: ${result.estimatedDuration} · Words: ${result.wordCount} · ${result.readabilityLevel}\n\n`;

    if (result.outline?.length) {
      t += `OUTLINE\n${"─".repeat(20)}\n`;
      result.outline.forEach(o => { t += `  ${o.section} (${o.duration}) — ${o.purpose}\n`; });
      t += "\n";
    }

    t += `FULL SCRIPT\n${"─".repeat(20)}\n`;
    result.script.forEach(s => {
      t += `\n── ${s.section} ──\n`;
      if (s.cue) t += `${s.cue}\n`;
      t += `${s.text}\n`;
      if (s.tip) t += `[Coach's Note: ${s.tip}]\n`;
    });

    if (result.practiceTips?.length) {
      t += `\nPRACTICE TIPS\n${"─".repeat(20)}\n`;
      result.practiceTips.forEach(tip => { t += `• ${tip}\n`; });
    }
    if (result.commonMistakes?.length) {
      t += `\nCOMMON MISTAKES TO AVOID\n${"─".repeat(20)}\n`;
      result.commonMistakes.forEach(m => { t += `• ${m}\n`; });
    }
    if (result.bodyLanguageTips?.length) {
      t += `\nBODY LANGUAGE\n${"─".repeat(20)}\n`;
      result.bodyLanguageTips.forEach(b => { t += `• ${b}\n`; });
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
    a.download = "speech-script.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function handleReset() {
    setSpeechType("persuasive"); setAudience("professional"); setDuration("3");
    setTone("conversational"); setSkillLevel("intermediate"); setTopic(""); setKeyPoints("");
    setSpeakerName(""); setContext(""); setIncludeCues(true); setIncludePractice(true); setIncludeOutline(true);
    setResult(null); setError(""); setCopied("");
  }

  const selectedTypeData  = SPEECH_TYPES.find(s => s.id === speechType);
  const TypeIcon          = selectedTypeData?.icon;

  /* ── Section color cycle ── */
  const sectionColors = [
    { bg: "#eef2ff", bd: "#c7d2fe", color: "#3730a3" },
    { bg: "#f0fdf4", bd: "#bbf7d0", color: "#14532d" },
    { bg: "#fff7ed", bd: "#fed7aa", color: "#7c2d12" },
    { bg: "#fdf4ff", bd: "#e9d5ff", color: "#581c87" },
    { bg: "#eff6ff", bd: "#bfdbfe", color: "#1e3a8a" },
  ];
  function sectionColor(i) { return sectionColors[i % sectionColors.length]; }

  return (
    <>
      <Helmet>
        <title>Free AI Speech Practice Script Generator – Custom Speech Scripts | ShauryaTools</title>
        <meta name="description" content="Generate a complete, practice-ready speech script with AI. Choose your speech type, topic, audience and duration. Get delivery cues, practice tips, and coaching notes. Free." />
        <meta name="keywords" content="speech script generator, ai speech writer, public speaking practice, speech coach, persuasive speech generator, free speech script tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/speech-script-generator" />
      </Helmet>

      <div className="sp-page">
        <div className="sp-inner">

          {/* ── Header ── */}
          <div className="sp-header">
            <div className="sp-icon-box">
              <Mic size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="sp-cat">AI Communication Tools</span>
              <h1>Speech Practice Script Generator</h1>
              <p>Enter your topic and goals — get a complete, stage-ready speech script with delivery cues, coaching notes, and practice exercises.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="sp-card">

            {/* Speech Type */}
            <div className="sp-field">
              <div className="sp-label-row">
                <label className="sp-label">
                  <Mic size={14} className="sp-label-icon" /> Speech Type
                </label>
                {selectedTypeData && (
                  <span className="sp-badge">
                    {TypeIcon && <TypeIcon size={11} strokeWidth={2.5} />}
                    {selectedTypeData.label}
                  </span>
                )}
              </div>
              <div className="sp-type-grid">
                {SPEECH_TYPES.map(s => {
                  const Icon = s.icon;
                  const on = speechType === s.id;
                  return (
                    <button
                      key={s.id}
                      className={`sp-type-card${on ? " sp-type-on" : ""}`}
                      onClick={() => setSpeechType(s.id)}
                    >
                      <Icon size={15} strokeWidth={2} color={on ? "var(--sp)" : "#8a8a9a"} style={{ marginBottom: 4 }} />
                      <span className="sp-type-label">{s.label}</span>
                      <span className="sp-type-desc">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sp-divider" />

            {/* Topic */}
            <div className="sp-field">
              <div className="sp-label-row">
                <label className="sp-label">
                  <Target size={14} className="sp-label-icon" /> Speech Topic
                </label>
                <span className={`sp-char-count ${topic.length > charMaxTopic * 0.9 ? "sp-char-warn" : ""}`}>
                  {topic.length}/{charMaxTopic}
                </span>
              </div>
              <input
                className="sp-input"
                placeholder="e.g. Why every company should adopt a 4-day work week"
                value={topic}
                onChange={e => { if (e.target.value.length <= charMaxTopic) { setTopic(e.target.value); setError(""); } }}
              />
            </div>

            <div className="sp-divider" />

            {/* Audience + Duration */}
            <div className="sp-two-col">
              <div className="sp-field">
                <label className="sp-label">
                  <Users size={14} className="sp-label-icon" /> Audience
                </label>
                <div className="sp-pills">
                  {AUDIENCES.map(a => (
                    <button
                      key={a.id}
                      className={`sp-pill ${audience === a.id ? "sp-pill-on" : ""}`}
                      onClick={() => setAudience(a.id)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sp-field">
                <label className="sp-label">
                  <Clock size={14} className="sp-label-icon" /> Speech Duration
                </label>
                <div className="sp-pills">
                  {DURATIONS.map(d => (
                    <button
                      key={d.id}
                      className={`sp-pill ${duration === d.id ? "sp-pill-on" : ""}`}
                      onClick={() => setDuration(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sp-divider" />

            {/* Tone + Skill Level */}
            <div className="sp-two-col">
              <div className="sp-field">
                <label className="sp-label">
                  <Volume2 size={14} className="sp-label-icon" /> Tone
                </label>
                <div className="sp-pills">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      className={`sp-pill ${tone === t.id ? "sp-pill-on" : ""}`}
                      onClick={() => setTone(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sp-field">
                <label className="sp-label">
                  <TrendingUp size={14} className="sp-label-icon" /> Speaker Level
                </label>
                <div className="sp-pills">
                  {SKILL_LEVELS.map(s => (
                    <button
                      key={s.id}
                      className={`sp-pill ${skillLevel === s.id ? "sp-pill-on" : ""}`}
                      onClick={() => setSkillLevel(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sp-divider" />

            {/* Speaker Name + Key Points */}
            <div className="sp-two-col">
              <div className="sp-field">
                <label className="sp-label">
                  <Star size={14} className="sp-label-icon" />
                  Your Name
                  <span className="sp-optional">(optional)</span>
                </label>
                <input
                  className="sp-input"
                  placeholder="e.g. Jordan"
                  value={speakerName}
                  onChange={e => setSpeakerName(e.target.value)}
                />
              </div>
              <div className="sp-field">
                <label className="sp-label">
                  <Globe size={14} className="sp-label-icon" />
                  Event / Occasion
                  <span className="sp-optional">(optional)</span>
                </label>
                <input
                  className="sp-input"
                  placeholder="e.g. TEDx Talk, Team Meeting, Wedding"
                  value={context}
                  onChange={e => { if (e.target.value.length <= charMaxCtx) setContext(e.target.value); }}
                />
              </div>
            </div>

            <div className="sp-divider" />

            {/* Key Points */}
            <div className="sp-field">
              <div className="sp-label-row">
                <label className="sp-label">
                  <List size={14} className="sp-label-icon" />
                  Key Points to Cover
                  <span className="sp-optional">(optional)</span>
                </label>
                <span className={`sp-char-count ${keyPoints.length > charMaxPoints * 0.9 ? "sp-char-warn" : ""}`}>
                  {keyPoints.length}/{charMaxPoints}
                </span>
              </div>
              <textarea
                className="sp-textarea"
                value={keyPoints}
                onChange={e => { if (e.target.value.length <= charMaxPoints) { setKeyPoints(e.target.value); setError(""); } }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder="e.g. - Productivity increases by 40% with shorter weeks&#10;- Microsoft Japan case study&#10;- How to restructure meeting culture"
                rows={4}
              />
            </div>

            <div className="sp-divider" />

            {/* Include toggles */}
            <div className="sp-field">
              <label className="sp-label">Include in Script</label>
              <div className="sp-toggles">
                {INCLUDES.map(({ key, icon, label }) => {
                  const on = stateMap[key];
                  return (
                    <button
                      key={key}
                      className={`sp-toggle-chip ${on ? "sp-chip-on" : ""}`}
                      onClick={() => setMap[key](v => !v)}
                    >
                      <span className="sp-chip-icon">{icon}</span>
                      {label}
                      {on && <Check size={12} strokeWidth={2.5} className="sp-chip-check" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="sp-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {!topic.trim() && (
              <p className="sp-required-hint">
                <AlertCircle size={12} strokeWidth={2} style={{ display:"inline", marginRight:4, color:"var(--orange)" }} />
                Please enter a speech topic to generate your script.
              </p>
            )}

            <button className="sp-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="sp-spinner" /> Writing Your Script...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Speech Script</>}
            </button>

            <p className="sp-hint">Press Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="sp-card sp-skel-card sp-animate">
              <div className="sp-skel sp-skel-short" />
              <div className="sp-skel" />
              <div className="sp-skel-blocks">
                {[1, 2, 3].map(i => (
                  <div key={i} className="sp-skel-block">
                    <div className="sp-skel" style={{ width: "35%" }} />
                    <div className="sp-skel" />
                    <div className="sp-skel sp-skel-med" />
                    <div className="sp-skel" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="sp-card sp-animate">

              {/* Top bar */}
              <div className="sp-result-top">
                <div className="sp-result-meta">
                  {selectedTypeData && TypeIcon && (
                    <span className="sp-badge">
                      <TypeIcon size={11} strokeWidth={2.5} />
                      {selectedTypeData.label}
                    </span>
                  )}
                  <span className="sp-badge sp-badge-orange">
                    <Clock size={11} strokeWidth={2.5} />
                    {result.estimatedDuration}
                  </span>
                  <span className="sp-badge sp-badge-green">
                    <BarChart2 size={11} strokeWidth={2.5} />
                    {result.wordCount} words
                  </span>
                  <span className="sp-badge sp-badge-purple">
                    <BookOpen size={11} strokeWidth={2.5} />
                    {result.readabilityLevel}
                  </span>
                </div>

                <div className="sp-tabs">
                  {["script", "coaching", "raw"].map(tab => (
                    <button
                      key={tab}
                      className={`sp-tab ${activeTab === tab ? "sp-tab-on" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="sp-actions">
                  <button className="sp-action-btn" onClick={handleReset}>
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="sp-action-btn" onClick={handleDownload}>
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`sp-copy-btn ${copied === "all" ? "sp-copied" : ""}`} onClick={handleCopy}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* ── Script Tab ── */}
              {activeTab === "script" && (
                <div className="sp-preview">

                  {/* Header */}
                  <div className="sp-plan-header">
                    <div className="sp-plan-title">{result.title}</div>
                    {result.summary && <p className="sp-plan-summary">{result.summary}</p>}
                  </div>

                  {/* Stats bar */}
                  <div className="sp-stats-bar">
                    <div className="sp-stat">
                      <Clock size={12} style={{ color: "var(--sp)" }} />
                      <span className="sp-stat-val">{result.estimatedDuration}</span>
                      <span className="sp-stat-lbl">Duration</span>
                    </div>
                    <div className="sp-stat-divider" />
                    <div className="sp-stat">
                      <BarChart2 size={12} style={{ color: "var(--orange)" }} />
                      <span className="sp-stat-val">{result.wordCount}</span>
                      <span className="sp-stat-lbl">Words</span>
                    </div>
                    <div className="sp-stat-divider" />
                    <div className="sp-stat">
                      <BookOpen size={12} style={{ color: "var(--green)" }} />
                      <span className="sp-stat-val">{result.readabilityLevel?.split("—")[0]?.trim()}</span>
                      <span className="sp-stat-lbl">Reading Level</span>
                    </div>
                  </div>

                  {/* Outline */}
                  {includeOutline && result.outline?.length > 0 && (
                    <div className="sp-outline-bar">
                      <div className="sp-outline-label">
                        <List size={12} strokeWidth={2.5} /> Structure
                      </div>
                      <div className="sp-outline-sections">
                        {result.outline.map((o, i) => {
                          const cs = sectionColor(i);
                          return (
                            <div key={i} className="sp-outline-chip" style={{ color: cs.color, background: cs.bg, border: `1px solid ${cs.bd}` }}>
                              <span className="sp-outline-name">{o.section}</span>
                              <span className="sp-outline-dur">{o.duration}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Opening hook callout */}
                  {result.openingHook && (
                    <div className="sp-hook-block">
                      <div className="sp-hook-label">
                        <Zap size={12} strokeWidth={2.5} /> Opening Hook
                      </div>
                      <div className="sp-hook-text">"{result.openingHook}"</div>
                    </div>
                  )}

                  {/* Script sections */}
                  <div className="sp-script-list">
                    {result.script.map((s, i) => {
                      const cs = sectionColor(i);
                      return (
                        <div key={i} className="sp-script-section">
                          <div className="sp-section-header">
                            <span
                              className="sp-section-badge"
                              style={{ color: cs.color, background: cs.bg, border: `1px solid ${cs.bd}` }}
                            >
                              {s.section}
                            </span>
                            {s.cue && (
                              <span className="sp-cue-tag">
                                <Pause size={10} strokeWidth={2} /> {s.cue}
                              </span>
                            )}
                          </div>

                          <div className="sp-script-text">{s.text}</div>

                          {s.tip && (
                            <div className="sp-coach-tip">
                              <Coffee size={11} strokeWidth={2} style={{ color: "var(--orange)", flexShrink: 0, marginTop: 1 }} />
                              <span>{s.tip}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Closing line */}
                  {result.closingLine && (
                    <div className="sp-closing-block">
                      <div className="sp-hook-label">
                        <Award size={12} strokeWidth={2.5} /> Closing Line
                      </div>
                      <div className="sp-hook-text">"{result.closingLine}"</div>
                    </div>
                  )}

                  {/* Affirmation */}
                  {result.affirmation && (
                    <div className="sp-affirmation">
                      <Star size={13} className="sp-aff-icon" strokeWidth={2.5} />
                      <span className="sp-aff-text">"{result.affirmation}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Coaching Tab ── */}
              {activeTab === "coaching" && (
                <div className="sp-preview">
                  <div className="sp-plan-header">
                    <div className="sp-plan-title">Your Coaching Guide</div>
                    <p className="sp-plan-summary">Practice tips, body language, and mistakes to avoid.</p>
                  </div>

                  {/* Practice Tips */}
                  {includePractice && result.practiceTips?.length > 0 && (
                    <div className="sp-coaching-block sp-practice-block">
                      <div className="sp-block-header">
                        <Volume2 size={13} className="sp-block-icon-sp" /> Practice Exercises
                      </div>
                      <ul className="sp-coaching-list">
                        {result.practiceTips.map((tip, i) => (
                          <li key={i} className="sp-coaching-item sp-practice-item">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Body Language */}
                  {result.bodyLanguageTips?.length > 0 && (
                    <div className="sp-coaching-block sp-body-block">
                      <div className="sp-block-header">
                        <Users size={13} className="sp-block-icon-green" /> Body Language
                      </div>
                      <ul className="sp-coaching-list">
                        {result.bodyLanguageTips.map((tip, i) => (
                          <li key={i} className="sp-coaching-item sp-body-item">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Common Mistakes */}
                  {result.commonMistakes?.length > 0 && (
                    <div className="sp-coaching-block sp-mistakes-block">
                      <div className="sp-block-header">
                        <AlertCircle size={13} className="sp-block-icon-red" /> Common Mistakes to Avoid
                      </div>
                      <ul className="sp-coaching-list">
                        {result.commonMistakes.map((m, i) => (
                          <li key={i} className="sp-coaching-item sp-mistake-item">{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Outline detail */}
                  {includeOutline && result.outline?.length > 0 && (
                    <div className="sp-coaching-block sp-outline-block">
                      <div className="sp-block-header">
                        <List size={13} className="sp-block-icon-purple" /> Section Breakdown
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {result.outline.map((o, i) => {
                          const cs = sectionColor(i);
                          return (
                            <div key={i} className="sp-outline-row">
                              <span className="sp-outline-chip" style={{ color: cs.color, background: cs.bg, border: `1px solid ${cs.bd}`, flexShrink: 0 }}>
                                {o.section}
                              </span>
                              <span className="sp-outline-dur-inline">{o.duration}</span>
                              <span className="sp-outline-purpose">{o.purpose}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Raw Tab ── */}
              {activeTab === "raw" && (
                <pre className="sp-raw">{buildRawText()}</pre>
              )}

              {/* Footer */}
              <div className="sp-result-footer">
                <span className="sp-footer-count">
                  {result.script.length} sections · {result.wordCount} words · {result.estimatedDuration}
                </span>
                <button
                  className={`sp-copy-full ${copied === "all" ? "sp-copy-full-copied" : ""}`}
                  onClick={handleCopy}
                >
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Full Script</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
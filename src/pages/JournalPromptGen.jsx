/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./JournalPromptGen.css";
import { Helmet } from "react-helmet";
import {
  BookMarked,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Heart,
  Sun,
  Moon,
  Wind,
  Compass,
  Smile,
  Flame,
  Leaf,
  Feather,
  Hash,
  List,
} from "lucide-react";

/* ── Journal Themes ── */
const THEMES = [
  { id: "gratitude",    label: "Gratitude",    icon: Heart,    desc: "Appreciate & reflect" },
  { id: "self-growth",  label: "Self-Growth",  icon: Compass,  desc: "Goals & progress" },
  { id: "mindfulness",  label: "Mindfulness",  icon: Leaf,     desc: "Present moment" },
  { id: "creativity",   label: "Creativity",   icon: Feather,  desc: "Imagination & ideas" },
  { id: "emotions",     label: "Emotions",     icon: Smile,    desc: "Feelings & healing" },
  { id: "motivation",   label: "Motivation",   icon: Flame,    desc: "Energy & drive" },
  { id: "morning",      label: "Morning",      icon: Sun,      desc: "Start the day" },
  { id: "evening",      label: "Evening",      icon: Moon,     desc: "Reflect & wind down" },
];

/* ── Writing Tones ── */
const TONES = [
  { id: "reflective",   label: "Reflective",   desc: "Deep, thoughtful" },
  { id: "uplifting",    label: "Uplifting",    desc: "Positive energy" },
  { id: "challenging",  label: "Challenging",  desc: "Push boundaries" },
  { id: "gentle",       label: "Gentle",       desc: "Soft & nurturing" },
];

/* ── Prompt Count ── */
const COUNTS = [
  { id: "3",  label: "3",   desc: "Quick set" },
  { id: "5",  label: "5",   desc: "Daily use" },
  { id: "7",  label: "7",   desc: "Full week" },
  { id: "10", label: "10",  desc: "Deep dive" },
  { id: "14", label: "14",  desc: "Fortnight" },
];

/* ── Prompt Formats ── */
const FORMATS = [
  { id: "open-ended",   label: "Open-Ended",    icon: Feather, desc: "Free-form questions" },
  { id: "sentence-starter", label: "Starters", icon: List,    desc: '"Today I feel..."' },
  { id: "numbered",     label: "Numbered List", icon: Hash,    desc: "1–2–3 structure" },
  { id: "mixed",        label: "Mixed",         icon: Wind,    desc: "Variety of styles" },
];

/* ── Markdown Renderer (reused pattern) ── */
function renderMarkdown(md) {
  const lines = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n");

  const output = [];
  let inCode = false, codeLines = [];
  let inList = false, listItems = [], listOrdered = false;

  const flushList = () => {
    if (!listItems.length) return;
    const tag = listOrdered ? "ol" : "ul";
    output.push(`<${tag}>${listItems.map(li => `<li>${li}</li>`).join("")}</${tag}>`);
    listItems = []; inList = false;
  };

  for (let line of lines) {
    if (/^```/.test(line)) {
      if (!inCode) { flushList(); inCode = true; codeLines = []; }
      else { output.push(`<pre class="jp-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (/^-{3,}$/.test(line.trim())) { flushList(); output.push("<hr />"); continue; }
    const hm = line.match(/^(#{1,3}) (.+)$/);
    if (hm) { flushList(); output.push(`<h${hm[1].length}>${fmt(hm[2])}</h${hm[1].length}>`); continue; }
    if (/^&gt; /.test(line)) { flushList(); output.push(`<blockquote>${fmt(line.slice(5))}</blockquote>`); continue; }
    const ulm = line.match(/^[\-\*] (.+)$/);
    if (ulm) { if (inList && listOrdered) flushList(); inList = true; listOrdered = false; listItems.push(fmt(ulm[1])); continue; }
    const olm = line.match(/^\d+\. (.+)$/);
    if (olm) { if (inList && !listOrdered) flushList(); inList = true; listOrdered = true; listItems.push(fmt(olm[1])); continue; }
    if (!line.trim()) { flushList(); output.push(""); continue; }
    flushList();
    output.push(`<p>${fmt(line)}</p>`);
  }
  flushList();
  return output.filter(Boolean).join("\n");
}

function fmt(text) {
  return text
    .replace(/`([^`]+)`/g, `<code class="jp-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function JournalPromptGenerator() {
  const [theme,       setTheme]       = useState("gratitude");
  const [tone,        setTone]        = useState("reflective");
  const [count,       setCount]       = useState("5");
  const [format,      setFormat]      = useState("open-ended");
  const [focus,       setFocus]       = useState("");
  const [withTips,    setWithTips]    = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState("");
  const [copied,      setCopied]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("preview");

  const canSubmit = !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedTheme  = THEMES.find(t => t.id === theme);
    const selectedTone   = TONES.find(t => t.id === tone);
    const selectedFormat = FORMATS.find(f => f.id === format);

    const formatInstructions = {
      "open-ended":       `Write each prompt as an open-ended question that invites expansive thinking (e.g. "What would you tell your younger self about...?").`,
      "sentence-starter": `Write each prompt as a sentence starter the writer completes (e.g. "Today I feel... because...", "One thing I'm letting go of is...").`,
      "numbered":         `Format each prompt as a numbered entry with a short bold title followed by the prompt text.`,
      "mixed":            `Mix formats: some open-ended questions, some sentence starters, and some numbered prompts with titles.`,
    };

    const focusLine = focus.trim() ? `\nPersonal Focus Area: "${focus.trim()}" — weave this theme into the prompts where natural.` : "";

    const prompt = `You are a compassionate journaling coach and creative writing guide specializing in reflective self-discovery prompts.

Generate a set of high-quality, thoughtful daily journal prompts.

Settings:
- Theme: ${selectedTheme?.label} — ${selectedTheme?.desc}
- Tone: ${selectedTone?.label} — ${selectedTone?.desc}
- Number of Prompts: ${count}
- Format: ${selectedFormat?.label} — ${formatInstructions[format]}${focusLine}
- Include journaling tips: ${withTips ? "Yes" : "No"}

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here are your..." intro.
• Start with a ## Daily Journal Prompts header that shows: theme, tone, date hint (e.g. "For any day you need it"), and prompt count.
• Number every prompt clearly: **Prompt 1**, **Prompt 2**, etc.
• Each prompt should be emotionally resonant, specific enough to spark writing, but open enough to allow personal interpretation.
• Vary the depth: mix surface-level warm-ups with deeper introspective prompts.
• Avoid clichés — make each prompt feel fresh and genuine.
• Prompts should feel human and inviting, not clinical or robotic.
${withTips ? `• End with a ## Journaling Tips section: 3 practical tips for getting the most out of these prompts (e.g. timing, environment, how to handle writer's block).` : "• Do NOT include any tips section."}
• Close with a warm one-line encouragement in italics.`;

    try {
      const res = await generateAI("journal", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```markdown\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();

      setResult(raw);
      setActiveTab("preview");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    const blob = new Blob([result], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `journal-prompts-${theme}-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setTheme("gratitude"); setTone("reflective"); setCount("5");
    setFormat("open-ended"); setFocus(""); setWithTips(true);
    setResult(""); setError(""); setCopied(false);
  }

  return (
    <>
      <Helmet>
        <title>Free AI Daily Journal Prompt Generator – Reflective Writing Prompts | ShauryaTools</title>
        <meta name="description" content="Generate personalized daily journal prompts instantly with AI. Choose your theme, tone, and format — gratitude, self-growth, mindfulness, morning & evening prompts. Free journaling tool." />
        <meta name="keywords" content="journal prompt generator, daily journal prompts, ai journaling, gratitude prompts, self-reflection prompts, mindfulness journal, morning journal prompts, evening journal prompts, writing prompts, ai journal tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/journal-prompt-generator" />
      </Helmet>

      <div className="jp-page">
        <div className="jp-inner">

          {/* ── Header ── */}
          <div className="jp-header">
            <div className="jp-icon">
              <BookMarked size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="jp-cat">AI Journaling Tools</span>
              <h1>Daily Journal Prompt Generator</h1>
              <p>Choose a theme and tone — get beautiful, thoughtful journal prompts to spark your writing every day.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="jp-card">

            {/* Theme */}
            <div className="jp-field">
              <label className="jp-label">
                <Heart size={14} strokeWidth={2.5} className="jp-label-icon" />
                Journal Theme
              </label>
              <div className="jp-formats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {THEMES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      className={`jp-format-btn ${theme === t.id ? "jp-fmt-on" : ""}`}
                      onClick={() => setTheme(t.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="jp-fmt-icon" />
                      <span className="jp-fmt-label">{t.label}</span>
                      <span className="jp-fmt-desc">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="jp-divider" />

            {/* Personal Focus */}
            <div className="jp-field">
              <label className="jp-label">
                <Compass size={14} strokeWidth={2.5} className="jp-label-icon" />
                Personal Focus <span style={{ fontWeight: 400, color: "var(--grey-3)", fontSize: "0.8rem" }}>(optional)</span>
              </label>
              <input
                type="text"
                className="jp-input"
                placeholder="e.g. career change, healing, relationships, confidence, creativity..."
                value={focus}
                onChange={e => { setFocus(e.target.value); setError(""); }}
              />
              <p className="jp-hint">Add a personal theme to make the prompts more relevant to what you're going through.</p>
            </div>

            {error && (
              <div className="jp-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="jp-divider" />

            {/* Format + Count row */}
            <div className="jp-row-2-gap">

              {/* Prompt Format */}
              <div className="jp-field">
                <label className="jp-label">
                  <Feather size={14} strokeWidth={2.5} className="jp-label-icon" />
                  Prompt Format
                </label>
                <div className="jp-formats jp-formats-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {FORMATS.map(f => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        className={`jp-format-btn ${format === f.id ? "jp-fmt-on" : ""}`}
                        onClick={() => setFormat(f.id)}
                      >
                        <Icon size={15} strokeWidth={2} className="jp-fmt-icon" />
                        <span className="jp-fmt-label">{f.label}</span>
                        <span className="jp-fmt-desc">{f.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Count */}
              <div className="jp-field">
                <label className="jp-label">
                  <Hash size={14} strokeWidth={2.5} className="jp-label-icon" />
                  Number of Prompts
                </label>
                <div className="jp-counts">
                  {COUNTS.map(c => (
                    <button
                      key={c.id}
                      className={`jp-count-btn ${count === c.id ? "jp-cnt-on" : ""}`}
                      onClick={() => setCount(c.id)}
                    >
                      <span className="jp-cnt-label">{c.label}</span>
                      <span className="jp-cnt-desc">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="jp-divider" />

            {/* Tone */}
            <div className="jp-field">
              <label className="jp-label">
                <Wind size={14} strokeWidth={2.5} className="jp-label-icon" />
                Writing Tone
              </label>
              <div className="jp-formats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {TONES.map(t => (
                  <button
                    key={t.id}
                    className={`jp-format-btn ${tone === t.id ? "jp-fmt-on" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    <span className="jp-fmt-label">{t.label}</span>
                    <span className="jp-fmt-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="jp-divider" />

            {/* Tips toggle */}
            <div className="jp-field">
              <label className="jp-label">
                <Sparkles size={14} strokeWidth={2.5} className="jp-label-icon" />
                Extra Options
              </label>
              <button
                className={`jp-toggle-check ${withTips ? "jp-check-on" : ""}`}
                onClick={() => setWithTips(v => !v)}
              >
                <span className="jp-check-box">{withTips ? "✓" : ""}</span>
                <div className="jp-check-text">
                  <span className="jp-check-label">Include Journaling Tips</span>
                  <span className="jp-check-desc">Add 3 practical tips on how to use these prompts effectively</span>
                </div>
              </button>
            </div>

            {/* Generate Button */}
            <button className="jp-submit-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading ? (
                <><span className="jp-spinner" /> Generating Prompts...</>
              ) : (
                <><Sparkles size={16} strokeWidth={2} /> Generate Journal Prompts</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="jp-card jp-skeleton-card jp-animate-in">
              <div className="jp-skel jp-skel-title" />
              <div className="jp-skel jp-skel-line" />
              <div className="jp-skel jp-skel-line jp-skel-short" />
              <div className="jp-skel jp-skel-block" />
              <div className="jp-skel jp-skel-line" />
              <div className="jp-skel jp-skel-line jp-skel-short" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="jp-card jp-animate-in">

              <div className="jp-result-top">
                <div className="jp-result-meta">
                  <span className="jp-result-badge">
                    <BookMarked size={12} strokeWidth={2.5} />
                    {count} Prompts
                  </span>
                  <span className="jp-result-badge jp-badge-type">
                    {THEMES.find(t => t.id === theme)?.label}
                  </span>
                  <span className="jp-result-badge jp-badge-tone">
                    {TONES.find(t => t.id === tone)?.label}
                  </span>
                </div>

                <div className="jp-tabs">
                  <button className={`jp-tab ${activeTab === "preview" ? "jp-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`jp-tab ${activeTab === "raw"     ? "jp-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="jp-actions">
                  <button className="jp-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="jp-action-btn" onClick={handleDownload} title="Download prompts">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`jp-copy-btn ${copied ? "jp-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="jp-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="jp-raw">{result}</pre>
              )}

              <div className="jp-result-footer">
                <span className="jp-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`jp-copy-full ${copied ? "jp-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy All Prompts</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
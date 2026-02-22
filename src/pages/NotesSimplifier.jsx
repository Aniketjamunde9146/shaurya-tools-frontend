/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./NotesSimplifier.css";
import { Helmet } from "react-helmet";
import {
  NotebookPen,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  ChevronRight,
  FileText,
  Layers,
  List,
  Brain,
  Zap,
  BookOpen,
  AlignLeft,
  Hash,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

/* ── Output Formats ── */
const OUTPUT_FORMATS = [
  { id: "bullets",   label: "Bullet Points",    icon: List,       desc: "Clean concise bullets" },
  { id: "summary",   label: "Summary",          icon: AlignLeft,  desc: "Short paragraph form" },
  { id: "flashcard", label: "Flashcards",       icon: Layers,     desc: "Q&A study cards" },
  { id: "outline",   label: "Outline",          icon: Hash,       desc: "Structured outline" },
  { id: "eli5",      label: "Explain Simply",   icon: Brain,      desc: "ELI5 style" },
  { id: "tldr",      label: "TL;DR",            icon: Zap,        desc: "Ultra-short recap" },
  { id: "cornell",   label: "Cornell Notes",    icon: BookOpen,   desc: "Cornell note format" },
  { id: "qa",        label: "Q&A Format",       icon: MessageSquare, desc: "Questions & answers" },
];

/* ── Simplify Level ── */
const LEVELS = [
  { id: "basic",    label: "Basic",    desc: "Simple language" },
  { id: "standard", label: "Standard", desc: "Balanced detail" },
  { id: "detailed", label: "Detailed", desc: "In-depth notes" },
];

/* ── Markdown Renderer ── */
function renderMarkdown(md) {
  const lines = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n");

  const output = [];
  let inCode = false, codeLang = "", codeLines = [];
  let inList = false, listItems = [], listOrdered = false;

  const flushList = () => {
    if (!listItems.length) return;
    const tag = listOrdered ? "ol" : "ul";
    output.push(`<${tag}>${listItems.map(li => `<li>${li}</li>`).join("")}</${tag}>`);
    listItems = []; inList = false;
  };

  for (let line of lines) {
    if (/^```/.test(line)) {
      if (!inCode) { flushList(); inCode = true; codeLang = line.slice(3).trim(); codeLines = []; }
      else { output.push(`<pre class="ns-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
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
    .replace(/`([^`]+)`/g, `<code class="ns-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function NotesSimplifier() {
  const [notes,      setNotes]      = useState("");
  const [format,     setFormat]     = useState("bullets");
  const [level,      setLevel]      = useState("standard");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [result,     setResult]     = useState("");
  const [copied,     setCopied]     = useState(false);
  const [activeTab,  setActiveTab]  = useState("preview");
  const [wordCount,  setWordCount]  = useState(0);

  const charMax    = 5000;
  const canSubmit  = notes.trim().length > 20 && !loading;

  const handleNotesChange = (e) => {
    const val = e.target.value;
    if (val.length <= charMax) {
      setNotes(val);
      setError("");
      setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0);
    }
  };

  async function handleSimplify() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedFormat = OUTPUT_FORMATS.find(f => f.id === format);
    const selectedLevel  = LEVELS.find(l => l.id === level);

    const formatInstructions = {
      bullets:   "Convert into clean, concise bullet points grouped by topic. Use sub-bullets for details.",
      summary:   "Write a clear, flowing paragraph summary capturing all key ideas.",
      flashcard: "Create 5–10 Flashcard-style Q&A pairs. Format: **Q:** ... then **A:** ...",
      outline:   "Create a numbered hierarchical outline with main topics and sub-points.",
      eli5:      "Explain all concepts as if talking to a curious 10-year-old. Use simple words and fun analogies.",
      tldr:      "Write a TL;DR in 3–5 punchy sentences covering only the most critical points.",
      cornell:   "Format as Cornell Notes: a 'Main Notes' section (right column content), 'Cue Questions' section (left column), and a 'Summary' at the bottom.",
      qa:        "Generate 6–10 insightful questions about the content, each followed by a thorough answer.",
    };

    const prompt = `You are an expert study assistant and note-taking specialist.

A student has provided raw notes and wants them simplified and reformatted.

Detail Level: ${selectedLevel?.label} — ${selectedLevel?.desc}
Output Format: ${selectedFormat?.label} — ${formatInstructions[format]}

Raw Notes:
"""
${notes.trim()}
"""

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here is your..." intro.
• Keep all key information — do not omit important facts.
• Use proper Markdown: headings, bold, bullets, code blocks where appropriate.
• Adjust complexity to the selected detail level (${level}).
• End with a brief ## Key Takeaways section with 3–5 bullet points.`;

    try {
      const res = await generateAI("notes", prompt);
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
    a.download = "simplified-notes.md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setNotes(""); setResult(""); setError(""); setCopied(false);
    setWordCount(0); setFormat("bullets"); setLevel("standard");
  }

  return (
    <>
      <Helmet>
        <title>Free AI Notes Simplifier – Summarize & Simplify Notes Instantly | ShauryaTools</title>
        <meta name="description" content="Paste messy notes and get clean bullet points, summaries, flashcards, Cornell notes, or a TL;DR instantly with AI. Free study tool." />
        <meta name="keywords" content="notes simplifier, ai notes, study notes, summarize notes, flashcard generator, cornell notes, note taking tool, ai study assistant" />
        <link rel="canonical" href="https://shauryatools.vercel.app/notes-simplifier" />
      </Helmet>

      <div className="ns-page">
        <div className="ns-inner">

          {/* ── Header ── */}
          <div className="ns-header">
            <div className="ns-icon">
              <NotebookPen size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="ns-cat">AI Study Tools</span>
              <h1>Notes Simplifier</h1>
              <p>Paste messy notes — get clean summaries, bullets, flashcards & more.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="ns-card">

            {/* Notes Textarea */}
            <div className="ns-field">
              <div className="ns-label-row">
                <label className="ns-label">
                  <FileText size={14} strokeWidth={2.5} className="ns-label-icon" />
                  Paste Your Notes
                </label>
                <div className="ns-meta-row">
                  {wordCount > 0 && (
                    <span className="ns-word-pill">{wordCount} words</span>
                  )}
                  <span className={`ns-char-count ${notes.length > charMax * 0.9 ? "ns-char-warn" : ""}`}>
                    {notes.length}/{charMax}
                  </span>
                </div>
              </div>
              <textarea
                className="ns-textarea"
                value={notes}
                onChange={handleNotesChange}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleSimplify(); }}
                placeholder="Paste your raw lecture notes, textbook excerpts, research notes, or any text you want simplified here...

Example: 'Photosynthesis occurs in chloroplasts. Light energy is absorbed by chlorophyll. CO2 + H2O → glucose + oxygen. Two stages: light-dependent reactions and Calvin cycle...'"
                rows={8}
              />
              <p className="ns-hint">Ctrl+Enter to simplify · {charMax - notes.length} characters remaining</p>
              {error && (
                <div className="ns-error-msg">
                  <AlertCircle size={14} strokeWidth={2.5} />
                  {error}
                </div>
              )}
            </div>

            <div className="ns-divider" />

            {/* Output Format */}
            <div className="ns-field">
              <label className="ns-label">
                <Layers size={14} strokeWidth={2.5} className="ns-label-icon" />
                Output Format
              </label>
              <div className="ns-formats">
                {OUTPUT_FORMATS.map(f => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      className={`ns-format-btn ${format === f.id ? "ns-fmt-on" : ""}`}
                      onClick={() => setFormat(f.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="ns-fmt-icon" />
                      <span className="ns-fmt-label">{f.label}</span>
                      <span className="ns-fmt-desc">{f.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ns-divider" />

            {/* Detail Level */}
            <div className="ns-field">
              <label className="ns-label">
                <ChevronRight size={14} strokeWidth={2.5} className="ns-label-icon" />
                Detail Level
              </label>
              <div className="ns-levels">
                {LEVELS.map(l => (
                  <button
                    key={l.id}
                    className={`ns-level-btn ${level === l.id ? "ns-lvl-on" : ""}`}
                    onClick={() => setLevel(l.id)}
                  >
                    <span className="ns-lvl-label">{l.label}</span>
                    <span className="ns-lvl-desc">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simplify Button */}
            <button className="ns-simplify-btn" onClick={handleSimplify} disabled={!canSubmit}>
              {loading ? (
                <><span className="ns-spinner" /> Simplifying...</>
              ) : (
                <><Sparkles size={16} strokeWidth={2} /> Simplify Notes</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="ns-card ns-skeleton-card animate-in">
              <div className="ns-skel ns-skel-title" />
              <div className="ns-skel ns-skel-line" />
              <div className="ns-skel ns-skel-line ns-skel-short" />
              <div className="ns-skel ns-skel-line" />
              <div className="ns-skel ns-skel-block" />
              <div className="ns-skel ns-skel-line ns-skel-short" />
              <div className="ns-skel ns-skel-line" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="ns-card animate-in">

              {/* Top bar */}
              <div className="ns-result-top">
                <div className="ns-result-meta">
                  {(() => {
                    const f = OUTPUT_FORMATS.find(x => x.id === format);
                    const Icon = f?.icon;
                    return (
                      <span className="ns-result-badge">
                        {Icon && <Icon size={12} strokeWidth={2.5} />}
                        {f?.label}
                      </span>
                    );
                  })()}
                  <span className="ns-result-badge ns-badge-level">
                    {LEVELS.find(l => l.id === level)?.label}
                  </span>
                </div>

                <div className="ns-tabs">
                  <button className={`ns-tab ${activeTab === "preview" ? "ns-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`ns-tab ${activeTab === "raw"     ? "ns-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="ns-actions">
                  <button className="ns-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="ns-action-btn" onClick={handleDownload} title="Download notes">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`ns-copy-btn ${copied ? "ns-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="ns-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="ns-raw">{result}</pre>
              )}

              {/* Footer */}
              <div className="ns-result-footer">
                <span className="ns-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`ns-copy-full ${copied ? "ns-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Simplified Notes</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./MCQGenerator.css";
import { Helmet } from "react-helmet";
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  FileText,
  Layers,
  AlertCircle,
  Target,
  Clock,
  Brain,
  Zap,
  GraduationCap,
  List,
  Star,
  ChevronRight,
} from "lucide-react";

/* ── Difficulty Levels ── */
const DIFFICULTIES = [
  { id: "easy",   label: "Easy",    desc: "Recall & basic concepts" },
  { id: "medium", label: "Medium",  desc: "Understanding & apply" },
  { id: "hard",   label: "Hard",    desc: "Analyze & evaluate" },
  { id: "mixed",  label: "Mixed",   desc: "All difficulty levels" },
];

/* ── Question Count ── */
const COUNTS = [
  { id: "5",  label: "5 Qs",   desc: "Quick quiz" },
  { id: "10", label: "10 Qs",  desc: "Standard" },
  { id: "15", label: "15 Qs",  desc: "Practice set" },
  { id: "20", label: "20 Qs",  desc: "Full test" },
  { id: "25", label: "25 Qs",  desc: "Exam prep" },
];

/* ── Question Types ── */
const QTYPES = [
  { id: "mcq",      label: "MCQ",           icon: List,    desc: "4 options, 1 answer" },
  { id: "truefalse",label: "True / False",  icon: Zap,     desc: "Binary questions" },
  { id: "fillblank",label: "Fill in Blank", icon: FileText, desc: "Complete the sentence" },
  { id: "mixed",    label: "Mixed Types",   icon: Layers,  desc: "Variety of formats" },
];

/* ── Output Options ── */
const OUTPUT_STYLES = [
  { id: "quiz",       label: "Quiz Mode",       icon: Brain,        desc: "Questions then answers" },
  { id: "with_ans",   label: "With Answers",    icon: Star,         desc: "Answer after each Q" },
  { id: "flashcard",  label: "Flashcard Style", icon: GraduationCap,desc: "Q on front, A on back" },
  { id: "exam",       label: "Exam Format",     icon: Clock,        desc: "Numbered, no hints" },
];

/* ── Markdown Renderer ── */
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
      else { output.push(`<pre class="mcq-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
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
    .replace(/`([^`]+)`/g, `<code class="mcq-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function MCQGenerator() {
  const [notes,       setNotes]       = useState("");
  const [topic,       setTopic]       = useState("");
  const [difficulty,  setDifficulty]  = useState("mixed");
  const [count,       setCount]       = useState("10");
  const [qtype,       setQtype]       = useState("mcq");
  const [outputStyle, setOutputStyle] = useState("quiz");
  const [withExplain, setWithExplain] = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState("");
  const [copied,      setCopied]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("preview");
  const [wordCount,   setWordCount]   = useState(0);

  const charMax   = 6000;
  const canSubmit = (notes.trim().length > 20 || topic.trim().length > 2) && !loading;

  const handleNotesChange = (e) => {
    const val = e.target.value;
    if (val.length <= charMax) {
      setNotes(val);
      setError("");
      setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0);
    }
  };

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedDiff   = DIFFICULTIES.find(d => d.id === difficulty);
    const selectedQtype  = QTYPES.find(q => q.id === qtype);
    const selectedStyle  = OUTPUT_STYLES.find(s => s.id === outputStyle);

    const sourceContent = notes.trim()
      ? `Study Notes / Content:\n"""\n${notes.trim()}\n"""`
      : `Topic / Subject: ${topic.trim()}`;

    const qtypeInstructions = {
      mcq:       `Generate standard MCQ questions with 4 options labeled A), B), C), D). Only one option is correct.`,
      truefalse: `Generate True/False questions. Each question should have a clear factual answer.`,
      fillblank: `Generate fill-in-the-blank questions. Use _______ for the blank. Keep blanks to key terms/concepts.`,
      mixed:     `Mix question types: roughly 50% MCQ (4 options), 25% True/False, and 25% fill-in-the-blank.`,
    };

    const styleInstructions = {
      quiz:      `Present all ${count} questions first (numbered), then a separate ## Answer Key section at the end with all correct answers.`,
      with_ans:  `After each question, immediately show the correct answer labeled **✓ Answer:** and a brief explanation.`,
      flashcard: `Format each as a flashcard: **Q:** [question] followed by **A:** [answer + brief explanation].`,
      exam:      `Format as a clean exam paper — numbered questions only, no hints, no answers inline. Put answer key at the very end.`,
    };

    const prompt = `You are an expert educator and exam paper setter with deep knowledge across academic subjects.

Generate a high-quality question set from the provided study material.

${sourceContent}

Settings:
- Number of Questions: ${count}
- Question Type: ${selectedQtype?.label} — ${qtypeInstructions[qtype]}
- Difficulty: ${selectedDiff?.label} — ${selectedDiff?.desc}
- Output Style: ${selectedStyle?.label} — ${styleInstructions[outputStyle]}
- Include explanations for answers: ${withExplain ? "Yes — add 1–2 sentence explanation for why the answer is correct" : "No — answers only"}

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here is your..." intro.
• Start with a ## Question Set header showing: topic/subject, difficulty, question count, and type.
• Number every question clearly: **Q1.**, **Q2.**, etc.
• For MCQ: label options as **A)**, **B)**, **C)**, **D)** on separate lines.
• For the answer key / answers: label correct answers as ✓ and mark wrong MCQ options clearly.
• Questions must be directly based on the provided notes/topic — no invented facts.
• Vary question depth: recall, comprehension, and application questions.
• End with a ## Study Tips section: 3 bullet points on how to use these questions effectively.`;

    try {
      const res = await generateAI("mcq", prompt);
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
    a.download = `mcq-${(topic || "study-notes").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setNotes(""); setTopic(""); setDifficulty("mixed"); setCount("10");
    setQtype("mcq"); setOutputStyle("quiz"); setWithExplain(true);
    setResult(""); setError(""); setCopied(false); setWordCount(0);
  }

  return (
    <>
      <Helmet>
        <title>Free AI MCQ Generator – Study Notes Question Maker | ShauryaTools</title>
        <meta name="description" content="Paste your study notes or enter a topic and instantly generate MCQs, True/False, and fill-in-the-blank questions with answer keys. Free AI exam prep tool." />
        <meta name="keywords" content="mcq generator, ai question maker, study notes to quiz, multiple choice question generator, exam question generator, ai quiz maker, true false generator, fill in the blank, exam prep tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/mcq-generator" />
      </Helmet>

      <div className="mcq-page">
        <div className="mcq-inner">

          {/* ── Header ── */}
          <div className="mcq-header">
            <div className="mcq-icon">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="mcq-cat">AI Study Tools</span>
              <h1>Study Notes Question Maker</h1>
              <p>Paste your notes or enter a topic — get MCQs, True/False & fill-in-the-blank questions instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="mcq-card">

            {/* Notes / Topic */}
            <div className="mcq-field">
              <label className="mcq-label">
                <FileText size={14} strokeWidth={2.5} className="mcq-label-icon" />
                Study Content
              </label>

              {/* Topic input */}
              <div className="mcq-input-group">
                <span className="mcq-input-label">Topic / Subject <span className="mcq-optional">(if you don't have notes)</span></span>
                <input
                  type="text"
                  className="mcq-input"
                  placeholder="e.g. Photosynthesis, World War II, Quadratic Equations, Python Loops"
                  value={topic}
                  onChange={e => { setTopic(e.target.value); setError(""); }}
                />
              </div>

              <div className="mcq-or-divider">
                <span>OR paste your notes below</span>
              </div>

              {/* Notes textarea */}
              <div>
                <div className="mcq-label-row">
                  <span className="mcq-input-label">Study Notes / Text</span>
                  <div className="mcq-meta-row">
                    {wordCount > 0 && <span className="mcq-word-pill">{wordCount} words</span>}
                    <span className={`mcq-char-count ${notes.length > charMax * 0.9 ? "mcq-char-warn" : ""}`}>
                      {notes.length}/{charMax}
                    </span>
                  </div>
                </div>
                <textarea
                  className="mcq-textarea"
                  value={notes}
                  onChange={handleNotesChange}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                  placeholder="Paste your lecture notes, textbook excerpts, or any study content here...

Example: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar. It occurs in two stages: the light-dependent reactions and the Calvin cycle...'"
                  rows={7}
                />
                <p className="mcq-hint">Ctrl+Enter to generate · {charMax - notes.length} characters remaining</p>
              </div>
            </div>

            {error && (
              <div className="mcq-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="mcq-divider" />

            {/* Question Type */}
            <div className="mcq-field">
              <label className="mcq-label">
                <Layers size={14} strokeWidth={2.5} className="mcq-label-icon" />
                Question Type
              </label>
              <div className="mcq-formats mcq-formats-4">
                {QTYPES.map(q => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={q.id}
                      className={`mcq-format-btn ${qtype === q.id ? "mcq-fmt-on" : ""}`}
                      onClick={() => setQtype(q.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="mcq-fmt-icon" />
                      <span className="mcq-fmt-label">{q.label}</span>
                      <span className="mcq-fmt-desc">{q.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mcq-divider" />

            {/* Count & Difficulty row */}
            <div className="mcq-row-2-gap">

              {/* Question Count */}
              <div className="mcq-field">
                <label className="mcq-label">
                  <Target size={14} strokeWidth={2.5} className="mcq-label-icon" />
                  Number of Questions
                </label>
                <div className="mcq-counts">
                  {COUNTS.map(c => (
                    <button
                      key={c.id}
                      className={`mcq-count-btn ${count === c.id ? "mcq-cnt-on" : ""}`}
                      onClick={() => setCount(c.id)}
                    >
                      <span className="mcq-cnt-label">{c.label}</span>
                      <span className="mcq-cnt-desc">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mcq-field">
                <label className="mcq-label">
                  <Brain size={14} strokeWidth={2.5} className="mcq-label-icon" />
                  Difficulty
                </label>
                <div className="mcq-difficulties">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      className={`mcq-diff-btn ${difficulty === d.id ? "mcq-diff-on" : ""}`}
                      onClick={() => setDifficulty(d.id)}
                    >
                      <span className="mcq-diff-label">{d.label}</span>
                      <span className="mcq-diff-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="mcq-divider" />

            {/* Output Style */}
            <div className="mcq-field">
              <label className="mcq-label">
                <GraduationCap size={14} strokeWidth={2.5} className="mcq-label-icon" />
                Output Style
              </label>
              <div className="mcq-formats mcq-formats-4">
                {OUTPUT_STYLES.map(s => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      className={`mcq-format-btn ${outputStyle === s.id ? "mcq-fmt-on" : ""}`}
                      onClick={() => setOutputStyle(s.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="mcq-fmt-icon" />
                      <span className="mcq-fmt-label">{s.label}</span>
                      <span className="mcq-fmt-desc">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mcq-divider" />

            {/* Explanation toggle */}
            <div className="mcq-field">
              <label className="mcq-label">
                <Sparkles size={14} strokeWidth={2.5} className="mcq-label-icon" />
                Answer Options
              </label>
              <button
                className={`mcq-toggle-check ${withExplain ? "mcq-check-on" : ""}`}
                onClick={() => setWithExplain(v => !v)}
              >
                <span className="mcq-check-box">{withExplain ? "✓" : ""}</span>
                <div className="mcq-check-text">
                  <span className="mcq-check-label">Include Answer Explanations</span>
                  <span className="mcq-check-desc">Add a brief explanation for why the correct answer is right</span>
                </div>
              </button>
            </div>

            {/* Generate Button */}
            <button className="mcq-submit-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading ? (
                <><span className="mcq-spinner" /> Generating Questions...</>
              ) : (
                <><Sparkles size={16} strokeWidth={2} /> Generate Questions</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="mcq-card mcq-skeleton-card animate-in">
              <div className="mcq-skel mcq-skel-title" />
              <div className="mcq-skel mcq-skel-line" />
              <div className="mcq-skel mcq-skel-line mcq-skel-short" />
              <div className="mcq-skel mcq-skel-line" />
              <div className="mcq-skel mcq-skel-block" />
              <div className="mcq-skel mcq-skel-line mcq-skel-short" />
              <div className="mcq-skel mcq-skel-line" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="mcq-card animate-in">

              <div className="mcq-result-top">
                <div className="mcq-result-meta">
                  <span className="mcq-result-badge">
                    <BookOpen size={12} strokeWidth={2.5} />
                    {count} Questions
                  </span>
                  <span className="mcq-result-badge mcq-badge-type">
                    {QTYPES.find(q => q.id === qtype)?.label}
                  </span>
                  <span className="mcq-result-badge mcq-badge-diff">
                    {DIFFICULTIES.find(d => d.id === difficulty)?.label}
                  </span>
                </div>

                <div className="mcq-tabs">
                  <button className={`mcq-tab ${activeTab === "preview" ? "mcq-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`mcq-tab ${activeTab === "raw"     ? "mcq-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="mcq-actions">
                  <button className="mcq-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="mcq-action-btn" onClick={handleDownload} title="Download questions">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`mcq-copy-btn ${copied ? "mcq-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="mcq-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="mcq-raw">{result}</pre>
              )}

              <div className="mcq-result-footer">
                <span className="mcq-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`mcq-copy-full ${copied ? "mcq-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Question Set</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
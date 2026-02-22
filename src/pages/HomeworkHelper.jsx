/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./HomeworkHelper.css";
import { Helmet } from "react-helmet";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  ScrollText,
  Code2,
  Beaker,
  Zap,
  Dna,
  BarChart2,
  MoreHorizontal,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const SUBJECTS = [
  { id: "math",      label: "Math",        icon: Calculator     },
  { id: "science",   label: "Science",     icon: FlaskConical   },
  { id: "history",   label: "History",     icon: ScrollText     },
  { id: "english",   label: "English",     icon: BookOpen       },
  { id: "coding",    label: "Coding",      icon: Code2          },
  { id: "chemistry", label: "Chemistry",   icon: Beaker         },
  { id: "physics",   label: "Physics",     icon: Zap            },
  { id: "biology",   label: "Biology",     icon: Dna            },
  { id: "economics", label: "Economics",   icon: BarChart2      },
  { id: "other",     label: "Other",       icon: MoreHorizontal },
];

const HELP_MODES = [
  { id: "explain",   label: "Explain It",    desc: "Step-by-step explanation" },
  { id: "solve",     label: "Solve & Show",  desc: "Full solution with steps"  },
  { id: "hints",     label: "Give Hints",    desc: "Hints without spoilers"    },
  { id: "check",     label: "Check My Work", desc: "Review and correct"        },
  { id: "summarize", label: "Summarize",     desc: "Key points & concepts"     },
  { id: "quiz",      label: "Quiz Me",       desc: "Practice questions"        },
];

/* ── Markdown renderer ── */
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
      else { output.push(`<pre class="hw-code-block"><code class="lang-${codeLang}">${codeLines.join("\n")}</code></pre>`); inCode = false; }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (/^-{3,}$/.test(line.trim())) { flushList(); output.push("<hr />"); continue; }
    const hm = line.match(/^(#{1,3}) (.+)$/);
    if (hm) { flushList(); output.push(`<h${hm[1].length}>${inlineFormat(hm[2])}</h${hm[1].length}>`); continue; }
    if (/^&gt; /.test(line)) { flushList(); output.push(`<blockquote>${inlineFormat(line.slice(5))}</blockquote>`); continue; }
    const ulm = line.match(/^[\-\*] (.+)$/);
    if (ulm) { if (inList && listOrdered) flushList(); inList = true; listOrdered = false; listItems.push(inlineFormat(ulm[1])); continue; }
    const olm = line.match(/^\d+\. (.+)$/);
    if (olm) { if (inList && !listOrdered) flushList(); inList = true; listOrdered = true; listItems.push(inlineFormat(olm[1])); continue; }
    if (!line.trim()) { flushList(); output.push(""); continue; }
    flushList();
    output.push(`<p>${inlineFormat(line)}</p>`);
  }
  flushList();
  return output.filter(Boolean).join("\n");
}

function inlineFormat(text) {
  return text
    .replace(/`([^`]+)`/g, `<code class="hw-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, `<img alt="$1" src="$2" class="hw-img" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function HomeworkHelper() {
  const [subject,   setSubject]   = useState("");
  const [mode,      setMode]      = useState("explain");
  const [question,  setQuestion]  = useState("");
  const [grade,     setGrade]     = useState("middle");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState("");
  const [copied,    setCopied]    = useState(false);
  const [activeTab, setActiveTab] = useState("preview");

  const canGenerate = question.trim().length > 5 && subject && !loading;
  const charMax = 2000;

  async function handleAsk() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedSubject = SUBJECTS.find(s => s.id === subject);
    const selectedMode    = HELP_MODES.find(m => m.id === mode);
    const gradeLabel = {
      elementary: "Elementary School",
      middle:     "Middle School",
      high:       "High School",
      college:    "College/University",
    }[grade];

    const prompt = `You are an expert, encouraging homework tutor helping a ${gradeLabel} student.

Subject: ${selectedSubject?.label}
Help Mode: ${selectedMode?.label} — ${selectedMode?.desc}
Student's Question / Problem:
"""
${question.trim()}
"""

STRICT RULES:
• Respond in clean, well-structured Markdown.
• Adjust your language complexity to ${gradeLabel} level.
• Be encouraging, clear, and educational — never just give a raw answer without explanation.
• Use numbered steps, bullet points, code blocks, and examples where helpful.
• If the mode is "Give Hints", do NOT reveal the full answer — guide instead.
• If the mode is "Quiz Me", generate 3–5 relevant practice questions with answer keys at the end.
• If the mode is "Check My Work", identify errors kindly and explain corrections.
• End with a short "Key Takeaway" section summarizing the most important concept.`;

    try {
      const res = await generateAI("homework", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```markdown\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "")
        .trim();

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
    a.download = "homework-answer.md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setQuestion(""); setResult(""); setError("");
    setCopied(false); setSubject(""); setMode("explain");
  }

  return (
    <>
      <Helmet>
        <title>Free AI Homework Helper – Get Step-by-Step Answers | ShauryaTools</title>
        <meta name="description" content="Get instant AI-powered homework help for Math, Science, English, History, Coding and more. Step-by-step explanations tailored to your grade level. Free." />
        <meta name="keywords" content="homework helper, ai homework, homework help, homework solver, math helper, science homework, study assistant, homework tutor" />
        <link rel="canonical" href="https://shauryatools.vercel.app/homework-helper" />
      </Helmet>

      <div className="hw-page">
        <div className="hw-inner">

          {/* ── Header ── */}
          <div className="hw-header">
            <div className="hw-icon">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="hw-cat">AI Study Tools</span>
              <h1>Homework Helper</h1>
              <p>Paste your question — get clear, step-by-step help instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="hw-card">

            {/* Subject Picker */}
            <div className="hw-field">
              <div className="hw-label-row">
                <label className="hw-label">Subject</label>
                {subject && (() => {
                  const s = SUBJECTS.find(x => x.id === subject);
                  const Icon = s?.icon;
                  return (
                    <span className="hw-badge-selected">
                      {Icon && <Icon size={11} strokeWidth={2.5} />}
                      {s?.label}
                    </span>
                  );
                })()}
              </div>
              <div className="hw-subjects">
                {SUBJECTS.map(s => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      className={`hw-subject-btn ${subject === s.id ? "hw-sub-on" : ""}`}
                      onClick={() => setSubject(subject === s.id ? "" : s.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="hw-subject-icon" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {!subject && <p className="hw-hint">⚠️ Please select a subject</p>}
            </div>

            <div className="hw-divider" />

            {/* Grade Level */}
            <div className="hw-field">
              <label className="hw-label">Grade Level</label>
              <div className="hw-grades">
                {[
                  { id: "elementary", label: "Elementary"    },
                  { id: "middle",     label: "Middle School"  },
                  { id: "high",       label: "High School"    },
                  { id: "college",    label: "College"        },
                ].map(g => (
                  <button
                    key={g.id}
                    className={`hw-grade-btn ${grade === g.id ? "hw-grade-on" : ""}`}
                    onClick={() => setGrade(g.id)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hw-divider" />

            {/* Help Mode */}
            <div className="hw-field">
              <label className="hw-label">How should I help?</label>
              <div className="hw-modes">
                {HELP_MODES.map(m => (
                  <button
                    key={m.id}
                    className={`hw-mode-btn ${mode === m.id ? "hw-mode-on" : ""}`}
                    onClick={() => setMode(m.id)}
                  >
                    <span className="hw-mode-label">{m.label}</span>
                    <span className="hw-mode-desc">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="hw-divider" />

            {/* Question Input */}
            <div className="hw-field">
              <div className="hw-label-row">
                <label className="hw-label">Your Question or Problem</label>
                <span className={`hw-char-count ${question.length > charMax * 0.9 ? "hw-char-warn" : ""}`}>
                  {question.length}/{charMax}
                </span>
              </div>
              <textarea
                className="hw-textarea"
                value={question}
                onChange={e => {
                  if (e.target.value.length <= charMax) {
                    setQuestion(e.target.value);
                    setError("");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canGenerate) handleAsk(); }}
                placeholder={
                  mode === "check"
                    ? "Paste your question AND your current attempt/answer here..."
                    : mode === "quiz"
                    ? "Enter the topic or chapter you want to be quizzed on..."
                    : "Type or paste your homework question here..."
                }
                rows={5}
              />
              <p className="hw-hint">Press Ctrl+Enter to submit · {charMax - question.length} characters remaining</p>
              {error && (
                <div className="hw-error-msg">
                  <AlertCircle size={14} strokeWidth={2.5} />
                  {error}
                </div>
              )}
            </div>

            {/* Ask Button */}
            <button className="hw-ask-btn" onClick={handleAsk} disabled={!canGenerate}>
              {loading
                ? <><span className="hw-spinner" /> Thinking...</>
                : <><Sparkles size={16} strokeWidth={2} /> Get Help Now</>}
            </button>
          </div>

          {/* ── Loading Skeleton ── */}
          {loading && (
            <div className="hw-card hw-skeleton-card animate-in">
              <div className="hw-skel hw-skel-title" />
              <div className="hw-skel hw-skel-line" />
              <div className="hw-skel hw-skel-line hw-skel-short" />
              <div className="hw-skel hw-skel-line" />
              <div className="hw-skel hw-skel-block" />
              <div className="hw-skel hw-skel-line hw-skel-short" />
              <div className="hw-skel hw-skel-line" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="hw-card animate-in">

              <div className="hw-result-top">
                <div className="hw-result-meta">
                  {(() => {
                    const s = SUBJECTS.find(x => x.id === subject);
                    const Icon = s?.icon;
                    return (
                      <span className="hw-result-badge">
                        {Icon && <Icon size={11} strokeWidth={2.5} />}
                        {s?.label}
                      </span>
                    );
                  })()}
                  <span className="hw-result-badge hw-badge-mode">
                    {HELP_MODES.find(m => m.id === mode)?.label}
                  </span>
                </div>

                <div className="hw-tabs">
                  <button className={`hw-tab ${activeTab === "preview" ? "hw-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`hw-tab ${activeTab === "raw"     ? "hw-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="hw-actions">
                  <button className="hw-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="hw-action-btn" onClick={handleDownload} title="Download answer">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`hw-copy-btn ${copied ? "hw-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="hw-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="hw-raw">{result}</pre>
              )}

              <div className="hw-result-footer">
                <span className="hw-word-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`hw-copy-full ${copied ? "hw-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Full Answer</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
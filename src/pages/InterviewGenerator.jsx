/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./InterviewGenerator.css";
import { Helmet } from "react-helmet";
import {
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Briefcase,
  GraduationCap,
  Target,
  User,
  AlertCircle,
  Code,
  Heart,
  TrendingUp,
  Shield,
  Layers,
  Clock,
  Star,
} from "lucide-react";

/* ── Interview Types ── */
const INTERVIEW_TYPES = [
  { id: "behavioral",  label: "Behavioral",    icon: User,       desc: "STAR-method questions" },
  { id: "technical",   label: "Technical",     icon: Code,       desc: "Skills & knowledge" },
  { id: "situational", label: "Situational",   icon: Target,     desc: "Hypothetical scenarios" },
  { id: "leadership",  label: "Leadership",    icon: TrendingUp, desc: "Management & influence" },
  { id: "culture",     label: "Culture Fit",   icon: Heart,      desc: "Values & team fit" },
  { id: "case",        label: "Case Study",    icon: Briefcase,  desc: "Problem solving" },
];

/* ── Experience Levels ── */
const LEVELS = [
  { id: "entry",    label: "Entry Level",  desc: "0–2 years" },
  { id: "mid",      label: "Mid Level",    desc: "3–5 years" },
  { id: "senior",   label: "Senior",       desc: "6–10 years" },
  { id: "lead",     label: "Lead / Staff", desc: "10+ years" },
  { id: "exec",     label: "Executive",    desc: "C-suite / VP" },
];

/* ── Question Count ── */
const COUNTS = [
  { id: "5",  label: "5 Questions",  desc: "Quick prep" },
  { id: "10", label: "10 Questions", desc: "Standard" },
  { id: "15", label: "15 Questions", desc: "Deep prep" },
  { id: "20", label: "20 Questions", desc: "Full mock" },
];

/* ── Difficulty ── */
const DIFFICULTIES = [
  { id: "easy",   label: "Easy",   icon: Star,   desc: "Starter questions" },
  { id: "medium", label: "Medium", icon: Layers, desc: "Balanced challenge" },
  { id: "hard",   label: "Hard",   icon: Shield, desc: "Senior-level depth" },
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
      else { output.push(`<pre class="iqg-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
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
    .replace(/`([^`]+)`/g, `<code class="iqg-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function InterviewGenerator() {
  const [jobTitle,      setJobTitle]      = useState("");
  const [industry,      setIndustry]      = useState("");
  const [company,       setCompany]       = useState("");
  const [skills,        setSkills]        = useState("");
  const [interviewType, setInterviewType] = useState("behavioral");
  const [level,         setLevel]         = useState("mid");
  const [count,         setCount]         = useState("10");
  const [difficulty,    setDifficulty]    = useState("medium");
  const [withAnswers,   setWithAnswers]   = useState(true);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [result,        setResult]        = useState("");
  const [copied,        setCopied]        = useState(false);
  const [activeTab,     setActiveTab]     = useState("preview");

  const canSubmit = jobTitle.trim().length > 1 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedType       = INTERVIEW_TYPES.find(t => t.id === interviewType);
    const selectedLevel      = LEVELS.find(l => l.id === level);
    const selectedDifficulty = DIFFICULTIES.find(d => d.id === difficulty);

    const prompt = `You are an expert interview coach and hiring manager with 15+ years of experience across top companies.

Generate a comprehensive set of interview questions for this candidate/role.

Role Details:
- Job Title: ${jobTitle.trim()}
- Industry: ${industry.trim() || "General / Not specified"}
- Company (if known): ${company.trim() || "Not specified"}
- Key Skills / Tech Stack: ${skills.trim() || "Not specified"}
- Interview Type: ${selectedType?.label} — ${selectedType?.desc}
- Experience Level: ${selectedLevel?.label} (${selectedLevel?.desc})
- Number of Questions: ${count}
- Difficulty: ${selectedDifficulty?.label} — ${selectedDifficulty?.desc}
- Include suggested answers/hints: ${withAnswers ? "Yes — provide a brief ideal answer guide after each question" : "No — questions only"}

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here is your..." intro.
• Start with a ## Role Overview section — a brief paragraph on what interviewers typically look for in this role.
• Add a ## Interview Questions section with all ${count} questions, numbered.
  - Each question should be bold: **Q1. [Question text]**
  ${withAnswers ? "  - After each question, add: *💡 Ideal Answer Hint:* [2–3 sentence guidance on what a great answer covers]" : ""}
  - Group questions into logical sub-sections if the count is 10+.
• Add a ## Questions to Ask the Interviewer section with 4–5 smart questions the candidate can ask.
• Add a ## Red Flags to Avoid section — 4 common mistakes candidates make in this type of interview.
• End with a ## Key Takeaways section with 3–5 bullet points.
• Keep questions specific, realistic, and calibrated to the ${selectedLevel?.label} level.`;

    try {
      const res = await generateAI("interview", prompt);
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
    a.download = `interview-questions-${jobTitle.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setJobTitle(""); setIndustry(""); setCompany(""); setSkills("");
    setInterviewType("behavioral"); setLevel("mid"); setCount("10");
    setDifficulty("medium"); setWithAnswers(true);
    setResult(""); setError(""); setCopied(false);
  }

  return (
    <>
      <Helmet>
        <title>Free AI Interview Question Generator – Prep Smarter | ShauryaTools</title>
        <meta name="description" content="Generate tailored interview questions for any job role, industry, and experience level. Get behavioral, technical, situational, and leadership questions with answer hints. Free AI tool." />
        <meta name="keywords" content="interview question generator, ai interview prep, behavioral interview questions, technical interview questions, job interview practice, interview coach, mock interview tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/interview-question-generator" />
      </Helmet>

      <div className="iqg-page">
        <div className="iqg-inner">

          {/* ── Header ── */}
          <div className="iqg-header">
            <div className="iqg-icon">
              <MessageSquare size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="iqg-cat">AI Career Tools</span>
              <h1>Interview Question Generator</h1>
              <p>Enter the role & your details — get tailored interview questions with answer guides.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="iqg-card">

            {/* Job Details */}
            <div className="iqg-field">
              <label className="iqg-label">
                <Briefcase size={14} strokeWidth={2.5} className="iqg-label-icon" />
                Job Details
              </label>
              <div className="iqg-row-2">
                <div className="iqg-input-group">
                  <span className="iqg-input-label">Job Title <span className="iqg-required">*</span></span>
                  <input
                    type="text"
                    className="iqg-input"
                    placeholder="e.g. Senior Frontend Developer"
                    value={jobTitle}
                    onChange={e => { setJobTitle(e.target.value); setError(""); }}
                  />
                </div>
                <div className="iqg-input-group">
                  <span className="iqg-input-label">Industry</span>
                  <input
                    type="text"
                    className="iqg-input"
                    placeholder="e.g. FinTech, Healthcare, SaaS"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                  />
                </div>
              </div>
              <div className="iqg-row-2">
                <div className="iqg-input-group">
                  <span className="iqg-input-label">Company Name <span className="iqg-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="iqg-input"
                    placeholder="e.g. Google, Startup, etc."
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                  />
                </div>
                <div className="iqg-input-group">
                  <span className="iqg-input-label">Key Skills / Tech Stack <span className="iqg-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="iqg-input"
                    placeholder="e.g. React, Node.js, AWS, Agile"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="iqg-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="iqg-divider" />

            {/* Interview Type */}
            <div className="iqg-field">
              <label className="iqg-label">
                <MessageSquare size={14} strokeWidth={2.5} className="iqg-label-icon" />
                Interview Type
              </label>
              <div className="iqg-formats iqg-formats-3">
                {INTERVIEW_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      className={`iqg-format-btn ${interviewType === t.id ? "iqg-fmt-on" : ""}`}
                      onClick={() => setInterviewType(t.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="iqg-fmt-icon" />
                      <span className="iqg-fmt-label">{t.label}</span>
                      <span className="iqg-fmt-desc">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="iqg-divider" />

            {/* Experience Level */}
            <div className="iqg-field">
              <label className="iqg-label">
                <GraduationCap size={14} strokeWidth={2.5} className="iqg-label-icon" />
                Experience Level
              </label>
              <div className="iqg-levels">
                {LEVELS.map(l => (
                  <button
                    key={l.id}
                    className={`iqg-level-btn ${level === l.id ? "iqg-lvl-on" : ""}`}
                    onClick={() => setLevel(l.id)}
                  >
                    <span className="iqg-lvl-label">{l.label}</span>
                    <span className="iqg-lvl-desc">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="iqg-divider" />

            {/* Count & Difficulty Row */}
            <div className="iqg-row-2-gap">

              {/* Question Count */}
              <div className="iqg-field">
                <label className="iqg-label">
                  <Clock size={14} strokeWidth={2.5} className="iqg-label-icon" />
                  Number of Questions
                </label>
                <div className="iqg-counts">
                  {COUNTS.map(c => (
                    <button
                      key={c.id}
                      className={`iqg-count-btn ${count === c.id ? "iqg-cnt-on" : ""}`}
                      onClick={() => setCount(c.id)}
                    >
                      <span className="iqg-cnt-label">{c.label}</span>
                      <span className="iqg-cnt-desc">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="iqg-field">
                <label className="iqg-label">
                  <Target size={14} strokeWidth={2.5} className="iqg-label-icon" />
                  Difficulty
                </label>
                <div className="iqg-difficulties">
                  {DIFFICULTIES.map(d => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.id}
                        className={`iqg-diff-btn ${difficulty === d.id ? "iqg-diff-on" : ""}`}
                        onClick={() => setDifficulty(d.id)}
                      >
                        <Icon size={14} strokeWidth={2} className="iqg-diff-icon" />
                        <span className="iqg-diff-label">{d.label}</span>
                        <span className="iqg-diff-desc">{d.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="iqg-divider" />

            {/* Answer hints toggle */}
            <div className="iqg-field">
              <label className="iqg-label">
                <Sparkles size={14} strokeWidth={2.5} className="iqg-label-icon" />
                Answer Guidance
              </label>
              <button
                className={`iqg-toggle-check ${withAnswers ? "iqg-check-on" : ""}`}
                onClick={() => setWithAnswers(v => !v)}
              >
                <span className="iqg-check-box">{withAnswers ? "✓" : ""}</span>
                <div className="iqg-check-text">
                  <span className="iqg-check-label">Include Ideal Answer Hints</span>
                  <span className="iqg-check-desc">Add a brief guide on what a great answer covers for each question</span>
                </div>
              </button>
            </div>

            {/* Generate Button */}
            <button className="iqg-submit-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading ? (
                <><span className="iqg-spinner" /> Generating Questions...</>
              ) : (
                <><Sparkles size={16} strokeWidth={2} /> Generate Interview Questions</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="iqg-card iqg-skeleton-card animate-in">
              <div className="iqg-skel iqg-skel-title" />
              <div className="iqg-skel iqg-skel-line" />
              <div className="iqg-skel iqg-skel-line iqg-skel-short" />
              <div className="iqg-skel iqg-skel-line" />
              <div className="iqg-skel iqg-skel-block" />
              <div className="iqg-skel iqg-skel-line iqg-skel-short" />
              <div className="iqg-skel iqg-skel-line" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="iqg-card animate-in">

              <div className="iqg-result-top">
                <div className="iqg-result-meta">
                  <span className="iqg-result-badge">
                    <MessageSquare size={12} strokeWidth={2.5} />
                    {INTERVIEW_TYPES.find(t => t.id === interviewType)?.label}
                  </span>
                  <span className="iqg-result-badge iqg-badge-level">
                    {LEVELS.find(l => l.id === level)?.label}
                  </span>
                  <span className="iqg-result-badge iqg-badge-count">
                    {count} Questions
                  </span>
                </div>

                <div className="iqg-tabs">
                  <button className={`iqg-tab ${activeTab === "preview" ? "iqg-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`iqg-tab ${activeTab === "raw"     ? "iqg-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="iqg-actions">
                  <button className="iqg-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="iqg-action-btn" onClick={handleDownload} title="Download questions">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`iqg-copy-btn ${copied ? "iqg-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="iqg-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="iqg-raw">{result}</pre>
              )}

              <div className="iqg-result-footer">
                <span className="iqg-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`iqg-copy-full ${copied ? "iqg-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Interview Questions</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
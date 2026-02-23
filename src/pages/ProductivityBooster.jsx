/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./ProductivityBooster.css";
import { Helmet } from "react-helmet";
import {
  Zap,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Clock,
  Target,
  Brain,
  BarChart2,
  Calendar,
  Coffee,
  Layers,
  Shield,
  TrendingUp,
  CheckSquare,
  AlarmClock,
  Flame,
} from "lucide-react";

/* ── Work Roles ── */
const ROLES = [
  { id: "student",     label: "Student",       icon: Brain,     desc: "Classes & studying" },
  { id: "freelancer",  label: "Freelancer",    icon: Zap,       desc: "Self-managed work" },
  { id: "professional",label: "Professional",  icon: Briefcase, desc: "Office / remote job" },
  { id: "entrepreneur",label: "Entrepreneur",  icon: Flame,     desc: "Building a business" },
  { id: "creative",    label: "Creative",      icon: Sparkles,  desc: "Art / design / content" },
  { id: "manager",     label: "Manager",       icon: Layers,    desc: "Leading a team" },
  { id: "parent",      label: "Parent",        icon: Coffee,    desc: "Balancing family & work" },
  { id: "other",       label: "Other",         icon: Target,    desc: "General productivity" },
];

/* ── Plan Duration ── */
const DURATIONS = [
  { id: "1-day",   label: "1 Day",   desc: "Today's plan" },
  { id: "3-day",   label: "3 Days",  desc: "Short sprint" },
  { id: "1-week",  label: "1 Week",  desc: "Weekly plan" },
  { id: "2-week",  label: "2 Weeks", desc: "Fortnight" },
  { id: "1-month", label: "1 Month", desc: "Monthly goals" },
];

/* ── Focus Areas ── */
const FOCUS_AREAS = [
  { id: "deep-work",      label: "Deep Work",       icon: Brain,      desc: "Distraction-free focus" },
  { id: "time-blocking",  label: "Time Blocking",   icon: Calendar,   desc: "Schedule structure" },
  { id: "goal-setting",   label: "Goal Setting",    icon: Target,     desc: "SMART goals & milestones" },
  { id: "habits",         label: "Habit Building",  icon: TrendingUp, desc: "Daily routines & streaks" },
  { id: "energy",         label: "Energy Mgmt",     icon: Zap,        desc: "Peak performance hours" },
  { id: "tasks",          label: "Task Management", icon: CheckSquare,desc: "Prioritize & delegate" },
  { id: "meetings",       label: "Meeting Control", icon: Clock,      desc: "Cut meeting overload" },
  { id: "anti-procr",     label: "Anti-Procrastination", icon: AlarmClock, desc: "Beat delays & avoidance" },
];

/* ── Output Formats ── */
const OUTPUT_FORMATS = [
  { id: "action-plan",  label: "Action Plan",   icon: CheckSquare, desc: "Step-by-step tasks" },
  { id: "schedule",     label: "Daily Schedule",icon: Calendar,    desc: "Hour-by-hour layout" },
  { id: "framework",    label: "Framework",     icon: Layers,      desc: "Systems & methods" },
  { id: "report",       label: "Full Report",   icon: BarChart2,   desc: "Detailed analysis + plan" },
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
      else { output.push(`<pre class="pb-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
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
    .replace(/`([^`]+)`/g, `<code class="pb-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function ProductivityPlanGenerator() {
  const [role,           setRole]          = useState("professional");
  const [duration,       setDuration]      = useState("1-week");
  const [focusAreas,     setFocusAreas]    = useState(["deep-work", "time-blocking"]);
  const [outputFormat,   setOutputFormat]  = useState("action-plan");
  const [challenges,     setChallenges]    = useState("");
  const [goals,          setGoals]         = useState("");
  const [withTools,      setWithTools]     = useState(true);
  const [withMetrics,    setWithMetrics]   = useState(true);
  const [loading,        setLoading]       = useState(false);
  const [error,          setError]         = useState("");
  const [result,         setResult]        = useState("");
  const [copied,         setCopied]        = useState(false);
  const [activeTab,      setActiveTab]     = useState("preview");

  const canSubmit = !loading;

  const toggleFocus = (id) => {
    setFocusAreas(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(f => f !== id) : prev  // keep at least 1
        : prev.length < 4 ? [...prev, id] : prev               // max 4
    );
  };

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedRole     = ROLES.find(r => r.id === role);
    const selectedDuration = DURATIONS.find(d => d.id === duration);
    const selectedFocuses  = FOCUS_AREAS.filter(f => focusAreas.includes(f.id));
    const selectedFormat   = OUTPUT_FORMATS.find(f => f.id === outputFormat);

    const formatInstructions = {
      "action-plan": `Structure as a clear numbered action plan: specific tasks, priorities, and daily actions broken down step by step.`,
      "schedule":    `Structure as a sample daily/weekly schedule with time blocks. Include morning routines, deep work blocks, breaks, and wrap-up.`,
      "framework":   `Structure as a productivity framework: name the system, explain the principles, describe the workflow, and show how to implement it.`,
      "report":      `Structure as a full productivity report: diagnosis of likely bottlenecks, recommended strategies, implementation plan, and success metrics.`,
    };

    const challengeLine = challenges.trim() ? `\nCurrent Challenges: "${challenges.trim()}"` : "";
    const goalsLine     = goals.trim()      ? `\nKey Goals: "${goals.trim()}"` : "";

    const prompt = `You are a world-class productivity coach and performance strategist with expertise in human performance, behavioral psychology, and systems design.

Generate a personalized, high-impact AI Productivity Booster Plan.

Profile:
- Role / Context: ${selectedRole?.label} — ${selectedRole?.desc}
- Plan Duration: ${selectedDuration?.label}
- Focus Areas: ${selectedFocuses.map(f => f.label).join(", ")}
- Output Format: ${selectedFormat?.label} — ${formatInstructions[outputFormat]}${challengeLine}${goalsLine}
- Include recommended tools & apps: ${withTools ? "Yes" : "No"}
- Include success metrics & KPIs: ${withMetrics ? "Yes" : "No"}

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here is your..." intro.
• Start with a ## Productivity Booster Plan header that includes: role, duration, focus areas, and a one-line motivational tagline.
• Make the plan specific, actionable, and realistic — not generic advice.
• Tailor every recommendation to the ${selectedRole?.label} context.
• Cover all selected focus areas with concrete strategies (not vague tips).
• For each major section, include at least 3–5 specific, implementable actions.
• Use bold for key terms and action verbs.
${withTools ? `• Include a ## Recommended Tools section: list 5–8 relevant apps/tools with one-line descriptions for each focus area.` : ""}
${withMetrics ? `• Include a ## Success Metrics section: define 4–6 measurable KPIs to track progress over the plan duration.` : ""}
• End with a ## Quick-Start Checklist: the 5 most important actions to do in the first 24 hours.
• Close with a short motivational quote in blockquote format.`;

    try {
      const res = await generateAI("productivity", prompt);
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
    a.download = `productivity-plan-${role}-${duration}-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setRole("professional"); setDuration("1-week");
    setFocusAreas(["deep-work", "time-blocking"]);
    setOutputFormat("action-plan"); setChallenges(""); setGoals("");
    setWithTools(true); setWithMetrics(true);
    setResult(""); setError(""); setCopied(false);
  }

  return (
    <>
      <Helmet>
        <title>Free AI Productivity Booster Plan Generator – Personalized Productivity Plans | ShauryaTools</title>
        <meta name="description" content="Generate a personalized AI productivity booster plan instantly. Choose your role, focus areas, and duration — get actionable strategies, time-blocking schedules, habit plans, and success metrics. Free tool." />
        <meta name="keywords" content="productivity plan generator, ai productivity, productivity booster, time management plan, deep work plan, productivity for students, productivity for freelancers, goal setting tool, habit tracker, productivity framework, ai productivity coach" />
        <link rel="canonical" href="https://shauryatools.vercel.app/productivity-plan-generator" />
      </Helmet>

      <div className="pb-page">
        <div className="pb-inner">

          {/* ── Header ── */}
          <div className="pb-header">
            <div className="pb-icon">
              <Zap size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="pb-cat">AI Productivity Tools</span>
              <h1>Productivity Booster Plan Generator</h1>
              <p>Tell us your role and goals — get a personalized, actionable productivity plan built for you.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="pb-card">

            {/* Role */}
            <div className="pb-field">
              <label className="pb-label">
                <Briefcase size={14} strokeWidth={2.5} className="pb-label-icon" />
                Your Role
              </label>
              <div className="pb-formats pb-formats-4">
                {ROLES.map(r => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      className={`pb-format-btn ${role === r.id ? "pb-fmt-on" : ""}`}
                      onClick={() => setRole(r.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="pb-fmt-icon" />
                      <span className="pb-fmt-label">{r.label}</span>
                      <span className="pb-fmt-desc">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pb-divider" />

            {/* Goals + Challenges */}
            <div className="pb-row-2-gap">
              <div className="pb-field">
                <div className="pb-input-group">
                  <span className="pb-input-label">Your Key Goals <span className="pb-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="pb-input"
                    placeholder="e.g. Launch MVP, pass exams, hit $10k revenue..."
                    value={goals}
                    onChange={e => { setGoals(e.target.value); setError(""); }}
                  />
                </div>
              </div>
              <div className="pb-field">
                <div className="pb-input-group">
                  <span className="pb-input-label">Current Challenges <span className="pb-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="pb-input"
                    placeholder="e.g. constant distractions, no routine, low energy..."
                    value={challenges}
                    onChange={e => { setChallenges(e.target.value); setError(""); }}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="pb-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="pb-divider" />

            {/* Focus Areas */}
            <div className="pb-field">
              <label className="pb-label">
                <Target size={14} strokeWidth={2.5} className="pb-label-icon" />
                Focus Areas
                <span style={{ fontWeight: 400, color: "var(--grey-3)", fontSize: "0.78rem" }}>
                  &nbsp;— pick up to 4
                </span>
              </label>
              <div className="pb-formats pb-formats-4">
                {FOCUS_AREAS.map(f => {
                  const Icon = f.icon;
                  const isOn = focusAreas.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      className={`pb-format-btn ${isOn ? "pb-fmt-on" : ""}`}
                      onClick={() => toggleFocus(f.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="pb-fmt-icon" />
                      <span className="pb-fmt-label">{f.label}</span>
                      <span className="pb-fmt-desc">{f.desc}</span>
                    </button>
                  );
                })}
              </div>
              <p className="pb-hint">{focusAreas.length}/4 selected — the plan will cover all chosen areas in depth.</p>
            </div>

            <div className="pb-divider" />

            {/* Duration + Output Format */}
            <div className="pb-row-2-gap">

              {/* Duration */}
              <div className="pb-field">
                <label className="pb-label">
                  <Clock size={14} strokeWidth={2.5} className="pb-label-icon" />
                  Plan Duration
                </label>
                <div className="pb-formats pb-formats-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {DURATIONS.map(d => (
                    <button
                      key={d.id}
                      className={`pb-format-btn ${duration === d.id ? "pb-fmt-on" : ""}`}
                      onClick={() => setDuration(d.id)}
                    >
                      <span className="pb-fmt-label">{d.label}</span>
                      <span className="pb-fmt-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format */}
              <div className="pb-field">
                <label className="pb-label">
                  <BarChart2 size={14} strokeWidth={2.5} className="pb-label-icon" />
                  Output Format
                </label>
                <div className="pb-formats pb-formats-2">
                  {OUTPUT_FORMATS.map(f => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        className={`pb-format-btn ${outputFormat === f.id ? "pb-fmt-on" : ""}`}
                        onClick={() => setOutputFormat(f.id)}
                      >
                        <Icon size={15} strokeWidth={2} className="pb-fmt-icon" />
                        <span className="pb-fmt-label">{f.label}</span>
                        <span className="pb-fmt-desc">{f.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="pb-divider" />

            {/* Extra toggles */}
            <div className="pb-field">
              <label className="pb-label">
                <Shield size={14} strokeWidth={2.5} className="pb-label-icon" />
                Include in Plan
              </label>
              <div className="pb-toggles-grid">
                <button
                  className={`pb-toggle-check ${withTools ? "pb-check-on" : ""}`}
                  onClick={() => setWithTools(v => !v)}
                >
                  <span className="pb-check-box">{withTools ? "✓" : ""}</span>
                  <div className="pb-check-text">
                    <span className="pb-check-label">Recommended Tools</span>
                    <span className="pb-check-desc">Apps & tools for each focus area</span>
                  </div>
                </button>
                <button
                  className={`pb-toggle-check ${withMetrics ? "pb-check-on" : ""}`}
                  onClick={() => setWithMetrics(v => !v)}
                >
                  <span className="pb-check-box">{withMetrics ? "✓" : ""}</span>
                  <div className="pb-check-text">
                    <span className="pb-check-label">Success Metrics</span>
                    <span className="pb-check-desc">KPIs to track your progress</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button className="pb-submit-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading ? (
                <><span className="pb-spinner" /> Building Your Plan...</>
              ) : (
                <><Zap size={16} strokeWidth={2} /> Generate Productivity Plan</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="pb-card pb-skeleton-card pb-animate-in">
              <div className="pb-skel pb-skel-title" />
              <div className="pb-skel pb-skel-line" />
              <div className="pb-skel pb-skel-line pb-skel-short" />
              <div className="pb-skel pb-skel-block" />
              <div className="pb-skel pb-skel-line" />
              <div className="pb-skel pb-skel-line pb-skel-short" />
              <div className="pb-skel pb-skel-block" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="pb-card pb-animate-in">

              <div className="pb-result-top">
                <div className="pb-result-meta">
                  <span className="pb-result-badge">
                    <Zap size={12} strokeWidth={2.5} />
                    {DURATIONS.find(d => d.id === duration)?.label} Plan
                  </span>
                  <span className="pb-result-badge pb-badge-role">
                    {ROLES.find(r => r.id === role)?.label}
                  </span>
                  <span className="pb-result-badge pb-badge-duration">
                    {OUTPUT_FORMATS.find(f => f.id === outputFormat)?.label}
                  </span>
                </div>

                <div className="pb-tabs">
                  <button className={`pb-tab ${activeTab === "preview" ? "pb-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`pb-tab ${activeTab === "raw"     ? "pb-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="pb-actions">
                  <button className="pb-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="pb-action-btn" onClick={handleDownload} title="Download plan">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`pb-copy-btn ${copied ? "pb-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="pb-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="pb-raw">{result}</pre>
              )}

              <div className="pb-result-footer">
                <span className="pb-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`pb-copy-full ${copied ? "pb-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
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
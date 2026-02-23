/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./ScreenTimePlanner.css";
import { Helmet } from "react-helmet";
import {
  Monitor,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Clock,
  Smartphone,
  Tv,
  Laptop,
  Gamepad2,
  BookOpen,
  AlertCircle,
  Target,
  User,
  Coffee,
  Moon,
  Sun,
  Heart,
} from "lucide-react";

/* ── Device Usage ── */
const DEVICES = [
  { id: "smartphone", label: "Smartphone",  icon: Smartphone, desc: "Social / messaging" },
  { id: "laptop",     label: "Laptop / PC", icon: Laptop,     desc: "Work / study" },
  { id: "tv",         label: "TV / Streaming", icon: Tv,      desc: "Netflix / YouTube" },
  { id: "gaming",     label: "Gaming",      icon: Gamepad2,   desc: "Console / PC games" },
  { id: "tablet",     label: "Tablet",      icon: Monitor,    desc: "Reading / browsing" },
];

/* ── Goals ── */
const GOALS = [
  { id: "reduce",     label: "Reduce Usage",    icon: Target,   desc: "Cut screen time" },
  { id: "balance",    label: "Better Balance",  icon: Heart,    desc: "Healthy habits" },
  { id: "sleep",      label: "Better Sleep",    icon: Moon,     desc: "No screens at night" },
  { id: "focus",      label: "More Focus",      icon: BookOpen, desc: "Deep work sessions" },
  { id: "kids",       label: "Kids Screen Time",icon: User,     desc: "Child-friendly plan" },
  { id: "work",       label: "Work-Life Sep.",  icon: Laptop,   desc: "Separate work/personal" },
];

/* ── Lifestyle ── */
const LIFESTYLES = [
  { id: "student",    label: "Student",     icon: BookOpen, desc: "School / university" },
  { id: "remote",     label: "Remote Work", icon: Laptop,   desc: "Work from home" },
  { id: "office",     label: "Office Job",  icon: Coffee,   desc: "In-person work" },
  { id: "parent",     label: "Parent",      icon: User,     desc: "Managing family" },
  { id: "freelancer", label: "Freelancer",  icon: Target,   desc: "Flexible schedule" },
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
      else { output.push(`<pre class="stp-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
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
    .replace(/`([^`]+)`/g, `<code class="stp-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function ScreenTimePlanner() {
  const [dailyHours,   setDailyHours]   = useState("");
  const [wakeTime,     setWakeTime]     = useState("07:00");
  const [sleepTime,    setSleepTime]    = useState("23:00");
  const [devices,      setDevices]      = useState(["smartphone", "laptop"]);
  const [goal,         setGoal]         = useState("balance");
  const [lifestyle,    setLifestyle]    = useState("remote");
  const [targetHours,  setTargetHours]  = useState("");
  const [noScreenBed,  setNoScreenBed]  = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [result,       setResult]       = useState("");
  const [copied,       setCopied]       = useState(false);
  const [activeTab,    setActiveTab]    = useState("preview");

  const canSubmit = dailyHours.trim() !== "" && !loading;

  const toggleDevice = (id) => {
    setDevices(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedGoal      = GOALS.find(g => g.id === goal);
    const selectedLifestyle = LIFESTYLES.find(l => l.id === lifestyle);
    const selectedDevices   = DEVICES.filter(d => devices.includes(d.id)).map(d => d.label).join(", ");

    const prompt = `You are a digital wellness coach and productivity expert specializing in healthy screen time habits.

Create a personalized Screen Time Tracker & Daily Planner for this person.

User Profile:
- Current daily screen time: ${dailyHours} hours
- Wake-up time: ${wakeTime}
- Bedtime: ${sleepTime}
- Devices used: ${selectedDevices || "Various devices"}
- Primary goal: ${selectedGoal?.label} — ${selectedGoal?.desc}
- Lifestyle: ${selectedLifestyle?.label} — ${selectedLifestyle?.desc}
- Target screen time: ${targetHours ? targetHours + " hours/day" : "Not specified — suggest an ideal target"}
- No-screen buffer before bed: ${noScreenBed ? "Yes — build in a screen-free wind-down period" : "No preference"}

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here is your..." intro.
• Start with a ## Screen Time Assessment section evaluating their current usage vs healthy benchmarks.
• Add a ## Your Daily Screen Budget showing a breakdown per device category in a readable format.
• Add a ## Hour-by-Hour Day Plan — a full daily schedule from wake-up to sleep with specific screen-on / screen-off windows. Mark each block clearly.
• Add a ## 7-Day Reduction Plan with progressive daily targets if they want to reduce usage.
• Add a ## Digital Wellness Rules — 6 personalized rules/boundaries to follow.
• Add a ## App & Notification Strategy — specific tips on which apps/notifications to limit.
• End with a ## Key Takeaways section with 3–5 bullet points.
• Use bold for times, hours, and key values. Keep tone supportive and non-judgmental.`;

    try {
      const res = await generateAI("screentime", prompt);
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
    a.download = "screen-time-plan.md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setDailyHours(""); setWakeTime("07:00"); setSleepTime("23:00");
    setDevices(["smartphone", "laptop"]); setGoal("balance");
    setLifestyle("remote"); setTargetHours(""); setNoScreenBed(true);
    setResult(""); setError(""); setCopied(false);
  }

  return (
    <>
      <Helmet>
        <title>Free AI Screen Time Tracker & Planner – Digital Wellness Plan | ShauryaTools</title>
        <meta name="description" content="Track and reduce your screen time with a personalized AI-powered daily planner. Get a custom schedule, device budget, and digital wellness rules. Free tool." />
        <meta name="keywords" content="screen time tracker, screen time planner, reduce screen time, digital wellness, phone addiction, screen time calculator, daily screen time plan, ai productivity tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/screen-time-planner" />
      </Helmet>

      <div className="stp-page">
        <div className="stp-inner">

          {/* ── Header ── */}
          <div className="stp-header">
            <div className="stp-icon">
              <Monitor size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="stp-cat">AI Productivity Tools</span>
              <h1>Screen Time Tracker Planner</h1>
              <p>Enter your screen habits — get a personalized daily schedule & digital wellness plan.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="stp-card">

            {/* Screen Time Info */}
            <div className="stp-field">
              <label className="stp-label">
                <Clock size={14} strokeWidth={2.5} className="stp-label-icon" />
                Screen Time Info
              </label>
              <div className="stp-row-3">
                <div className="stp-input-group">
                  <span className="stp-input-label">Current Daily (hrs)</span>
                  <input
                    type="number"
                    className="stp-input"
                    placeholder="e.g. 8"
                    value={dailyHours}
                    min="1" max="24"
                    onChange={e => { setDailyHours(e.target.value); setError(""); }}
                  />
                </div>
                <div className="stp-input-group">
                  <span className="stp-input-label">Wake-up Time</span>
                  <input
                    type="time"
                    className="stp-input"
                    value={wakeTime}
                    onChange={e => setWakeTime(e.target.value)}
                  />
                </div>
                <div className="stp-input-group">
                  <span className="stp-input-label">Bedtime</span>
                  <input
                    type="time"
                    className="stp-input"
                    value={sleepTime}
                    onChange={e => setSleepTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="stp-row-2">
                <div className="stp-input-group">
                  <span className="stp-input-label">Target Daily (hrs) — optional</span>
                  <input
                    type="number"
                    className="stp-input"
                    placeholder="e.g. 4 (leave blank for AI suggestion)"
                    value={targetHours}
                    min="1" max="24"
                    onChange={e => setTargetHours(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="stp-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="stp-divider" />

            {/* Devices */}
            <div className="stp-field">
              <label className="stp-label">
                <Smartphone size={14} strokeWidth={2.5} className="stp-label-icon" />
                Devices You Use <span className="stp-label-hint">(select all that apply)</span>
              </label>
              <div className="stp-formats stp-formats-5">
                {DEVICES.map(d => {
                  const Icon = d.icon;
                  const active = devices.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      className={`stp-format-btn ${active ? "stp-fmt-on" : ""}`}
                      onClick={() => toggleDevice(d.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="stp-fmt-icon" />
                      <span className="stp-fmt-label">{d.label}</span>
                      <span className="stp-fmt-desc">{d.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="stp-divider" />

            {/* Goal */}
            <div className="stp-field">
              <label className="stp-label">
                <Target size={14} strokeWidth={2.5} className="stp-label-icon" />
                Primary Goal
              </label>
              <div className="stp-formats stp-formats-3">
                {GOALS.map(g => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.id}
                      className={`stp-format-btn ${goal === g.id ? "stp-fmt-on" : ""}`}
                      onClick={() => setGoal(g.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="stp-fmt-icon" />
                      <span className="stp-fmt-label">{g.label}</span>
                      <span className="stp-fmt-desc">{g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="stp-divider" />

            {/* Lifestyle */}
            <div className="stp-field">
              <label className="stp-label">
                <User size={14} strokeWidth={2.5} className="stp-label-icon" />
                Your Lifestyle
              </label>
              <div className="stp-formats stp-formats-5">
                {LIFESTYLES.map(l => {
                  const Icon = l.icon;
                  return (
                    <button
                      key={l.id}
                      className={`stp-format-btn ${lifestyle === l.id ? "stp-fmt-on" : ""}`}
                      onClick={() => setLifestyle(l.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="stp-fmt-icon" />
                      <span className="stp-fmt-label">{l.label}</span>
                      <span className="stp-fmt-desc">{l.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="stp-divider" />

            {/* Toggle options */}
            <div className="stp-field">
              <label className="stp-label">
                <Moon size={14} strokeWidth={2.5} className="stp-label-icon" />
                Sleep & Wind-Down
              </label>
              <button
                className={`stp-toggle-check ${noScreenBed ? "stp-check-on" : ""}`}
                onClick={() => setNoScreenBed(v => !v)}
              >
                <span className="stp-check-box">{noScreenBed ? "✓" : ""}</span>
                <div className="stp-check-text">
                  <span className="stp-check-label">Include Screen-Free Wind-Down Period</span>
                  <span className="stp-check-desc">Add a 30–60 min no-screen buffer before bedtime in my plan</span>
                </div>
              </button>
            </div>

            {/* Generate Button */}
            <button className="stp-submit-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading ? (
                <><span className="stp-spinner" /> Generating Plan...</>
              ) : (
                <><Sparkles size={16} strokeWidth={2} /> Generate My Screen Time Plan</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="stp-card stp-skeleton-card animate-in">
              <div className="stp-skel stp-skel-title" />
              <div className="stp-skel stp-skel-line" />
              <div className="stp-skel stp-skel-line stp-skel-short" />
              <div className="stp-skel stp-skel-line" />
              <div className="stp-skel stp-skel-block" />
              <div className="stp-skel stp-skel-line stp-skel-short" />
              <div className="stp-skel stp-skel-line" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="stp-card animate-in">

              <div className="stp-result-top">
                <div className="stp-result-meta">
                  <span className="stp-result-badge">
                    <Monitor size={12} strokeWidth={2.5} />
                    Screen Time Plan
                  </span>
                  <span className="stp-result-badge stp-badge-goal">
                    {GOALS.find(g => g.id === goal)?.label}
                  </span>
                </div>

                <div className="stp-tabs">
                  <button className={`stp-tab ${activeTab === "preview" ? "stp-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`stp-tab ${activeTab === "raw"     ? "stp-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="stp-actions">
                  <button className="stp-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="stp-action-btn" onClick={handleDownload} title="Download plan">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`stp-copy-btn ${copied ? "stp-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="stp-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="stp-raw">{result}</pre>
              )}

              <div className="stp-result-footer">
                <span className="stp-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`stp-copy-full ${copied ? "stp-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Screen Time Plan</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
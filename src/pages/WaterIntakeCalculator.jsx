/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./WaterIntakeCalculator.css";
import { Helmet } from "react-helmet";
import {
  Droplets,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  User,
  Activity,
  Thermometer,
  Weight,
  AlertCircle,
  Dumbbell,
  Sun,
  Heart,
  Coffee,
  Wind,
  Baby,
} from "lucide-react";

/* ── Activity Levels ── */
const ACTIVITY_LEVELS = [
  { id: "sedentary",   label: "Sedentary",    icon: User,     desc: "Little/no exercise" },
  { id: "light",       label: "Light",         icon: Wind,     desc: "1–3 days/week" },
  { id: "moderate",    label: "Moderate",      icon: Activity, desc: "3–5 days/week" },
  { id: "active",      label: "Active",        icon: Dumbbell, desc: "6–7 days/week" },
  { id: "very_active", label: "Very Active",   icon: Heart,    desc: "Athlete / 2×/day" },
];

/* ── Climate ── */
const CLIMATES = [
  { id: "cool",     label: "Cool",     icon: Wind,        desc: "Below 15°C / 59°F" },
  { id: "moderate", label: "Moderate", icon: Sun,         desc: "15–25°C / 59–77°F" },
  { id: "hot",      label: "Hot",      icon: Thermometer, desc: "25–35°C / 77–95°F" },
  { id: "very_hot", label: "Very Hot", icon: Thermometer, desc: "35°C+ / 95°F+" },
];

/* ── Goals ── */
const GOALS = [
  { id: "general",     label: "General Health",  icon: Heart,    desc: "Stay hydrated" },
  { id: "weight_loss", label: "Weight Loss",     icon: Activity, desc: "Support metabolism" },
  { id: "athletic",    label: "Athletic Perf.",  icon: Dumbbell, desc: "Peak performance" },
  { id: "skin",        label: "Skin & Beauty",   icon: Sparkles, desc: "Glowing skin" },
  { id: "pregnancy",   label: "Pregnancy",       icon: Baby,     desc: "Prenatal hydration" },
  { id: "detox",       label: "Detox",           icon: Droplets, desc: "Cleanse & flush" },
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
      else { output.push(`<pre class="wic-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
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
    .replace(/`([^`]+)`/g, `<code class="wic-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function WaterIntakeCalculator() {
  const [weight,      setWeight]      = useState("");
  const [unit,        setUnit]        = useState("kg");
  const [age,         setAge]         = useState("");
  const [gender,      setGender]      = useState("male");
  const [activity,    setActivity]    = useState("moderate");
  const [climate,     setClimate]     = useState("moderate");
  const [goal,        setGoal]        = useState("general");
  const [extraCoffee, setExtraCoffee] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState("");
  const [copied,      setCopied]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("preview");

  const canSubmit = weight.trim() !== "" && age.trim() !== "" && !loading;

  async function handleCalculate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedActivity = ACTIVITY_LEVELS.find(a => a.id === activity);
    const selectedClimate  = CLIMATES.find(c => c.id === climate);
    const selectedGoal     = GOALS.find(g => g.id === goal);

    const prompt = `You are a certified nutritionist and hydration specialist.

Calculate the ideal daily water intake for this person and provide a personalized hydration plan.

User Profile:
- Weight: ${weight} ${unit}
- Age: ${age} years
- Gender: ${gender}
- Activity Level: ${selectedActivity?.label} — ${selectedActivity?.desc}
- Climate: ${selectedClimate?.label} — ${selectedClimate?.desc}
- Goal: ${selectedGoal?.label} — ${selectedGoal?.desc}
- High caffeine/coffee intake: ${extraCoffee ? "Yes (account for extra hydration needed)" : "No"}

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here is your..." intro.
• Start with a ## Daily Water Intake showing the recommended amount in both Liters and oz (clear, bold number).
• Add a ## Why This Amount section explaining the key factors used in the calculation.
• Add a ## Hourly Hydration Schedule section — a practical schedule from wake-up to bedtime (8 time slots).
• Add a ## Personalized Hydration Tips section with 5 tips based on their goal and lifestyle.
• Add a ## Water-Rich Foods section listing 5 foods that help them reach their goal.
• End with a ## Key Takeaways section with 3–5 bullet points.
• Use bold for numbers and key values. Keep tone friendly and motivating.`;

    try {
      const res = await generateAI("water", prompt);
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
    a.download = "water-intake-plan.md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setWeight(""); setAge(""); setUnit("kg"); setGender("male");
    setActivity("moderate"); setClimate("moderate"); setGoal("general");
    setExtraCoffee(false); setResult(""); setError(""); setCopied(false);
  }

  return (
    <>
      <Helmet>
        <title>Free AI Water Intake Calculator – Daily Hydration Plan | ShauryaTools</title>
        <meta name="description" content="Calculate your ideal daily water intake based on weight, age, activity level, climate, and health goals. Get a personalized AI hydration plan instantly. Free tool." />
        <meta name="keywords" content="water intake calculator, daily water intake, hydration calculator, how much water should I drink, water intake by weight, hydration planner, ai health tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/water-intake-calculator" />
      </Helmet>

      <div className="wic-page">
        <div className="wic-inner">

          {/* ── Header ── */}
          <div className="wic-header">
            <div className="wic-icon">
              <Droplets size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="wic-cat">AI Health Tools</span>
              <h1>Water Intake Calculator</h1>
              <p>Enter your details — get a personalized daily hydration plan powered by AI.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="wic-card">

            {/* Basic Info */}
            <div className="wic-field">
              <label className="wic-label">
                <Weight size={14} strokeWidth={2.5} className="wic-label-icon" />
                Basic Info
              </label>
              <div className="wic-row-3">
                <div className="wic-input-group">
                  <span className="wic-input-label">Weight</span>
                  <div className="wic-input-with-addon">
                    <input
                      type="number"
                      className="wic-input wic-input-addon"
                      placeholder={unit === "kg" ? "e.g. 70" : "e.g. 154"}
                      value={weight}
                      min="1"
                      onChange={e => { setWeight(e.target.value); setError(""); }}
                    />
                    <select className="wic-addon" value={unit} onChange={e => setUnit(e.target.value)}>
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>
                <div className="wic-input-group">
                  <span className="wic-input-label">Age</span>
                  <input
                    type="number"
                    className="wic-input"
                    placeholder="e.g. 28"
                    value={age}
                    min="1"
                    max="120"
                    onChange={e => { setAge(e.target.value); setError(""); }}
                  />
                </div>
                <div className="wic-input-group">
                  <span className="wic-input-label">Gender</span>
                  <select className="wic-input wic-select" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="wic-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="wic-divider" />

            {/* Activity Level */}
            <div className="wic-field">
              <label className="wic-label">
                <Activity size={14} strokeWidth={2.5} className="wic-label-icon" />
                Activity Level
              </label>
              <div className="wic-formats wic-formats-5">
                {ACTIVITY_LEVELS.map(a => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      className={`wic-format-btn ${activity === a.id ? "wic-fmt-on" : ""}`}
                      onClick={() => setActivity(a.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="wic-fmt-icon" />
                      <span className="wic-fmt-label">{a.label}</span>
                      <span className="wic-fmt-desc">{a.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="wic-divider" />

            {/* Climate */}
            <div className="wic-field">
              <label className="wic-label">
                <Thermometer size={14} strokeWidth={2.5} className="wic-label-icon" />
                Climate / Environment
              </label>
              <div className="wic-formats wic-formats-4">
                {CLIMATES.map(c => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      className={`wic-format-btn ${climate === c.id ? "wic-fmt-on" : ""}`}
                      onClick={() => setClimate(c.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="wic-fmt-icon" />
                      <span className="wic-fmt-label">{c.label}</span>
                      <span className="wic-fmt-desc">{c.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="wic-divider" />

            {/* Goal */}
            <div className="wic-field">
              <label className="wic-label">
                <Heart size={14} strokeWidth={2.5} className="wic-label-icon" />
                Hydration Goal
              </label>
              <div className="wic-formats wic-formats-3">
                {GOALS.map(g => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.id}
                      className={`wic-format-btn ${goal === g.id ? "wic-fmt-on" : ""}`}
                      onClick={() => setGoal(g.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="wic-fmt-icon" />
                      <span className="wic-fmt-label">{g.label}</span>
                      <span className="wic-fmt-desc">{g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="wic-divider" />

            {/* Additional Factors */}
            <div className="wic-field">
              <label className="wic-label">
                <Coffee size={14} strokeWidth={2.5} className="wic-label-icon" />
                Additional Factors
              </label>
              <button
                className={`wic-toggle-check ${extraCoffee ? "wic-check-on" : ""}`}
                onClick={() => setExtraCoffee(v => !v)}
              >
                <span className="wic-check-box">{extraCoffee ? "✓" : ""}</span>
                <div className="wic-check-text">
                  <span className="wic-check-label">High Caffeine / Coffee Intake</span>
                  <span className="wic-check-desc">I drink 2+ cups of coffee or caffeinated drinks daily</span>
                </div>
              </button>
            </div>

            {/* Calculate Button */}
            <button className="wic-submit-btn" onClick={handleCalculate} disabled={!canSubmit}>
              {loading ? (
                <><span className="wic-spinner" /> Calculating...</>
              ) : (
                <><Sparkles size={16} strokeWidth={2} /> Calculate My Water Intake</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="wic-card wic-skeleton-card animate-in">
              <div className="wic-skel wic-skel-title" />
              <div className="wic-skel wic-skel-line" />
              <div className="wic-skel wic-skel-line wic-skel-short" />
              <div className="wic-skel wic-skel-line" />
              <div className="wic-skel wic-skel-block" />
              <div className="wic-skel wic-skel-line wic-skel-short" />
              <div className="wic-skel wic-skel-line" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="wic-card animate-in">

              {/* Top bar */}
              <div className="wic-result-top">
                <div className="wic-result-meta">
                  <span className="wic-result-badge">
                    <Droplets size={12} strokeWidth={2.5} />
                    Hydration Plan
                  </span>
                  <span className="wic-result-badge wic-badge-goal">
                    {GOALS.find(g => g.id === goal)?.label}
                  </span>
                </div>

                <div className="wic-tabs">
                  <button className={`wic-tab ${activeTab === "preview" ? "wic-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`wic-tab ${activeTab === "raw"     ? "wic-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="wic-actions">
                  <button className="wic-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="wic-action-btn" onClick={handleDownload} title="Download plan">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`wic-copy-btn ${copied ? "wic-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="wic-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="wic-raw">{result}</pre>
              )}

              {/* Footer */}
              <div className="wic-result-footer">
                <span className="wic-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`wic-copy-full ${copied ? "wic-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Hydration Plan</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
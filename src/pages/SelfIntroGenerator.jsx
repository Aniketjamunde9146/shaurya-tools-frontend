/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./SelfIntroGenerator.css";
import { Helmet } from "react-helmet";
import {
  UserCircle,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Briefcase,
  Globe,
  Mic,
  Mail,
  Linkedin,
  BookOpen,
  Heart,
  Target,
  AlertCircle,
  Clock,
  Smile,
  TrendingUp,
  Users,
} from "lucide-react";

/* ── Introduction Contexts ── */
const CONTEXTS = [
  { id: "job_interview",  label: "Job Interview",     icon: Briefcase,  desc: "Tell me about yourself" },
  { id: "networking",     label: "Networking Event",  icon: Users,      desc: "Professional meetup" },
  { id: "linkedin",       label: "LinkedIn Bio",      icon: Linkedin,   desc: "Profile summary" },
  { id: "email",          label: "Email / Cover",     icon: Mail,       desc: "Written intro" },
  { id: "conference",     label: "Conference Talk",   icon: Mic,        desc: "Speaker intro" },
  { id: "first_day",      label: "First Day at Work", icon: Smile,      desc: "Team introduction" },
  { id: "college",        label: "College / Class",   icon: BookOpen,   desc: "Academic setting" },
  { id: "online",         label: "Online / Forum",    icon: Globe,      desc: "Community / Discord" },
];

/* ── Tone ── */
const TONES = [
  { id: "professional", label: "Professional", desc: "Formal & polished" },
  { id: "friendly",     label: "Friendly",     desc: "Warm & approachable" },
  { id: "confident",    label: "Confident",    desc: "Bold & assertive" },
  { id: "humble",       label: "Humble",       desc: "Grounded & genuine" },
  { id: "creative",     label: "Creative",     desc: "Unique & memorable" },
];

/* ── Length ── */
const LENGTHS = [
  { id: "short",  label: "Short",  icon: Clock,      desc: "30 sec / ~60 words" },
  { id: "medium", label: "Medium", icon: TrendingUp, desc: "1 min / ~150 words" },
  { id: "long",   label: "Long",   icon: Target,     desc: "2 min / ~300 words" },
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
      else { output.push(`<pre class="sig-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
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
    .replace(/`([^`]+)`/g, `<code class="sig-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function SelfIntroGenerator() {
  const [name,         setName]         = useState("");
  const [role,         setRole]         = useState("");
  const [experience,   setExperience]   = useState("");
  const [skills,       setSkills]       = useState("");
  const [achievement,  setAchievement]  = useState("");
  const [goal,         setGoal]         = useState("");
  const [personality,  setPersonality]  = useState("");
  const [context,      setContext]      = useState("job_interview");
  const [tone,         setTone]         = useState("professional");
  const [length,       setLength]       = useState("medium");
  const [variants,     setVariants]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [result,       setResult]       = useState("");
  const [copied,       setCopied]       = useState(false);
  const [activeTab,    setActiveTab]    = useState("preview");

  const canSubmit = name.trim().length > 0 && role.trim().length > 0 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedContext = CONTEXTS.find(c => c.id === context);
    const selectedTone    = TONES.find(t => t.id === tone);
    const selectedLength  = LENGTHS.find(l => l.id === length);

    const prompt = `You are an expert personal branding coach and speechwriter who crafts memorable, authentic self-introductions.

Create a personalized self-introduction for this individual.

Personal Details:
- Name: ${name.trim()}
- Current Role / Title: ${role.trim()}
- Years of Experience: ${experience.trim() || "Not specified"}
- Key Skills / Expertise: ${skills.trim() || "Not specified"}
- Notable Achievement: ${achievement.trim() || "Not specified"}
- Goal / What they're looking for: ${goal.trim() || "Not specified"}
- Personality / Fun fact: ${personality.trim() || "Not specified"}

Settings:
- Context: ${selectedContext?.label} — ${selectedContext?.desc}
- Tone: ${selectedTone?.label} — ${selectedTone?.desc}
- Length: ${selectedLength?.label} — ${selectedLength?.desc}
- Generate variants: ${variants ? "Yes — provide 3 different versions" : "No — one polished version"}

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here is your..." intro.
• ${variants
  ? `Create 3 distinct versions labeled ## Version 1 — [style], ## Version 2 — [style], ## Version 3 — [style]. Each should feel meaningfully different.`
  : `Start directly with the introduction under ## Your Self-Introduction.`
}
• After the introduction(s), add a ## Why It Works section explaining the key techniques used (2–4 bullet points).
• Add a ## Delivery Tips section with 3–4 practical tips for delivering this introduction confidently (speaking context) or formatting it (written context).
• Add a ## Customization Suggestions section with 2–3 ideas to tweak it for different situations.
• Write in first person. Make it feel natural, authentic, and human — never robotic.
• Calibrate word count to the ${selectedLength?.label} setting: Short (~60 words), Medium (~150 words), Long (~300 words).`;

    try {
      const res = await generateAI("intro", prompt);
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
    a.download = `self-intro-${name.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setName(""); setRole(""); setExperience(""); setSkills("");
    setAchievement(""); setGoal(""); setPersonality("");
    setContext("job_interview"); setTone("professional"); setLength("medium");
    setVariants(false); setResult(""); setError(""); setCopied(false);
  }

  return (
    <>
      <Helmet>
        <title>Free AI Self-Introduction Generator – Craft Your Perfect Intro | ShauryaTools</title>
        <meta name="description" content="Generate a polished, personalized self-introduction for job interviews, networking events, LinkedIn bios, and more. Multiple tones and lengths. Free AI tool." />
        <meta name="keywords" content="self introduction generator, ai intro generator, tell me about yourself, linkedin bio generator, professional introduction, job interview intro, personal branding, elevator pitch generator" />
        <link rel="canonical" href="https://shauryatools.vercel.app/self-introduction-generator" />
      </Helmet>

      <div className="sig-page">
        <div className="sig-inner">

          {/* ── Header ── */}
          <div className="sig-header">
            <div className="sig-icon">
              <UserCircle size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="sig-cat">AI Career Tools</span>
              <h1>Self-Introduction Generator</h1>
              <p>Fill in your details — get a polished, confident intro for any occasion.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="sig-card">

            {/* About You */}
            <div className="sig-field">
              <label className="sig-label">
                <UserCircle size={14} strokeWidth={2.5} className="sig-label-icon" />
                About You
              </label>
              <div className="sig-row-2">
                <div className="sig-input-group">
                  <span className="sig-input-label">Your Name <span className="sig-required">*</span></span>
                  <input
                    type="text"
                    className="sig-input"
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                  />
                </div>
                <div className="sig-input-group">
                  <span className="sig-input-label">Current Role / Title <span className="sig-required">*</span></span>
                  <input
                    type="text"
                    className="sig-input"
                    placeholder="e.g. Full-Stack Developer"
                    value={role}
                    onChange={e => { setRole(e.target.value); setError(""); }}
                  />
                </div>
              </div>
              <div className="sig-row-2">
                <div className="sig-input-group">
                  <span className="sig-input-label">Years of Experience <span className="sig-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="sig-input"
                    placeholder="e.g. 5 years, Fresher, 10+ years"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                  />
                </div>
                <div className="sig-input-group">
                  <span className="sig-input-label">Key Skills / Expertise <span className="sig-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="sig-input"
                    placeholder="e.g. React, leadership, data analysis"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                  />
                </div>
              </div>
              <div className="sig-row-2">
                <div className="sig-input-group">
                  <span className="sig-input-label">Notable Achievement <span className="sig-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="sig-input"
                    placeholder="e.g. Led a team that grew revenue 40%"
                    value={achievement}
                    onChange={e => setAchievement(e.target.value)}
                  />
                </div>
                <div className="sig-input-group">
                  <span className="sig-input-label">Your Goal / What You're Seeking <span className="sig-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="sig-input"
                    placeholder="e.g. Looking for senior roles in AI"
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                  />
                </div>
              </div>
              <div className="sig-input-group">
                <span className="sig-input-label">Personality / Fun Fact <span className="sig-optional">(optional — makes it memorable)</span></span>
                <input
                  type="text"
                  className="sig-input"
                  placeholder="e.g. I'm a marathon runner who loves building side projects on weekends"
                  value={personality}
                  onChange={e => setPersonality(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="sig-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="sig-divider" />

            {/* Context */}
            <div className="sig-field">
              <label className="sig-label">
                <Globe size={14} strokeWidth={2.5} className="sig-label-icon" />
                Introduction Context
              </label>
              <div className="sig-formats sig-formats-4">
                {CONTEXTS.map(c => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      className={`sig-format-btn ${context === c.id ? "sig-fmt-on" : ""}`}
                      onClick={() => setContext(c.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="sig-fmt-icon" />
                      <span className="sig-fmt-label">{c.label}</span>
                      <span className="sig-fmt-desc">{c.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sig-divider" />

            {/* Tone & Length Row */}
            <div className="sig-row-2-gap">

              {/* Tone */}
              <div className="sig-field">
                <label className="sig-label">
                  <Smile size={14} strokeWidth={2.5} className="sig-label-icon" />
                  Tone
                </label>
                <div className="sig-tones">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      className={`sig-tone-btn ${tone === t.id ? "sig-tone-on" : ""}`}
                      onClick={() => setTone(t.id)}
                    >
                      <span className="sig-tone-label">{t.label}</span>
                      <span className="sig-tone-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div className="sig-field">
                <label className="sig-label">
                  <Clock size={14} strokeWidth={2.5} className="sig-label-icon" />
                  Length
                </label>
                <div className="sig-lengths">
                  {LENGTHS.map(l => {
                    const Icon = l.icon;
                    return (
                      <button
                        key={l.id}
                        className={`sig-length-btn ${length === l.id ? "sig-len-on" : ""}`}
                        onClick={() => setLength(l.id)}
                      >
                        <Icon size={14} strokeWidth={2} className="sig-len-icon" />
                        <span className="sig-len-label">{l.label}</span>
                        <span className="sig-len-desc">{l.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="sig-divider" />

            {/* Variants toggle */}
            <div className="sig-field">
              <label className="sig-label">
                <Heart size={14} strokeWidth={2.5} className="sig-label-icon" />
                Output Options
              </label>
              <button
                className={`sig-toggle-check ${variants ? "sig-check-on" : ""}`}
                onClick={() => setVariants(v => !v)}
              >
                <span className="sig-check-box">{variants ? "✓" : ""}</span>
                <div className="sig-check-text">
                  <span className="sig-check-label">Generate 3 Different Versions</span>
                  <span className="sig-check-desc">Get multiple unique introductions with different styles to choose from</span>
                </div>
              </button>
            </div>

            {/* Generate Button */}
            <button className="sig-submit-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading ? (
                <><span className="sig-spinner" /> Crafting Your Introduction...</>
              ) : (
                <><Sparkles size={16} strokeWidth={2} /> Generate My Self-Introduction</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="sig-card sig-skeleton-card animate-in">
              <div className="sig-skel sig-skel-title" />
              <div className="sig-skel sig-skel-line" />
              <div className="sig-skel sig-skel-line sig-skel-short" />
              <div className="sig-skel sig-skel-line" />
              <div className="sig-skel sig-skel-block" />
              <div className="sig-skel sig-skel-line sig-skel-short" />
              <div className="sig-skel sig-skel-line" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="sig-card animate-in">

              <div className="sig-result-top">
                <div className="sig-result-meta">
                  <span className="sig-result-badge">
                    <UserCircle size={12} strokeWidth={2.5} />
                    {CONTEXTS.find(c => c.id === context)?.label}
                  </span>
                  <span className="sig-result-badge sig-badge-tone">
                    {TONES.find(t => t.id === tone)?.label}
                  </span>
                  <span className="sig-result-badge sig-badge-length">
                    {LENGTHS.find(l => l.id === length)?.label}
                  </span>
                </div>

                <div className="sig-tabs">
                  <button className={`sig-tab ${activeTab === "preview" ? "sig-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`sig-tab ${activeTab === "raw"     ? "sig-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="sig-actions">
                  <button className="sig-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="sig-action-btn" onClick={handleDownload} title="Download intro">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`sig-copy-btn ${copied ? "sig-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="sig-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="sig-raw">{result}</pre>
              )}

              <div className="sig-result-footer">
                <span className="sig-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`sig-copy-full ${copied ? "sig-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Introduction</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./BusinessNameGenerator.css";
import { Helmet } from "react-helmet";
import {
  Briefcase,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Globe,
  Tag,
  Lightbulb,
  Zap,
  Star,
  Heart,
  Target,
  Layers,
  ChevronRight,
  AlignLeft,
  BarChart2,
  Shuffle,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
} from "lucide-react";

/* ── Industry Options ── */
const INDUSTRIES = [
  { id: "tech",       label: "Technology"    },
  { id: "ecommerce",  label: "E-Commerce"    },
  { id: "health",     label: "Health & Wellness" },
  { id: "food",       label: "Food & Beverage"   },
  { id: "finance",    label: "Finance"        },
  { id: "education",  label: "Education"      },
  { id: "creative",   label: "Creative / Design" },
  { id: "real_estate",label: "Real Estate"    },
  { id: "fashion",    label: "Fashion"        },
  { id: "travel",     label: "Travel"         },
  { id: "fitness",    label: "Fitness"        },
  { id: "consulting", label: "Consulting"     },
];

/* ── Name Style ── */
const NAME_STYLES = [
  { id: "modern",      label: "Modern & Minimal"   },
  { id: "classic",     label: "Classic & Trustworthy" },
  { id: "playful",     label: "Playful & Fun"       },
  { id: "bold",        label: "Bold & Powerful"     },
  { id: "coined",      label: "Coined / Invented"   },
  { id: "descriptive", label: "Descriptive"         },
];

/* ── Name Length ── */
const NAME_LENGTHS = [
  { id: "short",  label: "Short (1–5 chars)"  },
  { id: "medium", label: "Medium (6–10 chars)" },
  { id: "long",   label: "Long (11+ chars)"   },
  { id: "any",    label: "Any Length"          },
];

/* ── Audience ── */
const AUDIENCES = [
  { id: "b2b",       label: "B2B",         icon: Briefcase },
  { id: "b2c",       label: "B2C",         icon: Heart     },
  { id: "enterprise",label: "Enterprise",  icon: Layers    },
  { id: "startup",   label: "Startup",     icon: Zap       },
];

/* ── Include options ── */
const INCLUDES = [
  { key: "includeMeaning",  icon: <Lightbulb size={13} strokeWidth={2}/>, label: "Name Meaning"    },
  { key: "includeDomain",   icon: <Globe     size={13} strokeWidth={2}/>, label: "Domain Check"    },
  { key: "includeTagline",  icon: <Tag       size={13} strokeWidth={2}/>, label: "Tagline Ideas"   },
];

/* ── Vibe tags ── */
const VIBES = [
  "Innovative", "Trustworthy", "Premium", "Friendly",
  "Energetic", "Sustainable", "Luxury", "Minimalist",
  "Disruptive", "Community", "Global", "Local",
];

export default function BusinessNameGenerator() {
  /* Inputs */
  const [industry,       setIndustry]       = useState("tech");
  const [nameStyle,      setNameStyle]       = useState("modern");
  const [nameLength,     setNameLength]      = useState("medium");
  const [audience,       setAudience]        = useState("b2c");
  const [keywords,       setKeywords]        = useState("");
  const [description,    setDescription]     = useState("");
  const [selectedVibes,  setSelectedVibes]   = useState([]);
  const [nameCount,      setNameCount]       = useState("10");

  const [includeMeaning, setIncludeMeaning]  = useState(true);
  const [includeDomain,  setIncludeDomain]   = useState(true);
  const [includeTagline, setIncludeTagline]  = useState(true);

  /* Output */
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState(null);
  const [copied,    setCopied]    = useState("");
  const [activeTab, setActiveTab] = useState("names");
  const [saved,     setSaved]     = useState([]);

  const charMax   = 400;
  const canSubmit = !loading;

  /* ── Vibe toggle ── */
  function toggleVibe(v) {
    setSelectedVibes(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  }

  /* ── Save / unsave a name ── */
  function toggleSave(name) {
    setSaved(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  /* ── Include toggles ── */
  const setMap   = { includeMeaning: setIncludeMeaning, includeDomain: setIncludeDomain, includeTagline: setIncludeTagline };
  const stateMap = { includeMeaning, includeDomain, includeTagline };

  /* ── Generate ── */
  async function handleGenerate() {
    if (!canSubmit) return;
    setError(""); setLoading(true); setResult(null); setSaved([]);

    const selectedIndustry = INDUSTRIES.find(i => i.id === industry);
    const selectedStyle    = NAME_STYLES.find(s => s.id === nameStyle);
    const selectedAudience = AUDIENCES.find(a => a.id === audience);

    const prompt = `You are an expert brand strategist and naming consultant. Generate creative, memorable business names.

Industry: ${selectedIndustry?.label}
Name Style: ${selectedStyle?.label}
Name Length: ${nameLength}
Target Audience: ${selectedAudience?.label}
Number of Names: ${nameCount}
${keywords.trim()     ? `Keywords / Must Include: ${keywords.trim()}`            : ""}
${description.trim()  ? `Business Description: ${description.trim()}`            : ""}
${selectedVibes.length ? `Brand Vibes: ${selectedVibes.join(", ")}`              : ""}

Include Name Meaning: ${includeMeaning}
Include Domain Availability Suggestions: ${includeDomain}
Include Tagline Ideas: ${includeTagline}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro, no markdown, no text outside JSON.
Exact required shape:
{
  "title": "...",
  "summary": "...",
  "totalGenerated": 10,
  "names": [
    {
      "name": "...",
      "pronunciation": "...",
      "style": "...",
      "meaning": "...",
      "whyItWorks": "...",
      "domain": {
        "dotcom": "available|taken|unknown",
        "alternatives": [".io", ".co", ".app"]
      },
      "taglines": ["...", "..."],
      "score": 85,
      "vibe": "..."
    }
  ],
  "namingInsights": "...",
  "nextSteps": ["...", "..."],
  "affirmation": "..."
}

RULES:
- "title": e.g. "10 Brand Name Ideas for Your Tech Startup"
- "summary": 1-2 sentence overview of the naming strategy used
- "totalGenerated": number of names generated
- "names": array of name objects, each with:
  - "name": the business name (respect the length preference: short=1-5 chars, medium=6-10, long=11+, any=no restriction)
  - "pronunciation": phonetic guide e.g. "No-vah" 
  - "style": which style category this falls into
  - "meaning": only if includeMeaning is true — origin or constructed meaning of the name. Else ""
  - "whyItWorks": 1 sentence on why this name fits the brand
  - "domain": only if includeDomain is true — dotcom as "available", "taken", or "likely taken"; alternatives as 2-3 domain extensions that suit it. Else {"dotcom":"","alternatives":[]}
  - "taglines": only if includeTagline is true — 2 short tagline ideas. Else []
  - "score": brandability score 1-100 based on memorability, uniqueness, pronounceability
  - "vibe": one-word emotional vibe (e.g. "Bold", "Fresh", "Trustworthy")
- "namingInsights": 2-3 sentence strategic insight on why these names work for the brand
- "nextSteps": 3 actionable next steps after picking a name (trademark check, domain registration, etc.)
- "affirmation": one short encouraging sentence for the entrepreneur
- Generate exactly ${nameCount} names
- Prioritize names that match the ${nameStyle} style
- Make names appropriate for ${selectedIndustry?.label} industry targeting ${selectedAudience?.label}
${selectedVibes.length ? `- Infuse the vibes: ${selectedVibes.join(", ")}` : ""}
${keywords.trim() ? `- Incorporate or be inspired by these keywords: ${keywords.trim()}` : ""}
- Return ONLY the JSON object, nothing else`;

    try {
      const res = await generateAI("biz-name-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.names || !Array.isArray(parsed.names)) throw new Error("Invalid format");

      setResult(parsed);
      setActiveTab("names");
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
    t += `GENERATED NAMES (${result.totalGenerated})\n${"─".repeat(20)}\n`;
    result.names.forEach((n, i) => {
      t += `\n${i + 1}. ${n.name}  [Score: ${n.score}/100 · ${n.vibe}]\n`;
      if (n.pronunciation) t += `   Pronunciation: ${n.pronunciation}\n`;
      if (n.meaning)       t += `   Meaning: ${n.meaning}\n`;
      t += `   Why it works: ${n.whyItWorks}\n`;
      if (n.domain?.dotcom) t += `   Domain (.com): ${n.domain.dotcom} | Alt: ${n.domain.alternatives?.join(", ")}\n`;
      if (n.taglines?.length) {
        t += `   Taglines:\n`;
        n.taglines.forEach(tl => { t += `     • ${tl}\n`; });
      }
    });
    if (result.namingInsights) t += `\nNAMING INSIGHTS\n${"─".repeat(20)}\n${result.namingInsights}\n`;
    if (result.nextSteps?.length) {
      t += `\nNEXT STEPS\n${"─".repeat(20)}\n`;
      result.nextSteps.forEach(s => { t += `• ${s}\n`; });
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
    a.download = "business-names.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function handleReset() {
    setIndustry("tech"); setNameStyle("modern"); setNameLength("medium");
    setAudience("b2c"); setKeywords(""); setDescription(""); setSelectedVibes([]);
    setNameCount("10"); setIncludeMeaning(true); setIncludeDomain(true); setIncludeTagline(true);
    setResult(null); setError(""); setCopied(""); setSaved([]);
  }

  const selectedAudienceData = AUDIENCES.find(a => a.id === audience);
  const AudienceIcon = selectedAudienceData?.icon;

  /* ── Score color ── */
  function scoreColor(s) {
    if (s >= 80) return { color: "var(--green)", bg: "var(--green-bg)", bd: "var(--green-bd)" };
    if (s >= 60) return { color: "var(--orange)", bg: "var(--orange-bg)", bd: "var(--orange-bd)" };
    return { color: "var(--red)", bg: "var(--red-bg)", bd: "var(--red-bd)" };
  }

  /* ── Domain badge ── */
  function domainBadge(status) {
    if (status === "available") return { icon: <Unlock size={10}/>, label: "Likely Free", color: "var(--green)", bg: "var(--green-bg)", bd: "var(--green-bd)" };
    if (status === "taken" || status === "likely taken") return { icon: <Lock size={10}/>, label: "Likely Taken", color: "var(--red)", bg: "var(--red-bg)", bd: "var(--red-bd)" };
    return { icon: <Globe size={10}/>, label: "Check Manually", color: "var(--orange)", bg: "var(--orange-bg)", bd: "var(--orange-bd)" };
  }

  return (
    <>
      <Helmet>
        <title>Free AI Business Name Generator – Creative Brand Names | ShauryaTools</title>
        <meta name="description" content="Generate unique, memorable business names with AI. Choose your industry, style, and vibe to get brandable name ideas with taglines and domain suggestions. Free AI naming tool." />
        <meta name="keywords" content="ai business name generator, brand name generator, startup name ideas, company name generator, free business naming tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/business-name-generator" />
      </Helmet>

      <div className="bn-page">
        <div className="bn-inner">

          {/* ── Header ── */}
          <div className="bn-header">
            <div className="bn-icon-box">
              <Briefcase size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="bn-cat">AI Business Tools</span>
              <h1>Business Name Generator</h1>
              <p>Describe your brand, pick your style — get creative, memorable business names with taglines and domain ideas instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="bn-card">

            {/* Industry */}
            <div className="bn-field">
              <label className="bn-label">
                <Layers size={14} className="bn-label-icon" /> Industry
              </label>
              <div className="bn-pills">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind.id}
                    className={`bn-pill ${industry === ind.id ? "bn-pill-on" : ""}`}
                    onClick={() => setIndustry(ind.id)}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bn-divider" />

            {/* Name Style + Length */}
            <div className="bn-two-col">
              <div className="bn-field">
                <label className="bn-label">
                  <Star size={14} className="bn-label-icon" /> Name Style
                </label>
                <div className="bn-pills">
                  {NAME_STYLES.map(s => (
                    <button
                      key={s.id}
                      className={`bn-pill ${nameStyle === s.id ? "bn-pill-on" : ""}`}
                      onClick={() => setNameStyle(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bn-field">
                <label className="bn-label">
                  <Target size={14} className="bn-label-icon" /> Name Length
                </label>
                <div className="bn-pills">
                  {NAME_LENGTHS.map(l => (
                    <button
                      key={l.id}
                      className={`bn-pill ${nameLength === l.id ? "bn-pill-on" : ""}`}
                      onClick={() => setNameLength(l.id)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bn-divider" />

            {/* Target Audience */}
            <div className="bn-field">
              <div className="bn-label-row">
                <label className="bn-label">
                  <Heart size={14} className="bn-label-icon" /> Target Audience
                </label>
                {selectedAudienceData && (
                  <span className="bn-badge">
                    {AudienceIcon && <AudienceIcon size={11} strokeWidth={2.5} />}
                    {selectedAudienceData.label}
                  </span>
                )}
              </div>
              <div className="bn-two-col" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
                {AUDIENCES.map(a => {
                  const Icon = a.icon;
                  const on = audience === a.id;
                  return (
                    <button
                      key={a.id}
                      className={`bn-audience-card${on ? " bn-audience-on" : ""}`}
                      onClick={() => setAudience(a.id)}
                    >
                      <Icon size={16} strokeWidth={2} color={on ? "var(--bn)" : "#8a8a9a"} style={{ marginBottom: 4 }} />
                      <span>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bn-divider" />

            {/* Keywords + Count */}
            <div className="bn-two-col">
              <div className="bn-field">
                <label className="bn-label">
                  <Zap size={14} className="bn-label-icon" />
                  Keywords
                  <span className="bn-optional">(optional)</span>
                </label>
                <input
                  className="bn-input"
                  placeholder="e.g. swift, cloud, pulse…"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                />
              </div>
              <div className="bn-field">
                <label className="bn-label">
                  <BarChart2 size={14} className="bn-label-icon" /> How Many Names?
                </label>
                <div className="bn-pills">
                  {["5","10","15","20"].map(n => (
                    <button
                      key={n}
                      className={`bn-pill ${nameCount === n ? "bn-pill-on" : ""}`}
                      onClick={() => setNameCount(n)}
                    >
                      {n} names
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bn-divider" />

            {/* Brand Vibes */}
            <div className="bn-field">
              <div className="bn-label-row">
                <label className="bn-label">
                  <Sparkles size={14} className="bn-label-icon" />
                  Brand Vibes
                  <span className="bn-optional">(pick any)</span>
                </label>
                {selectedVibes.length > 0 && (
                  <span className="bn-badge">{selectedVibes.length} selected</span>
                )}
              </div>
              <div className="bn-pills">
                {VIBES.map(v => (
                  <button
                    key={v}
                    className={`bn-pill ${selectedVibes.includes(v) ? "bn-pill-on" : ""}`}
                    onClick={() => toggleVibe(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="bn-divider" />

            {/* Description */}
            <div className="bn-field">
              <div className="bn-label-row">
                <label className="bn-label">
                  <AlignLeft size={14} className="bn-label-icon" />
                  Describe Your Business
                  <span className="bn-optional">(optional)</span>
                </label>
                <span className={`bn-char-count ${description.length > charMax * 0.9 ? "bn-char-warn" : ""}`}>
                  {description.length}/{charMax}
                </span>
              </div>
              <textarea
                className="bn-textarea"
                value={description}
                onChange={e => { if (e.target.value.length <= charMax) { setDescription(e.target.value); setError(""); } }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder="e.g. An AI-powered fitness app that creates personalized workout plans for busy professionals…"
                rows={3}
              />
            </div>

            <div className="bn-divider" />

            {/* Include toggles */}
            <div className="bn-field">
              <label className="bn-label">Include in Results</label>
              <div className="bn-toggles">
                {INCLUDES.map(({ key, icon, label }) => {
                  const on = stateMap[key];
                  return (
                    <button
                      key={key}
                      className={`bn-toggle-chip ${on ? "bn-chip-on" : ""}`}
                      onClick={() => setMap[key](v => !v)}
                    >
                      <span className="bn-chip-icon">{icon}</span>
                      {label}
                      {on && <Check size={12} strokeWidth={2.5} className="bn-chip-check" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bn-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <button className="bn-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="bn-spinner" /> Generating Names...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Business Names</>}
            </button>

            <p className="bn-hint">Press Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="bn-card bn-skel-card bn-animate">
              <div className="bn-skel bn-skel-short" />
              <div className="bn-skel" />
              <div className="bn-skel-blocks">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bn-skel-block">
                    <div className="bn-skel" style={{ width: "45%" }} />
                    <div className="bn-skel" />
                    <div className="bn-skel bn-skel-med" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="bn-card bn-animate">

              {/* Top bar */}
              <div className="bn-result-top">
                <div className="bn-result-meta">
                  <span className="bn-badge">
                    <Briefcase size={11} strokeWidth={2.5} />
                    {INDUSTRIES.find(i => i.id === industry)?.label}
                  </span>
                  <span className="bn-badge bn-badge-orange">
                    <Shuffle size={11} strokeWidth={2.5} />
                    {result.totalGenerated} names
                  </span>
                  {saved.length > 0 && (
                    <span className="bn-badge bn-badge-green">
                      <Star size={11} strokeWidth={2.5} />
                      {saved.length} saved
                    </span>
                  )}
                </div>

                <div className="bn-tabs">
                  {["names", "saved", "raw"].map(tab => (
                    <button
                      key={tab}
                      className={`bn-tab ${activeTab === tab ? "bn-tab-on" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === "saved" && saved.length > 0 && (
                        <span className="bn-tab-count">{saved.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="bn-actions">
                  <button className="bn-action-btn" onClick={handleReset}>
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="bn-action-btn" onClick={handleDownload}>
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`bn-copy-btn ${copied === "all" ? "bn-copied" : ""}`} onClick={handleCopy}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* ── Names Tab ── */}
              {activeTab === "names" && (
                <div className="bn-preview">
                  <div className="bn-plan-header">
                    <div className="bn-plan-title">{result.title}</div>
                    {result.summary && <p className="bn-plan-summary">{result.summary}</p>}
                  </div>

                  <div className="bn-names-list">
                    {result.names.map((n, i) => {
                      const sc = scoreColor(n.score);
                      const db = domainBadge(n.domain?.dotcom);
                      const isSaved = saved.includes(n.name);
                      return (
                        <div key={i} className={`bn-name-card${isSaved ? " bn-name-saved" : ""}`}>
                          <div className="bn-name-top">
                            <div className="bn-name-index">{i + 1}</div>
                            <div className="bn-name-main">
                              <div className="bn-name-text">{n.name}</div>
                              {n.pronunciation && (
                                <div className="bn-name-pron">/{n.pronunciation}/</div>
                              )}
                            </div>
                            <div className="bn-name-right">
                              <span
                                className="bn-score-badge"
                                style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.bd}` }}
                              >
                                <Star size={10} /> {n.score}
                              </span>
                              <button
                                className={`bn-save-btn${isSaved ? " bn-save-on" : ""}`}
                                onClick={() => toggleSave(n.name)}
                                title={isSaved ? "Unsave" : "Save this name"}
                              >
                                <Heart size={14} strokeWidth={isSaved ? 0 : 2} fill={isSaved ? "currentColor" : "none"} />
                              </button>
                            </div>
                          </div>

                          <div className="bn-name-tags">
                            <span className="bn-tag bn-tag-vibe">{n.vibe}</span>
                            <span className="bn-tag">{n.style}</span>
                            {n.domain?.dotcom && (
                              <span
                                className="bn-tag"
                                style={{ color: db.color, background: db.bg, border: `1px solid ${db.bd}` }}
                              >
                                {db.icon} .com {db.label}
                              </span>
                            )}
                            {n.domain?.alternatives?.map((ext, j) => (
                              <span key={j} className="bn-tag">{ext}</span>
                            ))}
                          </div>

                          {n.meaning && (
                            <p className="bn-name-meaning">
                              <Lightbulb size={11} strokeWidth={2} style={{ display:"inline", marginRight:4, color:"var(--bn)" }} />
                              {n.meaning}
                            </p>
                          )}

                          <p className="bn-name-why">
                            <ChevronRight size={11} strokeWidth={2.5} style={{ display:"inline", marginRight:3, color:"var(--bn)" }} />
                            {n.whyItWorks}
                          </p>

                          {n.taglines?.length > 0 && (
                            <div className="bn-taglines">
                              {n.taglines.map((tl, j) => (
                                <div key={j} className="bn-tagline">
                                  <Tag size={10} strokeWidth={2} />
                                  <span>"{tl}"</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Naming Insights */}
                  {result.namingInsights && (
                    <div className="bn-insights-block">
                      <div className="bn-block-header">
                        <Lightbulb size={13} className="bn-block-icon-orange" /> Naming Strategy Insights
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#78350f", lineHeight: 1.65 }}>{result.namingInsights}</p>
                    </div>
                  )}

                  {/* Next Steps */}
                  {result.nextSteps?.length > 0 && (
                    <div className="bn-steps-block">
                      <div className="bn-block-header">
                        <CheckCircle2 size={13} className="bn-block-icon-green" /> Next Steps
                      </div>
                      <ul className="bn-steps-list">
                        {result.nextSteps.map((step, i) => (
                          <li key={i} className="bn-step-item">{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Affirmation */}
                  {result.affirmation && (
                    <div className="bn-affirmation">
                      <Star size={13} className="bn-aff-icon" strokeWidth={2.5} />
                      <span className="bn-aff-text">"{result.affirmation}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Saved Tab ── */}
              {activeTab === "saved" && (
                <div className="bn-preview">
                  <div className="bn-plan-header">
                    <div className="bn-plan-title">Your Saved Names</div>
                    <p className="bn-plan-summary">Names you've hearted — your shortlist.</p>
                  </div>
                  {saved.length === 0 ? (
                    <div className="bn-empty-saved">
                      <Heart size={28} strokeWidth={1.5} color="var(--grey-3)" />
                      <p>No saved names yet. Heart names from the Names tab to shortlist them.</p>
                    </div>
                  ) : (
                    <div className="bn-names-list">
                      {result.names.filter(n => saved.includes(n.name)).map((n, i) => {
                        const sc = scoreColor(n.score);
                        return (
                          <div key={i} className="bn-name-card bn-name-saved">
                            <div className="bn-name-top">
                              <div className="bn-name-main">
                                <div className="bn-name-text">{n.name}</div>
                                {n.pronunciation && <div className="bn-name-pron">/{n.pronunciation}/</div>}
                              </div>
                              <div className="bn-name-right">
                                <span
                                  className="bn-score-badge"
                                  style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.bd}` }}
                                >
                                  <Star size={10} /> {n.score}
                                </span>
                                <button className="bn-save-btn bn-save-on" onClick={() => toggleSave(n.name)}>
                                  <XCircle size={14} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                            <div className="bn-name-tags">
                              <span className="bn-tag bn-tag-vibe">{n.vibe}</span>
                              <span className="bn-tag">{n.style}</span>
                            </div>
                            <p className="bn-name-why">
                              <ChevronRight size={11} strokeWidth={2.5} style={{ display:"inline", marginRight:3, color:"var(--bn)" }} />
                              {n.whyItWorks}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Raw Tab ── */}
              {activeTab === "raw" && (
                <pre className="bn-raw">{buildRawText()}</pre>
              )}

              {/* Footer */}
              <div className="bn-result-footer">
                <span className="bn-footer-count">
                  {result.names.length} names generated · {saved.length} saved
                </span>
                <button
                  className={`bn-copy-full ${copied === "all" ? "bn-copy-full-copied" : ""}`}
                  onClick={handleCopy}
                >
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Full List</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
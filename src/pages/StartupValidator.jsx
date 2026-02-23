/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./StartupValidator.css";
import { Helmet } from "react-helmet";
import {
  Rocket,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  Zap,
  Target,
  Globe,
  ChevronDown,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flame,
  Building2,
  Layers,
} from "lucide-react";

/* ── Startup Stage ── */
const STAGES = [
  { id: "idea",      label: "Just an Idea",    desc: "No validation yet"      },
  { id: "research",  label: "Researching",     desc: "Exploring the market"   },
  { id: "mvp",       label: "Building MVP",    desc: "Early product stage"    },
  { id: "launched",  label: "Launched",        desc: "In market, early users" },
];

/* ── Target Market ── */
const MARKETS = [
  { id: "b2b",       label: "B2B"              },
  { id: "b2c",       label: "B2C"              },
  { id: "b2b2c",     label: "B2B2C"            },
  { id: "marketplace",label: "Marketplace"     },
  { id: "saas",      label: "SaaS"             },
  { id: "d2c",       label: "D2C"              },
];

/* ── Industry ── */
const INDUSTRIES = [
  { id: "fintech",    label: "Fintech"         },
  { id: "healthtech", label: "Healthtech"      },
  { id: "edtech",     label: "Edtech"          },
  { id: "ecommerce",  label: "E-commerce"      },
  { id: "saas",       label: "SaaS / Dev Tools"},
  { id: "ai",         label: "AI / ML"         },
  { id: "climate",    label: "Climate Tech"    },
  { id: "proptech",   label: "Proptech"        },
  { id: "legaltech",  label: "Legaltech"       },
  { id: "hrtech",     label: "HR / Future Work"},
  { id: "food",       label: "Food & Agri"     },
  { id: "social",     label: "Social / Creator"},
];

/* ── Validation Depth ── */
const DEPTHS = [
  { id: "quick",    label: "Quick Scan",  desc: "Core signals only"       },
  { id: "standard", label: "Standard",    desc: "Full validation report"  },
  { id: "deep",     label: "Deep Dive",   desc: "Investor-grade analysis" },
];

/* ── Score color helper ── */
function scoreColor(score) {
  if (score >= 75) return "score-green";
  if (score >= 50) return "score-amber";
  return "score-red";
}

function scoreLabel(score) {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Promising";
  if (score >= 50) return "Moderate";
  if (score >= 35) return "Weak";
  return "Critical";
}

/* ── Verdict badge ── */
function VerdictBadge({ verdict }) {
  const map = {
    "GO":        { cls: "verdict-go",      icon: <CheckCircle2 size={16} strokeWidth={2.5} />, label: "GO FOR IT" },
    "CAUTION":   { cls: "verdict-caution", icon: <AlertTriangle size={16} strokeWidth={2.5} />, label: "PROCEED WITH CAUTION" },
    "PIVOT":     { cls: "verdict-pivot",   icon: <RefreshCw size={16} strokeWidth={2.5} />, label: "PIVOT RECOMMENDED" },
    "NO-GO":     { cls: "verdict-nogo",    icon: <XCircle size={16} strokeWidth={2.5} />, label: "NO-GO" },
  };
  const v = map[verdict] || map["CAUTION"];
  return (
    <div className={`sv-verdict-badge ${v.cls}`}>
      {v.icon} {v.label}
    </div>
  );
}

/* ── Score Bar ── */
function ScoreBar({ label, score, icon: Icon, delay = 0 }) {
  return (
    <div className="sv-score-row" style={{ animationDelay: `${delay}ms` }}>
      <div className="sv-score-meta">
        <span className="sv-score-label">
          {Icon && <Icon size={13} strokeWidth={2.5} />}
          {label}
        </span>
        <span className={`sv-score-num ${scoreColor(score)}`}>{score}<span className="sv-score-denom">/100</span></span>
      </div>
      <div className="sv-bar-track">
        <div
          className={`sv-bar-fill ${scoreColor(score)}`}
          style={{ "--target-width": `${score}%` }}
        />
      </div>
      <span className={`sv-score-tag ${scoreColor(score)}`}>{scoreLabel(score)}</span>
    </div>
  );
}

/* ── Component ── */
export default function StartupValidator() {
  const [ideaTitle,    setIdeaTitle]    = useState("");
  const [ideaDesc,     setIdeaDesc]     = useState("");
  const [problem,      setProblem]      = useState("");
  const [targetUser,   setTargetUser]   = useState("");
  const [revenue,      setRevenue]      = useState("");
  const [competitors,  setCompetitors]  = useState("");
  const [stage,        setStage]        = useState("idea");
  const [market,       setMarket]       = useState("b2b");
  const [industry,     setIndustry]     = useState("saas");
  const [depth,        setDepth]        = useState("standard");

  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState(null);
  const [copied,    setCopied]    = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const charMax   = 800;
  const canSubmit = ideaDesc.trim().length > 10 && !loading;

  async function handleValidate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectedStage    = STAGES.find(s => s.id === stage);
    const selectedMarket   = MARKETS.find(m => m.id === market);
    const selectedIndustry = INDUSTRIES.find(i => i.id === industry);
    const selectedDepth    = DEPTHS.find(d => d.id === depth);

    const prompt = `You are a world-class startup advisor, former YC partner, and venture capitalist with 20+ years of experience evaluating startup ideas. Perform a rigorous startup idea validation analysis.

STARTUP SUBMISSION:
- Idea Title: ${ideaTitle.trim() || "Untitled"}
- Description: ${ideaDesc.trim()}
${problem.trim()      ? `- Problem Being Solved: ${problem.trim()}`         : ""}
${targetUser.trim()   ? `- Target User: ${targetUser.trim()}`               : ""}
${revenue.trim()      ? `- Revenue / Business Model: ${revenue.trim()}`     : ""}
${competitors.trim()  ? `- Known Competitors: ${competitors.trim()}`        : ""}
- Stage: ${selectedStage?.label}
- Market Type: ${selectedMarket?.label}
- Industry: ${selectedIndustry?.label}
- Analysis Depth: ${selectedDepth?.label} — ${selectedDepth?.desc}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro, no markdown, no code fences.

Required shape:
{
  "overallScore": <number 0-100>,
  "verdict": <"GO" | "CAUTION" | "PIVOT" | "NO-GO">,
  "oneLiner": <string — a one-sentence punchy summary of this idea's potential>,
  "scores": {
    "problemStrength": <0-100>,
    "marketSize": <0-100>,
    "competition": <0-100>,
    "monetization": <0-100>,
    "timing": <0-100>,
    "execution": <0-100>
  },
  "strengths": [<string>, <string>, <string>],
  "risks": [<string>, <string>, <string>],
  "blindSpots": [<string>, <string>],
  "targetCustomer": <string — who exactly is the beachhead customer>,
  "marketSizeEstimate": <string — rough TAM/SAM/SOM in plain English>,
  "competitorSnapshot": <string — 2-3 sentences on competitive landscape>,
  "moat": <string — what could make this defensible>,
  "revenueModel": <string — recommended monetization path>,
  "nextSteps": [<string>, <string>, <string>, <string>],
  "vcPerspective": <string — 2-3 sentences as if a VC is giving blunt feedback>,
  "pivotSuggestion": <string — one alternative angle if the idea needs pivoting, or "N/A" if strong>
}

RULES:
• Be brutally honest, not encouraging just to be nice.
• Scores must reflect real startup fundamentals — don't cluster around 70.
• overallScore is NOT an average — it's your holistic gut score.
• verdict: GO (score 75+, clear path), CAUTION (score 50-74, fixable issues), PIVOT (score 30-49, core assumptions wrong), NO-GO (score <30, fundamental flaws).
• nextSteps must be specific, actionable, and ordered by priority.
• vcPerspective should be candid — what would a sharp VC actually say in the room.`;

    try {
      const res = await generateAI("startup-validator", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.overallScore || !parsed.verdict) throw new Error("Invalid response format");

      setResult(parsed);
      setActiveTab("overview");
    } catch (e) {
      setError("Validation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(type) {
    if (!result) return;
    let text = "";
    if (type === "report") {
      text = `STARTUP VALIDATION REPORT
${"═".repeat(40)}
Idea: ${ideaTitle || "Untitled"}
Overall Score: ${result.overallScore}/100 — ${result.verdict}
${result.oneLiner}

SCORES
${["Problem Strength", "Market Size", "Competition", "Monetization", "Timing", "Execution"]
  .map((l, i) => {
    const keys = ["problemStrength","marketSize","competition","monetization","timing","execution"];
    return `${l}: ${result.scores[keys[i]]}/100`;
  }).join("\n")}

STRENGTHS
${result.strengths.map(s => `• ${s}`).join("\n")}

RISKS
${result.risks.map(r => `• ${r}`).join("\n")}

BLIND SPOTS
${result.blindSpots.map(b => `• ${b}`).join("\n")}

NEXT STEPS
${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

VC PERSPECTIVE
${result.vcPerspective}

${result.pivotSuggestion !== "N/A" ? `PIVOT SUGGESTION\n${result.pivotSuggestion}` : ""}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    if (!result) return;
    const text = `STARTUP VALIDATION REPORT\n${"═".repeat(40)}\nIdea: ${ideaTitle || "Untitled"}\nOverall Score: ${result.overallScore}/100 — ${result.verdict}\n${result.oneLiner}\n\nSCORES\n${Object.entries(result.scores).map(([k, v]) => `${k}: ${v}/100`).join("\n")}\n\nSTRENGTHS\n${result.strengths.map(s => `• ${s}`).join("\n")}\n\nRISKS\n${result.risks.map(r => `• ${r}`).join("\n")}\n\nNEXT STEPS\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nVC PERSPECTIVE\n${result.vcPerspective}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "startup-validation.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setIdeaTitle(""); setIdeaDesc(""); setProblem(""); setTargetUser("");
    setRevenue(""); setCompetitors("");
    setStage("idea"); setMarket("b2b"); setIndustry("saas"); setDepth("standard");
    setResult(null); setError(""); setCopied("");
  }

  const SCORE_FIELDS = [
    { key: "problemStrength", label: "Problem Strength", icon: Target },
    { key: "marketSize",      label: "Market Size",      icon: Globe },
    { key: "competition",     label: "Competition",      icon: Shield },
    { key: "monetization",    label: "Monetization",     icon: DollarSign },
    { key: "timing",          label: "Market Timing",    icon: Zap },
    { key: "execution",       label: "Execution Fit",    icon: Flame },
  ];

  const TABS = [
    { key: "overview",   label: "Overview"      },
    { key: "scores",     label: "Score Breakdown"},
    { key: "risks",      label: "Risks & Gaps"  },
    { key: "market",     label: "Market"        },
    { key: "nextsteps",  label: "Next Steps"    },
    { key: "vc",         label: "VC Lens"       },
  ];

  return (
    <>
      <Helmet>
        <title>AI Startup Idea Validator – Get Brutal Honest Feedback | ShauryaTools</title>
        <meta name="description" content="Validate your startup idea with AI. Get scores on problem strength, market size, competition, monetization, timing and more. Free startup validator tool." />
        <meta name="keywords" content="startup idea validator, startup validation, ai startup analyzer, startup idea checker, startup feedback, idea validation tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/startup-validator" />
      </Helmet>

      <div className="sv-page">
        <div className="sv-inner">

          {/* ── Header ── */}
          <div className="sv-header">
            <div className="sv-icon">
              <Rocket size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="sv-cat">AI Startup Tools</span>
              <h1>Startup Idea Validator</h1>
              <p>Get a brutally honest, investor-grade analysis of your startup idea in seconds.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="sv-card">

            {/* Idea core */}
            <div className="sv-section-head">
              <Lightbulb size={13} strokeWidth={2.5} /> The Idea
            </div>

            <div className="sv-field">
              <label className="sv-label">Idea Title / Name</label>
              <input className="sv-input" type="text" value={ideaTitle}
                onChange={e => setIdeaTitle(e.target.value)}
                placeholder="e.g. AI-powered contract reviewer for freelancers" />
            </div>

            <div className="sv-field">
              <div className="sv-label-row">
                <label className="sv-label">Describe Your Idea <span className="sv-req">*</span></label>
                <span className={`sv-char ${ideaDesc.length > charMax * 0.9 ? "sv-char-warn" : ""}`}>
                  {ideaDesc.length}/{charMax}
                </span>
              </div>
              <textarea className="sv-textarea"
                value={ideaDesc}
                onChange={e => { if (e.target.value.length <= charMax) { setIdeaDesc(e.target.value); setError(""); } }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleValidate(); }}
                placeholder="What does your startup do? Who is it for? How does it work? Be specific — the more detail, the sharper the analysis..."
                rows={4} />
            </div>

            <div className="sv-row">
              <div className="sv-field">
                <label className="sv-label"><Target size={13} className="sv-label-icon" /> The Problem It Solves</label>
                <input className="sv-input" type="text" value={problem}
                  onChange={e => setProblem(e.target.value)}
                  placeholder="e.g. Freelancers lose $$$ signing bad contracts" />
              </div>
              <div className="sv-field">
                <label className="sv-label"><Users size={13} className="sv-label-icon" /> Target User</label>
                <input className="sv-input" type="text" value={targetUser}
                  onChange={e => setTargetUser(e.target.value)}
                  placeholder="e.g. Freelancers earning $50k–$200k/yr" />
              </div>
            </div>

            <div className="sv-row">
              <div className="sv-field">
                <label className="sv-label"><DollarSign size={13} className="sv-label-icon" /> Revenue / Business Model</label>
                <input className="sv-input" type="text" value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  placeholder="e.g. $29/mo SaaS subscription" />
              </div>
              <div className="sv-field">
                <label className="sv-label"><Building2 size={13} className="sv-label-icon" /> Known Competitors</label>
                <input className="sv-input" type="text" value={competitors}
                  onChange={e => setCompetitors(e.target.value)}
                  placeholder="e.g. DocuSign, Bonsai, HelloSign" />
              </div>
            </div>

            <div className="sv-divider" />

            {/* Context */}
            <div className="sv-section-head">
              <Layers size={13} strokeWidth={2.5} /> Context
            </div>

            {/* Stage */}
            <div className="sv-field">
              <label className="sv-label">Your Current Stage</label>
              <div className="sv-stages">
                {STAGES.map(s => (
                  <button key={s.id}
                    className={`sv-stage-btn ${stage === s.id ? "sv-stage-on" : ""}`}
                    onClick={() => setStage(s.id)}>
                    <span className="sv-stage-label">{s.label}</span>
                    <span className="sv-stage-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="sv-row sv-row-3">
              {/* Market */}
              <div className="sv-field">
                <label className="sv-label">Market Type</label>
                <div className="sv-markets">
                  {MARKETS.map(m => (
                    <button key={m.id}
                      className={`sv-market-btn ${market === m.id ? "sv-market-on" : ""}`}
                      onClick={() => setMarket(m.id)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div className="sv-field">
                <label className="sv-label">Industry</label>
                <div className="sv-select-wrap">
                  <select className="sv-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                    {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="sv-select-arrow" />
                </div>
              </div>

              {/* Depth */}
              <div className="sv-field">
                <label className="sv-label">Analysis Depth</label>
                <div className="sv-depths">
                  {DEPTHS.map(d => (
                    <button key={d.id}
                      className={`sv-depth-btn ${depth === d.id ? "sv-depth-on" : ""}`}
                      onClick={() => setDepth(d.id)}>
                      <span className="sv-depth-label">{d.label}</span>
                      <span className="sv-depth-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="sv-error">
                <AlertCircle size={14} strokeWidth={2.5} /> {error}
              </div>
            )}

            <button className="sv-gen-btn" onClick={handleValidate} disabled={!canSubmit}>
              {loading
                ? <><span className="sv-spinner" /> Analysing Idea...</>
                : <><BarChart3 size={16} strokeWidth={2} /> Validate My Idea</>}
            </button>
            <p className="sv-hint">Ctrl+Enter to validate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="sv-card sv-skeleton-card animate-in">
              <div className="sv-skel sv-skel-short" />
              {[...Array(6)].map((_, i) => <div key={i} className={`sv-skel ${i % 2 === 0 ? "sv-skel-med" : ""}`} />)}
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="sv-result-card animate-in">

              {/* ── Hero Score Panel ── */}
              <div className="sv-hero">
                <div className="sv-hero-left">
                  <div className="sv-overall-wrap">
                    <svg className="sv-dial" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" className="sv-dial-track" />
                      <circle cx="60" cy="60" r="50" className={`sv-dial-fill ${scoreColor(result.overallScore)}`}
                        style={{ "--pct": result.overallScore }} />
                    </svg>
                    <div className="sv-dial-center">
                      <span className={`sv-dial-score ${scoreColor(result.overallScore)}`}>{result.overallScore}</span>
                      <span className="sv-dial-label">/ 100</span>
                    </div>
                  </div>
                  <VerdictBadge verdict={result.verdict} />
                </div>
                <div className="sv-hero-right">
                  <h2 className="sv-idea-title">{ideaTitle || "Your Startup Idea"}</h2>
                  <p className="sv-one-liner">"{result.oneLiner}"</p>
                  <div className="sv-hero-tags">
                    <span className="sv-tag">{STAGES.find(s => s.id === stage)?.label}</span>
                    <span className="sv-tag">{MARKETS.find(m => m.id === market)?.label}</span>
                    <span className="sv-tag">{INDUSTRIES.find(i => i.id === industry)?.label}</span>
                  </div>
                  <div className="sv-hero-actions">
                    <button className="sv-action-btn" onClick={handleReset}>
                      <RefreshCw size={13} strokeWidth={2.5} /> New
                    </button>
                    <button className="sv-action-btn" onClick={handleDownload}>
                      <Download size={13} strokeWidth={2.5} /> Save
                    </button>
                    <button className={`sv-copy-btn ${copied === "report" ? "sv-copied" : ""}`} onClick={() => handleCopy("report")}>
                      {copied === "report" ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Report</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="sv-tabs-wrap">
                <div className="sv-tabs">
                  {TABS.map(tab => (
                    <button key={tab.key}
                      className={`sv-tab ${activeTab === tab.key ? "sv-tab-on" : ""}`}
                      onClick={() => setActiveTab(tab.key)}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── TAB: Overview ── */}
              {activeTab === "overview" && (
                <div className="sv-tab-content animate-in">
                  {/* Mini score grid */}
                  <div className="sv-mini-scores">
                    {SCORE_FIELDS.map(f => {
                      const s = result.scores[f.key];
                      return (
                        <div key={f.key} className={`sv-mini-card ${scoreColor(s)}`}>
                          <f.icon size={18} strokeWidth={2} className="sv-mini-icon" />
                          <span className="sv-mini-score">{s}</span>
                          <span className="sv-mini-label">{f.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strengths + Risks side by side */}
                  <div className="sv-two-col">
                    <div className="sv-list-card sv-list-green">
                      <div className="sv-list-head"><CheckCircle2 size={15} strokeWidth={2.5} /> Strengths</div>
                      <ul className="sv-list">
                        {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="sv-list-card sv-list-red">
                      <div className="sv-list-head"><AlertTriangle size={15} strokeWidth={2.5} /> Key Risks</div>
                      <ul className="sv-list">
                        {result.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Pivot suggestion */}
                  {result.pivotSuggestion && result.pivotSuggestion !== "N/A" && (
                    <div className="sv-pivot-box">
                      <div className="sv-pivot-head"><RefreshCw size={14} strokeWidth={2.5} /> Pivot Suggestion</div>
                      <p>{result.pivotSuggestion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: Score Breakdown ── */}
              {activeTab === "scores" && (
                <div className="sv-tab-content animate-in">
                  <div className="sv-score-list">
                    {SCORE_FIELDS.map((f, i) => (
                      <ScoreBar key={f.key}
                        label={f.label}
                        score={result.scores[f.key]}
                        icon={f.icon}
                        delay={i * 80} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: Risks & Gaps ── */}
              {activeTab === "risks" && (
                <div className="sv-tab-content animate-in">
                  <div className="sv-risks-section">
                    <div className="sv-risk-group">
                      <div className="sv-risk-head sv-rh-red"><AlertTriangle size={15} strokeWidth={2.5} /> Core Risks</div>
                      <div className="sv-risk-items">
                        {result.risks.map((r, i) => (
                          <div key={i} className="sv-risk-item sv-risk-red">
                            <span className="sv-risk-num">{i + 1}</span>
                            <p>{r}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="sv-risk-group">
                      <div className="sv-risk-head sv-rh-amber"><Zap size={15} strokeWidth={2.5} /> Blind Spots</div>
                      <div className="sv-risk-items">
                        {result.blindSpots.map((b, i) => (
                          <div key={i} className="sv-risk-item sv-risk-amber">
                            <span className="sv-risk-num">{i + 1}</span>
                            <p>{b}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Market ── */}
              {activeTab === "market" && (
                <div className="sv-tab-content animate-in">
                  <div className="sv-market-grid">
                    <div className="sv-market-card">
                      <div className="sv-mc-head"><Users size={15} strokeWidth={2.5} /> Target Customer</div>
                      <p>{result.targetCustomer}</p>
                    </div>
                    <div className="sv-market-card">
                      <div className="sv-mc-head"><TrendingUp size={15} strokeWidth={2.5} /> Market Size</div>
                      <p>{result.marketSizeEstimate}</p>
                    </div>
                    <div className="sv-market-card">
                      <div className="sv-mc-head"><Building2 size={15} strokeWidth={2.5} /> Competitive Landscape</div>
                      <p>{result.competitorSnapshot}</p>
                    </div>
                    <div className="sv-market-card">
                      <div className="sv-mc-head"><Shield size={15} strokeWidth={2.5} /> Moat / Defensibility</div>
                      <p>{result.moat}</p>
                    </div>
                    <div className="sv-market-card sv-market-card-wide">
                      <div className="sv-mc-head"><DollarSign size={15} strokeWidth={2.5} /> Revenue Model</div>
                      <p>{result.revenueModel}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: Next Steps ── */}
              {activeTab === "nextsteps" && (
                <div className="sv-tab-content animate-in">
                  <div className="sv-steps">
                    {result.nextSteps.map((step, i) => (
                      <div key={i} className="sv-step">
                        <div className="sv-step-num">{i + 1}</div>
                        <p className="sv-step-text">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: VC Lens ── */}
              {activeTab === "vc" && (
                <div className="sv-tab-content animate-in">
                  <div className="sv-vc-card">
                    <div className="sv-vc-avatar">
                      <Sparkles size={20} strokeWidth={2} />
                    </div>
                    <div className="sv-vc-bubble">
                      <div className="sv-vc-label">VC Partner Perspective</div>
                      <p className="sv-vc-text">"{result.vcPerspective}"</p>
                    </div>
                  </div>
                  {result.pivotSuggestion && result.pivotSuggestion !== "N/A" && (
                    <div className="sv-pivot-box sv-pivot-vc">
                      <div className="sv-pivot-head"><RefreshCw size={14} strokeWidth={2.5} /> If They Said "Interesting, but…"</div>
                      <p>{result.pivotSuggestion}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
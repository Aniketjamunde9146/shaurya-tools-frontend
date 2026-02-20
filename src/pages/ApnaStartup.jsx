import { useState } from "react";
import { Helmet } from "react-helmet";
import "./ApnaStartup.css";
import {
  Rocket, Sparkles, Brain, LayoutGrid, TrendingUp, AlertTriangle,
  Map, Code2, Calendar, FolderTree, DollarSign, CheckCircle2, XCircle,
  RefreshCw, Download, Copy, Check, Lightbulb, ChevronRight, Zap,
  Target, Shield, Clock, BarChart3, Layers, Globe, Smartphone,
  ShoppingCart, CreditCard, GraduationCap, Heart, Gamepad2, Cpu,
  BookOpen, Users, TrendingDown, Star, ThumbsUp, ThumbsDown
} from "lucide-react";
import { generateAI } from "../api"; // ✅ Uses your existing API helper — no CORS

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/apna-startup`;

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: "ai",      label: "AI / ML",       Icon: Cpu          },
  { id: "saas",    label: "SaaS",          Icon: LayoutGrid   },
  { id: "app",     label: "Mobile App",    Icon: Smartphone   },
  { id: "web",     label: "Web Platform",  Icon: Globe        },
  { id: "ecomm",   label: "E-Commerce",    Icon: ShoppingCart },
  { id: "fintech", label: "FinTech",       Icon: CreditCard   },
  { id: "edtech",  label: "EdTech",        Icon: GraduationCap},
  { id: "health",  label: "HealthTech",    Icon: Heart        },
  { id: "game",    label: "Gaming",        Icon: Gamepad2     },
  { id: "other",   label: "Other",         Icon: Lightbulb    },
];

const SECTIONS = [
  { id: "market",      label: "Market Analysis",  Icon: TrendingUp,    def: true  },
  { id: "competitors", label: "Competitors",      Icon: Target,        def: true  },
  { id: "techstack",   label: "Tech Stack",       Icon: Code2,         def: true  },
  { id: "mvp",         label: "MVP Features",     Icon: Zap,           def: true  },
  { id: "folder",      label: "Folder Structure", Icon: FolderTree,    def: true  },
  { id: "routine",     label: "Daily Routine",    Icon: Calendar,      def: true  },
  { id: "revenue",     label: "Revenue Model",    Icon: DollarSign,    def: false },
  { id: "risks",       label: "Risks",            Icon: AlertTriangle, def: false },
  { id: "roadmap",     label: "6-Month Roadmap",  Icon: Map,           def: false },
  { id: "hiring",      label: "Hiring Plan",      Icon: Users,         def: false },
  { id: "pitchdeck",   label: "Pitch Outline",    Icon: Star,          def: false },
];

const TABS = [
  { id: "overview", label: "Overview",   Icon: BarChart3  },
  { id: "tech",     label: "Tech Stack", Icon: Code2      },
  { id: "mvp",      label: "MVP Plan",   Icon: Zap        },
  { id: "routine",  label: "Routine",    Icon: Calendar   },
  { id: "folder",   label: "Structure",  Icon: FolderTree },
  { id: "hiring",   label: "Hiring",     Icon: Users      },
  { id: "pitch",    label: "Pitch",      Icon: Star       },
];

const HISTORY_KEY = "apna_startup_history";

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function scoreClass(n) {
  if (n >= 75) return "high";
  if (n >= 50) return "mid";
  return "low";
}

function fmtKey(k) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim();
}

function saveToHistory(idea, category, result) {
  try {
    const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const entry = {
      id: Date.now(),
      idea: idea.slice(0, 80),
      category,
      name: result.name,
      score: result.score,
      tagline: result.tagline,
      savedAt: new Date().toISOString(),
    };
    const updated = [entry, ...prev].slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

function buildPrompt(idea, category, stage, sections) {
  const catLabel = CATEGORIES.find(c => c.id === category)?.label || category;
  const sel = SECTIONS.filter(s => sections.has(s.id)).map(s => s.label);

  return `You are an elite startup advisor, ex-YC partner, and veteran CTO. Analyze this startup idea with brutal honesty and deep domain expertise.

STARTUP IDEA: "${idea.trim()}"
CATEGORY: ${catLabel}
CURRENT STAGE: ${stage}
REQUESTED SECTIONS: ${sel.join(", ")}

Return ONLY a raw JSON object. No markdown, no backticks, no extra text. Use this exact structure:

{
  "name": "Creative memorable startup name",
  "tagline": "Sharp one-liner value proposition",
  "score": 72,
  "scoreBreakdown": {
    "marketDemand": 80,
    "competition": 60,
    "techFeasibility": 85,
    "monetization": 70,
    "timing": 75
  },
  "verdict": "2-3 sentence honest verdict mentioning real market conditions and specific challenges.",
  "topAdvice": ["Specific actionable advice 1", "Specific actionable advice 2", "Specific actionable advice 3"],
  "prosAndCons": {
    "pros": ["Genuine strength 1", "Genuine strength 2", "Genuine strength 3"],
    "cons": ["Real weakness 1", "Real weakness 2", "Real weakness 3"]
  },
  ${sections.has("market") ? `"market": {
    "size": "$X.XB TAM",
    "growth": "XX% CAGR",
    "targetUsers": "Precise user persona description",
    "painPoint": "The core problem being solved",
    "insights": ["Real market insight with data", "Second key insight", "Third insight"]
  },` : ""}
  ${sections.has("competitors") ? `"competitors": [
    { "name": "Real Competitor 1", "strength": "What they genuinely do well", "weakness": "Their real gap" },
    { "name": "Real Competitor 2", "strength": "What they genuinely do well", "weakness": "Their real gap" },
    { "name": "Real Competitor 3", "strength": "What they genuinely do well", "weakness": "Their real gap" }
  ],` : ""}
  ${sections.has("techstack") ? `"techstack": {
    "frontend": ["React", "TypeScript"],
    "backend": ["Node.js"],
    "database": ["PostgreSQL"],
    "devops": ["Docker", "Vercel"],
    "ai_ml": ["OpenAI API"],
    "why": "Brief justification tailored to this specific product"
  },` : ""}
  ${sections.has("mvp") ? `"mvp": {
    "timeline": "X-Y weeks",
    "coreFeatures": [
      { "feature": "Feature 1", "why": "Why this is essential for MVP", "effort": "Low" },
      { "feature": "Feature 2", "why": "Why this is essential for MVP", "effort": "Medium" },
      { "feature": "Feature 3", "why": "Why this is essential for MVP", "effort": "High" },
      { "feature": "Feature 4", "why": "Why this is essential for MVP", "effort": "Medium" }
    ],
    "skipForNow": ["Premature feature 1", "Premature feature 2", "Premature feature 3"]
  },` : ""}
  ${sections.has("folder") ? `"folderStructure": "Realistic file tree with real filenames specific to this product type. Use tree-style formatting.",` : ""}
  ${sections.has("routine") ? `"dailyRoutine": [
    { "time": "6:30 AM", "task": "Task tailored to this startup", "category": "health" },
    { "time": "7:30 AM", "task": "Task tailored to this startup", "category": "work" },
    { "time": "9:00 AM", "task": "Task tailored to this startup", "category": "work" },
    { "time": "11:00 AM", "task": "Task tailored to this startup", "category": "work" },
    { "time": "1:00 PM", "task": "Task tailored to this startup", "category": "health" },
    { "time": "2:00 PM", "task": "Task tailored to this startup", "category": "work" },
    { "time": "4:00 PM", "task": "Task tailored to this startup", "category": "learning" },
    { "time": "6:00 PM", "task": "Task tailored to this startup", "category": "work" },
    { "time": "8:00 PM", "task": "Task tailored to this startup", "category": "learning" },
    { "time": "10:00 PM", "task": "Wind down and review tomorrow plan", "category": "health" }
  ],` : ""}
  ${sections.has("revenue") ? `"revenue": {
    "primaryModel": "Primary revenue model name",
    "tiers": [
      { "name": "Free",       "price": "$0/mo",   "features": ["feature1", "feature2"] },
      { "name": "Pro",        "price": "$X/mo",   "features": ["feature1", "feature2", "feature3"] },
      { "name": "Enterprise", "price": "Custom",  "features": ["feature1", "feature2", "feature3", "feature4"] }
    ],
    "breakeven": "X months"
  },` : ""}
  ${sections.has("risks") ? `"risks": [
    { "risk": "Specific real risk",       "severity": "High",   "mitigation": "Concrete mitigation strategy" },
    { "risk": "Specific real risk",       "severity": "Medium", "mitigation": "Concrete mitigation strategy" },
    { "risk": "Specific real risk",       "severity": "Low",    "mitigation": "Concrete mitigation strategy" }
  ],` : ""}
  ${sections.has("roadmap") ? `"roadmap": [
    { "month": "Month 1-2", "phase": "Foundation", "goals": ["goal1", "goal2", "goal3"] },
    { "month": "Month 3-4", "phase": "Launch",     "goals": ["goal1", "goal2", "goal3"] },
    { "month": "Month 5-6", "phase": "Growth",     "goals": ["goal1", "goal2", "goal3"] }
  ],` : ""}
  ${sections.has("hiring") ? `"hiring": [
    { "role": "First hire role", "when": "Month X", "why": "Why this role is critical first", "salary": "$XX-XXK" },
    { "role": "Second hire role", "when": "Month X", "why": "Why this role next", "salary": "$XX-XXK" },
    { "role": "Third hire role", "when": "Month X", "why": "Why this role", "salary": "$XX-XXK" }
  ],` : ""}
  ${sections.has("pitchdeck") ? `"pitchdeck": {
    "hook": "One powerful opening sentence to grab investors",
    "problem": "The problem statement (2 sentences)",
    "solution": "Your solution (2 sentences)",
    "traction": "What traction/proof points to mention",
    "ask": "How much you are raising and for what",
    "slides": ["Slide 1 title: content hint", "Slide 2 title: content hint", "Slide 3 title: content hint", "Slide 4 title: content hint", "Slide 5 title: content hint", "Slide 6 title: content hint", "Slide 7 title: content hint", "Slide 8 title: content hint"]
  },` : ""}
  "_v": 1
}

Rules: Use REAL competitor names. Give REAL market sizes. Give REAL tech choices for this domain. Be brutally honest. If the idea is weak or oversaturated, say so. Make folder structure genuinely relevant to the product.`;
}

/* ─── Markdown export ────────────────────────────────────────────────────────── */
function generateMarkdown(r, sections) {
  let md = `# ${r.name}\n\n> ${r.tagline}\n\n## Viability Score: ${r.score}/100\n\n${r.verdict}\n\n`;
  if (r.topAdvice) md += `## Top Advice\n${r.topAdvice.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n`;
  if (r.prosAndCons) {
    md += `## Pros & Cons\n### ✅ Pros\n${r.prosAndCons.pros?.map(p => `- ${p}`).join("\n")}\n\n### ❌ Cons\n${r.prosAndCons.cons?.map(c => `- ${c}`).join("\n")}\n\n`;
  }
  if (sections.has("market") && r.market) {
    md += `## Market\n- **Size**: ${r.market.size}\n- **Growth**: ${r.market.growth}\n- **Target Users**: ${r.market.targetUsers}\n- **Pain Point**: ${r.market.painPoint}\n\n`;
    r.market.insights?.forEach(i => { md += `- ${i}\n`; });
    md += "\n";
  }
  if (sections.has("competitors") && r.competitors) {
    md += `## Competitors\n`;
    r.competitors.forEach(c => { md += `### ${c.name}\n- ✓ ${c.strength}\n- ✗ ${c.weakness}\n\n`; });
  }
  if (sections.has("techstack") && r.techstack) {
    md += `## Tech Stack\n${r.techstack.why}\n\n`;
    ["frontend","backend","database","devops","ai_ml"].forEach(k => {
      if (r.techstack[k]?.length) md += `- **${fmtKey(k)}**: ${r.techstack[k].join(", ")}\n`;
    });
    md += "\n";
  }
  if (sections.has("mvp") && r.mvp) {
    md += `## MVP Plan (${r.mvp.timeline})\n`;
    r.mvp.coreFeatures?.forEach(f => { md += `- **${f.feature}** [${f.effort}]: ${f.why}\n`; });
    if (r.mvp.skipForNow?.length) { md += `\n### Skip for Now\n`; r.mvp.skipForNow.forEach(s => { md += `- ${s}\n`; }); }
    md += "\n";
  }
  if (sections.has("folder") && r.folderStructure) md += `## Folder Structure\n\`\`\`\n${r.folderStructure}\n\`\`\`\n\n`;
  if (sections.has("routine") && r.dailyRoutine) {
    md += `## Founder Daily Routine\n`;
    r.dailyRoutine.forEach(item => { md += `- **${item.time}** — ${item.task}\n`; });
    md += "\n";
  }
  if (sections.has("revenue") && r.revenue) {
    md += `## Revenue Model\n**${r.revenue.primaryModel}** · Break-even: ${r.revenue.breakeven}\n\n`;
    r.revenue.tiers?.forEach(t => { md += `### ${t.name} — ${t.price}\n${t.features?.map(f => `- ${f}`).join("\n")}\n\n`; });
  }
  if (sections.has("risks") && r.risks) {
    md += `## Risks\n`;
    r.risks.forEach(r2 => { md += `### [${r2.severity}] ${r2.risk}\n🛡 ${r2.mitigation}\n\n`; });
  }
  if (sections.has("roadmap") && r.roadmap) {
    md += `## 6-Month Roadmap\n`;
    r.roadmap.forEach(p => { md += `### ${p.month} — ${p.phase}\n${p.goals?.map(g => `- ${g}`).join("\n")}\n\n`; });
  }
  if (sections.has("hiring") && r.hiring) {
    md += `## Hiring Plan\n`;
    r.hiring.forEach(h => { md += `### ${h.role} — ${h.when}\n- 💰 ${h.salary}\n- ${h.why}\n\n`; });
  }
  if (sections.has("pitchdeck") && r.pitchdeck) {
    md += `## Pitch Outline\n**Hook:** ${r.pitchdeck.hook}\n\n**Problem:** ${r.pitchdeck.problem}\n\n**Solution:** ${r.pitchdeck.solution}\n\n**Traction:** ${r.pitchdeck.traction}\n\n**Ask:** ${r.pitchdeck.ask}\n\n### Slides\n`;
    r.pitchdeck.slides?.forEach((s, i) => { md += `${i + 1}. ${s}\n`; });
    md += "\n";
  }
  return md;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function ApnaStartup() {
  const [idea,       setIdea]       = useState("");
  const [category,   setCategory]   = useState("");
  const [stage,      setStage]      = useState("idea");
  const [sections,   setSections]   = useState(new Set(SECTIONS.filter(s => s.def).map(s => s.id)));
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [result,     setResult]     = useState(null);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [copied,     setCopied]     = useState(false);
  const [history,    setHistory]    = useState(getHistory());
  const [showHistory,setShowHistory]= useState(false);
  const [feedback,   setFeedback]   = useState(null); // "up" | "down" | null

  const ideaOk = idea.trim().length >= 20;

  const toggleSection = id => setSections(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  /* ── Analyze ── */
  async function analyze() {
    if (!ideaOk)        { setError("Please describe your idea in more detail (at least 20 characters)."); return; }
    if (!category)      { setError("Please select a category for your startup."); return; }
    if (!sections.size) { setError("Select at least one analysis section."); return; }

    setLoading(true); setError(""); setResult(null); setFeedback(null);

    try {
      const prompt = buildPrompt(idea, category, stage, sections);

      // ✅ Uses the same generateAI() helper as ReadmeGenerator — no CORS issue
      const res = await generateAI("startup", prompt);

      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();
      raw = raw.replace(/,(\s*[}\]])/g, "$1");
      const parsed = JSON.parse(raw);

      setResult(parsed);
      setActiveTab("overview");
      saveToHistory(idea, category, parsed);
      setHistory(getHistory());
    } catch {
      setError("Analysis failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Copy / Download / Reset ── */
  function copyJSON() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMD() {
    if (!result) return;
    const blob = new Blob([generateMarkdown(result, sections)], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(result.name || "startup").toLowerCase().replace(/\s+/g, "-")}-analysis.md`;
    a.click();
  }

  function reset() {
    setIdea(""); setCategory(""); setStage("idea");
    setResult(null); setError(""); setFeedback(null);
    setSections(new Set(SECTIONS.filter(s => s.def).map(s => s.id)));
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setShowHistory(false);
  }

  /* ── Visible tabs ── */
  const visibleTabs = TABS.filter(t => {
    if (t.id === "overview") return true;
    if (t.id === "tech")     return !!result?.techstack;
    if (t.id === "mvp")      return !!result?.mvp;
    if (t.id === "routine")  return !!result?.dailyRoutine;
    if (t.id === "folder")   return !!result?.folderStructure;
    if (t.id === "hiring")   return !!result?.hiring;
    if (t.id === "pitch")    return !!result?.pitchdeck;
    return false;
  });

  const taClass = `as-textarea${idea.length === 0 ? "" : ideaOk ? " ok" : " warn"}`;

  /* ───────────────────────────────────────────────────────────────────────── */
  return (
    <>
      <Helmet>
        <title>ApnaStartup – AI Startup Analyzer & Advisor | ShauryaTools</title>
        <meta
          name="description"
          content="Get AI-powered startup analysis in minutes. Market research, competitor analysis, tech stack, MVP plan, pitch deck outline & more. Free startup advisor tool."
        />
        <meta
          name="keywords"
          content="startup analyzer, startup advisor, business plan generator, AI startup, market analysis, startup idea validation, tech stack recommendation, MVP planning"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="ApnaStartup – AI Startup Analyzer & Advisor" />
        <meta property="og:description" content="Analyze your startup idea with AI. Get market data, competitors, tech stack, MVP plan, hiring roadmap & pitch outline." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ApnaStartup – Free AI Startup Advisor" />
        <meta name="twitter:description" content="Validate your startup idea with AI analysis. Market research, competitors, tech recommendations & more." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "ApnaStartup",
            "url": PAGE_URL,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "All",
            "description": "Free AI-powered startup analyzer & advisor. Get comprehensive startup analysis including market research, competitor analysis, tech stack recommendations, MVP planning, and pitch deck outlines.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="as-page">
        <div className="as-inner">

          {/* ── Header ── */}
          <div className="as-header">
            <div className="as-icon">
              <Rocket size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <span className="as-badge">AI Startup Advisor</span>
              <h1>ApnaStartup</h1>
              <p>Describe your idea — get a full AI-powered breakdown: market data, competitors, tech stack, MVP plan &amp; more.</p>
            </div>
            {history.length > 0 && (
              <button className="as-history-btn" onClick={() => setShowHistory(v => !v)}>
                <BookOpen size={14} />
                History ({history.length})
              </button>
            )}
          </div>

          {/* ── History Panel ── */}
          {showHistory && history.length > 0 && (
            <div className="as-history-panel animate-in">
              <div className="as-history-head">
                <span className="as-history-title"><BookOpen size={13} /> Recent Analyses</span>
                <button className="as-text-btn muted" onClick={clearHistory}>Clear all</button>
              </div>
              {history.map(h => (
                <div key={h.id} className="as-history-item">
                  <div className="as-history-meta">
                    <span className="as-history-name">{h.name}</span>
                    <span className={`as-history-score ${scoreClass(h.score)}`}>{h.score}/100</span>
                  </div>
                  <p className="as-history-idea">{h.idea}{h.idea.length >= 80 ? "…" : ""}</p>
                  <span className="as-history-cat">{CATEGORIES.find(c => c.id === h.category)?.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Input Card ── */}
          <div className="as-card">

            {/* Idea */}
            <div className="as-field">
              <div className="as-label-row">
                <span className="as-label"><Brain size={12} /> Your Startup Idea</span>
                {idea.length > 0 && (
                  <span className={`as-char-status ${ideaOk ? "as-char-ok" : "as-char-warn"}`}>
                    {ideaOk ? "✓ Ready to analyze" : `${idea.length} chars — add more detail`}
                  </span>
                )}
              </div>
              <textarea
                className={taClass}
                value={idea}
                onChange={e => { setIdea(e.target.value); setError(""); }}
                placeholder="e.g. A platform that helps freelance developers in India find international clients by auto-translating their portfolio, matching them with projects, and handling contracts + payments via UPI integration..."
                rows={4}
              />
            </div>

            <div className="as-divider" />

            {/* Category */}
            <div className="as-field">
              <span className="as-label"><LayoutGrid size={12} /> Category</span>
              <div className="as-categories">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    className={`as-cat-btn${category === c.id ? " active" : ""}`}
                    onClick={() => { setCategory(c.id); setError(""); }}
                  >
                    <c.Icon size={12} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="as-divider" />

            {/* Stage */}
            <div className="as-field">
              <span className="as-label"><Target size={12} /> Current Stage</span>
              <div className="as-stages">
                {[
                  { id: "idea",     label: "Just an Idea",  desc: "Nothing built yet"     },
                  { id: "mvp",      label: "Building MVP",  desc: "In active development" },
                  { id: "launched", label: "Launched",      desc: "Have real users"        },
                ].map(s => (
                  <button
                    key={s.id}
                    className={`as-stage-btn${stage === s.id ? " active" : ""}`}
                    onClick={() => setStage(s.id)}
                  >
                    <span className="as-stage-label">{s.label}</span>
                    <span className="as-stage-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="as-divider" />

            {/* Sections */}
            <div className="as-field">
              <div className="as-label-row">
                <span className="as-label"><Layers size={12} /> Include in Analysis</span>
                <div className="as-sec-actions">
                  <button className="as-text-btn" onClick={() => setSections(new Set(SECTIONS.map(s => s.id)))}>All</button>
                  <span style={{ color: "var(--grey-3)" }}>·</span>
                  <button className="as-text-btn muted" onClick={() => setSections(new Set())}>None</button>
                </div>
              </div>
              <div className="as-sections">
                {SECTIONS.map(s => (
                  <button
                    key={s.id}
                    className={`as-sec-btn${sections.has(s.id) ? " active" : ""}`}
                    onClick={() => toggleSection(s.id)}
                  >
                    {sections.has(s.id) ? <Check size={10} /> : <s.Icon size={10} />}
                    {s.label}
                  </button>
                ))}
              </div>
              <span className="as-hint">
                {sections.size === 0
                  ? "⚠ Select at least one section"
                  : `${sections.size} of ${SECTIONS.length} sections selected`}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="as-error">
                <AlertTriangle size={13} />
                {error}
              </div>
            )}

            {/* Analyze button */}
            <button
              className="as-analyze-btn"
              onClick={analyze}
              disabled={loading || !ideaOk || !category || sections.size === 0}
            >
              {loading
                ? <><span className="as-spinner" /> Analyzing with AI...</>
                : <><Sparkles size={15} /> Analyze My Startup</>
              }
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="as-card animate-in" style={{ gap: 12 }}>
              <div className="as-skel" style={{ height: 22, width: "42%" }} />
              <div className="as-skel" style={{ height: 82 }} />
              <div className="as-skel" style={{ height: 14 }} />
              <div className="as-skel" style={{ height: 14, width: "68%" }} />
              <div className="as-skel" style={{ height: 52 }} />
            </div>
          )}

          {/* ── Results ── */}
          {result && !loading && (
            <div className="as-results animate-in">

              {/* Score Banner */}
              <div className="as-score-banner">
                <div className="as-score-left">
                  <div className="as-score-ring">
                    <svg className="as-ring-svg" viewBox="0 0 36 36">
                      <path className="as-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path
                        className={`as-ring-fill ${scoreClass(result.score)}`}
                        strokeDasharray={`${result.score}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="as-score-num">{result.score}</span>
                  </div>
                  <div className="as-score-info">
                    <h2 className="as-startup-name">{result.name}</h2>
                    <p className="as-tagline">{result.tagline}</p>
                    <p className="as-verdict">{result.verdict}</p>
                  </div>
                </div>

                {result.scoreBreakdown && (
                  <div className="as-score-bars">
                    {Object.entries(result.scoreBreakdown).map(([k, v]) => (
                      <div key={k} className="as-bar-row">
                        <span className="as-bar-label">{fmtKey(k)}</span>
                        <div className="as-bar-track">
                          <div className={`as-bar-fill ${scoreClass(v)}`} style={{ width: `${v}%` }} />
                        </div>
                        <span className="as-bar-val">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pros & Cons strip */}
              {result.prosAndCons && (
                <div className="as-pros-cons">
                  <div className="as-pros">
                    <div className="as-pc-head"><ThumbsUp size={13} /> Strengths</div>
                    {result.prosAndCons.pros?.map((p, i) => (
                      <div key={i} className="as-pc-item pro"><CheckCircle2 size={11} />{p}</div>
                    ))}
                  </div>
                  <div className="as-cons">
                    <div className="as-pc-head"><ThumbsDown size={13} /> Weaknesses</div>
                    {result.prosAndCons.cons?.map((c, i) => (
                      <div key={i} className="as-pc-item con"><XCircle size={11} />{c}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice strip */}
              {result.topAdvice && (
                <div className="as-advice-strip">
                  <div className="as-advice-icon"><Lightbulb size={16} /></div>
                  <div className="as-advice-list">
                    {result.topAdvice.map((tip, i) => (
                      <div key={i} className="as-advice-item">
                        <span className="as-advice-num">{i + 1}</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabbed result card */}
              <div className="as-result-card">
                <div className="as-result-top">
                  <div className="as-tabs">
                    {visibleTabs.map(t => (
                      <button
                        key={t.id}
                        className={`as-tab${activeTab === t.id ? " active" : ""}`}
                        onClick={() => setActiveTab(t.id)}
                      >
                        <t.Icon size={12} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="as-actions">
                    <button className="as-action-btn" onClick={reset}><RefreshCw size={13} /> New</button>
                    <button className="as-action-btn" onClick={downloadMD}><Download size={13} /> Export</button>
                    <button className={`as-copy-btn${copied ? " copied" : ""}`} onClick={copyJSON}>
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> JSON</>}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="as-tab-content">

                  {/* ── Overview ── */}
                  {activeTab === "overview" && (
                    <>
                      {result.market && (
                        <div>
                          <div className="as-section-title"><TrendingUp size={14} /> Market Analysis</div>
                          <div className="as-market-grid">
                            {[
                              ["Market Size",    result.market.size],
                              ["Growth Rate",    result.market.growth],
                              ["Target Users",   result.market.targetUsers],
                              ["Core Pain Point",result.market.painPoint],
                            ].map(([l, v]) => (
                              <div key={l} className="as-market-stat">
                                <span className="as-stat-label">{l}</span>
                                <span className={`as-stat-val${l === "Growth Rate" ? " as-stat-green" : ""}`}>{v}</span>
                              </div>
                            ))}
                          </div>
                          {result.market.insights && (
                            <div className="as-insights">
                              {result.market.insights.map((ins, i) => (
                                <div key={i} className="as-insight-item">
                                  <ChevronRight size={13} style={{ flexShrink: 0, marginTop: 2, color: "var(--blue)" }} />
                                  {ins}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {result.competitors && (
                        <div>
                          <div className="as-section-title"><Target size={14} /> Competitors</div>
                          <div className="as-comp-list">
                            {result.competitors.map((c, i) => (
                              <div key={i} className="as-comp-card">
                                <div className="as-comp-name">{c.name}</div>
                                <div className="as-comp-row">
                                  <span className="as-comp-tag strong"><CheckCircle2 size={10} /> {c.strength}</span>
                                  <span className="as-comp-tag weak"><XCircle size={10} /> {c.weakness}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.revenue && (
                        <div>
                          <div className="as-section-title"><DollarSign size={14} /> Revenue Model</div>
                          <p className="as-rev-meta">
                            <strong>{result.revenue.primaryModel}</strong> · Break-even: {result.revenue.breakeven}
                          </p>
                          <div className="as-tiers">
                            {result.revenue.tiers?.map((t, i) => (
                              <div key={i} className="as-tier">
                                <div className="as-tier-head">
                                  <span className="as-tier-name">{t.name}</span>
                                  <span className="as-tier-price">{t.price}</span>
                                </div>
                                <ul className="as-tier-features">
                                  {t.features?.map((f, j) => <li key={j}>{f}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.risks && (
                        <div>
                          <div className="as-section-title"><Shield size={14} /> Risks &amp; Challenges</div>
                          <div className="as-risks">
                            {result.risks.map((r, i) => (
                              <div key={i} className={`as-risk-item ${r.severity?.toLowerCase()}`}>
                                <div className="as-risk-head">
                                  <span className={`as-risk-badge ${r.severity?.toLowerCase()}`}>{r.severity}</span>
                                  <span className="as-risk-text">{r.risk}</span>
                                </div>
                                <p className="as-risk-mit">🛡 {r.mitigation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.roadmap && (
                        <div>
                          <div className="as-section-title"><Map size={14} /> 6-Month Roadmap</div>
                          <div className="as-roadmap">
                            {result.roadmap.map((p, i) => (
                              <div key={i} className="as-phase">
                                <div className="as-phase-head">
                                  <span className="as-phase-month">{p.month}</span>
                                  <span className="as-phase-name">{p.phase}</span>
                                </div>
                                <ul className="as-phase-goals">
                                  {p.goals?.map((g, j) => <li key={j}>{g}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Tech Stack ── */}
                  {activeTab === "tech" && result.techstack && (
                    <div>
                      <div className="as-section-title"><Code2 size={14} /> Tech Stack</div>
                      <div className="as-tech-why">
                        <Lightbulb size={13} style={{ flexShrink: 0, marginTop: 2, color: "var(--indigo)" }} />
                        {result.techstack.why}
                      </div>
                      <div className="as-tech-grid">
                        {[
                          ["frontend", "🎨", "Frontend"],
                          ["backend",  "⚙️", "Backend" ],
                          ["database", "🗄️", "Database"],
                          ["devops",   "🚀", "DevOps"  ],
                          ["ai_ml",    "🤖", "AI / ML" ],
                        ].filter(([k]) => result.techstack[k]?.length).map(([k, em, label]) => (
                          <div key={k} className="as-tech-group">
                            <div className="as-tech-group-head">{em} {label}</div>
                            <div className="as-tech-chips">
                              {result.techstack[k].map((t, i) => (
                                <span key={i} className="as-tech-chip">{t}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── MVP ── */}
                  {activeTab === "mvp" && result.mvp && (
                    <div>
                      <div className="as-section-title"><Zap size={14} /> MVP Plan</div>
                      <div className="as-mvp-meta">
                        <Clock size={13} />
                        Estimated timeline: <strong>{result.mvp.timeline}</strong>
                      </div>
                      <div className="as-sub-head">Core Features to Build</div>
                      <div className="as-mvp-features">
                        {result.mvp.coreFeatures?.map((f, i) => (
                          <div key={i} className="as-mvp-feature">
                            <div className="as-mvp-feature-head">
                              <span className="as-mvp-feature-name">{f.feature}</span>
                              <span className={`as-effort ${f.effort?.toLowerCase()}`}>{f.effort}</span>
                            </div>
                            <p className="as-mvp-feature-why">{f.why}</p>
                          </div>
                        ))}
                      </div>
                      {result.mvp.skipForNow?.length > 0 && (
                        <>
                          <div className="as-sub-head muted">Skip for Now (v2+)</div>
                          <div className="as-skip-list">
                            {result.mvp.skipForNow.map((s, i) => (
                              <span key={i} className="as-skip-item">{s}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Daily Routine ── */}
                  {activeTab === "routine" && result.dailyRoutine && (
                    <div>
                      <div className="as-section-title"><Calendar size={14} /> Founder Daily Routine</div>
                      <p className="as-routine-intro">
                        Your AI-optimized daily schedule tailored for building <strong>{result.name}</strong>.
                      </p>
                      <div className="as-routine-list">
                        {result.dailyRoutine.map((item, i) => (
                          <div key={i} className={`as-routine-item ${item.category}`}>
                            <span className="as-routine-time">{item.time}</span>
                            <span className="as-routine-task">{item.task}</span>
                            <span className="as-routine-cat">{item.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Folder Structure ── */}
                  {activeTab === "folder" && result.folderStructure && (
                    <div>
                      <div className="as-section-title"><FolderTree size={14} /> Project Structure</div>
                      <pre className="as-folder-tree">{result.folderStructure}</pre>
                    </div>
                  )}

                  {/* ── Hiring Plan ── */}
                  {activeTab === "hiring" && result.hiring && (
                    <div>
                      <div className="as-section-title"><Users size={14} /> Hiring Plan</div>
                      <div className="as-hiring-list">
                        {result.hiring.map((h, i) => (
                          <div key={i} className="as-hire-card">
                            <div className="as-hire-head">
                              <span className="as-hire-role">{h.role}</span>
                              <span className="as-hire-when">{h.when}</span>
                            </div>
                            <div className="as-hire-salary">{h.salary}</div>
                            <p className="as-hire-why">{h.why}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Pitch Deck ── */}
                  {activeTab === "pitch" && result.pitchdeck && (
                    <div>
                      <div className="as-section-title"><Star size={14} /> Pitch Deck Outline</div>
                      <div className="as-pitch-highlights">
                        {[
                          ["🎯 Hook",     result.pitchdeck.hook],
                          ["❗ Problem",  result.pitchdeck.problem],
                          ["💡 Solution", result.pitchdeck.solution],
                          ["📈 Traction", result.pitchdeck.traction],
                          ["💰 Ask",      result.pitchdeck.ask],
                        ].map(([label, val]) => val && (
                          <div key={label} className="as-pitch-block">
                            <div className="as-pitch-label">{label}</div>
                            <p className="as-pitch-val">{val}</p>
                          </div>
                        ))}
                      </div>
                      {result.pitchdeck.slides?.length > 0 && (
                        <>
                          <div className="as-sub-head" style={{ marginTop: 20 }}>Slide Structure</div>
                          <div className="as-slides-list">
                            {result.pitchdeck.slides.map((s, i) => (
                              <div key={i} className="as-slide-item">
                                <span className="as-slide-num">{i + 1}</span>
                                <span className="as-slide-text">{s}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Feedback */}
              <div className="as-feedback">
                <span className="as-feedback-label">Was this analysis helpful?</span>
                <button
                  className={`as-fb-btn${feedback === "up" ? " active-up" : ""}`}
                  onClick={() => setFeedback(feedback === "up" ? null : "up")}
                >
                  <ThumbsUp size={14} /> Yes
                </button>
                <button
                  className={`as-fb-btn${feedback === "down" ? " active-down" : ""}`}
                  onClick={() => setFeedback(feedback === "down" ? null : "down")}
                >
                  <ThumbsDown size={14} /> No
                </button>
                {feedback && (
                  <span className="as-fb-thanks">
                    {feedback === "up" ? "🎉 Thanks for the feedback!" : "🙏 We'll improve!"}
                  </span>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
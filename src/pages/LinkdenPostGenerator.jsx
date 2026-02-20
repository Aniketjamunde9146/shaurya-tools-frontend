/* eslint-disable no-unused-vars */
import { useState, useMemo } from "react";
import { generateAI } from "../api";
import "./LinkdenPostGenerator.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconLI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ══════════════════════════════
   Static config
   ══════════════════════════════ */
const POST_TYPES = [
  { id: "insight",      label: "💡 Insight",        desc: "Share a professional lesson or opinion" },
  { id: "story",        label: "📖 Personal Story",  desc: "A relatable experience with a takeaway" },
  { id: "listicle",     label: "📋 List / Tips",     desc: "Numbered tips or key points" },
  { id: "achievement",  label: "🏆 Achievement",     desc: "Celebrate a win, milestone, or launch" },
  { id: "thought",      label: "🤔 Hot Take",        desc: "A contrarian or bold opinion" },
  { id: "question",     label: "❓ Question",        desc: "Engage your audience with a prompt" },
  { id: "casestudy",   label: "📊 Case Study",      desc: "Break down a real result or project" },
  { id: "hiring",       label: "💼 Hiring / Job",    desc: "Job post or team growth announcement" },
];

const TONES = [
  "Professional", "Conversational", "Inspirational",
  "Bold & Direct", "Storytelling", "Witty & Humorous", "Educational",
];

const LENGTHS = [
  { id: "short",  label: "Short",  desc: "~100–200 words" },
  { id: "medium", label: "Medium", desc: "~300–500 words" },
  { id: "long",   label: "Long",   desc: "~600–900 words" },
];

const INDUSTRIES = [
  "Technology", "Marketing & Advertising", "Finance & Banking",
  "Healthcare", "Education", "Design & Creative", "Legal",
  "Consulting", "Sales", "Human Resources", "Startup / Entrepreneurship",
  "Real Estate", "Engineering", "Product Management", "Media & Journalism",
  "Supply Chain & Logistics", "Nonprofit", "Retail & eCommerce",
];

const HASHTAG_BANK = {
  "Technology":               ["tech", "software", "ai", "innovation", "coding", "developer", "saas", "startup", "digitaltransformation", "machinelearning", "cybersecurity", "cloudcomputing"],
  "Marketing & Advertising":  ["marketing", "digitalmarketing", "contentmarketing", "branding", "seo", "socialmedia", "growthhacking", "b2bmarketing", "copywriting", "marketingstrategy"],
  "Finance & Banking":        ["finance", "investing", "fintech", "banking", "wealthmanagement", "personalfinance", "stockmarket", "economics", "vcfunding", "crypto"],
  "Healthcare":               ["healthcare", "health", "medtech", "wellness", "mentalhealth", "patientcare", "digitalhealth", "medicine", "biotech"],
  "Education":                ["education", "learning", "edtech", "teaching", "elearning", "skills", "personaldevelopment", "highereducation", "onlinelearning"],
  "Design & Creative":        ["design", "ux", "ui", "creativity", "productdesign", "graphicdesign", "uxresearch", "designthinking", "branding"],
  "Legal":                    ["law", "legaltech", "compliance", "contracts", "intellectualproperty", "legaladvice", "corporatelaw"],
  "Consulting":               ["consulting", "strategy", "managementconsulting", "businessstrategy", "transformation", "leadership", "problemsolving"],
  "Sales":                    ["sales", "b2bsales", "salestips", "salesleadership", "crm", "revenuegrowth", "accountmanagement", "prospecting"],
  "Human Resources":          ["hr", "recruitment", "hiring", "talentacquisition", "peopleops", "culture", "employeeexperience", "workplaceculture", "diversity"],
  "Startup / Entrepreneurship":["entrepreneurship", "startup", "founder", "buildingpublic", "venturecapital", "bootstrapped", "hustle", "growthmindset", "mvp"],
  "Real Estate":              ["realestate", "property", "realtor", "investing", "commercialrealestate", "proptech", "housingmarket"],
  "Engineering":              ["engineering", "softwaredevelopment", "devops", "systemdesign", "architecture", "backend", "frontend", "agile"],
  "Product Management":       ["productmanagement", "productmanager", "roadmap", "ux", "agile", "b2bproduct", "productled", "scrum", "userstories"],
  "Media & Journalism":       ["media", "journalism", "publishing", "contentcreation", "newsletter", "storytelling", "reporting"],
  "Supply Chain & Logistics": ["supplychain", "logistics", "operations", "procurement", "manufacturing", "warehousing"],
  "Nonprofit":                ["nonprofit", "socialimpact", "ngo", "charity", "volunteering", "givingback", "sustainability"],
  "Retail & eCommerce":       ["ecommerce", "retail", "dtc", "shopify", "customerexperience", "conversion", "onlineshopping"],
};

const UNIVERSAL_HASHTAGS = ["leadership", "linkedin", "career", "networking", "professionaldevelopment", "mindset", "productivity", "growth", "business", "success"];

function getHashtags(industry, keywords) {
  const base    = HASHTAG_BANK[industry] || [];
  const extra   = keywords
    ? keywords.split(/[,\s]+/).map(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, "")).filter(k => k.length > 2)
    : [];
  return [...new Set([...extra, ...base, ...UNIVERSAL_HASHTAGS])].slice(0, 28);
}

/* ── Presets ── */
const PRESETS = [
  {
    label: "Founder Story",
    fields: {
      name: "Alex Chen", jobTitle: "Founder & CEO", industry: "Startup / Entrepreneurship",
      topic: "I almost quit my startup after 6 months. No revenue, burning savings, and my co-founder left. Here's what kept me going and what I learned.",
      postType: "story", tone: "Storytelling", length: "medium",
      keywords: "founder, startup, resilience, buildinpublic", includeHashtags: true, includeCTA: true,
    },
  },
  {
    label: "Career Lesson",
    fields: {
      name: "Sarah Kim", jobTitle: "VP of Product", industry: "Product Management",
      topic: "5 things I wish I knew before becoming a product manager. I've hired 30+ PMs in my career and these are the gaps I see most often.",
      postType: "listicle", tone: "Educational", length: "medium",
      keywords: "productmanagement, career, hiring, skills", includeHashtags: true, includeCTA: true,
    },
  },
  {
    label: "Hot Take",
    fields: {
      name: "Marcus Webb", jobTitle: "Marketing Director", industry: "Marketing & Advertising",
      topic: "Unpopular opinion: most startups should never run paid ads. I've helped 50+ companies scale and here's why I tell them to stop spending on ads.",
      postType: "thought", tone: "Bold & Direct", length: "short",
      keywords: "marketing, paidads, growth, startup", includeHashtags: true, includeCTA: false,
    },
  },
  {
    label: "Case Study",
    fields: {
      name: "Priya Patel", jobTitle: "Head of Growth", industry: "Technology",
      topic: "How we grew from 0 to 10,000 users in 90 days with zero ad spend. Full breakdown of our exact strategy — channels, content, and what failed.",
      postType: "casestudy", tone: "Professional", length: "long",
      keywords: "growthhacking, saas, organicgrowth, b2b", includeHashtags: true, includeCTA: true,
    },
  },
  {
    label: "Hiring Post",
    fields: {
      name: "Jordan Reeves", jobTitle: "CTO", industry: "Engineering",
      topic: "We're hiring a senior backend engineer to join our team. Remote-first, great pay, meaningful work. Here's what makes our engineering culture different.",
      postType: "hiring", tone: "Conversational", length: "short",
      keywords: "hiring, remotework, backend, engineering", includeHashtags: true, includeCTA: true,
    },
  },
];

/* ══════════════════════════════
   Main Component
   ══════════════════════════════ */
const EMPTY = {
  name: "", jobTitle: "", industry: "",
  topic: "", postType: "insight", tone: "Professional",
  length: "medium", keywords: "",
  includeHashtags: true, includeCTA: true, includeEmojis: true,
};

export default function LinkedInPostGenerator() {
  const [f, setF]               = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [copied, setCopied]     = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState(new Set());
  const [expanded, setExpanded] = useState(false);

  const set = (key) => (val) => setF(prev => ({ ...prev, [key]: val }));

  /* ── Hashtags ── */
  const allHashtags = useMemo(
    () => getHashtags(f.industry, f.keywords),
    [f.industry, f.keywords]
  );

  const toggleHashtag = (tag) => {
    setSelectedHashtags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const selectedHtagList = allHashtags.filter(h => selectedHashtags.has(h));

  /* ── Preset ── */
  const applyPreset = (p) => {
    setF({ ...EMPTY, ...p.fields });
    setResult(""); setError(""); setCopied(false); setExpanded(false);
    const tags = getHashtags(p.fields.industry, p.fields.keywords);
    setSelectedHashtags(new Set(tags.slice(0, 8)));
  };

  /* ── Generate ── */
  async function handleGenerate() {
    if (!f.topic.trim()) { setError("Please describe your post topic."); return; }

    setLoading(true); setError(""); setResult(""); setExpanded(false);

    try {
      const postTypeMeta = POST_TYPES.find(p => p.id === f.postType);
      const lengthMeta   = LENGTHS.find(l => l.id === f.length);
      const hashtagLine  = f.includeHashtags && selectedHtagList.length > 0
        ? "\n\n" + selectedHtagList.map(h => `#${h}`).join(" ")
        : "";

      const prompt = `You are an elite LinkedIn ghostwriter who has written viral posts for founders, executives, and thought leaders. Generate a high-performing LinkedIn post.

Author Details:
- Name: ${f.name || "the author"}
- Job Title / Role: ${f.jobTitle || "professional"}
- Industry: ${f.industry || "business"}

Post Brief:
- Topic / Story: ${f.topic}
- Post Format: ${postTypeMeta?.label || f.postType} — ${postTypeMeta?.desc || ""}
- Tone: ${f.tone}
- Target Length: ${lengthMeta?.desc || "medium, ~300-500 words"}
${f.keywords ? `- Keywords / themes to weave in: ${f.keywords}` : ""}
- Include emojis: ${f.includeEmojis ? "Yes, use them as visual hooks and bullet markers — sparingly and purposefully" : "No emojis at all"}
- Include CTA at end: ${f.includeCTA ? "Yes — a genuine, non-salesy call to action (question, comment prompt, or follow)" : "No CTA needed"}

LINKEDIN POST FORMULA (follow this structure):
1. HOOK (1–2 lines max): The most important part. Must stop the scroll. Use a bold statement, surprising number, relatable pain, or cliffhanger. DO NOT start with "I". Start with the insight or the tension.
2. BODY: Expand with the story, lesson, or list. Use short paragraphs (1–3 lines each). Add white space — LinkedIn rewards readability. If listicle format, use numbered points or emoji bullets.
3. INSIGHT / TAKEAWAY: The "so what" — what should the reader walk away thinking or feeling?
4. CTA (if enabled): End with a question or comment prompt that invites engagement. Keep it genuine.
${hashtagLine ? `5. HASHTAGS: End with exactly these tags: ${selectedHtagList.map(h => `#${h}`).join(" ")}` : ""}

STRICT RULES:
- Output ONLY the raw post text. No preamble, no explanation, no markdown fences, no labels.
- Never start the post with the word "I" — reframe the opening.
- Never use corporate buzzwords: synergy, leverage, circle back, deep dive, move the needle, bandwidth.
- Make it feel human. LinkedIn users can smell AI from a mile away — write with voice and specificity.
- Short sentences. Short paragraphs. Lots of white space. This is the LinkedIn algorithm's love language.
- The hook must be genuinely compelling — if someone read only the first line, would they tap "see more"?`;

      const res = await generateAI("linkedin_post", prompt);

      if (!res.data.success) throw new Error("ai_fail");

      let raw = res.data.data.trim()
        .replace(/^```[a-z]*\n?/, "")
        .replace(/\n?```$/, "")
        .trim();

      setResult(raw);
      setActiveTab("preview");
    } catch (e) {
      setError(
        e.message === "ai_fail"
          ? "AI generation failed. Please try again."
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ── Copy / Download ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "linkedin-post.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => {
    setF(EMPTY); setResult(""); setError(""); setCopied(false);
    setSelectedHashtags(new Set()); setExpanded(false);
  };

  const wordCount = result ? result.split(/\s+/).filter(Boolean).length : 0;
  const charCount = result ? result.length : 0;

  /* ── Preview display name ── */
  const displayInitial = f.name ? f.name.charAt(0).toUpperCase() : "Y";
  const displayName    = f.name || "Your Name";
  const displayTitle   = f.jobTitle || "Your Job Title";

  return (
    <>
    <Helmet>
      <title>Free LinkedIn Post Generator – AI-Powered | ShauryaTools</title>
      <meta name="description" content="Generate scroll-stopping LinkedIn posts with AI. Choose post format, tone, and length. Includes hashtag picker and live LinkedIn preview. Free, instant results." />
      <meta name="keywords" content="linkedin post generator, ai linkedin post, linkedin content generator, linkedin post ideas, free linkedin tool, linkedin copywriter" />
      <link rel="canonical" href="https://shauryatools.vercel.app/linkedin-post-generator" />
    </Helmet>
    <div className="lp-page">
      <div className="lp-inner">

        {/* ── Header ── */}
        <div className="lp-header">
          <div className="lp-icon"><IconLI /></div>
          <div>
            <span className="lp-cat">Social Tools</span>
            <h1>LinkedIn Post Generator</h1>
            <p>Describe your topic, pick a format and tone — get a scroll-stopping post written by AI in seconds.</p>
          </div>
        </div>

        {/* ── Presets ── */}
        <div className="lp-presets">
          <span className="lp-presets-label">Quick start:</span>
          {PRESETS.map(p => (
            <button key={p.label} className="lp-preset-btn" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        <div className="lp-grid">

          {/* ── Left: form ── */}
          <div className="lp-col-left">
            <div className="lp-card">
              <div className="lp-card-head">
                <span className="lp-card-title">Post Details</span>
              </div>
              <div className="lp-form-body">

                {/* Author */}
                <div className="lp-divider">About You</div>
                <div className="lp-row2">
                  <div className="lp-field">
                    <span className="lp-label">Your Name</span>
                    <input className="lp-input" value={f.name} onChange={e => set("name")(e.target.value)} placeholder="Alex Chen" />
                  </div>
                  <div className="lp-field">
                    <span className="lp-label">Job Title / Role</span>
                    <input className="lp-input" value={f.jobTitle} onChange={e => set("jobTitle")(e.target.value)} placeholder="Founder & CEO" />
                  </div>
                </div>
                <div className="lp-field">
                  <span className="lp-label">Industry</span>
                  <select className="lp-select" value={f.industry} onChange={e => set("industry")(e.target.value)}>
                    <option value="">Select your industry…</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                {/* Post content */}
                <div className="lp-divider" style={{ marginTop: 4 }}>What's the Post About?</div>
                <div className="lp-field">
                  <div className="lp-field-top">
                    <span className="lp-label">Topic, Story, or Idea <span className="lp-label-hint">— be specific, the AI will write the rest</span></span>
                    <span className={`lp-char ${f.topic.length > 400 ? "good" : f.topic.length > 100 ? "good" : ""}`}>
                      {f.topic.length} chars
                    </span>
                  </div>
                  <textarea
                    className="lp-textarea"
                    style={{ minHeight: 100 }}
                    value={f.topic}
                    onChange={e => set("topic")(e.target.value)}
                    placeholder="e.g. I almost quit my startup after 6 months. No revenue, burning savings, and my co-founder left. Here's what kept me going and what I learned about resilience…"
                  />
                </div>

                {/* Post type */}
                <div className="lp-field">
                  <span className="lp-label">Post Format</span>
                  <div className="lp-pill-group">
                    {POST_TYPES.map(pt => (
                      <button
                        key={pt.id}
                        className={`lp-pill-btn ${f.postType === pt.id ? "lp-pill-on" : ""}`}
                        onClick={() => set("postType")(pt.id)}
                        title={pt.desc}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone + Length */}
                <div className="lp-row2">
                  <div className="lp-field">
                    <span className="lp-label">Tone</span>
                    <select className="lp-select" value={f.tone} onChange={e => set("tone")(e.target.value)}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="lp-field">
                    <span className="lp-label">Length</span>
                    <div className="lp-pill-group" style={{ marginTop: 2 }}>
                      {LENGTHS.map(l => (
                        <button
                          key={l.id}
                          className={`lp-pill-btn ${f.length === l.id ? "lp-pill-on" : ""}`}
                          onClick={() => set("length")(l.id)}
                          title={l.desc}
                        >
                          {l.label}
                          <span style={{ fontSize: "0.65rem", opacity: 0.7, marginLeft: 3 }}>{l.desc.split("~")[1]?.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lp-field">
                  <span className="lp-label">Keywords <span className="lp-label-hint">comma-separated, for hashtags + context</span></span>
                  <input
                    className="lp-input"
                    value={f.keywords}
                    onChange={e => set("keywords")(e.target.value)}
                    placeholder="startup, founder, resilience, growthmindset"
                  />
                </div>

                {/* Options */}
                <div className="lp-divider" style={{ marginTop: 4 }}>Options</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="lp-toggle-row" onClick={() => set("includeEmojis")(!f.includeEmojis)}>
                    <div className="lp-toggle-info">
                      <span className="lp-toggle-label">Include Emojis</span>
                      <span className="lp-toggle-sub">Use emojis as visual hooks and bullet markers</span>
                    </div>
                    <div className={`lp-switch ${f.includeEmojis ? "on" : ""}`}>
                      <div className="lp-switch-dot" />
                    </div>
                  </div>
                  <div className="lp-toggle-row" onClick={() => set("includeCTA")(!f.includeCTA)}>
                    <div className="lp-toggle-info">
                      <span className="lp-toggle-label">Include Call to Action</span>
                      <span className="lp-toggle-sub">End with a question or comment prompt to drive engagement</span>
                    </div>
                    <div className={`lp-switch ${f.includeCTA ? "on" : ""}`}>
                      <div className="lp-switch-dot" />
                    </div>
                  </div>
                  <div className="lp-toggle-row" onClick={() => set("includeHashtags")(!f.includeHashtags)}>
                    <div className="lp-toggle-info">
                      <span className="lp-toggle-label">Include Hashtags</span>
                      <span className="lp-toggle-sub">Add selected hashtags to the end of the post</span>
                    </div>
                    <div className={`lp-switch ${f.includeHashtags ? "on" : ""}`}>
                      <div className="lp-switch-dot" />
                    </div>
                  </div>
                </div>

                {/* Hashtags */}
                {f.includeHashtags && (
                  <>
                    <div className="lp-divider" style={{ marginTop: 4 }}>
                      Hashtags
                      {selectedHashtags.size > 0 && (
                        <span style={{ marginLeft: 8, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.7rem", color: "var(--li-blue)" }}>
                          {selectedHashtags.size} selected
                        </span>
                      )}
                    </div>
                    <div className="lp-field">
                      <div className="lp-hashtags-wrap">
                        {allHashtags.length === 0 ? (
                          <span className="lp-ht-empty">Select an industry or enter keywords to see suggestions</span>
                        ) : (
                          allHashtags.map(tag => (
                            <span
                              key={tag}
                              className={`lp-hashtag ${selectedHashtags.has(tag) ? "lp-ht-on" : ""}`}
                              onClick={() => toggleHashtag(tag)}
                            >
                              #{tag}
                            </span>
                          ))
                        )}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--grey-3)", marginTop: 4 }}>
                        LinkedIn recommends 3–5 hashtags per post for best reach
                      </div>
                    </div>
                  </>
                )}

                {/* Error */}
                {error && (
                  <div className="lp-error">
                    <IconAlert /> {error}
                  </div>
                )}

                {/* Generate */}
                <button
                  className="lp-gen-btn"
                  onClick={handleGenerate}
                  disabled={loading || !f.topic.trim()}
                >
                  {loading
                    ? <><span className="lp-spinner" /> Writing your post…</>
                    : <><IconLI /> Generate LinkedIn Post</>
                  }
                </button>

              </div>
            </div>
          </div>

          {/* ── Right: preview + output ── */}
          <div className="lp-col-right">

            {/* LinkedIn mock preview */}
            <div className="lp-card">
              <div className="lp-card-head">
                <span className="lp-card-title">LinkedIn Preview</span>
              </div>
              <div className="lp-li-card" style={{ margin: 12, borderRadius: 8 }}>

                {/* Post header */}
                <div className="lp-li-top">
                  <div className="lp-li-avatar">{displayInitial}</div>
                  <div className="lp-li-author">
                    <div className="lp-li-name">{displayName}</div>
                    <div className="lp-li-title">{displayTitle}{f.industry ? ` · ${f.industry}` : ""}</div>
                    <div className="lp-li-time">Just now · 🌐</div>
                  </div>
                  <div className="lp-li-follow">+ Follow</div>
                </div>

                {/* Post body */}
                <div className="lp-li-body">
                  {result ? (
                    <>
                      <div className={`lp-li-text ${!expanded ? "lp-li-text-clamp" : ""}`}>
                        {result}
                      </div>
                      {!expanded && (
                        <div className="lp-li-more" onClick={() => setExpanded(true)}>…see more</div>
                      )}
                    </>
                  ) : (
                    <div className="lp-li-placeholder">
                      {f.topic
                        ? `Your post about "${f.topic.slice(0, 60)}${f.topic.length > 60 ? "…" : ""}" will appear here.`
                        : "Fill in your details and generate a post — it will preview here in LinkedIn style."}
                    </div>
                  )}
                </div>

                {/* Reactions row */}
                <div className="lp-li-reactions">
                  <div className="lp-li-reaction-icons">
                    <div className="lp-li-reaction-icon" style={{ background: "#378fe9" }}>👍</div>
                    <div className="lp-li-reaction-icon" style={{ background: "#df704d" }}>❤️</div>
                    <div className="lp-li-reaction-icon" style={{ background: "#4d9e4d" }}>🎉</div>
                  </div>
                  <span>Reactions</span>
                  <span style={{ marginLeft: "auto" }}>Comments · Reposts</span>
                </div>

                {/* Action buttons */}
                <div className="lp-li-actions">
                  {[["👍", "Like"], ["💬", "Comment"], ["🔁", "Repost"], ["📤", "Send"]].map(([icon, label]) => (
                    <div key={label} className="lp-li-action">
                      <span style={{ fontSize: "1rem" }}>{icon}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="lp-card animate-in">
                <div className="lp-skeleton-body">
                  <div className="lp-skel lp-skel-title" />
                  <div className="lp-skel lp-skel-line" />
                  <div className="lp-skel lp-skel-short lp-skel-line" />
                  <div className="lp-skel lp-skel-block" />
                  <div className="lp-skel lp-skel-line" />
                  <div className="lp-skel lp-skel-short lp-skel-line" />
                </div>
              </div>
            )}

            {/* Output card */}
            {result && !loading && (
              <div className="lp-card animate-in">
                <div className="lp-result-top">
                  <div className="lp-tabs">
                    <button className={`lp-tab ${activeTab === "preview" ? "lp-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>
                      Preview
                    </button>
                    <button className={`lp-tab ${activeTab === "raw" ? "lp-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>
                      Edit
                    </button>
                  </div>
                  <div className="lp-output-actions">
                    <button className="lp-sm-btn" onClick={handleReset}><IconRefresh /> New</button>
                    <button className="lp-sm-btn" onClick={handleDownload}><IconDownload /></button>
                    <button className={`lp-copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                      {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                    </button>
                  </div>
                </div>

                {activeTab === "preview" && (
                  <div className="lp-output-preview">{result}</div>
                )}

                {activeTab === "raw" && (
                  <textarea
                    className="lp-output-textarea"
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    spellCheck={false}
                  />
                )}

                <div className="lp-result-footer">
                  <span className="lp-word-count">
                    {wordCount} words · {charCount} chars
                    {charCount > 3000 && <span style={{ color: "var(--orange)", marginLeft: 6 }}>· LinkedIn limit: 3,000</span>}
                  </span>
                  <button
                    className={`lp-sm-btn ${copied ? "lp-copy-btn copied" : ""}`}
                    onClick={handleCopy}
                    style={{ fontSize: "0.72rem" }}
                  >
                    {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy Post</>}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
    </>
  );
}
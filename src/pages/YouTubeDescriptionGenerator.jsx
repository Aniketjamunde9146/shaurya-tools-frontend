/* eslint-disable no-unused-vars */
import { useState, useMemo } from "react";
import "./YouTubeDescriptionGenerator.css";

import { generateAI } from "../api";
import { Helmet } from "react-helmet";


/* ── Icons ── */
const IconYT = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z"/>
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
const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconX = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ══════════════════════
   Static data
   ══════════════════════ */
const CATEGORIES = [
  "Education", "Tech & Programming", "Gaming", "Cooking & Food",
  "Fitness & Health", "Travel & Vlog", "Finance & Investing",
  "Music", "Comedy & Entertainment", "Beauty & Fashion",
  "Business & Marketing", "Science", "DIY & Crafts", "Motivation",
  "News & Politics", "Sports", "Parenting", "Productivity",
];

const TONES = [
  "Professional", "Casual & Friendly", "Energetic & Exciting",
  "Storytelling", "Educational & Informative", "Bold & Direct",
];

const PRESETS = [
  {
    label: "Tutorial",
    fields: {
      title: "How to Build a REST API with Node.js in 2024",
      description: "Step by step guide on building a fully functional REST API using Node.js, Express, and MongoDB. We cover authentication, CRUD operations, error handling, and deployment.",
      category: "Tech & Programming",
      channelName: "CodeWithMe",
      tone: "Educational & Informative",
      keywords: "nodejs, restapi, expressjs, mongodb, javascript, backend",
      links: [
        { label: "Source Code", url: "https://github.com/example/repo" },
        { label: "Join Discord", url: "https://discord.gg/example" },
      ],
    },
  },
  {
    label: "Vlog",
    fields: {
      title: "I Lived in Bali for 30 Days — Honest Review",
      description: "Everything you need to know about living in Bali as a digital nomad. Cost of living, coworking spots, food, culture, and my honest pros and cons after a full month.",
      category: "Travel & Vlog",
      channelName: "Wandering Free",
      tone: "Casual & Friendly",
      keywords: "bali, digitalnomad, travel, indonesia, remotework",
      links: [
        { label: "Travel Insurance I Use", url: "https://safetywing.com" },
        { label: "My Camera Gear", url: "https://kit.co/example" },
      ],
    },
  },
  {
    label: "Fitness",
    fields: {
      title: "30-Minute Full Body HIIT Workout — No Equipment",
      description: "Complete full body HIIT workout you can do anywhere with zero equipment. Burn calories, build endurance, and improve strength in just 30 minutes.",
      category: "Fitness & Health",
      channelName: "FitWithSarah",
      tone: "Energetic & Exciting",
      keywords: "hiit, workout, fitness, noequipment, fullbody, homeworkout",
      links: [
        { label: "My Workout Plan", url: "https://fitwithsarah.com/plan" },
        { label: "Protein Powder I Use", url: "https://example.com" },
      ],
    },
  },
  {
    label: "Finance",
    fields: {
      title: "How I Saved $50,000 in 2 Years on a Normal Salary",
      description: "Exact breakdown of how I saved $50K in 2 years earning a regular income. My budgeting method, investing strategy, side hustles, and the mindset shift that changed everything.",
      category: "Finance & Investing",
      channelName: "Money Moves",
      tone: "Storytelling",
      keywords: "saving, personalfinance, budgeting, investing, financialfreedom",
      links: [
        { label: "My Budget Template (Free)", url: "https://example.com/budget" },
        { label: "Best Investing App", url: "https://example.com" },
      ],
    },
  },
];

/* ── Hashtag bank by category ── */
const HASHTAG_BANK = {
  "Education":             ["learn", "education", "tutorial", "howto", "study", "knowledge", "skills", "learning", "explained", "tips", "beginners", "guide", "course"],
  "Tech & Programming":   ["coding", "programming", "developer", "tech", "javascript", "python", "webdev", "software", "code", "fullstack", "devlife", "api", "github", "100daysofcode"],
  "Gaming":               ["gaming", "gamer", "gameplay", "game", "twitch", "esports", "ps5", "xbox", "pcgaming", "letsplay", "walkthrough", "gamingcommunity"],
  "Cooking & Food":       ["food", "cooking", "recipe", "foodie", "chef", "homecooking", "delicious", "easyrecipe", "mealprep", "healthy", "yummy", "baking"],
  "Fitness & Health":     ["fitness", "workout", "gym", "health", "exercise", "hiit", "training", "fitnessmotivation", "bodybuilding", "weightloss", "nutrition", "wellness"],
  "Travel & Vlog":        ["travel", "vlog", "adventure", "explore", "wanderlust", "travelblogger", "digitalnomad", "backpacking", "traveltips", "travelgram", "solotravel"],
  "Finance & Investing":  ["finance", "investing", "money", "personalfinance", "stockmarket", "wealth", "budgeting", "savings", "financialfreedom", "passiveincome", "crypto"],
  "Music":                ["music", "musician", "song", "cover", "original", "producer", "beatmaker", "studio", "musicproduction", "newmusic", "artist"],
  "Comedy & Entertainment":["funny", "comedy", "entertainment", "humor", "viral", "trending", "fun", "lol", "memes", "sketch"],
  "Beauty & Fashion":     ["beauty", "fashion", "makeup", "skincare", "style", "ootd", "grwm", "haul", "tutorial", "glow", "affordable"],
  "Business & Marketing": ["business", "entrepreneur", "marketing", "startup", "hustle", "ecommerce", "sidehustle", "growthhack", "branding", "socialmedia"],
  "Science":              ["science", "explained", "physics", "biology", "chemistry", "space", "experiment", "facts", "discovery", "stem"],
  "DIY & Crafts":         ["diy", "crafts", "handmade", "creative", "upcycle", "homedecor", "makeit", "crafting"],
  "Motivation":           ["motivation", "mindset", "success", "goals", "inspiration", "productivity", "selfimprovement", "discipline", "growth"],
  "News & Politics":      ["news", "politics", "currentevents", "worldnews", "analysis", "debate", "opinion"],
  "Sports":               ["sports", "football", "basketball", "soccer", "nba", "nfl", "highlights", "athlete"],
  "Parenting":            ["parenting", "family", "kids", "mom", "dad", "parenthood", "baby", "toddler", "familyvlog"],
  "Productivity":         ["productivity", "timemanagement", "efficiency", "habits", "focus", "deepwork", "organization", "tools"],
};

function getHashtags(category, keywords) {
  const base  = HASHTAG_BANK[category] || [];
  const extra = keywords
    ? keywords.split(/[,\s]+/).map(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, "")).filter(k => k.length > 2)
    : [];
  const combined = [...new Set([...extra, ...base])];
  return combined.slice(0, 30);
}

/* ══════════════════════
   Main Component
   ══════════════════════ */
const EMPTY = {
  title: "", description: "", category: "", channelName: "",
  tone: "Educational & Informative", keywords: "",
  links: [],
};

export default function YouTubeDescriptionGenerator() {
  const [f, setF]             = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [copied, setCopied]   = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState(new Set());

  const set = (key) => (val) => setF(prev => ({ ...prev, [key]: val }));

  /* ── Hashtags ── */
  const allHashtags = useMemo(
    () => getHashtags(f.category, f.keywords),
    [f.category, f.keywords]
  );

  // Auto-select top 10 when hashtags list updates
  const toggleHashtag = (tag) => {
    setSelectedHashtags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const selectedHtagList = allHashtags.filter(h => selectedHashtags.has(h));

  /* ── Links ── */
  const addLink = () => setF(prev => ({ ...prev, links: [...prev.links, { label: "", url: "" }] }));

  const updateLink = (i, key, val) => setF(prev => {
    const links = [...prev.links];
    links[i] = { ...links[i], [key]: val };
    return { ...prev, links };
  });

  const removeLink = (i) => setF(prev => ({
    ...prev, links: prev.links.filter((_, idx) => idx !== i),
  }));

  /* ── Preset ── */
  const applyPreset = (p) => {
    setF({ ...EMPTY, ...p.fields });
    setResult("");
    setError("");
    // Auto-select first 10 hashtags from this preset's category
    const tags = getHashtags(p.fields.category, p.fields.keywords);
    setSelectedHashtags(new Set(tags.slice(0, 10)));
  };

  /* ── Generate ── */
  async function handleGenerate() {
    if (!f.title.trim()) { setError("Please enter a video title."); return; }
    if (!f.description.trim()) { setError("Please enter a video description or topic."); return; }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const linksBlock = f.links.filter(l => l.url).length > 0
        ? f.links.filter(l => l.url).map(l => `${l.label ? l.label + ": " : ""}${l.url}`).join("\n")
        : "";

      const hashtagLine = selectedHtagList.length > 0
        ? selectedHtagList.map(h => `#${h}`).join(" ")
        : "";

      const prompt = `You are an expert YouTube SEO copywriter. Generate a professional, engaging, and SEO-optimized YouTube video description.

Video Details:
- Title: ${f.title}
- Topic/Summary: ${f.description}
- Category: ${f.category || "General"}
- Channel Name: ${f.channelName || "the channel"}
- Tone: ${f.tone}
${f.keywords ? `- Keywords to include: ${f.keywords}` : ""}
${linksBlock ? `- Links to include:\n${linksBlock}` : ""}
${hashtagLine ? `- Hashtags to add at the end: ${hashtagLine}` : ""}

STRICT RULES:
- Output ONLY the raw description text. No preamble, no explanation, no markdown code fences.
- Structure: Start with a 2–3 sentence hook that mirrors the video title and compels viewers to watch.
- Then a short paragraph expanding on what the viewer will learn or experience.
- If there are timestamps, add a "⏱️ Chapters" section with placeholder timestamps like 0:00, 1:30, etc.
- Add a "📌 Links & Resources" section if links were provided, listing each clearly.
- Add a social/subscribe section encouraging viewers to like, comment, subscribe — match the tone.
- End with the hashtags on the very last line(s) as plain text tags separated by spaces.
- Use appropriate emojis as section markers (📌 ⏱️ 🔔 👇 etc.) to match the tone.
- Keep the description between 200–500 words — long enough for SEO, not bloated.
- Naturally weave in keywords for search optimization without keyword stuffing.
- The description should make both YouTube's algorithm AND real humans want to click.`;

      const res = await generateAI("youtube_description", prompt);

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
    a.download = "youtube-description.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => {
    setF(EMPTY); setResult(""); setError(""); setCopied(false);
    setSelectedHashtags(new Set());
  };

  const wordCount = result ? result.split(/\s+/).filter(Boolean).length : 0;
  const charCount = result ? result.length : 0;

  /* ── Title char color ── */
  const titleColor = f.title.length > 80 ? "over" : f.title.length >= 60 ? "warn" : f.title.length >= 30 ? "good" : "";

  return (
    <>
    <Helmet>
      <title>Free YouTube Description Generator – AI-Powered SEO Descriptions</title>
      <meta name="description" content="Generate SEO-optimized YouTube video descriptions with AI. Add timestamps, links, and hashtags. Includes live YouTube preview. Free, no sign-up." />
      <meta name="keywords" content="youtube description generator, youtube seo, ai youtube description, youtube video description, youtube description tool, yt description" />
      <link rel="canonical" href="https://shauryatools.vercel.app/youtube-description-generator" />
    </Helmet>
    <div className="yd-page">
      <div className="yd-inner">

        {/* ── Header ── */}
        <div className="yd-header">
          <div className="yd-icon"><IconYT /></div>
          <div>
            <span className="yd-cat">Social Tools</span>
            <h1>YouTube Description Generator</h1>
            <p>Add your video title, topic, links, and pick hashtags — get an SEO-optimized description instantly.</p>
          </div>
        </div>

        {/* ── Presets ── */}
        <div className="yd-presets">
          <span className="yd-presets-label">Quick start:</span>
          {PRESETS.map(p => (
            <button key={p.label} className="yd-preset-btn" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="yd-grid">

          {/* ── Left: form ── */}
          <div className="yd-col-left">
            <div className="yd-card">
              <div className="yd-card-head">
                <span className="yd-card-title">Video Details</span>
              </div>
              <div className="yd-form-body">

                {/* Core info */}
                <div className="yd-divider">Video Info</div>

                <div className="yd-field">
                  <div className="yd-field-top">
                    <span className="yd-label">Video Title <span style={{ fontSize: "0.68rem", color: "var(--grey-3)", fontWeight: 400 }}>— 60–70 chars ideal for SEO</span></span>
                    <span className={`yd-char ${titleColor}`}>{f.title.length}/100</span>
                  </div>
                  <input
                    className="yd-input"
                    value={f.title}
                    onChange={e => set("title")(e.target.value)}
                    placeholder="How to Build a REST API with Node.js in 2024"
                  />
                </div>

                <div className="yd-field">
                  <div className="yd-field-top">
                    <span className="yd-label">Video Description / Topic</span>
                  </div>
                  <textarea
                    className="yd-textarea"
                    value={f.description}
                    onChange={e => set("description")(e.target.value)}
                    placeholder="What is your video about? What will viewers learn or experience? Be specific — this is fed to the AI."
                    style={{ minHeight: 90 }}
                  />
                </div>

                <div className="yd-row2">
                  <div className="yd-field">
                    <span className="yd-label">Category</span>
                    <select className="yd-select" value={f.category} onChange={e => set("category")(e.target.value)}>
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="yd-field">
                    <span className="yd-label">Channel Name</span>
                    <input className="yd-input" value={f.channelName} onChange={e => set("channelName")(e.target.value)} placeholder="My Channel" />
                  </div>
                </div>

                <div className="yd-row2">
                  <div className="yd-field">
                    <span className="yd-label">Tone</span>
                    <select className="yd-select" value={f.tone} onChange={e => set("tone")(e.target.value)}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="yd-field">
                    <span className="yd-label">Keywords <span className="yd-label-hint">comma-separated</span></span>
                    <input className="yd-input" value={f.keywords} onChange={e => set("keywords")(e.target.value)} placeholder="nodejs, expressjs, backend" />
                  </div>
                </div>

                {/* Links */}
                <div className="yd-divider" style={{ marginTop: 4 }}>Links & Resources</div>

                <div className="yd-field">
                  <div className="yd-links-list">
                    {f.links.map((link, i) => (
                      <div key={i} className="yd-link-row">
                        <input
                          className="yd-link-label-input"
                          value={link.label}
                          onChange={e => updateLink(i, "label", e.target.value)}
                          placeholder="Label"
                        />
                        <input
                          className="yd-link-url-input"
                          value={link.url}
                          onChange={e => updateLink(i, "url", e.target.value)}
                          placeholder="https://example.com"
                        />
                        <button className="yd-link-remove" onClick={() => removeLink(i)}>
                          <IconX />
                        </button>
                      </div>
                    ))}
                    <button className="yd-add-link-btn" onClick={addLink}>
                      <IconPlus /> Add Link
                    </button>
                  </div>
                </div>

                {/* Hashtags */}
                <div className="yd-divider" style={{ marginTop: 4 }}>
                  Hashtags
                  <span style={{ marginLeft: 8, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.7rem", color: "var(--grey-3)" }}>
                    click to select — top 3 appear in YouTube title
                  </span>
                </div>

                <div className="yd-field">
                  <div className="yd-hashtags-wrap">
                    {allHashtags.length === 0 ? (
                      <span className="yd-ht-empty">Select a category or enter keywords to see hashtag suggestions</span>
                    ) : (
                      allHashtags.map(tag => (
                        <span
                          key={tag}
                          className={`yd-hashtag ${selectedHashtags.has(tag) ? "yd-ht-on" : ""}`}
                          onClick={() => toggleHashtag(tag)}
                        >
                          #{tag}
                        </span>
                      ))
                    )}
                  </div>
                  {selectedHashtags.size > 0 && (
                    <div style={{ fontSize: "0.7rem", color: "var(--grey-3)", marginTop: 5 }}>
                      {selectedHashtags.size} hashtag{selectedHashtags.size !== 1 ? "s" : ""} selected — will be added to description
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="yd-error">
                    <IconAlert /> {error}
                  </div>
                )}

                {/* Generate */}
                <button
                  className="yd-gen-btn"
                  onClick={handleGenerate}
                  disabled={loading || !f.title.trim() || !f.description.trim()}
                >
                  {loading
                    ? <><span className="yd-spinner" /> Generating Description…</>
                    : <><IconYT /> Generate Description</>
                  }
                </button>

              </div>
            </div>
          </div>

          {/* ── Right: preview + output ── */}
          <div className="yd-col-right">

            {/* YouTube mock preview */}
            <div className="yd-card">
              <div className="yd-card-head">
                <span className="yd-card-title">YouTube Preview</span>
              </div>
              <div className="yd-yt-preview">

                {/* Thumbnail placeholder */}
                <div className="yd-yt-thumb">
                  <div className="yd-yt-thumb-overlay">
                    <IconYT />
                    <span>Thumbnail preview</span>
                  </div>
                </div>

                {/* Video title */}
                <div className="yd-yt-video-title">
                  {f.title || "Your video title will appear here"}
                </div>

                {/* Meta */}
                <div className="yd-yt-meta">
                  <span>1.2K views</span>
                  <span className="yd-yt-meta-dot" />
                  <span>3 hours ago</span>
                </div>

                {/* Channel row */}
                <div className="yd-yt-channel-row">
                  <div className="yd-yt-avatar" style={{
                    background: "var(--yt-red)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--white)", fontFamily: "var(--font-head)",
                    fontSize: "0.9rem", fontWeight: 700,
                  }}>
                    {f.channelName ? f.channelName.charAt(0).toUpperCase() : "C"}
                  </div>
                  <div>
                    <div className="yd-yt-channel-name">{f.channelName || "Your Channel"}</div>
                    <div className="yd-yt-subs">12.4K subscribers</div>
                  </div>
                </div>

                {/* Description preview */}
                <div className="yd-yt-desc-preview">
                  {result ? (
                    <>
                      <div className="yd-yt-desc-text">{result}</div>
                      <div className="yd-yt-desc-more">...more</div>
                    </>
                  ) : (
                    <div className="yd-yt-placeholder">
                      {f.description || "Your generated description will preview here…"}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="yd-card animate-in">
                <div className="yd-skeleton-body">
                  <div className="yd-skel yd-skel-title" />
                  <div className="yd-skel yd-skel-line" />
                  <div className="yd-skel yd-skel-short yd-skel-line" />
                  <div className="yd-skel yd-skel-block" />
                  <div className="yd-skel yd-skel-line" />
                  <div className="yd-skel yd-skel-short yd-skel-line" />
                </div>
              </div>
            )}

            {/* Output card */}
            {result && !loading && (
              <div className="yd-card animate-in">
                <div className="yd-result-top">
                  <div className="yd-tabs">
                    <button className={`yd-tab ${activeTab === "preview" ? "yd-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>
                      Preview
                    </button>
                    <button className={`yd-tab ${activeTab === "raw" ? "yd-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>
                      Raw Text
                    </button>
                  </div>
                  <div className="yd-output-actions">
                    <button className="yd-sm-btn" onClick={handleReset}><IconRefresh /> New</button>
                    <button className="yd-sm-btn" onClick={handleDownload}><IconDownload /> Download</button>
                    <button className={`yd-copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                      {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                    </button>
                  </div>
                </div>

                {activeTab === "preview" && (
                  <div style={{ padding: "18px 20px", fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.75, color: "var(--grey-4)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {result}
                  </div>
                )}

                {activeTab === "raw" && (
                  <textarea
                    className="yd-output-textarea"
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    spellCheck={false}
                  />
                )}

                <div className="yd-result-footer">
                  <span className="yd-word-count">
                    {wordCount} words · {charCount} characters
                  </span>
                  <button className={`yd-sm-btn ${copied ? "yd-copy-btn copied" : ""}`} onClick={handleCopy} style={{ fontSize: "0.72rem" }}>
                    {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy Description</>}
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

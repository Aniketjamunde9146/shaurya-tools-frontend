/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./YoutubeTitleOptimizer.css";
import { Helmet } from "react-helmet";
import {
  Youtube, Sparkles, Copy, Check, RefreshCw, TrendingUp,
  Star, Clock, Hash, Target, Zap, Eye, ChevronDown, ChevronUp,
  Lightbulb, BarChart2, BookOpen, Trash2, Download, AlertCircle,
  ArrowRight, Search, ThumbsUp
} from "lucide-react";


/* ─────────────── Constants ─────────────── */
const NICHES = [
  "Tech & Gadgets", "Gaming", "Cooking & Food", "Finance & Money",
  "Fitness & Health", "Travel & Vlog", "Education & Tutorial",
  "Beauty & Fashion", "Motivation & Self-Help", "News & Commentary",
  "Music", "Comedy & Entertainment", "Business & Entrepreneurship", "Other",
];

const TITLE_STYLES = [
  { id: "curiosity",    label: "Curiosity Gap",  icon: "🤔", desc: "Make them desperate to click" },
  { id: "listicle",     label: "Listicle",        icon: "📋", desc: "Number-based titles that convert" },
  { id: "howto",        label: "How-To",          icon: "🛠️", desc: "Tutorial-style step guides" },
  { id: "controversial",label: "Controversial",   icon: "🔥", desc: "Bold, opinion-driven hooks" },
  { id: "emotional",    label: "Emotional",       icon: "💛", desc: "Story and feeling-first titles" },
  { id: "seo",          label: "SEO-First",       icon: "🔍", desc: "Keyword-rich for search ranking" },
];

const CHAR_LIMIT = 100;

/* ─────────────── Score Bar ─────────────── */
function ScoreBar({ label, score, color }) {
  return (
    <>
    <Helmet>
      <title>Free YouTube Title Optimizer – AI-Powered CTR & SEO Scores</title>
      <meta name="description" content="Generate and score YouTube titles with AI. Get CTR, SEO, and emotional hook scores. Includes thumbnail tips, A/B variants, and keyword targeting. Free." />
      <meta name="keywords" content="youtube title optimizer, youtube title generator, clickbait title generator, youtube seo title, ctr title, youtube title ideas" />
      <link rel="canonical" href="https://shauryatools.vercel.app/youtube-title-optimizer" />
    </Helmet>
    <div className="yt-score-row">
      <span className="yt-score-label">{label}</span>
      <div className="yt-score-track">
        <div
          className="yt-score-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="yt-score-val">{score}/100</span>
    </div>
    </>
  );
}

/* ─────────────── Title Card ─────────────── */
function TitleCard({ item, index, onCopy, copiedId }) {
  const [expanded, setExpanded] = useState(false);
  const isCopied = copiedId === `title-${index}`;
  const charCount = item.title.length;
  const charOk = charCount <= CHAR_LIMIT;

  const scoreColor = (s) => {
    if (s >= 80) return "#16a34a";
    if (s >= 60) return "#d97706";
    return "#ef4444";
  };

  return (
    <div className={`yt-title-card animate-in`} style={{ animationDelay: `${index * 0.07}s` }}>
      {/* Top row */}
      <div className="yt-tc-top">
        <div className="yt-tc-meta">
          <span className="yt-tc-num">#{index + 1}</span>
          <span className="yt-tc-style-badge">{item.style}</span>
          {item.is_best && (
            <span className="yt-best-badge">
              <Star size={10} strokeWidth={2.5} /> Best Pick
            </span>
          )}
        </div>
        <div className="yt-tc-actions">
          <button
            className={`yt-copy-btn ${isCopied ? "yt-copied" : ""}`}
            onClick={() => onCopy(`title-${index}`, item.title)}
          >
            {isCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="yt-tc-title">{item.title}</p>

      {/* Char count bar */}
      <div className="yt-char-bar">
        <div
          className="yt-char-fill"
          style={{
            width: `${Math.min((charCount / CHAR_LIMIT) * 100, 100)}%`,
            background: charOk ? "#16a34a" : "#ef4444",
          }}
        />
      </div>
      <div className="yt-char-row">
        <span className={`yt-char-count ${!charOk ? "yt-char-over" : ""}`}>
          {charCount}/{CHAR_LIMIT} chars {!charOk && "⚠️ too long"}
        </span>
        {item.overall_score != null && (
          <span className="yt-overall-score" style={{ color: scoreColor(item.overall_score) }}>
            <BarChart2 size={11} /> {item.overall_score}/100
          </span>
        )}
      </div>

      {/* Expand toggle */}
      <button className="yt-expand-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? <><ChevronUp size={13} /> Hide Analysis</> : <><ChevronDown size={13} /> View Analysis</>}
      </button>

      {/* Expanded analysis */}
      {expanded && (
        <div className="yt-analysis animate-in">

          {/* Scores */}
          {item.scores && (
            <div className="yt-scores">
              <ScoreBar label="Click-through Rate" score={item.scores.ctr}        color={scoreColor(item.scores.ctr)} />
              <ScoreBar label="SEO Strength"        score={item.scores.seo}        color={scoreColor(item.scores.seo)} />
              <ScoreBar label="Emotional Hook"      score={item.scores.emotional}  color={scoreColor(item.scores.emotional)} />
              <ScoreBar label="Clarity"             score={item.scores.clarity}    color={scoreColor(item.scores.clarity)} />
            </div>
          )}

          <div className="yt-analysis-grid">
            {/* Why it works */}
            {item.why_it_works && (
              <div className="yt-analysis-box">
                <p className="yt-abox-label"><ThumbsUp size={12} /> Why It Works</p>
                <p className="yt-abox-text">{item.why_it_works}</p>
              </div>
            )}
            {/* Keywords */}
            {item.keywords?.length > 0 && (
              <div className="yt-analysis-box">
                <p className="yt-abox-label"><Hash size={12} /> Target Keywords</p>
                <div className="yt-keyword-pills">
                  {item.keywords.map((kw, i) => (
                    <span key={i} className="yt-kw-pill">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Thumbnail tip */}
            {item.thumbnail_tip && (
              <div className="yt-analysis-box yt-abox-amber">
                <p className="yt-abox-label"><Eye size={12} /> Thumbnail Tip</p>
                <p className="yt-abox-text">{item.thumbnail_tip}</p>
              </div>
            )}
            {/* A/B variant */}
            {item.ab_variant && (
              <div className="yt-analysis-box yt-abox-blue">
                <p className="yt-abox-label"><RefreshCw size={12} /> A/B Variant</p>
                <p className="yt-abox-text yt-variant-text">{item.ab_variant}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */
export default function YouTubeTitleOptimizer() {
  const [topic,       setTopic]      = useState("");
  const [niche,       setNiche]      = useState("Tech & Gadgets");
  const [styles,      setStyles]     = useState(new Set(["curiosity", "listicle", "howto"]));
  const [keywords,    setKeywords]   = useState("");
  const [titleCount,  setTitleCount] = useState(5);
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState("");
  const [result,      setResult]     = useState(null);
  const [copiedId,    setCopiedId]   = useState(null);
  const [showTips,    setShowTips]   = useState(false);

  const canGenerate = topic.trim().length > 3 && styles.size > 0 && !loading;

  function toggleStyle(id) {
    setStyles(prev => {
      const next = new Set(prev);
      if (next.has(id) && next.size === 1) return prev; // keep at least 1
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ── Generate ── */
  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const selectedStyles = TITLE_STYLES.filter(s => styles.has(s.id)).map(s => s.label);

      const msg = `You are an expert YouTube SEO strategist and title copywriter with deep knowledge of what makes videos go viral. Optimize and generate YouTube titles.

VIDEO TOPIC: ${topic}
NICHE: ${niche}
TITLE STYLES TO USE: ${selectedStyles.join(", ")}
ADDITIONAL KEYWORDS TO TARGET: ${keywords.trim() || "none provided"}
NUMBER OF TITLES TO GENERATE: ${titleCount}

Generate exactly ${titleCount} highly optimized YouTube titles. Distribute the styles across the titles based on the selected styles.

Return ONLY a valid JSON object — no markdown fences, no explanation:
{
  "titles": [
    {
      "title": "The full YouTube title here",
      "style": "Which style this is (e.g. Curiosity Gap)",
      "is_best": true/false (mark exactly ONE as true — the best overall pick),
      "overall_score": 85,
      "scores": {
        "ctr": 88,
        "seo": 72,
        "emotional": 90,
        "clarity": 80
      },
      "why_it_works": "1-2 sentences explaining why this title converts",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "thumbnail_tip": "Short tip on what to show in the thumbnail to match this title",
      "ab_variant": "A slightly different version of this title to A/B test"
    }
  ],
  "channel_tips": [
    "Short actionable tip 1 specific to this niche/topic",
    "Short actionable tip 2",
    "Short actionable tip 3"
  ],
  "best_posting_time": "Best day/time to post for this niche",
  "hook_phrase": "A 5-10 word hook phrase for the video description opening"
}

STRICT RULES:
• Titles must be between 40–100 characters — optimal YouTube length
• Each title must feel genuinely different (not just word swaps)
• SEO titles should front-load keywords
• Curiosity gap titles must NOT give away the answer
• All scores are integers 0–100
• Output ONLY the raw JSON. Nothing else.`;

      const res = await generateAI("youtube-title", msg);
      if (!res.data.success) throw new Error("failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

      const objMatch = raw.match(/\{[\s\S]*\}/);
      if (!objMatch) throw new Error("bad format");

      const parsed = JSON.parse(objMatch[0]);
      setResult(parsed);

    } catch (e) {
      setError("Couldn't generate titles. Please check your input and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  }

  function handleDownload() {
    if (!result) return;
    const lines = result.titles.map((t, i) =>
      `#${i + 1} [${t.style}] ${t.is_best ? "★ BEST PICK" : ""}\n${t.title}\nScore: ${t.overall_score}/100\nA/B Variant: ${t.ab_variant}\n`
    ).join("\n");
    const extras = `\nChannel Tips:\n${result.channel_tips?.map(t => `• ${t}`).join("\n")}\n\nBest Posting Time: ${result.best_posting_time}\nHook Phrase: "${result.hook_phrase}"`;
    const blob = new Blob([lines + extras], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "youtube-titles.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setTopic(""); setResult(null); setError(""); setKeywords("");
  }

  /* ─────────── JSX ─────────── */
  return (
    <div className="yt-page">
      <div className="yt-inner">

        {/* ── Header ── */}
        <div className="yt-header">
          <div className="yt-icon">
            <Youtube size={20} strokeWidth={2} />
          </div>
          <div>
            <span className="yt-cat">Creator Tools</span>
            <h1 className="yt-title">YouTube Title Optimizer</h1>
            <p className="yt-subtitle">
              Generate high-converting, SEO-optimized titles with click-through scores, keyword analysis & thumbnail tips.
            </p>
          </div>
        </div>

        {/* ── Input Card ── */}
        <div className="yt-card">

          {/* Topic */}
          <div className="yt-field">
            <div className="yt-label-row">
              <label className="yt-label">Video Topic / Idea</label>
              {topic.length > 3 && <span className="yt-ready-badge"><Check size={10} /> Ready</span>}
            </div>
            <textarea
              className="yt-textarea"
              value={topic}
              onChange={e => { setTopic(e.target.value); setError(""); setResult(null); }}
              placeholder="e.g. I tested every budget laptop under ₹50,000 so you don't have to..."
              rows={3}
              maxLength={500}
            />
            <div className="yt-char-hint-row">
              <span className="yt-char-hint">{topic.length}/500</span>
            </div>
          </div>

          <div className="yt-divider" />

          {/* Niche */}
          <div className="yt-field">
            <label className="yt-label">Channel Niche</label>
            <div className="yt-chips">
              {NICHES.map(n => (
                <button
                  key={n}
                  className={`yt-chip ${niche === n ? "yt-chip-on" : ""}`}
                  onClick={() => setNiche(n)}
                >{n}</button>
              ))}
            </div>
          </div>

          <div className="yt-divider" />

          {/* Title Styles */}
          <div className="yt-field">
            <div className="yt-label-row">
              <label className="yt-label">Title Styles</label>
              <span className="yt-hint">{styles.size} selected</span>
            </div>
            <div className="yt-styles-grid">
              {TITLE_STYLES.map(s => (
                <button
                  key={s.id}
                  className={`yt-style-btn ${styles.has(s.id) ? "yt-style-on" : ""}`}
                  onClick={() => toggleStyle(s.id)}
                >
                  <span className="yt-style-emoji">{s.icon}</span>
                  <span className="yt-style-label">{s.label}</span>
                  <span className="yt-style-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="yt-divider" />

          {/* Keywords + Count row */}
          <div className="yt-two-col">
            <div className="yt-field">
              <label className="yt-label">
                <Search size={13} style={{ display:"inline", marginRight: 5, verticalAlign:"middle" }} />
                Target Keywords <span className="yt-label-opt">(optional)</span>
              </label>
              <input
                className="yt-input"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e.g. budget laptop, best laptop 2025"
                maxLength={200}
              />
            </div>
            <div className="yt-field">
              <label className="yt-label">
                <Target size={13} style={{ display:"inline", marginRight: 5, verticalAlign:"middle" }} />
                Number of Titles
              </label>
              <div className="yt-count-btns">
                {[3, 5, 7, 10].map(n => (
                  <button
                    key={n}
                    className={`yt-count-btn ${titleCount === n ? "yt-count-on" : ""}`}
                    onClick={() => setTitleCount(n)}
                  >{n}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="yt-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Generate */}
          <button className="yt-gen-btn" onClick={handleGenerate} disabled={!canGenerate}>
            {loading
              ? <><span className="yt-spinner" /> Optimizing titles...</>
              : <><Sparkles size={15} /> Generate {titleCount} Optimized Titles</>
            }
          </button>
        </div>

        {/* ── Pro Tips Toggle ── */}
        <button className="yt-tips-toggle" onClick={() => setShowTips(t => !t)}>
          <Lightbulb size={14} />
          {showTips ? "Hide" : "Show"} YouTube Title Tips
          {showTips ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showTips && (
          <div className="yt-tips-card animate-in">
            <div className="yt-tips-grid">
              {[
                { icon: <Clock size={14}/>,      title: "40–70 chars",     tip: "Optimal length. Mobile cuts off after ~60 chars in search." },
                { icon: <TrendingUp size={14}/>,  title: "Front-load keywords", tip: "Put the most important keyword in the first 3 words." },
                { icon: <Zap size={14}/>,         title: "Use numbers",     tip: "Titles with numbers get 36% more clicks than those without." },
                { icon: <Target size={14}/>,      title: "Avoid clickbait", tip: "Misleading titles tank watch time and hurt your algorithm ranking." },
                { icon: <BookOpen size={14}/>,    title: "A/B test always", tip: "Change one word at a time to learn what resonates with your audience." },
                { icon: <Eye size={14}/>,         title: "Match thumbnail", tip: "Title and thumbnail together = the click. They must tell one story." },
              ].map((t, i) => (
                <div key={i} className="yt-tip-box">
                  <div className="yt-tip-icon">{t.icon}</div>
                  <p className="yt-tip-title">{t.title}</p>
                  <p className="yt-tip-text">{t.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Skeleton ── */}
        {loading && (
          <div className="yt-skel-list">
            {Array.from({ length: titleCount > 3 ? 3 : titleCount }).map((_, i) => (
              <div key={i} className="yt-card yt-skel-card">
                <div className="yt-skel yt-skel-badge" />
                <div className="yt-skel yt-skel-title" />
                <div className="yt-skel yt-skel-line yt-skel-short" />
              </div>
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div className="yt-results animate-in">

            {/* Results header */}
            <div className="yt-results-top">
              <div>
                <h2 className="yt-results-title">
                  <TrendingUp size={16} /> {result.titles.length} Optimized Titles
                </h2>
                <p className="yt-results-sub">Click <strong>View Analysis</strong> on any title for scores, keywords &amp; thumbnail tips</p>
              </div>
              <div className="yt-results-actions">
                <button className="yt-action-btn" onClick={handleDownload}>
                  <Download size={13} /> Download
                </button>
                <button className="yt-action-btn" onClick={handleReset}>
                  <Trash2 size={13} /> Clear
                </button>
                <button className="yt-regen-btn" onClick={handleGenerate}>
                  <RefreshCw size={13} /> Regenerate
                </button>
              </div>
            </div>

            {/* Title cards */}
            <div className="yt-title-list">
              {result.titles.map((item, i) => (
                <TitleCard
                  key={i}
                  item={item}
                  index={i}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              ))}
            </div>

            {/* Extras */}
            <div className="yt-extras">

              {/* Channel tips */}
              {result.channel_tips?.length > 0 && (
                <div className="yt-extra-box">
                  <p className="yt-extra-title">
                    <Lightbulb size={14} /> Channel Tips for {niche}
                  </p>
                  <ul className="yt-tips-list">
                    {result.channel_tips.map((tip, i) => (
                      <li key={i} className="yt-tips-item">
                        <ArrowRight size={12} /> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="yt-extras-row">
                {/* Best posting time */}
                {result.best_posting_time && (
                  <div className="yt-extra-box yt-extra-sm yt-extra-green">
                    <p className="yt-extra-title"><Clock size={14} /> Best Posting Time</p>
                    <p className="yt-extra-val">{result.best_posting_time}</p>
                  </div>
                )}

                {/* Hook phrase */}
                {result.hook_phrase && (
                  <div className="yt-extra-box yt-extra-sm yt-extra-blue">
                    <div className="yt-extra-title-row">
                      <p className="yt-extra-title"><Zap size={14} /> Description Hook</p>
                      <button
                        className={`yt-copy-sm ${copiedId === "hook" ? "yt-copied" : ""}`}
                        onClick={() => handleCopy("hook", result.hook_phrase)}
                      >
                        {copiedId === "hook" ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                    <p className="yt-extra-val yt-hook-text">"{result.hook_phrase}"</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
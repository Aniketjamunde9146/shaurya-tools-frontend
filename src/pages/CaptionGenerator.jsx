/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState } from "react";
import { Helmet } from "react-helmet";
import { generateAI } from "../api";
import "./CaptionGenerator.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/caption-generator`;

/* ─────────────── Constants ─────────────── */
const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸", limit: "up to 2200 characters, engaging and story-like" },
  { id: "twitter",   label: "Twitter/X",  emoji: "🐦", limit: "strictly under 280 characters, punchy and direct" },
  { id: "facebook",  label: "Facebook",   emoji: "👥", limit: "conversational, 1–3 short paragraphs" },
  { id: "linkedin",  label: "LinkedIn",   emoji: "💼", limit: "professional, insightful, under 1300 characters" },
  { id: "youtube",   label: "YouTube",    emoji: "▶️",  limit: "hook in first 2 lines, then elaborate" },
  { id: "threads",   label: "Threads",    emoji: "🧵", limit: "short and punchy, under 500 characters" },
];

const LANGUAGES = [
  { id: "english", label: "English",  flag: "🇬🇧", hashtagNote: "English hashtags" },
  { id: "hindi",   label: "हिंदी",     flag: "🇮🇳", hashtagNote: "Hindi and Hinglish hashtags (e.g. #जिंदगी #YaariDosti)" },
  { id: "marathi", label: "मराठी",     flag: "🏳️",  hashtagNote: "Marathi hashtags (e.g. #मराठी #महाराष्ट्र)" },
];

const TONES = [
  { id: "fun",          label: "Fun & Playful",   emoji: "🎉" },
  { id: "professional", label: "Professional",    emoji: "💼" },
  { id: "motivational", label: "Motivational",    emoji: "🔥" },
  { id: "romantic",     label: "Romantic",        emoji: "💕" },
  { id: "sarcastic",    label: "Sarcastic",       emoji: "😏" },
  { id: "aesthetic",    label: "Aesthetic/Dreamy", emoji: "🌸" },
  { id: "bold",         label: "Bold & Fierce",   emoji: "⚡" },
  { id: "minimal",      label: "Minimal & Clean", emoji: "🤍" },
];

const CAPTION_COUNTS = [1, 2, 3, 5];

/* ─────────────── Icons ─────────────── */
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
const IconSparkle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);
const IconCaption = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <line x1="6" y1="10" x2="18" y2="10"/>
    <line x1="6" y1="14" x2="14" y2="14"/>
  </svg>
);
const IconHash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ─────────────── Helpers ─────────────── */
function parseHashtags(raw) {
  if (!raw) return [];
  return raw.match(/#[\w\u0900-\u097F\u0A00-\u0A7F]+/g) || [];
}

/* ─────────────── Component ─────────────── */
export default function CaptionGenerator() {
  const [topic,         setTopic]        = useState("");
  const [platform,      setPlatform]     = useState("instagram");
  const [language,      setLanguage]     = useState("english");
  const [tone,          setTone]         = useState("fun");
  const [captionCount,  setCaptionCount] = useState(3);
  const [hashtagCount,  setHashtagCount] = useState(8);
  const [useHashtags,   setUseHashtags]  = useState(true);
  const [useEmojis,     setUseEmojis]    = useState(true);
  const [callToAction,  setCallToAction] = useState(false);
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState("");
  const [captions,      setCaptions]     = useState([]);
  const [copiedId,      setCopiedId]     = useState(null);
  const [savedIds,      setSavedIds]     = useState(new Set());
  const [activeTab,     setActiveTab]    = useState({});

  const canGenerate = topic.trim().length > 2 && !loading;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    setCaptions([]);
    setActiveTab({});

    try {
      const plat    = PLATFORMS.find(p => p.id === platform);
      const lang    = LANGUAGES.find(l => l.id === language);
      const toneObj = TONES.find(t => t.id === tone);

      const msg = `You are a top-tier viral social media copywriter. Generate exactly ${captionCount} unique captions.

POST TOPIC: ${topic}
PLATFORM: ${plat.label} — ${plat.limit}
LANGUAGE: ${lang.label}
TONE: ${toneObj.label}
EMOJIS: ${useEmojis ? "Yes — place emojis naturally within the caption body where they add meaning. DO NOT cluster all emojis at the end." : "No emojis at all"}
CALL TO ACTION: ${callToAction ? "Yes — end every caption with a strong CTA (e.g. 'Drop a comment!', 'Save this!', 'Tag someone!')" : "No CTA needed"}
HASHTAGS: ${useHashtags
  ? `Yes — generate EXACTLY ${hashtagCount} highly relevant hashtags in ${lang.hashtagNote}. Mix popular and niche tags. Put hashtags in the "hashtags" field ONLY, NOT inside the caption body.`
  : 'No hashtags — set "hashtags" to an empty string ""'}

STRICT OUTPUT FORMAT — respond with ONLY a valid JSON array, no markdown fences, no explanation:
[
  {
    "id": 1,
    "caption": "The caption text only. No hashtags here.",
    "hashtags": "${useHashtags ? `#tag1 #tag2 ... (exactly ${hashtagCount} tags)` : ""}",
    "note": "3-word vibe label",
    "hook": "First 5-8 words of caption that grab attention"
  }
]

RULES:
• Each caption must have a completely different angle, opening line, and structure.
• Caption body must NEVER contain hashtags — they go only in "hashtags" field.
• Hashtags must be space-separated with # prefix on each one.
• Strictly follow platform character limits.
• Output ONLY the raw JSON array. Nothing else.`;

      const res = await generateAI("caption", msg);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/,           "")
        .trim();

      const arrMatch = raw.match(/\[[\s\S]*\]/);
      if (!arrMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(arrMatch[0]);

      const withMeta = parsed.map((item, i) => ({
        ...item,
        id:        i + 1,
        platform:  plat,
        lang:      lang,
        tags:      parseHashtags(item.hashtags || ""),
      }));

      setCaptions(withMeta);
      const tabs = {};
      withMeta.forEach(c => { tabs[c.id] = "caption"; });
      setActiveTab(tabs);

    } catch (e) {
      setError("Could not generate captions. Please check your topic and try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyText(key, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2200);
  }

  function copyFull(cap) {
    const full = cap.tags.length
      ? `${cap.caption}\n\n${cap.tags.join(" ")}`
      : cap.caption;
    copyText(`full-${cap.id}`, full);
  }

  function toggleSave(id) {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleDownload() {
    const lines = captions.map((c, i) => {
      const tags = c.tags.length ? `\n\nHashtags: ${c.tags.join(" ")}` : "";
      return `--- Caption ${i + 1} (${c.note}) ---\n${c.caption}${tags}`;
    }).join("\n\n\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "captions.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setTopic(""); setCaptions([]); setError(""); setSavedIds(new Set());
  }

  const savedCaptions = captions.filter(c => savedIds.has(c.id));

  return (
    <>
      <Helmet>
        <title>AI Caption Generator – Instagram, Twitter & More | ShauryaTools</title>
        <meta
          name="description"
          content="Generate viral social media captions instantly with AI. Supports Instagram, Twitter/X, LinkedIn, YouTube, Facebook and Threads. Available in English, Hindi & Marathi. Free."
        />
        <meta
          name="keywords"
          content="AI caption generator, Instagram caption generator, social media caption generator, caption generator free, caption for Instagram, AI captions"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="AI Caption Generator – Instagram, Twitter & More" />
        <meta property="og:description" content="Generate viral captions for Instagram, Twitter, LinkedIn and more with AI. Free tool." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Caption Generator – Free Online Tool" />
        <meta name="twitter:description" content="Create viral social media captions with AI. Supports 6 platforms and 3 languages." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AI Caption Generator",
            "url": PAGE_URL,
            "applicationCategory": "SocialNetworkingApplication",
            "operatingSystem": "All",
            "description": "Free AI-powered caption generator for Instagram, Twitter, LinkedIn, YouTube, Facebook and Threads.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="cg-page">
        <div className="cg-inner">

          <div className="cg-header">
            <div className="cg-icon"><IconCaption /></div>
            <div>
              <span className="cg-cat">Social Media Tools</span>
              <h1 className="cg-header-title">Caption Generator</h1>
              <p className="cg-header-sub">
                Create viral captions in <strong>English</strong>, <strong>हिंदी</strong> &amp; <strong>मराठी</strong> — with auto hashtags &amp; emoji.
              </p>
            </div>
          </div>

          <div className="cg-card">

            <div className="cg-field">
              <div className="cg-label-row">
                <label className="cg-label">What's your post about?</label>
                {topic.length > 2 && <span className="cg-ready-badge">✓ Ready</span>}
              </div>
              <textarea
                className="cg-textarea"
                value={topic}
                onChange={e => { setTopic(e.target.value); setError(""); }}
                placeholder="e.g. Rainy evening chai with best friends in Pune, feeling cozy and grateful ☕"
                rows={3}
                maxLength={500}
              />
              <div className="cg-char-row">
                <span className="cg-char-hint">{topic.length}/500 characters</span>
              </div>
            </div>

            <div className="cg-divider" />

            <div className="cg-field">
              <label className="cg-label">Platform</label>
              <div className="cg-chips">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    className={`cg-chip ${platform === p.id ? "cg-chip-on" : ""}`}
                    onClick={() => setPlatform(p.id)}
                  >
                    <span>{p.emoji}</span> {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cg-divider" />

            <div className="cg-field">
              <label className="cg-label">Language</label>
              <div className="cg-lang-row">
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    className={`cg-lang-btn ${language === l.id ? "cg-lang-on" : ""}`}
                    onClick={() => setLanguage(l.id)}
                  >
                    <span className="cg-lang-flag">{l.flag}</span>
                    <span className="cg-lang-name">{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="cg-divider" />

            <div className="cg-field">
              <label className="cg-label">Tone / Vibe</label>
              <div className="cg-chips">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    className={`cg-chip ${tone === t.id ? "cg-chip-on" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cg-divider" />

            <div className="cg-options-grid">
              <div className="cg-field">
                <label className="cg-label">How many captions?</label>
                <div className="cg-count-btns">
                  {CAPTION_COUNTS.map(n => (
                    <button
                      key={n}
                      className={`cg-count-btn ${captionCount === n ? "cg-count-on" : ""}`}
                      onClick={() => setCaptionCount(n)}
                    >{n}</button>
                  ))}
                </div>
              </div>

              {useHashtags && (
                <div className="cg-field">
                  <label className="cg-label">Hashtag count</label>
                  <div className="cg-count-btns">
                    {[5, 8, 10, 15].map(n => (
                      <button
                        key={n}
                        className={`cg-count-btn ${hashtagCount === n ? "cg-count-on" : ""}`}
                        onClick={() => setHashtagCount(n)}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="cg-divider" />

            <div className="cg-toggles">
              {[
                {
                  key: "hashtags",
                  icon: "🏷️",
                  label: "Auto Hashtags",
                  sub: `${hashtagCount} relevant trending tags — separated from caption`,
                  val: useHashtags,
                  set: setUseHashtags,
                },
                {
                  key: "emojis",
                  icon: "😄",
                  label: "Auto Emoji",
                  sub: "Smart contextual emoji placed naturally in text",
                  val: useEmojis,
                  set: setUseEmojis,
                },
                {
                  key: "cta",
                  icon: "👆",
                  label: "Call to Action",
                  sub: "End each caption with a strong engagement CTA",
                  val: callToAction,
                  set: setCallToAction,
                },
              ].map(tog => (
                <div key={tog.key} className="cg-toggle-row">
                  <div className="cg-toggle-info">
                    <span className="cg-toggle-icon">{tog.icon}</span>
                    <div>
                      <p className="cg-toggle-label">{tog.label}</p>
                      <p className="cg-toggle-sub">{tog.sub}</p>
                    </div>
                  </div>
                  <button
                    className={`cg-toggle ${tog.val ? "cg-toggle-on" : ""}`}
                    onClick={() => tog.set(v => !v)}
                    aria-label={tog.label}
                  >
                    <span className="cg-toggle-thumb" />
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="cg-error-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              className="cg-gen-btn"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              {loading
                ? <><span className="cg-spinner" /> Crafting captions...</>
                : <><IconSparkle /> Generate {captionCount} Caption{captionCount > 1 ? "s" : ""}</>
              }
            </button>
          </div>

          {loading && (
            <div className="cg-skel-list">
              {Array.from({ length: captionCount }).map((_, i) => (
                <div key={i} className="cg-card cg-skel-card">
                  <div className="cg-skel cg-skel-badge" />
                  <div className="cg-skel cg-skel-line" />
                  <div className="cg-skel cg-skel-line cg-skel-short" />
                  <div className="cg-skel cg-skel-line" />
                  <div className="cg-skel cg-skel-line cg-skel-med" />
                </div>
              ))}
            </div>
          )}

          {captions.length > 0 && !loading && (
            <div className="cg-results animate-in">

              <div className="cg-results-top">
                <div className="cg-results-left">
                  <h2 className="cg-results-title">✨ Generated Captions</h2>
                  <div className="cg-results-meta-row">
                    <span className="cg-meta-pill">{captions[0].platform.emoji} {captions[0].platform.label}</span>
                    <span className="cg-meta-pill">{captions[0].lang.flag} {captions[0].lang.label}</span>
                    <span className="cg-meta-pill">{TONES.find(t=>t.id===tone)?.emoji} {TONES.find(t=>t.id===tone)?.label}</span>
                  </div>
                </div>
                <div className="cg-results-actions">
                  <button className="cg-action-btn" onClick={handleDownload} title="Download all as .txt">
                    <IconDownload /> Download
                  </button>
                  <button className="cg-action-btn" onClick={handleReset} title="Start over">
                    <IconTrash /> Clear
                  </button>
                  <button className="cg-regen-btn" onClick={handleGenerate}>
                    <IconRefresh /> Regenerate
                  </button>
                </div>
              </div>

              <div className="cg-caption-list">
                {captions.map((cap, idx) => {
                  const tab        = activeTab[cap.id] || "caption";
                  const isSaved    = savedIds.has(cap.id);
                  const copCaption = copiedId === `caption-${cap.id}`;
                  const copHash    = copiedId === `hashtags-${cap.id}`;
                  const copFull    = copiedId === `full-${cap.id}`;

                  return (
                    <div
                      key={cap.id}
                      className={`cg-caption-card animate-in ${isSaved ? "cg-card-saved" : ""}`}
                      style={{ animationDelay: `${idx * 0.07}s` }}
                    >
                      <div className="cg-card-top">
                        <div className="cg-card-meta">
                          <span className="cg-cap-num">Caption {cap.id}</span>
                          <span className="cg-cap-note">{cap.note}</span>
                        </div>
                        <div className="cg-card-actions">
                          <button
                            className={`cg-save-btn ${isSaved ? "cg-saved" : ""}`}
                            onClick={() => toggleSave(cap.id)}
                            title={isSaved ? "Unsave" : "Save this caption"}
                          >
                            {isSaved ? "★ Saved" : "☆ Save"}
                          </button>
                          <button
                            className={`cg-copy-full-btn ${copFull ? "cg-copied" : ""}`}
                            onClick={() => copyFull(cap)}
                            title="Copy caption + hashtags"
                          >
                            {copFull ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy All</>}
                          </button>
                        </div>
                      </div>

                      {cap.hook && (
                        <div className="cg-hook-bar">
                          <span className="cg-hook-label">Hook</span>
                          <span className="cg-hook-text">"{cap.hook}"</span>
                        </div>
                      )}

                      <div className="cg-tab-bar">
                        <div className="cg-tabs">
                          <button
                            className={`cg-tab ${tab === "caption" ? "cg-tab-on" : ""}`}
                            onClick={() => setActiveTab(p => ({ ...p, [cap.id]: "caption" }))}
                          >Caption</button>
                          {cap.tags.length > 0 && (
                            <button
                              className={`cg-tab ${tab === "hashtags" ? "cg-tab-on" : ""}`}
                              onClick={() => setActiveTab(p => ({ ...p, [cap.id]: "hashtags" }))}
                            >
                              <IconHash /> Hashtags
                              <span className="cg-tab-count">{cap.tags.length}</span>
                            </button>
                          )}
                        </div>
                        {tab === "caption" ? (
                          <button
                            className={`cg-copy-tab-btn ${copCaption ? "cg-copied" : ""}`}
                            onClick={() => copyText(`caption-${cap.id}`, cap.caption)}
                          >
                            {copCaption ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy Caption</>}
                          </button>
                        ) : (
                          <button
                            className={`cg-copy-tab-btn ${copHash ? "cg-copied" : ""}`}
                            onClick={() => copyText(`hashtags-${cap.id}`, cap.tags.join(" "))}
                          >
                            {copHash ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy Tags</>}
                          </button>
                        )}
                      </div>

                      {tab === "caption" && (
                        <p className="cg-caption-body">{cap.caption}</p>
                      )}

                      {tab === "hashtags" && cap.tags.length > 0 && (
                        <div className="cg-hashtag-grid">
                          {cap.tags.map((tag, ti) => (
                            <span key={ti} className="cg-tag-pill">{tag}</span>
                          ))}
                        </div>
                      )}

                      <div className="cg-card-footer">
                        <span className="cg-foot-pill">{cap.caption.length} chars</span>
                        {cap.tags.length > 0 && (
                          <span className="cg-foot-pill cg-foot-green">{cap.tags.length} hashtags</span>
                        )}
                        <span className="cg-foot-pill">{cap.platform.emoji} {cap.platform.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {savedCaptions.length > 0 && (
                <div className="cg-saved-section animate-in">
                  <div className="cg-saved-header">
                    <span className="cg-saved-title">★ Saved Captions ({savedCaptions.length})</span>
                    <button
                      className="cg-copy-tab-btn"
                      onClick={() => {
                        const all = savedCaptions.map(c => {
                          const tags = c.tags.length ? `\n${c.tags.join(" ")}` : "";
                          return `${c.caption}${tags}`;
                        }).join("\n\n---\n\n");
                        copyText("saved-all", all);
                      }}
                    >
                      {copiedId === "saved-all" ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy All Saved</>}
                    </button>
                  </div>
                  {savedCaptions.map(c => (
                    <div key={c.id} className="cg-saved-item">
                      <span className="cg-saved-note">{c.note}</span>
                      <p className="cg-saved-text">{c.caption}</p>
                      {c.tags.length > 0 && (
                        <p className="cg-saved-tags">{c.tags.join(" ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </>
  );
}
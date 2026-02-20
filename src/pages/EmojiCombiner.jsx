/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { generateAI } from "../api";
import "./EmojiCombiner.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/emoji-combiner`;

/* ─────────────── Emoji Categories ─────────────── */
const EMOJI_CATEGORIES = [
  { label: "Smileys", emojis: ["😀","😂","🥹","😍","🤩","😎","🥺","😭","😤","🤯","🥳","😴","🤔","😏","🫠","🤗","😇","🫡","🤪","😵"] },
  { label: "Hearts", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💕","💞","💓","💗","💖","💝","💘","❣️","💔","🩷","🩵"] },
  { label: "Nature", emojis: ["🌸","🌺","🌻","🌹","🍀","🌿","🌊","🔥","⚡","❄️","🌈","☀️","🌙","⭐","🍃","🌴","🦋","🌵","🍄","🌙"] },
  { label: "Animals", emojis: ["🐶","🐱","🦊","🐻","🐼","🐨","🦁","🐯","🦄","🐸","🦋","🐙","🦋","🐬","🦅","🦋","🐺","🦝","🦜","🐲"] },
  { label: "Food", emojis: ["🍕","🍔","🍣","🍜","🍰","🍩","🍪","🧁","🍓","🍉","🫐","🥑","🌮","🍦","🧋","☕","🍺","🍷","🥂","🫖"] },
  { label: "Activity", emojis: ["🎮","🎨","🎵","🎸","⚽","🏀","🎯","🏆","🎭","📚","✈️","🚀","🏄","🧗","🎪","💃","🕺","🎲","🎰","🏋️"] },
  { label: "Objects", emojis: ["💎","👑","🔮","⚗️","🧲","💡","🔑","🗝️","🪄","🎁","📸","🎀","🪞","🧸","💌","📱","💻","🎧","🪐","🧿"] },
  { label: "Symbols", emojis: ["✨","💫","🌟","⚡","💥","🔥","💯","🎊","🎉","🌀","♾️","☯️","🔯","⚜️","🏵️","🎗️","🪬","🧿","☮️","🕊️"] },
];

const COMBINE_MODES = [
  { id: "vibe",    label: "Vibe Check",     emoji: "✨", desc: "What energy does this combo radiate?" },
  { id: "story",   label: "Tell a Story",   emoji: "📖", desc: "Build a tiny narrative from the emojis" },
  { id: "recipe",  label: "Magic Recipe",   emoji: "🧪", desc: "Combine them like ingredients" },
  { id: "outfit",  label: "Aesthetic",      emoji: "🎨", desc: "What aesthetic/style is this?" },
  { id: "caption", label: "Caption This",   emoji: "💬", desc: "Generate the perfect social media caption" },
  { id: "meaning", label: "Hidden Meaning", emoji: "🔮", desc: "Decode the secret meaning behind the combo" },
];

/* ─────────────── Icons ─────────────── */
const IconCopy = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>);
const IconCheck = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconRefresh = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>);
const IconX = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconSparkle = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>);
const IconShuffle = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>);
const IconSmile = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>);

/* ─────────────── Helpers ─────────────── */
function randomEmojis(count = 2) {
  const all = EMOJI_CATEGORIES.flatMap(c => c.emojis);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/* ─────────────── Component ─────────────── */
export default function EmojiCombiner() {
  const [selectedEmojis, setSelectedEmojis]   = useState([]);
  const [activeCategory,  setActiveCategory]  = useState(0);
  const [mode,            setMode]            = useState("vibe");
  const [customEmoji,     setCustomEmoji]      = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [result,          setResult]          = useState(null);
  const [copied,          setCopied]          = useState(false);
  const [history,         setHistory]         = useState([]);
  const customRef = useRef(null);

  const canGenerate = selectedEmojis.length >= 2 && !loading;

  function toggleEmoji(emoji) {
    setSelectedEmojis(prev => {
      if (prev.includes(emoji)) return prev.filter(e => e !== emoji);
      if (prev.length >= 6) return prev;
      return [...prev, emoji];
    });
    setResult(null);
    setError("");
  }

  function removeEmoji(emoji) {
    setSelectedEmojis(prev => prev.filter(e => e !== emoji));
    setResult(null);
  }

  function addCustom() {
    const val = customEmoji.trim();
    if (!val) return;
    const segs = [...val];
    const em = segs[0];
    if (em && !selectedEmojis.includes(em) && selectedEmojis.length < 6) {
      setSelectedEmojis(prev => [...prev, em]);
      setCustomEmoji("");
      setResult(null);
    }
  }

  function handleShuffle() {
    const count = Math.max(2, selectedEmojis.length || 2);
    setSelectedEmojis(randomEmojis(count));
    setResult(null);
    setError("");
  }

  function clearAll() {
    setSelectedEmojis([]);
    setResult(null);
    setError("");
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const modeObj  = COMBINE_MODES.find(m => m.id === mode);
      const combo    = selectedEmojis.join(" ");

      const msg = `You are a creative, witty emoji analyst and storyteller. The user has combined these emojis: ${combo}

Mode: "${modeObj.label}" — ${modeObj.desc}

Based on the mode, generate a creative, fun, and insightful response. Be imaginative, playful, and specific to THESE emojis.

Return ONLY a valid JSON object (no markdown, no fences):
{
  "title": "A catchy 3-5 word title for this combo",
  "main": "The primary output based on mode (2-4 sentences, rich and creative)",
  "tags": ["vibe tag 1", "vibe tag 2", "vibe tag 3"],
  "combo_name": "A fun made-up name for this emoji combination (e.g. 'The Midnight Snacker')",
  "use_when": "A short phrase: when should someone use this exact combo? (1 sentence)",
  "rating": "A fun rating out of 10 with a creative label (e.g. '9/10 – Certified Main Character Energy')",
  "suggested_combos": [
    { "emojis": "emoji1 emoji2", "label": "short label" },
    { "emojis": "emoji1 emoji2", "label": "short label" },
    { "emojis": "emoji1 emoji2", "label": "short label" }
  ]
}

Rules:
• "main" must directly address the mode (${modeObj.label})
• Be fun, modern, social-media-savvy, and Gen-Z aware
• Output ONLY the raw JSON. Absolutely nothing else.`;

      const res = await generateAI("emoji-combiner", msg);
      if (!res.data.success) throw new Error("failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

      const objMatch = raw.match(/\{[\s\S]*\}/);
      if (!objMatch) throw new Error("Invalid response");

      const parsed = JSON.parse(objMatch[0]);
      const entry = { emojis: [...selectedEmojis], mode, modeLabel: modeObj.label, ...parsed };
      setResult(entry);
      setHistory(prev => [entry, ...prev].slice(0, 6));

    } catch (e) {
      setError("Couldn't combine those emojis. Please try again!");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    const text = `${selectedEmojis.join("")}\n\n${result.combo_name}\n${result.main}\n\n${result.use_when}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <>
      <Helmet>
        <title>AI Emoji Combiner – Decode Your Emoji Combos | ShauryaTools</title>
        <meta
          name="description"
          content="Pick 2–6 emojis and let AI decode the vibe, tell a story, generate a caption, reveal hidden meanings and more. Fun, free emoji combination tool."
        />
        <meta
          name="keywords"
          content="emoji combiner, emoji meaning, emoji generator, emoji vibe checker, emoji story generator, AI emoji tool, emoji caption generator"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="AI Emoji Combiner – Decode Your Emoji Combos" />
        <meta property="og:description" content="Combine emojis and let AI decode the vibe, story, and meaning. Free fun tool." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Emoji Combiner – Free Online Tool" />
        <meta name="twitter:description" content="Pick emojis and let AI decode what they mean together. Fun and free." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Emoji Combiner",
            "url": PAGE_URL,
            "applicationCategory": "EntertainmentApplication",
            "operatingSystem": "All",
            "description": "Free AI-powered emoji combiner. Pick 2–6 emojis and get a vibe check, story, caption, hidden meaning and more.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="ec-page">
        <div className="ec-inner">

          <div className="ec-header">
            <div className="ec-icon"><IconSmile /></div>
            <div>
              <span className="ec-cat">Fun Tools</span>
              <h1 className="ec-title">Emoji Combiner</h1>
              <p className="ec-subtitle">Pick 2–6 emojis, choose a mode, and let AI decode the magic combination.</p>
            </div>
          </div>

          <div className="ec-card">

            <div className="ec-field">
              <div className="ec-label-row">
                <label className="ec-label">Your Emoji Combo</label>
                <div className="ec-label-actions">
                  <span className="ec-count-hint">{selectedEmojis.length}/6 selected</span>
                  {selectedEmojis.length > 0 && (
                    <button className="ec-text-btn ec-red-btn" onClick={clearAll}>Clear</button>
                  )}
                  <button className="ec-text-btn" onClick={handleShuffle}>
                    <IconShuffle /> Shuffle
                  </button>
                </div>
              </div>

              <div className={`ec-selected-area ${selectedEmojis.length === 0 ? "ec-selected-empty" : ""}`}>
                {selectedEmojis.length === 0 ? (
                  <span className="ec-placeholder">Tap emojis below to build your combo ✨</span>
                ) : (
                  <div className="ec-selected-emojis">
                    {selectedEmojis.map((em, i) => (
                      <div key={i} className="ec-selected-pill">
                        <span className="ec-selected-em">{em}</span>
                        <button className="ec-remove-btn" onClick={() => removeEmoji(em)}><IconX /></button>
                      </div>
                    ))}
                    {selectedEmojis.length >= 2 && (
                      <div className="ec-combo-preview">= {selectedEmojis.join("")}</div>
                    )}
                  </div>
                )}
              </div>

              {selectedEmojis.length === 1 && <p className="ec-hint">Pick at least 1 more emoji to combine</p>}
              {selectedEmojis.length === 6 && <p className="ec-hint ec-hint-warn">Maximum 6 emojis reached</p>}
            </div>

            <div className="ec-divider" />

            <div className="ec-field">
              <label className="ec-label">Browse Emojis</label>
              <div className="ec-cat-tabs">
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button key={i} className={`ec-cat-tab ${activeCategory === i ? "ec-cat-on" : ""}`} onClick={() => setActiveCategory(i)}>{cat.label}</button>
                ))}
              </div>
              <div className="ec-emoji-grid">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((em, i) => (
                  <button
                    key={i}
                    className={`ec-emoji-btn ${selectedEmojis.includes(em) ? "ec-em-on" : ""} ${selectedEmojis.length >= 6 && !selectedEmojis.includes(em) ? "ec-em-disabled" : ""}`}
                    onClick={() => toggleEmoji(em)}
                    disabled={selectedEmojis.length >= 6 && !selectedEmojis.includes(em)}
                  >{em}</button>
                ))}
              </div>
            </div>

            <div className="ec-divider" />

            <div className="ec-field">
              <label className="ec-label">Add Any Emoji</label>
              <div className="ec-custom-row">
                <input
                  ref={customRef}
                  className="ec-custom-input"
                  value={customEmoji}
                  onChange={e => setCustomEmoji(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCustom()}
                  placeholder="Paste or type any emoji..."
                  maxLength={8}
                />
                <button className="ec-custom-add" onClick={addCustom} disabled={!customEmoji.trim() || selectedEmojis.length >= 6}>Add</button>
              </div>
            </div>

            <div className="ec-divider" />

            <div className="ec-field">
              <label className="ec-label">Combine Mode</label>
              <div className="ec-modes">
                {COMBINE_MODES.map(m => (
                  <button key={m.id} className={`ec-mode-btn ${mode === m.id ? "ec-mode-on" : ""}`} onClick={() => { setMode(m.id); setResult(null); }}>
                    <span className="ec-mode-emoji">{m.emoji}</span>
                    <span className="ec-mode-label">{m.label}</span>
                    <span className="ec-mode-desc">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="ec-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button className="ec-gen-btn" onClick={handleGenerate} disabled={!canGenerate}>
              {loading
                ? <><span className="ec-spinner" /> Combining magic...</>
                : <><IconSparkle /> Combine {selectedEmojis.length > 0 ? selectedEmojis.join("") : "Emojis"}</>
              }
            </button>
          </div>

          {loading && (
            <div className="ec-card ec-skel-card">
              <div className="ec-skel ec-skel-title" />
              <div className="ec-skel ec-skel-line" />
              <div className="ec-skel ec-skel-line ec-skel-short" />
              <div className="ec-skel ec-skel-line" />
              <div className="ec-skel ec-skel-block" />
              <div className="ec-skel ec-skel-line ec-skel-short" />
            </div>
          )}

          {result && !loading && (
            <div className="ec-result-card animate-in">

              <div className="ec-result-top">
                <div className="ec-result-combo-display">
                  {result.emojis.map((em, i) => (<span key={i} className="ec-result-em">{em}</span>))}
                </div>
                <div className="ec-result-actions">
                  <button className={`ec-copy-btn ${copied ? "ec-copied" : ""}`} onClick={handleCopy}>
                    {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                  </button>
                  <button className="ec-action-btn" onClick={handleGenerate}><IconRefresh /> Redo</button>
                </div>
              </div>

              <div className="ec-result-name-row">
                <span className="ec-result-mode-badge">
                  {COMBINE_MODES.find(m => m.id === result.mode)?.emoji} {result.modeLabel}
                </span>
                <h2 className="ec-result-title">{result.title}</h2>
                <p className="ec-combo-name">"{result.combo_name}"</p>
              </div>

              <div className="ec-result-main">
                <p className="ec-result-text">{result.main}</p>
              </div>

              {result.tags?.length > 0 && (
                <div className="ec-result-tags">
                  {result.tags.map((tag, i) => (<span key={i} className="ec-result-tag">#{tag.replace(/\s+/g, "")}</span>))}
                </div>
              )}

              <div className="ec-result-divider" />

              <div className="ec-stats-row">
                <div className="ec-stat-box">
                  <span className="ec-stat-label">Use When</span>
                  <p className="ec-stat-val">{result.use_when}</p>
                </div>
                <div className="ec-stat-box ec-stat-rating">
                  <span className="ec-stat-label">Rating</span>
                  <p className="ec-stat-val">{result.rating}</p>
                </div>
              </div>

              {result.suggested_combos?.length > 0 && (
                <>
                  <div className="ec-result-divider" />
                  <div className="ec-suggestions">
                    <p className="ec-suggest-label">You might also love</p>
                    <div className="ec-suggest-grid">
                      {result.suggested_combos.map((sg, i) => (
                        <button key={i} className="ec-suggest-card" onClick={() => {
                          const ems = [...sg.emojis].filter(c => c.trim());
                          setSelectedEmojis(ems.slice(0, 6));
                          setResult(null);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}>
                          <span className="ec-suggest-emojis">{sg.emojis}</span>
                          <span className="ec-suggest-lbl">{sg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {history.length > 1 && (
            <div className="ec-history animate-in">
              <div className="ec-history-header">
                <p className="ec-history-title">Recent Combos</p>
              </div>
              <div className="ec-history-list">
                {history.slice(1).map((h, i) => (
                  <button key={i} className="ec-history-item" onClick={() => { setSelectedEmojis(h.emojis); setMode(h.mode); setResult(h); setError(""); }}>
                    <span className="ec-history-emojis">{h.emojis.join("")}</span>
                    <span className="ec-history-name">{h.combo_name}</span>
                    <span className="ec-history-mode">{COMBINE_MODES.find(m=>m.id===h.mode)?.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./WhatsAppRewriter.css";
import { Helmet } from "react-helmet";
import {
  MessageCircle,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Laugh,
  Heart,
  Flame,
  ShieldAlert,
  Clock,
  ThumbsUp,
  Handshake,
  VolumeX,
  ChevronDown,
  Languages,
  Repeat2,
  Smile,
  BrainCircuit,
} from "lucide-react";

/* ── Vibe / Tone Options ── */
const VIBES = [
  { id: "casual",       label: "Casual",        icon: Smile,       desc: "Chill & relaxed"       },
  { id: "funny",        label: "Funny",          icon: Laugh,       desc: "Witty & humorous"      },
  { id: "flirty",       label: "Flirty",         icon: Flame,       desc: "Playful & charming"    },
  { id: "sweet",        label: "Sweet",          icon: Heart,       desc: "Warm & affectionate"   },
  { id: "professional", label: "Professional",   icon: ShieldAlert, desc: "Formal & polished"     },
  { id: "assertive",    label: "Assertive",      icon: BrainCircuit,desc: "Direct & confident"    },
  { id: "apologetic",   label: "Apologetic",     icon: ThumbsUp,    desc: "Sorry & sincere"       },
  { id: "diplomatic",   label: "Diplomatic",     icon: Handshake,   desc: "Tactful & balanced"    },
  { id: "ghosting",     label: "Soft Exit",      icon: VolumeX,     desc: "Politely pull back"    },
  { id: "followup",     label: "Follow-up",      icon: Clock,       desc: "Nudge without nagging" },
];

/* ── Emoji Level ── */
const EMOJI_LEVELS = [
  { id: "none",   label: "None",    desc: "No emojis"      },
  { id: "subtle", label: "Subtle",  desc: "1–2 emojis"     },
  { id: "medium", label: "Medium",  desc: "3–5 emojis"     },
  { id: "heavy",  label: "Heavy",   desc: "Emoji-packed 🔥" },
];

/* ── Length Options ── */
const LENGTHS = [
  { id: "shorter",  label: "Shorter",  desc: "Trim it down"   },
  { id: "same",     label: "Same",     desc: "Keep the length" },
  { id: "longer",   label: "Longer",   desc: "Expand it more"  },
];

/* ── Language Options ── */
const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Hindi", "Arabic", "Chinese (Simplified)",
  "Japanese", "Korean",
];

/* ── Component ── */
export default function WhatsAppRewriter() {
  const [message,    setMessage]    = useState("");
  const [vibe,       setVibe]       = useState("casual");
  const [emojiLevel, setEmojiLevel] = useState("subtle");
  const [length,     setLength]     = useState("same");
  const [language,   setLanguage]   = useState("English");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [results,    setResults]    = useState([]); // 3 variants
  const [copied,     setCopied]     = useState(""); // index or ""
  const [activeVariant, setActiveVariant] = useState(0);

  const charMax   = 1000;
  const canSubmit = message.trim().length > 2 && !loading;

  async function handleRewrite() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResults([]);

    const selectedVibe   = VIBES.find(v => v.id === vibe);
    const selectedEmoji  = EMOJI_LEVELS.find(e => e.id === emojiLevel);
    const selectedLength = LENGTHS.find(l => l.id === length);

    const prompt = `You are an expert at writing natural, human-sounding WhatsApp messages.

Original message:
"""
${message.trim()}
"""

Settings:
- Vibe/Tone: ${selectedVibe?.label} — ${selectedVibe?.desc}
- Emoji usage: ${selectedEmoji?.label} — ${selectedEmoji?.desc}
- Length: ${selectedLength?.label} — ${selectedLength?.desc}
- Language: ${language}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro, no explanation, no markdown fences.
Exact shape:
{ "v1": "...", "v2": "...", "v3": "..." }

RULES:
• Generate exactly 3 different rewrites of the original message (v1, v2, v3).
• Each variant must feel distinctly different in phrasing, not just minor word swaps.
• Match the vibe precisely: ${selectedVibe?.desc}.
• Emoji level: ${selectedEmoji?.desc} — strictly follow this.
• Length target: ${selectedLength?.desc} compared to the original.
• Write in ${language}.
• Sound like a real human texting — natural, conversational, no robotic phrasing.
• Do NOT include labels like "Version 1:" inside the message text.
• Do NOT wrap JSON in markdown code blocks.`;

    try {
      const res = await generateAI("whatsapp", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/, "")
        .trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.v1 || !parsed.v2 || !parsed.v3) throw new Error("Invalid response format");

      setResults([parsed.v1, parsed.v2, parsed.v3]);
      setActiveVariant(0);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(idx) {
    navigator.clipboard.writeText(results[idx]);
    setCopied(String(idx));
    setTimeout(() => setCopied(""), 2500);
  }

  function handleReset() {
    setMessage(""); setResults([]); setError(""); setCopied("");
    setVibe("casual"); setEmojiLevel("subtle"); setLength("same");
    setLanguage("English"); setActiveVariant(0);
  }

  const selectedVibeData = VIBES.find(v => v.id === vibe);
  const VibeIcon = selectedVibeData?.icon;

  return (
    <>
      <Helmet>
        <title>Free AI WhatsApp Message Rewriter – Rewrite Texts Instantly | ShauryaTools</title>
        <meta name="description" content="Rewrite any WhatsApp message in seconds with AI. Choose your vibe — casual, funny, flirty, professional and more. Free WhatsApp message rewriter." />
        <meta name="keywords" content="whatsapp message rewriter, ai text rewriter, rewrite message, whatsapp ai, message tone changer, chat message rewriter, text rewriter" />
        <link rel="canonical" href="https://shauryatools.vercel.app/whatsapp-rewriter" />
      </Helmet>

      <div className="wa-page">
        <div className="wa-inner">

          {/* ── Header ── */}
          <div className="wa-header">
            <div className="wa-icon">
              <MessageCircle size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="wa-cat">AI Messaging Tools</span>
              <h1>WhatsApp Rewriter</h1>
              <p>Paste any message — get 3 perfect rewrites in the vibe you choose.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="wa-card">

            {/* Message Input */}
            <div className="wa-field">
              <div className="wa-label-row">
                <label className="wa-label">
                  <MessageCircle size={14} strokeWidth={2.5} className="wa-label-icon" />
                  Your Message
                </label>
                <span className={`wa-char-count ${message.length > charMax * 0.9 ? "wa-char-warn" : ""}`}>
                  {message.length}/{charMax}
                </span>
              </div>
              <textarea
                className="wa-textarea"
                value={message}
                onChange={e => {
                  if (e.target.value.length <= charMax) {
                    setMessage(e.target.value);
                    setError("");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleRewrite(); }}
                placeholder={"Paste the message you want to rewrite...\n\nExample: \"hey are you coming tonight or not\" or \"I wanted to check in about our meeting tomorrow\""}
                rows={5}
              />
              <p className="wa-hint">Ctrl+Enter to rewrite · {charMax - message.length} characters remaining</p>
            </div>

            <div className="wa-divider" />

            {/* Vibe Picker */}
            <div className="wa-field">
              <div className="wa-label-row">
                <label className="wa-label">Vibe</label>
                {selectedVibeData && (
                  <span className="wa-selected-badge">
                    {VibeIcon && <VibeIcon size={11} strokeWidth={2.5} />}
                    {selectedVibeData.label}
                  </span>
                )}
              </div>
              <div className="wa-vibes">
                {VIBES.map(v => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      className={`wa-vibe-btn ${vibe === v.id ? "wa-vibe-on" : ""}`}
                      onClick={() => setVibe(v.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="wa-vibe-icon" />
                      <span className="wa-vibe-label">{v.label}</span>
                      <span className="wa-vibe-desc">{v.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="wa-divider" />

            {/* Emoji + Length + Language row */}
            <div className="wa-settings-row">

              {/* Emoji Level */}
              <div className="wa-field wa-field-third">
                <label className="wa-label">Emoji Level</label>
                <div className="wa-emoji-btns">
                  {EMOJI_LEVELS.map(e => (
                    <button
                      key={e.id}
                      className={`wa-emoji-btn ${emojiLevel === e.id ? "wa-emoji-on" : ""}`}
                      onClick={() => setEmojiLevel(e.id)}
                      title={e.desc}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div className="wa-field wa-field-third">
                <label className="wa-label">Length</label>
                <div className="wa-length-btns">
                  {LENGTHS.map(l => (
                    <button
                      key={l.id}
                      className={`wa-length-btn ${length === l.id ? "wa-len-on" : ""}`}
                      onClick={() => setLength(l.id)}
                      title={l.desc}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="wa-field wa-field-third">
                <label className="wa-label">
                  <Languages size={14} strokeWidth={2.5} className="wa-label-icon" />
                  Language
                </label>
                <div className="wa-select-wrap">
                  <select
                    className="wa-select"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="wa-select-arrow" />
                </div>
              </div>
            </div>

            {error && (
              <div className="wa-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Rewrite Button */}
            <button className="wa-rewrite-btn" onClick={handleRewrite} disabled={!canSubmit}>
              {loading
                ? <><span className="wa-spinner" /> Rewriting...</>
                : <><Repeat2 size={16} strokeWidth={2} /> Rewrite Message</>}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="wa-card wa-skeleton-card animate-in">
              <div className="wa-skel wa-skel-short" />
              <div className="wa-skel" />
              <div className="wa-skel wa-skel-med" />
              <div className="wa-skel" />
              <div className="wa-skel wa-skel-short" />
            </div>
          )}

          {/* ── Results ── */}
          {results.length > 0 && !loading && (
            <div className="wa-card animate-in">

              {/* Top bar */}
              <div className="wa-result-top">
                <div className="wa-result-meta">
                  {VibeIcon && (
                    <span className="wa-result-badge">
                      <VibeIcon size={11} strokeWidth={2.5} />
                      {selectedVibeData?.label}
                    </span>
                  )}
                  <span className="wa-result-badge wa-badge-emoji">
                    {EMOJI_LEVELS.find(e => e.id === emojiLevel)?.label} Emoji
                  </span>
                  {language !== "English" && (
                    <span className="wa-result-badge wa-badge-lang">
                      <Languages size={11} strokeWidth={2.5} />
                      {language}
                    </span>
                  )}
                </div>

                <button className="wa-action-btn" onClick={handleReset}>
                  <RefreshCw size={13} strokeWidth={2.5} /> New
                </button>
              </div>

              {/* Variant Tabs */}
              <div className="wa-variant-tabs">
                {results.map((_, idx) => (
                  <button
                    key={idx}
                    className={`wa-variant-tab ${activeVariant === idx ? "wa-vtab-on" : ""}`}
                    onClick={() => setActiveVariant(idx)}
                  >
                    <Sparkles size={12} strokeWidth={2.5} className="wa-vtab-icon" />
                    Version {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Variant */}
              <div className="wa-bubble-wrap">
                {/* Original */}
                <div className="wa-original-pill">
                  <span className="wa-pill-label">Original</span>
                  <p className="wa-pill-text">{message}</p>
                </div>

                {/* Arrow */}
                <div className="wa-arrow">
                  <Repeat2 size={16} strokeWidth={2} className="wa-arrow-icon" />
                </div>

                {/* Rewritten bubble */}
                <div className="wa-bubble">
                  <p className="wa-bubble-text">{results[activeVariant]}</p>
                  <div className="wa-bubble-footer">
                    <span className="wa-bubble-words">
                      {results[activeVariant].split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      className={`wa-bubble-copy ${copied === String(activeVariant) ? "wa-copied" : ""}`}
                      onClick={() => handleCopy(activeVariant)}
                    >
                      {copied === String(activeVariant)
                        ? <><Check size={12} strokeWidth={2.5} /> Copied!</>
                        : <><Copy size={12} strokeWidth={2.5} /> Copy</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* All 3 variants quick view */}
              <div className="wa-all-variants">
                <p className="wa-all-label">All versions — click to select</p>
                <div className="wa-variants-list">
                  {results.map((r, idx) => (
                    <div
                      key={idx}
                      className={`wa-variant-item ${activeVariant === idx ? "wa-vitem-on" : ""}`}
                      onClick={() => setActiveVariant(idx)}
                    >
                      <div className="wa-vitem-left">
                        <span className="wa-vitem-num">V{idx + 1}</span>
                        <p className="wa-vitem-text">{r}</p>
                      </div>
                      <button
                        className={`wa-vitem-copy ${copied === String(idx) ? "wa-copied" : ""}`}
                        onClick={e => { e.stopPropagation(); handleCopy(idx); }}
                      >
                        {copied === String(idx)
                          ? <Check size={12} strokeWidth={2.5} />
                          : <Copy size={12} strokeWidth={2.5} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
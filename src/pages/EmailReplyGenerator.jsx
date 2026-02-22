/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./EmailReplyGenerator.css";
import { Helmet } from "react-helmet";
import {
  Mail,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Heart,
  ShieldAlert,
  ThumbsUp,
  UserX,
  Clock,
  HelpCircle,
  Handshake,
  ChevronDown,
  ChevronUp,
  Languages,
} from "lucide-react";

/* ── Tone Options ── */
const TONES = [
  { id: "professional", label: "Professional",  icon: Briefcase,  desc: "Formal & polished"     },
  { id: "friendly",     label: "Friendly",      icon: Heart,      desc: "Warm & approachable"   },
  { id: "assertive",    label: "Assertive",     icon: ShieldAlert,desc: "Confident & direct"     },
  { id: "appreciative", label: "Appreciative",  icon: ThumbsUp,   desc: "Grateful & positive"   },
  { id: "declining",    label: "Declining",     icon: UserX,      desc: "Polite refusal"         },
  { id: "followup",     label: "Follow-up",     icon: Clock,      desc: "Check-in & reminder"   },
  { id: "clarifying",   label: "Clarifying",    icon: HelpCircle, desc: "Ask for more info"     },
  { id: "negotiating",  label: "Negotiating",   icon: Handshake,  desc: "Find common ground"    },
];

/* ── Length Options ── */
const LENGTHS = [
  { id: "short",    label: "Short",    desc: "2–3 sentences" },
  { id: "medium",   label: "Medium",   desc: "1–2 paragraphs" },
  { id: "detailed", label: "Detailed", desc: "Full response"  },
];

/* ── Language Options ── */
const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Hindi", "Arabic", "Chinese (Simplified)",
  "Japanese", "Korean",
];

/* ── Component ── */
export default function EmailReplyGenerator() {
  const [originalEmail, setOriginalEmail] = useState("");
  const [context,       setContext]       = useState("");
  const [tone,          setTone]          = useState("professional");
  const [length,        setLength]        = useState("medium");
  const [language,      setLanguage]      = useState("English");
  const [showContext,   setShowContext]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [result,        setResult]        = useState("");
  const [copied,        setCopied]        = useState(false);
  const [activeTab,     setActiveTab]     = useState("reply");

  const charMax   = 3000;
  const canSubmit = originalEmail.trim().length > 10 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedTone   = TONES.find(t => t.id === tone);
    const selectedLength = LENGTHS.find(l => l.id === length);

    const prompt = `You are an expert email communication specialist. Write a professional email reply.

Original Email Received:
"""
${originalEmail.trim()}
"""
${context.trim() ? `\nAdditional Context / Instructions:\n"""\n${context.trim()}\n"""` : ""}

Reply Settings:
- Tone: ${selectedTone?.label} — ${selectedTone?.desc}
- Length: ${selectedLength?.label} — ${selectedLength?.desc}
- Language: ${language}

STRICT RULES:
• Output ONLY the email reply text. No explanation, no "Here is your reply:" preamble.
• Start directly with the greeting (e.g. "Hi [Name]," or "Dear [Name],").
• Do NOT include a subject line.
• Match the tone precisely: ${selectedTone?.desc}.
• Keep length to: ${selectedLength?.desc}.
• Write in ${language}.
• Use natural, human-sounding language — not robotic or overly formal unless the tone requires it.
• End with an appropriate sign-off (e.g. "Best regards," / "Thanks," etc.) followed by "[Your Name]".
• If the original email mentions specific names, dates, or details, reference them naturally.`;

    try {
      const res = await generateAI("email", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```[a-z]*\n?/, "")
        .replace(/\n?```$/, "")
        .trim();

      setResult(raw);
      setActiveTab("reply");
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
    a.download = "email-reply.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setOriginalEmail(""); setContext(""); setResult("");
    setError(""); setCopied(false); setTone("professional");
    setLength("medium"); setLanguage("English"); setShowContext(false);
  }

  const selectedToneData = TONES.find(t => t.id === tone);
  const ToneIcon = selectedToneData?.icon;

  return (
    <>
      <Helmet>
        <title>Free AI Email Reply Generator – Write Perfect Email Replies | ShauryaTools</title>
        <meta name="description" content="Paste any email and get a polished, professional reply instantly with AI. Choose your tone, length, and language. Free email reply generator." />
        <meta name="keywords" content="email reply generator, ai email, professional email reply, email writer, email assistant, reply to email, email tone generator" />
        <link rel="canonical" href="https://shauryatools.vercel.app/email-reply-generator" />
      </Helmet>

      <div className="er-page">
        <div className="er-inner">

          {/* ── Header ── */}
          <div className="er-header">
            <div className="er-icon">
              <Mail size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="er-cat">AI Productivity Tools</span>
              <h1>Email Reply Generator</h1>
              <p>Paste any email — get a perfect reply in seconds.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="er-card">

            {/* Original Email */}
            <div className="er-field">
              <div className="er-label-row">
                <label className="er-label">
                  <Mail size={14} strokeWidth={2.5} className="er-label-icon" />
                  Original Email
                </label>
                <span className={`er-char-count ${originalEmail.length > charMax * 0.9 ? "er-char-warn" : ""}`}>
                  {originalEmail.length}/{charMax}
                </span>
              </div>
              <textarea
                className="er-textarea er-textarea-main"
                value={originalEmail}
                onChange={e => {
                  if (e.target.value.length <= charMax) {
                    setOriginalEmail(e.target.value);
                    setError("");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder={`Paste the email you received here...\n\nExample:\n"Hi, I wanted to follow up on the proposal we discussed last week. Could you share a timeline and updated pricing? Looking forward to hearing from you. Best, Sarah"`}
                rows={7}
              />
            </div>

            {/* Context Toggle */}
            <button
              className="er-context-toggle"
              onClick={() => setShowContext(v => !v)}
            >
              {showContext ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
              {showContext ? "Hide" : "Add"} context or instructions
              <span className="er-context-optional">optional</span>
            </button>

            {showContext && (
              <div className="er-field er-context-field animate-in">
                <textarea
                  className="er-textarea er-textarea-context"
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Any extra instructions? e.g. 'Mention we can meet next Tuesday', 'Keep it brief', 'Decline the offer politely but leave the door open'..."
                  rows={3}
                />
              </div>
            )}

            <div className="er-divider" />

            {/* Tone Picker */}
            <div className="er-field">
              <div className="er-label-row">
                <label className="er-label">Reply Tone</label>
                {selectedToneData && (
                  <span className="er-selected-badge">
                    {ToneIcon && <ToneIcon size={11} strokeWidth={2.5} />}
                    {selectedToneData.label}
                  </span>
                )}
              </div>
              <div className="er-tones">
                {TONES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      className={`er-tone-btn ${tone === t.id ? "er-tone-on" : ""}`}
                      onClick={() => setTone(t.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="er-tone-icon" />
                      <span className="er-tone-label">{t.label}</span>
                      <span className="er-tone-desc">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="er-divider" />

            {/* Length + Language row */}
            <div className="er-row">

              {/* Length */}
              <div className="er-field er-field-half">
                <label className="er-label">Reply Length</label>
                <div className="er-lengths">
                  {LENGTHS.map(l => (
                    <button
                      key={l.id}
                      className={`er-length-btn ${length === l.id ? "er-len-on" : ""}`}
                      onClick={() => setLength(l.id)}
                    >
                      <span className="er-len-label">{l.label}</span>
                      <span className="er-len-desc">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="er-field er-field-half">
                <label className="er-label">
                  <Languages size={14} strokeWidth={2.5} className="er-label-icon" />
                  Language
                </label>
                <div className="er-select-wrap">
                  <select
                    className="er-select"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="er-select-arrow" />
                </div>
              </div>
            </div>

            {error && (
              <div className="er-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button className="er-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="er-spinner" /> Writing Reply...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Reply</>}
            </button>

            <p className="er-hint">Press Ctrl+Enter to generate · {charMax - originalEmail.length} characters remaining</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="er-card er-skeleton-card animate-in">
              <div className="er-skel er-skel-line er-skel-short" />
              <div className="er-skel er-skel-line" />
              <div className="er-skel er-skel-line" />
              <div className="er-skel er-skel-line er-skel-med" />
              <div className="er-skel er-skel-line" />
              <div className="er-skel er-skel-line er-skel-short" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="er-card animate-in">

              {/* Top bar */}
              <div className="er-result-top">
                <div className="er-result-meta">
                  {ToneIcon && (
                    <span className="er-result-badge">
                      <ToneIcon size={11} strokeWidth={2.5} />
                      {selectedToneData?.label}
                    </span>
                  )}
                  <span className="er-result-badge er-badge-len">
                    {LENGTHS.find(l => l.id === length)?.label}
                  </span>
                  {language !== "English" && (
                    <span className="er-result-badge er-badge-lang">
                      <Languages size={11} strokeWidth={2.5} />
                      {language}
                    </span>
                  )}
                </div>

                <div className="er-tabs">
                  <button className={`er-tab ${activeTab === "reply" ? "er-tab-on" : ""}`} onClick={() => setActiveTab("reply")}>Reply</button>
                  <button className={`er-tab ${activeTab === "both"  ? "er-tab-on" : ""}`} onClick={() => setActiveTab("both")}>Side by Side</button>
                </div>

                <div className="er-actions">
                  <button className="er-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="er-action-btn" onClick={handleDownload} title="Download reply">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`er-copy-btn ${copied ? "er-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Reply only view */}
              {activeTab === "reply" && (
                <div className="er-reply-box">
                  <div className="er-reply-header">
                    <Mail size={13} strokeWidth={2.5} className="er-reply-icon" />
                    Your Reply
                  </div>
                  <pre className="er-reply-text">{result}</pre>
                </div>
              )}

              {/* Side-by-side view */}
              {activeTab === "both" && (
                <div className="er-side-by-side">
                  <div className="er-side">
                    <div className="er-side-header">
                      <Mail size={13} strokeWidth={2.5} />
                      Original Email
                    </div>
                    <pre className="er-side-text er-side-original">{originalEmail}</pre>
                  </div>
                  <div className="er-side-divider" />
                  <div className="er-side">
                    <div className="er-side-header er-side-header-reply">
                      <Sparkles size={13} strokeWidth={2.5} />
                      Your Reply
                    </div>
                    <pre className="er-side-text er-side-reply">{result}</pre>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="er-result-footer">
                <span className="er-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`er-copy-full ${copied ? "er-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Reply</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
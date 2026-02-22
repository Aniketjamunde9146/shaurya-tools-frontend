/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./EmailGenerator.css";
import { Helmet } from "react-helmet";
import {
  Send,
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
  Languages,
  Type,
  AlignLeft,
  User,
  Mail,
} from "lucide-react";

/* ── Email Types ── */
const EMAIL_TYPES = [
  { id: "business",     label: "Business",       icon: Briefcase,   desc: "Corporate & formal"      },
  { id: "sales",        label: "Sales Outreach",  icon: Send,        desc: "Pitch & persuade"        },
  { id: "followup",     label: "Follow-up",       icon: Clock,       desc: "Check-in & reminder"     },
  { id: "thankyou",     label: "Thank You",       icon: ThumbsUp,    desc: "Express gratitude"       },
  { id: "apology",      label: "Apology",         icon: Heart,       desc: "Apologize sincerely"     },
  { id: "complaint",    label: "Complaint",       icon: ShieldAlert, desc: "Raise an issue"          },
  { id: "introduction", label: "Introduction",    icon: User,        desc: "Introduce yourself"      },
  { id: "request",      label: "Request",         icon: HelpCircle,  desc: "Ask for something"       },
  { id: "invitation",   label: "Invitation",      icon: Mail,        desc: "Invite to event/meeting" },
  { id: "negotiation",  label: "Negotiation",     icon: Handshake,   desc: "Discuss terms & offers"  },
  { id: "resignation",  label: "Resignation",     icon: UserX,       desc: "Leave a position"        },
  { id: "newsletter",   label: "Newsletter",      icon: AlignLeft,   desc: "Announcement & updates"  },
];

/* ── Tone Options ── */
const TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly",     label: "Friendly"     },
  { id: "formal",       label: "Formal"       },
  { id: "casual",       label: "Casual"       },
  { id: "persuasive",   label: "Persuasive"   },
  { id: "empathetic",   label: "Empathetic"   },
];

/* ── Length Options ── */
const LENGTHS = [
  { id: "short",    label: "Short",    desc: "2–3 sentences"  },
  { id: "medium",   label: "Medium",   desc: "1–2 paragraphs" },
  { id: "detailed", label: "Detailed", desc: "Full email"     },
];

/* ── Language Options ── */
const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Hindi", "Arabic", "Chinese (Simplified)",
  "Japanese", "Korean",
];

/* ── Component ── */
export default function EmailGenerator() {
  const [emailType,     setEmailType]     = useState("business");
  const [topic,         setTopic]         = useState("");
  const [senderName,    setSenderName]    = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [tone,          setTone]          = useState("professional");
  const [length,        setLength]        = useState("medium");
  const [language,      setLanguage]      = useState("English");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [result,        setResult]        = useState(null); // { subject, body }
  const [copied,        setCopied]        = useState("");   // "subject" | "body" | "all" | ""
  const [activeTab,     setActiveTab]     = useState("preview");

  const charMax   = 1000;
  const canSubmit = topic.trim().length > 5 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectedType   = EMAIL_TYPES.find(t => t.id === emailType);
    const selectedLength = LENGTHS.find(l => l.id === length);

    const prompt = `You are an expert email copywriter. Write a complete, ready-to-send email.

Email Type: ${selectedType?.label} — ${selectedType?.desc}
Topic / Purpose: ${topic.trim()}
${senderName.trim()    ? `Sender Name: ${senderName.trim()}`       : ""}
${recipientName.trim() ? `Recipient Name: ${recipientName.trim()}` : ""}
Tone: ${tone}
Length: ${selectedLength?.label} — ${selectedLength?.desc}
Language: ${language}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro text, no explanation, no markdown.
Exact required shape:
{ "subject": "...", "body": "..." }

RULES:
• "subject" must be a compelling, specific subject line (no "Subject:" prefix).
• "body" must be the complete email body — start with a greeting, end with a sign-off and ${senderName.trim() ? senderName.trim() : "[Your Name]"}.
• Match tone: ${tone}. Match length: ${selectedLength?.desc}.
• Write everything in ${language}.
• Do NOT include markdown, code fences, or any text outside the JSON object.`;

    try {
      const res = await generateAI("email-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();

      // Strip markdown code fences if present
      raw = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/, "")
        .trim();

      // Extract JSON object even if model adds surrounding text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.subject || !parsed.body) throw new Error("Invalid response format");

      setResult(parsed);
      setActiveTab("preview");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(part) {
    const text =
      part === "subject" ? result.subject :
      part === "body"    ? result.body    :
      `Subject: ${result.subject}\n\n${result.body}`;

    navigator.clipboard.writeText(text);
    setCopied(part);
    setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    const text = `Subject: ${result.subject}\n\n${result.body}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "email.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setTopic(""); setSenderName(""); setRecipientName("");
    setResult(null); setError(""); setCopied("");
    setEmailType("business"); setTone("professional");
    setLength("medium"); setLanguage("English");
  }

  const selectedTypeData = EMAIL_TYPES.find(t => t.id === emailType);
  const TypeIcon = selectedTypeData?.icon;

  return (
    <>
      <Helmet>
        <title>Free AI Email Generator – Write Professional Emails Instantly | ShauryaTools</title>
        <meta name="description" content="Generate professional emails instantly with AI. Choose from 12 email types, set your tone, length and language. Free AI email writer tool." />
        <meta name="keywords" content="email generator, ai email writer, professional email, business email generator, email composer, ai email tool, write email" />
        <link rel="canonical" href="https://shauryatools.vercel.app/email-generator" />
      </Helmet>

      <div className="eg-page">
        <div className="eg-inner">

          {/* ── Header ── */}
          <div className="eg-header">
            <div className="eg-icon">
              <Send size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="eg-cat">AI Productivity Tools</span>
              <h1>Email Generator</h1>
              <p>Describe what you need — get a polished, ready-to-send email instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="eg-card">

            {/* Email Type */}
            <div className="eg-field">
              <div className="eg-label-row">
                <label className="eg-label">Email Type</label>
                {selectedTypeData && (
                  <span className="eg-selected-badge">
                    {TypeIcon && <TypeIcon size={11} strokeWidth={2.5} />}
                    {selectedTypeData.label}
                  </span>
                )}
              </div>
              <div className="eg-types">
                {EMAIL_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      className={`eg-type-btn ${emailType === t.id ? "eg-type-on" : ""}`}
                      onClick={() => setEmailType(t.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="eg-type-icon" />
                      <span className="eg-type-label">{t.label}</span>
                      <span className="eg-type-desc">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eg-divider" />

            {/* Topic / Purpose */}
            <div className="eg-field">
              <div className="eg-label-row">
                <label className="eg-label">
                  <Type size={14} strokeWidth={2.5} className="eg-label-icon" />
                  Topic / Purpose
                </label>
                <span className={`eg-char-count ${topic.length > charMax * 0.9 ? "eg-char-warn" : ""}`}>
                  {topic.length}/{charMax}
                </span>
              </div>
              <textarea
                className="eg-textarea"
                value={topic}
                onChange={e => {
                  if (e.target.value.length <= charMax) {
                    setTopic(e.target.value);
                    setError("");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder={
                  emailType === "sales"        ? "e.g. Pitch our project management SaaS to a mid-size marketing agency..." :
                  emailType === "followup"      ? "e.g. Follow up on a job interview I had 3 days ago for a React developer role..." :
                  emailType === "apology"       ? "e.g. Apologize for missing an important client deadline due to unexpected issues..." :
                  emailType === "introduction"  ? "e.g. Introduce myself as a new marketing manager joining the team..." :
                  emailType === "resignation"   ? "e.g. Resign from my software engineer position with 2 weeks notice..." :
                                                  "Describe what this email is about, any key points to include..."
                }
                rows={4}
              />
            </div>

            <div className="eg-divider" />

            {/* Sender + Recipient */}
            <div className="eg-row">
              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <User size={14} strokeWidth={2.5} className="eg-label-icon" />
                  Your Name
                </label>
                <input
                  className="eg-input"
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                />
              </div>
              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <User size={14} strokeWidth={2.5} className="eg-label-icon" />
                  Recipient's Name
                </label>
                <input
                  className="eg-input"
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="e.g. Sarah Lee"
                />
              </div>
            </div>

            <div className="eg-divider" />

            {/* Tone */}
            <div className="eg-field">
              <label className="eg-label">Tone</label>
              <div className="eg-tones">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    className={`eg-tone-btn ${tone === t.id ? "eg-tone-on" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="eg-divider" />

            {/* Length + Language */}
            <div className="eg-row">
              <div className="eg-field eg-field-half">
                <label className="eg-label">Length</label>
                <div className="eg-lengths">
                  {LENGTHS.map(l => (
                    <button
                      key={l.id}
                      className={`eg-length-btn ${length === l.id ? "eg-len-on" : ""}`}
                      onClick={() => setLength(l.id)}
                    >
                      <span className="eg-len-label">{l.label}</span>
                      <span className="eg-len-desc">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <Languages size={14} strokeWidth={2.5} className="eg-label-icon" />
                  Language
                </label>
                <div className="eg-select-wrap">
                  <select
                    className="eg-select"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="eg-select-arrow" />
                </div>
              </div>
            </div>

            {error && (
              <div className="eg-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button className="eg-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="eg-spinner" /> Writing Email...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Email</>}
            </button>

            <p className="eg-hint">Press Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="eg-card eg-skeleton-card animate-in">
              <div className="eg-skel eg-skel-short" />
              <div className="eg-skel" />
              <div className="eg-skel" />
              <div className="eg-skel eg-skel-med" />
              <div className="eg-skel" />
              <div className="eg-skel eg-skel-short" />
              <div className="eg-skel" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="eg-card animate-in">

              {/* Top bar */}
              <div className="eg-result-top">
                <div className="eg-result-meta">
                  {TypeIcon && (
                    <span className="eg-result-badge">
                      <TypeIcon size={11} strokeWidth={2.5} />
                      {selectedTypeData?.label}
                    </span>
                  )}
                  <span className="eg-result-badge eg-badge-tone">{tone}</span>
                  {language !== "English" && (
                    <span className="eg-result-badge eg-badge-lang">
                      <Languages size={11} strokeWidth={2.5} />
                      {language}
                    </span>
                  )}
                </div>

                <div className="eg-tabs">
                  <button className={`eg-tab ${activeTab === "preview" ? "eg-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`eg-tab ${activeTab === "raw"     ? "eg-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw Text</button>
                </div>

                <div className="eg-actions">
                  <button className="eg-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="eg-action-btn" onClick={handleDownload} title="Download email">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`eg-copy-btn ${copied === "all" ? "eg-copied" : ""}`} onClick={() => handleCopy("all")}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* Preview view */}
              {activeTab === "preview" && (
                <div className="eg-email-preview">

                  {/* Subject line */}
                  <div className="eg-subject-block">
                    <div className="eg-subject-row">
                      <span className="eg-subject-label">Subject</span>
                      <button
                        className={`eg-mini-copy ${copied === "subject" ? "eg-copied" : ""}`}
                        onClick={() => handleCopy("subject")}
                      >
                        {copied === "subject"
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <p className="eg-subject-text">{result.subject}</p>
                  </div>

                  {/* Body */}
                  <div className="eg-body-block">
                    <div className="eg-subject-row">
                      <span className="eg-subject-label">Body</span>
                      <button
                        className={`eg-mini-copy ${copied === "body" ? "eg-copied" : ""}`}
                        onClick={() => handleCopy("body")}
                      >
                        {copied === "body"
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <pre className="eg-body-text">{result.body}</pre>
                  </div>
                </div>
              )}

              {/* Raw view */}
              {activeTab === "raw" && (
                <pre className="eg-raw">{`Subject: ${result.subject}\n\n${result.body}`}</pre>
              )}

              {/* Footer */}
              <div className="eg-result-footer">
                <span className="eg-footer-count">
                  ~{result.body.split(/\s+/).filter(Boolean).length} words in body
                </span>
                <button className={`eg-copy-full ${copied === "all" ? "eg-copied" : ""}`} onClick={() => handleCopy("all")}>
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Full Email</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
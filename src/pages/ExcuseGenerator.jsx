/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./ExcuseGenerator.css";
import { Helmet } from "react-helmet";
import {
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Clock,
  Car,
  Stethoscope,
  GraduationCap,
  Wifi,
  PartyPopper,
  Home,
  Frown,
  ChevronDown,
  Languages,
  AlignLeft,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from "lucide-react";

/* ── Excuse Types ── */
const EXCUSE_TYPES = [
  { id: "late",       label: "Running Late",     icon: Clock,         desc: "Late to work/meeting"   },
  { id: "absent",     label: "Absence",           icon: Frown,         desc: "Missed day / no-show"   },
  { id: "deadline",   label: "Missed Deadline",   icon: Briefcase,     desc: "Late on a task/project" },
  { id: "noreply",    label: "No Reply",          icon: MessageSquare, desc: "Didn't respond in time" },
  { id: "skipevent",  label: "Skipped Event",     icon: PartyPopper,   desc: "Missed party / hangout" },
  { id: "traffic",    label: "Traffic / Travel",  icon: Car,           desc: "Commute gone wrong"     },
  { id: "sick",       label: "Feeling Sick",      icon: Stethoscope,   desc: "Health-related excuse"  },
  { id: "technical",  label: "Tech Issues",        icon: Wifi,          desc: "IT / internet problems" },
  { id: "family",     label: "Family Emergency",  icon: Home,          desc: "Urgent family matter"   },
  { id: "homework",   label: "Homework / Study",  icon: GraduationCap, desc: "Academic excuse"        },
  { id: "forgot",     label: "I Forgot",          icon: Zap,           desc: "Completely blanked"     },
  { id: "other",      label: "Custom",            icon: AlignLeft,     desc: "Write your own context" },
];

/* ── Recipient Options ── */
const RECIPIENTS = [
  { id: "boss",      label: "Boss / Manager" },
  { id: "coworker",  label: "Coworker"       },
  { id: "teacher",   label: "Teacher"        },
  { id: "parent",    label: "Parent"         },
  { id: "partner",   label: "Partner"        },
  { id: "friend",    label: "Friend"         },
  { id: "client",    label: "Client"         },
  { id: "other",     label: "Other"          },
];

/* ── Tone Options ── */
const TONES = [
  { id: "sincere",      label: "Sincere"       },
  { id: "professional", label: "Professional"  },
  { id: "dramatic",     label: "Dramatic"      },
  { id: "humorous",     label: "Humorous"      },
  { id: "casual",       label: "Casual"        },
  { id: "apologetic",   label: "Apologetic"    },
];

/* ── Believability ── */
const BELIEVABILITIES = [
  { id: "solid",      label: "Rock Solid",  desc: "Fully believable" },
  { id: "plausible",  label: "Plausible",   desc: "Mostly believable" },
  { id: "risky",      label: "Risky",       desc: "Pushing it a bit"  },
  { id: "outrageous", label: "Outrageous",  desc: "Pure comedy"       },
];

/* ── Language Options ── */
const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Hindi", "Arabic", "Chinese (Simplified)",
  "Japanese", "Korean",
];

/* ── Component ── */
export default function ExcuseGenerator() {
  const [excuseType,      setExcuseType]      = useState("late");
  const [situation,       setSituation]       = useState("");
  const [recipient,       setRecipient]       = useState("boss");
  const [tone,            setTone]            = useState("sincere");
  const [believability,   setBelievability]   = useState("solid");
  const [language,        setLanguage]        = useState("English");
  const [includeFollowUp, setIncludeFollowUp] = useState(true);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [result,          setResult]          = useState(null);
  const [copied,          setCopied]          = useState("");
  const [activeTab,       setActiveTab]       = useState("preview");

  const charMax   = 600;
  const canSubmit = situation.trim().length > 3 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectedType          = EXCUSE_TYPES.find(t => t.id === excuseType);
    const selectedRecipient     = RECIPIENTS.find(r => r.id === recipient);
    const selectedBelievability = BELIEVABILITIES.find(b => b.id === believability);

    const prompt = `You are a creative excuse-writing expert. Generate a convincing, well-crafted excuse.

Excuse Type: ${selectedType?.label} — ${selectedType?.desc}
Situation / Context: ${situation.trim()}
Recipient: ${selectedRecipient?.label}
Tone: ${tone}
Believability Level: ${selectedBelievability?.label} — ${selectedBelievability?.desc}
Language: ${language}
Include Follow-Up Message: ${includeFollowUp ? "Yes" : "No"}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro text, no explanation, no markdown.
Exact required shape:
{ "excuse": "...", "followUp": "...", "riskLevel": "Low|Medium|High", "tip": "..." }

RULES:
• "excuse" — the main excuse (2–4 sentences). Match the tone and believability. Write in ${language}.
• "followUp" — ${includeFollowUp ? `a short 1–2 sentence follow-up the person can send later to reinforce the excuse. Write in ${language}.` : 'empty string ""'}
• "riskLevel" — how risky this excuse is to use: exactly one of "Low", "Medium", or "High"
• "tip" — one short insider tip (in English) on how to deliver this excuse convincingly (max 15 words)
• Do NOT include markdown, code fences, or any text outside the JSON object.`;

    try {
      const res = await generateAI("excuse-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/, "")
        .trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.excuse) throw new Error("Invalid response format");

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
      part === "excuse"   ? result.excuse :
      part === "followup" ? result.followUp :
      includeFollowUp && result.followUp
        ? `${result.excuse}\n\n— Follow-up —\n${result.followUp}`
        : result.excuse;

    navigator.clipboard.writeText(text);
    setCopied(part);
    setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    let text = `Excuse:\n${result.excuse}`;
    if (includeFollowUp && result.followUp) text += `\n\nFollow-Up:\n${result.followUp}`;
    text += `\n\nRisk Level: ${result.riskLevel}\nTip: ${result.tip}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "excuse.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setSituation("");
    setResult(null); setError(""); setCopied("");
    setExcuseType("late"); setTone("sincere");
    setBelievability("solid"); setLanguage("English");
    setRecipient("boss"); setIncludeFollowUp(true);
  }

  const selectedTypeData = EXCUSE_TYPES.find(t => t.id === excuseType);
  const TypeIcon = selectedTypeData?.icon;

  const riskColor =
    result?.riskLevel === "Low"    ? "xg-risk-low"  :
    result?.riskLevel === "Medium" ? "xg-risk-med"  :
    "xg-risk-high";

  return (
    <>
      <Helmet>
        <title>Free AI Excuse Generator – Believable Excuses Instantly | ShauryaTools</title>
        <meta name="description" content="Generate convincing, creative excuses instantly with AI. Choose from 12 excuse types, set your tone, believability and recipient. Free AI excuse writer tool." />
        <meta name="keywords" content="excuse generator, ai excuse maker, excuse writer, funny excuses, work excuse, late excuse, ai excuse tool, believable excuses" />
        <link rel="canonical" href="https://shauryatools.vercel.app/excuse-generator" />
      </Helmet>

      <div className="eg-page">
        <div className="eg-inner">

          {/* ── Header ── */}
          <div className="eg-header">
            <div className="eg-icon xg-icon">
              <ShieldAlert size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="eg-cat xg-cat">AI Productivity Tools</span>
              <h1>Excuse Generator</h1>
              <p>Describe your situation — get a convincing, ready-to-use excuse instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="eg-card">

            {/* Excuse Type */}
            <div className="eg-field">
              <div className="eg-label-row">
                <label className="eg-label">Excuse Type</label>
                {selectedTypeData && (
                  <span className="eg-selected-badge xg-selected-badge">
                    {TypeIcon && <TypeIcon size={11} strokeWidth={2.5} />}
                    {selectedTypeData.label}
                  </span>
                )}
              </div>
              <div className="eg-types">
                {EXCUSE_TYPES.map(t => {
                  const Icon = t.icon;
                  const isOn = excuseType === t.id;
                  return (
                    <button
                      key={t.id}
                      className={`eg-type-btn ${isOn ? "xg-type-on" : ""}`}
                      onClick={() => setExcuseType(t.id)}
                    >
                      <Icon size={15} strokeWidth={2} className={`eg-type-icon ${isOn ? "xg-icon-on" : ""}`} />
                      <span className={`eg-type-label ${isOn ? "xg-label-on" : ""}`}>{t.label}</span>
                      <span className={`eg-type-desc  ${isOn ? "xg-desc-on"  : ""}`}>{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eg-divider" />

            {/* Situation */}
            <div className="eg-field">
              <div className="eg-label-row">
                <label className="eg-label">
                  <AlignLeft size={14} strokeWidth={2.5} className="eg-label-icon xg-label-icon" />
                  Your Situation
                </label>
                <span className={`eg-char-count ${situation.length > charMax * 0.9 ? "eg-char-warn" : ""}`}>
                  {situation.length}/{charMax}
                </span>
              </div>
              <textarea
                className="eg-textarea xg-textarea"
                value={situation}
                onChange={e => {
                  if (e.target.value.length <= charMax) {
                    setSituation(e.target.value);
                    setError("");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder={
                  excuseType === "late"      ? "e.g. I'm 40 mins late to a Monday morning team standup..." :
                  excuseType === "deadline"  ? "e.g. I missed submitting the Q3 report my manager needed today..." :
                  excuseType === "sick"      ? "e.g. Need to skip work tomorrow but don't want to use a sick day..." :
                  excuseType === "skipevent" ? "e.g. My friend's birthday dinner that I already RSVP'd yes to..." :
                  excuseType === "noreply"   ? "e.g. Didn't reply to an important client email for 3 days..." :
                  excuseType === "homework"  ? "e.g. Didn't finish the essay that's due first thing in class..." :
                                               "Briefly describe what happened or what you need an excuse for..."
                }
                rows={4}
              />
            </div>

            <div className="eg-divider" />

            {/* Recipient + Language */}
            <div className="eg-row">
              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <Users size={14} strokeWidth={2.5} className="eg-label-icon xg-label-icon" />
                  Recipient
                </label>
                <div className="eg-select-wrap">
                  <select
                    className="eg-select xg-select"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                  >
                    {RECIPIENTS.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="eg-select-arrow" />
                </div>
              </div>

              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <Languages size={14} strokeWidth={2.5} className="eg-label-icon xg-label-icon" />
                  Language
                </label>
                <div className="eg-select-wrap">
                  <select
                    className="eg-select xg-select"
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

            {/* Believability + Follow-up toggle */}
            <div className="eg-row">
              <div className="eg-field eg-field-half">
                <label className="eg-label">Believability</label>
                <div className="eg-lengths">
                  {BELIEVABILITIES.map(b => {
                    const isOn = believability === b.id;
                    return (
                      <button
                        key={b.id}
                        className={`eg-length-btn ${isOn ? "xg-bel-on" : ""}`}
                        onClick={() => setBelievability(b.id)}
                      >
                        <span className={`eg-len-label ${isOn ? "xg-bel-label" : ""}`}>{b.label}</span>
                        <span className={`eg-len-desc  ${isOn ? "xg-bel-desc"  : ""}`}>{b.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="eg-field eg-field-half">
                <label className="eg-label">Options</label>
                <div className="xg-toggle-row">
                  <button
                    className={`xg-toggle-btn ${includeFollowUp ? "xg-tog-on" : ""}`}
                    onClick={() => setIncludeFollowUp(v => !v)}
                    aria-label="Toggle follow-up"
                  >
                    <span className="xg-tog-knob" />
                  </button>
                  <span className="xg-toggle-label">Generate follow-up message</span>
                </div>
                <p className="xg-toggle-hint">A short follow-up you can send later to reinforce your excuse.</p>
              </div>
            </div>

            {error && (
              <div className="eg-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button className="eg-gen-btn xg-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="eg-spinner" /> Crafting Excuse...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Excuse</>}
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
              <div className="eg-skel eg-skel-short" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="eg-card animate-in">

              {/* Top bar */}
              <div className="eg-result-top">
                <div className="eg-result-meta">
                  {TypeIcon && (
                    <span className="eg-result-badge xg-result-badge">
                      <TypeIcon size={11} strokeWidth={2.5} />
                      {selectedTypeData?.label}
                    </span>
                  )}
                  <span className="eg-result-badge eg-badge-tone">{tone}</span>
                  {result.riskLevel && (
                    <span className={`eg-result-badge xg-risk-badge ${riskColor}`}>
                      {result.riskLevel === "Low"    && <ThumbsUp    size={11} strokeWidth={2.5} />}
                      {result.riskLevel === "Medium" && <ShieldAlert size={11} strokeWidth={2.5} />}
                      {result.riskLevel === "High"   && <ThumbsDown  size={11} strokeWidth={2.5} />}
                      {result.riskLevel} Risk
                    </span>
                  )}
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
                  <button className="eg-action-btn" onClick={handleDownload} title="Download excuse">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`eg-copy-btn ${copied === "all" ? "eg-copied" : ""}`} onClick={() => handleCopy("all")}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* Preview */}
              {activeTab === "preview" && (
                <div className="eg-email-preview">

                  <div className="eg-subject-block xg-excuse-block">
                    <div className="eg-subject-row">
                      <span className="eg-subject-label">Your Excuse</span>
                      <button
                        className={`eg-mini-copy ${copied === "excuse" ? "eg-copied" : ""}`}
                        onClick={() => handleCopy("excuse")}
                      >
                        {copied === "excuse"
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <pre className="eg-body-text">{result.excuse}</pre>
                  </div>

                  {includeFollowUp && result.followUp && (
                    <div className="eg-body-block xg-followup-block">
                      <div className="eg-subject-row">
                        <span className="eg-subject-label">Follow-Up Message</span>
                        <button
                          className={`eg-mini-copy ${copied === "followup" ? "eg-copied" : ""}`}
                          onClick={() => handleCopy("followup")}
                        >
                          {copied === "followup"
                            ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                            : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                        </button>
                      </div>
                      <pre className="eg-body-text">{result.followUp}</pre>
                    </div>
                  )}

                  {result.tip && (
                    <div className="xg-tip-block">
                      <Zap size={13} strokeWidth={2.5} className="xg-tip-icon" />
                      <span><strong>Pro tip:</strong> {result.tip}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Raw */}
              {activeTab === "raw" && (
                <pre className="eg-raw">
{`Excuse:\n${result.excuse}${includeFollowUp && result.followUp ? `\n\nFollow-Up:\n${result.followUp}` : ""}\n\nRisk Level: ${result.riskLevel}\nTip: ${result.tip}`}
                </pre>
              )}

              {/* Footer */}
              <div className="eg-result-footer">
                <span className="eg-footer-count">
                  ~{result.excuse.split(/\s+/).filter(Boolean).length} words in excuse
                </span>
                <button
                  className={`eg-copy-full xg-copy-full ${copied === "all" ? "eg-copied xg-copy-full-copied" : ""}`}
                  onClick={() => handleCopy("all")}
                >
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Excuse</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
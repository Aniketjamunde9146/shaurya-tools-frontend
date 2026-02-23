/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./WhatsAppGenerator.css";
import { Helmet } from "react-helmet";
import {
  MessageCircle,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Code2,
  Paintbrush,
  PenTool,
  Video,
  TrendingUp,
  Camera,
  Globe,
  Megaphone,
  BarChart2,
  Wrench,
  BookOpen,
  Music,
  ChevronDown,
  User,
  Building2,
  Target,
  Briefcase,
  DollarSign,
  Star,
  Link,
  Zap,
  MessageSquare,
  Clock,
  Repeat2,
} from "lucide-react";

/* ── Freelancer Skills ── */
const SKILLS = [
  { id: "webdev",       label: "Web Dev",       icon: Code2,       desc: "React, Node, Full-stack"  },
  { id: "design",       label: "UI/UX Design",  icon: Paintbrush,  desc: "Figma, Prototyping"       },
  { id: "copywriting",  label: "Copywriting",   icon: PenTool,     desc: "Sales copy & content"     },
  { id: "video",        label: "Video Editing", icon: Video,       desc: "Reels, YT, Ads"           },
  { id: "seo",          label: "SEO",           icon: TrendingUp,  desc: "Rankings & traffic"       },
  { id: "photo",        label: "Photography",   icon: Camera,      desc: "Brand & product shoots"   },
  { id: "webdesign",    label: "Web Design",    icon: Globe,       desc: "Webflow, Framer, WP"      },
  { id: "smm",          label: "Social Media",  icon: Megaphone,   desc: "Content & management"     },
  { id: "dataanalysis", label: "Data Analysis", icon: BarChart2,   desc: "Python, Excel, Tableau"   },
  { id: "automation",   label: "Automation",    icon: Wrench,      desc: "Zapier, Make, scripts"    },
  { id: "ghostwriting", label: "Ghostwriting",  icon: BookOpen,    desc: "Articles, books, scripts" },
  { id: "music",        label: "Music / Audio", icon: Music,       desc: "Jingles, podcast, VO"     },
];

/* ── Target Industries ── */
const INDUSTRIES = [
  { id: "saas",        label: "SaaS / Tech"       },
  { id: "ecommerce",   label: "E-commerce"        },
  { id: "agency",      label: "Agency"            },
  { id: "realestate",  label: "Real Estate"       },
  { id: "health",      label: "Health & Wellness" },
  { id: "finance",     label: "Finance"           },
  { id: "restaurant",  label: "Food & Restaurant" },
  { id: "education",   label: "Education"         },
  { id: "fashion",     label: "Fashion / Retail"  },
  { id: "startup",     label: "Startup"           },
];

/* ── Message Goals ── */
const GOALS = [
  { id: "intro",         label: "Introduce Myself"    },
  { id: "discovery",     label: "Book a Quick Call"   },
  { id: "portfolio",     label: "Share Portfolio"     },
  { id: "free_audit",    label: "Offer Free Audit"    },
  { id: "follow_up",     label: "Follow Up"           },
  { id: "close",         label: "Close the Deal"      },
];

/* ── Tone Options ── */
const TONES = [
  { id: "friendly",     label: "Friendly 😊"   },
  { id: "professional", label: "Professional"  },
  { id: "casual",       label: "Casual & Real" },
  { id: "confident",    label: "Confident"     },
  { id: "humble",       label: "Humble"        },
  { id: "bold",         label: "Bold"          },
];

/* ── Message Length ── */
const LENGTHS = [
  { id: "very_short", label: "Very Short", desc: "2–3 lines"  },
  { id: "short",      label: "Short",      desc: "5–7 lines"  },
  { id: "medium",     label: "Medium",     desc: "~10 lines"  },
];

/* ── Follow-up ── */
const SEQUENCES = [
  { id: "none",  label: "Just 1 message"         },
  { id: "fu1",   label: "+ 1 Follow-up"          },
  { id: "fu2",   label: "+ 2 Follow-ups (series)"},
];

export default function WhatsAppGenerator() {
  const [skill,           setSkill]           = useState("webdev");
  const [industry,        setIndustry]        = useState("saas");
  const [goal,            setGoal]            = useState("intro");
  const [tone,            setTone]            = useState("friendly");
  const [length,          setLength]          = useState("short");
  const [sequence,        setSequence]        = useState("none");
  const [freelancerName,  setFreelancerName]  = useState("");
  const [achievement,     setAchievement]     = useState("");
  const [portfolioLink,   setPortfolioLink]   = useState("");
  const [prospectName,    setProspectName]    = useState("");
  const [prospectCompany, setProspectCompany] = useState("");
  const [painPoint,       setPainPoint]       = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState(null);
  const [copied,   setCopied]   = useState("");
  const [activeTab,setActiveTab]= useState("msg1");

  const canSubmit = !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectedSkill    = SKILLS.find(s => s.id === skill);
    const selectedIndustry = INDUSTRIES.find(i => i.id === industry);
    const selectedGoal     = GOALS.find(g => g.id === goal);
    const selectedLength   = LENGTHS.find(l => l.id === length);
    const selectedTone     = TONES.find(t => t.id === tone);
    const followUpCount    = sequence === "fu2" ? 2 : sequence === "fu1" ? 1 : 0;

    const prompt = `You are an expert WhatsApp outreach copywriter for freelancers. Write a high-converting WhatsApp cold message (NOT an email — it must feel like a natural WhatsApp text, short, human, no formal sign-offs or subject lines).

FREELANCER PROFILE:
- Skill: ${selectedSkill?.label} — ${selectedSkill?.desc}
${freelancerName.trim()  ? `- Name: ${freelancerName.trim()}`                          : "- Name: [Your Name]"}
${achievement.trim()     ? `- Social Proof: ${achievement.trim()}`                     : ""}
${portfolioLink.trim()   ? `- Portfolio: ${portfolioLink.trim()}`                      : ""}

PROSPECT:
- Industry: ${selectedIndustry?.label}
${prospectName.trim()    ? `- Name: ${prospectName.trim()}`                            : "- Name: [First Name]"}
${prospectCompany.trim() ? `- Company: ${prospectCompany.trim()}`                      : ""}
${painPoint.trim()       ? `- Pain point / context: ${painPoint.trim()}`               : ""}

SETTINGS:
- Goal: ${selectedGoal?.label}
- Tone: ${selectedTone?.label}
- Length: ${selectedLength?.label} (${selectedLength?.desc})
- Follow-ups needed: ${followUpCount}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro, no markdown, no code fences.
${followUpCount === 0 ? `Shape: { "msg1": "..." }` : ""}
${followUpCount === 1 ? `Shape: { "msg1": "...", "fu1": "..." }` : ""}
${followUpCount === 2 ? `Shape: { "msg1": "...", "fu1": "...", "fu2": "..." }` : ""}

CRITICAL WHATSAPP RULES:
• Sound like a REAL person texting, NOT an email.
• Use short sentences. Use line breaks (\\n) generously — like real WhatsApp formatting.
• WhatsApp bold = *word*, italic = _word_. Use sparingly and naturally.
• NO subject line. NO "Dear", NO "I hope this finds you well", NO formal sign-offs like "Regards".
• Start with something that shows you noticed THEM — their business, niche, or a specific pain.
• Drop social proof naturally in 1 line — not a list, not a resume.
• ONE soft CTA at the end — a question, not a command. e.g. "Would that be useful?" or "Worth a quick chat?"
• Emojis: use 1–2 max. Only if tone allows it.
• Follow-up #1 (if needed): Send 2–3 days later. New angle or nudge. Very short. Still human.
• Follow-up #2 (if needed): Breakup message. 2–3 lines. Lighthearted, zero pressure, leave door open.
• Sign with just ${freelancerName.trim() || "your first name"} — no title, no company, no links unless portfolio was provided.
• Use \\n for line breaks within the message text.`;

    try {
      const res = await generateAI("wa-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.msg1) throw new Error("Invalid response format");

      setResult(parsed);
      setActiveTab("msg1");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(key) {
    if (!result) return;
    let text = "";
    if (key === "all") {
      text = result.msg1;
      if (result.fu1) text += `\n\n--- Follow-up 1 ---\n${result.fu1}`;
      if (result.fu2) text += `\n\n--- Follow-up 2 ---\n${result.fu2}`;
    } else {
      text = result[key] || "";
    }
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    let text = `WhatsApp Cold Message\n${"─".repeat(30)}\n${result.msg1}`;
    if (result.fu1) text += `\n\n${"─".repeat(30)}\nFollow-up #1 (send ~3 days later)\n${"─".repeat(30)}\n${result.fu1}`;
    if (result.fu2) text += `\n\n${"─".repeat(30)}\nFollow-up #2 (breakup msg)\n${"─".repeat(30)}\n${result.fu2}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "whatsapp-messages.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setSkill("webdev"); setIndustry("saas"); setGoal("intro");
    setTone("friendly"); setLength("short"); setSequence("none");
    setFreelancerName(""); setAchievement(""); setPortfolioLink("");
    setProspectName(""); setProspectCompany(""); setPainPoint("");
    setResult(null); setError(""); setCopied("");
  }

  const selectedSkillData = SKILLS.find(s => s.id === skill);
  const SkillIcon = selectedSkillData?.icon;

  const tabList = result
    ? [
        { key: "msg1", label: "Message 1", icon: MessageSquare },
        ...(result.fu1 ? [{ key: "fu1", label: "Follow-up 1", icon: Repeat2 }] : []),
        ...(result.fu2 ? [{ key: "fu2", label: "Follow-up 2", icon: Clock }] : []),
      ]
    : [];

  /* Render WhatsApp-style bold/italic */
  function renderWAText(text) {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*[^*]+\*|_[^_]+_)/g).map((part, j) => {
        if (part.startsWith("*") && part.endsWith("*"))
          return <strong key={j}>{part.slice(1, -1)}</strong>;
        if (part.startsWith("_") && part.endsWith("_"))
          return <em key={j}>{part.slice(1, -1)}</em>;
        return part;
      });
      return <span key={i} className="wa-line">{parts}{i < text.split("\n").length - 1 && <br />}</span>;
    });
  }

  const currentMsg = result?.[activeTab] || "";

  return (
    <>
      <Helmet>
        <title>AI WhatsApp Cold Message Generator for Freelancers | ShauryaTools</title>
        <meta name="description" content="Generate high-converting WhatsApp cold messages for freelancers. Personalized outreach with follow-up sequences. Free AI tool." />
        <meta name="keywords" content="whatsapp cold message, freelancer whatsapp outreach, whatsapp message generator, cold message for freelancers, ai whatsapp tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/whatsapp-generator" />
      </Helmet>

      <div className="wa-page">
        <div className="wa-inner">

          {/* ── Header ── */}
          <div className="wa-header">
            <div className="wa-icon">
              <MessageCircle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="wa-cat">Freelancer Tools</span>
              <h1>WhatsApp Message Generator</h1>
              <p>Write cold WhatsApp messages that sound human, not spammy — and actually get replies.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="wa-card">

            {/* YOUR SKILL */}
            <div className="wa-section-head">
              <Briefcase size={13} strokeWidth={2.5} /> Your Service
            </div>

            <div className="wa-field">
              <div className="wa-label-row">
                <label className="wa-label">What do you do?</label>
                {selectedSkillData && (
                  <span className="wa-selected-badge">
                    {SkillIcon && <SkillIcon size={11} strokeWidth={2.5} />}
                    {selectedSkillData.label}
                  </span>
                )}
              </div>
              <div className="wa-skills">
                {SKILLS.map(s => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id}
                      className={`wa-skill-btn ${skill === s.id ? "wa-skill-on" : ""}`}
                      onClick={() => setSkill(s.id)}>
                      <Icon size={14} strokeWidth={2} className="wa-skill-icon" />
                      <span className="wa-skill-label">{s.label}</span>
                      <span className="wa-skill-desc">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="wa-row wa-row-3">
              <div className="wa-field">
                <label className="wa-label"><User size={13} className="wa-label-icon" /> Your Name</label>
                <input className="wa-input" type="text" value={freelancerName}
                  onChange={e => setFreelancerName(e.target.value)} placeholder="e.g. Aryan" />
              </div>
              <div className="wa-field">
                <label className="wa-label"><Star size={13} className="wa-label-icon" /> Social Proof</label>
                <input className="wa-input" type="text" value={achievement}
                  onChange={e => setAchievement(e.target.value)} placeholder="e.g. helped 12 brands grow revenue" />
              </div>
              <div className="wa-field">
                <label className="wa-label"><Link size={13} className="wa-label-icon" /> Portfolio Link</label>
                <input className="wa-input" type="text" value={portfolioLink}
                  onChange={e => setPortfolioLink(e.target.value)} placeholder="e.g. aryan.design" />
              </div>
            </div>

            <div className="wa-divider" />

            {/* PROSPECT */}
            <div className="wa-section-head">
              <Target size={13} strokeWidth={2.5} /> Your Prospect
            </div>

            <div className="wa-field">
              <label className="wa-label">Target Industry</label>
              <div className="wa-industries">
                {INDUSTRIES.map(ind => (
                  <button key={ind.id}
                    className={`wa-industry-btn ${industry === ind.id ? "wa-industry-on" : ""}`}
                    onClick={() => setIndustry(ind.id)}>
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="wa-row">
              <div className="wa-field">
                <label className="wa-label"><User size={13} className="wa-label-icon" /> Their First Name</label>
                <input className="wa-input" type="text" value={prospectName}
                  onChange={e => setProspectName(e.target.value)} placeholder="e.g. Sarah" />
              </div>
              <div className="wa-field">
                <label className="wa-label"><Building2 size={13} className="wa-label-icon" /> Their Company</label>
                <input className="wa-input" type="text" value={prospectCompany}
                  onChange={e => setProspectCompany(e.target.value)} placeholder="e.g. Growify Inc." />
              </div>
            </div>

            <div className="wa-field">
              <label className="wa-label">
                <Target size={13} className="wa-label-icon" /> Pain Point / Context
                <span className="wa-optional-tag">optional but powerful</span>
              </label>
              <input className="wa-input" type="text" value={painPoint}
                onChange={e => setPainPoint(e.target.value)}
                placeholder="e.g. Their Instagram hasn't been active in 3 months" />
            </div>

            <div className="wa-divider" />

            {/* MESSAGE SETTINGS */}
            <div className="wa-section-head">
              <MessageCircle size={13} strokeWidth={2.5} /> Message Settings
            </div>

            {/* Goal */}
            <div className="wa-field">
              <label className="wa-label">Message Goal</label>
              <div className="wa-goals">
                {GOALS.map(g => (
                  <button key={g.id}
                    className={`wa-goal-btn ${goal === g.id ? "wa-goal-on" : ""}`}
                    onClick={() => setGoal(g.id)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="wa-field">
              <label className="wa-label">Tone</label>
              <div className="wa-tones">
                {TONES.map(t => (
                  <button key={t.id}
                    className={`wa-tone-btn ${tone === t.id ? "wa-tone-on" : ""}`}
                    onClick={() => setTone(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="wa-row wa-row-3">
              {/* Length */}
              <div className="wa-field">
                <label className="wa-label">Message Length</label>
                <div className="wa-lengths">
                  {LENGTHS.map(l => (
                    <button key={l.id}
                      className={`wa-length-btn ${length === l.id ? "wa-len-on" : ""}`}
                      onClick={() => setLength(l.id)}>
                      <span className="wa-len-label">{l.label}</span>
                      <span className="wa-len-desc">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sequence */}
              <div className="wa-field">
                <label className="wa-label"><Repeat2 size={13} className="wa-label-icon" /> Follow-up Series</label>
                <div className="wa-select-wrap">
                  <select className="wa-select" value={sequence} onChange={e => setSequence(e.target.value)}>
                    {SEQUENCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="wa-select-arrow" />
                </div>
                {sequence !== "none" && (
                  <p className="wa-seq-hint">
                    {sequence === "fu1" ? "Message + follow-up after ~3 days" : "Full 3-message WhatsApp series"}
                  </p>
                )}
              </div>

              {/* WA tips */}
              <div className="wa-field">
                <label className="wa-label"><Zap size={13} className="wa-label-icon" /> WA Format Tips</label>
                <div className="wa-tips-box">
                  <span>*text* = <strong>bold</strong></span>
                  <span>_text_ = <em>italic</em></span>
                  <span>Short lines = more replies</span>
                  <span>1 CTA = better conversion</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="wa-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} /> {error}
              </div>
            )}

            <button className="wa-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="wa-spinner" /> Writing Message...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate WhatsApp Message{sequence !== "none" ? "s" : ""}</>}
            </button>

            <p className="wa-hint">Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="wa-card wa-skeleton-card animate-in">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`wa-skel ${i % 3 === 0 ? "wa-skel-short" : i % 3 === 1 ? "wa-skel-med" : ""}`} />
              ))}
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="wa-card animate-in">

              {/* Top bar */}
              <div className="wa-result-top">
                <div className="wa-result-meta">
                  {SkillIcon && (
                    <span className="wa-result-badge">
                      <SkillIcon size={11} strokeWidth={2.5} /> {selectedSkillData?.label}
                    </span>
                  )}
                  <span className="wa-result-badge wa-badge-goal">
                    {GOALS.find(g => g.id === goal)?.label}
                  </span>
                  <span className="wa-result-badge wa-badge-tone">{tone}</span>
                  {result.fu1 && (
                    <span className="wa-result-badge wa-badge-seq">
                      {result.fu2 ? "3-msg Series" : "2-msg Series"}
                    </span>
                  )}
                </div>

                <div className="wa-tabs">
                  {tabList.map(tab => {
                    const TabIcon = tab.icon;
                    return (
                      <button key={tab.key}
                        className={`wa-tab ${activeTab === tab.key ? "wa-tab-on" : ""}`}
                        onClick={() => setActiveTab(tab.key)}>
                        <TabIcon size={12} strokeWidth={2.5} /> {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="wa-actions">
                  <button className="wa-action-btn" onClick={handleReset}><RefreshCw size={13} strokeWidth={2.5} /> New</button>
                  <button className="wa-action-btn" onClick={handleDownload}><Download size={13} strokeWidth={2.5} /> Save</button>
                  <button className={`wa-copy-btn ${copied === "all" ? "wa-copied" : ""}`} onClick={() => handleCopy("all")}>
                    {copied === "all" ? <><Check size={13} strokeWidth={2.5} /> Copied!</> : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* ── WhatsApp Phone Preview ── */}
              <div className="wa-phone-wrap">
                <div className="wa-phone">
                  {/* Phone top bar */}
                  <div className="wa-phone-bar">
                    <div className="wa-phone-avatar">
                      {prospectName ? prospectName[0].toUpperCase() : "?"}
                    </div>
                    <div className="wa-phone-info">
                      <span className="wa-phone-name">{prospectName || "Prospect"}</span>
                      <span className="wa-phone-status">online</span>
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="wa-chat-area">
                    <div className="wa-date-pill">Today</div>

                    {/* Sent bubble */}
                    <div className="wa-bubble-wrap wa-bubble-sent">
                      <div className="wa-bubble">
                        <p className="wa-bubble-text">{renderWAText(currentMsg)}</p>
                        <span className="wa-bubble-time">
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          <svg className="wa-tick" viewBox="0 0 18 18" fill="none">
                            <path d="M3 9l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 9l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="wa-phone-input-bar">
                    <span className="wa-phone-placeholder">Message</span>
                  </div>
                </div>

                {/* Copy button beside phone */}
                <div className="wa-phone-aside">
                  <div className="wa-aside-label">
                    {activeTab === "msg1" ? "Cold Message" : activeTab === "fu1" ? "Follow-up #1" : "Follow-up #2"}
                  </div>
                  <pre className="wa-raw-text">{currentMsg}</pre>
                  <button
                    className={`wa-copy-this ${copied === activeTab ? "wa-copied" : ""}`}
                    onClick={() => handleCopy(activeTab)}
                  >
                    {copied === activeTab
                      ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={14} strokeWidth={2.5} /> Copy This Message</>}
                  </button>
                  <p className="wa-char-count">
                    {currentMsg.length} chars · ~{currentMsg.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="wa-result-footer">
                <span className="wa-footer-info">
                  {result.fu1 ? `${tabList.length}-message WhatsApp series` : "Single WhatsApp message"}
                </span>
                <button className={`wa-copy-full ${copied === "all" ? "wa-copied" : ""}`} onClick={() => handleCopy("all")}>
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy All Messages</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
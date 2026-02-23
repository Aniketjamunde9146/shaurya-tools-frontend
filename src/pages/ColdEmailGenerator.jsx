/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./ColdEmailGenerator.css";
import { Helmet } from "react-helmet";
import {
  Zap,
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
  Mail,
  Link,
  Star,
} from "lucide-react";

/* ── Freelancer Skills ── */
const SKILLS = [
  { id: "webdev",      label: "Web Dev",         icon: Code2,      desc: "React, Node, Full-stack"   },
  { id: "design",      label: "UI/UX Design",     icon: Paintbrush, desc: "Figma, Prototyping"        },
  { id: "copywriting", label: "Copywriting",      icon: PenTool,    desc: "Sales copy & content"      },
  { id: "video",       label: "Video Editing",    icon: Video,      desc: "Reels, YT, Ads"            },
  { id: "seo",         label: "SEO",              icon: TrendingUp, desc: "Rankings & traffic"        },
  { id: "photo",       label: "Photography",      icon: Camera,     desc: "Brand & product shoots"    },
  { id: "webdesign",   label: "Web Design",       icon: Globe,      desc: "Webflow, Framer, WP"       },
  { id: "smm",         label: "Social Media",     icon: Megaphone,  desc: "Content & management"      },
  { id: "dataanalysis",label: "Data Analysis",    icon: BarChart2,  desc: "Python, Excel, Tableau"    },
  { id: "automation",  label: "Automation",       icon: Wrench,     desc: "Zapier, Make, scripts"     },
  { id: "ghostwriting",label: "Ghostwriting",     icon: BookOpen,   desc: "Articles, books, scripts"  },
  { id: "music",       label: "Music / Audio",    icon: Music,      desc: "Jingles, podcast, VO"      },
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

/* ── Email Goals ── */
const GOALS = [
  { id: "discovery_call", label: "Book a Discovery Call" },
  { id: "portfolio_view", label: "View My Portfolio"     },
  { id: "reply",          label: "Get a Reply"           },
  { id: "audit",          label: "Offer a Free Audit"    },
  { id: "proposal",       label: "Send a Proposal"       },
];

/* ── Tone Options ── */
const TONES = [
  { id: "confident",    label: "Confident"   },
  { id: "friendly",     label: "Friendly"    },
  { id: "direct",       label: "Direct"      },
  { id: "storytelling", label: "Story-Led"   },
  { id: "consultative", label: "Consultative"},
  { id: "bold",         label: "Bold"        },
];

/* ── Email Length ── */
const LENGTHS = [
  { id: "ultra_short", label: "Ultra Short", desc: "5–7 lines" },
  { id: "short",       label: "Short",       desc: "~100 words"},
  { id: "medium",      label: "Medium",      desc: "~200 words"},
];

/* ── Follow-up Sequence ── */
const SEQUENCES = [
  { id: "none",   label: "Just the cold email"        },
  { id: "fu1",    label: "+ 1 Follow-up"              },
  { id: "fu2",    label: "+ 2 Follow-ups (full seq.)" },
];

/* ── Component ── */
export default function ColdEmailGenerator() {
  const [skill,           setSkill]           = useState("webdev");
  const [industry,        setIndustry]        = useState("saas");
  const [goal,            setGoal]            = useState("discovery_call");
  const [tone,            setTone]            = useState("confident");
  const [length,          setLength]          = useState("short");
  const [sequence,        setSequence]        = useState("none");
  // Personalization fields
  const [freelancerName,  setFreelancerName]  = useState("");
  const [portfolioLink,   setPortfolioLink]   = useState("");
  const [achievement,     setAchievement]     = useState("");
  const [prospectName,    setProspectName]    = useState("");
  const [prospectCompany, setProspectCompany] = useState("");
  const [painPoint,       setPainPoint]       = useState("");
  const [rate,            setRate]            = useState("");
  // State
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [result,   setResult]   = useState(null);
  const [copied,   setCopied]   = useState("");
  const [activeTab,setActiveTab]= useState("email1");

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
    const needsFollowUps   = sequence !== "none";
    const followUpCount    = sequence === "fu2" ? 2 : sequence === "fu1" ? 1 : 0;

    const prompt = `You are an expert cold email copywriter specializing in freelancer outreach. Write high-converting cold email(s) for a freelancer reaching out to potential clients.

FREELANCER PROFILE:
- Skill/Service: ${selectedSkill?.label} — ${selectedSkill?.desc}
${freelancerName.trim()  ? `- Name: ${freelancerName.trim()}`                           : "- Name: [Your Name]"}
${achievement.trim()     ? `- Key Achievement/Social Proof: ${achievement.trim()}`      : ""}
${portfolioLink.trim()   ? `- Portfolio/Website: ${portfolioLink.trim()}`               : ""}
${rate.trim()            ? `- Pricing context: ${rate.trim()}`                          : ""}

PROSPECT PROFILE:
- Industry: ${selectedIndustry?.label}
${prospectName.trim()    ? `- Prospect Name: ${prospectName.trim()}`                    : "- Prospect Name: [First Name]"}
${prospectCompany.trim() ? `- Company: ${prospectCompany.trim()}`                       : "- Company: [Company Name]"}
${painPoint.trim()       ? `- Known pain point / context: ${painPoint.trim()}`          : ""}

EMAIL SETTINGS:
- Tone: ${selectedTone?.label}
- Length: ${selectedLength?.label} — ${selectedLength?.desc}
- Primary CTA Goal: ${selectedGoal?.label}
- Follow-ups needed: ${followUpCount}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro text, no markdown, no code fences.
${followUpCount === 0 ? `Shape: { "subject": "...", "email1": "..." }` : ""}
${followUpCount === 1 ? `Shape: { "subject": "...", "email1": "...", "fu1Subject": "...", "fu1": "..." }` : ""}
${followUpCount === 2 ? `Shape: { "subject": "...", "email1": "...", "fu1Subject": "...", "fu1": "...", "fu2Subject": "...", "fu2": "..." }` : ""}

RULES:
• "subject" — punchy, curiosity-driven subject line (max 9 words, no clickbait). No "Subject:" prefix.
• "email1" — the cold email. Hook in line 1 (mention their company or industry pain). Show relevance fast. Drop social proof naturally. ONE clear CTA matching the goal. Sign off with ${freelancerName.trim() || "[Your Name]"}.
${followUpCount >= 1 ? `• "fu1Subject" & "fu1" — Follow-up #1 sent ~3 days later. Reference the first email briefly. Add a new angle or micro-insight. Keep shorter than email1.` : ""}
${followUpCount >= 2 ? `• "fu2Subject" & "fu2" — Follow-up #2 sent ~5 days after fu1. Breakup email style — low pressure, brief, leave the door open.` : ""}
• Use \\n\\n for paragraph breaks. No HTML. No markdown. No emoji.
• Never start with "I hope this finds you well" or generic openers.
• The hook must be about THEM, not you.
• Do NOT include placeholder brackets like [X] in the final email — use smart defaults if no info is provided.`;

    try {
      const res = await generateAI("cold-email-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.subject || !parsed.email1) throw new Error("Invalid response format");

      setResult(parsed);
      setActiveTab("email1");
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
      text = `Subject: ${result.subject}\n\n${result.email1}`;
      if (result.fu1) text += `\n\n---\nFOLLOW-UP #1\nSubject: ${result.fu1Subject}\n\n${result.fu1}`;
      if (result.fu2) text += `\n\n---\nFOLLOW-UP #2\nSubject: ${result.fu2Subject}\n\n${result.fu2}`;
    } else if (key === "email1") {
      text = `Subject: ${result.subject}\n\n${result.email1}`;
    } else if (key === "fu1") {
      text = `Subject: ${result.fu1Subject}\n\n${result.fu1}`;
    } else if (key === "fu2") {
      text = `Subject: ${result.fu2Subject}\n\n${result.fu2}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    let text = `Subject: ${result.subject}\n\n${result.email1}`;
    if (result.fu1) text += `\n\n---\nFOLLOW-UP #1\nSubject: ${result.fu1Subject}\n\n${result.fu1}`;
    if (result.fu2) text += `\n\n---\nFOLLOW-UP #2\nSubject: ${result.fu2Subject}\n\n${result.fu2}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cold-email.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setSkill("webdev"); setIndustry("saas"); setGoal("discovery_call");
    setTone("confident"); setLength("short"); setSequence("none");
    setFreelancerName(""); setPortfolioLink(""); setAchievement("");
    setProspectName(""); setProspectCompany(""); setPainPoint(""); setRate("");
    setResult(null); setError(""); setCopied("");
  }

  const selectedSkillData = SKILLS.find(s => s.id === skill);
  const SkillIcon = selectedSkillData?.icon;
  const tabList = result
    ? [
        { key: "email1", label: "Cold Email" },
        ...(result.fu1 ? [{ key: "fu1", label: "Follow-up 1" }] : []),
        ...(result.fu2 ? [{ key: "fu2", label: "Follow-up 2" }] : []),
      ]
    : [];

  const currentEmailContent =
    activeTab === "email1" ? { subject: result?.subject,    body: result?.email1 } :
    activeTab === "fu1"    ? { subject: result?.fu1Subject, body: result?.fu1    } :
    activeTab === "fu2"    ? { subject: result?.fu2Subject, body: result?.fu2    } :
    null;

  return (
    <>
      <Helmet>
        <title>AI Cold Email Generator for Freelancers – Land More Clients | ShauryaTools</title>
        <meta name="description" content="Generate high-converting cold emails for freelancers. Personalized outreach for any skill, industry, and goal. Includes follow-up sequences. Free AI tool." />
        <meta name="keywords" content="cold email generator, freelancer outreach, cold email for freelancers, ai cold email, client outreach email, freelance email template" />
        <link rel="canonical" href="https://shauryatools.vercel.app/cold-email-generator" />
      </Helmet>

      <div className="ce-page">
        <div className="ce-inner">

          {/* ── Header ── */}
          <div className="ce-header">
            <div className="ce-icon">
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="ce-cat">Freelancer Tools</span>
              <h1>Cold Email Generator</h1>
              <p>Craft personalized, high-converting cold emails that land clients — with follow-up sequences built in.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="ce-card">

            {/* ── YOUR SKILL ── */}
            <div className="ce-section-head">
              <Briefcase size={14} strokeWidth={2.5} className="ce-section-icon" />
              Your Service
            </div>

            <div className="ce-field">
              <div className="ce-label-row">
                <label className="ce-label">What do you do?</label>
                {selectedSkillData && (
                  <span className="ce-selected-badge">
                    {SkillIcon && <SkillIcon size={11} strokeWidth={2.5} />}
                    {selectedSkillData.label}
                  </span>
                )}
              </div>
              <div className="ce-skills">
                {SKILLS.map(s => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      className={`ce-skill-btn ${skill === s.id ? "ce-skill-on" : ""}`}
                      onClick={() => setSkill(s.id)}
                    >
                      <Icon size={14} strokeWidth={2} className="ce-skill-icon" />
                      <span className="ce-skill-label">{s.label}</span>
                      <span className="ce-skill-desc">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Freelancer Info Row */}
            <div className="ce-row ce-row-3">
              <div className="ce-field">
                <label className="ce-label">
                  <User size={13} strokeWidth={2.5} className="ce-label-icon" /> Your Name
                </label>
                <input className="ce-input" type="text" value={freelancerName}
                  onChange={e => setFreelancerName(e.target.value)}
                  placeholder="e.g. Aryan Mehta" />
              </div>
              <div className="ce-field">
                <label className="ce-label">
                  <Star size={13} strokeWidth={2.5} className="ce-label-icon" /> Key Achievement
                </label>
                <input className="ce-input" type="text" value={achievement}
                  onChange={e => setAchievement(e.target.value)}
                  placeholder="e.g. 3x'd a SaaS client's signups" />
              </div>
              <div className="ce-field">
                <label className="ce-label">
                  <Link size={13} strokeWidth={2.5} className="ce-label-icon" /> Portfolio / Site
                </label>
                <input className="ce-input" type="text" value={portfolioLink}
                  onChange={e => setPortfolioLink(e.target.value)}
                  placeholder="e.g. aryandesigns.com" />
              </div>
            </div>

            <div className="ce-divider" />

            {/* ── PROSPECT ── */}
            <div className="ce-section-head">
              <Target size={14} strokeWidth={2.5} className="ce-section-icon" />
              Your Prospect
            </div>

            {/* Industry */}
            <div className="ce-field">
              <label className="ce-label">Target Industry</label>
              <div className="ce-industries">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind.id}
                    className={`ce-industry-btn ${industry === ind.id ? "ce-industry-on" : ""}`}
                    onClick={() => setIndustry(ind.id)}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prospect details */}
            <div className="ce-row">
              <div className="ce-field">
                <label className="ce-label">
                  <User size={13} strokeWidth={2.5} className="ce-label-icon" /> Prospect's First Name
                </label>
                <input className="ce-input" type="text" value={prospectName}
                  onChange={e => setProspectName(e.target.value)}
                  placeholder="e.g. Sarah" />
              </div>
              <div className="ce-field">
                <label className="ce-label">
                  <Building2 size={13} strokeWidth={2.5} className="ce-label-icon" /> Their Company
                </label>
                <input className="ce-input" type="text" value={prospectCompany}
                  onChange={e => setProspectCompany(e.target.value)}
                  placeholder="e.g. Growify Inc." />
              </div>
            </div>

            {/* Pain Point */}
            <div className="ce-field">
              <label className="ce-label">
                <Target size={13} strokeWidth={2.5} className="ce-label-icon" />
                Their Pain Point / Context
                <span className="ce-optional-tag">optional but powerful</span>
              </label>
              <input className="ce-input" type="text" value={painPoint}
                onChange={e => setPainPoint(e.target.value)}
                placeholder="e.g. Their website looks outdated and has poor mobile experience" />
            </div>

            <div className="ce-divider" />

            {/* ── EMAIL SETTINGS ── */}
            <div className="ce-section-head">
              <Mail size={14} strokeWidth={2.5} className="ce-section-icon" />
              Email Settings
            </div>

            {/* CTA Goal */}
            <div className="ce-field">
              <label className="ce-label">Primary Goal / CTA</label>
              <div className="ce-goals">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    className={`ce-goal-btn ${goal === g.id ? "ce-goal-on" : ""}`}
                    onClick={() => setGoal(g.id)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="ce-field">
              <label className="ce-label">Tone</label>
              <div className="ce-tones">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    className={`ce-tone-btn ${tone === t.id ? "ce-tone-on" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Length + Rate + Sequence */}
            <div className="ce-row ce-row-3">
              <div className="ce-field">
                <label className="ce-label">Email Length</label>
                <div className="ce-lengths">
                  {LENGTHS.map(l => (
                    <button
                      key={l.id}
                      className={`ce-length-btn ${length === l.id ? "ce-len-on" : ""}`}
                      onClick={() => setLength(l.id)}
                    >
                      <span className="ce-len-label">{l.label}</span>
                      <span className="ce-len-desc">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ce-field">
                <label className="ce-label">
                  <DollarSign size={13} strokeWidth={2.5} className="ce-label-icon" />
                  Rate / Budget Hint
                  <span className="ce-optional-tag">optional</span>
                </label>
                <input className="ce-input" type="text" value={rate}
                  onChange={e => setRate(e.target.value)}
                  placeholder="e.g. starting at $500/project" />
              </div>

              <div className="ce-field">
                <label className="ce-label">Follow-up Sequence</label>
                <div className="ce-select-wrap">
                  <select className="ce-select" value={sequence} onChange={e => setSequence(e.target.value)}>
                    {SEQUENCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="ce-select-arrow" />
                </div>
                {sequence !== "none" && (
                  <p className="ce-seq-hint">
                    {sequence === "fu1" ? "Cold email + 1 follow-up (sent ~3 days later)" : "Full 3-email sequence with breakup closer"}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="ce-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <button className="ce-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="ce-spinner" /> Writing Emails...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Cold Email{sequence !== "none" ? " Sequence" : ""}</>}
            </button>

            <p className="ce-hint">Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="ce-card ce-skeleton-card animate-in">
              <div className="ce-skel ce-skel-short" />
              <div className="ce-skel" />
              <div className="ce-skel" />
              <div className="ce-skel ce-skel-med" />
              <div className="ce-skel" />
              <div className="ce-skel ce-skel-short" />
              <div className="ce-skel" />
              <div className="ce-skel ce-skel-med" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="ce-card animate-in">

              {/* Top bar */}
              <div className="ce-result-top">
                <div className="ce-result-meta">
                  {SkillIcon && (
                    <span className="ce-result-badge">
                      <SkillIcon size={11} strokeWidth={2.5} />
                      {selectedSkillData?.label}
                    </span>
                  )}
                  <span className="ce-result-badge ce-badge-goal">
                    {GOALS.find(g => g.id === goal)?.label}
                  </span>
                  <span className="ce-result-badge ce-badge-tone">{tone}</span>
                  {result.fu1 && <span className="ce-result-badge ce-badge-seq">
                    {result.fu2 ? "3-Email Sequence" : "2-Email Sequence"}
                  </span>}
                </div>

                {/* Tabs */}
                <div className="ce-tabs">
                  {tabList.map(tab => (
                    <button
                      key={tab.key}
                      className={`ce-tab ${activeTab === tab.key ? "ce-tab-on" : ""}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="ce-actions">
                  <button className="ce-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="ce-action-btn" onClick={handleDownload}>
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`ce-copy-btn ${copied === "all" ? "ce-copied" : ""}`} onClick={() => handleCopy("all")}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* Email Preview */}
              {currentEmailContent && (
                <div className="ce-email-preview">
                  {/* Subject */}
                  <div className="ce-subject-block">
                    <div className="ce-section-row">
                      <span className="ce-section-label">Subject Line</span>
                      <button
                        className={`ce-mini-copy ${copied === `${activeTab}-subj` ? "ce-copied" : ""}`}
                        onClick={() => {
                          navigator.clipboard.writeText(currentEmailContent.subject);
                          setCopied(`${activeTab}-subj`);
                          setTimeout(() => setCopied(""), 2500);
                        }}
                      >
                        {copied === `${activeTab}-subj`
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <p className="ce-subject-text">{currentEmailContent.subject}</p>
                  </div>

                  {/* Body */}
                  <div className="ce-body-block">
                    <div className="ce-section-row">
                      <span className="ce-section-label">
                        {activeTab === "email1" ? "Cold Email Body" : activeTab === "fu1" ? "Follow-up #1" : "Follow-up #2 (Breakup)"}
                      </span>
                      <button
                        className={`ce-mini-copy ${copied === activeTab ? "ce-copied" : ""}`}
                        onClick={() => handleCopy(activeTab)}
                      >
                        {copied === activeTab
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <pre className="ce-body-text">{currentEmailContent.body}</pre>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="ce-result-footer">
                <span className="ce-footer-words">
                  ~{currentEmailContent?.body?.split(/\s+/).filter(Boolean).length} words
                  {result.fu1 && ` · ${tabList.length}-email sequence`}
                </span>
                <button
                  className={`ce-copy-full ${copied === "all" ? "ce-copied" : ""}`}
                  onClick={() => handleCopy("all")}
                >
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Full Sequence</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
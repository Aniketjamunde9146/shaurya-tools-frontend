/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState } from "react";
import { Helmet } from "react-helmet";
import {
  Mail, Copy, Check, Download, RefreshCw, Plus, X,
  AlertCircle, Sparkles, User, Briefcase, Building2,
  Eye, Code, ChevronDown, ChevronUp
} from "lucide-react";
import { generateAI } from "../api";
import "./CoverLetterGenerator.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/cover-letter-generator`;

/* ══════════════════════ Constants ══════════════════════ */
const TONES = [
  { id: "professional",  label: "Professional",  emoji: "💼" },
  { id: "enthusiastic",  label: "Enthusiastic",  emoji: "🔥" },
  { id: "confident",     label: "Confident",     emoji: "🎯" },
  { id: "storytelling",  label: "Storytelling",  emoji: "📖" },
  { id: "concise",       label: "Concise",       emoji: "⚡" },
  { id: "creative",      label: "Creative",      emoji: "🎨" },
];

const LENGTHS = [
  { id: "short",  label: "Short",   desc: "~200 words", value: 200 },
  { id: "medium", label: "Standard",desc: "~350 words", value: 350 },
  { id: "long",   label: "Detailed",desc: "~500 words", value: 500 },
];

const JOB_FIELDS = [
  "Software Engineering", "Data Science & AI", "Product Management",
  "UX/UI Design", "Marketing & Growth", "Finance & Accounting",
  "Human Resources", "Sales & Business Dev", "Operations & Logistics",
  "Healthcare & Medical", "Education & Teaching", "Legal & Compliance",
  "Consulting", "Content & Media", "Cybersecurity", "DevOps & Cloud",
  "Entrepreneurship", "Research & Academia",
];

const EXPERIENCE_LEVELS = [
  { id: "fresher",     label: "Fresher / Entry" },
  { id: "junior",      label: "1–3 Years"       },
  { id: "mid",         label: "3–6 Years"       },
  { id: "senior",      label: "6–10 Years"      },
  { id: "executive",   label: "10+ / Executive" },
];

const PRESETS = [
  {
    label: "Software Dev",
    data: {
      fullName: "Arjun Mehta",
      email: "arjun@email.com",
      phone: "+91 98765 43210",
      location: "Bangalore, India",
      linkedin: "linkedin.com/in/arjunmehta",
      jobTitle: "Full Stack Developer",
      company: "Google India",
      hiringManager: "",
      jobField: "Software Engineering",
      experienceLevel: "junior",
      tone: "confident",
      length: 350,
      keySkills: "React, Node.js, TypeScript, PostgreSQL, Docker, AWS",
      experience: "2 years at TechCorp building scalable web applications. Reduced API response time by 40%. Led a team of 3 junior developers.",
      whyCompany: "Google's engineering culture and the opportunity to build products used by billions of people excite me deeply.",
      achievement: "Built a real-time collaboration tool used by 10,000+ users. Hackathon winner at HackIndia 2022.",
      jobDescription: "Looking for a full stack engineer with React and Node.js experience to join our cloud infrastructure team.",
      extraNotes: "",
    },
  },
  {
    label: "Marketing",
    data: {
      fullName: "Priya Sharma",
      email: "priya@email.com",
      phone: "+91 87654 32109",
      location: "Mumbai, India",
      linkedin: "linkedin.com/in/priyasharma",
      jobTitle: "Digital Marketing Manager",
      company: "Zomato",
      hiringManager: "Ms. Ananya Singh",
      jobField: "Marketing & Growth",
      experienceLevel: "mid",
      tone: "enthusiastic",
      length: 350,
      keySkills: "SEO, Google Ads, Meta Ads, Content Strategy, HubSpot, Analytics",
      experience: "5 years in digital marketing, managed ₹50L monthly ad spend. Grew organic traffic by 120% for B2B clients.",
      whyCompany: "Zomato's bold, data-first marketing approach and its mission to transform how India eats aligns perfectly with my growth mindset.",
      achievement: "Grew company LinkedIn from 2K to 50K followers in 18 months. Delivered 3x ROAS on performance campaigns.",
      jobDescription: "Seeking a digital marketing manager to lead performance campaigns and organic growth for our restaurant discovery platform.",
      extraNotes: "",
    },
  },
  {
    label: "Fresher",
    data: {
      fullName: "Rahul Verma",
      email: "rahul@email.com",
      phone: "+91 76543 21098",
      location: "Pune, India",
      linkedin: "linkedin.com/in/rahulverma",
      jobTitle: "Software Engineer",
      company: "Infosys",
      hiringManager: "",
      jobField: "Software Engineering",
      experienceLevel: "fresher",
      tone: "professional",
      length: 200,
      keySkills: "Python, Java, React, SQL, Git, DSA",
      experience: "Internship at TechIntern Co. Developed a dashboard that improved user engagement by 25%. Fixed 30+ production bugs.",
      whyCompany: "Infosys's global reach and strong campus programs make it the ideal launchpad for my career in software engineering.",
      achievement: "2nd place in college hackathon. Built a personal finance tracker with 500+ active users.",
      jobDescription: "Entry-level software engineer position. Looking for passionate graduates with strong programming fundamentals.",
      extraNotes: "",
    },
  },
  {
    label: "Product Manager",
    data: {
      fullName: "Sneha Kapoor",
      email: "sneha@email.com",
      phone: "+91 91234 56789",
      location: "Hyderabad, India",
      linkedin: "linkedin.com/in/snehakapoor",
      jobTitle: "Senior Product Manager",
      company: "Flipkart",
      hiringManager: "Mr. Rohit Mehta",
      jobField: "Product Management",
      experienceLevel: "senior",
      tone: "storytelling",
      length: 500,
      keySkills: "Product Strategy, Roadmapping, Agile, SQL, User Research, A/B Testing",
      experience: "7 years in product management. Launched 3 products from 0 to 1. Led cross-functional teams of 20+.",
      whyCompany: "Flipkart's ambition to democratize commerce for Bharat and its culture of bold bets is exactly where I want to create impact.",
      achievement: "Launched a checkout redesign that increased conversion by 18%. Built a recommendation engine that drove ₹200Cr in incremental GMV.",
      jobDescription: "Senior PM role to own the buyer experience on Flipkart's app. Drive growth through data-driven product decisions.",
      extraNotes: "Comfortable with SQL, have worked closely with data science teams.",
    },
  },
];

const EMPTY = {
  fullName: "", email: "", phone: "", location: "", linkedin: "",
  jobTitle: "", company: "", hiringManager: "",
  jobField: "", experienceLevel: "junior",
  tone: "professional", length: 350,
  keySkills: "", experience: "", whyCompany: "",
  achievement: "", jobDescription: "", extraNotes: "",
};

/* ══════════════════════ Component ══════════════════════ */
export default function CoverLetterGenerator() {
  const [f, setF]               = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState(null);
  const [activeTab, setActiveTab] = useState("preview");
  const [copied, setCopied]     = useState("");
  const [expandedSections, setExpandedSections] = useState({
    personal: true, job: true, content: true, style: false
  });

  const set = (key) => (val) => setF(prev => ({ ...prev, [key]: val }));
  const toggleSection = (s) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));
  const applyPreset = (p) => { setF({ ...EMPTY, ...p.data }); setResult(null); setError(""); };

  /* ── Generate ── */
  async function handleGenerate() {
    if (!f.fullName.trim()) { setError("Please enter your full name."); return; }
    if (!f.jobTitle.trim()) { setError("Please enter the job title you're applying for."); return; }
    if (!f.company.trim()) { setError("Please enter the company name."); return; }
    if (!f.keySkills.trim()) { setError("Please enter your key skills."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const lengthObj = LENGTHS.find(l => l.value === f.length);
      const toneObj   = TONES.find(t => t.id === f.tone);
      const expObj    = EXPERIENCE_LEVELS.find(e => e.id === f.experienceLevel);

      const prompt = `You are an expert career coach and professional cover letter writer. Write a compelling, personalized cover letter.

APPLICANT DETAILS:
- Name: ${f.fullName}
- Email: ${f.email || "Not provided"}
- Phone: ${f.phone || "Not provided"}
- Location: ${f.location || "Not provided"}
${f.linkedin ? `- LinkedIn: ${f.linkedin}` : ""}

JOB DETAILS:
- Applying For: ${f.jobTitle}
- Company: ${f.company}
${f.hiringManager ? `- Hiring Manager: ${f.hiringManager}` : "- Hiring Manager: Unknown"}
- Job Field: ${f.jobField || "General"}
- Experience Level: ${expObj?.label}

ABOUT THE APPLICANT:
- Key Skills: ${f.keySkills}
- Experience Summary: ${f.experience || "Not provided — infer from other details"}
- Key Achievement: ${f.achievement || "Not provided"}
- Why This Company: ${f.whyCompany || "Not provided"}
${f.jobDescription ? `\nJOB DESCRIPTION (match this closely):\n${f.jobDescription}` : ""}
${f.extraNotes ? `\nEXTRA NOTES: ${f.extraNotes}` : ""}

WRITING STYLE:
- Tone: ${toneObj?.label}
- Length: ${lengthObj?.label} (~${lengthObj?.value} words)

OUTPUT: Respond ONLY with valid JSON, no markdown, no explanation:
{
  "subject_line": "Email subject line for this application (e.g. Application for Full Stack Developer – Arjun Mehta)",
  "cover_letter": "The complete cover letter in plain text. Include: date at top, proper salutation (Dear [Name]/Hiring Manager), 3-4 paragraphs, professional closing (Sincerely / Best regards), and applicant name at bottom. Use \\n for line breaks.",
  "opening_hook": "Just the first sentence — the most impactful hook line",
  "key_points": ["Key selling point 1 highlighted in the letter", "Key selling point 2", "Key selling point 3"],
  "tone_match": "One sentence on how well the tone matches the role",
  "improvement_tips": ["Tip 1 to strengthen this cover letter further", "Tip 2", "Tip 3"]
}

RULES:
- Personalize to ${f.company} specifically — mention their products, mission, or culture if known
- Open with a compelling hook, NOT "I am writing to apply for..."
- Match keywords from the job description for ATS
- Quantify achievements wherever mentioned
- Keep it human, not robotic
- End with a confident CTA (request for interview/call)
- Tone: ${toneObj?.label} throughout
- Length: strictly ~${lengthObj?.value} words`;

      const res = await generateAI("cover_letter", prompt);
      if (!res.data.success) throw new Error("ai_fail");

      let raw = res.data.data.trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("parse_fail");

      const parsed = JSON.parse(match[0]);
      setResult(parsed);
      setActiveTab("preview");
    } catch (e) {
      setError(
        e.message === "ai_fail"    ? "AI generation failed. Please try again." :
        e.message === "parse_fail" ? "Could not parse response. Please try again." :
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2500);
  };

  const handleDownload = () => {
    if (!result) return;
    const text = `Subject: ${result.subject_line}\n\n${result.cover_letter}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${f.fullName.replace(/\s+/g, "-").toLowerCase()}-cover-letter.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => { setF(EMPTY); setResult(null); setError(""); setCopied(""); };
  const canGenerate = f.fullName.trim() && f.jobTitle.trim() && f.company.trim() && f.keySkills.trim() && !loading;

  const wordCount = result?.cover_letter
    ? result.cover_letter.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <>
      <Helmet>
        <title>Free AI Cover Letter Generator – Personalized, ATS-Optimized | ShauryaTools</title>
        <meta name="description" content="Generate professional, personalized cover letters with AI. Tailored to the job, company, and your experience. Free, no sign-up required." />
        <meta name="keywords" content="cover letter generator, ai cover letter, free cover letter maker, job application letter, cover letter builder, professional cover letter" />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Free AI Cover Letter Generator – Personalized & ATS-Optimized" />
        <meta property="og:description" content="Generate professional cover letters tailored to any job and company with AI. Free, no sign-up." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Cover Letter Generator" />
        <meta name="twitter:description" content="Generate personalized, ATS-optimized cover letters with AI instantly." />
      </Helmet>

      <div className="cl-page">
        <div className="cl-inner">

          {/* Header */}
          <div className="cl-header">
            <div className="cl-icon"><Mail size={20} /></div>
            <div>
              <span className="cl-cat">Career Tools</span>
              <h1>Cover Letter Generator</h1>
              <p>Enter your details and the job — get a personalized, ATS-optimized cover letter instantly.</p>
            </div>
          </div>

          {/* Presets */}
          <div className="cl-presets">
            <span className="cl-presets-label">Quick start:</span>
            {PRESETS.map(p => (
              <button key={p.label} className="cl-preset-btn" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="cl-grid">

            {/* LEFT: Form */}
            <div className="cl-col-left">

              {/* ── Personal Info ── */}
              <div className="cl-card">
                <div className="cl-section-head" onClick={() => toggleSection("personal")}>
                  <div className="cl-section-head-left">
                    <User size={15} />
                    <span className="cl-section-title">Your Information</span>
                  </div>
                  {expandedSections.personal ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.personal && (
                  <div className="cl-form-body">
                    <div className="cl-row2">
                      <div className="cl-field">
                        <span className="cl-label">Full Name <span className="cl-req">*</span></span>
                        <input className="cl-input" value={f.fullName} onChange={e => { set("fullName")(e.target.value); setError(""); }} placeholder="e.g. Arjun Mehta" />
                      </div>
                      <div className="cl-field">
                        <span className="cl-label">Email</span>
                        <input className="cl-input" type="email" value={f.email} onChange={e => set("email")(e.target.value)} placeholder="you@email.com" />
                      </div>
                    </div>
                    <div className="cl-row2">
                      <div className="cl-field">
                        <span className="cl-label">Phone</span>
                        <input className="cl-input" value={f.phone} onChange={e => set("phone")(e.target.value)} placeholder="+91 98765 43210" />
                      </div>
                      <div className="cl-field">
                        <span className="cl-label">Location</span>
                        <input className="cl-input" value={f.location} onChange={e => set("location")(e.target.value)} placeholder="City, Country" />
                      </div>
                    </div>
                    <div className="cl-field">
                      <span className="cl-label">LinkedIn URL</span>
                      <input className="cl-input" value={f.linkedin} onChange={e => set("linkedin")(e.target.value)} placeholder="linkedin.com/in/username" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Job Details ── */}
              <div className="cl-card">
                <div className="cl-section-head" onClick={() => toggleSection("job")}>
                  <div className="cl-section-head-left">
                    <Building2 size={15} />
                    <span className="cl-section-title">Job Details</span>
                  </div>
                  {expandedSections.job ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.job && (
                  <div className="cl-form-body">
                    <div className="cl-row2">
                      <div className="cl-field">
                        <span className="cl-label">Job Title Applying For <span className="cl-req">*</span></span>
                        <input className="cl-input" value={f.jobTitle} onChange={e => { set("jobTitle")(e.target.value); setError(""); }} placeholder="e.g. Full Stack Developer" />
                      </div>
                      <div className="cl-field">
                        <span className="cl-label">Company Name <span className="cl-req">*</span></span>
                        <input className="cl-input" value={f.company} onChange={e => { set("company")(e.target.value); setError(""); }} placeholder="e.g. Google India" />
                      </div>
                    </div>
                    <div className="cl-row2">
                      <div className="cl-field">
                        <span className="cl-label">Hiring Manager <span className="cl-label-hint">— if known</span></span>
                        <input className="cl-input" value={f.hiringManager} onChange={e => set("hiringManager")(e.target.value)} placeholder="e.g. Ms. Ananya Singh" />
                      </div>
                      <div className="cl-field">
                        <span className="cl-label">Job Field</span>
                        <select className="cl-select" value={f.jobField} onChange={e => set("jobField")(e.target.value)}>
                          <option value="">Select field…</option>
                          {JOB_FIELDS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="cl-field">
                      <span className="cl-label">Job Description <span className="cl-label-hint">— paste it here for best results</span></span>
                      <textarea className="cl-textarea" value={f.jobDescription} onChange={e => set("jobDescription")(e.target.value)} placeholder="Paste the job description here — AI will tailor your letter to match it…" style={{ minHeight: 90 }} />
                    </div>
                    <div className="cl-field">
                      <span className="cl-label">Experience Level</span>
                      <div className="cl-chips">
                        {EXPERIENCE_LEVELS.map(e => (
                          <button key={e.id} className={`cl-chip ${f.experienceLevel === e.id ? "cl-chip-on" : ""}`} onClick={() => set("experienceLevel")(e.id)}>
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Content ── */}
              <div className="cl-card">
                <div className="cl-section-head" onClick={() => toggleSection("content")}>
                  <div className="cl-section-head-left">
                    <Briefcase size={15} />
                    <span className="cl-section-title">Your Experience & Achievements</span>
                  </div>
                  {expandedSections.content ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.content && (
                  <div className="cl-form-body">
                    <div className="cl-field">
                      <span className="cl-label">Key Skills <span className="cl-req">*</span> <span className="cl-label-hint">— comma-separated</span></span>
                      <input className="cl-input" value={f.keySkills} onChange={e => { set("keySkills")(e.target.value); setError(""); }} placeholder="React, Node.js, Team Leadership, Agile…" />
                    </div>
                    <div className="cl-field">
                      <span className="cl-label">Experience Summary</span>
                      <textarea className="cl-textarea" value={f.experience} onChange={e => set("experience")(e.target.value)} placeholder="Brief summary of your work experience — roles, companies, what you built or achieved…" style={{ minHeight: 75 }} />
                    </div>
                    <div className="cl-field">
                      <span className="cl-label">Top Achievement <span className="cl-label-hint">— quantify it!</span></span>
                      <textarea className="cl-textarea" value={f.achievement} onChange={e => set("achievement")(e.target.value)} placeholder="e.g. Built a dashboard used by 10,000+ users. Reduced API latency by 40%." style={{ minHeight: 60 }} />
                    </div>
                    <div className="cl-field">
                      <span className="cl-label">Why This Company?</span>
                      <textarea className="cl-textarea" value={f.whyCompany} onChange={e => set("whyCompany")(e.target.value)} placeholder="What excites you about this company specifically? Their product, mission, culture…" style={{ minHeight: 65 }} />
                    </div>
                    <div className="cl-field">
                      <span className="cl-label">Extra Notes <span className="cl-label-hint">— anything else to include</span></span>
                      <input className="cl-input" value={f.extraNotes} onChange={e => set("extraNotes")(e.target.value)} placeholder="e.g. Available to join immediately, referral from John Doe…" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Style ── */}
              <div className="cl-card">
                <div className="cl-section-head" onClick={() => toggleSection("style")}>
                  <div className="cl-section-head-left">
                    <Sparkles size={15} />
                    <span className="cl-section-title">Tone & Length</span>
                  </div>
                  {expandedSections.style ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.style && (
                  <div className="cl-form-body">
                    <div className="cl-field">
                      <span className="cl-label">Tone</span>
                      <div className="cl-chips">
                        {TONES.map(t => (
                          <button key={t.id} className={`cl-chip ${f.tone === t.id ? "cl-chip-on" : ""}`} onClick={() => set("tone")(t.id)}>
                            <span>{t.emoji}</span><span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="cl-field">
                      <span className="cl-label">Letter Length</span>
                      <div className="cl-chips">
                        {LENGTHS.map(l => (
                          <button key={l.id} className={`cl-chip ${f.length === l.value ? "cl-chip-on" : ""}`} onClick={() => set("length")(l.value)}>
                            <span>{l.label}</span>
                            <span className="cl-chip-sub">{l.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error + Generate */}
              {error && (
                <div className="cl-error">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <button className="cl-gen-btn" onClick={handleGenerate} disabled={!canGenerate}>
                {loading
                  ? <><span className="cl-spinner" /> Writing Your Cover Letter…</>
                  : <><Sparkles size={15} /> Generate Cover Letter</>
                }
              </button>

            </div>

            {/* RIGHT: Preview + Output */}
            <div className="cl-col-right">

              {/* Live preview card */}
              <div className="cl-card">
                <div className="cl-card-head">
                  <span className="cl-card-title">Letter Preview</span>
                  {f.tone && (
                    <span className="cl-tone-badge">
                      {TONES.find(t => t.id === f.tone)?.emoji}{" "}
                      {TONES.find(t => t.id === f.tone)?.label}
                    </span>
                  )}
                </div>
                <div className="cl-preview-body">
                  {/* Mock envelope header */}
                  <div className="cl-mock-header">
                    <div className="cl-mock-from">
                      <div className="cl-mock-name">{f.fullName || "Your Name"}</div>
                      <div className="cl-mock-contact">
                        {[f.email, f.phone, f.location].filter(Boolean).join(" · ") || "your@email.com · +91 00000 00000"}
                      </div>
                    </div>
                    <div className="cl-mock-to">
                      <div className="cl-mock-to-label">Applying to</div>
                      <div className="cl-mock-company">{f.company || "Company Name"}</div>
                      <div className="cl-mock-role">{f.jobTitle || "Job Title"}</div>
                      {f.hiringManager && <div className="cl-mock-mgr">Attn: {f.hiringManager}</div>}
                    </div>
                  </div>
                  {/* Subject line preview */}
                  {result?.subject_line ? (
                    <div className="cl-mock-subject">
                      <span className="cl-mock-subject-label">Subject:</span> {result.subject_line}
                    </div>
                  ) : (
                    <div className="cl-mock-subject cl-mock-subject-placeholder">
                      <span className="cl-mock-subject-label">Subject:</span> Application for {f.jobTitle || "[Job Title]"} – {f.fullName || "[Your Name]"}
                    </div>
                  )}
                  {/* Hook preview */}
                  {result?.opening_hook ? (
                    <div className="cl-mock-hook">"{result.opening_hook}"</div>
                  ) : (
                    <div className="cl-mock-placeholder">Your cover letter preview will appear here after generation…</div>
                  )}
                  {/* Key points */}
                  {result?.key_points?.length > 0 && (
                    <div className="cl-mock-points">
                      {result.key_points.map((pt, i) => (
                        <div key={i} className="cl-mock-point">
                          <span className="cl-mock-point-dot" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Skeleton */}
              {loading && (
                <div className="cl-card animate-in">
                  <div className="cl-skeleton-body">
                    <div className="cl-skel cl-skel-title" />
                    <div className="cl-skel cl-skel-line" />
                    <div className="cl-skel cl-skel-short cl-skel-line" />
                    <div className="cl-skel cl-skel-block" />
                    <div className="cl-skel cl-skel-line" />
                    <div className="cl-skel cl-skel-short cl-skel-line" />
                  </div>
                </div>
              )}

              {/* Output card */}
              {result && !loading && (
                <div className="cl-card animate-in">

                  {/* Subject line banner */}
                  <div className="cl-subject-banner">
                    <div className="cl-subject-left">
                      <span className="cl-subject-icon"><Mail size={13} /></span>
                      <div>
                        <div className="cl-subject-label">Email Subject Line</div>
                        <div className="cl-subject-text">{result.subject_line}</div>
                      </div>
                    </div>
                    <button
                      className={`cl-subject-copy ${copied === "subject" ? "copied" : ""}`}
                      onClick={() => handleCopy("subject", result.subject_line)}
                    >
                      {copied === "subject" ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="cl-result-top">
                    <div className="cl-tabs">
                      {[
                        { id: "preview", label: "Letter",  icon: <Eye size={11} />     },
                        { id: "tips",    label: "Tips",    icon: <Sparkles size={11} /> },
                        { id: "raw",     label: "Raw",     icon: <Code size={11} />     },
                      ].map(t => (
                        <button key={t.id} className={`cl-tab ${activeTab === t.id ? "cl-tab-on" : ""}`} onClick={() => setActiveTab(t.id)}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="cl-output-actions">
                      <button className="cl-sm-btn" onClick={handleReset}><RefreshCw size={12} /> New</button>
                      <button className="cl-sm-btn" onClick={handleDownload}><Download size={12} /> Download</button>
                      <button
                        className={`cl-copy-btn ${copied === "main" ? "copied" : ""}`}
                        onClick={() => handleCopy("main", result.cover_letter)}
                      >
                        {copied === "main" ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                  </div>

                  {/* Letter preview */}
                  {activeTab === "preview" && (
                    <div className="cl-letter-preview">
                      <div className="cl-letter-paper">
                        <div className="cl-letter-from">
                          <strong>{f.fullName}</strong><br />
                          {[f.email, f.phone, f.location, f.linkedin].filter(Boolean).join(" · ")}
                        </div>
                        <div className="cl-letter-body">
                          {result.cover_letter}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {activeTab === "tips" && (
                    <div className="cl-output-content">
                      {result.tone_match && (
                        <div className="cl-tone-feedback">
                          <span className="cl-tone-feedback-icon">🎯</span>
                          <span>{result.tone_match}</span>
                        </div>
                      )}
                      <span className="cl-output-section-label">💡 Improvement Tips</span>
                      <ul className="cl-tips-list">
                        {result.improvement_tips?.map((tip, i) => (
                          <li key={i} className="cl-tip-item">
                            <span className="cl-tip-num">{i + 1}</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                      {result.key_points?.length > 0 && (
                        <>
                          <span className="cl-output-section-label" style={{ marginTop: 12 }}>✅ Key Selling Points in This Letter</span>
                          <ul className="cl-points-list">
                            {result.key_points.map((pt, i) => (
                              <li key={i} className="cl-point-item">
                                <Check size={12} className="cl-point-check" /> {pt}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}

                  {/* Raw */}
                  {activeTab === "raw" && (
                    <textarea
                      className="cl-output-textarea"
                      value={result.cover_letter}
                      onChange={e => setResult(prev => ({ ...prev, cover_letter: e.target.value }))}
                      spellCheck={false}
                    />
                  )}

                  <div className="cl-result-footer">
                    <span className="cl-word-count">{wordCount} words</span>
                    <button
                      className={`cl-sm-btn ${copied === "footer" ? "cl-copy-btn copied" : ""}`}
                      onClick={() => handleCopy("footer", result.cover_letter)}
                    >
                      {copied === "footer" ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy Letter</>}
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
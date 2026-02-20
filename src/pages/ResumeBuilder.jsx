/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState } from "react";
import { Helmet } from "react-helmet";
import {
  FileText, Copy, Check, Download, RefreshCw, Plus, X,
  AlertCircle, Sparkles, User, Briefcase, GraduationCap,
  Award, ChevronDown, ChevronUp, Eye, Code
} from "lucide-react";
import { generateAI } from "../api";
import "./ResumeBuilder.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/resume-builder`;

/* ══════════════════════ Constants ══════════════════════ */
const TEMPLATES = [
  { id: "modern",      label: "Modern",      emoji: "🎨" },
  { id: "classic",     label: "Classic",     emoji: "📋" },
  { id: "minimal",     label: "Minimal",     emoji: "◻️" },
  { id: "creative",    label: "Creative",    emoji: "✨" },
  { id: "technical",   label: "Technical",   emoji: "💻" },
  { id: "executive",   label: "Executive",   emoji: "💼" },
];

const TONES = [
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "confident",    label: "Confident",    emoji: "🎯" },
  { id: "creative",     label: "Creative",     emoji: "🎨" },
  { id: "academic",     label: "Academic",     emoji: "🎓" },
];

const JOB_FIELDS = [
  "Software Engineering", "Data Science & AI", "Product Management",
  "UX/UI Design", "Marketing & Growth", "Finance & Accounting",
  "Human Resources", "Sales & Business Dev", "Operations & Logistics",
  "Healthcare & Medical", "Education & Teaching", "Legal & Compliance",
  "Consulting", "Content & Media", "Cybersecurity", "DevOps & Cloud",
];

const PRESETS = [
  {
    label: "Software Dev",
    data: {
      fullName: "Arjun Mehta", jobTitle: "Full Stack Developer",
      email: "arjun@email.com", phone: "+91 98765 43210",
      location: "Bangalore, India", linkedin: "linkedin.com/in/arjunmehta",
      github: "github.com/arjunmehta", portfolio: "",
      summary: "Passionate full stack developer with 3 years of experience building scalable web apps using React and Node.js.",
      jobField: "Software Engineering", template: "technical", tone: "confident",
      skills: "React, Node.js, TypeScript, PostgreSQL, Docker, AWS, REST APIs, Git",
      experience: [
        {
          company: "TechCorp India", title: "Software Engineer",
          start: "Jan 2022", end: "Present", current: true,
          description: "Built and maintained 5+ production React applications. Reduced API response time by 40% through query optimization. Led a team of 3 junior developers.",
        },
        {
          company: "StartupXYZ", title: "Junior Developer",
          start: "Jun 2021", end: "Dec 2021", current: false,
          description: "Developed REST APIs with Node.js and Express. Implemented CI/CD pipelines using GitHub Actions.",
        },
      ],
      education: [
        {
          institution: "IIT Bombay", degree: "B.Tech Computer Science",
          start: "2017", end: "2021", grade: "8.4 CGPA",
        },
      ],
      certifications: "AWS Certified Developer, Google Cloud Associate",
      achievements: "Hackathon winner at HackIndia 2022, Open source contributor with 200+ GitHub stars",
      languages: "English (Fluent), Hindi (Native)",
    },
  },
  {
    label: "Marketing",
    data: {
      fullName: "Priya Sharma", jobTitle: "Digital Marketing Manager",
      email: "priya@email.com", phone: "+91 87654 32109",
      location: "Mumbai, India", linkedin: "linkedin.com/in/priyasharma",
      github: "", portfolio: "priyasharma.com",
      summary: "Results-driven digital marketer with 5 years of experience scaling brands through data-driven campaigns and content strategy.",
      jobField: "Marketing & Growth", template: "modern", tone: "professional",
      skills: "SEO/SEM, Google Ads, Meta Ads, Content Strategy, Email Marketing, Analytics, HubSpot, Canva",
      experience: [
        {
          company: "BrandBoost Agency", title: "Senior Digital Marketer",
          start: "Mar 2021", end: "Present", current: true,
          description: "Managed ₹50L monthly ad spend across Google and Meta. Increased client ROAS by 3x through audience segmentation. Led SEO strategy that grew organic traffic by 120%.",
        },
      ],
      education: [
        {
          institution: "Mumbai University", degree: "MBA Marketing",
          start: "2017", end: "2019", grade: "First Class",
        },
      ],
      certifications: "Google Analytics Certified, HubSpot Inbound Marketing",
      achievements: "Grew company LinkedIn page from 2K to 50K followers in 18 months",
      languages: "English (Fluent), Hindi (Native), Marathi (Conversational)",
    },
  },
  {
    label: "Fresher",
    data: {
      fullName: "Rahul Verma", jobTitle: "Software Engineer (Fresher)",
      email: "rahul@email.com", phone: "+91 76543 21098",
      location: "Pune, India", linkedin: "linkedin.com/in/rahulverma",
      github: "github.com/rahulverma", portfolio: "",
      summary: "Recent B.Tech graduate passionate about building web applications. Quick learner with strong fundamentals in data structures and algorithms.",
      jobField: "Software Engineering", template: "minimal", tone: "confident",
      skills: "Python, Java, React, HTML/CSS, SQL, Git, DSA",
      experience: [
        {
          company: "TechIntern Co.", title: "Software Intern",
          start: "May 2023", end: "Jul 2023", current: false,
          description: "Developed a dashboard feature using React that improved user engagement by 25%. Fixed 30+ bugs in the production codebase.",
        },
      ],
      education: [
        {
          institution: "Pune University", degree: "B.Tech Computer Engineering",
          start: "2020", end: "2024", grade: "8.1 CGPA",
        },
      ],
      certifications: "Meta Front-End Developer Certificate, Coursera Data Structures",
      achievements: "2nd place in college hackathon, Built a personal finance tracker app with 500+ users",
      languages: "English (Fluent), Hindi (Native)",
    },
  },
];

const EMPTY = {
  fullName: "", jobTitle: "", email: "", phone: "",
  location: "", linkedin: "", github: "", portfolio: "",
  summary: "", jobField: "", template: "modern", tone: "professional",
  skills: "",
  experience: [{ company: "", title: "", start: "", end: "", current: false, description: "" }],
  education: [{ institution: "", degree: "", start: "", end: "", grade: "" }],
  certifications: "", achievements: "", languages: "",
};

/* ══════════════════════ Component ══════════════════════ */
export default function ResumeBuilder() {
  const [f, setF]               = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState(null); // { resume_text, ats_score, suggestions, keywords }
  const [activeTab, setActiveTab] = useState("preview");
  const [copied, setCopied]     = useState("");
  const [expandedSections, setExpandedSections] = useState({ personal: true, experience: true, education: true, skills: true, extra: false });

  const set = (key) => (val) => setF(prev => ({ ...prev, [key]: val }));

  const toggleSection = (s) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

  /* ── Experience ── */
  const addExp = () => setF(prev => ({
    ...prev,
    experience: [...prev.experience, { company: "", title: "", start: "", end: "", current: false, description: "" }]
  }));
  const removeExp = (i) => setF(prev => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }));
  const updateExp = (i, key, val) => setF(prev => {
    const experience = [...prev.experience];
    experience[i] = { ...experience[i], [key]: val };
    return { ...prev, experience };
  });

  /* ── Education ── */
  const addEdu = () => setF(prev => ({
    ...prev,
    education: [...prev.education, { institution: "", degree: "", start: "", end: "", grade: "" }]
  }));
  const removeEdu = (i) => setF(prev => ({ ...prev, education: prev.education.filter((_, idx) => idx !== i) }));
  const updateEdu = (i, key, val) => setF(prev => {
    const education = [...prev.education];
    education[i] = { ...education[i], [key]: val };
    return { ...prev, education };
  });

  /* ── Preset ── */
  const applyPreset = (p) => { setF({ ...EMPTY, ...p.data }); setResult(null); setError(""); };

  /* ── Generate ── */
  async function handleGenerate() {
    if (!f.fullName.trim()) { setError("Please enter your full name."); return; }
    if (!f.jobTitle.trim()) { setError("Please enter your job title."); return; }
    if (!f.skills.trim()) { setError("Please enter at least a few skills."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const expBlock = f.experience.filter(e => e.company || e.title).map((e, i) =>
        `Experience ${i+1}: ${e.title} at ${e.company} (${e.start} – ${e.current ? "Present" : e.end})\n${e.description}`
      ).join("\n\n");

      const eduBlock = f.education.filter(e => e.institution || e.degree).map((e, i) =>
        `Education ${i+1}: ${e.degree} from ${e.institution} (${e.start}–${e.end})${e.grade ? ` — ${e.grade}` : ""}`
      ).join("\n");

      const prompt = `You are an expert resume writer and ATS optimization specialist. Build a professional resume.

CANDIDATE INFO:
Name: ${f.fullName}
Job Title: ${f.jobTitle}
Email: ${f.email || "Not provided"}
Phone: ${f.phone || "Not provided"}
Location: ${f.location || "Not provided"}
${f.linkedin ? `LinkedIn: ${f.linkedin}` : ""}
${f.github ? `GitHub: ${f.github}` : ""}
${f.portfolio ? `Portfolio: ${f.portfolio}` : ""}

PROFESSIONAL SUMMARY:
${f.summary || "Generate a compelling summary based on other details"}

JOB FIELD: ${f.jobField || "General"}
TEMPLATE STYLE: ${f.template}
TONE: ${f.tone}

SKILLS: ${f.skills}

WORK EXPERIENCE:
${expBlock || "No experience provided — create appropriate fresher content"}

EDUCATION:
${eduBlock || "No education provided"}

${f.certifications ? `CERTIFICATIONS: ${f.certifications}` : ""}
${f.achievements ? `ACHIEVEMENTS: ${f.achievements}` : ""}
${f.languages ? `LANGUAGES: ${f.languages}` : ""}

OUTPUT: Respond ONLY with valid JSON, no markdown, no explanation:
{
  "resume_text": "Complete formatted resume in plain text, properly structured with sections. Use --- as section separators. Use • for bullets. Make it ATS-friendly and ~400-600 words.",
  "professional_summary": "A polished 3-4 sentence professional summary (rewritten/enhanced from input)",
  "ats_score": 85,
  "ats_feedback": "2-3 sentence ATS optimization feedback",
  "suggestions": ["Suggestion 1 to improve the resume", "Suggestion 2", "Suggestion 3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}

RULES:
- Make every bullet point start with a strong action verb
- Quantify achievements wherever possible (%, numbers, ₹, $)
- Ensure ATS compatibility: no tables, no graphics, clean formatting
- Match tone to: ${f.tone}
- Style the content to suit a ${f.template} resume template
- ATS score should be between 60-100 based on completeness and optimization`;

      const res = await generateAI("resume_builder", prompt);
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
    const blob = new Blob([result.resume_text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${f.fullName.replace(/\s+/g, "-").toLowerCase()}-resume.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => { setF(EMPTY); setResult(null); setError(""); setCopied(""); };
  const canGenerate = f.fullName.trim() && f.jobTitle.trim() && f.skills.trim() && !loading;

  const atsColor = result
    ? result.ats_score >= 80 ? "green"
    : result.ats_score >= 60 ? "orange" : "red"
    : "";

  return (
    <>
      <Helmet>
        <title>Free AI Resume Builder – ATS-Optimized Resume Generator | ShauryaTools</title>
        <meta name="description" content="Build a professional ATS-optimized resume with AI. Get instant resume generation, ATS score, and improvement suggestions. Free, no sign-up." />
        <meta name="keywords" content="resume builder, ai resume generator, ats resume, free resume maker, resume creator, cv builder, professional resume" />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Free AI Resume Builder – ATS-Optimized" />
        <meta property="og:description" content="Build a professional ATS-optimized resume with AI instantly. Free, no sign-up required." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Resume Builder" />
        <meta name="twitter:description" content="Build ATS-optimized resumes with AI instantly. Free." />
      </Helmet>

      <div className="rb-page">
        <div className="rb-inner">

          {/* Header */}
          <div className="rb-header">
            <div className="rb-icon"><FileText size={20} /></div>
            <div>
              <span className="rb-cat">Career Tools</span>
              <h1>AI Resume Builder</h1>
              <p>Fill in your details — get an ATS-optimized resume with score & improvement tips instantly.</p>
            </div>
          </div>

          {/* Presets */}
          <div className="rb-presets">
            <span className="rb-presets-label">Quick start:</span>
            {PRESETS.map(p => (
              <button key={p.label} className="rb-preset-btn" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="rb-grid">

            {/* LEFT: Form */}
            <div className="rb-col-left">

              {/* ── Personal Info ── */}
              <div className="rb-card">
                <div className="rb-section-head" onClick={() => toggleSection("personal")}>
                  <div className="rb-section-head-left">
                    <User size={15} />
                    <span className="rb-section-title">Personal Information</span>
                  </div>
                  {expandedSections.personal ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.personal && (
                  <div className="rb-form-body">
                    <div className="rb-row2">
                      <div className="rb-field">
                        <span className="rb-label">Full Name <span className="rb-req">*</span></span>
                        <input className="rb-input" value={f.fullName} onChange={e => { set("fullName")(e.target.value); setError(""); }} placeholder="e.g. Arjun Mehta" />
                      </div>
                      <div className="rb-field">
                        <span className="rb-label">Job Title / Role <span className="rb-req">*</span></span>
                        <input className="rb-input" value={f.jobTitle} onChange={e => set("jobTitle")(e.target.value)} placeholder="e.g. Full Stack Developer" />
                      </div>
                    </div>
                    <div className="rb-row2">
                      <div className="rb-field">
                        <span className="rb-label">Email</span>
                        <input className="rb-input" type="email" value={f.email} onChange={e => set("email")(e.target.value)} placeholder="you@email.com" />
                      </div>
                      <div className="rb-field">
                        <span className="rb-label">Phone</span>
                        <input className="rb-input" value={f.phone} onChange={e => set("phone")(e.target.value)} placeholder="+91 98765 43210" />
                      </div>
                    </div>
                    <div className="rb-row2">
                      <div className="rb-field">
                        <span className="rb-label">Location</span>
                        <input className="rb-input" value={f.location} onChange={e => set("location")(e.target.value)} placeholder="City, Country" />
                      </div>
                      <div className="rb-field">
                        <span className="rb-label">LinkedIn</span>
                        <input className="rb-input" value={f.linkedin} onChange={e => set("linkedin")(e.target.value)} placeholder="linkedin.com/in/username" />
                      </div>
                    </div>
                    <div className="rb-row2">
                      <div className="rb-field">
                        <span className="rb-label">GitHub</span>
                        <input className="rb-input" value={f.github} onChange={e => set("github")(e.target.value)} placeholder="github.com/username" />
                      </div>
                      <div className="rb-field">
                        <span className="rb-label">Portfolio</span>
                        <input className="rb-input" value={f.portfolio} onChange={e => set("portfolio")(e.target.value)} placeholder="yoursite.com" />
                      </div>
                    </div>
                    <div className="rb-field">
                      <span className="rb-label">Professional Summary <span className="rb-label-hint">— AI will enhance or generate this</span></span>
                      <textarea className="rb-textarea" value={f.summary} onChange={e => set("summary")(e.target.value)} placeholder="Brief summary of your experience and goals…" style={{ minHeight: 70 }} />
                    </div>
                    <div className="rb-row2">
                      <div className="rb-field">
                        <span className="rb-label">Job Field</span>
                        <select className="rb-select" value={f.jobField} onChange={e => set("jobField")(e.target.value)}>
                          <option value="">Select field…</option>
                          {JOB_FIELDS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </div>
                      <div className="rb-field">
                        <span className="rb-label">Tone</span>
                        <select className="rb-select" value={f.tone} onChange={e => set("tone")(e.target.value)}>
                          {TONES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="rb-field">
                      <span className="rb-label">Template Style</span>
                      <div className="rb-chips">
                        {TEMPLATES.map(t => (
                          <button key={t.id} className={`rb-chip ${f.template === t.id ? "rb-chip-on" : ""}`} onClick={() => set("template")(t.id)}>
                            <span>{t.emoji}</span><span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Experience ── */}
              <div className="rb-card">
                <div className="rb-section-head" onClick={() => toggleSection("experience")}>
                  <div className="rb-section-head-left">
                    <Briefcase size={15} />
                    <span className="rb-section-title">Work Experience</span>
                    <span className="rb-count-badge">{f.experience.length}</span>
                  </div>
                  {expandedSections.experience ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.experience && (
                  <div className="rb-form-body">
                    {f.experience.map((exp, i) => (
                      <div key={i} className="rb-entry-block">
                        <div className="rb-entry-head">
                          <span className="rb-entry-label">Experience {i + 1}</span>
                          {f.experience.length > 1 && (
                            <button className="rb-remove-btn" onClick={() => removeExp(i)}><X size={11} /></button>
                          )}
                        </div>
                        <div className="rb-row2">
                          <div className="rb-field">
                            <span className="rb-label">Company</span>
                            <input className="rb-input" value={exp.company} onChange={e => updateExp(i, "company", e.target.value)} placeholder="Company Name" />
                          </div>
                          <div className="rb-field">
                            <span className="rb-label">Job Title</span>
                            <input className="rb-input" value={exp.title} onChange={e => updateExp(i, "title", e.target.value)} placeholder="Software Engineer" />
                          </div>
                        </div>
                        <div className="rb-row3">
                          <div className="rb-field">
                            <span className="rb-label">Start</span>
                            <input className="rb-input" value={exp.start} onChange={e => updateExp(i, "start", e.target.value)} placeholder="Jan 2022" />
                          </div>
                          <div className="rb-field">
                            <span className="rb-label">End</span>
                            <input className="rb-input" value={exp.end} onChange={e => updateExp(i, "end", e.target.value)} placeholder="Dec 2023" disabled={exp.current} />
                          </div>
                          <div className="rb-field rb-field-center">
                            <label className="rb-checkbox-label">
                              <input type="checkbox" checked={exp.current} onChange={e => updateExp(i, "current", e.target.checked)} />
                              <span>Current</span>
                            </label>
                          </div>
                        </div>
                        <div className="rb-field">
                          <span className="rb-label">Description <span className="rb-label-hint">— key responsibilities & achievements</span></span>
                          <textarea className="rb-textarea" value={exp.description} onChange={e => updateExp(i, "description", e.target.value)} placeholder="Led development of… Improved performance by X%…" style={{ minHeight: 70 }} />
                        </div>
                      </div>
                    ))}
                    <button className="rb-add-btn" onClick={addExp}><Plus size={13} /> Add Experience</button>
                  </div>
                )}
              </div>

              {/* ── Education ── */}
              <div className="rb-card">
                <div className="rb-section-head" onClick={() => toggleSection("education")}>
                  <div className="rb-section-head-left">
                    <GraduationCap size={15} />
                    <span className="rb-section-title">Education</span>
                    <span className="rb-count-badge">{f.education.length}</span>
                  </div>
                  {expandedSections.education ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.education && (
                  <div className="rb-form-body">
                    {f.education.map((edu, i) => (
                      <div key={i} className="rb-entry-block">
                        <div className="rb-entry-head">
                          <span className="rb-entry-label">Education {i + 1}</span>
                          {f.education.length > 1 && (
                            <button className="rb-remove-btn" onClick={() => removeEdu(i)}><X size={11} /></button>
                          )}
                        </div>
                        <div className="rb-row2">
                          <div className="rb-field">
                            <span className="rb-label">Institution</span>
                            <input className="rb-input" value={edu.institution} onChange={e => updateEdu(i, "institution", e.target.value)} placeholder="IIT Bombay" />
                          </div>
                          <div className="rb-field">
                            <span className="rb-label">Degree / Course</span>
                            <input className="rb-input" value={edu.degree} onChange={e => updateEdu(i, "degree", e.target.value)} placeholder="B.Tech Computer Science" />
                          </div>
                        </div>
                        <div className="rb-row3">
                          <div className="rb-field">
                            <span className="rb-label">Start Year</span>
                            <input className="rb-input" value={edu.start} onChange={e => updateEdu(i, "start", e.target.value)} placeholder="2020" />
                          </div>
                          <div className="rb-field">
                            <span className="rb-label">End Year</span>
                            <input className="rb-input" value={edu.end} onChange={e => updateEdu(i, "end", e.target.value)} placeholder="2024" />
                          </div>
                          <div className="rb-field">
                            <span className="rb-label">Grade / CGPA</span>
                            <input className="rb-input" value={edu.grade} onChange={e => updateEdu(i, "grade", e.target.value)} placeholder="8.5 CGPA" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="rb-add-btn" onClick={addEdu}><Plus size={13} /> Add Education</button>
                  </div>
                )}
              </div>

              {/* ── Skills ── */}
              <div className="rb-card">
                <div className="rb-section-head" onClick={() => toggleSection("skills")}>
                  <div className="rb-section-head-left">
                    <Code size={15} />
                    <span className="rb-section-title">Skills</span>
                  </div>
                  {expandedSections.skills ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.skills && (
                  <div className="rb-form-body">
                    <div className="rb-field">
                      <span className="rb-label">Skills <span className="rb-req">*</span> <span className="rb-label-hint">— comma-separated</span></span>
                      <textarea className="rb-textarea" value={f.skills} onChange={e => { set("skills")(e.target.value); setError(""); }} placeholder="React, Node.js, Python, SQL, Docker, AWS…" style={{ minHeight: 60 }} />
                    </div>
                    <div className="rb-field">
                      <span className="rb-label">Languages</span>
                      <input className="rb-input" value={f.languages} onChange={e => set("languages")(e.target.value)} placeholder="English (Fluent), Hindi (Native)" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Extra ── */}
              <div className="rb-card">
                <div className="rb-section-head" onClick={() => toggleSection("extra")}>
                  <div className="rb-section-head-left">
                    <Award size={15} />
                    <span className="rb-section-title">Certifications & Achievements</span>
                  </div>
                  {expandedSections.extra ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                {expandedSections.extra && (
                  <div className="rb-form-body">
                    <div className="rb-field">
                      <span className="rb-label">Certifications</span>
                      <textarea className="rb-textarea" value={f.certifications} onChange={e => set("certifications")(e.target.value)} placeholder="AWS Certified Developer, Google Analytics Certified…" style={{ minHeight: 55 }} />
                    </div>
                    <div className="rb-field">
                      <span className="rb-label">Achievements & Awards</span>
                      <textarea className="rb-textarea" value={f.achievements} onChange={e => set("achievements")(e.target.value)} placeholder="Hackathon winner, Speaker at TechConf 2023…" style={{ minHeight: 55 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Error + Generate */}
              {error && (
                <div className="rb-error">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <button className="rb-gen-btn" onClick={handleGenerate} disabled={!canGenerate}>
                {loading
                  ? <><span className="rb-spinner" /> Building Your Resume…</>
                  : <><Sparkles size={15} /> Build Resume with AI</>
                }
              </button>

            </div>

            {/* RIGHT: Preview */}
            <div className="rb-col-right">

              {/* Quick preview card */}
              <div className="rb-card">
                <div className="rb-card-head">
                  <span className="rb-card-title">Resume Preview</span>
                  {f.template && (
                    <span className="rb-template-badge">
                      {TEMPLATES.find(t => t.id === f.template)?.emoji}{" "}
                      {TEMPLATES.find(t => t.id === f.template)?.label}
                    </span>
                  )}
                </div>
                <div className="rb-preview-body">
                  <div className="rb-preview-name">{f.fullName || "Your Name"}</div>
                  <div className="rb-preview-title">{f.jobTitle || "Job Title"}</div>
                  {(f.email || f.phone || f.location) && (
                    <div className="rb-preview-contact">
                      {[f.email, f.phone, f.location].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {(f.linkedin || f.github) && (
                    <div className="rb-preview-links">
                      {[f.linkedin, f.github, f.portfolio].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {f.summary && (
                    <div className="rb-preview-summary">{f.summary}</div>
                  )}
                  {f.skills && (
                    <div className="rb-preview-skills">
                      {f.skills.split(",").slice(0, 8).map((s, i) => (
                        <span key={i} className="rb-skill-tag">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Skeleton */}
              {loading && (
                <div className="rb-card animate-in">
                  <div className="rb-skeleton-body">
                    <div className="rb-skel rb-skel-title" />
                    <div className="rb-skel rb-skel-line" />
                    <div className="rb-skel rb-skel-short rb-skel-line" />
                    <div className="rb-skel rb-skel-block" />
                    <div className="rb-skel rb-skel-line" />
                    <div className="rb-skel rb-skel-short rb-skel-line" />
                  </div>
                </div>
              )}

              {/* Output */}
              {result && !loading && (
                <div className="rb-card animate-in">

                  {/* ATS Score */}
                  <div className="rb-ats-banner">
                    <div className="rb-ats-left">
                      <div className={`rb-ats-score rb-ats-${atsColor}`}>{result.ats_score}</div>
                      <div>
                        <div className="rb-ats-label">ATS Score</div>
                        <div className="rb-ats-sub">{result.ats_feedback}</div>
                      </div>
                    </div>
                    <div className={`rb-ats-ring rb-ats-ring-${atsColor}`}>
                      <svg viewBox="0 0 36 36" width="52" height="52">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke="currentColor" strokeWidth="3"
                          strokeDasharray={`${result.ats_score * 0.942} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                        <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">{result.ats_score}</text>
                      </svg>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="rb-result-top">
                    <div className="rb-tabs">
                      {[
                        { id: "preview", label: "Resume", icon: <Eye size={11} /> },
                        { id: "tips",    label: "Tips",   icon: <Sparkles size={11} /> },
                        { id: "raw",     label: "Raw",    icon: <Code size={11} /> },
                      ].map(t => (
                        <button key={t.id} className={`rb-tab ${activeTab === t.id ? "rb-tab-on" : ""}`} onClick={() => setActiveTab(t.id)}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="rb-output-actions">
                      <button className="rb-sm-btn" onClick={handleReset}><RefreshCw size={12} /> New</button>
                      <button className="rb-sm-btn" onClick={handleDownload}><Download size={12} /> Download</button>
                      <button className={`rb-copy-btn ${copied === "main" ? "copied" : ""}`} onClick={() => handleCopy("main", result.resume_text)}>
                        {copied === "main" ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                  </div>

                  {/* Resume Preview Tab */}
                  {activeTab === "preview" && (
                    <div className="rb-resume-preview">
                      <div className="rb-resume-name">{f.fullName}</div>
                      <div className="rb-resume-title">{f.jobTitle}</div>
                      {(f.email || f.phone) && (
                        <div className="rb-resume-contact">
                          {[f.email, f.phone, f.location, f.linkedin, f.github].filter(Boolean).join(" | ")}
                        </div>
                      )}
                      <div className="rb-resume-divider" />
                      {result.professional_summary && (
                        <>
                          <div className="rb-resume-section-title">PROFESSIONAL SUMMARY</div>
                          <p className="rb-resume-text">{result.professional_summary}</p>
                          <div className="rb-resume-divider" />
                        </>
                      )}
                      <div className="rb-resume-body">{result.resume_text}</div>
                      {result.keywords?.length > 0 && (
                        <>
                          <div className="rb-resume-divider" />
                          <div className="rb-resume-section-title">KEY TERMS</div>
                          <div className="rb-kw-list">
                            {result.keywords.map((kw, i) => <span key={i} className="rb-kw-tag">{kw}</span>)}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Tips Tab */}
                  {activeTab === "tips" && (
                    <div className="rb-output-content">
                      <div className="rb-tips-header">
                        <span className="rb-output-section-label">💡 Improvement Suggestions</span>
                      </div>
                      <ul className="rb-tips-list">
                        {result.suggestions?.map((s, i) => (
                          <li key={i} className="rb-tip-item">
                            <span className="rb-tip-num">{i + 1}</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                      {result.keywords?.length > 0 && (
                        <>
                          <div className="rb-output-section-label" style={{ marginTop: 16 }}>🔑 ATS Keywords to Include</div>
                          <div className="rb-kw-list" style={{ marginTop: 8 }}>
                            {result.keywords.map((kw, i) => <span key={i} className="rb-kw-tag">{kw}</span>)}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Raw Tab */}
                  {activeTab === "raw" && (
                    <textarea
                      className="rb-output-textarea"
                      value={result.resume_text}
                      onChange={e => setResult(prev => ({ ...prev, resume_text: e.target.value }))}
                      spellCheck={false}
                    />
                  )}

                  <div className="rb-result-footer">
                    <span className="rb-word-count">
                      {result.resume_text?.split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      className={`rb-sm-btn ${copied === "footer" ? "rb-copy-btn copied" : ""}`}
                      onClick={() => handleCopy("footer", result.resume_text)}
                    >
                      {copied === "footer" ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy Resume</>}
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
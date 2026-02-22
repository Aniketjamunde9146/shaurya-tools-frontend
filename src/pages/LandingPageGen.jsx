/* eslint-disable no-empty */
import { useState } from "react";
import { Helmet } from "react-helmet";
import {
  LayoutTemplate,
  RefreshCw,
  Copy,
  Check,
  Monitor,
  Smartphone,
  AlertTriangle,
  Info,
  Download,
  Wand2,
  Code2,
  Eye,
  Layers,
} from "lucide-react";
import "./LandingPageGen.css";

/* ─── Config ───────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── Options ──────────────────────────────────────────── */
const SECTION_OPTIONS = [
  { id: "hero",         label: "Hero",         icon: "🚀", required: true  },
  { id: "features",     label: "Features",     icon: "⚡", required: false },
  { id: "how-it-works", label: "How It Works", icon: "🔄", required: false },
  { id: "pricing",      label: "Pricing",      icon: "💰", required: false },
  { id: "testimonials", label: "Testimonials", icon: "⭐", required: false },
  { id: "faq",          label: "FAQ",          icon: "❓", required: false },
  { id: "team",         label: "Team",         icon: "👥", required: false },
  { id: "cta",          label: "CTA Banner",   icon: "🎯", required: false },
  { id: "footer",       label: "Footer",       icon: "📋", required: false },
];

const TONE_OPTIONS = [
  "Professional", "Playful", "Minimal", "Bold",
  "Elegant", "Tech-Forward", "Friendly", "Luxury",
];

const INDUSTRY_OPTIONS = [
  "Technology", "SaaS", "E-commerce", "Healthcare", "Finance",
  "Education", "Creative Agency", "Startup", "Consulting",
  "Real Estate", "Food & Beverage", "Fitness", "Travel", "Legal", "Other",
];

/* ─── SSE stream reader — reads OpenAI SSE piped from backend ── */
async function readSSEStream(response, onChunk) {
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      const t = line.trim();
      if (!t || t === "data: [DONE]" || !t.startsWith("data: ")) continue;
      try {
        const json  = JSON.parse(t.slice(6));
        // Check for error sent via stream
        if (json.error) throw new Error(json.error);
        const delta = json.choices?.[0]?.delta?.content || "";
        if (delta) {
          buffer += delta;
          onChunk(buffer);
        }
      } catch (e) {
        if (e.message && !e.message.includes("JSON")) throw e;
      }
    }
  }

  return buffer;
}

/* ─── Helpers ──────────────────────────────────────────── */
function countLines(html) { return html.split("\n").length; }

/* ─── Main Component ───────────────────────────────────── */
export default function LandingPageGen() {
  /* Form */
  const [businessName,   setBusinessName]   = useState("");
  const [description,    setDescription]    = useState("");
  const [industry,       setIndustry]       = useState("Technology");
  const [tone,           setTone]           = useState("Professional");
  const [primaryColor,   setPrimaryColor]   = useState("#6366f1");
  const [cta,            setCta]            = useState("Get Started");
  const [targetAudience, setTargetAudience] = useState("");
  const [sections,       setSections]       = useState(["hero", "features", "cta", "footer"]);

  /* UI */
  const [loading,       setLoading]       = useState(false);
  const [streaming,     setStreaming]      = useState(false);
  const [error,         setError]         = useState("");
  const [htmlOutput,    setHtmlOutput]    = useState("");
  const [activeTab,     setActiveTab]     = useState("preview");
  const [copied,        setCopied]        = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop");

  const hasResult = !!htmlOutput;

  /* ── Toggle section chip ── */
  const toggleSection = (id) => {
    const sec = SECTION_OPTIONS.find(s => s.id === id);
    if (sec?.required) return;
    setSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  /* ── Generate — calls backend SSE endpoint, reads stream ── */
  async function handleGenerate() {
    if (!businessName.trim()) {
      setError("Please enter a business name.");
      return;
    }
    if (sections.length === 0) {
      setError("Please select at least one section.");
      return;
    }

    setLoading(true);
    setStreaming(true);
    setError("");
    setHtmlOutput("");

    try {
      const res = await fetch(`${API_BASE}/api/ai`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool:  "landing",
          input: JSON.stringify({
            businessName,
            description,
            industry,
            tone,
            primaryColor,
            sections,
            cta,
            targetAudience,
          }),
        }),
      });

      // Non-2xx before stream starts = JSON error from server
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Server error (${res.status})`);
      }

      // Read the SSE stream, update preview live
      const html = await readSSEStream(res, (partial) => {
        setHtmlOutput(partial);
      });

      // Final cleanup — strip any accidental markdown fences
      const cleaned = html
        .replace(/^```html\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "")
        .trim();

      if (!cleaned || !cleaned.toLowerCase().includes("<!doctype")) {
        throw new Error("Received an invalid response. Please try again.");
      }

      setHtmlOutput(cleaned);
      setActiveTab("preview");

    } catch (e) {
      if (e.name === "AbortError") return;
      setError(e.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  /* ── Copy ── */
  function handleCopy() {
    if (!htmlOutput) return;
    navigator.clipboard.writeText(htmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  /* ── Download ── */
  function handleDownload() {
    if (!htmlOutput) return;
    const blob = new Blob([htmlOutput], { type: "text/html" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `${(businessName || "landing-page").toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Reset ── */
  function handleReset() {
    setHtmlOutput("");
    setError("");
    setCopied(false);
    setBusinessName("");
    setDescription("");
    setTargetAudience("");
    setSections(["hero", "features", "cta", "footer"]);
  }

  return (
    <>
      <Helmet>
        <title>Landing Page Generator – AI Website Builder | ShauryaTools</title>
        <meta name="description" content="Generate beautiful, production-ready landing pages instantly with AI. Customize hero, features, pricing, and more. Free landing page builder." />
        <meta name="keywords"    content="landing page generator, AI website builder, html generator, free landing page maker" />
        <link rel="canonical"    href="https://shauryatools.vercel.app/landing-page-gen" />
        <meta property="og:title"       content="Landing Page Generator – AI Website Builder | ShauryaTools" />
        <meta property="og:description" content="Generate beautiful landing pages instantly with AI." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots"       content="index, follow" />
        <meta name="author"       content="ShauryaTools" />
      </Helmet>

      <div className="lpg-page">
        <div className="lpg-inner">

          {/* ── Header ── */}
          <div className="lpg-header">
            <div className="lpg-icon"><LayoutTemplate size={22} /></div>
            <div>
              <span className="lpg-cat">AI Tools</span>
              <h1>Landing Page Generator</h1>
              <p>Describe your business and get a beautiful, production-ready HTML landing page — streamed live.</p>
            </div>
          </div>

          {/* ── Form Card ── */}
          <div className="lpg-card">
            <div className="lpg-form-grid">

              <div className="lpg-field">
                <label className="lpg-label">Business / Product Name *</label>
                <input
                  className="lpg-input"
                  value={businessName}
                  onChange={e => { setBusinessName(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleGenerate()}
                  placeholder="e.g. NovaSaaS, Bloom Studio"
                  maxLength={60}
                  autoFocus
                />
              </div>

              <div className="lpg-field">
                <label className="lpg-label">CTA Button Text</label>
                <input
                  className="lpg-input"
                  value={cta}
                  onChange={e => setCta(e.target.value)}
                  placeholder="Get Started, Try Free, Book a Demo"
                  maxLength={40}
                />
              </div>

              <div className="lpg-field lpg-field-full">
                <label className="lpg-label">What does your business do?</label>
                <textarea
                  className="lpg-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. A SaaS platform that helps teams manage projects with AI-powered suggestions and real-time collaboration."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="lpg-field">
                <label className="lpg-label">Target Audience</label>
                <input
                  className="lpg-input"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  placeholder="e.g. Startups, freelancers, enterprises"
                  maxLength={80}
                />
              </div>

              <div className="lpg-field">
                <label className="lpg-label">Industry</label>
                <select className="lpg-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                  {INDUSTRY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="lpg-field lpg-field-full">
                <label className="lpg-label">Design Tone</label>
                <div className="lpg-chips">
                  {TONE_OPTIONS.map(t => (
                    <button
                      key={t}
                      className={`lpg-chip ${tone === t ? "lpg-chip-on" : ""}`}
                      onClick={() => setTone(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lpg-field">
                <label className="lpg-label">Primary Brand Color</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    style={{
                      width: 40, height: 38,
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 8, cursor: "pointer",
                      padding: 2, background: "none", flexShrink: 0,
                    }}
                  />
                  <input
                    className="lpg-input"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    placeholder="#6366f1"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="lpg-field lpg-field-full">
                <div className="lpg-label-row">
                  <label className="lpg-label">Sections to Include</label>
                  <div className="lpg-sec-actions">
                    <button className="lpg-text-btn" onClick={() => setSections(SECTION_OPTIONS.map(s => s.id))}>All</button>
                    <span className="lpg-dot">·</span>
                    <button className="lpg-text-btn" onClick={() => setSections(["hero"])}>None</button>
                  </div>
                </div>
                <div className="lpg-chips">
                  {SECTION_OPTIONS.map(s => (
                    <button
                      key={s.id}
                      className={`lpg-chip ${sections.includes(s.id) ? "lpg-chip-on" : ""}`}
                      onClick={() => toggleSection(s.id)}
                      title={s.required ? "Required — always included" : ""}
                    >
                      {sections.includes(s.id) && !s.required && <Check size={10} style={{ marginRight: 2 }} />}
                      {s.icon} {s.label}{s.required ? " ✓" : ""}
                    </button>
                  ))}
                </div>
                <p className="lpg-hint">{sections.length} of {SECTION_OPTIONS.length} sections selected</p>
              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="lpg-error-msg">
                <AlertTriangle size={13} /> {error}
              </div>
            )}

            {/* Info */}
            <div className="lpg-info-note">
              <Info size={12} /> Powered by OpenAI GPT-4o-mini via your backend. Streams live — generation takes 15–30s.
            </div>

            {/* Actions */}
            <div className="lpg-actions">
              {(hasResult || loading) && (
                <button className="lpg-btn-ghost" onClick={handleReset}>
                  <RefreshCw size={14} /> {loading ? "Cancel" : "New Page"}
                </button>
              )}
              <button
                className="lpg-generate-btn"
                onClick={handleGenerate}
                disabled={loading || !businessName.trim()}
              >
                {loading
                  ? <><span className="lpg-spinner" /> Generating...</>
                  : <><Wand2 size={15} /> Generate Landing Page</>}
              </button>
            </div>
          </div>

          {/* ── Loading Skeleton (before first chunk arrives) ── */}
          {loading && !htmlOutput && (
            <div className="lpg-card animate-in">
              <div className="lpg-skel lpg-skel-title" />
              <div className="lpg-skel lpg-skel-block" />
              {[90, 80, 70, 85, 60].map((w, i) => (
                <div key={i} className="lpg-skel lpg-skel-line" style={{ width: `${w}%`, marginTop: 10 }} />
              ))}
            </div>
          )}

          {/* ── Results ── */}
          {hasResult && (
            <div className="lpg-results animate-in">

              {/* Stats */}
              <div className="lpg-stats-strip">
                <div className="lpg-stat">
                  <span className="lpg-stat-val">{sections.length}</span>
                  <span className="lpg-stat-lbl">Sections</span>
                </div>
                <div className="lpg-stat">
                  <span className="lpg-stat-val">{countLines(htmlOutput).toLocaleString()}</span>
                  <span className="lpg-stat-lbl">Lines</span>
                </div>
                <div className="lpg-stat">
                  <span className="lpg-stat-val">{(htmlOutput.length / 1024).toFixed(1)}KB</span>
                  <span className="lpg-stat-lbl">Size</span>
                </div>
                <div className="lpg-stat">
                  <span className="lpg-stat-val">{tone}</span>
                  <span className="lpg-stat-lbl">Tone</span>
                </div>
                <div className="lpg-stat">
                  <span className="lpg-stat-val">GPT-4o</span>
                  <span className="lpg-stat-lbl">Model</span>
                </div>
              </div>

              {/* Section breakdown */}
              <div className="lpg-card animate-in">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  <Layers size={15} color="#6366f1" />
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#374151" }}>Page Sections</span>
                </div>
                <div className="lpg-section-list">
                  {SECTION_OPTIONS.map(s => (
                    <div key={s.id} className="lpg-section-item">
                      <span className="lpg-section-icon">{s.icon}</span>
                      <span className="lpg-section-name">{s.label}</span>
                      <span className={`lpg-section-tag ${sections.includes(s.id) ? "lpg-tag-included" : "lpg-tag-optional"}`}>
                        {sections.includes(s.id) ? "Included" : "Skipped"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview + Code tabs */}
              <div className="lpg-card animate-in">
                <div className="lpg-result-top">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div className="lpg-tabs">
                      <button
                        className={`lpg-tab ${activeTab === "preview" ? "lpg-tab-on" : ""}`}
                        onClick={() => setActiveTab("preview")}
                      >
                        <Eye size={13} /> Preview
                      </button>
                      <button
                        className={`lpg-tab ${activeTab === "code" ? "lpg-tab-on" : ""}`}
                        onClick={() => setActiveTab("code")}
                      >
                        <Code2 size={13} /> Code
                      </button>
                    </div>
                    {streaming && (
                      <div className="lpg-stream-badge">
                        <span className="lpg-stream-dot" /> Streaming...
                      </div>
                    )}
                  </div>

                  <div className="lpg-tab-actions">
                    {activeTab === "preview" && (
                      <div className="lpg-device-toggle">
                        <button
                          className={`lpg-device-btn ${previewDevice === "desktop" ? "lpg-device-btn-on" : ""}`}
                          onClick={() => setPreviewDevice("desktop")}
                          title="Desktop"
                        >
                          <Monitor size={14} />
                        </button>
                        <button
                          className={`lpg-device-btn ${previewDevice === "mobile" ? "lpg-device-btn-on" : ""}`}
                          onClick={() => setPreviewDevice("mobile")}
                          title="Mobile"
                        >
                          <Smartphone size={14} />
                        </button>
                      </div>
                    )}
                    <button className={`lpg-copy-btn ${copied ? "lpg-copied" : ""}`} onClick={handleCopy}>
                      {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy HTML</>}
                    </button>
                    <button className="lpg-download-btn" onClick={handleDownload}>
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>

                {/* Preview Tab */}
                {activeTab === "preview" && (
                  <div className="animate-in">
                    <div className="lpg-preview-wrap">
                      <div className="lpg-preview-bar">
                        <span className="lpg-preview-dot" />
                        <span className="lpg-preview-dot" />
                        <span className="lpg-preview-dot" />
                        <span className="lpg-preview-url">
                          {businessName
                            ? businessName.toLowerCase().replace(/\s+/g, "") + ".com"
                            : "yoursite.com"}
                        </span>
                      </div>
                      <div className={previewDevice === "mobile" ? "lpg-iframe-mobile" : ""}>
                        <iframe
                          className="lpg-preview-iframe"
                          title="Landing Page Preview"
                          sandbox="allow-scripts allow-same-origin"
                          srcDoc={htmlOutput}
                        />
                      </div>
                    </div>
                    <p className="lpg-preview-note">
                      Download the HTML to deploy on Vercel, Netlify, or GitHub Pages.
                    </p>
                  </div>
                )}

                {/* Code Tab */}
                {activeTab === "code" && (
                  <div className="animate-in">
                    <div className="lpg-code-wrap">
                      <pre className="lpg-code-block">{htmlOutput}</pre>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="lpg-result-footer">
                  <span className="lpg-word-count">
                    ~{htmlOutput.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                    · {countLines(htmlOutput).toLocaleString()} lines
                    · {(htmlOutput.length / 1024).toFixed(1)}KB
                  </span>
                  <button className={`lpg-copy-full ${copied ? "lpg-copied" : ""}`} onClick={handleCopy}>
                    {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy HTML</>}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./ProductComparison.css";
import { Helmet } from "react-helmet";
import {
  BarChart2,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  Package,
  Tag,
  Users,
  Target,
  AlertCircle,
  ShoppingCart,
  Star,
  Layers,
  DollarSign,
  Zap,
  Shield,
  ThumbsUp,
} from "lucide-react";

/* ── Comparison Focus ── */
const FOCUS_AREAS = [
  { id: "overall",     label: "Overall",       icon: BarChart2,   desc: "Full comparison" },
  { id: "value",       label: "Value / Price", icon: DollarSign,  desc: "Bang for buck" },
  { id: "features",    label: "Features",      icon: Layers,      desc: "What each does" },
  { id: "performance", label: "Performance",   icon: Zap,         desc: "Speed & power" },
  { id: "quality",     label: "Quality",       icon: Shield,      desc: "Build & durability" },
  { id: "beginner",    label: "For Beginners", icon: Users,       desc: "Ease of use" },
];

/* ── Output Format ── */
const FORMATS = [
  { id: "table",      label: "Comparison Table", icon: BarChart2, desc: "Side-by-side grid" },
  { id: "pros_cons",  label: "Pros & Cons",      icon: ThumbsUp,  desc: "For each product" },
  { id: "narrative",  label: "In-Depth Review",  icon: Star,      desc: "Detailed writeup" },
  { id: "verdict",    label: "Quick Verdict",    icon: Zap,       desc: "Fast recommendation" },
];

/* ── Buyer Profile ── */
const BUYER_PROFILES = [
  { id: "budget",       label: "Budget Buyer",    desc: "Best price wins" },
  { id: "enthusiast",   label: "Enthusiast",      desc: "Wants the best" },
  { id: "casual",       label: "Casual User",     desc: "Simple & easy" },
  { id: "professional", label: "Professional",    desc: "Work / business" },
  { id: "gift",         label: "Buying a Gift",   desc: "For someone else" },
];

/* ── Markdown Renderer ── */
function renderMarkdown(md) {
  const lines = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n");

  const output = [];
  let inCode = false, codeLines = [];
  let inList = false, listItems = [], listOrdered = false;

  const flushList = () => {
    if (!listItems.length) return;
    const tag = listOrdered ? "ol" : "ul";
    output.push(`<${tag}>${listItems.map(li => `<li>${li}</li>`).join("")}</${tag}>`);
    listItems = []; inList = false;
  };

  for (let line of lines) {
    if (/^```/.test(line)) {
      if (!inCode) { flushList(); inCode = true; codeLines = []; }
      else { output.push(`<pre class="pcg-code-block"><code>${codeLines.join("\n")}</code></pre>`); inCode = false; }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (/^-{3,}$/.test(line.trim())) { flushList(); output.push("<hr />"); continue; }
    const hm = line.match(/^(#{1,3}) (.+)$/);
    if (hm) { flushList(); output.push(`<h${hm[1].length}>${fmt(hm[2])}</h${hm[1].length}>`); continue; }
    if (/^&gt; /.test(line)) { flushList(); output.push(`<blockquote>${fmt(line.slice(5))}</blockquote>`); continue; }
    const ulm = line.match(/^[\-\*] (.+)$/);
    if (ulm) { if (inList && listOrdered) flushList(); inList = true; listOrdered = false; listItems.push(fmt(ulm[1])); continue; }
    const olm = line.match(/^\d+\. (.+)$/);
    if (olm) { if (inList && !listOrdered) flushList(); inList = true; listOrdered = true; listItems.push(fmt(olm[1])); continue; }
    if (!line.trim()) { flushList(); output.push(""); continue; }
    flushList();
    output.push(`<p>${fmt(line)}</p>`);
  }
  flushList();
  return output.filter(Boolean).join("\n");
}

function fmt(text) {
  return text
    .replace(/`([^`]+)`/g, `<code class="pcg-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ── Component ── */
export default function ProductComparison() {
  const [product1,    setProduct1]    = useState("");
  const [product2,    setProduct2]    = useState("");
  const [product3,    setProduct3]    = useState("");
  const [category,    setCategory]    = useState("");
  const [budget,      setBudget]      = useState("");
  const [focus,       setFocus]       = useState("overall");
  const [format,      setFormat]      = useState("table");
  const [profile,     setProfile]     = useState("casual");
  const [withVerdict, setWithVerdict] = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState("");
  const [copied,      setCopied]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("preview");

  const products = [product1, product2, product3].filter(p => p.trim().length > 0);
  const canSubmit = product1.trim().length > 0 && product2.trim().length > 0 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    const selectedFocus   = FOCUS_AREAS.find(f => f.id === focus);
    const selectedFormat  = FORMATS.find(f => f.id === format);
    const selectedProfile = BUYER_PROFILES.find(p => p.id === profile);

    const productList = products.map((p, i) => `  - Product ${i + 1}: ${p}`).join("\n");

    const prompt = `You are an expert product analyst and consumer tech journalist with deep knowledge across categories.

Create a thorough, balanced product comparison for these items.

Comparison Details:
- Products to compare:
${productList}
- Category / Type: ${category.trim() || "General / Auto-detect from products"}
- Budget range: ${budget.trim() || "Not specified"}
- Comparison Focus: ${selectedFocus?.label} — ${selectedFocus?.desc}
- Output Format: ${selectedFormat?.label} — ${selectedFormat?.desc}
- Buyer Profile: ${selectedProfile?.label} — ${selectedProfile?.desc}
- Include final recommendation: ${withVerdict ? "Yes" : "No"}

STRICT RULES:
• Output ONLY clean Markdown. No preamble, no "Here is your..." intro.
• Start with a ## Overview section — 1–2 sentences on what these products are and who they're for.
• ${format === "table"
    ? `Create a detailed ## Comparison Table using markdown table syntax. Include rows for: Price Range, Key Specs, Best For, Pros, Cons, and a Rating (out of 5 ⭐).`
    : format === "pros_cons"
    ? `For each product, create a ## [Product Name] section with **Pros** (5 points) and **Cons** (3–4 points) clearly listed.`
    : format === "narrative"
    ? `Write an ## In-Depth Analysis section covering each product thoroughly — design, performance, value, and real-world use.`
    : `Write a ## Quick Verdict section: 2–3 sentences per product, then a bold winner line.`
  }
• Add a ## Key Differences section highlighting the 4–5 most important differentiators.
• Add a ## Who Should Buy What section — match each product to a specific buyer type.
${withVerdict ? `• Add a ## Our Recommendation section — pick the best overall AND the best value option with a clear justification.` : ""}
• Add a ## Questions to Ask Before Buying section with 4 smart questions.
• End with a ## Key Takeaways section with 3–5 bullet points.
• Be objective, factual, and helpful. Use bold for product names and key specs. Avoid hype.`;

    try {
      const res = await generateAI("compare", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw.replace(/^```markdown\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();

      setResult(raw);
      setActiveTab("preview");
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
    a.download = `product-comparison-${product1.toLowerCase().replace(/\s+/g, "-")}-vs-${product2.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setProduct1(""); setProduct2(""); setProduct3(""); setCategory(""); setBudget("");
    setFocus("overall"); setFormat("table"); setProfile("casual"); setWithVerdict(true);
    setResult(""); setError(""); setCopied(false);
  }

  return (
    <>
      <Helmet>
        <title>Free AI Product Comparison Generator – Compare Any Products | ShauryaTools</title>
        <meta name="description" content="Compare any two or three products side-by-side with AI. Get detailed tables, pros & cons, in-depth reviews, and a clear buying recommendation. Free tool." />
        <meta name="keywords" content="product comparison generator, ai product comparison, compare products, vs comparison, best product recommendation, buying guide, product review ai, which product to buy" />
        <link rel="canonical" href="https://shauryatools.vercel.app/product-comparison-generator" />
      </Helmet>

      <div className="pcg-page">
        <div className="pcg-inner">

          {/* ── Header ── */}
          <div className="pcg-header">
            <div className="pcg-icon">
              <BarChart2 size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="pcg-cat">AI Shopping Tools</span>
              <h1>Product Comparison Generator</h1>
              <p>Enter 2–3 products — get a detailed side-by-side comparison with a clear recommendation.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="pcg-card">

            {/* Products */}
            <div className="pcg-field">
              <label className="pcg-label">
                <Package size={14} strokeWidth={2.5} className="pcg-label-icon" />
                Products to Compare
              </label>
              <div className="pcg-products-grid">
                <div className="pcg-input-group">
                  <span className="pcg-input-label">Product 1 <span className="pcg-required">*</span></span>
                  <input
                    type="text"
                    className="pcg-input pcg-input-p1"
                    placeholder="e.g. Apple AirPods Pro"
                    value={product1}
                    onChange={e => { setProduct1(e.target.value); setError(""); }}
                  />
                </div>
                <div className="pcg-vs-badge">VS</div>
                <div className="pcg-input-group">
                  <span className="pcg-input-label">Product 2 <span className="pcg-required">*</span></span>
                  <input
                    type="text"
                    className="pcg-input pcg-input-p2"
                    placeholder="e.g. Sony WF-1000XM5"
                    value={product2}
                    onChange={e => { setProduct2(e.target.value); setError(""); }}
                  />
                </div>
              </div>
              <div className="pcg-input-group">
                <span className="pcg-input-label">Product 3 <span className="pcg-optional">(optional — add a 3rd to compare)</span></span>
                <input
                  type="text"
                  className="pcg-input"
                  placeholder="e.g. Samsung Galaxy Buds2 Pro"
                  value={product3}
                  onChange={e => setProduct3(e.target.value)}
                />
              </div>
              <div className="pcg-row-2">
                <div className="pcg-input-group">
                  <span className="pcg-input-label">Category / Type <span className="pcg-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="pcg-input"
                    placeholder="e.g. Wireless Earbuds, Laptops, Skincare"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  />
                </div>
                <div className="pcg-input-group">
                  <span className="pcg-input-label">Your Budget <span className="pcg-optional">(optional)</span></span>
                  <input
                    type="text"
                    className="pcg-input"
                    placeholder="e.g. Under $200, ₹10,000–₹20,000"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="pcg-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="pcg-divider" />

            {/* Comparison Focus */}
            <div className="pcg-field">
              <label className="pcg-label">
                <Target size={14} strokeWidth={2.5} className="pcg-label-icon" />
                Comparison Focus
              </label>
              <div className="pcg-formats pcg-formats-3">
                {FOCUS_AREAS.map(f => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      className={`pcg-format-btn ${focus === f.id ? "pcg-fmt-on" : ""}`}
                      onClick={() => setFocus(f.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="pcg-fmt-icon" />
                      <span className="pcg-fmt-label">{f.label}</span>
                      <span className="pcg-fmt-desc">{f.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pcg-divider" />

            {/* Output Format */}
            <div className="pcg-field">
              <label className="pcg-label">
                <Layers size={14} strokeWidth={2.5} className="pcg-label-icon" />
                Output Format
              </label>
              <div className="pcg-formats pcg-formats-4">
                {FORMATS.map(f => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      className={`pcg-format-btn ${format === f.id ? "pcg-fmt-on" : ""}`}
                      onClick={() => setFormat(f.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="pcg-fmt-icon" />
                      <span className="pcg-fmt-label">{f.label}</span>
                      <span className="pcg-fmt-desc">{f.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pcg-divider" />

            {/* Buyer Profile */}
            <div className="pcg-field">
              <label className="pcg-label">
                <Users size={14} strokeWidth={2.5} className="pcg-label-icon" />
                Buyer Profile
              </label>
              <div className="pcg-levels">
                {BUYER_PROFILES.map(p => (
                  <button
                    key={p.id}
                    className={`pcg-level-btn ${profile === p.id ? "pcg-lvl-on" : ""}`}
                    onClick={() => setProfile(p.id)}
                  >
                    <span className="pcg-lvl-label">{p.label}</span>
                    <span className="pcg-lvl-desc">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pcg-divider" />

            {/* Verdict toggle */}
            <div className="pcg-field">
              <label className="pcg-label">
                <ShoppingCart size={14} strokeWidth={2.5} className="pcg-label-icon" />
                Output Options
              </label>
              <button
                className={`pcg-toggle-check ${withVerdict ? "pcg-check-on" : ""}`}
                onClick={() => setWithVerdict(v => !v)}
              >
                <span className="pcg-check-box">{withVerdict ? "✓" : ""}</span>
                <div className="pcg-check-text">
                  <span className="pcg-check-label">Include Final Buying Recommendation</span>
                  <span className="pcg-check-desc">Add a clear "Our Pick" verdict with best overall and best value options</span>
                </div>
              </button>
            </div>

            {/* Generate Button */}
            <button className="pcg-submit-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading ? (
                <><span className="pcg-spinner" /> Comparing Products...</>
              ) : (
                <><Sparkles size={16} strokeWidth={2} /> Generate Comparison</>
              )}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="pcg-card pcg-skeleton-card animate-in">
              <div className="pcg-skel pcg-skel-title" />
              <div className="pcg-skel pcg-skel-line" />
              <div className="pcg-skel pcg-skel-line pcg-skel-short" />
              <div className="pcg-skel pcg-skel-line" />
              <div className="pcg-skel pcg-skel-block" />
              <div className="pcg-skel pcg-skel-line pcg-skel-short" />
              <div className="pcg-skel pcg-skel-line" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="pcg-card animate-in">

              <div className="pcg-result-top">
                <div className="pcg-result-meta">
                  <span className="pcg-result-badge">
                    <BarChart2 size={12} strokeWidth={2.5} />
                    {products.length} Products
                  </span>
                  <span className="pcg-result-badge pcg-badge-focus">
                    {FOCUS_AREAS.find(f => f.id === focus)?.label}
                  </span>
                  <span className="pcg-result-badge pcg-badge-format">
                    {FORMATS.find(f => f.id === format)?.label}
                  </span>
                </div>

                <div className="pcg-tabs">
                  <button className={`pcg-tab ${activeTab === "preview" ? "pcg-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`pcg-tab ${activeTab === "raw"     ? "pcg-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="pcg-actions">
                  <button className="pcg-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="pcg-action-btn" onClick={handleDownload} title="Download comparison">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`pcg-copy-btn ${copied ? "pcg-copied" : ""}`} onClick={handleCopy}>
                    {copied
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy</>}
                  </button>
                </div>
              </div>

              {activeTab === "preview" && (
                <div className="pcg-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
              )}
              {activeTab === "raw" && (
                <pre className="pcg-raw">{result}</pre>
              )}

              <div className="pcg-result-footer">
                <span className="pcg-footer-count">
                  ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
                </span>
                <button className={`pcg-copy-full ${copied ? "pcg-copied" : ""}`} onClick={handleCopy}>
                  {copied
                    ? <><Check size={14} strokeWidth={2.5} /> Copied to clipboard!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Comparison</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
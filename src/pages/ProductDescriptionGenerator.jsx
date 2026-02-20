/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import {
  ShoppingBag, Copy, Check, Download, RefreshCw,
  AlertCircle, Sparkles, Tag, Star, ChevronRight
} from "lucide-react";
import { generateAI } from "../api";
import "./ProductDescriptionGenerator.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/product-description-generator`;

/* ══════════════════════ Constants ══════════════════════ */
const PLATFORMS = [
  { id: "amazon",    label: "Amazon",    emoji: "📦" },
  { id: "shopify",   label: "Shopify",   emoji: "🛍️" },
  { id: "etsy",      label: "Etsy",      emoji: "🎨" },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "flipkart",  label: "Flipkart",  emoji: "🏷️" },
  { id: "general",   label: "General",   emoji: "🌐" },
];

const TONES = [
  { id: "professional",  label: "Professional",  emoji: "💼" },
  { id: "luxury",        label: "Luxury",        emoji: "✨" },
  { id: "friendly",      label: "Casual & Fun",  emoji: "😊" },
  { id: "persuasive",    label: "Persuasive",    emoji: "🎯" },
  { id: "minimalist",    label: "Minimalist",    emoji: "◻️" },
  { id: "storytelling",  label: "Storytelling",  emoji: "📖" },
];

const LENGTHS = [
  { id: "short",  label: "Short",  desc: "~80 words",  value: 80  },
  { id: "medium", label: "Medium", desc: "~150 words", value: 150 },
  { id: "long",   label: "Long",   desc: "~300 words", value: 300 },
  { id: "full",   label: "Full",   desc: "~500 words", value: 500 },
];

const CATEGORIES = [
  "Fashion & Apparel", "Electronics & Gadgets", "Home & Kitchen",
  "Beauty & Skincare", "Food & Beverages", "Fitness & Sports",
  "Jewellery & Accessories", "Books & Stationery", "Toys & Kids",
  "Health & Wellness", "Automotive", "Art & Handmade",
  "Software & Apps", "Pet Supplies", "Office & Stationery",
];

const PRESETS = [
  {
    label: "Earbuds",
    fields: {
      productName: "ProSound X3 Wireless Earbuds",
      category: "Electronics & Gadgets",
      platform: "amazon",
      tone: "professional",
      length: 150,
      price: "₹2,499",
      keyFeatures: "30hr battery, Active Noise Cancellation, IPX5 waterproof, Bluetooth 5.3, 10mm drivers",
      targetAudience: "Music lovers, commuters, work-from-home professionals",
      keywords: "wireless earbuds, anc earbuds, bluetooth 5.3, noise cancelling",
      brand: "ProSound",
    },
  },
  {
    label: "Serum",
    fields: {
      productName: "GlowLab Vitamin C Serum 30ml",
      category: "Beauty & Skincare",
      platform: "shopify",
      tone: "luxury",
      length: 150,
      price: "₹899",
      keyFeatures: "20% Vitamin C, Hyaluronic Acid, Niacinamide, Dermatologically tested, Cruelty-free",
      targetAudience: "Women 25–45, skincare enthusiasts, people with dull or uneven skin tone",
      keywords: "vitamin c serum, brightening serum, anti aging, glow serum",
      brand: "GlowLab",
    },
  },
  {
    label: "T-Shirt",
    fields: {
      productName: "UrbanWear Oversized Graphic Tee",
      category: "Fashion & Apparel",
      platform: "instagram",
      tone: "friendly",
      length: 80,
      price: "₹599",
      keyFeatures: "100% cotton, drop shoulder, unisex fit, pre-shrunk, available S–3XL",
      targetAudience: "Gen Z, streetwear fans, college students",
      keywords: "oversized tee, graphic t-shirt, streetwear, unisex",
      brand: "UrbanWear",
    },
  },
  {
    label: "Protein",
    fields: {
      productName: "MuscleCore Whey Protein 1kg – Chocolate",
      category: "Fitness & Sports",
      platform: "flipkart",
      tone: "persuasive",
      length: 300,
      price: "₹1,799",
      keyFeatures: "24g protein per scoop, 5g BCAA, low sugar, lab tested, 30 servings",
      targetAudience: "Gym goers, fitness enthusiasts, athletes",
      keywords: "whey protein, muscle gain, post workout, protein powder",
      brand: "MuscleCore",
    },
  },
];

const BULLET_BANK = {
  "Electronics & Gadgets":  ["⚡ Fast charging support", "🔒 Advanced security features", "📱 Compatible with iOS & Android", "🔋 Long battery life", "🎧 Crystal-clear audio"],
  "Beauty & Skincare":      ["🌿 Dermatologically tested", "💧 Deeply hydrating formula", "✨ Visible results in 2 weeks", "🐰 Cruelty-free & vegan", "🌸 Suitable for all skin types"],
  "Fashion & Apparel":      ["👕 Premium quality fabric", "🎨 Vibrant fade-resistant colors", "📐 True-to-size fit", "🧼 Machine washable", "♻️ Sustainably sourced"],
  "Fitness & Sports":       ["💪 Clinically tested formula", "🏆 Trusted by athletes", "🔬 Lab certified quality", "⚡ Fast absorption", "🥛 Delicious taste"],
  "Home & Kitchen":         ["🏠 Premium build quality", "🧹 Easy to clean", "⏱️ Saves time & effort", "🌍 Eco-friendly materials", "📦 1-year warranty included"],
  "Food & Beverages":       ["🌾 100% natural ingredients", "🚫 No preservatives", "✅ FSSAI certified", "📦 Resealable packaging", "❄️ Best served chilled"],
  "default":                ["✅ Premium quality", "🚚 Fast delivery", "💯 100% authentic", "🔄 Easy returns", "⭐ Highly rated"],
};

function getBullets(category) {
  return BULLET_BANK[category] || BULLET_BANK["default"];
}

const EMPTY = {
  productName: "", category: "", platform: "general",
  tone: "professional", length: 150, price: "",
  keyFeatures: "", targetAudience: "", keywords: "", brand: "",
};

/* ══════════════════════ Component ══════════════════════ */
export default function ProductDescriptionGenerator() {
  const [f, setF]               = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState(null);
  const [activeTab, setActiveTab] = useState("full");
  const [copied, setCopied]     = useState("");

  const set = (key) => (val) => setF(prev => ({ ...prev, [key]: val }));

  const bulletSuggestions = useMemo(() => getBullets(f.category), [f.category]);

  const applyPreset = (p) => {
    setF({ ...EMPTY, ...p.fields });
    setResult(null);
    setError("");
  };

  async function handleGenerate() {
    if (!f.productName.trim()) { setError("Please enter a product name."); return; }
    if (!f.keyFeatures.trim()) { setError("Please enter at least one key feature."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const platformObj = PLATFORMS.find(p => p.id === f.platform);
      const toneObj     = TONES.find(t => t.id === f.tone);
      const lengthObj   = LENGTHS.find(l => l.value === f.length);

      const prompt = `You are an expert eCommerce copywriter. Generate a complete product listing.

PRODUCT DETAILS:
- Product Name: ${f.productName}
- Brand: ${f.brand || "Not specified"}
- Category: ${f.category || "General"}
- Platform: ${platformObj.label}
- Price: ${f.price || "Not specified"}
- Key Features: ${f.keyFeatures}
- Target Audience: ${f.targetAudience || "General consumers"}
- Tone: ${toneObj.label}
- Desired Length: ~${lengthObj.value} words for full description
${f.keywords ? `- SEO Keywords: ${f.keywords}` : ""}

OUTPUT: Respond ONLY with valid JSON, no markdown, no explanation:
{
  "hook": "One punchy sentence (max 15 words)",
  "short_desc": "2-3 sentence short description (~50 words)",
  "bullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5"],
  "full_desc": "Full product description (~${lengthObj.value} words), platform-optimized for ${platformObj.label}, tone: ${toneObj.label}. Include benefits, use cases, CTA.",
  "seo_title": "SEO product title (max 70 chars)",
  "meta_description": "Meta description (max 160 chars)",
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"]
}

PLATFORM RULES for ${platformObj.label}:
${f.platform === "amazon" ? "Keyword-rich, spec-heavy, no first person, focus on search ranking." : ""}
${f.platform === "shopify" ? "Brand story-driven, lifestyle benefits, strong CTA." : ""}
${f.platform === "etsy" ? "Handmade/artisan feel, personal story, emphasize uniqueness." : ""}
${f.platform === "instagram" ? "Punchy, emoji-friendly, short sentences, caption style." : ""}
${f.platform === "flipkart" ? "Spec-focused, value-for-money angle, comparison-friendly." : ""}
${f.platform === "general" ? "Versatile, balanced detail and readability." : ""}`;

      const res = await generateAI("product_description", prompt);
      if (!res.data.success) throw new Error("ai_fail");

      let raw = res.data.data.trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("parse_fail");

      const parsed = JSON.parse(match[0]);
      setResult(parsed);
      setActiveTab("full");
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
    const text = `PRODUCT: ${f.productName}
Platform: ${PLATFORMS.find(p => p.id === f.platform)?.label}
${"=".repeat(50)}

HOOK
${result.hook}

SHORT DESCRIPTION
${result.short_desc}

KEY BULLETS
${result.bullets?.map(b => `• ${b}`).join("\n")}

FULL DESCRIPTION
${result.full_desc}

SEO
Title: ${result.seo_title}
Meta: ${result.meta_description}
Keywords: ${result.keywords?.join(", ")}
`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${f.productName.replace(/\s+/g, "-").toLowerCase()}-description.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => { setF(EMPTY); setResult(null); setError(""); setCopied(""); };
  const canGenerate = f.productName.trim() && f.keyFeatures.trim() && !loading;
  const nameLen = f.productName.length;
  const nameColor = nameLen > 180 ? "over" : nameLen >= 60 ? "good" : "";

  return (
    <>
      <Helmet>
        <title>Free AI Product Description Generator – eCommerce Copywriting Tool</title>
        <meta name="description" content="Generate SEO-optimized product descriptions for Amazon, Shopify, Etsy, Flipkart & more. AI-powered eCommerce copywriter. Free, no sign-up required." />
        <meta name="keywords" content="product description generator, ai product description, ecommerce copywriter, amazon listing generator, shopify product copy" />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Free AI Product Description Generator" />
        <meta property="og:description" content="Generate SEO-optimized product descriptions for any platform instantly with AI." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Product Description Generator" />
        <meta name="twitter:description" content="Generate SEO-optimized product descriptions for Amazon, Shopify, Etsy & more." />
      </Helmet>

      <div className="pd-page">
        <div className="pd-inner">

          {/* Header */}
          <div className="pd-header">
            <div className="pd-icon"><ShoppingBag size={20} /></div>
            <div>
              <span className="pd-cat">eCommerce Tools</span>
              <h1>Product Description Generator</h1>
              <p>Enter your product details — get platform-optimized, SEO-ready descriptions instantly.</p>
            </div>
          </div>

          {/* Presets */}
          <div className="pd-presets">
            <span className="pd-presets-label">Quick start:</span>
            {PRESETS.map(p => (
              <button key={p.label} className="pd-preset-btn" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="pd-grid">

            {/* LEFT: Form */}
            <div className="pd-col-left">
              <div className="pd-card">
                <div className="pd-card-head">
                  <span className="pd-card-title">Product Details</span>
                </div>
                <div className="pd-form-body">

                  <div className="pd-divider">Product Info</div>

                  <div className="pd-field">
                    <div className="pd-field-top">
                      <span className="pd-label">Product Name <span className="pd-label-hint">— be specific</span></span>
                      <span className={`pd-char ${nameColor}`}>{nameLen}/200</span>
                    </div>
                    <input
                      className="pd-input"
                      value={f.productName}
                      onChange={e => { set("productName")(e.target.value); setError(""); }}
                      placeholder="e.g. ProSound X3 Wireless Earbuds with ANC"
                    />
                  </div>

                  <div className="pd-row2">
                    <div className="pd-field">
                      <span className="pd-label">Brand / Store Name</span>
                      <input className="pd-input" value={f.brand} onChange={e => set("brand")(e.target.value)} placeholder="e.g. ProSound" />
                    </div>
                    <div className="pd-field">
                      <span className="pd-label">Price</span>
                      <input className="pd-input" value={f.price} onChange={e => set("price")(e.target.value)} placeholder="e.g. ₹2,499 / $29.99" />
                    </div>
                  </div>

                  <div className="pd-row2">
                    <div className="pd-field">
                      <span className="pd-label">Category</span>
                      <select className="pd-select" value={f.category} onChange={e => set("category")(e.target.value)}>
                        <option value="">Select category…</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="pd-field">
                      <span className="pd-label">Platform</span>
                      <select className="pd-select" value={f.platform} onChange={e => set("platform")(e.target.value)}>
                        {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pd-divider" style={{ marginTop: 4 }}>Features & Audience</div>

                  <div className="pd-field">
                    <span className="pd-label">Key Features <span className="pd-label-hint">comma-separated</span></span>
                    <textarea
                      className="pd-textarea"
                      value={f.keyFeatures}
                      onChange={e => { set("keyFeatures")(e.target.value); setError(""); }}
                      placeholder="e.g. 30hr battery, Active Noise Cancellation, IPX5 waterproof, Bluetooth 5.3"
                      style={{ minHeight: 70 }}
                    />
                  </div>

                  {f.category && (
                    <div className="pd-field">
                      <span className="pd-label" style={{ marginBottom: 4 }}>
                        Suggestions <span className="pd-label-hint">click to add to features</span>
                      </span>
                      <div className="pd-bullets-wrap">
                        {bulletSuggestions.map(b => (
                          <span
                            key={b}
                            className="pd-bullet-chip"
                            onClick={() => set("keyFeatures")(f.keyFeatures ? f.keyFeatures + ", " + b : b)}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pd-field">
                    <span className="pd-label">Target Audience</span>
                    <input
                      className="pd-input"
                      value={f.targetAudience}
                      onChange={e => set("targetAudience")(e.target.value)}
                      placeholder="e.g. Music lovers, work-from-home professionals, ages 20–35"
                    />
                  </div>

                  <div className="pd-divider" style={{ marginTop: 4 }}>Style & SEO</div>

                  <div className="pd-field">
                    <span className="pd-label">Tone</span>
                    <div className="pd-chips">
                      {TONES.map(t => (
                        <button
                          key={t.id}
                          className={`pd-chip ${f.tone === t.id ? "pd-chip-on" : ""}`}
                          onClick={() => set("tone")(t.id)}
                        >
                          <span>{t.emoji}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pd-field">
                    <span className="pd-label">Description Length</span>
                    <div className="pd-chips">
                      {LENGTHS.map(l => (
                        <button
                          key={l.id}
                          className={`pd-chip ${f.length === l.value ? "pd-chip-on" : ""}`}
                          onClick={() => set("length")(l.value)}
                        >
                          <span>{l.label}</span>
                          <span className="pd-chip-sub">{l.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pd-field">
                    <span className="pd-label">SEO Keywords <span className="pd-label-hint">comma-separated</span></span>
                    <input
                      className="pd-input"
                      value={f.keywords}
                      onChange={e => set("keywords")(e.target.value)}
                      placeholder="e.g. wireless earbuds, noise cancelling, bluetooth earphones"
                    />
                  </div>

                  {error && (
                    <div className="pd-error">
                      <AlertCircle size={13} /> {error}
                    </div>
                  )}

                  <button className="pd-gen-btn" onClick={handleGenerate} disabled={!canGenerate}>
                    {loading
                      ? <><span className="pd-spinner" /> Generating Description…</>
                      : <><Sparkles size={15} /> Generate Description</>
                    }
                  </button>

                </div>
              </div>
            </div>

            {/* RIGHT: Preview + Output */}
            <div className="pd-col-right">

              {/* Mock Preview */}
              <div className="pd-card">
                <div className="pd-card-head">
                  <span className="pd-card-title">Product Preview</span>
                  {f.platform && (
                    <span className="pd-platform-badge">
                      {PLATFORMS.find(p => p.id === f.platform)?.emoji}{" "}
                      {PLATFORMS.find(p => p.id === f.platform)?.label}
                    </span>
                  )}
                </div>
                <div className="pd-preview-body">
                  <div className="pd-mock-img">
                    <ShoppingBag size={32} opacity={0.2} />
                    <span>Product image</span>
                  </div>
                  <div className="pd-mock-info">
                    {result?.hook && <div className="pd-mock-hook">{result.hook}</div>}
                    <div className="pd-mock-name">{f.productName || "Your Product Name"}</div>
                    {f.brand && <div className="pd-mock-brand">by {f.brand}</div>}
                    {f.price && <div className="pd-mock-price">{f.price}</div>}
                    <div className="pd-mock-stars">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={11} fill={i <= 4 ? "currentColor" : "none"} />
                      ))}
                      <span className="pd-mock-rating">4.2 (128 reviews)</span>
                    </div>
                    <div className="pd-mock-desc">
                      {result?.short_desc || f.keyFeatures || "Your product description will appear here after generation…"}
                    </div>
                    {result?.bullets && (
                      <ul className="pd-mock-bullets">
                        {result.bullets.slice(0, 3).map((b, i) => (
                          <li key={i}><ChevronRight size={10} /> {b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Skeleton */}
              {loading && (
                <div className="pd-card animate-in">
                  <div className="pd-skeleton-body">
                    <div className="pd-skel pd-skel-title" />
                    <div className="pd-skel pd-skel-line" />
                    <div className="pd-skel pd-skel-short pd-skel-line" />
                    <div className="pd-skel pd-skel-block" />
                    <div className="pd-skel pd-skel-line" />
                    <div className="pd-skel pd-skel-short pd-skel-line" />
                  </div>
                </div>
              )}

              {/* Output card */}
              {result && !loading && (
                <div className="pd-card animate-in">
                  <div className="pd-result-top">
                    <div className="pd-tabs">
                      {[
                        { id: "full",    label: "Full Copy" },
                        { id: "bullets", label: "Bullets"   },
                        { id: "seo",     label: "SEO"       },
                      ].map(t => (
                        <button
                          key={t.id}
                          className={`pd-tab ${activeTab === t.id ? "pd-tab-on" : ""}`}
                          onClick={() => setActiveTab(t.id)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="pd-output-actions">
                      <button className="pd-sm-btn" onClick={handleReset}><RefreshCw size={12} /> New</button>
                      <button className="pd-sm-btn" onClick={handleDownload}><Download size={12} /> Download</button>
                      <button
                        className={`pd-copy-btn ${copied === "main" ? "copied" : ""}`}
                        onClick={() => handleCopy("main",
                          activeTab === "full"    ? result.full_desc :
                          activeTab === "bullets" ? result.bullets?.join("\n") :
                          `${result.seo_title}\n\n${result.meta_description}\n\nKeywords: ${result.keywords?.join(", ")}`
                        )}
                      >
                        {copied === "main" ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                  </div>

                  {/* Full Tab */}
                  {activeTab === "full" && (
                    <div className="pd-output-content">
                      {result.hook && (
                        <div className="pd-output-hook">
                          <span className="pd-output-section-label">✦ Hook</span>
                          <p>{result.hook}</p>
                        </div>
                      )}
                      <span className="pd-output-section-label" style={{ marginTop: 12, display: "block" }}>Full Description</span>
                      <p className="pd-output-text">{result.full_desc}</p>
                    </div>
                  )}

                  {/* Bullets Tab */}
                  {activeTab === "bullets" && (
                    <div className="pd-output-content">
                      <span className="pd-output-section-label">Key Feature Bullets</span>
                      <ul className="pd-output-bullets">
                        {result.bullets?.map((b, i) => (
                          <li key={i} className="pd-output-bullet-item">
                            <span className="pd-bullet-text">{b}</span>
                            <button className="pd-bullet-copy" onClick={() => handleCopy(`b${i}`, b)}>
                              {copied === `b${i}` ? <Check size={11} /> : <Copy size={11} />}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <span className="pd-output-section-label" style={{ marginTop: 14, display: "block" }}>Short Description</span>
                      <p className="pd-output-text">{result.short_desc}</p>
                    </div>
                  )}

                  {/* SEO Tab */}
                  {activeTab === "seo" && (
                    <div className="pd-output-content">
                      <div className="pd-seo-grid">
                        <div className="pd-seo-item">
                          <div className="pd-seo-label">
                            SEO Title
                            <button className="pd-seo-copy" onClick={() => handleCopy("seo-title", result.seo_title)}>
                              {copied === "seo-title" ? <Check size={11} /> : <Copy size={11} />}
                            </button>
                          </div>
                          <p className="pd-seo-value">{result.seo_title}</p>
                          <span className="pd-seo-count">{result.seo_title?.length}/70</span>
                        </div>
                        <div className="pd-seo-item">
                          <div className="pd-seo-label">
                            Meta Description
                            <button className="pd-seo-copy" onClick={() => handleCopy("seo-meta", result.meta_description)}>
                              {copied === "seo-meta" ? <Check size={11} /> : <Copy size={11} />}
                            </button>
                          </div>
                          <p className="pd-seo-value">{result.meta_description}</p>
                          <span className="pd-seo-count">{result.meta_description?.length}/160</span>
                        </div>
                        <div className="pd-seo-item pd-seo-full">
                          <div className="pd-seo-label">Keywords</div>
                          <div className="pd-kw-list">
                            {result.keywords?.map((kw, i) => (
                              <span key={i} className="pd-kw-tag">{kw}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pd-result-footer">
                    <span className="pd-word-count">
                      {result.full_desc?.split(/\s+/).filter(Boolean).length} words · {result.full_desc?.length} chars
                    </span>
                    <button
                      className={`pd-sm-btn ${copied === "footer" ? "pd-copy-btn copied" : ""}`}
                      onClick={() => handleCopy("footer", result.full_desc)}
                    >
                      {copied === "footer" ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy Full</>}
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
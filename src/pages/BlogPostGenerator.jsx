/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useEffect } from "react";
import { generateAI } from "../api";
import "./BlogPostGenerator.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/blog-generator`;

/* ─────────────── Constants ─────────────── */
const POST_TYPES = [
  { id: "guide",       label: "How-To Guide",      emoji: "📖", desc: "Step-by-step instructional content" },
  { id: "listicle",    label: "Listicle",          emoji: "📝", desc: "Top 10, Tips, Hacks format" },
  { id: "opinion",     label: "Opinion Piece",     emoji: "💬", desc: "Thought leadership & perspective" },
  { id: "tutorial",    label: "Tutorial",          emoji: "🎯", desc: "Deep dive with code/examples" },
  { id: "case-study",  label: "Case Study",        emoji: "📊", desc: "Real-world success story" },
  { id: "news",        label: "News Analysis",     emoji: "📰", desc: "Industry trends & insights" },
];

const WORD_COUNTS = [
  { id: "short",   label: "Short",   value: 800,  desc: "Quick read" },
];

const TONES = [
  { id: "professional",  label: "Professional",    emoji: "💼" },
  { id: "conversational",label: "Conversational",  emoji: "💬" },
  { id: "academic",      label: "Academic",        emoji: "🎓" },
  { id: "storytelling",  label: "Storytelling",    emoji: "📚" },
  { id: "humorous",      label: "Humorous",        emoji: "😄" },
  { id: "inspirational", label: "Inspirational",   emoji: "🔥" },
];

const LANGUAGES = [
  { id: "english", label: "English", flag: "🇬🇧" },
  { id: "hindi",   label: "हिंदी",    flag: "🇮🇳" },
  { id: "marathi", label: "मराठी",    flag: "🏳️" },
];

/* ─────────────── Icons ─────────────── */
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);

const IconSparkle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const IconBlog = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <path d="M7 9h10M7 13h10M7 17h7"/>
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconDownloadHTML = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

/* ─────────────── Component ─────────────── */
export default function BlogPostGenerator() {
  const [topic,        setTopic]        = useState("");
  const [postType,     setPostType]     = useState("guide");
  const [wordCount,    setWordCount]    = useState(1500);
  const [tone,         setTone]         = useState("professional");
  const [language,     setLanguage]     = useState("english");
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeBody,  setIncludeBody]  = useState(true);
  const [includeFAQ,   setIncludeFAQ]   = useState(false);
  const [includeCTA,   setIncludeCTA]   = useState(true);  // fixed typo: was setCludeCTA
  const [includeSEO,   setIncludeSEO]   = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [blogPost,     setBlogPost]     = useState(null);
  const [copiedId,     setCopiedId]     = useState(null);
  const [activeTab,    setActiveTab]    = useState("content");

  // ── Replaces react-helmet ──
  useEffect(() => {
    document.title = "AI Blog Post Generator – SEO Optimized | ShauryaTools";

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      "Generate SEO-optimized blog posts instantly. Supports multiple languages, post types, and word counts. Free AI blog writer tool.";

    // Set canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = PAGE_URL;

    // Restore title on unmount
    return () => {
      document.title = "ShauryaTools";
    };
  }, []);

  const canGenerate = topic.trim().length > 3 && !loading;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    setBlogPost(null);

    try {
      const typeObj = POST_TYPES.find(p => p.id === postType);
      const toneObj = TONES.find(t => t.id === tone);
      const langObj = LANGUAGES.find(l => l.id === language);

      const msg = `You are an expert blog writer and SEO specialist. Create a high-quality, engaging blog post.

POST TOPIC: ${topic}
POST TYPE: ${typeObj.label}
WORD COUNT: ~${wordCount} words (approximately, +/- 5%)
TONE: ${toneObj.label}
LANGUAGE: ${langObj.label}
INCLUDE_INTRO: ${includeIntro}
INCLUDE_BODY: ${includeBody}
INCLUDE_FAQ: ${includeFAQ}
INCLUDE_CTA: ${includeCTA}
INCLUDE_SEO: ${includeSEO}

CONTENT STRUCTURE:
${includeIntro ? `
1. INTRODUCTION (Hook + Context)
   - Start with an engaging hook that grabs attention
   - Establish relevance and why reader should care
   - Hint at what they'll learn
` : ""}
${includeBody ? `
2. MAIN BODY (Multiple Sections)
   - Use 3-5 subheadings (H2)
   - Each section should have 150-300 words
   - Include practical examples or case studies
   - Use bullet points for key takeaways
` : ""}
${includeFAQ ? `
3. FAQ SECTION
   - Create 4-5 common questions
   - Provide clear, concise answers
` : ""}
${includeCTA ? `
4. CALL-TO-ACTION
   - Strong closing CTA that aligns with content
   - Encourage engagement or next steps
` : ""}

SEO REQUIREMENTS ${includeSEO ? `(INCLUDE)` : `(OPTIONAL)`}:
- Natural keyword placement (2-3 times in body)
- Meta description (160 characters max)
- Meta title (60 characters max)
- 3-5 relevant keywords
- Internal linking suggestions (use format: [anchor text] - /path)
- Schema markup type recommendation

STRICT OUTPUT FORMAT — respond with ONLY valid JSON, no markdown:
{
  "title": "Blog Post Title",
  "slug": "url-slug",
  "intro": "Introduction paragraph (if included)",
  "sections": [
    {
      "heading": "Section Heading",
      "content": "Section content with full paragraphs"
    }
  ],
  "faqs": [
    {
      "question": "Question?",
      "answer": "Answer"
    }
  ],
  "cta": "Call-to-action text",
  "seo": {
    "meta_title": "Title for search engines",
    "meta_description": "Description text",
    "keywords": ["keyword1", "keyword2"],
    "internal_links": ["[anchor] - /path"],
    "schema_type": "Article"
  },
  "word_count": ${wordCount},
  "reading_time": 5
}

Rules:
• Write naturally and engagingly
• Avoid keyword stuffing
• Use short paragraphs and varied sentence length
• Include practical value and actionable insights
• Output ONLY raw JSON. Nothing else.`;

      const res = await generateAI("blog", msg);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);

      setBlogPost({
        ...parsed,
        id: Date.now(),
        type: typeObj,
        tone: toneObj,
        language: langObj,
        createdAt: new Date().toLocaleString(),
      });

    } catch (e) {
      setError("Could not generate blog post. Please check your topic and try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyText(key, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2200);
  }

  function downloadAsHTML() {
    if (!blogPost) return;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blogPost.title}</title>
  <meta name="description" content="${blogPost.seo?.meta_description || ''}">
  <meta name="keywords" content="${blogPost.seo?.keywords?.join(', ') || ''}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #f9f9f9; }
    article { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { font-size: 2.5rem; margin-bottom: 20px; color: #1a1a1a; line-height: 1.2; }
    h2 { font-size: 1.8rem; margin-top: 40px; margin-bottom: 16px; color: #2a2a2a; border-left: 4px solid #16a34a; padding-left: 16px; }
    p { margin-bottom: 16px; }
    .meta { font-size: 0.9rem; color: #666; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    .section-faqs { background: #f0fdf4; padding: 24px; border-radius: 8px; margin-top: 40px; }
    .faq-item { margin-bottom: 20px; }
    .faq-q { font-weight: 600; color: #16a34a; margin-bottom: 8px; }
    .cta-box { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; border-radius: 8px; margin-top: 40px; text-align: center; }
    .seo-info { background: #eff6ff; padding: 16px; border-radius: 8px; font-size: 0.85rem; color: #1e40af; margin-top: 40px; }
  </style>
</head>
<body>
  <article>
    <h1>${blogPost.title}</h1>
    <div class="meta"><strong>Type:</strong> ${blogPost.type.label} | <strong>Reading Time:</strong> ${blogPost.reading_time} min | <strong>Words:</strong> ${blogPost.word_count}</div>
    ${blogPost.intro ? `<p>${blogPost.intro}</p>` : ""}
    ${blogPost.sections.map(s => `<section><h2>${s.heading}</h2><p>${s.content}</p></section>`).join("")}
    ${blogPost.faqs?.length > 0 ? `<div class="section-faqs"><h2>Frequently Asked Questions</h2>${blogPost.faqs.map(f => `<div class="faq-item"><p class="faq-q">Q: ${f.question}</p><p><strong>A:</strong> ${f.answer}</p></div>`).join("")}</div>` : ""}
    ${blogPost.cta ? `<div class="cta-box"><p>${blogPost.cta}</p></div>` : ""}
    ${blogPost.seo ? `<div class="seo-info"><strong>SEO Meta:</strong><div><strong>Title:</strong> ${blogPost.seo.meta_title}</div><div><strong>Description:</strong> ${blogPost.seo.meta_description}</div><div><strong>Keywords:</strong> ${blogPost.seo.keywords?.join(', ')}</div><div><strong>Schema:</strong> ${blogPost.seo.schema_type}</div></div>` : ""}
  </article>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${blogPost.slug || 'blog-post'}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadAsText() {
    if (!blogPost) return;
    const text = `BLOG POST: ${blogPost.title}
Type: ${blogPost.type.label}
Slug: ${blogPost.slug}
Reading Time: ${blogPost.reading_time} min
Word Count: ${blogPost.word_count}

${"=".repeat(80)}

${blogPost.intro ? `\nINTRODUCTION\n${"-".repeat(40)}\n${blogPost.intro}\n` : ""}
${blogPost.sections.map((s, i) => `\n${"#".repeat(i + 2)} ${s.heading}\n${s.content}\n`).join("\n")}
${blogPost.faqs?.length > 0 ? `\nFAQS\n${"-".repeat(40)}\n${blogPost.faqs.map((f, i) => `Q${i+1}: ${f.question}\nA: ${f.answer}`).join("\n\n")}\n` : ""}
${blogPost.cta ? `\nCALL-TO-ACTION\n${"-".repeat(40)}\n${blogPost.cta}\n` : ""}
${blogPost.seo ? `\nSEO METADATA\n${"-".repeat(40)}\nMeta Title: ${blogPost.seo.meta_title}\nMeta Description: ${blogPost.seo.meta_description}\nKeywords: ${blogPost.seo.keywords?.join(', ')}\nInternal Links: ${blogPost.seo.internal_links?.join(', ')}\nSchema Type: ${blogPost.seo.schema_type}` : ""}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${blogPost.slug || 'blog-post'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setTopic("");
    setBlogPost(null);
    setError("");
    setActiveTab("content");
  }

  const TOGGLES = [
    { key: "intro", icon: "📝", label: "Introduction",    sub: "Engaging hook & context setting",  val: includeIntro, set: setIncludeIntro },
    { key: "body",  icon: "📄", label: "Main Body",       sub: "Structured sections with details",  val: includeBody,  set: setIncludeBody  },
    { key: "faq",   icon: "❓", label: "FAQ Section",     sub: "Common questions answered",         val: includeFAQ,   set: setIncludeFAQ   },
    { key: "cta",   icon: "👆", label: "Call-to-Action",  sub: "Strong engagement closing",         val: includeCTA,   set: setIncludeCTA   },
    { key: "seo",   icon: "🔍", label: "SEO Optimization",sub: "Meta tags, keywords & schema",      val: includeSEO,   set: setIncludeSEO   },
  ];

  return (
    <div className="bg-page">
      <div className="bg-inner">

        {/* Header */}
        <div className="bg-header">
          <div className="bg-icon"><IconBlog /></div>
          <div>
            <span className="bg-cat">Content Tools</span>
            <h1 className="bg-header-title">Blog Post Generator</h1>
            <p className="bg-header-sub">
              Create professional blog posts in <strong>English</strong>, <strong>हिंदी</strong> &amp; <strong>मराठी</strong> — with SEO optimization.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card">

          {/* Topic */}
          <div className="bg-field">
            <div className="bg-label-row">
              <label className="bg-label">What&apos;s your blog topic?</label>
              {topic.length > 3 && <span className="bg-ready-badge">✓ Ready</span>}
            </div>
            <textarea
              className="bg-textarea"
              value={topic}
              onChange={e => { setTopic(e.target.value); setError(""); }}
              placeholder="e.g. How to build a successful remote team culture..."
              rows={3}
              maxLength={500}
            />
            <div className="bg-char-row">
              <span className="bg-char-hint">{topic.length}/500 characters</span>
            </div>
          </div>

          <div className="bg-divider" />

          {/* Post Type */}
          <div className="bg-field">
            <label className="bg-label">Post Type</label>
            <div className="bg-grid-2">
              {POST_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`bg-type-btn ${postType === t.id ? "bg-type-on" : ""}`}
                  onClick={() => setPostType(t.id)}
                  title={t.desc}
                >
                  <span className="bg-type-emoji">{t.emoji}</span>
                  <span className="bg-type-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-divider" />

          {/* Word Count + Tone */}
          <div className="bg-options-flex">
            <div className="bg-field">
              <label className="bg-label">Word Count</label>
              <div className="bg-chips">
                {WORD_COUNTS.map(w => (
                  <button
                    key={w.id}
                    className={`bg-chip ${wordCount === w.value ? "bg-chip-on" : ""}`}
                    onClick={() => setWordCount(w.value)}
                  >
                    <span>{w.label}</span>
                    <span className="bg-chip-sub">~{w.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-field">
              <label className="bg-label">Tone</label>
              <div className="bg-chips">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    className={`bg-chip ${tone === t.id ? "bg-chip-on" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-divider" />

          {/* Language */}
          <div className="bg-field">
            <label className="bg-label">Language</label>
            <div className="bg-lang-row">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  className={`bg-lang-btn ${language === l.id ? "bg-lang-on" : ""}`}
                  onClick={() => setLanguage(l.id)}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-divider" />

          {/* Toggles */}
          <div className="bg-toggles">
            {TOGGLES.map(tog => (
              <div key={tog.key} className="bg-toggle-row">
                <div className="bg-toggle-info">
                  <span className="bg-toggle-icon">{tog.icon}</span>
                  <div>
                    <p className="bg-toggle-label">{tog.label}</p>
                    <p className="bg-toggle-sub">{tog.sub}</p>
                  </div>
                </div>
                <button
                  className={`bg-toggle ${tog.val ? "bg-toggle-on" : ""}`}
                  onClick={() => tog.set(v => !v)}
                  aria-label={tog.label}
                >
                  <span className="bg-toggle-thumb" />
                </button>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-error-msg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button className="bg-gen-btn" onClick={handleGenerate} disabled={!canGenerate}>
            {loading
              ? <><span className="bg-spinner" /> Generating your post...</>
              : <><IconSparkle /> Generate Blog Post</>
            }
          </button>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="bg-skel-container">
            <div className="bg-card bg-skel-card">
              <div className="bg-skel bg-skel-title" />
              <div className="bg-skel bg-skel-line" />
              <div className="bg-skel bg-skel-line" />
              <div className="bg-skel bg-skel-line bg-skel-short" />
            </div>
          </div>
        )}

        {/* Results */}
        {blogPost && !loading && (
          <div className="bg-results animate-in">

            <div className="bg-results-top">
              <div>
                <h2 className="bg-results-title">📝 Blog Post Created</h2>
                <div className="bg-meta-row">
                  <span className="bg-meta-pill">{blogPost.type.emoji} {blogPost.type.label}</span>
                  <span className="bg-meta-pill">📊 {blogPost.word_count} words</span>
                  <span className="bg-meta-pill">⏱️ {blogPost.reading_time} min read</span>
                </div>
              </div>
              <div className="bg-results-actions">
                <button className="bg-action-btn" onClick={downloadAsHTML}><IconDownloadHTML /> HTML</button>
                <button className="bg-action-btn" onClick={downloadAsText}><IconDownload /> Text</button>
                <button className="bg-action-btn" onClick={handleReset}><IconTrash /> Clear</button>
                <button className="bg-regen-btn" onClick={handleGenerate}><IconRefresh /> Regenerate</button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-tab-nav">
              <button className={`bg-tab-btn ${activeTab === "content" ? "bg-tab-active" : ""}`} onClick={() => setActiveTab("content")}>
                Content
              </button>
              {blogPost.seo && (
                <button className={`bg-tab-btn ${activeTab === "seo" ? "bg-tab-active" : ""}`} onClick={() => setActiveTab("seo")}>
                  SEO
                </button>
              )}
            </div>

            {/* Content Tab */}
            {activeTab === "content" && (
              <div className="bg-content-view">
                <div className="bg-post-header">
                  <h1 className="bg-post-title">{blogPost.title}</h1>
                  <p className="bg-post-slug">/{blogPost.slug}</p>
                </div>

                {blogPost.intro && (
                  <div className="bg-section">
                    <p className="bg-intro-text">{blogPost.intro}</p>
                  </div>
                )}

                {blogPost.sections.map((section, idx) => (
                  <div key={idx} className="bg-section">
                    <h2 className="bg-section-heading">{section.heading}</h2>
                    <p className="bg-section-content">{section.content}</p>
                  </div>
                ))}

                {blogPost.faqs?.length > 0 && (
                  <div className="bg-faq-section">
                    <h2 className="bg-section-heading">Frequently Asked Questions</h2>
                    {blogPost.faqs.map((faq, idx) => (
                      <div key={idx} className="bg-faq-item">
                        <p className="bg-faq-q">{faq.question}</p>
                        <p className="bg-faq-a">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {blogPost.cta && (
                  <div className="bg-cta-box">
                    <p>{blogPost.cta}</p>
                  </div>
                )}

                <button
                  className="bg-copy-full-btn"
                  onClick={() => copyText("full-content", (blogPost.intro || "") + "\n\n" + blogPost.sections.map(s => s.heading + "\n" + s.content).join("\n\n"))}
                >
                  {copiedId === "full-content" ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy All Content</>}
                </button>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && blogPost.seo && (
              <div className="bg-seo-view">
                <div className="bg-seo-item">
                  <h3 className="bg-seo-label">Meta Title</h3>
                  <p className="bg-seo-content">{blogPost.seo.meta_title}</p>
                  <span className="bg-seo-count">{blogPost.seo.meta_title.length}/60</span>
                  <button className="bg-copy-seo-btn" onClick={() => copyText("meta-title", blogPost.seo.meta_title)}>
                    {copiedId === "meta-title" ? <IconCheck /> : <IconCopy />}
                  </button>
                </div>

                <div className="bg-seo-item">
                  <h3 className="bg-seo-label">Meta Description</h3>
                  <p className="bg-seo-content">{blogPost.seo.meta_description}</p>
                  <span className="bg-seo-count">{blogPost.seo.meta_description.length}/160</span>
                  <button className="bg-copy-seo-btn" onClick={() => copyText("meta-desc", blogPost.seo.meta_description)}>
                    {copiedId === "meta-desc" ? <IconCheck /> : <IconCopy />}
                  </button>
                </div>

                <div className="bg-seo-item">
                  <h3 className="bg-seo-label">🔑 Keywords</h3>
                  <div className="bg-keywords-list">
                    {blogPost.seo.keywords.map((kw, idx) => (
                      <span key={idx} className="bg-keyword-tag">{kw}</span>
                    ))}
                  </div>
                </div>

                {blogPost.seo.internal_links?.length > 0 && (
                  <div className="bg-seo-item">
                    <h3 className="bg-seo-label">🔗 Internal Links</h3>
                    <ul className="bg-links-list">
                      {blogPost.seo.internal_links.map((link, idx) => (
                        <li key={idx}>{link}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-seo-item">
                  <h3 className="bg-seo-label">📋 Schema Type</h3>
                  <p className="bg-seo-content">{blogPost.seo.schema_type}</p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
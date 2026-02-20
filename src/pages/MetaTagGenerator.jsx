/* eslint-disable no-unused-vars */
import { useState, useMemo } from "react";
import "./MetaTagGenerator.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconMeta = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ══════════════════════════════════════
   Helpers
   ══════════════════════════════════════ */
function charColor(len, ideal, max) {
  if (len === 0) return "";
  if (len > max) return "over";
  if (len >= ideal) return "good";
  if (len >= ideal * 0.8) return "warn";
  return "";
}

function progressColor(len, ideal, max) {
  if (len > max) return "var(--red)";
  if (len >= ideal) return "var(--green)";
  if (len >= ideal * 0.6) return "var(--orange)";
  return "var(--blue)";
}

function extractDomain(url) {
  try {
    return new URL(url.startsWith("http") ? url : "https://" + url).hostname;
  } catch {
    return url || "example.com";
  }
}

/* ── Meta tag builder ── */
function buildTags(f, toggles) {
  const lines = [];
  const push = (tag) => lines.push(tag);
  const blank = () => lines.push("");

  push("<!-- Primary Meta Tags -->");
  if (f.title)       push(`<title>${f.title}</title>`);
  if (f.title)       push(`<meta name="title" content="${f.title}">`);
  if (f.description) push(`<meta name="description" content="${f.description}">`);
  if (f.keywords)    push(`<meta name="keywords" content="${f.keywords}">`);
  if (f.author)      push(`<meta name="author" content="${f.author}">`);
  if (f.robots)      push(`<meta name="robots" content="${f.robots}">`);
  if (f.canonical)   push(`<link rel="canonical" href="${f.canonical}">`);
  if (f.charset)     push(`<meta charset="${f.charset}">`);
  push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);

  if (toggles.og) {
    blank();
    push("<!-- Open Graph / Facebook -->");
    push(`<meta property="og:type" content="${f.ogType || "website"}">`);
    if (f.title)       push(`<meta property="og:title" content="${f.ogTitle || f.title}">`);
    if (f.description) push(`<meta property="og:description" content="${f.ogDesc || f.description}">`);
    if (f.canonical)   push(`<meta property="og:url" content="${f.canonical}">`);
    if (f.siteName)    push(`<meta property="og:site_name" content="${f.siteName}">`);
    if (f.ogImage)     push(`<meta property="og:image" content="${f.ogImage}">`);
    if (f.ogImage)     push(`<meta property="og:image:alt" content="${f.ogImageAlt || f.title}">`);
    if (f.locale)      push(`<meta property="og:locale" content="${f.locale}">`);
  }

  if (toggles.twitter) {
    blank();
    push("<!-- Twitter -->");
    push(`<meta property="twitter:card" content="${f.twitterCard || "summary_large_image"}">`);
    if (f.title)       push(`<meta property="twitter:title" content="${f.ogTitle || f.title}">`);
    if (f.description) push(`<meta property="twitter:description" content="${f.ogDesc || f.description}">`);
    if (f.ogImage)     push(`<meta property="twitter:image" content="${f.ogImage}">`);
    if (f.twitterSite) push(`<meta property="twitter:site" content="${f.twitterSite}">`);
    if (f.twitterCreator) push(`<meta property="twitter:creator" content="${f.twitterCreator}">`);
  }

  if (toggles.theme) {
    blank();
    push("<!-- Theme & App -->");
    if (f.themeColor)  push(`<meta name="theme-color" content="${f.themeColor}">`);
    if (f.appName)     push(`<meta name="application-name" content="${f.appName}">`);
    if (f.generator)   push(`<meta name="generator" content="${f.generator}">`);
    if (f.themeColor)  push(`<meta name="msapplication-TileColor" content="${f.themeColor}">`);
    if (f.appleMobile) push(`<meta name="apple-mobile-web-app-capable" content="yes">`);
    if (f.appleMobile) push(`<meta name="apple-mobile-web-app-status-bar-style" content="default">`);
  }

  return lines.join("\n");
}

/* ══════════════════
   Sub-components
   ══════════════════ */
function CharField({ label, hint, value, onChange, placeholder, max, ideal, multiline }) {
  const len = value.length;
  const cc  = charColor(len, ideal, max);
  const pct = Math.min((len / max) * 100, 100);
  const pc  = progressColor(len, ideal, max);

  return (
    <>
    <Helmet>
      <title>Free Meta Tag Generator – SEO, Open Graph & Twitter Cards</title>
      <meta name="description" content="Generate SEO meta tags, Open Graph tags, and Twitter Card tags with live Google and social preview. Download or copy the HTML. Free online tool." />
      <meta name="keywords" content="meta tag generator, seo meta tags, open graph generator, twitter card generator, meta description generator, html meta tags" />
      <link rel="canonical" href="https://shauryatools.vercel.app/meta-tag-generator" />
    </Helmet>
    <div className="mt-field">
      <div className="mt-field-top">
        <span className="mt-label">
          {label}
          {hint && <span className="mt-label-hint"> — {hint}</span>}
        </span>
        {max && (
          <span className={`mt-char-count ${cc}`}>
            {len}/{max}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          className="mt-textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="mt-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {max && (
        <div className="mt-progress-bar">
          <div
            className="mt-progress-fill"
            style={{ width: `${pct}%`, background: pc }}
          />
        </div>
      )}
    </div>
    </>
  );
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <div className="mt-toggle-row" onClick={() => onChange(!checked)}>
      <div className="mt-toggle-info">
        <span className="mt-toggle-label">{label}</span>
        {sub && <span className="mt-toggle-sub">{sub}</span>}
      </div>
      <div className={`mt-switch ${checked ? "on" : ""}`}>
        <div className="mt-switch-dot" />
      </div>
    </div>
  );
}

/* ══════════════════
   Main Component
   ══════════════════ */
const TABS = ["General", "Open Graph", "Twitter", "Theme & App"];

const ROBOTS_OPTIONS = [
  "index, follow",
  "noindex, nofollow",
  "index, nofollow",
  "noindex, follow",
  "noarchive",
  "nosnippet",
];

const CHARSET_OPTIONS = ["UTF-8", "ISO-8859-1", "UTF-16"];

const OG_TYPES = ["website", "article", "book", "profile", "music.song", "video.movie", "product"];

const TWITTER_CARDS = ["summary", "summary_large_image", "app", "player"];

export default function MetaTagGenerator() {
  const [tab, setTab] = useState("General");
  const [previewTab, setPreviewTab] = useState("google");
  const [copied, setCopied] = useState(false);

  /* ── Toggles ── */
  const [toggles, setToggles] = useState({ og: true, twitter: true, theme: false });
  const setToggle = (key, val) => setToggles(prev => ({ ...prev, [key]: val }));

  /* ── Fields ── */
  const [f, setF] = useState({
    title: "",
    description: "",
    keywords: "",
    author: "",
    robots: "index, follow",
    canonical: "",
    charset: "UTF-8",
    // OG
    ogTitle: "",
    ogDesc: "",
    ogType: "website",
    ogImage: "",
    ogImageAlt: "",
    siteName: "",
    locale: "en_US",
    // Twitter
    twitterCard: "summary_large_image",
    twitterSite: "",
    twitterCreator: "",
    // Theme
    themeColor: "#ffffff",
    appName: "",
    generator: "",
    appleMobile: false,
  });

  const set = (key) => (val) => setF(prev => ({ ...prev, [key]: val }));

  /* ── Output ── */
  const output = useMemo(() => buildTags(f, toggles), [f, toggles]);
  const tagCount = useMemo(() => (output.match(/<(meta|link|title)/g) || []).length, [output]);

  /* ── Copy ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Download ── */
  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "meta-tags.html"; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Domain preview ── */
  const domain = extractDomain(f.canonical);
  const displayTitle = f.title || "Page Title";
  const displayDesc  = f.description || "Add a description to see it previewed here.";

  return (
    <div className="mt-page">
      <div className="mt-inner">

        {/* ── Header ── */}
        <div className="mt-header">
          <div className="mt-icon"><IconMeta /></div>
          <div>
            <span className="mt-cat">Dev Tools</span>
            <h1>Meta Tag Generator</h1>
            <p>Generate SEO, Open Graph, and Twitter Card meta tags with live preview for Google and social sharing.</p>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="mt-grid">

          {/* ── Left: form ── */}
          <div className="mt-col-left">
            <div className="mt-card">

              {/* Section tabs */}
              <div className="mt-tabs">
                {TABS.map(t => (
                  <button
                    key={t}
                    className={`mt-tab ${tab === t ? "mt-tab-on" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mt-form-body">

                {/* ── General ── */}
                {tab === "General" && (
                  <>
                    <CharField
                      label="Page Title" hint="50–60 chars ideal"
                      value={f.title} onChange={set("title")}
                      placeholder="My Awesome Page — Brand Name"
                      max={60} ideal={50}
                    />
                    <CharField
                      label="Meta Description" hint="120–158 chars ideal"
                      value={f.description} onChange={set("description")}
                      placeholder="A short, compelling summary of your page for search engines and social sharing…"
                      max={158} ideal={120} multiline
                    />
                    <CharField
                      label="Keywords" hint="comma-separated"
                      value={f.keywords} onChange={set("keywords")}
                      placeholder="react, javascript, web development"
                    />
                    <CharField
                      label="Author"
                      value={f.author} onChange={set("author")}
                      placeholder="Jane Doe"
                    />
                    <CharField
                      label="Canonical URL"
                      value={f.canonical} onChange={set("canonical")}
                      placeholder="https://example.com/page"
                    />

                    <div className="mt-row-2">
                      <div className="mt-field">
                        <span className="mt-label">Robots</span>
                        <select className="mt-select" value={f.robots} onChange={e => set("robots")(e.target.value)}>
                          {ROBOTS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="mt-field">
                        <span className="mt-label">Charset</span>
                        <select className="mt-select" value={f.charset} onChange={e => set("charset")(e.target.value)}>
                          {CHARSET_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Open Graph ── */}
                {tab === "Open Graph" && (
                  <>
                    <Toggle
                      label="Enable Open Graph tags"
                      sub="Enhances link previews on Facebook, LinkedIn, and more"
                      checked={toggles.og}
                      onChange={v => setToggle("og", v)}
                    />

                    {toggles.og && (
                      <>
                        <div className="mt-divider">Content</div>
                        <CharField
                          label="OG Title" hint="leave blank to use Page Title"
                          value={f.ogTitle} onChange={set("ogTitle")}
                          placeholder={f.title || "Override title for social sharing"}
                          max={60} ideal={50}
                        />
                        <CharField
                          label="OG Description" hint="leave blank to use Meta Description"
                          value={f.ogDesc} onChange={set("ogDesc")}
                          placeholder={f.description || "Override description for social sharing"}
                          max={200} ideal={120} multiline
                        />
                        <CharField
                          label="OG Image URL" hint="1200×630px recommended"
                          value={f.ogImage} onChange={set("ogImage")}
                          placeholder="https://example.com/og-image.jpg"
                        />
                        <CharField
                          label="OG Image Alt Text"
                          value={f.ogImageAlt} onChange={set("ogImageAlt")}
                          placeholder="Description of the image"
                        />

                        <div className="mt-divider">Details</div>
                        <div className="mt-row-2">
                          <div className="mt-field">
                            <span className="mt-label">OG Type</span>
                            <select className="mt-select" value={f.ogType} onChange={e => set("ogType")(e.target.value)}>
                              {OG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="mt-field">
                            <span className="mt-label">Locale</span>
                            <input className="mt-input" value={f.locale} onChange={e => set("locale")(e.target.value)} placeholder="en_US" />
                          </div>
                        </div>
                        <CharField
                          label="Site Name"
                          value={f.siteName} onChange={set("siteName")}
                          placeholder="My Website"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ── Twitter ── */}
                {tab === "Twitter" && (
                  <>
                    <Toggle
                      label="Enable Twitter Card tags"
                      sub="Controls how links appear when shared on X / Twitter"
                      checked={toggles.twitter}
                      onChange={v => setToggle("twitter", v)}
                    />

                    {toggles.twitter && (
                      <>
                        <div className="mt-divider">Card Type</div>
                        <div className="mt-field">
                          <span className="mt-label">Twitter Card</span>
                          <select className="mt-select" value={f.twitterCard} onChange={e => set("twitterCard")(e.target.value)}>
                            {TWITTER_CARDS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>

                        <div className="mt-divider">Accounts</div>
                        <div className="mt-row-2">
                          <CharField
                            label="Twitter Site" hint="@handle of site"
                            value={f.twitterSite} onChange={set("twitterSite")}
                            placeholder="@yoursite"
                          />
                          <CharField
                            label="Twitter Creator" hint="@handle of author"
                            value={f.twitterCreator} onChange={set("twitterCreator")}
                            placeholder="@yourhandle"
                          />
                        </div>

                        <div className="mt-divider" style={{ marginTop: 4 }}>Note</div>
                        <p style={{ fontSize: "0.73rem", color: "var(--grey-3)", lineHeight: 1.5 }}>
                          Twitter Card title, description, and image are pulled from Open Graph tags above when not specified separately.
                          {!toggles.og && <strong style={{ color: "var(--orange)" }}> Enable Open Graph to populate these.</strong>}
                        </p>
                      </>
                    )}
                  </>
                )}

                {/* ── Theme & App ── */}
                {tab === "Theme & App" && (
                  <>
                    <Toggle
                      label="Enable Theme & App tags"
                      sub="PWA, browser chrome color, Apple web app hints"
                      checked={toggles.theme}
                      onChange={v => setToggle("theme", v)}
                    />

                    {toggles.theme && (
                      <>
                        <div className="mt-divider">Colors</div>
                        <div className="mt-row-2">
                          <div className="mt-field">
                            <span className="mt-label">Theme Color</span>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input
                                type="color"
                                value={f.themeColor}
                                onChange={e => set("themeColor")(e.target.value)}
                                style={{ width: 38, height: 38, border: "1.5px solid var(--grey-2)", borderRadius: 8, cursor: "pointer", padding: 2, background: "var(--white)" }}
                              />
                              <input
                                className="mt-input"
                                value={f.themeColor}
                                onChange={e => set("themeColor")(e.target.value)}
                                placeholder="#ffffff"
                                style={{ flex: 1 }}
                              />
                            </div>
                          </div>
                          <CharField
                            label="Application Name"
                            value={f.appName} onChange={set("appName")}
                            placeholder="My App"
                          />
                        </div>
                        <CharField
                          label="Generator"
                          value={f.generator} onChange={set("generator")}
                          placeholder="Next.js"
                        />

                        <div className="mt-divider">Apple</div>
                        <Toggle
                          label="Apple Mobile Web App Capable"
                          sub="Allows site to be added to home screen as full-screen app"
                          checked={f.appleMobile}
                          onChange={set("appleMobile")}
                        />
                      </>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>

          {/* ── Right: preview + output ── */}
          <div className="mt-col-right">

            {/* Preview */}
            <div className="mt-card">
              <div className="mt-card-head">
                <span className="mt-card-title">Preview</span>
              </div>
              <div className="mt-preview-body">
                <div className="mt-preview-tabs">
                  {["google", "social"].map(pt => (
                    <button
                      key={pt}
                      className={`mt-preview-tab ${previewTab === pt ? "on" : ""}`}
                      onClick={() => setPreviewTab(pt)}
                    >
                      {pt === "google" ? "Google" : "Social Card"}
                    </button>
                  ))}
                </div>

                {previewTab === "google" && (
                  <div className="mt-google-preview">
                    <div className="mt-gp-url">{domain}</div>
                    <div className="mt-gp-title">{displayTitle}</div>
                    <div className="mt-gp-desc">{displayDesc}</div>
                  </div>
                )}

                {previewTab === "social" && (
                  <div className="mt-social-preview">
                    <div className="mt-sp-image">
                      {f.ogImage
                        ? <img src={f.ogImage} alt={f.ogImageAlt || f.title} onError={e => { e.target.style.display = "none"; }} />
                        : <span>1200 × 630 — OG image preview</span>
                      }
                    </div>
                    <div className="mt-sp-body">
                      <div className="mt-sp-domain">{domain}</div>
                      <div className="mt-sp-title">{f.ogTitle || displayTitle}</div>
                      <div className="mt-sp-desc">{f.ogDesc || displayDesc}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Output */}
            <div className="mt-card">
              <div className="mt-card-head">
                <span className="mt-card-title">Generated Tags</span>
                <div className="mt-card-actions">
                  <span className="mt-count-badge">{tagCount} tags</span>
                  <button className="mt-sm-btn" onClick={handleCopy}>
                    {copied ? <IconCheck /> : <IconCopy />}
                    {copied ? " Copied!" : " Copy"}
                  </button>
                  <button className="mt-sm-btn" onClick={handleDownload}>
                    <IconDownload /> Download
                  </button>
                </div>
              </div>
              <textarea
                className="mt-output"
                value={output}
                readOnly
                spellCheck={false}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
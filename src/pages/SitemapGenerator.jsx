/* eslint-disable no-empty */
import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import "./SitemapGenerator.css";

/* ── Icons ── */
const IconSitemap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="6" height="4" rx="1"/><rect x="16" y="3" width="6" height="4" rx="1"/>
    <rect x="9" y="17" width="6" height="4" rx="1"/>
    <path d="M5 7v4h14V7M12 11v6"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
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
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);
const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconCode = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

/* ── Constants ── */
const FREQ_OPTIONS = ["always","hourly","daily","weekly","monthly","yearly","never"];
const PRIORITY_OPTIONS = ["1.0","0.9","0.8","0.7","0.6","0.5","0.4","0.3","0.2","0.1"];

const DEFAULT_ENTRY = () => ({
  id: crypto.randomUUID(),
  path: "",
  priority: "0.8",
  freq: "weekly",
  lastmod: new Date().toISOString().split("T")[0],
  error: "",
});

/* ── Helpers ── */
function normalizeUrl(base, path) {
  try {
    const b = base.trim().replace(/\/$/, "");
    const p = path.trim().startsWith("/") ? path.trim() : "/" + path.trim();
    return p === "/" ? b + "/" : b + p;
  } catch {
    return base + path;
  }
}

function validatePath(path) {
  if (!path.trim()) return "Path is required";
  if (path.trim() !== "/" && !/^\//.test(path.trim())) return "Path must start with /";
  return "";
}

function validateDomain(domain) {
  if (!domain.trim()) return "Domain is required";
  try {
    const url = new URL(domain.includes("://") ? domain : "https://" + domain);
    if (!url.hostname.includes(".")) return "Enter a valid domain";
    return "";
  } catch {
    return "Enter a valid domain (e.g. https://example.com)";
  }
}

function normalizeDomain(domain) {
  const d = domain.trim().replace(/\/$/, "");
  if (!d.includes("://")) return "https://" + d;
  return d;
}

function generateXML(domain, entries, includeLastmod, includeImages) {
  const today = new Date().toISOString().split("T")[0];
  const urls = entries.map(e => {
    const loc = normalizeUrl(domain, e.path || "/");
    const lastmod = includeLastmod ? `\n    <lastmod>${e.lastmod || today}</lastmod>` : "";
    return `  <url>\n    <loc>${loc}</loc>${lastmod}\n    <changefreq>${e.freq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${includeImages ? `\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` : ""}>
${urls.join("\n")}
</urlset>`;
}

/* ── URL Row component ── */
function UrlRow({ entry, onChange, onDelete, index, domain }) {
  const preview = domain ? normalizeUrl(domain, entry.path || "/") : null;

  return (
    <div className={`sg-url-row ${entry.error ? "sg-url-row-err" : ""}`}>
      <div className="sg-row-num">{index + 1}</div>

      <div className="sg-row-fields">
        <div className="sg-row-path-wrap">
          {domain && <span className="sg-domain-prefix">{new URL(domain.includes("://") ? domain : "https://" + domain).origin}</span>}
          <input
            className={`sg-input sg-path-input ${entry.error ? "sg-input-err" : ""}`}
            value={entry.path}
            onChange={e => onChange(entry.id, "path", e.target.value)}
            placeholder="/about"
            spellCheck={false}
          />
        </div>

        <div className="sg-row-meta">
          <div className="sg-select-wrap">
            <label className="sg-mini-label">Priority</label>
            <select
              className="sg-select"
              value={entry.priority}
              onChange={e => onChange(entry.id, "priority", e.target.value)}
            >
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="sg-select-wrap">
            <label className="sg-mini-label">Frequency</label>
            <select
              className="sg-select"
              value={entry.freq}
              onChange={e => onChange(entry.id, "freq", e.target.value)}
            >
              {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="sg-select-wrap">
            <label className="sg-mini-label">Last Modified</label>
            <input
              type="date"
              className="sg-select"
              value={entry.lastmod}
              onChange={e => onChange(entry.id, "lastmod", e.target.value)}
            />
          </div>
        </div>

        {entry.error && (
          <div className="sg-row-error"><IconAlert /> {entry.error}</div>
        )}
      </div>

      <button className="sg-delete-btn" onClick={() => onDelete(entry.id)} title="Remove URL">
        <IconTrash />
      </button>
    </div>
  );
}

/* ── Main Component ── */
export default function SitemapGenerator() {
  const [domain,        setDomain]        = useState("");
  const [domainError,   setDomainError]   = useState("");
  const [entries,       setEntries]       = useState([{ ...DEFAULT_ENTRY(), path: "/" }]);
  const [includeLastmod,setIncludeLastmod]= useState(true);
  const [includeImages, setIncludeImages] = useState(false);
  const [bulkText,      setBulkText]      = useState("");
  const [showBulk,      setShowBulk]      = useState(false);
  const [bulkError,     setBulkError]     = useState("");
  const [result,        setResult]        = useState("");
  const [activeTab,     setActiveTab]     = useState("preview");
  const [copied,        setCopied]        = useState(false);
  const [generated,     setGenerated]     = useState(false);
  const fileRef = useRef(null);

  /* ── Entry CRUD ── */
  const addEntry = () => setEntries(prev => [...prev, DEFAULT_ENTRY()]);

  const updateEntry = (id, field, value) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, [field]: value };
      if (field === "path") updated.error = validatePath(value);
      return updated;
    }));
    setGenerated(false);
  };

  const deleteEntry = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setGenerated(false);
  };

  /* ── Bulk import ── */
  const handleBulkImport = () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) { setBulkError("No URLs found."); return; }

    const newEntries = lines.map(line => {
      let path = line;
      // Strip domain if full URL pasted
      try {
        if (line.includes("://")) {
          const u = new URL(line);
          path = u.pathname + u.search + u.hash;
        }
      } catch {}
      return { ...DEFAULT_ENTRY(), path: path || "/" };
    });

    setEntries(prev => {
      const existing = prev.filter(e => e.path);
      return [...existing, ...newEntries];
    });
    setBulkText("");
    setBulkError("");
    setShowBulk(false);
    setGenerated(false);
  };

  /* ── File import ── */
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      // Try parse XML sitemap
      if (file.name.endsWith(".xml")) {
        const matches = [...text.matchAll(/<loc>(.*?)<\/loc>/g)];
        const paths = matches.map(m => {
          try {
            const u = new URL(m[1]);
            return u.pathname;
          } catch { return m[1]; }
        });
        if (paths.length) {
          setEntries(prev => [...prev, ...paths.map(p => ({ ...DEFAULT_ENTRY(), path: p }))]);
          return;
        }
      }
      // Treat as plain text list
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      setEntries(prev => [...prev, ...lines.map(l => ({ ...DEFAULT_ENTRY(), path: l }))]);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ── Generate ── */
  const handleGenerate = () => {
    const dErr = validateDomain(domain);
    if (dErr) { setDomainError(dErr); return; }

    const normalized = normalizeDomain(domain);
    let hasError = false;

    const validated = entries.map(e => {
      const err = validatePath(e.path);
      if (err) hasError = true;
      return { ...e, error: err };
    });

    setEntries(validated);
    if (hasError) return;

    const xml = generateXML(normalized, entries, includeLastmod, includeImages);
    setResult(xml);
    setGenerated(true);
    setActiveTab("preview");
  };

  /* ── Copy / Download ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "application/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => {
    setDomain(""); setDomainError(""); setEntries([{ ...DEFAULT_ENTRY(), path: "/" }]);
    setBulkText(""); setShowBulk(false); setResult(""); setGenerated(false);
  };

  const validEntries   = entries.filter(e => !e.error && e.path);
  const domainDisplay  = domain && !domainError ? normalizeDomain(domain) : null;

  return (
    <>
      <Helmet>
        <title>Free XML Sitemap Generator – SEO Sitemap Builder | ShauryaTools</title>
        <meta name="description" content="Generate a valid XML sitemap instantly. Add URLs with priority, change frequency, and last modified date. Download or copy your sitemap.xml for free." />
        <meta name="keywords" content="sitemap generator, xml sitemap, sitemap.xml, seo sitemap, sitemap builder, free sitemap generator" />
        <link rel="canonical" href="https://shauryatools.vercel.app/sitemap-generator" />
      </Helmet>

      <div className="sg-page">
        <div className="sg-inner">

          {/* ── Header ── */}
          <div className="sg-header">
            <div className="sg-icon"><IconSitemap /></div>
            <div>
              <span className="sg-cat">SEO Tools</span>
              <h1>Sitemap Generator</h1>
              <p>Build a valid XML sitemap with priorities, frequencies & last-modified dates.</p>
            </div>
          </div>

          {/* ── Config Card ── */}
          <div className="sg-card">

            {/* Domain + Options row */}
            <div className="sg-top-row">
              <div className="sg-field sg-field-domain">
                <div className="sg-label-row">
                  <label className="sg-label"><IconGlobe /> Website Domain</label>
                  {domainDisplay && <span className="sg-url-badge sg-url-ok">✓ Valid</span>}
                  {domainError   && <span className="sg-url-badge sg-url-bad">✗ Invalid</span>}
                </div>
                <div className="sg-domain-wrap">
                  <input
                    className={`sg-input sg-domain-input ${domainError ? "sg-input-err" : domain && !domainError ? "sg-input-ok" : ""}`}
                    value={domain}
                    onChange={e => { setDomain(e.target.value); setDomainError(""); setGenerated(false); }}
                    placeholder="https://example.com"
                    spellCheck={false}
                  />
                </div>
                {domainError && <div className="sg-error-msg"><IconAlert /> {domainError}</div>}
              </div>

              <div className="sg-field sg-field-options">
                <label className="sg-label">Options</label>
                <div className="sg-options">
                  <label className="sg-toggle">
                    <input
                      type="checkbox"
                      checked={includeLastmod}
                      onChange={e => { setIncludeLastmod(e.target.checked); setGenerated(false); }}
                    />
                    <span className="sg-toggle-track"><span className="sg-toggle-thumb" /></span>
                    <span className="sg-toggle-label">Include lastmod</span>
                  </label>
                  <label className="sg-toggle">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={e => { setIncludeImages(e.target.checked); setGenerated(false); }}
                    />
                    <span className="sg-toggle-track"><span className="sg-toggle-thumb" /></span>
                    <span className="sg-toggle-label">Image sitemap namespace</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sg-divider" />

            {/* URL List header */}
            <div className="sg-list-header">
              <div className="sg-label-row">
                <label className="sg-label">URLs <span className="sg-count-badge">{entries.length}</span></label>
                <div className="sg-list-actions">
                  <button className="sg-text-btn" onClick={() => { setShowBulk(s => !s); setBulkError(""); }}>
                    <IconUpload /> Bulk Import
                  </button>
                  <span className="sg-dot">·</span>
                  <button className="sg-text-btn" onClick={() => fileRef.current?.click()}>
                    📂 From File
                  </button>
                  <input ref={fileRef} type="file" accept=".txt,.xml,.csv" style={{ display:"none" }} onChange={handleFileImport} />
                  <span className="sg-dot">·</span>
                  <button className="sg-text-btn sg-text-red" onClick={() => { setEntries([]); setGenerated(false); }}>
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Import panel */}
            {showBulk && (
              <div className="sg-bulk-panel animate-in">
                <label className="sg-label">Paste URLs (one per line)</label>
                <textarea
                  className="sg-bulk-textarea"
                  value={bulkText}
                  onChange={e => { setBulkText(e.target.value); setBulkError(""); }}
                  placeholder={"/about\n/contact\n/blog\nhttps://example.com/products"}
                  rows={5}
                  spellCheck={false}
                />
                {bulkError && <div className="sg-error-msg"><IconAlert /> {bulkError}</div>}
                <div className="sg-bulk-actions">
                  <button className="sg-btn-ghost" onClick={() => { setShowBulk(false); setBulkText(""); setBulkError(""); }}>Cancel</button>
                  <button className="sg-btn-green" onClick={handleBulkImport}>Import {bulkText.split("\n").filter(l=>l.trim()).length} URLs</button>
                </div>
              </div>
            )}

            {/* URL Rows */}
            <div className="sg-url-list">
              {entries.length === 0 ? (
                <div className="sg-empty-list">
                  <p>No URLs yet. Add one below or use Bulk Import.</p>
                </div>
              ) : (
                entries.map((e, i) => (
                  <UrlRow
                    key={e.id}
                    entry={e}
                    index={i}
                    domain={domainDisplay}
                    onChange={updateEntry}
                    onDelete={deleteEntry}
                  />
                ))
              )}
            </div>

            {/* Add URL */}
            <button className="sg-add-btn" onClick={addEntry}>
              <IconPlus /> Add URL
            </button>

            <div className="sg-divider" />

            {/* Footer actions */}
            <div className="sg-footer-actions">
              <span className="sg-url-summary">
                {validEntries.length} valid URL{validEntries.length !== 1 ? "s" : ""} · {entries.length - validEntries.length > 0 ? `${entries.length - validEntries.length} with errors` : "ready to generate"}
              </span>
              <div className="sg-btn-group">
                {generated && (
                  <button className="sg-btn-ghost" onClick={handleReset}><IconRefresh /> Reset</button>
                )}
                <button
                  className="sg-generate-btn"
                  onClick={handleGenerate}
                  disabled={entries.length === 0}
                >
                  <IconSitemap /> Generate Sitemap
                </button>
              </div>
            </div>
          </div>

          {/* ── Result Card ── */}
          {result && (
            <div className="sg-card animate-in">

              {/* Result top */}
              <div className="sg-result-top">
                <div className="sg-result-meta">
                  <span className="sg-result-badge">✓ Valid XML Sitemap</span>
                  <span className="sg-result-info">{validEntries.length} URLs · {result.length.toLocaleString()} bytes</span>
                </div>
                <div className="sg-result-right">
                  <div className="sg-tabs">
                    <button className={`sg-tab ${activeTab==="preview"?"sg-tab-on":""}`} onClick={()=>setActiveTab("preview")}>
                      <IconEye /> Preview
                    </button>
                    <button className={`sg-tab ${activeTab==="raw"?"sg-tab-on":""}`} onClick={()=>setActiveTab("raw")}>
                      <IconCode /> Raw XML
                    </button>
                  </div>
                  <div className="sg-result-actions">
                    <button className="sg-btn-ghost" onClick={handleDownload}><IconDownload /> Download</button>
                    <button className={`sg-copy-btn ${copied?"sg-copied":""}`} onClick={handleCopy}>
                      {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy XML</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview tab — visual table */}
              {activeTab === "preview" && (
                <div className="sg-preview">
                  <div className="sg-preview-head">
                    <span>URL</span><span>Priority</span><span>Frequency</span><span>Last Modified</span>
                  </div>
                  {entries.filter(e => !e.error && e.path).map((e, i) => (
                    <div key={e.id} className="sg-preview-row" style={{ animationDelay: `${i * 0.04}s` }}>
                      <span className="sg-preview-url" title={normalizeUrl(normalizeDomain(domain), e.path)}>
                        {normalizeDomain(domain)}<strong>{e.path}</strong>
                      </span>
                      <span className={`sg-prio-badge sg-prio-${Math.round(parseFloat(e.priority)*10)}`}>{e.priority}</span>
                      <span className="sg-freq-badge">{e.freq}</span>
                      <span className="sg-date">{includeLastmod ? e.lastmod : "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Raw XML tab */}
              {activeTab === "raw" && (
                <pre className="sg-raw animate-in">{result}</pre>
              )}

              {/* Footer */}
              <div className="sg-result-footer">
                <span className="sg-word-count">{result.split("\n").length} lines · sitemap.xml</span>
                <button className={`sg-copy-full ${copied?"sg-copied":""}`} onClick={handleCopy}>
                  {copied ? <><IconCheck /> Copied to clipboard!</> : <><IconCopy /> Copy sitemap.xml</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
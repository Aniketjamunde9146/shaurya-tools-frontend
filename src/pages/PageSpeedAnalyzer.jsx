/* eslint-disable no-empty */
import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import "./PageSpeedAnalyzer.css";

/* ── CONFIG ── */
const PSI_API_KEY = "AIzaSyBjvJX1jAJQUCv_fmTXOP7VuQtxILs-viw"; // 🔑 Replace with your Google API key

/* ── Icons ── */
const IconGauge = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/>
  </svg>
);
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
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
const IconDesktop = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const IconMobile = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);
const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconExternal = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
  </svg>
);
const IconInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Helpers ── */
function normalizeUrl(raw) {
  let url = raw.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url;
}

function isValidUrl(raw) {
  try { new URL(normalizeUrl(raw)); return true; } catch { return false; }
}

function scoreColor(score) {
  if (score >= 90) return "good";
  if (score >= 50) return "needs";
  return "poor";
}

function scoreLabel(score) {
  if (score >= 90) return "Good";
  if (score >= 50) return "Needs Work";
  return "Poor";
}

function metricColor(rating) {
  if (rating === "fast" || rating === "good")     return "good";
  if (rating === "average" || rating === "needs-improvement") return "needs";
  return "poor";
}

function formatMs(ms) {
  if (!ms && ms !== 0) return "—";
  if (ms >= 1000) return (ms / 1000).toFixed(1) + "s";
  return Math.round(ms) + "ms";
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024)    return (bytes / 1024).toFixed(0) + " KB";
  return bytes + " B";
}

/* ── Fetch with retry (handles 429) ── */
async function fetchWithRetry(url, options, retries = 3, baseDelay = 3000) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429 && i < retries) {
      const delay = baseDelay * Math.pow(2, i); // exponential backoff: 3s, 6s, 12s
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    return res;
  }
}

/* ── Score Ring SVG ── */
function ScoreRing({ score, size = 120, strokeWidth = 10 }) {
  const r      = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color  = scoreColor(score);
  const colors = { good: "#16a34a", needs: "#d97706", poor: "#dc2626" };

  return (
    <svg width={size} height={size} className="psa-ring" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e5e5" strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={colors[color]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="psa-ring-fill"
      />
    </svg>
  );
}

/* ── Score Card ── */
function ScoreCard({ label, score, icon }) {
  const color = scoreColor(score);
  return (
    <div className={`psa-score-card psa-score-${color}`}>
      <div className="psa-score-ring-wrap">
        <ScoreRing score={score} size={100} strokeWidth={9} />
        <div className="psa-score-center">
          <span className="psa-score-num">{score}</span>
        </div>
      </div>
      <div className="psa-score-meta">
        <span className="psa-score-icon">{icon}</span>
        <span className="psa-score-label">{label}</span>
        <span className={`psa-score-badge psa-badge-${color}`}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

/* ── Metric Row ── */
function MetricRow({ label, value, rating, description, ideal }) {
  const color = metricColor(rating);
  return (
    <div className={`psa-metric psa-metric-${color}`}>
      <div className="psa-metric-left">
        <span className={`psa-metric-dot psa-dot-${color}`} />
        <div className="psa-metric-info">
          <span className="psa-metric-label">{label}</span>
          {description && <span className="psa-metric-desc">{description}</span>}
        </div>
      </div>
      <div className="psa-metric-right">
        <span className={`psa-metric-value psa-val-${color}`}>{value}</span>
        {ideal && <span className="psa-metric-ideal">ideal: {ideal}</span>}
      </div>
    </div>
  );
}

/* ── Opportunity Row ── */
function OpportunityRow({ title, description, savings }) {
  return (
    <div className="psa-opp">
      <div className="psa-opp-icon">💡</div>
      <div className="psa-opp-body">
        <span className="psa-opp-title">{title}</span>
        {description && <span className="psa-opp-desc">{description}</span>}
      </div>
      {savings && (
        <span className="psa-opp-savings">{savings}</span>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function PageSpeedAnalyzer() {
  const [url,         setUrl]         = useState("");
  const [strategy,    setStrategy]    = useState("mobile");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState(null);
  const [copied,      setCopied]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("metrics");
  const [lastAnalyzed, setLastAnalyzed] = useState(0); // cooldown tracking
  const abortRef = useRef(null);

  const COOLDOWN_MS = 10000; // 10 seconds between requests

  const urlState = !url.trim() ? "empty" : isValidUrl(url) ? "valid" : "invalid";

  const handleAnalyze = async () => {
    const finalUrl = normalizeUrl(url);
    if (!isValidUrl(url)) { setError("Please enter a valid URL."); return; }

    // Cooldown guard
    const now = Date.now();
    if (now - lastAnalyzed < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (now - lastAnalyzed)) / 1000);
      setError(`Please wait ${wait} more second${wait !== 1 ? "s" : ""} before running another test.`);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true); setError(""); setResult(null);
    setLastAnalyzed(Date.now());

    try {
      const apiUrl =
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
        `?url=${encodeURIComponent(finalUrl)}` +
        `&strategy=${strategy}` +
        `&category=performance` +
        `&category=accessibility` +
        `&category=best-practices` +
        `&category=seo` +
        `&key=${PSI_API_KEY}`;

      const res = await fetchWithRetry(apiUrl, { signal: abortRef.current.signal });

      if (res.status === 429) {
        throw new Error("Rate limit reached. Please wait a minute and try again.");
      }

      if (!res.ok) {
        throw new Error(`API error (${res.status}). Check the URL and try again.`);
      }

      const data = await res.json();

      if (data.error) throw new Error(data.error.message || "API error");

      const cats = data.lighthouseResult?.categories || {};
      const auds = data.lighthouseResult?.audits     || {};

      /* Core scores */
      const scores = {
        performance:   Math.round((cats.performance?.score  || 0) * 100),
        accessibility: Math.round((cats.accessibility?.score || 0) * 100),
        bestPractices: Math.round((cats["best-practices"]?.score || 0) * 100),
        seo:           Math.round((cats.seo?.score || 0) * 100),
      };

      /* Core Web Vitals + metrics */
      const metrics = [
        {
          key:   "first-contentful-paint",
          label: "First Contentful Paint",
          desc:  "Time until first content is rendered",
          ideal: "< 1.8s",
          format: "ms",
        },
        {
          key:   "largest-contentful-paint",
          label: "Largest Contentful Paint",
          desc:  "Time until largest content element is visible",
          ideal: "< 2.5s",
          format: "ms",
        },
        {
          key:   "total-blocking-time",
          label: "Total Blocking Time",
          desc:  "Sum of all blocking periods between FCP and TTI",
          ideal: "< 200ms",
          format: "ms",
        },
        {
          key:   "cumulative-layout-shift",
          label: "Cumulative Layout Shift",
          desc:  "Visual stability — unexpected layout shifts",
          ideal: "< 0.1",
          format: "raw",
        },
        {
          key:   "speed-index",
          label: "Speed Index",
          desc:  "How quickly content is visually displayed",
          ideal: "< 3.4s",
          format: "ms",
        },
        {
          key:   "interactive",
          label: "Time to Interactive",
          desc:  "Time until page is fully interactive",
          ideal: "< 3.8s",
          format: "ms",
        },
        {
          key:   "server-response-time",
          label: "Server Response Time",
          desc:  "Time to first byte (TTFB)",
          ideal: "< 600ms",
          format: "ms",
        },
      ].map(m => {
        const a = auds[m.key];
        if (!a) return null;
        const raw   = a.numericValue;
        const value = m.format === "ms"  ? formatMs(raw)
                    : m.format === "raw" ? (raw != null ? raw.toFixed(3) : "—")
                    : formatBytes(raw);
        return { ...m, value, rating: a.score >= 0.9 ? "good" : a.score >= 0.5 ? "average" : "poor", score: a.score };
      }).filter(Boolean);

      /* Page stats */
      const stats = {
        totalSize:   auds["total-byte-weight"]?.numericValue,
        requests:    auds["network-requests"]?.details?.items?.length,
        domSize:     auds["dom-size"]?.numericValue,
        renderBlock: auds["render-blocking-resources"]?.details?.items?.length || 0,
        unusedJs:    auds["unused-javascript"]?.details?.items?.length || 0,
        unusedCss:   auds["unused-css-rules"]?.details?.items?.length || 0,
        imageOpt:    auds["uses-optimized-images"]?.details?.items?.length || 0,
      };

      /* Opportunities */
      const oppKeys = [
        "render-blocking-resources",
        "unused-javascript",
        "unused-css-rules",
        "uses-optimized-images",
        "uses-webp-images",
        "uses-text-compression",
        "uses-responsive-images",
        "efficient-animated-content",
        "offscreen-images",
        "unminified-css",
        "unminified-javascript",
        "uses-long-cache-ttl",
        "dom-size",
        "bootup-time",
      ];

      const opportunities = oppKeys.map(k => {
        const a = auds[k];
        if (!a || a.score === 1 || a.score == null) return null;
        const savings = a.details?.overallSavingsMs
          ? `Save ~${formatMs(a.details.overallSavingsMs)}`
          : a.details?.overallSavingsBytes
          ? `Save ~${formatBytes(a.details.overallSavingsBytes)}`
          : null;
        return { title: a.title, description: a.description?.split(".")[0], savings };
      }).filter(Boolean).slice(0, 8);

      /* Meta info */
      const meta = {
        url:           data.id,
        fetchTime:     data.analysisUTCTimestamp,
        strategy,
        lighthouseVer: data.lighthouseResult?.lighthouseVersion,
        screenshot:    auds["final-screenshot"]?.details?.data || null,
      };

      setResult({ scores, metrics, stats, opportunities, meta });
      setActiveTab("metrics");

    } catch (e) {
      if (e.name === "AbortError") return;
      setError(
        e.message?.includes("Rate limit")
          ? e.message
          : e.message?.includes("Unable to load")
          ? "Could not load the page. Make sure the URL is publicly accessible."
          : e.message || "Analysis failed. Check the URL and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const { scores, metrics, meta } = result;
    const text = [
      `Page Speed Report — ${meta.url}`,
      `Strategy: ${meta.strategy.toUpperCase()} | ${new Date(meta.fetchTime).toLocaleString()}`,
      ``,
      `SCORES`,
      `  Performance:    ${scores.performance}`,
      `  Accessibility:  ${scores.accessibility}`,
      `  Best Practices: ${scores.bestPractices}`,
      `  SEO:            ${scores.seo}`,
      ``,
      `METRICS`,
      ...metrics.map(m => `  ${m.label}: ${m.value} (${m.rating})`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setUrl(""); setResult(null); setError(""); setCopied(false);
  };

  return (
    <>
      <Helmet>
        <title>Page Speed Analyzer – Free Website Speed Test | ShauryaTools</title>
        <meta name="description" content="Analyze your website's page speed with Google Lighthouse scores. Check Core Web Vitals, performance metrics, and get actionable optimization tips. Free." />
        <meta name="keywords" content="page speed analyzer, website speed test, core web vitals, lighthouse score, performance audit, lcp fcp cls, seo performance" />
        <link rel="canonical" href="https://shauryatools.vercel.app/page-speed" />
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content="https://shauryatools.vercel.app/page-speed" />
        <meta property="og:title"       content="Page Speed Analyzer – Free Website Speed Test | ShauryaTools" />
        <meta property="og:description" content="Check your website's Lighthouse scores, Core Web Vitals, and get optimization tips. Free page speed analysis tool." />
        <meta property="og:site_name"   content="ShauryaTools" />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="Page Speed Analyzer – Free Website Speed Test | ShauryaTools" />
        <meta name="twitter:description" content="Analyze your website speed with Google Lighthouse. Check Core Web Vitals: LCP, FCP, CLS, TTI and more. Free." />
        <meta name="robots"   content="index, follow" />
        <meta name="author"   content="ShauryaTools" />
      </Helmet>

      <div className="psa-page">
        <div className="psa-inner">

          {/* ── Header ── */}
          <div className="psa-header">
            <div className="psa-icon"><IconGauge /></div>
            <div>
              <span className="psa-cat">SEO Tools</span>
              <h1>Page Speed Analyzer</h1>
              <p>Run a real Google Lighthouse audit — scores, Core Web Vitals & optimization tips.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="psa-card">

            {/* URL + Strategy */}
            <div className="psa-input-row">
              <div className="psa-url-field">
                <div className="psa-label-row">
                  <label className="psa-label">Website URL</label>
                  {urlState === "valid"   && <span className="psa-url-badge psa-badge-ok">✓ Valid</span>}
                  {urlState === "invalid" && <span className="psa-url-badge psa-badge-bad">✗ Invalid</span>}
                </div>
                <div className="psa-url-wrap">
                  <span className="psa-url-icon"><IconSearch /></span>
                  <input
                    className={`psa-url-input ${urlState === "invalid" ? "psa-input-err" : urlState === "valid" ? "psa-input-ok" : ""}`}
                    value={url}
                    onChange={e => { setUrl(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && urlState === "valid" && handleAnalyze()}
                    placeholder="https://example.com"
                    spellCheck={false}
                    autoFocus
                  />
                  {url && (
                    <button className="psa-clear" onClick={() => { setUrl(""); setError(""); setResult(null); }}>✕</button>
                  )}
                </div>
              </div>

              {/* Device toggle */}
              <div className="psa-strategy-field">
                <label className="psa-label">Device</label>
                <div className="psa-strategy-toggle">
                  <button
                    className={`psa-strat-btn ${strategy === "mobile" ? "psa-strat-on" : ""}`}
                    onClick={() => { setStrategy("mobile"); setResult(null); }}
                  >
                    <IconMobile /> Mobile
                  </button>
                  <button
                    className={`psa-strat-btn ${strategy === "desktop" ? "psa-strat-on" : ""}`}
                    onClick={() => { setStrategy("desktop"); setResult(null); }}
                  >
                    <IconDesktop /> Desktop
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="psa-error-msg"><IconAlert /> {error}</div>
            )}

            {/* API info note */}
            <div className="psa-info-note">
              <IconInfo /> Powered by Google PageSpeed Insights API (Lighthouse {result?.meta.lighthouseVer || "v11"}). Results may take 10–20 seconds.
            </div>

            {/* Actions */}
            <div className="psa-actions">
              {result && (
                <button className="psa-btn-ghost" onClick={handleReset}><IconRefresh /> New Test</button>
              )}
              <button
                className="psa-analyze-btn"
                onClick={handleAnalyze}
                disabled={loading || urlState !== "valid"}
              >
                {loading
                  ? <><span className="psa-spinner" /> Analyzing...</>
                  : <><IconSearch /> Analyze Speed</>}
              </button>
            </div>
          </div>

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="psa-card psa-skeleton-card animate-in">
              <div className="psa-skel-scores">
                {[1,2,3,4].map(i => (
                  <div key={i} className="psa-skel-score">
                    <div className="psa-skel psa-skel-ring" />
                    <div className="psa-skel psa-skel-line psa-skel-sm" />
                  </div>
                ))}
              </div>
              <div className="psa-skel psa-skel-title" />
              {[1,2,3,4,5].map(i => <div key={i} className="psa-skel psa-skel-line" style={{ width: `${75 + i*3}%` }} />)}
            </div>
          )}

          {/* ── Results ── */}
          {result && !loading && (
            <div className="psa-results animate-in">

              {/* Score cards */}
              <div className="psa-scores-grid">
                <ScoreCard label="Performance"    score={result.scores.performance}   icon="⚡" />
                <ScoreCard label="Accessibility"  score={result.scores.accessibility} icon="♿" />
                <ScoreCard label="Best Practices" score={result.scores.bestPractices} icon="✅" />
                <ScoreCard label="SEO"            score={result.scores.seo}           icon="🔍" />
              </div>

              {/* Stats strip */}
              <div className="psa-stats-strip">
                <div className="psa-stat">
                  <span className="psa-stat-val">{formatBytes(result.stats.totalSize)}</span>
                  <span className="psa-stat-lbl">Page Size</span>
                </div>
                <div className="psa-stat">
                  <span className="psa-stat-val">{result.stats.requests ?? "—"}</span>
                  <span className="psa-stat-lbl">Requests</span>
                </div>
                <div className="psa-stat">
                  <span className="psa-stat-val">{result.stats.domSize ?? "—"}</span>
                  <span className="psa-stat-lbl">DOM Nodes</span>
                </div>
                <div className="psa-stat">
                  <span className="psa-stat-val">{result.stats.renderBlock}</span>
                  <span className="psa-stat-lbl">Render Blockers</span>
                </div>
                <div className="psa-stat">
                  <span className="psa-stat-val">{result.stats.unusedJs}</span>
                  <span className="psa-stat-lbl">Unused JS</span>
                </div>
                <div className="psa-stat">
                  <span className="psa-stat-val">{result.stats.imageOpt}</span>
                  <span className="psa-stat-lbl">Image Issues</span>
                </div>
              </div>

              {/* Detail tabs */}
              <div className="psa-card">
                <div className="psa-detail-top">
                  <div className="psa-tabs">
                    <button className={`psa-tab ${activeTab==="metrics"?"psa-tab-on":""}`} onClick={()=>setActiveTab("metrics")}>
                      Core Web Vitals
                    </button>
                    <button className={`psa-tab ${activeTab==="opps"?"psa-tab-on":""}`} onClick={()=>setActiveTab("opps")}>
                      Opportunities {result.opportunities.length > 0 && <span className="psa-opp-count">{result.opportunities.length}</span>}
                    </button>
                    <button className={`psa-tab ${activeTab==="info"?"psa-tab-on":""}`} onClick={()=>setActiveTab("info")}>
                      Test Info
                    </button>
                  </div>

                  <div className="psa-detail-actions">
                    <button className={`psa-copy-btn ${copied?"psa-copied":""}`} onClick={handleCopy}>
                      {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy Report</>}
                    </button>
                  </div>
                </div>

                {/* Metrics tab */}
                {activeTab === "metrics" && (
                  <div className="psa-metrics-list animate-in">
                    <div className="psa-legend">
                      <span className="psa-leg-item"><span className="psa-leg-dot psa-dot-good"/>Good</span>
                      <span className="psa-leg-item"><span className="psa-leg-dot psa-dot-needs"/>Needs Work</span>
                      <span className="psa-leg-item"><span className="psa-leg-dot psa-dot-poor"/>Poor</span>
                    </div>
                    {result.metrics.map(m => (
                      <MetricRow
                        key={m.key}
                        label={m.label}
                        value={m.value}
                        rating={m.rating}
                        description={m.desc}
                        ideal={m.ideal}
                      />
                    ))}
                  </div>
                )}

                {/* Opportunities tab */}
                {activeTab === "opps" && (
                  <div className="psa-opps-list animate-in">
                    {result.opportunities.length === 0 ? (
                      <div className="psa-no-opps">
                        <span className="psa-no-opps-icon">🎉</span>
                        <p>No major opportunities found. Great work!</p>
                      </div>
                    ) : (
                      result.opportunities.map((o, i) => (
                        <OpportunityRow key={i} title={o.title} description={o.description} savings={o.savings} />
                      ))
                    )}
                  </div>
                )}

                {/* Info tab */}
                {activeTab === "info" && (
                  <div className="psa-info-tab animate-in">
                    {[
                      { label: "Analyzed URL",  val: result.meta.url },
                      { label: "Device",        val: result.meta.strategy === "mobile" ? "📱 Mobile" : "🖥️ Desktop" },
                      { label: "Test Time",     val: new Date(result.meta.fetchTime).toLocaleString() },
                      { label: "Lighthouse",    val: `v${result.meta.lighthouseVer}` },
                      { label: "Powered by",    val: "Google PageSpeed Insights API" },
                    ].map(row => (
                      <div key={row.label} className="psa-info-row">
                        <span className="psa-info-key">{row.label}</span>
                        <span className="psa-info-val">{row.val}</span>
                      </div>
                    ))}
                    <a
                      className="psa-psi-link"
                      href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(result.meta.url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View full report on PageSpeed Insights <IconExternal />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
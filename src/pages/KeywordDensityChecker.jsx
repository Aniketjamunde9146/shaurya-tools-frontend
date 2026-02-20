/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import "./KeywordDensityChecker.css";

/* ── Icons ── */
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconFilter = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconInfo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Stop words (common English words to filter) ── */
const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","up","about","into","through","during","before","after","above","below",
  "is","are","was","were","be","been","being","have","has","had","do","does","did",
  "will","would","could","should","may","might","shall","can","need","dare","ought",
  "i","me","my","myself","we","our","ours","ourselves","you","your","yours","yourself",
  "he","him","his","himself","she","her","hers","herself","it","its","itself",
  "they","them","their","theirs","themselves","what","which","who","whom","this",
  "that","these","those","am","not","no","nor","so","yet","both","either","neither",
  "each","few","more","most","other","some","such","than","too","very","just","as",
  "if","then","because","while","although","though","since","unless","until","when",
  "where","how","all","any","only","own","same","s","t","don","won","isn","aren",
  "wasn","weren","hasn","haven","hadn","doesn","didn","couldn","wouldn","shouldn",
]);

/* ── Text analysis engine ── */
function analyzeText(text, filterStops, targetKw) {
  if (!text.trim()) return null;

  // Clean and tokenize
  const cleaned  = text.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ");
  const allWords = cleaned.split(/\s+/).filter(w => w.length > 1 && /[a-z]/.test(w));
  const totalWords = allWords.length;
  if (!totalWords) return null;

  // Filter stop words for keyword analysis
  const words = filterStops ? allWords.filter(w => !STOP_WORDS.has(w)) : allWords;

  // Character and sentence counts (on original)
  const charCount      = text.length;
  const charNoSpaces   = text.replace(/\s/g,"").length;
  const sentences      = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length;
  const paragraphs     = text.split(/\n\s*\n/).filter(p => p.trim()).length;
  const avgWordLen     = (allWords.reduce((s,w) => s + w.length, 0) / totalWords).toFixed(1);
  const readingTime    = Math.ceil(totalWords / 200);

  // Unigram frequency
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  // Bigrams
  const bigramFreq = {};
  for (let i = 0; i < words.length - 1; i++) {
    const bg = words[i] + " " + words[i+1];
    bigramFreq[bg] = (bigramFreq[bg] || 0) + 1;
  }

  // Trigrams
  const trigramFreq = {};
  for (let i = 0; i < words.length - 2; i++) {
    const tg = words[i] + " " + words[i+1] + " " + words[i+2];
    trigramFreq[tg] = (trigramFreq[tg] || 0) + 1;
  }

  // Sort and compute density
  const toList = (f, total) =>
    Object.entries(f)
      .sort((a,b) => b[1] - a[1])
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / total) * 100).toFixed(2),
      }));

  const unigrams = toList(freq, totalWords).slice(0, 40);
  const bigrams  = toList(bigramFreq, totalWords).filter(b => b.count > 1).slice(0, 20);
  const trigrams = toList(trigramFreq, totalWords).filter(t => t.count > 1).slice(0, 15);

  // Target keyword lookup
  let targetResult = null;
  if (targetKw.trim()) {
    const kw = targetKw.trim().toLowerCase();
    const kwWords = kw.split(/\s+/);
    const fullText = text.toLowerCase();

    let kwCount = 0;
    if (kwWords.length === 1) {
      kwCount = (fullText.match(new RegExp(`\\b${kw}\\b`, "g")) || []).length;
    } else {
      kwCount = (fullText.match(new RegExp(kw.replace(/\s+/g,"\\s+"), "g")) || []).length;
    }

    const density = ((kwCount / totalWords) * 100).toFixed(2);
    const status  = density < 0.5 ? "low" : density > 3 ? "high" : "good";
    targetResult  = { keyword: kw, count: kwCount, density, status };
  }

  return {
    totalWords, charCount, charNoSpaces, sentences,
    paragraphs, avgWordLen, readingTime,
    unigrams, bigrams, trigrams, targetResult,
    topWord: unigrams[0] || null,
  };
}

/* ── Density status helpers ── */
function densityStatus(d) {
  const n = parseFloat(d);
  if (n >= 1 && n <= 3) return "good";
  if (n > 3)            return "high";
  return "low";
}

function densityColor(status) {
  if (status === "good") return "var(--green)";
  if (status === "high") return "var(--red)";
  return "var(--grey-3)";
}

function densityLabel(status) {
  if (status === "good") return "Optimal";
  if (status === "high") return "Too High";
  return "Low";
}

/* ── Bar component ── */
function DensityBar({ density, max, status }) {
  const pct = Math.min((parseFloat(density) / Math.max(parseFloat(max), 0.01)) * 100, 100);
  return (
    <div className="kd-bar-track">
      <div
        className={`kd-bar-fill kd-bar-${status}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Keyword Row ── */
function KeywordRow({ item, rank, max, showDensity }) {
  const status = densityStatus(item.density);
  return (
    <div className="kd-kw-row" style={{ animationDelay: `${rank * 0.03}s` }}>
      <span className="kd-rank">{rank}</span>
      <span className="kd-word">{item.word}</span>
      <DensityBar density={item.density} max={max} status={status} />
      <span className="kd-count">{item.count}×</span>
      {showDensity && (
        <span className={`kd-density kd-density-${status}`}>{item.density}%</span>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function KeywordDensity() {
  const [text,         setText]         = useState("");
  const [targetKw,     setTargetKw]     = useState("");
  const [filterStops,  setFilterStops]  = useState(true);
  const [showDensity,  setShowDensity]  = useState(true);
  const [activeTab,    setActiveTab]    = useState("unigrams");
  const [copied,       setCopied]       = useState(false);
  const [analyzed,     setAnalyzed]     = useState(false);
  const [result,       setResult]       = useState(null);

  const charCount  = text.length;
  const wordCount  = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleAnalyze = () => {
    const r = analyzeText(text, filterStops, targetKw);
    setResult(r);
    setAnalyzed(!!r);
    if (r) setActiveTab("unigrams");
  };

  const handleReset = () => {
    setText(""); setTargetKw(""); setResult(null); setAnalyzed(false);
  };

  const handleCopy = () => {
    if (!result) return;
    const lines = [
      `Keyword Density Report`,
      `${"─".repeat(40)}`,
      `Total Words: ${result.totalWords}`,
      `Characters: ${result.charCount}`,
      `Sentences: ${result.sentences}`,
      `Reading Time: ~${result.readingTime} min`,
      ``,
      result.targetResult ? `Target Keyword: "${result.targetResult.keyword}"` : "",
      result.targetResult ? `Count: ${result.targetResult.count} | Density: ${result.targetResult.density}%` : "",
      result.targetResult ? "" : "",
      `Top Keywords (Unigrams):`,
      ...result.unigrams.slice(0,15).map((k,i) => `  ${i+1}. ${k.word} — ${k.count}x (${k.density}%)`),
      ``,
      `Top Bigrams:`,
      ...result.bigrams.slice(0,10).map((k,i) => `  ${i+1}. "${k.word}" — ${k.count}x`),
    ].filter(l => l !== undefined).join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!result) return;
    const csv = [
      "Type,Keyword,Count,Density",
      ...result.unigrams.map(k => `Unigram,"${k.word}",${k.count},${k.density}%`),
      ...result.bigrams.map(k  => `Bigram,"${k.word}",${k.count},${k.density}%`),
      ...result.trigrams.map(k => `Trigram,"${k.word}",${k.count},${k.density}%`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "keyword-density.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const activeList = result
    ? activeTab === "unigrams" ? result.unigrams
    : activeTab === "bigrams"  ? result.bigrams
    : result.trigrams
    : [];

  const maxDensity = activeList.length ? activeList[0].density : "1";

  return (
    <>
      <Helmet>
        <title>Keyword Density Checker – Free SEO Keyword Analyzer | ShauryaTools</title>
        <meta name="description" content="Analyze keyword density, frequency, and distribution in any text. Check single keywords, bigrams, and trigrams. Free SEO content analysis tool." />
        <meta name="keywords" content="keyword density checker, keyword frequency, seo keyword analyzer, text analysis, keyword distribution, bigram analysis" />
        <link rel="canonical" href="https://shauryatools.vercel.app/keyword-density" />
      </Helmet>

      <div className="kd-page">
        <div className="kd-inner">

          {/* ── Header ── */}
          <div className="kd-header">
            <div className="kd-icon"><IconSearch /></div>
            <div>
              <span className="kd-cat">SEO Tools</span>
              <h1>Keyword Density Checker</h1>
              <p>Analyze keyword frequency, density, and distribution across your content.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="kd-card">

            {/* Target keyword + options row */}
            <div className="kd-top-row">
              <div className="kd-field kd-field-kw">
                <label className="kd-label">Target Keyword <span className="kd-optional">(optional)</span></label>
                <div className="kd-kw-wrap">
                  <span className="kd-kw-icon"><IconSearch /></span>
                  <input
                    className="kd-kw-input"
                    value={targetKw}
                    onChange={e => { setTargetKw(e.target.value); setAnalyzed(false); }}
                    placeholder="e.g. content marketing"
                    spellCheck={false}
                  />
                  {targetKw && (
                    <button className="kd-clear" onClick={() => setTargetKw("")}>✕</button>
                  )}
                </div>
              </div>

              <div className="kd-field kd-field-opts">
                <label className="kd-label">Options</label>
                <div className="kd-options">
                  <label className="kd-toggle">
                    <input type="checkbox" checked={filterStops} onChange={e => { setFilterStops(e.target.checked); setAnalyzed(false); }} />
                    <span className="kd-toggle-track"><span className="kd-toggle-thumb" /></span>
                    <span className="kd-toggle-label"><IconFilter /> Filter stop words</span>
                  </label>
                  <label className="kd-toggle">
                    <input type="checkbox" checked={showDensity} onChange={e => setShowDensity(e.target.checked)} />
                    <span className="kd-toggle-track"><span className="kd-toggle-thumb" /></span>
                    <span className="kd-toggle-label">Show density %</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="kd-divider" />

            {/* Text input */}
            <div className="kd-field">
              <div className="kd-label-row">
                <label className="kd-label">Content to Analyze</label>
                <div className="kd-meta-pills">
                  <span className="kd-pill">{wordCount.toLocaleString()} words</span>
                  <span className="kd-pill">{charCount.toLocaleString()} chars</span>
                </div>
              </div>
              <textarea
                className="kd-textarea"
                value={text}
                onChange={e => { setText(e.target.value); setAnalyzed(false); }}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleAnalyze(); }}
                placeholder={"Paste your article, blog post, or any content here...\n\nThe tool will analyze keyword frequency, density, unigrams, bigrams, and trigrams.\nPress Ctrl+Enter to analyze quickly."}
                rows={10}
                spellCheck={false}
              />
            </div>

            {/* Actions */}
            <div className="kd-actions">
              {analyzed && (
                <button className="kd-btn-ghost" onClick={handleReset}><IconRefresh /> Reset</button>
              )}
              <button
                className="kd-analyze-btn"
                onClick={handleAnalyze}
                disabled={!text.trim()}
              >
                <IconZap /> Analyze Keywords
              </button>
            </div>
          </div>

          {/* ── Results ── */}
          {result && (
            <>
              {/* Stats strip */}
              <div className="kd-stats-strip animate-in">
                {[
                  { label: "Total Words",    val: result.totalWords.toLocaleString()  },
                  { label: "Characters",     val: result.charCount.toLocaleString()   },
                  { label: "Sentences",      val: result.sentences.toLocaleString()   },
                  { label: "Paragraphs",     val: result.paragraphs.toLocaleString()  },
                  { label: "Avg Word Len",   val: `${result.avgWordLen} chars`        },
                  { label: "Reading Time",   val: `~${result.readingTime} min`        },
                ].map(s => (
                  <div key={s.label} className="kd-stat">
                    <span className="kd-stat-val">{s.val}</span>
                    <span className="kd-stat-lbl">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Target keyword result */}
              {result.targetResult && (
                <div className={`kd-target-card animate-in kd-target-${result.targetResult.status}`}>
                  <div className="kd-target-left">
                    <span className="kd-target-label">Target Keyword</span>
                    <span className="kd-target-kw">"{result.targetResult.keyword}"</span>
                  </div>
                  <div className="kd-target-stats">
                    <div className="kd-target-stat">
                      <span className="kd-target-num">{result.targetResult.count}</span>
                      <span className="kd-target-sub">occurrences</span>
                    </div>
                    <div className="kd-target-stat">
                      <span className="kd-target-num">{result.targetResult.density}%</span>
                      <span className="kd-target-sub">density</span>
                    </div>
                    <div className="kd-target-stat">
                      <span className={`kd-target-badge kd-badge-${result.targetResult.status}`}>
                        {densityLabel(result.targetResult.status)}
                      </span>
                      <span className="kd-target-sub">
                        {result.targetResult.status === "good"   ? "1–3% is ideal"
                        : result.targetResult.status === "high"  ? "> 3% may hurt SEO"
                        : "< 1% too sparse"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Keyword table card */}
              <div className="kd-card animate-in">

                {/* Card top */}
                <div className="kd-card-top">
                  <div className="kd-tabs">
                    {[
                      { id: "unigrams", label: `Keywords (${result.unigrams.length})` },
                      { id: "bigrams",  label: `2-Word (${result.bigrams.length})` },
                      { id: "trigrams", label: `3-Word (${result.trigrams.length})` },
                    ].map(t => (
                      <button
                        key={t.id}
                        className={`kd-tab ${activeTab === t.id ? "kd-tab-on" : ""}`}
                        onClick={() => setActiveTab(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="kd-card-actions">
                    <button className="kd-btn-ghost" onClick={handleDownload}><IconDownload /> CSV</button>
                    <button className={`kd-copy-btn ${copied ? "kd-copied" : ""}`} onClick={handleCopy}>
                      {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy Report</>}
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="kd-legend">
                  <div className="kd-legend-item">
                    <span className="kd-legend-dot kd-dot-good" />
                    <span>Optimal (1–3%)</span>
                  </div>
                  <div className="kd-legend-item">
                    <span className="kd-legend-dot kd-dot-high" />
                    <span>Too high (&gt;3%)</span>
                  </div>
                  <div className="kd-legend-item">
                    <span className="kd-legend-dot kd-dot-low" />
                    <span>Low (&lt;1%)</span>
                  </div>
                  <span className="kd-legend-info"><IconInfo /> density = occurrences ÷ total words</span>
                </div>

                {/* Column headers */}
                <div className="kd-col-headers">
                  <span>#</span>
                  <span>Keyword</span>
                  <span>Frequency</span>
                  <span>Count</span>
                  {showDensity && <span>Density</span>}
                </div>

                {/* Rows */}
                <div className="kd-kw-list">
                  {activeList.length === 0 ? (
                    <div className="kd-empty">No {activeTab} found with frequency &gt; 1.</div>
                  ) : (
                    activeList.map((item, i) => (
                      <KeywordRow
                        key={item.word}
                        item={item}
                        rank={i + 1}
                        max={maxDensity}
                        showDensity={showDensity}
                      />
                    ))
                  )}
                </div>

                {/* Top keyword callout */}
                {result.topWord && activeTab === "unigrams" && (
                  <div className="kd-top-callout">
                    <span className="kd-callout-label">🏆 Most frequent keyword</span>
                    <span className="kd-callout-word">"{result.topWord.word}"</span>
                    <span className="kd-callout-stat">{result.topWord.count}× · {result.topWord.density}%</span>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
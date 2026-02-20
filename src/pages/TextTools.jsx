import { useState, useMemo } from "react";
import { Type, RefreshCw, Copy, Check } from "lucide-react";
import "./TextTools.css";
import { Helmet } from "react-helmet";

/* ── Case conversion functions ── */
const CASES = [
  {
    id: "upper",
    label: "UPPER CASE",
    fn: s => s.toUpperCase(),
  },
  {
    id: "lower",
    label: "lower case",
    fn: s => s.toLowerCase(),
  },
  {
    id: "title",
    label: "Title Case",
    fn: s =>
      s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
  },
  {
    id: "sentence",
    label: "Sentence case",
    fn: s =>
      s
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()),
  },
  {
    id: "camel",
    label: "camelCase",
    fn: s =>
      s
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()),
  },
  {
    id: "pascal",
    label: "PascalCase",
    fn: s => {
      const camel = s
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase());
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    },
  },
  {
    id: "snake",
    label: "snake_case",
    fn: s =>
      s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, ""),
  },
  {
    id: "kebab",
    label: "kebab-case",
    fn: s =>
      s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
  },
  {
    id: "alternate",
    label: "aLtErNaTe",
    fn: s =>
      s
        .split("")
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join(""),
  },
  {
    id: "inverse",
    label: "iNVERSE",
    fn: s =>
      s
        .split("")
        .map(c =>
          c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        )
        .join(""),
  },
];

/* ── Stats calculation ── */
function calcStats(text) {
  if (!text) return { chars: 0, charsNoSpace: 0, words: 0, sentences: 0, paragraphs: 0, lines: 0, readTime: "0 sec" };

  const chars        = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words        = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const sentences    = (text.match(/[^.!?]*[.!?]/g) || []).length || (text.trim() ? 1 : 0);
  const paragraphs   = text.split(/\n\s*\n/).filter(p => p.trim()).length || (text.trim() ? 1 : 0);
  const lines        = text.split("\n").length;

  const wpm     = 238; // average reading speed
  const minutes = words / wpm;
  let readTime;
  if (minutes < 1)       readTime = `${Math.ceil(minutes * 60)} sec`;
  else if (minutes < 60) readTime = `${Math.ceil(minutes)} min`;
  else                   readTime = `${Math.floor(minutes / 60)}h ${Math.ceil(minutes % 60)}m`;

  return { chars, charsNoSpace, words, sentences, paragraphs, lines, readTime };
}

/* ── Top 5 keyword frequency ── */
function topWords(text) {
  if (!text.trim()) return [];
  const stop = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","is","it","this","that","was","are","be","as","by","from","not","have","has","had"]);
  const freq = {};
  text.toLowerCase().match(/\b[a-z]{3,}\b/g)?.forEach(w => {
    if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

/* ── Component ── */
export default function TextTools() {
  const [text,       setText]       = useState("");
  const [activeCase, setActiveCase] = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [tab,        setTab]        = useState("counter"); // counter | case

  const stats    = useMemo(() => calcStats(text), [text]);
  const keywords = useMemo(() => topWords(text), [text]);

  const displayText = useMemo(() => {
    if (!activeCase) return text;
    const fn = CASES.find(c => c.id === activeCase)?.fn;
    return fn ? fn(text) : text;
  }, [text, activeCase]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (activeCase) {
      const fn = CASES.find(c => c.id === activeCase)?.fn;
      if (fn) setText(fn(text));
      setActiveCase(null);
    }
  };

  const handleReset = () => {
    setText("");
    setActiveCase(null);
  };

  const hasText = text.trim().length > 0;

  return (
    <>
    <Helmet>
      <title>Free Word Counter & Case Converter Online – ShauryaTools</title>
      <meta name="description" content="Count words, characters, sentences and paragraphs. Convert text to uppercase, lowercase, title case, camelCase, snake_case and more. Free, instant." />
      <meta name="keywords" content="word counter, character counter, case converter, text tools, uppercase converter, camelcase converter, snake case tool, online word count" />
      <link rel="canonical" href="https://shauryatools.vercel.app/text-tools" />
    </Helmet>
    <div className="tt-page">
      <div className="tt-inner">

        {/* Header */}
        <div className="tt-header">
          <div className="tt-icon">
            <Type size={20} />
          </div>
          <div>
            <span className="tt-cat-badge">Text Tools</span>
            <h1>Word Counter & Case Converter</h1>
            <p>Analyze text stats and convert between letter cases instantly.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tt-tab-bar">
          <button
            className={`tt-tab-main ${tab === "counter" ? "tt-tab-main-on" : ""}`}
            onClick={() => setTab("counter")}
          >📊 Word Counter</button>
          <button
            className={`tt-tab-main ${tab === "case" ? "tt-tab-main-on" : ""}`}
            onClick={() => setTab("case")}
          >🔤 Case Converter</button>
        </div>

        {/* Text input card */}
        <div className="tt-card">
          <div className="tt-textarea-header">
            <label className="tt-label">Your Text</label>
            <div className="tt-textarea-actions">
              <span className="tt-char-pill">{stats.chars} chars</span>
              <button className="tt-icon-btn" onClick={handleReset} disabled={!hasText} title="Clear">
                <RefreshCw size={14} />
              </button>
              <button
                className={`tt-icon-btn tt-copy-btn ${copied ? "tt-copied" : ""}`}
                onClick={handleCopy}
                disabled={!hasText}
                title="Copy"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <textarea
            className="tt-textarea"
            placeholder="Paste or type your text here…"
            value={tab === "case" && activeCase ? displayText : text}
            onChange={e => { setText(e.target.value); }}
            spellCheck={false}
          />
        </div>

        {/* ── WORD COUNTER TAB ── */}
        {tab === "counter" && (
          <div className="tt-card animate-in">

            {/* Stats grid */}
            <div className="tt-stats-grid">
              <div className="tt-stat tt-stat-indigo">
                <span className="tt-stat-num">{stats.words.toLocaleString()}</span>
                <span className="tt-stat-label">Words</span>
              </div>
              <div className="tt-stat tt-stat-rose">
                <span className="tt-stat-num">{stats.chars.toLocaleString()}</span>
                <span className="tt-stat-label">Characters</span>
              </div>
              <div className="tt-stat tt-stat-amber">
                <span className="tt-stat-num">{stats.charsNoSpace.toLocaleString()}</span>
                <span className="tt-stat-label">No Spaces</span>
              </div>
              <div className="tt-stat tt-stat-teal">
                <span className="tt-stat-num">{stats.sentences}</span>
                <span className="tt-stat-label">Sentences</span>
              </div>
              <div className="tt-stat tt-stat-violet">
                <span className="tt-stat-num">{stats.paragraphs}</span>
                <span className="tt-stat-label">Paragraphs</span>
              </div>
              <div className="tt-stat tt-stat-sky">
                <span className="tt-stat-num">{stats.lines}</span>
                <span className="tt-stat-label">Lines</span>
              </div>
            </div>

            {/* Read time */}
            <div className="tt-readtime">
              <span className="tt-readtime-icon">📖</span>
              <span>Estimated reading time: <strong>{stats.readTime}</strong></span>
            </div>

            {/* Top keywords */}
            {keywords.length > 0 && (
              <div className="tt-keywords">
                <p className="tt-kw-title">Top Keywords</p>
                <div className="tt-kw-list">
                  {keywords.map(([word, count], i) => (
                    <div key={word} className="tt-kw-item">
                      <span className="tt-kw-rank">#{i + 1}</span>
                      <span className="tt-kw-word">{word}</span>
                      <span className="tt-kw-bar-wrap">
                        <span
                          className="tt-kw-bar"
                          style={{ width: `${(count / keywords[0][1]) * 100}%` }}
                        />
                      </span>
                      <span className="tt-kw-count">{count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasText && (
              <p className="tt-empty">Start typing above to see your text statistics.</p>
            )}
          </div>
        )}

        {/* ── CASE CONVERTER TAB ── */}
        {tab === "case" && (
          <div className="tt-card animate-in">
            <label className="tt-label">Choose a Case</label>
            <div className="tt-cases-grid">
              {CASES.map(c => (
                <button
                  key={c.id}
                  className={`tt-case-btn ${activeCase === c.id ? "tt-case-on" : ""}`}
                  onClick={() => setActiveCase(prev => prev === c.id ? null : c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {activeCase && (
              <div className="tt-case-preview animate-in">
                <p className="tt-preview-label">Preview</p>
                <div className="tt-preview-text">
                  {displayText || <span className="tt-preview-empty">Type text above to see the preview…</span>}
                </div>
              </div>
            )}

            <div className="tt-case-actions">
              <button
                className="tt-apply-btn"
                onClick={handleApply}
                disabled={!activeCase || !hasText}
              >
                Apply Conversion
              </button>
              <button
                className={`tt-copy-full ${copied ? "tt-copied-full" : ""}`}
                onClick={handleCopy}
                disabled={!hasText}
              >
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Result</>}
              </button>
            </div>

            {!hasText && (
              <p className="tt-empty">Type or paste your text above, then pick a case style.</p>
            )}
          </div>
        )}

      </div>
    </div>
    </>
  );
}
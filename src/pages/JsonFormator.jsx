import { useState, useRef, useCallback } from "react";
import "./JsonFormator.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconBraces = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H7a2 2 0 00-2 2v5a2 2 0 01-2 2 2 2 0 012 2v5c0 1.1.9 2 2 2h1"/>
    <path d="M16 3h1a2 2 0 012 2v5a2 2 0 002 2 2 2 0 00-2 2v5a2 2 0 01-2 2h-1"/>
  </svg>
);
const IconCopy = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconUpload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconMinus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const IconWarning = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconOk = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconMiniArrow = ({ open }) => (
  <svg
    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease", flexShrink: 0 }}
  >
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/* ── JSON stats ── */
function getStats(obj) {
  let keys = 0, depth = 0, arrays = 0, objects = 0, nulls = 0;
  function walk(v, d) {
    depth = Math.max(depth, d);
    if (v === null) { nulls++; return; }
    if (Array.isArray(v)) {
      arrays++;
      v.forEach(i => walk(i, d + 1));
    } else if (typeof v === "object") {
      objects++;
      Object.entries(v).forEach(([, val]) => { keys++; walk(val, d + 1); });
    }
  }
  walk(obj, 0);
  return { keys, depth, arrays, objects, nulls };
}

/* ── Syntax-highlighted JSON renderer ── */
function highlight(json) {
  return json
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "jf-num";
        if (/^"/.test(match)) cls = /:$/.test(match) ? "jf-key" : "jf-str";
        else if (/true|false/.test(match)) cls = "jf-bool";
        else if (/null/.test(match)) cls = "jf-null";
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

/* ── Collapsible tree node ── */
function TreeNode({ keyName, value, depth, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen || depth < 2);
  const isObj   = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArr   = Array.isArray(value);
  const isComplex = isObj || isArr;

  const entries = isObj ? Object.entries(value) : isArr ? value.map((v, i) => [i, v]) : [];
  const bracket = isArr ? ["[", "]"] : ["{", "}"];
  const count   = entries.length;

  const renderValue = (v) => {
    if (v === null)             return <span className="jf-null">null</span>;
    if (typeof v === "boolean") return <span className="jf-bool">{String(v)}</span>;
    if (typeof v === "number")  return <span className="jf-num">{v}</span>;
    if (typeof v === "string")  return <span className="jf-str">"{v}"</span>;
    return null;
  };

  return (
    <>
    <Helmet>
      <title>Free JSON Formatter & Validator Online – ShauryaTools</title>
      <meta name="description" content="Format, validate, minify and explore JSON instantly in your browser. Collapsible tree view, syntax highlighting, search, and download. No install needed." />
      <meta name="keywords" content="json formatter, json validator, json beautifier, json minifier, online json tool, format json, json tree view" />
      <link rel="canonical" href="https://shauryatools.vercel.app/json-formatter" />
    </Helmet>
    <div className="jf-node" style={{ "--depth": depth }}>
      <div className="jf-node-line">
        {keyName !== undefined && (
          <span className="jf-key">"{keyName}"<span className="jf-punct">: </span></span>
        )}
        {isComplex ? (
          <>
            <button className="jf-toggle" onClick={() => setOpen(o => !o)}>
              <IconMiniArrow open={open} />
            </button>
            <span className="jf-bracket">{bracket[0]}</span>
            {!open && (
              <span className="jf-collapsed" onClick={() => setOpen(true)}>
                {count} {isArr ? "item" : "key"}{count !== 1 ? "s" : ""}
              </span>
            )}
            {!open && <span className="jf-bracket">{bracket[1]}</span>}
          </>
        ) : (
          renderValue(value)
        )}
      </div>
      {isComplex && open && (
        <div className="jf-children">
          {entries.map(([k, v], i) => (
            <div key={k} className="jf-child-row">
              <TreeNode keyName={isArr ? undefined : k} value={v} depth={depth + 1} defaultOpen={depth < 1} />
              {i < entries.length - 1 && <span className="jf-comma">,</span>}
            </div>
          ))}
          <div className="jf-node-line"><span className="jf-bracket">{bracket[1]}</span></div>
        </div>
      )}
    </div>
    </>
  );
}

/* ── Main Component ── */
const INDENT_OPTIONS = [2, 4, 8];
const SAMPLE_JSON = `{
  "name": "ShauryaTools",
  "version": "1.0.0",
  "description": "Fast, free utilities — no sign-up, no nonsense.",
  "features": ["JSON Formatter", "README Generator", "Hashtag Tools"],
  "author": {
    "name": "Shaurya",
    "website": "https://shaurya.tools"
  },
  "active": true,
  "rating": 4.9,
  "meta": null
}`;

export default function JsonFormatter() {
  const [input,      setInput]      = useState("");
  const [output,     setOutput]     = useState("");
  const [error,      setError]      = useState(null);
  const [parsed,     setParsed]     = useState(null);
  const [indent,     setIndent]     = useState(2);
  const [viewMode,   setViewMode]   = useState("formatted"); // formatted | tree | minified
  const [copied,     setCopied]     = useState(false);
  const [searchQ,    setSearchQ]    = useState("");
  const [stats,      setStats]      = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const fileRef = useRef();

  const process = useCallback((raw, ind = indent) => {
    const text = raw.trim();
    if (!text) { setOutput(""); setError(null); setParsed(null); setStats(null); return; }
    try {
      const obj = JSON.parse(text);
      const formatted = JSON.stringify(obj, null, ind);
      setOutput(formatted);
      setError(null);
      setParsed(obj);
      setStats(getStats(obj));
    } catch (e) {
      // Try to extract line/col from error message
      const match = e.message.match(/position (\d+)/);
      let hint = e.message;
      if (match) {
        const pos = parseInt(match[1]);
        const before = text.slice(0, pos);
        const line = before.split("\n").length;
        const col  = pos - before.lastIndexOf("\n");
        hint = `${e.message} — Line ${line}, Col ${col}`;
      }
      setError(hint);
      setOutput("");
      setParsed(null);
      setStats(null);
    }
  }, [indent]);

  const handleInput = (val) => { setInput(val); process(val); };

  const handleIndentChange = (ind) => {
    setIndent(ind);
    if (parsed) { setOutput(JSON.stringify(parsed, null, ind)); }
  };

  const handleCopy = () => {
    const text = viewMode === "minified"
      ? JSON.stringify(parsed)
      : output;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClear = () => {
    setInput(""); setOutput(""); setError(null);
    setParsed(null); setStats(null); setSearchQ("");
  };

  const handleSample = () => { setInput(SAMPLE_JSON); process(SAMPLE_JSON); };

  const handleDownload = () => {
    const text = viewMode === "minified" ? JSON.stringify(parsed) : output;
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { const txt = e.target.result; setInput(txt); process(txt); };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Search highlight in formatted output
  const highlightSearch = (text) => {
    if (!searchQ.trim()) return highlight(text);
    const escaped = searchQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "gi");
    return highlight(text).replace(re, `<mark class="jf-mark">$1</mark>`);
  };

  const minified = parsed ? JSON.stringify(parsed) : "";
  const charCount = output.length;
  const lineCount = output.split("\n").length;

  const status = error ? "error" : parsed ? "valid" : "idle";

  return (
    <div className="jf-page">
      <div className="jf-inner">

        {/* ── Header ── */}
        <div className="jf-header">
          <div className="jf-icon"><IconBraces /></div>
          <div>
            <span className="jf-cat">Utility</span>
            <h1>JSON Formatter <span className="jf-amp">&amp;</span> Validator</h1>
            <p>Format, validate, minify and explore JSON — instantly, in your browser.</p>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="jf-grid">

          {/* ── Left: Input ── */}
          <div className="jf-col">
            <div className="jf-panel">
              <div className="jf-panel-head">
                <span className="jf-panel-title">Input</span>
                <div className="jf-panel-actions">
                  <button className="jf-action-btn" onClick={handleSample} title="Load sample JSON">Sample</button>
                  <button className="jf-action-btn" onClick={() => fileRef.current.click()} title="Upload JSON file">
                    <IconUpload /> Upload
                  </button>
                  <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                  {input && (
                    <button className="jf-action-btn jf-danger-btn" onClick={handleClear} title="Clear">
                      <IconTrash />
                    </button>
                  )}
                </div>
              </div>

              {/* Drag zone */}
              <div
                className={`jf-textarea-wrap ${dragOver ? "jf-drag-over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <textarea
                  className="jf-textarea"
                  value={input}
                  onChange={e => handleInput(e.target.value)}
                  placeholder={`Paste JSON here…\n\nOr drag & drop a .json file`}
                  spellCheck={false}
                />
                {!input && (
                  <div className="jf-drop-hint">
                    <IconUpload />
                    <span>Drag & drop a .json file</span>
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className={`jf-status-bar jf-status-${status}`}>
                {status === "valid" && (
                  <><IconOk /><span>Valid JSON</span></>
                )}
                {status === "error" && (
                  <><IconWarning /><span>{error}</span></>
                )}
                {status === "idle" && (
                  <span className="jf-status-idle">Awaiting input…</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Output ── */}
          <div className="jf-col">
            <div className="jf-panel">
              <div className="jf-panel-head">
                <span className="jf-panel-title">Output</span>
                <div className="jf-panel-actions">
                  {parsed && (
                    <>
                      <button className="jf-action-btn" onClick={handleDownload} title="Download JSON">
                        <IconDownload />
                      </button>
                      <button className={`jf-copy-btn ${copied ? "jf-copied" : ""}`} onClick={handleCopy}>
                        {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Controls row */}
              {parsed && (
                <div className="jf-controls">
                  {/* View mode tabs */}
                  <div className="jf-tabs">
                    {["formatted", "tree", "minified"].map(m => (
                      <button
                        key={m}
                        className={`jf-tab ${viewMode === m ? "jf-tab-on" : ""}`}
                        onClick={() => setViewMode(m)}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Indent selector (only for formatted) */}
                  {viewMode === "formatted" && (
                    <div className="jf-indent-group">
                      <span className="jf-indent-label">Indent</span>
                      {INDENT_OPTIONS.map(n => (
                        <button
                          key={n}
                          className={`jf-indent-btn ${indent === n ? "jf-indent-on" : ""}`}
                          onClick={() => handleIndentChange(n)}
                        >{n}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Search (formatted mode) */}
              {parsed && viewMode === "formatted" && (
                <div className="jf-search-wrap">
                  <IconSearch />
                  <input
                    className="jf-search"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search in output…"
                  />
                  {searchQ && <button className="jf-search-clear" onClick={() => setSearchQ("")}>✕</button>}
                </div>
              )}

              {/* Output content */}
              <div className="jf-output-wrap">
                {!parsed && !error && (
                  <div className="jf-empty">
                    <div className="jf-empty-icon"><IconBraces /></div>
                    <p>Your formatted JSON will appear here</p>
                  </div>
                )}

                {error && (
                  <div className="jf-error-panel">
                    <div className="jf-error-icon"><IconWarning /></div>
                    <p className="jf-error-title">Invalid JSON</p>
                    <p className="jf-error-detail">{error}</p>
                    <p className="jf-error-tip">Check for missing quotes, commas, or brackets.</p>
                  </div>
                )}

                {parsed && viewMode === "formatted" && (
                  <pre
                    className="jf-code"
                    dangerouslySetInnerHTML={{ __html: highlightSearch(output) }}
                  />
                )}

                {parsed && viewMode === "tree" && (
                  <div className="jf-tree">
                    <TreeNode value={parsed} depth={0} defaultOpen={true} />
                  </div>
                )}

                {parsed && viewMode === "minified" && (
                  <pre className="jf-code jf-minified">{minified}</pre>
                )}
              </div>

              {/* Footer stats */}
              {parsed && stats && (
                <div className="jf-stats-bar">
                  <span className="jf-stat"><strong>{stats.keys}</strong> keys</span>
                  <span className="jf-stat-sep">·</span>
                  <span className="jf-stat"><strong>{stats.objects}</strong> objects</span>
                  <span className="jf-stat-sep">·</span>
                  <span className="jf-stat"><strong>{stats.arrays}</strong> arrays</span>
                  <span className="jf-stat-sep">·</span>
                  <span className="jf-stat">depth <strong>{stats.depth}</strong></span>
                  <span className="jf-stat-sep">·</span>
                  <span className="jf-stat"><strong>{lineCount}</strong> lines</span>
                  <span className="jf-stat-sep">·</span>
                  <span className="jf-stat"><strong>{(charCount / 1024).toFixed(1)}</strong> KB</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
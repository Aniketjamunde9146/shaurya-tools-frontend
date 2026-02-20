import { useState } from "react";
import "./Urlencoderdecoder.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconLink = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
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
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconSwap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/>
    <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
);
const IconWarning = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconOk = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconExternalLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

/* ── Helpers ── */
function encodeUrl(text, mode) {
  if (mode === "component") return encodeURIComponent(text);
  if (mode === "full")      return encodeURI(text);
  // "query" — encode everything except unreserved chars
  return text.replace(/[^A-Za-z0-9\-_.~]/g, ch =>
    "%" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")
  );
}

function decodeUrl(text) {
  try {
    // Try decodeURIComponent first (handles %20, + as space in query strings)
    return decodeURIComponent(text.replace(/\+/g, " "));
  } catch {
    throw new Error("Invalid percent-encoded string. Make sure all % sequences are valid (e.g. %20, %3A).");
  }
}

function parseQueryString(qs) {
  const cleaned = qs.startsWith("?") ? qs.slice(1) : qs;
  if (!cleaned.trim()) return [];
  return cleaned.split("&").map(pair => {
    const [key, ...vals] = pair.split("=");
    return {
      key:   decodeURIComponent(key.replace(/\+/g, " ")),
      value: vals.length ? decodeURIComponent(vals.join("=").replace(/\+/g, " ")) : "",
    };
  });
}

function parseFullUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return {
      protocol: u.protocol,
      host:     u.hostname,
      port:     u.port,
      path:     u.pathname,
      query:    u.search,
      hash:     u.hash,
      params:   parseQueryString(u.search),
    };
  } catch { return null; }
}

const SAMPLES = {
  encode: `https://example.com/search?q=hello world&lang=en&tag=<script>alert("xss")</script>`,
  decode: `https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26lang%3Den%26tag%3D%3Cscript%3Ealert(%22xss%22)%3C%2Fscript%3E`,
  parse:  `https://shaurya.tools/search?q=json formatter&category=utility&sort=popular&page=1#results`,
};

const ENCODE_MODES = [
  { id: "component", label: "encodeURIComponent", desc: "Encodes everything including :/?#[]@!$&'()*+,;=" },
  { id: "full",      label: "encodeURI",          desc: "Preserves :/?#[]@!$&'()*+,;= — safe for full URLs" },
  { id: "query",     label: "Query String",        desc: "Encodes all non-unreserved chars (strict mode)" },
];

export default function UrlEncoderDecoder() {
  const [mode,        setMode]        = useState("encode");   // encode | decode | parse
  const [encodeMode,  setEncodeMode]  = useState("component");
  const [input,       setInput]       = useState("");
  const [output,      setOutput]      = useState("");
  const [parsed,      setParsed]      = useState(null);
  const [error,       setError]       = useState(null);
  const [copied,      setCopied]      = useState(false);

  const isEncode = mode === "encode";
  const isDecode = mode === "decode";
  const isParse  = mode === "parse";

  function process(raw, currentMode = mode, encMode = encodeMode) {
    const text = raw.trim();
    if (!text) { setOutput(""); setError(null); setParsed(null); return; }
    try {
      if (currentMode === "encode") {
        setOutput(encodeUrl(text, encMode));
        setParsed(null);
      } else if (currentMode === "decode") {
        setOutput(decodeUrl(text));
        setParsed(null);
      } else {
        const p = parseFullUrl(text);
        if (!p) throw new Error("Could not parse URL. Make sure it starts with http:// or https://");
        setParsed(p);
        setOutput("");
      }
      setError(null);
    } catch (e) {
      setError(e.message);
      setOutput("");
      setParsed(null);
    }
  }

  const handleInput = (val) => { setInput(val); process(val); };

  const handleModeSwitch = (m) => {
    setMode(m);
    setInput("");
    setOutput("");
    setParsed(null);
    setError(null);
  };

  const handleEncodeModeChange = (em) => {
    setEncodeMode(em);
    if (input.trim() && mode === "encode") process(input, "encode", em);
  };

  const handleSwap = () => {
    const newMode = isEncode ? "decode" : "encode";
    const newInput = output;
    setMode(newMode);
    setInput(newInput);
    setOutput("");
    setParsed(null);
    setError(null);
    if (newInput.trim()) process(newInput, newMode);
  };

  const handleClear = () => { setInput(""); setOutput(""); setParsed(null); setError(null); };

  const handleSample = () => {
    const s = SAMPLES[mode];
    setInput(s);
    process(s);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const status = error ? "error" : (output || parsed) ? "valid" : "idle";

  // Diff view: highlight encoded chars in output
  function renderEncodedDiff(text) {
    return text.replace(/(%[0-9A-Fa-f]{2})+/g, m =>
      `<mark class="ue-encoded-mark">${m}</mark>`
    );
  }

  // Count encoded chars
  const encodedCount = output ? (output.match(/(%[0-9A-Fa-f]{2})/g) || []).length : 0;

  return (
    <>
    <Helmet>
      <title>Free URL Encoder / Decoder & Parser Online – ShauryaTools</title>
      <meta name="description" content="Encode, decode, and parse URLs instantly. Supports encodeURIComponent, encodeURI, and strict query encoding. View query params in a clean table. Free." />
      <meta name="keywords" content="url encoder, url decoder, url encode decode, percent encoding, url parser, query string parser, online url tool" />
      <link rel="canonical" href="https://shauryatools.vercel.app/url-encoder-decoder" />
    </Helmet>
    <div className="ue-page">
      <div className="ue-inner">

        {/* ── Header ── */}
        <div className="ue-header">
          <div className="ue-icon"><IconLink /></div>
          <div>
            <span className="ue-cat">Utility</span>
            <h1>URL <span className="ue-slash">Encoder / Decoder</span></h1>
            <p>Encode, decode, and parse URLs — handle query strings, special characters, and percent-encoding.</p>
          </div>
        </div>

        {/* ── Mode switcher ── */}
        <div className="ue-mode-bar">
          {[
            { id: "encode", label: "Encode" },
            { id: "decode", label: "Decode" },
            { id: "parse",  label: "Parse URL" },
          ].map(m => (
            <button
              key={m.id}
              className={`ue-mode-tab ${mode === m.id ? "ue-mode-on" : ""}`}
              onClick={() => handleModeSwitch(m.id)}
            >
              {m.label}
            </button>
          ))}

          {(isEncode || isDecode) && (
            <button className="ue-swap-btn" onClick={handleSwap} title="Swap direction & content">
              <IconSwap /> Swap
            </button>
          )}
        </div>

        {/* ── Encode mode selector ── */}
        {isEncode && (
          <div className="ue-encode-modes">
            {ENCODE_MODES.map(em => (
              <button
                key={em.id}
                className={`ue-encode-btn ${encodeMode === em.id ? "ue-encode-on" : ""}`}
                onClick={() => handleEncodeModeChange(em.id)}
              >
                <span className="ue-encode-label">{em.label}</span>
                <span className="ue-encode-desc">{em.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="ue-grid">

          {/* ── Input panel ── */}
          <div className="ue-panel">
            <div className="ue-panel-head">
              <div className="ue-panel-title-row">
                <span className={`ue-lang-badge ${isDecode ? "ue-badge-encoded" : "ue-badge-plain"}`}>
                  {isDecode ? "Encoded URL" : isParse ? "URL" : "Plain Text / URL"}
                </span>
                <span className="ue-panel-label">Input</span>
              </div>
              <div className="ue-panel-actions">
                <button className="ue-action-btn" onClick={handleSample}>Sample</button>
                {input && (
                  <button className="ue-action-btn ue-danger-btn" onClick={handleClear}>
                    <IconTrash />
                  </button>
                )}
              </div>
            </div>

            <div className="ue-textarea-wrap">
              <textarea
                className="ue-textarea"
                value={input}
                onChange={e => handleInput(e.target.value)}
                placeholder={
                  isEncode ? "Paste a URL or text to encode…\ne.g. https://example.com/search?q=hello world" :
                  isDecode ? "Paste a percent-encoded URL to decode…\ne.g. https%3A%2F%2Fexample.com%2F" :
                  "Paste a full URL to parse…\ne.g. https://example.com/path?key=value#section"
                }
                spellCheck={false}
              />
            </div>

            <div className={`ue-status-bar ue-status-${status}`}>
              {status === "valid" && (
                <><IconOk />
                  <span>
                    {isEncode ? `Encoded — ${encodedCount} character${encodedCount !== 1 ? "s" : ""} replaced` :
                     isDecode ? "Decoded successfully" :
                     "URL parsed successfully"}
                  </span>
                </>
              )}
              {status === "error" && <><IconWarning /><span>{error}</span></>}
              {status === "idle"  && <span className="ue-idle">Awaiting input…</span>}
            </div>
          </div>

          {/* ── Output panel ── */}
          <div className="ue-panel">
            <div className="ue-panel-head">
              <div className="ue-panel-title-row">
                <span className={`ue-lang-badge ${isEncode ? "ue-badge-encoded" : isParse ? "ue-badge-parsed" : "ue-badge-plain"}`}>
                  {isEncode ? "Encoded URL" : isParse ? "Parsed" : "Decoded Text"}
                </span>
                <span className="ue-panel-label">Output</span>
              </div>
              <div className="ue-panel-actions">
                {(output || parsed) && (
                  <button
                    className={`ue-copy-btn ${copied ? "ue-copied" : ""}`}
                    onClick={() => handleCopy(parsed ? JSON.stringify(parsed, null, 2) : output)}
                  >
                    {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                  </button>
                )}
              </div>
            </div>

            <div className="ue-output-wrap">
              {/* Empty */}
              {!output && !parsed && !error && (
                <div className="ue-empty">
                  <div className="ue-empty-icon"><IconLink /></div>
                  <p>Your {isEncode ? "encoded" : isParse ? "parsed" : "decoded"} output will appear here</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="ue-error-panel">
                  <div className="ue-error-icon"><IconWarning /></div>
                  <p className="ue-error-title">Failed</p>
                  <p className="ue-error-detail">{error}</p>
                </div>
              )}

              {/* Encode / Decode output */}
              {output && !error && (
                <div className="ue-output-content">
                  <pre
                    className={`ue-code ${isEncode ? "ue-code-encoded" : "ue-code-decoded"}`}
                    dangerouslySetInnerHTML={{ __html: isEncode ? renderEncodedDiff(output) : output }}
                  />
                  {/* Open in browser button if it looks like a URL */}
                  {isDecode && output.startsWith("http") && (
                    <a
                      className="ue-open-btn"
                      href={output}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconExternalLink /> Open in browser
                    </a>
                  )}
                </div>
              )}

              {/* Parse output */}
              {parsed && !error && (
                <div className="ue-parse-view">

                  {/* URL breakdown */}
                  <div className="ue-parse-section">
                    <span className="ue-parse-section-title">URL Breakdown</span>
                    <div className="ue-parse-grid">
                      {[
                        { label: "Protocol", value: parsed.protocol,                color: "violet" },
                        { label: "Host",     value: parsed.host,                    color: "blue"   },
                        { label: "Port",     value: parsed.port     || "(default)", color: "grey"   },
                        { label: "Path",     value: parsed.path     || "/",         color: "green"  },
                        { label: "Query",    value: parsed.query    || "(none)",     color: "orange" },
                        { label: "Hash",     value: parsed.hash     || "(none)",     color: "grey"   },
                      ].map(row => (
                        <div key={row.label} className="ue-parse-row">
                          <span className={`ue-parse-key ue-pk-${row.color}`}>{row.label}</span>
                          <span className="ue-parse-val">{row.value}</span>
                          {row.value && row.value !== "(none)" && row.value !== "(default)" && (
                            <button
                              className="ue-parse-copy"
                              onClick={() => { navigator.clipboard.writeText(row.value); }}
                              title="Copy"
                            >
                              <IconCopy />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Query params */}
                  {parsed.params.length > 0 && (
                    <div className="ue-parse-section">
                      <span className="ue-parse-section-title">
                        Query Parameters
                        <span className="ue-param-count">{parsed.params.length}</span>
                      </span>
                      <div className="ue-params-table">
                        <div className="ue-params-head">
                          <span>Key</span><span>Value</span>
                        </div>
                        {parsed.params.map((p, i) => (
                          <div key={i} className="ue-param-row">
                            <span className="ue-param-key">{p.key}</span>
                            <span className="ue-param-val">{p.value || <em className="ue-empty-val">(empty)</em>}</span>
                            <button
                              className="ue-parse-copy"
                              onClick={() => navigator.clipboard.writeText(`${p.key}=${p.value}`)}
                              title="Copy key=value"
                            >
                              <IconCopy />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Stats */}
            {output && (
              <div className="ue-stats-bar">
                <span className="ue-stat"><strong>{input.length}</strong> input chars</span>
                <span className="ue-stat-sep">→</span>
                <span className="ue-stat"><strong>{output.length}</strong> output chars</span>
                {isEncode && encodedCount > 0 && (
                  <>
                    <span className="ue-stat-sep">·</span>
                    <span className="ue-stat"><strong className="ue-stat-hi">{encodedCount}</strong> encoded sequences</span>
                  </>
                )}
              </div>
            )}
            {parsed && (
              <div className="ue-stats-bar">
                <span className="ue-stat"><strong>{parsed.params.length}</strong> query param{parsed.params.length !== 1 ? "s" : ""}</span>
                <span className="ue-stat-sep">·</span>
                <span className="ue-stat"><strong>{parsed.path.split("/").filter(Boolean).length}</strong> path segment{parsed.path.split("/").filter(Boolean).length !== 1 ? "s" : ""}</span>
                {parsed.hash && (
                  <>
                    <span className="ue-stat-sep">·</span>
                    <span className="ue-stat">has <strong>hash</strong></span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Reference strip ── */}
        <div className="ue-ref-strip">
          <span className="ue-ref-title">Common encoded characters</span>
          <div className="ue-ref-chars">
            {[
              [" ", "%20"], ["!", "%21"], ["#", "%23"], ["$", "%24"],
              ["&", "%26"], ["'", "%27"], ["(", "%28"], [")", "%29"],
              ["+", "%2B"], [",", "%2C"], ["/", "%2F"], [":", "%3A"],
              [";", "%3B"], ["=", "%3D"], ["?", "%3F"], ["@", "%40"],
              ["[", "%5B"], ["]", "%5D"],
            ].map(([ch, enc]) => (
              <div key={ch} className="ue-ref-chip">
                <span className="ue-ref-raw">{ch}</span>
                <span className="ue-ref-arr">→</span>
                <span className="ue-ref-enc">{enc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
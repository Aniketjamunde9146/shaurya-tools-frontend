/* eslint-disable no-regex-spaces */
/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Helmet } from "react-helmet";
import "./CodeMinifier.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/code-minifier`;

/* ── Icons ── */
const IconZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
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
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconWand = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 6.2L11 5M12.2 11.8L11 13"/>
    <path d="M3 21l9-9"/>
    <path d="M12.2 6.2L3 15.2l1.8 1.8 9.2-9.2-1.8-1.6z"/>
  </svg>
);

/* ── HTML Minifier ── */
function minifyHTML(html) {
  return html
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*=\s*/g, "=")
    .trim();
}

/* ── CSS Minifier ── */
function minifyCSS(css) {
  return css
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s*\{\s*/g, "{")
    .replace(/\s*\}\s*/g, "}")
    .replace(/;}/g, "}")
    .replace(/:0\./g, ":.")
    .replace(/([^0-9])(0)(px|em|rem|%|vw|vh|pt|cm|mm|in|ex|ch)/gi, "$1$2")
    .replace(/ {2,}/g, " ")
    .trim();
}

/* ── JS Minifier ── */
function minifyJS(js) {
  const lines = js.split("\n");
  let result = [];
  let inMultiComment = false;

  for (let line of lines) {
    let processed = "";
    let i = 0;

    if (inMultiComment) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      i = end + 2;
      inMultiComment = false;
    }

    let inStr = false;
    let strChar = "";
    let inTemplate = false;

    while (i < line.length) {
      const ch = line[i];
      const next = line[i + 1];

      if (inStr) {
        processed += ch;
        if (ch === "\\" ) { processed += line[++i] || ""; i++; continue; }
        if (ch === strChar) inStr = false;
        i++;
        continue;
      }

      if (inTemplate) {
        processed += ch;
        if (ch === "`") inTemplate = false;
        i++;
        continue;
      }

      if (ch === '"' || ch === "'") { inStr = true; strChar = ch; processed += ch; i++; continue; }
      if (ch === "`") { inTemplate = true; processed += ch; i++; continue; }
      if (ch === "/" && next === "/") break;

      if (ch === "/" && next === "*") {
        const end = line.indexOf("*/", i + 2);
        if (end === -1) { inMultiComment = true; break; }
        i = end + 2;
        continue;
      }

      processed += ch;
      i++;
    }

    const trimmed = processed.trim();
    if (trimmed) result.push(trimmed);
  }

  return result
    .join(" ")
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/\s*([:=])\s*/g, "$1")
    .replace(/\s*([+\-*/%])\s*/g, "$1")
    .replace(/\s*(&&|\|\|)\s*/g, "$1")
    .replace(/(return|typeof|instanceof|in|of|new|delete|void|throw|case|var|let|const|function|if|else|for|while|do|switch|try|catch|finally|class|extends|import|export|from|default)([A-Za-z0-9_$({])/g, "$1 $2")
    .replace(/([A-Za-z0-9_$})\]])(return|typeof|instanceof|in\b|of\b|new|delete|void|throw|case|var|let|const|function|if|else|for|while|do|switch|try|catch|finally|class|extends|import|export|from|default)/g, "$1 $2")
    .replace(/ {2,}/g, " ")
    .trim();
}

/* ── Prettifiers ── */
function prettifyHTML(html) {
  let indent = 0;
  const pad = () => "  ".repeat(Math.max(0, indent));
  const voidTags = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
  
  return html
    .replace(/></g, ">\n<")
    .split("\n")
    .map(line => {
      line = line.trim();
      if (!line) return "";
      if (/^<\//.test(line)) { indent--; return pad() + line; }
      const tagMatch = line.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
      const isVoid = tagMatch && voidTags.has(tagMatch[1].toLowerCase());
      const isSelfClose = line.endsWith("/>");
      const result = pad() + line;
      if (tagMatch && !isVoid && !isSelfClose && !/^<\//.test(line)) indent++;
      return result;
    })
    .filter(Boolean)
    .join("\n");
}

function prettifyCSS(css) {
  return css
    .replace(/\{/g, " {\n  ")
    .replace(/;(?!\s*})/g, ";\n  ")
    .replace(/\}/g, "\n}\n")
    .replace(/,\s*/g, ",\n")
    .replace(/  \n}/g, "\n}")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function prettifyJS(js) {
  let indent = 0;
  const lines = [];
  let current = "";
  let inStr = false, strChar = "", inTemplate = false;

  for (let i = 0; i < js.length; i++) {
    const ch = js[i];
    if (inStr) {
      current += ch;
      if (ch === "\\" ) { current += js[++i] || ""; continue; }
      if (ch === strChar) inStr = false;
      continue;
    }
    if (inTemplate) {
      current += ch;
      if (ch === "`") inTemplate = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strChar = ch; current += ch; continue; }
    if (ch === "`") { inTemplate = true; current += ch; continue; }

    if (ch === "{") {
      current += " {";
      lines.push("  ".repeat(indent) + current.trim());
      indent++;
      current = "";
    } else if (ch === "}") {
      if (current.trim()) lines.push("  ".repeat(indent) + current.trim());
      indent = Math.max(0, indent - 1);
      current = "";
      lines.push("  ".repeat(indent) + "}");
    } else if (ch === ";") {
      current += ";";
      lines.push("  ".repeat(indent) + current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.filter(Boolean).join("\n");
}

const LANG_CONFIG = {
  html: {
    label: "HTML", ext: "html", color: "orange",
    placeholder: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Page</title>
    <!-- Page styles -->
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>  This is some sample HTML.  </p>
  </body>
</html>`,
    minify: minifyHTML, prettify: prettifyHTML,
  },
  css: {
    label: "CSS", ext: "css", color: "blue",
    placeholder: `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px 20px;
  margin: 0px auto;
  max-width: 1200px;
}

/* Header styles */
.header {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  padding: 16px 24px;
}`,
    minify: minifyCSS, prettify: prettifyCSS,
  },
  js: {
    label: "JS", ext: "js", color: "amber",
    placeholder: `// Utility functions
function greet(name) {
  const message = "Hello, " + name + "!";
  console.log(message);
  return message;
}

const add = (a, b) => {
  return a + b;
};

// Main logic
const result = add(10, 20);
greet("World");`,
    minify: minifyJS, prettify: prettifyJS,
  },
};

export default function CodeMinifier() {
  const [lang,    setLang]    = useState("html");
  const [input,   setInput]   = useState("");
  const [output,  setOutput]  = useState("");
  const [action,  setAction]  = useState(null);
  const [copied,  setCopied]  = useState(false);
  const [error,   setError]   = useState(null);

  const cfg = LANG_CONFIG[lang];

  function run(raw, act, currentLang = lang) {
    const text = raw.trim();
    if (!text) { setOutput(""); setError(null); return; }
    try {
      const fn = LANG_CONFIG[currentLang][act];
      const result = fn(text);
      setOutput(result);
      setAction(act);
      setError(null);
    } catch (err) {
      setError("Processing failed. Please check your code.");
      setOutput("");
    }
  }

  const handleMinify   = () => run(input, "minify");
  const handlePrettify = () => run(input, "prettify");

  const handleInput = (val) => {
    setInput(val);
    if (action) run(val, action);
    else { setOutput(""); setError(null); }
  };

  const handleLangSwitch = (l) => {
    setLang(l);
    setInput("");
    setOutput("");
    setAction(null);
    setError(null);
    setCopied(false);
  };

  const handleSample = () => {
    const s = cfg.placeholder;
    setInput(s);
    setAction("minify");
    run(s, "minify");
  };

  const handleClear = () => {
    setInput(""); setOutput(""); setAction(null); setError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `minified.${cfg.ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const inSize  = new Blob([input]).size;
  const outSize = new Blob([output]).size;
  const saved   = inSize - outSize;
  const pct     = inSize > 0 ? Math.round((saved / inSize) * 100) : 0;
  const inLines  = input  ? input.split("\n").length  : 0;
  const outLines = output ? output.split("\n").length : 0;

  const hasOutput = !!output && !error;

  return (
    <>
      <Helmet>
        <title>HTML CSS JS Minifier & Prettifier – Free Online Tool | ShauryaTools</title>
        <meta
          name="description"
          content="Minify or prettify HTML, CSS, and JavaScript code instantly in your browser. Reduce file size, improve load time, and format messy code — no build tools needed. 100% free."
        />
        <meta
          name="keywords"
          content="code minifier, HTML minifier, CSS minifier, JavaScript minifier, JS minifier, code prettifier, minify code online, code formatter"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="HTML CSS JS Minifier & Prettifier – Free Online Tool" />
        <meta property="og:description" content="Minify or beautify HTML, CSS, and JS code instantly. Free browser-based tool." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Code Minifier & Prettifier Online" />
        <meta name="twitter:description" content="Free tool to minify or prettify HTML, CSS and JavaScript code instantly." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Code Minifier & Prettifier",
            "url": PAGE_URL,
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "All",
            "description": "Free online HTML, CSS and JavaScript minifier and prettifier. Reduce file size instantly without any build tools.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="cm-page">
        <div className="cm-inner">

          <div className="cm-header">
            <div className="cm-icon"><IconZap /></div>
            <div>
              <span className="cm-cat">Dev Tools</span>
              <h1>Code Minifier <span className="cm-amp">&amp; Prettifier</span></h1>
              <p>Minify or prettify HTML, CSS, and JavaScript — reduce file size instantly, no build tools needed.</p>
            </div>
          </div>

          <div className="cm-lang-bar">
            {Object.entries(LANG_CONFIG).map(([key, c]) => (
              <button
                key={key}
                className={`cm-lang-tab ${lang === key ? `cm-lang-on cm-lang-on-${c.color}` : ""}`}
                onClick={() => handleLangSwitch(key)}
              >
                <span className={`cm-lang-dot cm-dot-${c.color}`} />
                {c.label}
              </button>
            ))}
          </div>

          <div className="cm-grid">

            <div className="cm-panel">
              <div className="cm-panel-head">
                <div className="cm-panel-title-row">
                  <span className={`cm-lang-badge cm-badge-${cfg.color}`}>{cfg.label}</span>
                  <span className="cm-panel-label">Input</span>
                </div>
                <div className="cm-panel-actions">
                  <button className="cm-action-btn" onClick={handleSample}>Sample</button>
                  {input && (
                    <button className="cm-action-btn cm-danger-btn" onClick={handleClear}>
                      <IconTrash />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                className="cm-textarea"
                value={input}
                onChange={e => handleInput(e.target.value)}
                placeholder={`Paste ${cfg.label} here…\n\nClick "Sample" to try it out →`}
                spellCheck={false}
              />

              <div className="cm-actions-row">
                <button
                  className={`cm-run-btn cm-minify-btn ${action === "minify" && hasOutput ? "cm-run-active" : ""}`}
                  onClick={handleMinify}
                  disabled={!input.trim()}
                >
                  <IconZap />
                  Minify {cfg.label}
                </button>
                <button
                  className={`cm-run-btn cm-pretty-btn ${action === "prettify" && hasOutput ? "cm-run-active" : ""}`}
                  onClick={handlePrettify}
                  disabled={!input.trim()}
                >
                  <IconWand />
                  Prettify {cfg.label}
                </button>
              </div>

              {input && (
                <div className="cm-input-stats">
                  <span><strong>{inLines}</strong> lines</span>
                  <span className="cm-sep">·</span>
                  <span><strong>{inSize}</strong> bytes</span>
                </div>
              )}
            </div>

            <div className="cm-panel">
              <div className="cm-panel-head">
                <div className="cm-panel-title-row">
                  <span className={`cm-lang-badge cm-badge-${cfg.color}`}>
                    {action === "prettify" ? "Prettified" : action === "minify" ? "Minified" : cfg.label}
                  </span>
                  <span className="cm-panel-label">Output</span>
                </div>
                <div className="cm-panel-actions">
                  {hasOutput && (
                    <>
                      <button className="cm-action-btn" onClick={handleDownload} title={`Download .${cfg.ext}`}>
                        <IconDownload />
                      </button>
                      <button className={`cm-copy-btn ${copied ? "cm-copied" : ""}`} onClick={handleCopy}>
                        {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="cm-output-wrap">
                {!hasOutput && !error && (
                  <div className="cm-empty">
                    <div className="cm-empty-icon"><IconZap /></div>
                    <p>Click <strong>Minify</strong> or <strong>Prettify</strong> to process your code</p>
                  </div>
                )}

                {error && (
                  <div className="cm-error-panel">
                    <p className="cm-error-title">Error</p>
                    <p className="cm-error-detail">{error}</p>
                  </div>
                )}

                {hasOutput && (
                  <pre className={`cm-code cm-code-${cfg.color}`}>{output}</pre>
                )}
              </div>

              {hasOutput && action === "minify" && pct > 0 && (
                <div className="cm-savings-banner">
                  <div className="cm-savings-left">
                    <span className="cm-savings-pct">−{pct}%</span>
                    <span className="cm-savings-label">size reduction</span>
                  </div>
                  <div className="cm-savings-bars">
                    <div className="cm-bar-row">
                      <span className="cm-bar-label">Before</span>
                      <div className="cm-bar-track">
                        <div className="cm-bar-fill cm-bar-before" style={{ width: "100%" }} />
                      </div>
                      <span className="cm-bar-val">{inSize} B</span>
                    </div>
                    <div className="cm-bar-row">
                      <span className="cm-bar-label">After</span>
                      <div className="cm-bar-track">
                        <div className="cm-bar-fill cm-bar-after" style={{ width: `${Math.max(4, 100 - pct)}%` }} />
                      </div>
                      <span className="cm-bar-val cm-val-green">{outSize} B</span>
                    </div>
                  </div>
                  <div className="cm-savings-saved">
                    saved <strong>{saved} bytes</strong>
                  </div>
                </div>
              )}

              {hasOutput && (
                <div className="cm-output-stats">
                  <span><strong>{outLines}</strong> lines</span>
                  <span className="cm-sep">·</span>
                  <span><strong>{outSize}</strong> bytes</span>
                  {action === "minify" && pct > 0 && (
                    <>
                      <span className="cm-sep">·</span>
                      <span className="cm-stat-green"><strong>{pct}%</strong> smaller</span>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>

          <div className="cm-info-strip">
            <div className="cm-info-item">
              <span className="cm-info-label">HTML Minifier</span>
              <span className="cm-info-val">Removes comments, collapses whitespace between tags, strips redundant spaces around attributes.</span>
            </div>
            <div className="cm-info-div" />
            <div className="cm-info-item">
              <span className="cm-info-label">CSS Minifier</span>
              <span className="cm-info-val">Removes comments, whitespace, trailing semicolons, leading zeros, and zero-value units.</span>
            </div>
            <div className="cm-info-div" />
            <div className="cm-info-item">
              <span className="cm-info-label">JS Minifier</span>
              <span className="cm-info-val">Strips comments and whitespace while preserving string literals, template literals, and keyword spacing.</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
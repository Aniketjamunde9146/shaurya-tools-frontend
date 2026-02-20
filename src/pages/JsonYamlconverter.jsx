import { useState, useRef } from "react";
import "./JsonYamlconverter.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconArrows = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
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
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconSwap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
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

/* ══════════════════════════════════════════
   YAML parser  (subset — no deps)
   Handles: mappings, sequences, scalars,
   multiline blocks, comments, anchors (basic)
   ══════════════════════════════════════════ */
function parseYaml(text) {
  // Strip comments
  const lines = text.split("\n").map(l => {
    // Remove inline comments but preserve # inside strings
    return l.replace(/(?<!['"a-zA-Z0-9])\s*#.*$/, "");
  });

  function parseValue(val) {
    const v = val.trim();
    if (v === "null" || v === "~" || v === "")  return null;
    if (v === "true")  return true;
    if (v === "false") return false;
    if (/^-?\d+$/.test(v))   return parseInt(v, 10);
    if (/^-?\d*\.\d+$/.test(v)) return parseFloat(v);
    // Quoted strings
    if ((v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    return v;
  }

  function getIndent(line) {
    return line.match(/^(\s*)/)[1].length;
  }

  function parseBlock(linesArr, start, baseIndent) {
    const result = {};
    const resultArr = [];
    let isArray = null;
    let i = start;

    while (i < linesArr.length) {
      const line = linesArr[i];
      if (!line.trim()) { i++; continue; }
      const indent = getIndent(line);
      if (indent < baseIndent) break;

      const trimmed = line.trim();

      // Sequence item
      if (trimmed.startsWith("- ") || trimmed === "-") {
        isArray = true;
        const rest = trimmed.slice(2).trim();
        if (rest) {
          // Inline value
          if (rest.includes(": ")) {
            // Inline mapping inside sequence
            const obj = {};
            const pairs = rest.split(", ");
            pairs.forEach(p => {
              const [k, ...vParts] = p.split(": ");
              if (k) obj[k.trim()] = parseValue(vParts.join(": "));
            });
            resultArr.push(obj);
          } else {
            resultArr.push(parseValue(rest));
          }
          i++;
        } else {
          // Next lines are the block
          const [child, next] = parseBlock(linesArr, i + 1, indent + 2);
          resultArr.push(child);
          i = next;
        }
        continue;
      }

      // Mapping key
      const colonIdx = trimmed.indexOf(": ");
      const isKeyOnly = trimmed.endsWith(":");
      if (colonIdx !== -1 || isKeyOnly) {
        isArray = false;
        const key = isKeyOnly ? trimmed.slice(0, -1) : trimmed.slice(0, colonIdx);
        const val = isKeyOnly ? "" : trimmed.slice(colonIdx + 2).trim();

        if (!val || val === "") {
          // Nested block
          const nextLineIdx = i + 1;
          if (nextLineIdx < linesArr.length) {
            const nextLine = linesArr[nextLineIdx];
            const nextIndent = getIndent(nextLine);
            if (nextIndent > indent) {
              const [child, next] = parseBlock(linesArr, nextLineIdx, nextIndent);
              result[key.trim()] = child;
              i = next;
              continue;
            }
          }
          result[key.trim()] = null;
        } else if (val === "|" || val === ">") {
          // Block scalar
          const blockLines = [];
          let j = i + 1;
          while (j < linesArr.length && (getIndent(linesArr[j]) > indent || !linesArr[j].trim())) {
            blockLines.push(linesArr[j].trim());
            j++;
          }
          result[key.trim()] = blockLines.join(val === "|" ? "\n" : " ").trim();
          i = j;
          continue;
        } else {
          result[key.trim()] = parseValue(val);
        }
        i++;
        continue;
      }

      break;
    }

    return [isArray ? resultArr : result, i];
  }

  const nonEmpty = lines.map((l, i) => ({ l, i })).filter(x => x.l.trim() && !x.l.trim().startsWith("#"));
  if (!nonEmpty.length) return {};

  const firstIndent = getIndent(nonEmpty[0].l);
  const [parsed] = parseBlock(lines, 0, firstIndent);
  return parsed;
}

/* ══════════════════════════════════
   YAML serialiser  (from JS object)
   ══════════════════════════════════ */
function toYaml(obj, indent = 0) {
  const pad = " ".repeat(indent);

  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "boolean") return String(obj);
  if (typeof obj === "number")  return String(obj);

  if (typeof obj === "string") {
    // Quote if needed
    if (obj === "" || obj === "null" || obj === "true" || obj === "false" ||
        /^[\d\-]/.test(obj) || /[:#\[\]{},&*?|<>=!%@`]/.test(obj) || obj.includes("\n")) {
      return `"${obj.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (!obj.length) return "[]";
    return obj.map(item => {
      const val = toYaml(item, indent + 2);
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const lines = val.split("\n");
        return `${pad}- ${lines[0]}\n${lines.slice(1).map(l => `${pad}  ${l}`).join("\n")}`;
      }
      return `${pad}- ${val}`;
    }).join("\n");
  }

  if (typeof obj === "object") {
    const keys = Object.keys(obj);
    if (!keys.length) return "{}";
    return keys.map(k => {
      const val = obj[k];
      if (val !== null && typeof val === "object") {
        const nested = toYaml(val, indent + 2);
        if ((Array.isArray(val) && val.length === 0) || (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0)) {
          return `${pad}${k}: ${nested}`;
        }
        return `${pad}${k}:\n${nested}`;
      }
      return `${pad}${k}: ${toYaml(val, indent + 2)}`;
    }).join("\n");
  }

  return String(obj);
}

/* ══════════════════════════
   Syntax highlighters
   ══════════════════════════ */
function highlightJson(json) {
  return json
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "jyc-num";
        if (/^"/.test(match)) cls = /:$/.test(match) ? "jyc-key" : "jyc-str";
        else if (/true|false/.test(match)) cls = "jyc-bool";
        else if (/null/.test(match))       cls = "jyc-null";
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

function highlightYaml(yaml) {
  return yaml
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .split("\n").map(line => {
      // Comment
      if (/^\s*#/.test(line)) return `<span class="jyc-comment">${line}</span>`;
      // Key: value
      return line.replace(/^(\s*)([\w\-]+)(\s*:\s*)(.*)$/, (_, sp, key, colon, val) => {
        let valHtml = val;
        if (val === "true" || val === "false") valHtml = `<span class="jyc-bool">${val}</span>`;
        else if (val === "null" || val === "~" || val === "") valHtml = `<span class="jyc-null">${val || "null"}</span>`;
        else if (/^-?\d+(\.\d+)?$/.test(val.trim())) valHtml = `<span class="jyc-num">${val}</span>`;
        else if (val.startsWith('"') || val.startsWith("'")) valHtml = `<span class="jyc-str">${val}</span>`;
        else if (val && !val.startsWith("-")) valHtml = `<span class="jyc-str">${val}</span>`;
        return `${sp}<span class="jyc-key">${key}</span>${colon}${valHtml}`;
      })
      // Sequence dash
      .replace(/^(\s*)(- )(.*)$/, (_, sp, dash, rest) => {
        return `${sp}<span class="jyc-dash">${dash}</span>${rest}`;
      });
    }).join("\n");
}

/* ══════════════
   Sample data
   ══════════════ */
const SAMPLE_JSON = `{
  "name": "ShauryaTools",
  "version": "1.0.0",
  "active": true,
  "rating": 4.9,
  "author": {
    "name": "Shaurya",
    "website": "https://shaurya.tools"
  },
  "features": ["JSON Formatter", "YAML Converter", "README Generator"],
  "meta": null
}`;

const SAMPLE_YAML = `name: ShauryaTools
version: 1.0.0
active: true
rating: 4.9
author:
  name: Shaurya
  website: https://shaurya.tools
features:
  - JSON Formatter
  - YAML Converter
  - README Generator
meta: null`;

/* ══════════════════
   Main Component
   ══════════════════ */
export default function JsonYamlConverter() {
  // mode: "json-to-yaml" | "yaml-to-json"
  const [mode,     setMode]     = useState("json-to-yaml");
  const [input,    setInput]    = useState("");
  const [output,   setOutput]   = useState("");
  const [error,    setError]    = useState(null);
  const [copied,   setCopied]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [indent,   setIndent]   = useState(2);
  const fileRef = useRef();

  const isJsonToYaml = mode === "json-to-yaml";
  const inputLang    = isJsonToYaml ? "JSON" : "YAML";
  const outputLang   = isJsonToYaml ? "YAML" : "JSON";

  function convert(raw, currentMode = mode, ind = indent) {
    const text = raw.trim();
    if (!text) { setOutput(""); setError(null); return; }
    try {
      if (currentMode === "json-to-yaml") {
        const obj = JSON.parse(text);
        setOutput(toYaml(obj, 0));
      } else {
        const obj = parseYaml(text);
        setOutput(JSON.stringify(obj, null, ind));
      }
      setError(null);
    } catch (e) {
      setError(e.message);
      setOutput("");
    }
  }

  const handleInput = (val) => { setInput(val); convert(val); };

  const handleSwap = () => {
    const newMode = isJsonToYaml ? "yaml-to-json" : "json-to-yaml";
    setMode(newMode);
    // Swap input/output
    const newInput = output;
    setInput(newInput);
    setOutput("");
    setError(null);
    if (newInput.trim()) convert(newInput, newMode);
  };

  const handleIndentChange = (ind) => {
    setIndent(ind);
    if (output && !isJsonToYaml) {
      try {
        const obj = parseYaml(input);
        setOutput(JSON.stringify(obj, null, ind));
      } catch {}
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClear = () => { setInput(""); setOutput(""); setError(null); };

  const handleSample = () => {
    const s = isJsonToYaml ? SAMPLE_JSON : SAMPLE_YAML;
    setInput(s);
    convert(s);
  };

  const handleDownload = () => {
    const ext  = isJsonToYaml ? "yaml" : "json";
    const mime = isJsonToYaml ? "text/yaml" : "application/json";
    const blob = new Blob([output], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { const t = e.target.result; setInput(t); convert(t); };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const status = error ? "error" : output ? "valid" : "idle";

  const charCount = output.length;
  const lineCount = output ? output.split("\n").length : 0;

  return (
    <>
    <Helmet>
      <title>Free JSON to YAML Converter Online – ShauryaTools</title>
      <meta name="description" content="Convert between JSON and YAML instantly. Paste, upload or drag & drop files. Supports syntax highlighting, download, and swap direction. Free & no login." />
      <meta name="keywords" content="json to yaml converter, yaml to json, json yaml converter online, convert json yaml, free yaml tool" />
      <link rel="canonical" href="https://shauryatools.vercel.app/json-yaml-converter" />
    </Helmet>
    <div className="jyc-page">
      <div className="jyc-inner">

        {/* ── Header ── */}
        <div className="jyc-header">
          <div className="jyc-icon"><IconArrows /></div>
          <div>
            <span className="jyc-cat">Utility</span>
            <h1>JSON <span className="jyc-slash">↔</span> YAML Converter</h1>
            <p>Instantly convert between JSON and YAML formats — paste, upload, or drag & drop.</p>
          </div>
        </div>

        {/* ── Mode switcher ── */}
        <div className="jyc-mode-bar">
          <div className="jyc-mode-tabs">
            <button
              className={`jyc-mode-tab ${isJsonToYaml ? "jyc-mode-on" : ""}`}
              onClick={() => { if (!isJsonToYaml) handleSwap(); }}
            >
              <span className="jyc-lang jyc-json">JSON</span>
              <IconArrows />
              <span className="jyc-lang jyc-yaml">YAML</span>
            </button>
            <button
              className={`jyc-mode-tab ${!isJsonToYaml ? "jyc-mode-on" : ""}`}
              onClick={() => { if (isJsonToYaml) handleSwap(); }}
            >
              <span className="jyc-lang jyc-yaml">YAML</span>
              <IconArrows />
              <span className="jyc-lang jyc-json">JSON</span>
            </button>
          </div>

          <button className="jyc-swap-btn" onClick={handleSwap} title="Swap direction & content">
            <IconSwap /> Swap
          </button>
        </div>

        {/* ── Editor grid ── */}
        <div className="jyc-grid">

          {/* Input */}
          <div className="jyc-panel">
            <div className="jyc-panel-head">
              <div className="jyc-panel-title-row">
                <span className={`jyc-lang-badge jyc-badge-${inputLang.toLowerCase()}`}>{inputLang}</span>
                <span className="jyc-panel-label">Input</span>
              </div>
              <div className="jyc-panel-actions">
                <button className="jyc-action-btn" onClick={handleSample}>Sample</button>
                <button className="jyc-action-btn" onClick={() => fileRef.current.click()}>
                  <IconUpload /> Upload
                </button>
                <input
                  ref={fileRef} type="file"
                  accept=".json,.yaml,.yml,application/json,text/yaml"
                  style={{ display: "none" }}
                  onChange={e => handleFile(e.target.files[0])}
                />
                {input && (
                  <button className="jyc-action-btn jyc-danger-btn" onClick={handleClear}>
                    <IconTrash />
                  </button>
                )}
              </div>
            </div>

            <div
              className={`jyc-textarea-wrap ${dragOver ? "jyc-drag-over" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <textarea
                className="jyc-textarea"
                value={input}
                onChange={e => handleInput(e.target.value)}
                placeholder={`Paste ${inputLang} here…\n\nOr drag & drop a file`}
                spellCheck={false}
              />
              {!input && (
                <div className="jyc-drop-hint">
                  <IconUpload />
                  <span>Drag & drop a .{inputLang.toLowerCase()} file</span>
                </div>
              )}
            </div>

            {/* Input status */}
            <div className={`jyc-status-bar jyc-status-${status}`}>
              {status === "valid" && <><IconOk /><span>Valid {inputLang} — converted successfully</span></>}
              {status === "error" && <><IconWarning /><span>{error}</span></>}
              {status === "idle"  && <span className="jyc-idle">Awaiting input…</span>}
            </div>
          </div>

          {/* Output */}
          <div className="jyc-panel">
            <div className="jyc-panel-head">
              <div className="jyc-panel-title-row">
                <span className={`jyc-lang-badge jyc-badge-${outputLang.toLowerCase()}`}>{outputLang}</span>
                <span className="jyc-panel-label">Output</span>
              </div>
              <div className="jyc-panel-actions">
                {/* Indent control only for JSON output */}
                {!isJsonToYaml && output && (
                  <div className="jyc-indent-group">
                    <span className="jyc-indent-label">Indent</span>
                    {[2, 4].map(n => (
                      <button
                        key={n}
                        className={`jyc-indent-btn ${indent === n ? "jyc-indent-on" : ""}`}
                        onClick={() => handleIndentChange(n)}
                      >{n}</button>
                    ))}
                  </div>
                )}
                {output && (
                  <>
                    <button className="jyc-action-btn" onClick={handleDownload} title={`Download .${outputLang.toLowerCase()}`}>
                      <IconDownload />
                    </button>
                    <button className={`jyc-copy-btn ${copied ? "jyc-copied" : ""}`} onClick={handleCopy}>
                      {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="jyc-output-wrap">
              {!output && !error && (
                <div className="jyc-empty">
                  <div className="jyc-empty-icon"><IconArrows /></div>
                  <p>Your {outputLang} output will appear here</p>
                </div>
              )}

              {error && (
                <div className="jyc-error-panel">
                  <div className="jyc-error-icon"><IconWarning /></div>
                  <p className="jyc-error-title">Conversion Failed</p>
                  <p className="jyc-error-detail">{error}</p>
                  <p className="jyc-error-tip">Fix the {inputLang} input and the output will update automatically.</p>
                </div>
              )}

              {output && (
                <pre
                  className="jyc-code"
                  dangerouslySetInnerHTML={{
                    __html: isJsonToYaml ? highlightYaml(output) : highlightJson(output)
                  }}
                />
              )}
            </div>

            {/* Stats */}
            {output && (
              <div className="jyc-stats-bar">
                <span className="jyc-stat"><strong>{lineCount}</strong> lines</span>
                <span className="jyc-stat-sep">·</span>
                <span className="jyc-stat"><strong>{charCount}</strong> chars</span>
                <span className="jyc-stat-sep">·</span>
                <span className="jyc-stat"><strong>{(charCount / 1024).toFixed(1)}</strong> KB</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
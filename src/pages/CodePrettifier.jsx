/* eslint-disable no-unused-vars */
import { useState, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Code2, Copy, Check, RefreshCw, AlertTriangle, CheckCircle, ChevronDown, Wand2, FileCode } from "lucide-react";
import "./CodePrettifier.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/code-prettifier`;

/* ─────────────────────────────────────────
   Language detection
───────────────────────────────────────── */
function detectLanguage(code) {
  if (!code.trim()) return "javascript";
  if (/^\s*<\?php/i.test(code)) return "php";
  if (/^\s*<!DOCTYPE html/i.test(code) || /^\s*<html/i.test(code)) return "html";
  if (/<[a-z][\s\S]*>/i.test(code) && /className=/.test(code)) return "jsx";
  if (/<[a-z][\s\S]*>/i.test(code) && !/{/.test(code)) return "html";
  if (/^\s*import\s+React/m.test(code) || /jsx|tsx/.test(code)) return "jsx";
  if (/:\s*(string|number|boolean|void|any|never)\b/.test(code) || /interface\s+\w+/.test(code)) return "typescript";
  if (/{[\s\S]*?:\s*[\w#"'(]/.test(code) && !/(function|const|let|var|=>)/.test(code)) return "css";
  if (/def\s+\w+\s*\(/.test(code) || /import\s+\w+\n/.test(code) || /^\s*#.*\n/.test(code)) return "python";
  if (/public\s+(static\s+)?void\s+main/.test(code) || /System\.out\.println/.test(code)) return "java";
  if (/func\s+\w+\s*\(/.test(code) && /:\s*\w+\s*{/.test(code)) return "go";
  if (/fn\s+\w+/.test(code) && /let\s+mut/.test(code)) return "rust";
  if (/(const|let|var)\s+\w+\s*=/.test(code) || /=>\s*{/.test(code) || /function\s*\w*\s*\(/.test(code)) return "javascript";
  return "javascript";
}

/* ─────────────────────────────────────────
   Validators — return array of { line, col, message, severity }
───────────────────────────────────────── */
function validateCode(code, lang) {
  const issues = [];
  const lines = code.split("\n");

  if (["javascript", "typescript", "jsx"].includes(lang)) {
    const stack = [];
    const pairs = { ")": "(", "]": "[", "}": "{" };
    let inStr = null, inTemplate = 0;

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      for (let ci = 0; ci < line.length; ci++) {
        const c = line[ci];
        if (inStr) {
          if (c === "\\" ) { ci++; continue; }
          if (c === inStr) inStr = null;
          continue;
        }
        if (c === "`") { inTemplate += inTemplate ? -1 : 1; continue; }
        if (inTemplate) continue;
        if (c === '"' || c === "'") { inStr = c; continue; }
        if ("({[".includes(c)) { stack.push({ c, line: li + 1, col: ci + 1 }); continue; }
        if (")}]".includes(c)) {
          if (!stack.length) {
            issues.push({ line: li + 1, col: ci + 1, message: `Unexpected closing '${c}'`, severity: "error" });
          } else if (stack[stack.length - 1].c !== pairs[c]) {
            const expected = stack.pop();
            issues.push({ line: li + 1, col: ci + 1, message: `Mismatched bracket: expected closing for '${expected.c}' opened at line ${expected.line}`, severity: "error" });
          } else {
            stack.pop();
          }
        }
      }
    }
    stack.forEach(({ c, line, col }) =>
      issues.push({ line, col, message: `Unclosed '${c}'`, severity: "error" })
    );

    lines.forEach((line, i) => {
      const t = line.trim();
      if (
        t.length > 0 &&
        !t.endsWith(";") && !t.endsWith("{") && !t.endsWith("}") &&
        !t.endsWith(",") && !t.endsWith("(") && !t.endsWith(")") &&
        !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*") &&
        !t.startsWith("import ") && !t.startsWith("export default") &&
        !t.startsWith("if ") && !t.startsWith("else") && !t.startsWith("for ") &&
        !t.startsWith("while ") && !t.startsWith("function ") && !t.startsWith("class ") &&
        !t.startsWith("=>") && !t.endsWith("=>") && !t.endsWith("\\") &&
        /^(const|let|var|return|throw|console)\s/.test(t)
      ) {
        issues.push({ line: i + 1, col: line.length, message: "Possible missing semicolon", severity: "warning" });
      }
    });

    lines.forEach((line, i) => {
      if (/console\.(log|warn|error|debug)\s*\(/.test(line)) {
        issues.push({ line: i + 1, col: line.indexOf("console") + 1, message: "console statement left in code", severity: "info" });
      }
    });

    lines.forEach((line, i) => {
      if (/\bvar\s+/.test(line) && !line.trim().startsWith("//")) {
        issues.push({ line: i + 1, col: line.indexOf("var") + 1, message: "Prefer 'const' or 'let' over 'var'", severity: "warning" });
      }
    });
  }

  if (lang === "css") {
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t.length && t.includes(":") && !t.endsWith(";") && !t.endsWith("{") && !t.endsWith("}") && !t.startsWith("//") && !t.startsWith("/*")) {
        issues.push({ line: i + 1, col: line.length, message: "Missing semicolon in CSS declaration", severity: "error" });
      }
    });

    let depth = 0;
    lines.forEach((line) => {
      for (const c of line) {
        if (c === "{") depth++;
        else if (c === "}") depth--;
      }
    });
    if (depth !== 0) {
      issues.push({ line: lines.length, col: 1, message: `Unclosed CSS rule: ${Math.abs(depth)} brace(s) ${depth > 0 ? "not closed" : "extra closing"}`, severity: "error" });
    }
  }

  if (lang === "html") {
    const tagStack = [];
    const selfClosing = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
    const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let m;
    const flat = code.replace(/\n/g, " ");
    while ((m = tagRe.exec(flat)) !== null) {
      const full = m[0], tag = m[1].toLowerCase();
      if (selfClosing.has(tag) || full.endsWith("/>")) continue;
      if (full.startsWith("</")) {
        if (!tagStack.length || tagStack[tagStack.length - 1] !== tag) {
          issues.push({ line: 1, col: m.index, message: `Unexpected closing tag </${tag}>`, severity: "error" });
        } else tagStack.pop();
      } else {
        tagStack.push(tag);
      }
    }
    tagStack.forEach(tag =>
      issues.push({ line: 1, col: 1, message: `Unclosed HTML tag <${tag}>`, severity: "error" })
    );
  }

  return issues;
}

/* ─────────────────────────────────────────
   Prettifiers
───────────────────────────────────────── */
function prettifyJS(code, indent = 2) {
  const pad = " ".repeat(indent);
  const lines = code.split("\n");
  const result = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) { if (result.length && result[result.length - 1] !== "") result.push(""); continue; }

    let closes = 0;
    for (const c of line) {
      if ("}])".includes(c)) closes++;
      else break;
    }
    depth = Math.max(0, depth - closes);
    result.push(pad.repeat(depth) + line);

    let opens = 0, cls = 0;
    let inStr = null, tmpl = 0;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (inStr) { if (c === "\\" ) { j++; continue; } if (c === inStr) inStr = null; continue; }
      if (c === "`") { tmpl += tmpl ? -1 : 1; continue; }
      if (tmpl) continue;
      if (c === '"' || c === "'") { inStr = c; continue; }
      if ("({[".includes(c)) opens++;
      else if (")}]".includes(c)) cls++;
    }
    const net = opens - cls;
    if (net > 0) depth += net;
    else if (net < 0 && closes === 0) depth = Math.max(0, depth + net);
  }

  const out = [];
  let blank = 0;
  for (const l of result) {
    if (!l.trim()) { blank++; if (blank <= 1) out.push(""); }
    else { blank = 0; out.push(l); }
  }
  return out.join("\n").trim();
}

function prettifyCSS(code, indent = 2) {
  const pad = " ".repeat(indent);
  const tokens = [];
  let cur = "", inParen = 0;

  for (const ch of code) {
    if (ch === "(") { inParen++; cur += ch; }
    else if (ch === ")") { inParen--; cur += ch; }
    else if (ch === "{" && inParen === 0) { tokens.push({ t: "sel", v: cur.trim() }); tokens.push({ t: "open" }); cur = ""; }
    else if (ch === "}" && inParen === 0) { if (cur.trim()) tokens.push({ t: "decl", v: cur.trim() }); tokens.push({ t: "close" }); cur = ""; }
    else if (ch === ";" && inParen === 0) { if (cur.trim()) tokens.push({ t: "decl", v: cur.trim() }); cur = ""; }
    else cur += ch;
  }
  if (cur.trim()) tokens.push({ t: "other", v: cur.trim() });

  const out = [];
  let depth = 0;
  for (const tok of tokens) {
    if (tok.t === "sel") {
      if (out.length && out[out.length - 1] !== "") out.push("");
      out.push(pad.repeat(depth) + tok.v);
    } else if (tok.t === "open") {
      if (out.length) out[out.length - 1] += " {";
      depth++;
    } else if (tok.t === "decl") {
      out.push(pad.repeat(depth) + tok.v + ";");
    } else if (tok.t === "close") {
      depth = Math.max(0, depth - 1);
      out.push(pad.repeat(depth) + "}");
    } else if (tok.t === "other") {
      out.push(tok.v);
    }
  }

  const final = [];
  let blank = 0;
  for (const l of out) {
    if (!l.trim()) { blank++; if (blank <= 1) final.push(""); }
    else { blank = 0; final.push(l); }
  }
  return final.join("\n").trim();
}

function prettifyHTML(code, indent = 2) {
  const pad = " ".repeat(indent);
  const selfClosing = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
  const lines = code.replace(/>\s*</g, ">\n<").split("\n");
  const out = [];
  let depth = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const closingTag = line.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)/);
    const openingTag = line.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
    const isSelfClose = line.endsWith("/>") || (openingTag && selfClosing.has(openingTag[1].toLowerCase()));
    const isClosing = !!closingTag;
    const isOpening = openingTag && !isClosing && !isSelfClose;

    if (isClosing) depth = Math.max(0, depth - 1);
    out.push(pad.repeat(depth) + line);
    if (isOpening) depth++;
  }
  return out.join("\n").trim();
}

function prettifyPython(code, indent = 4) {
  const lines = code.split("\n");
  return lines.map(line => {
    const leading = line.match(/^(\s*)/)[1];
    const spaces = leading.replace(/\t/g, "    ");
    const countOld = spaces.length;
    const levels = Math.round(countOld / 4);
    return " ".repeat(indent * levels) + line.trimStart();
  }).join("\n").trim();
}

function prettifyCode(code, lang, indentSize) {
  if (!code.trim()) return code;
  try {
    if (["javascript", "typescript", "jsx"].includes(lang)) return prettifyJS(code, indentSize);
    if (lang === "css") return prettifyCSS(code, indentSize);
    if (lang === "html") return prettifyHTML(code, indentSize);
    if (lang === "python") return prettifyPython(code, indentSize);
    return prettifyJS(code, indentSize);
  } catch (e) {
    return code;
  }
}

/* ─────────────────────────────────────────
   Syntax highlighter (simple token-based)
───────────────────────────────────────── */
function highlight(code, lang) {
  if (!code) return "";

  const escape = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let result = "";
  let i = 0;
  const src = code;
  const len = src.length;

  const jsKeywords = new Set(["import","export","default","from","const","let","var","function","return","if","else","for","while","do","switch","case","break","continue","new","class","extends","super","this","typeof","instanceof","null","undefined","true","false","async","await","try","catch","finally","throw","of","in","delete","void","yield","static","get","set","interface","type","enum","namespace","as","implements"]);
  const pyKeywords = new Set(["import","from","def","return","if","elif","else","for","while","in","not","and","or","class","try","except","finally","raise","with","as","pass","break","continue","True","False","None","lambda","yield","global","nonlocal","del","assert","is"]);
  const cssProperties = new Set(["color","background","border","margin","padding","font","display","position","width","height","top","left","right","bottom","flex","grid","transform","transition","animation","opacity","overflow","cursor","content","box-shadow","text-align"]);

  const kw = lang === "python" ? pyKeywords : jsKeywords;

  while (i < len) {
    const ch = src[i];
    const rest = src.slice(i);

    if ((lang !== "css" && lang !== "html") && rest.startsWith("//")) {
      const end = src.indexOf("\n", i);
      const comment = end === -1 ? src.slice(i) : src.slice(i, end);
      result += `<span class="tok-comment">${escape(comment)}</span>`;
      i += comment.length;
      continue;
    }

    if (rest.startsWith("/*")) {
      const end = src.indexOf("*/", i + 2);
      const comment = end === -1 ? src.slice(i) : src.slice(i, end + 2);
      result += `<span class="tok-comment">${escape(comment)}</span>`;
      i += comment.length;
      continue;
    }

    if (rest.startsWith("<!--")) {
      const end = src.indexOf("-->", i + 4);
      const comment = end === -1 ? src.slice(i) : src.slice(i, end + 3);
      result += `<span class="tok-comment">${escape(comment)}</span>`;
      i += comment.length;
      continue;
    }

    if ((ch === '"' || ch === "'" || ch === "`") && lang !== "css") {
      let str = ch;
      let j = i + 1;
      while (j < len) {
        if (src[j] === "\\") { str += src[j] + (src[j + 1] || ""); j += 2; continue; }
        str += src[j];
        if (src[j] === ch) { j++; break; }
        j++;
      }
      result += `<span class="tok-string">${escape(str)}</span>`;
      i = j;
      continue;
    }

    if ((ch === '"' || ch === "'") && lang === "css") {
      let str = ch;
      let j = i + 1;
      while (j < len && src[j] !== ch) { str += src[j++]; }
      str += src[j] || "";
      result += `<span class="tok-string">${escape(str)}</span>`;
      i = j + 1;
      continue;
    }

    if (lang === "html" && ch === "<") {
      const end = src.indexOf(">", i);
      if (end !== -1) {
        const tag = src.slice(i, end + 1);
        result += `<span class="tok-tag">${escape(tag)}</span>`;
        i = end + 1;
        continue;
      }
    }

    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let num = "";
      let j = i;
      while (j < len && /[0-9.xXa-fA-F_]/.test(src[j])) num += src[j++];
      result += `<span class="tok-number">${escape(num)}</span>`;
      i = j;
      continue;
    }

    if (lang === "css" && ch === "#" && /[0-9a-fA-F]/.test(src[i + 1] || "")) {
      let hex = "#";
      let j = i + 1;
      while (j < len && /[0-9a-fA-F]/.test(src[j])) hex += src[j++];
      result += `<span class="tok-number">${escape(hex)}</span>`;
      i = j;
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let word = "";
      let j = i;
      while (j < len && /[a-zA-Z0-9_$]/.test(src[j])) word += src[j++];

      if (kw.has(word)) {
        result += `<span class="tok-keyword">${escape(word)}</span>`;
      } else if (lang === "css" && cssProperties.has(word)) {
        result += `<span class="tok-property">${escape(word)}</span>`;
      } else if (/^[A-Z]/.test(word)) {
        result += `<span class="tok-class">${escape(word)}</span>`;
      } else if (src[j] === "(") {
        result += `<span class="tok-fn">${escape(word)}</span>`;
      } else {
        result += escape(word);
      }
      i = j;
      continue;
    }

    if (lang === "css" && ch === ":") {
      result += `<span class="tok-punct">:</span>`;
      i++;
      continue;
    }

    if (/[+\-*/%=<>!&|^~?:;,.]/.test(ch)) {
      result += `<span class="tok-op">${escape(ch)}</span>`;
      i++;
      continue;
    }

    if ("{}()[]".includes(ch)) {
      result += `<span class="tok-bracket">${escape(ch)}</span>`;
      i++;
      continue;
    }

    result += escape(ch);
    i++;
  }

  return result;
}

/* ─────────────────────────────────────────
   Language options
───────────────────────────────────────── */
const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "jsx",        label: "JSX / TSX"  },
  { id: "css",        label: "CSS"        },
  { id: "html",       label: "HTML"       },
  { id: "python",     label: "Python"     },
  { id: "json",       label: "JSON"       },
  { id: "java",       label: "Java"       },
  { id: "go",         label: "Go"         },
  { id: "rust",       label: "Rust"       },
];

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
export default function CodePrettifier() {
  const [input,       setInput]       = useState("");
  const [lang,        setLang]        = useState("javascript");
  const [autoDetect,  setAutoDetect]  = useState(true);
  const [indentSize,  setIndentSize]  = useState(2);
  const [prettified,  setPrettified]  = useState("");
  const [hasRun,      setHasRun]      = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("output");
  const [showLangDD,  setShowLangDD]  = useState(false);

  const detectedLang = useMemo(() => autoDetect ? detectLanguage(input) : lang, [input, lang, autoDetect]);

  const issues = useMemo(() => {
    if (!hasRun && !prettified) return [];
    return validateCode(prettified || input, detectedLang);
  }, [prettified, input, detectedLang, hasRun]);

  const errorCount   = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const infoCount    = issues.filter(i => i.severity === "info").length;

  const highlighted = useMemo(() => {
    if (!prettified) return "";
    return highlight(prettified, detectedLang);
  }, [prettified, detectedLang]);

  const handlePrettify = useCallback(() => {
    const result = prettifyCode(input, detectedLang, indentSize);
    setPrettified(result);
    setHasRun(true);
    setActiveTab(validateCode(result, detectedLang).some(i => i.severity === "error") ? "issues" : "output");
  }, [input, detectedLang, indentSize]);

  const handleCopy = () => {
    navigator.clipboard.writeText(prettified);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput(""); setPrettified(""); setHasRun(false); setCopied(false);
  };

  const selectedLangLabel = LANGUAGES.find(l => l.id === (autoDetect ? detectedLang : lang))?.label || "JavaScript";

  const lineCount = (prettified || input).split("\n").length;
  const charCount = (prettified || input).length;

  return (
    <>
      <Helmet>
        <title>Code Prettifier – Format & Lint JS, CSS, HTML, Python | ShauryaTools</title>
        <meta name="description" content="Free online code prettifier with syntax highlighting and error detection. Auto-format JavaScript, TypeScript, JSX, CSS, HTML and Python instantly. Catches bracket mismatches, missing semicolons and more." />
        <meta name="keywords" content="code prettifier, code formatter, JavaScript formatter, code beautifier, online code formatter, JS prettier, CSS formatter, HTML formatter, code linter" />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Code Prettifier – Format & Lint JS, CSS, HTML, Python" />
        <meta property="og:description" content="Free online code prettifier with syntax highlighting, auto-formatting and error detection. No install needed." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Code Prettifier & Formatter Online" />
        <meta name="twitter:description" content="Format JS, CSS, HTML and Python code instantly. Catch errors too. Free, no signup." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Code Prettifier",
            "url": PAGE_URL,
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "All",
            "description": "Free online code prettifier and formatter. Auto-format JavaScript, TypeScript, JSX, CSS, HTML and Python with syntax highlighting and error detection.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="cp2-page">
        <div className="cp2-inner">

          {/* Header */}
          <div className="cp2-header">
            <div className="cp2-icon">
              <Code2 size={20} />
            </div>
            <div>
              <span className="cp2-cat-badge">Developer Tools</span>
              <h1>Code Prettifier</h1>
              <p>Paste your code, auto-format it, and catch errors — in seconds.</p>
            </div>
          </div>

          {/* Controls row */}
          <div className="cp2-controls-card">
            <div className="cp2-controls-row">

              {/* Language selector */}
              <div className="cp2-control-group">
                <label className="cp2-control-label">Language</label>
                <div className="cp2-lang-wrap">
                  <button
                    className={`cp2-lang-btn ${autoDetect ? "cp2-lang-auto" : ""}`}
                    onClick={() => setShowLangDD(s => !s)}
                  >
                    <FileCode size={13} />
                    {autoDetect ? `Auto: ${selectedLangLabel}` : selectedLangLabel}
                    <ChevronDown size={12} className={`cp2-chevron ${showLangDD ? "cp2-chevron-open" : ""}`} />
                  </button>
                  {showLangDD && (
                    <div className="cp2-lang-dropdown">
                      <button
                        className={`cp2-lang-option ${autoDetect ? "cp2-lang-option-on" : ""}`}
                        onClick={() => { setAutoDetect(true); setShowLangDD(false); }}
                      >✨ Auto Detect</button>
                      <div className="cp2-lang-divider" />
                      {LANGUAGES.map(l => (
                        <button
                          key={l.id}
                          className={`cp2-lang-option ${!autoDetect && lang === l.id ? "cp2-lang-option-on" : ""}`}
                          onClick={() => { setLang(l.id); setAutoDetect(false); setShowLangDD(false); }}
                        >{l.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Indent size */}
              <div className="cp2-control-group">
                <label className="cp2-control-label">Indent</label>
                <div className="cp2-indent-tabs">
                  {[2, 4].map(n => (
                    <button
                      key={n}
                      className={`cp2-indent-tab ${indentSize === n ? "cp2-indent-on" : ""}`}
                      onClick={() => setIndentSize(n)}
                    >{n} spaces</button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="cp2-control-group cp2-control-actions">
                <button className="cp2-clear-btn" onClick={handleClear} disabled={!input}>
                  <RefreshCw size={13} /> Clear
                </button>
                <button
                  className="cp2-prettify-btn"
                  onClick={handlePrettify}
                  disabled={!input.trim()}
                >
                  <Wand2 size={14} /> Prettify
                </button>
              </div>
            </div>
          </div>

          {/* Editor layout */}
          <div className="cp2-editor-layout">

            {/* Input panel */}
            <div className="cp2-panel">
              <div className="cp2-panel-header">
                <span className="cp2-panel-title">Input</span>
                <span className="cp2-panel-meta">{input.split("\n").length} lines</span>
              </div>
              <div className="cp2-editor-wrap">
                <div className="cp2-line-numbers" aria-hidden="true">
                  {input.split("\n").map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
                <textarea
                  className="cp2-textarea"
                  value={input}
                  onChange={e => { setInput(e.target.value); if (hasRun) setHasRun(false); }}
                  placeholder={"// Paste your code here…\nconst greet = (name) => {\n  console.log('Hello, ' + name)\n}"}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  onKeyDown={e => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const start = e.target.selectionStart;
                      const end = e.target.selectionEnd;
                      const spaces = " ".repeat(indentSize);
                      const newVal = input.substring(0, start) + spaces + input.substring(end);
                      setInput(newVal);
                      requestAnimationFrame(() => {
                        e.target.selectionStart = e.target.selectionEnd = start + indentSize;
                      });
                    }
                  }}
                />
              </div>
            </div>

            {/* Arrow */}
            <div className="cp2-arrow">
              <button className="cp2-arrow-btn" onClick={handlePrettify} disabled={!input.trim()} title="Prettify">
                <Wand2 size={16} />
              </button>
            </div>

            {/* Output panel */}
            <div className="cp2-panel">
              <div className="cp2-panel-header">
                <div className="cp2-output-tabs">
                  <button
                    className={`cp2-out-tab ${activeTab === "output" ? "cp2-out-tab-on" : ""}`}
                    onClick={() => setActiveTab("output")}
                  >Output</button>
                  <button
                    className={`cp2-out-tab ${activeTab === "issues" ? "cp2-out-tab-on" : ""}`}
                    onClick={() => setActiveTab("issues")}
                  >
                    Issues
                    {issues.length > 0 && (
                      <span className={`cp2-issue-badge ${errorCount > 0 ? "cp2-badge-error" : warningCount > 0 ? "cp2-badge-warn" : "cp2-badge-info"}`}>
                        {issues.length}
                      </span>
                    )}
                  </button>
                </div>
                <div className="cp2-panel-actions">
                  {prettified && (
                    <span className="cp2-panel-meta">{lineCount} lines · {charCount} chars</span>
                  )}
                  <button
                    className={`cp2-copy-btn ${copied ? "cp2-copied" : ""}`}
                    onClick={handleCopy}
                    disabled={!prettified}
                  >
                    {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Output content */}
              {activeTab === "output" && (
                <div className="cp2-output-wrap">
                  {prettified ? (
                    <div className="cp2-highlight-wrap">
                      <div className="cp2-line-numbers cp2-line-numbers-out" aria-hidden="true">
                        {prettified.split("\n").map((_, i) => (
                          <span key={i}>{i + 1}</span>
                        ))}
                      </div>
                      <pre
                        className="cp2-highlighted"
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                      />
                    </div>
                  ) : (
                    <div className="cp2-empty-output">
                      <Wand2 size={28} className="cp2-empty-icon" />
                      <p>Prettified code will appear here</p>
                      <p className="cp2-empty-sub">Paste code on the left and click Prettify</p>
                    </div>
                  )}
                </div>
              )}

              {/* Issues panel */}
              {activeTab === "issues" && (
                <div className="cp2-issues-wrap">
                  {!hasRun ? (
                    <div className="cp2-empty-output">
                      <AlertTriangle size={28} className="cp2-empty-icon" />
                      <p>Run prettifier to see issues</p>
                    </div>
                  ) : issues.length === 0 ? (
                    <div className="cp2-no-issues">
                      <CheckCircle size={28} className="cp2-ok-icon" />
                      <p>No issues found!</p>
                      <p className="cp2-empty-sub">Your code looks clean.</p>
                    </div>
                  ) : (
                    <>
                      <div className="cp2-issue-summary">
                        {errorCount > 0   && <span className="cp2-sum-badge cp2-sum-error"><AlertTriangle size={11} /> {errorCount} error{errorCount > 1 ? "s" : ""}</span>}
                        {warningCount > 0 && <span className="cp2-sum-badge cp2-sum-warn"><AlertTriangle size={11} /> {warningCount} warning{warningCount > 1 ? "s" : ""}</span>}
                        {infoCount > 0    && <span className="cp2-sum-badge cp2-sum-info"><AlertTriangle size={11} /> {infoCount} hint{infoCount > 1 ? "s" : ""}</span>}
                      </div>
                      <div className="cp2-issue-list">
                        {issues.map((issue, idx) => (
                          <div key={idx} className={`cp2-issue cp2-issue-${issue.severity}`}>
                            <span className={`cp2-issue-icon cp2-icon-${issue.severity}`}>
                              {issue.severity === "error" ? "✕" : issue.severity === "warning" ? "⚠" : "ℹ"}
                            </span>
                            <div className="cp2-issue-body">
                              <span className="cp2-issue-msg">{issue.message}</span>
                              <span className="cp2-issue-loc">Line {issue.line}{issue.col ? `, Col ${issue.col}` : ""}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          {hasRun && (
            <div className={`cp2-statusbar animate-in ${errorCount > 0 ? "cp2-status-error" : warningCount > 0 ? "cp2-status-warn" : "cp2-status-ok"}`}>
              {errorCount > 0
                ? <><AlertTriangle size={13} /> {errorCount} error{errorCount > 1 ? "s" : ""} · {warningCount} warning{warningCount > 1 ? "s" : ""} found — review the Issues tab</>
                : warningCount > 0
                ? <><AlertTriangle size={13} /> Prettified with {warningCount} warning{warningCount > 1 ? "s" : ""}</>
                : <><CheckCircle size={13} /> Code prettified successfully — no errors found</>
              }
            </div>
          )}

        </div>
      </div>
    </>
  );
}
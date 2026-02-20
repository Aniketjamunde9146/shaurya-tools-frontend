import { useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import {
  BookOpen, Copy, Check, RefreshCw, Wand2,
  ChevronDown, FileCode, Lightbulb, Layers,
  AlertTriangle, Code2, Sparkles, List, Braces
} from "lucide-react";
import "./CodeExplainer.css";

/* ── Constants ── */
const LANGUAGES = [
  { id: "auto",       label: "✨ Auto Detect" },
  { id: "javascript", label: "JavaScript"     },
  { id: "typescript", label: "TypeScript"     },
  { id: "jsx",        label: "JSX / TSX"      },
  { id: "python",     label: "Python"         },
  { id: "css",        label: "CSS"            },
  { id: "html",       label: "HTML"           },
  { id: "java",       label: "Java"           },
  { id: "go",         label: "Go"             },
  { id: "rust",       label: "Rust"           },
  { id: "sql",        label: "SQL"            },
  { id: "php",        label: "PHP"            },
];

const DEPTHS = [
  { id: "beginner",     label: "Beginner",     emoji: "🌱", desc: "Plain English, no jargon" },
  { id: "intermediate", label: "Intermediate", emoji: "⚡", desc: "Assumes basic knowledge"   },
  { id: "expert",       label: "Expert",       emoji: "🔬", desc: "Deep technical detail"     },
];

/* ── Auto-detect language ── */
function detectLanguage(code) {
  if (!code.trim()) return "javascript";
  if (/^\s*<\?php/i.test(code)) return "php";
  if (/^\s*<!DOCTYPE html/i.test(code) || /^\s*<html/i.test(code)) return "html";
  if (/className=/.test(code) && /<[a-z]/i.test(code)) return "jsx";
  if (/<[a-z][\s\S]*>/i.test(code) && !/{/.test(code)) return "html";
  if (/:\s*(string|number|boolean|void|any)\b/.test(code) || /interface\s+\w+/.test(code)) return "typescript";
  if (/{[\s\S]*?:\s*[\w#"']/.test(code) && !/(function|const|let|var|=>)/.test(code)) return "css";
  if (/def\s+\w+\s*\(/.test(code) || /^\s*#.*\n/m.test(code)) return "python";
  if (/public\s+(static\s+)?void\s+main/.test(code)) return "java";
  if (/func\s+\w+/.test(code) && /let\s+mut/.test(code)) return "rust";
  if (/\bSELECT\b|\bFROM\b|\bWHERE\b/i.test(code)) return "sql";
  if (/func\s+\w+\s*\(/.test(code)) return "go";
  return "javascript";
}

/* ── Explanation engine ── */
function generateExplanation(code, lang, depth) {
  if (!code.trim()) return null;

  const lines     = code.split("\n").filter(l => l.trim());
  const lineCount = lines.length;
  const detected  = lang === "auto" ? detectLanguage(code) : lang;

  // ── Summary ──
  let summary = "";
  let purpose = "";
  let concepts = [];
  let lineByLine = [];
  let tips = [];
  let complexity = "Low";

  const hasFunction   = /function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{|def\s+\w+|func\s+\w+/.test(code);
  const hasClass      = /class\s+\w+/.test(code);
  const hasLoop       = /for\s*\(|while\s*\(|\.forEach|\.map\s*\(|\.filter\s*\(|\.reduce\s*\(/.test(code);
  const hasAsync      = /async\s|await\s|Promise|\.then\s*\(/.test(code);
  const hasImport     = /^import\s|^from\s/m.test(code);
  const hasConditions = /if\s*\(|else\s*{|switch\s*\(|ternary|\?.*:/.test(code);
  const hasError      = /try\s*{|catch\s*\(|throw\s+/.test(code);
  const hasState      = /useState|useEffect|useCallback|useMemo|useRef/.test(code);
  const hasAPI        = /fetch\s*\(|axios\.|http\.|XMLHttpRequest/.test(code);
  const hasClosure    = /return\s+function|return\s+\(/.test(code);
  const charCount     = code.length;

  if (lineCount > 50 || (hasClass && hasLoop)) complexity = "High";
  else if (lineCount > 20 || hasAsync || hasClosure) complexity = "Medium";

  // ── Language-aware summary ──
  if (["javascript","typescript","jsx"].includes(detected)) {
    if (hasState && hasFunction) {
      summary = "This is a React component that manages local state and renders UI based on that state.";
      purpose = "It defines a reusable UI component using React hooks to handle dynamic behavior.";
    } else if (hasClass) {
      summary = "This code defines a JavaScript class with properties and methods.";
      purpose = "It creates a blueprint for objects with shared structure and behavior.";
    } else if (hasAsync) {
      summary = "This code handles asynchronous operations, likely fetching or processing data.";
      purpose = "It performs non-blocking I/O operations using async/await or Promises.";
    } else if (hasFunction) {
      summary = "This code defines one or more functions to encapsulate reusable logic.";
      purpose = "It organizes code into callable blocks that perform specific tasks.";
    } else {
      summary = "This is a JavaScript/TypeScript snippet that processes or transforms data.";
      purpose = "It executes a sequence of operations to produce a result or side effect.";
    }
  } else if (detected === "python") {
    summary = hasClass
      ? "This Python code defines a class with methods and attributes."
      : hasFunction
      ? "This Python script defines reusable functions to perform tasks."
      : "This Python snippet executes a series of operations or data transformations.";
    purpose = "It follows Python's clean syntax for readable, concise programming.";
  } else if (detected === "css") {
    summary = "This CSS code defines styling rules for HTML elements.";
    purpose = "It controls the visual appearance including layout, colors, and typography.";
  } else if (detected === "html") {
    summary = "This HTML code defines the structure of a web page.";
    purpose = "It marks up content with semantic tags to create a document hierarchy.";
  } else if (detected === "sql") {
    summary = "This SQL query retrieves, modifies, or manipulates database records.";
    purpose = "It communicates with a relational database to perform data operations.";
  } else {
    summary = `This ${detected.toUpperCase()} code implements logic to solve a specific programming task.`;
    purpose = "It demonstrates patterns and idioms specific to the language ecosystem.";
  }

  // ── Concepts identified ──
  if (hasImport)     concepts.push({ icon: "📦", label: "Imports / Modules",       desc: "External code is being brought into scope" });
  if (hasClass)      concepts.push({ icon: "🏗️", label: "Class / OOP",             desc: "Object-oriented pattern with inheritance and encapsulation" });
  if (hasFunction)   concepts.push({ icon: "⚙️", label: "Functions / Methods",     desc: "Reusable blocks of logic that can be called with arguments" });
  if (hasLoop)       concepts.push({ icon: "🔁", label: "Loops / Iteration",        desc: "Repeating operations over a collection or until a condition" });
  if (hasConditions) concepts.push({ icon: "🔀", label: "Conditionals",             desc: "Branching logic based on true/false evaluations" });
  if (hasAsync)      concepts.push({ icon: "⏳", label: "Async / Promises",         desc: "Non-blocking operations that complete in the future" });
  if (hasError)      concepts.push({ icon: "🛡️", label: "Error Handling",          desc: "Try/catch blocks to gracefully handle failures" });
  if (hasState)      concepts.push({ icon: "🎣", label: "React Hooks",              desc: "useState, useEffect and other React state management hooks" });
  if (hasAPI)        concepts.push({ icon: "🌐", label: "API / Network Calls",      desc: "Fetching data from external sources or servers" });
  if (hasClosure)    concepts.push({ icon: "🔒", label: "Closures",                 desc: "Functions that remember variables from their outer scope" });
  if (charCount > 500) concepts.push({ icon: "📐", label: "Complex Logic",          desc: "Multiple layers of operations working together" });

  // ── Line-by-line (first 12 significant lines) ──
  const sigLines = lines.filter(l => l.trim() && !l.trim().startsWith("//") && l.trim() !== "{" && l.trim() !== "}" ).slice(0, 12);

  sigLines.forEach((line, i) => {
    const t = line.trim();
    let explanation = "";

    if (/^import\s/.test(t))                          explanation = `Imports ${t.match(/import\s+(.+)\s+from/)?.[1] || "module"} from an external package for use in this file.`;
    else if (/^export\s+default/.test(t))             explanation = "Exports this as the default export so other files can import it.";
    else if (/^export\s/.test(t))                     explanation = "Makes this available as a named export to other modules.";
    else if (/const\s+\w+\s*=\s*\(.*\)\s*=>/.test(t)) explanation = `Declares an arrow function '${t.match(/const\s+(\w+)/)?.[1]}' using a concise ES6 syntax.`;
    else if (/const\s+\w+\s*=\s*useState/.test(t))   explanation = `Creates a state variable '${t.match(/\[(\w+)/)?.[1]}' and its setter. React re-renders when this changes.`;
    else if (/const\s+\w+\s*=\s*useEffect/.test(t) || /useEffect\s*\(/.test(t)) explanation = "Side effect hook — runs after render, often for data fetching or subscriptions.";
    else if (/const\s+\[/.test(t))                   explanation = "Destructures an array, unpacking values into individual named variables.";
    else if (/const\s+\{/.test(t))                   explanation = "Destructures an object, extracting named properties into local variables.";
    else if (/^const\s+\w+\s*=/.test(t))             explanation = `Declares a constant '${t.match(/const\s+(\w+)/)?.[1]}' — its reference cannot be reassigned.`;
    else if (/^let\s+\w+\s*=/.test(t))               explanation = `Declares a mutable variable '${t.match(/let\s+(\w+)/)?.[1]}' that can be reassigned later.`;
    else if (/^function\s+\w+/.test(t))              explanation = `Defines a named function '${t.match(/function\s+(\w+)/)?.[1]}' that can be called from anywhere in scope.`;
    else if (/^class\s+\w+/.test(t))                 explanation = `Declares a class '${t.match(/class\s+(\w+)/)?.[1]}' — a template for creating objects.`;
    else if (/^if\s*\(/.test(t))                     explanation = "Conditional check — the block below runs only if this expression is truthy.";
    else if (/^else/.test(t))                        explanation = "Fallback block — executes when the preceding 'if' condition was false.";
    else if (/^for\s*\(/.test(t))                    explanation = "Loop — iterates a set number of times or over a range of values.";
    else if (/\.forEach\s*\(/.test(t))               explanation = "Iterates over every element in the array, calling the callback for each.";
    else if (/\.map\s*\(/.test(t))                   explanation = "Transforms each array element and returns a new array of the same length.";
    else if (/\.filter\s*\(/.test(t))                explanation = "Returns a new array containing only elements that pass the test function.";
    else if (/\.reduce\s*\(/.test(t))                explanation = "Reduces the array to a single value by accumulating results.";
    else if (/^return\s/.test(t))                    explanation = "Returns a value from the function — this is what the caller receives.";
    else if (/^try\s*{/.test(t))                     explanation = "Begins a try block — code that might throw an error runs here.";
    else if (/^catch\s*\(/.test(t))                  explanation = "Catches any error thrown inside the try block and handles it gracefully.";
    else if (/^throw\s/.test(t))                     explanation = "Manually throws an error, stopping execution and passing it to the nearest catch.";
    else if (/await\s/.test(t))                      explanation = "Pauses the async function until this Promise resolves before continuing.";
    else if (/async\s/.test(t))                      explanation = "Marks this function as asynchronous — it will return a Promise.";
    else if (/console\.(log|error|warn)/.test(t))    explanation = "Logs a value to the developer console — typically used for debugging.";
    else if (/\.push\s*\(/.test(t))                  explanation = "Adds one or more elements to the end of an array, mutating it in place.";
    else if (/fetch\s*\(/.test(t))                   explanation = "Makes an HTTP request to a URL and returns a Promise with the response.";
    else if (/\?\s*\./.test(t))                      explanation = "Optional chaining (?.) — safely accesses a property, returning undefined instead of throwing if it's null.";
    else if (/\?\?\s*/.test(t))                      explanation = "Nullish coalescing (??) — uses the right value only if the left is null or undefined.";
    else if (/^@/.test(t))                           explanation = "A decorator — a function that wraps and modifies the behavior of a class or method.";
    else if (/^def\s+\w+/.test(t))                  explanation = `Defines a Python function '${t.match(/def\s+(\w+)/)?.[1]}' that can be called with arguments.`;
    else if (/^SELECT\s/i.test(t))                   explanation = "SQL SELECT — retrieves specific columns from one or more database tables.";
    else if (/^FROM\s/i.test(t))                     explanation = "Specifies which table(s) the SQL query should pull data from.";
    else if (/^WHERE\s/i.test(t))                    explanation = "Filters rows — only rows matching this condition are included in the result.";
    else explanation = `Executes an operation: ${t.length > 60 ? t.slice(0, 57) + "…" : t}`;

    lineByLine.push({ line: line.trim(), number: lines.indexOf(line) + 1, explanation });
  });

  // ── Tips based on depth ──
  if (depth === "beginner") {
    tips = [
      "💡 Read code top-to-bottom like a recipe — each line is a step.",
      "🔍 When you see a word followed by (), that's a function being called.",
      "📦 Lines starting with 'import' bring in tools from other files.",
      "🎯 'const' means the value won't change; 'let' means it can.",
    ];
  } else if (depth === "intermediate") {
    tips = [
      "⚡ Arrow functions (=>) are shorthand for function expressions and inherit the parent 'this'.",
      "🔁 Prefer .map(), .filter(), .reduce() over imperative for-loops for clarity.",
      "🛡️  Always handle errors in async code — an unhandled rejection crashes silently.",
      "📐 Destructuring reduces boilerplate and makes intent clearer at a glance.",
    ];
    if (hasState) tips.push("🎣 Keep useEffect dependencies accurate — missing deps cause stale closures.");
    if (hasAsync) tips.push("⏳ Wrap await in try/catch or use .catch() to handle rejected Promises.");
  } else {
    tips = [
      "🔬 Check the V8 hidden class stability — dynamic property addition can deopt hot paths.",
      "📊 Closures over large scopes prevent GC — scope variables tightly to avoid memory pressure.",
      "⚙️  Prefer composition over inheritance; mixins and higher-order functions scale better.",
      "🧵 In async code, be aware of microtask vs macrotask queue ordering for predictable behavior.",
    ];
    if (hasLoop) tips.push("🔁 Array.prototype methods create new arrays — for perf-critical loops, consider typed arrays.");
    if (hasState) tips.push("🎣 useMemo/useCallback only help when referential equality matters — don't over-memoize.");
  }

  return { summary, purpose, concepts, lineByLine, tips, complexity, detected, lineCount };
}

/* ── Copy button ── */
function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className={`ce-copy-mini ${copied ? "ce-copied" : ""}`} onClick={handle}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

/* ── Complexity badge ── */
function ComplexityBadge({ level }) {
  const map = { Low: "ce-badge-low", Medium: "ce-badge-med", High: "ce-badge-high" };
  return <span className={`ce-complexity-badge ${map[level]}`}>{level} Complexity</span>;
}

/* ── Main component ── */
export default function CodeExplainer() {
  const [code,       setCode]       = useState("");
  const [lang,       setLang]       = useState("auto");
  const [depth,      setDepth]      = useState("beginner");
  const [result,     setResult]     = useState(null);
  const [hasRun,     setHasRun]     = useState(false);
  const [showLangDD, setShowLangDD] = useState(false);
  const [activeTab,  setActiveTab]  = useState("summary");

  const detectedLabel = LANGUAGES.find(l => l.id === (lang === "auto" ? detectLanguage(code) : lang))?.label || "JavaScript";

  const handleExplain = useCallback(() => {
    if (!code.trim()) return;
    const explanation = generateExplanation(code, lang, depth);
    setResult(explanation);
    setHasRun(true);
    setActiveTab("summary");
  }, [code, lang, depth]);

  const handleClear = () => {
    setCode(""); setResult(null); setHasRun(false);
  };

  const tabCount = result ? {
    summary:  null,
    concepts: result.concepts.length,
    lines:    result.lineByLine.length,
    tips:     result.tips.length,
  } : {};

  return (
    <>
      <Helmet>
        <title>Code Explainer — Understand Any Code Instantly | DevTools</title>
        <meta name="description" content="Paste any code snippet and get a plain-English explanation. Supports JavaScript, Python, CSS, HTML, TypeScript, SQL, and more. Choose beginner to expert depth." />
        <meta name="keywords" content="code explainer, code explanation, understand code, JavaScript explainer, Python explainer, code reader, developer tools, learn to code" />
        <meta property="og:title" content="Code Explainer — Understand Any Code Instantly" />
        <meta property="og:description" content="Paste any code snippet and get a clear, line-by-line explanation at your skill level." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Code Explainer — DevTools" />
        <meta name="twitter:description" content="Paste code, get a plain-English explanation. Supports 10+ languages." />
        <link rel="canonical" href="https://yoursite.com/tools/code-explainer" />
      </Helmet>

      <div className="ce-page">
        <div className="ce-inner">

          {/* Header */}
          <div className="ce-header">
            <div className="ce-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="ce-cat-badge">Developer Tools</span>
              <h1>Code Explainer</h1>
              <p>Paste any code snippet and get a clear, plain-English explanation — line by line.</p>
            </div>
          </div>

          {/* Controls */}
          <div className="ce-controls-card">
            <div className="ce-controls-row">

              {/* Language */}
              <div className="ce-control-group">
                <label className="ce-control-label">Language</label>
                <div className="ce-lang-wrap">
                  <button
                    className={`ce-lang-btn ${lang === "auto" ? "ce-lang-auto" : ""}`}
                    onClick={() => setShowLangDD(s => !s)}
                  >
                    <FileCode size={13} />
                    {lang === "auto" ? `Auto: ${detectedLabel}` : detectedLabel}
                    <ChevronDown size={12} className={`ce-chevron ${showLangDD ? "ce-chevron-open" : ""}`} />
                  </button>
                  {showLangDD && (
                    <div className="ce-lang-dropdown">
                      {LANGUAGES.map(l => (
                        <button
                          key={l.id}
                          className={`ce-lang-option ${lang === l.id ? "ce-lang-option-on" : ""}`}
                          onClick={() => { setLang(l.id); setShowLangDD(false); }}
                        >{l.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Depth */}
              <div className="ce-control-group">
                <label className="ce-control-label">Explanation Depth</label>
                <div className="ce-depth-tabs">
                  {DEPTHS.map(d => (
                    <button
                      key={d.id}
                      className={`ce-depth-tab ${depth === d.id ? "ce-depth-on" : ""}`}
                      onClick={() => setDepth(d.id)}
                      title={d.desc}
                    >
                      {d.emoji} {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="ce-control-actions">
                <button className="ce-clear-btn" onClick={handleClear} disabled={!code}>
                  <RefreshCw size={13} /> Clear
                </button>
                <button
                  className="ce-explain-btn"
                  onClick={handleExplain}
                  disabled={!code.trim()}
                >
                  <Sparkles size={14} /> Explain Code
                </button>
              </div>
            </div>
          </div>

          {/* Editor + Output layout */}
          <div className="ce-layout">

            {/* Input */}
            <div className="ce-input-panel">
              <div className="ce-panel-header">
                <span className="ce-panel-title"><Code2 size={13} /> Your Code</span>
                <span className="ce-panel-meta">{code.split("\n").length} lines</span>
              </div>
              <div className="ce-editor-wrap">
                <div className="ce-line-numbers" aria-hidden="true">
                  {code.split("\n").map((_, i) => <span key={i}>{i + 1}</span>)}
                </div>
                <textarea
                  className="ce-textarea"
                  value={code}
                  onChange={e => { setCode(e.target.value); if (hasRun) setHasRun(false); }}
                  placeholder={"// Paste your code here…\nconst greet = (name) => {\n  return `Hello, ${name}!`;\n};"}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  onKeyDown={e => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const s = e.target.selectionStart;
                      const newVal = code.substring(0, s) + "  " + code.substring(e.target.selectionEnd);
                      setCode(newVal);
                      requestAnimationFrame(() => { e.target.selectionStart = e.target.selectionEnd = s + 2; });
                    }
                  }}
                />
              </div>
              <button
                className="ce-explain-fab"
                onClick={handleExplain}
                disabled={!code.trim()}
              >
                <Sparkles size={15} /> Explain This Code
              </button>
            </div>

            {/* Output */}
            <div className="ce-output-panel">
              <div className="ce-panel-header">
                <span className="ce-panel-title"><BookOpen size={13} /> Explanation</span>
                {result && <ComplexityBadge level={result.complexity} />}
              </div>

              {!hasRun ? (
                <div className="ce-empty">
                  <Sparkles size={32} className="ce-empty-icon" />
                  <p>Your explanation will appear here</p>
                  <p className="ce-empty-sub">Paste code on the left and click "Explain Code"</p>
                </div>
              ) : result && (
                <>
                  {/* Output tabs */}
                  <div className="ce-out-tabs">
                    {[
                      { id: "summary",  label: "Summary",    icon: <Lightbulb size={13} /> },
                      { id: "concepts", label: "Concepts",   icon: <Layers size={13} />,    count: tabCount.concepts },
                      { id: "lines",    label: "Line by Line",icon: <List size={13} />,      count: tabCount.lines    },
                      { id: "tips",     label: "Tips",        icon: <Wand2 size={13} />,    count: tabCount.tips     },
                    ].map(t => (
                      <button
                        key={t.id}
                        className={`ce-out-tab ${activeTab === t.id ? "ce-out-tab-on" : ""}`}
                        onClick={() => setActiveTab(t.id)}
                      >
                        {t.icon} {t.label}
                        {t.count != null && (
                          <span className="ce-tab-count">{t.count}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="ce-out-body">

                    {/* Summary tab */}
                    {activeTab === "summary" && (
                      <div className="ce-summary animate-in">
                        <div className="ce-summary-hero">
                          <p className="ce-summary-text">{result.summary}</p>
                          <p className="ce-summary-purpose">{result.purpose}</p>
                        </div>
                        <div className="ce-meta-grid">
                          <div className="ce-meta-item">
                            <span className="ce-meta-label">Language</span>
                            <span className="ce-meta-val">{result.detected.toUpperCase()}</span>
                          </div>
                          <div className="ce-meta-item">
                            <span className="ce-meta-label">Lines</span>
                            <span className="ce-meta-val">{result.lineCount}</span>
                          </div>
                          <div className="ce-meta-item">
                            <span className="ce-meta-label">Depth</span>
                            <span className="ce-meta-val">{DEPTHS.find(d => d.id === depth)?.emoji} {DEPTHS.find(d => d.id === depth)?.label}</span>
                          </div>
                          <div className="ce-meta-item">
                            <span className="ce-meta-label">Concepts</span>
                            <span className="ce-meta-val">{result.concepts.length} found</span>
                          </div>
                        </div>
                        <div className="ce-copy-row">
                          <CopyBtn text={`${result.summary}\n\n${result.purpose}`} label="Copy Summary" />
                        </div>
                      </div>
                    )}

                    {/* Concepts tab */}
                    {activeTab === "concepts" && (
                      <div className="ce-concepts animate-in">
                        {result.concepts.length === 0 ? (
                          <div className="ce-empty-tab">
                            <AlertTriangle size={20} />
                            <p>No specific concepts detected.</p>
                          </div>
                        ) : (
                          result.concepts.map((c, i) => (
                            <div key={i} className="ce-concept-item">
                              <span className="ce-concept-emoji">{c.icon}</span>
                              <div className="ce-concept-body">
                                <span className="ce-concept-label">{c.label}</span>
                                <span className="ce-concept-desc">{c.desc}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Line by line tab */}
                    {activeTab === "lines" && (
                      <div className="ce-lines animate-in">
                        {result.lineByLine.map((item, i) => (
                          <div key={i} className="ce-line-item">
                            <div className="ce-line-code-row">
                              <span className="ce-line-num">{item.number}</span>
                              <code className="ce-line-code">{item.line}</code>
                            </div>
                            <p className="ce-line-explanation">{item.explanation}</p>
                          </div>
                        ))}
                        {result.lineCount > 12 && (
                          <div className="ce-lines-note">
                            <Braces size={13} />
                            Showing top 12 significant lines of {result.lineCount} total.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tips tab */}
                    {activeTab === "tips" && (
                      <div className="ce-tips animate-in">
                        <p className="ce-tips-intro">
                          Pro tips for <strong>{DEPTHS.find(d => d.id === depth)?.label}</strong> level:
                        </p>
                        {result.tips.map((tip, i) => (
                          <div key={i} className="ce-tip-item">
                            <p>{tip}</p>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
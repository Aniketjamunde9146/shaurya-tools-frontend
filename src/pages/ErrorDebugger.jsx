/* eslint-disable no-empty */
import { useState } from "react";
import { Helmet } from "react-helmet";
import { generateAI } from "../api";
import "./ErrorDebugger.css";

/* ── Icons ── */
const IconBug = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l1.88 1.88M16 2l-1.88 1.88M9 7.13v-1a3.003 3.003 0 116 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z"/>
    <path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M17.47 9c1.93-.2 3.53-1.9 3.53-4M3 19h4M17 19h4"/>
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
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconCode = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const IconLightbulb = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>
  </svg>
);
const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconSpinner = () => (
  <span className="ed-spinner" />
);

/* ── Language options ── */
const LANGUAGES = [
  { id: "auto",       label: "Auto Detect"  },
  { id: "javascript", label: "JavaScript"   },
  { id: "typescript", label: "TypeScript"   },
  { id: "python",     label: "Python"       },
  { id: "java",       label: "Java"         },
  { id: "csharp",     label: "C#"           },
  { id: "cpp",        label: "C++"          },
  { id: "go",         label: "Go"           },
  { id: "rust",       label: "Rust"         },
  { id: "php",        label: "PHP"          },
  { id: "ruby",       label: "Ruby"         },
  { id: "sql",        label: "SQL"          },
  { id: "bash",       label: "Bash/Shell"   },
  { id: "css",        label: "CSS"          },
];

/* ── Severity badge colors ── */
const SEVERITY_MAP = {
  critical: { label: "Critical",  cls: "ed-sev-critical" },
  high:     { label: "High",      cls: "ed-sev-high"     },
  medium:   { label: "Medium",    cls: "ed-sev-medium"   },
  low:      { label: "Low",       cls: "ed-sev-low"      },
};

/* ── Parse AI response into structured sections ── */
function parseAIResponse(text) {
  const sections = {
    errorType:   "",
    severity:    "medium",
    summary:     "",
    rootCause:   "",
    steps:       [],
    fixedCode:   "",
    prevention:  "",
    references:  [],
  };

  // Extract JSON block if present
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      return { ...sections, ...parsed };
    } catch {}
  }

  // Fallback: plain text parsing by headings
  const lines = text.split("\n");
  let currentSection = null;
  let codeBuffer = [];
  let inCode = false;

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("```")) {
      inCode = !inCode;
      if (!inCode && currentSection === "fixedCode") {
        sections.fixedCode = codeBuffer.join("\n");
        codeBuffer = [];
      }
      continue;
    }
    if (inCode) { codeBuffer.push(line); continue; }

    if (/error type|error name/i.test(t)) { currentSection = "errorType"; sections.errorType = t.replace(/.*?:\s*/, ""); }
    else if (/severity/i.test(t)) { currentSection = "severity"; const s = t.toLowerCase(); sections.severity = s.includes("critical") ? "critical" : s.includes("high") ? "high" : s.includes("low") ? "low" : "medium"; }
    else if (/summary|what.*error/i.test(t)) { currentSection = "summary"; sections.summary = t.replace(/.*?:\s*/, ""); }
    else if (/root cause|why|reason/i.test(t)) { currentSection = "rootCause"; sections.rootCause = t.replace(/.*?:\s*/, ""); }
    else if (/fix|solution|steps/i.test(t)) { currentSection = "steps"; }
    else if (/fixed code|corrected code/i.test(t)) { currentSection = "fixedCode"; }
    else if (/prevention|prevent|avoid/i.test(t)) { currentSection = "prevention"; sections.prevention = t.replace(/.*?:\s*/, ""); }
    else if (/reference|resource|link|doc/i.test(t)) { currentSection = "references"; }
    else if (t) {
      if (currentSection === "summary" && !sections.summary) sections.summary = t;
      else if (currentSection === "rootCause" && !sections.rootCause) sections.rootCause = t;
      else if (currentSection === "steps" && /^\d+\.|\*|-/.test(t)) sections.steps.push(t.replace(/^[\d.*\-\s]+/, ""));
      else if (currentSection === "prevention" && !sections.prevention) sections.prevention = t;
      else if (currentSection === "references" && t) sections.references.push(t.replace(/^[-*\s]+/, ""));
    }
  }

  // If we got nothing structured, put everything in summary
  if (!sections.summary && !sections.rootCause && sections.steps.length === 0) {
    sections.summary = text.slice(0, 600);
  }

  return sections;
}

/* ── Render inline markdown (bold, code, italic) ── */
function renderInline(text) {
  if (!text) return null;
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="ed-ic">{p.slice(1,-1)}</code>;
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1,-1)}</em>;
    return p;
  });
}

/* ── Main Component ── */
export default function ErrorDebugger() {
  const [errorText,  setErrorText]  = useState("");
  const [codeText,   setCodeText]   = useState("");
  const [lang,       setLang]       = useState("auto");
  const [showLang,   setShowLang]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [apiError,   setApiError]   = useState("");
  const [copiedKey,  setCopiedKey]  = useState("");
  const [activeTab,  setActiveTab]  = useState("analysis");

  const canDebug = errorText.trim().length > 0;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2500);
  };

  const handleReset = () => {
    setErrorText(""); setCodeText(""); setResult(null); setApiError(""); setLang("auto");
  };

  async function handleDebug() {
    if (!canDebug) return;
    setLoading(true);
    setResult(null);
    setApiError("");
    setActiveTab("analysis");

    const langLabel = lang === "auto" ? "auto-detect the language" : lang;

    const prompt = `You are an expert software debugger. Analyze the following error and code, then respond with a JSON object inside a \`\`\`json block.

ERROR MESSAGE:
${errorText}

${codeText ? `CODE CONTEXT (${langLabel}):\n${codeText}` : "(No code provided — analyze error message only)"}

Respond ONLY with this JSON structure inside \`\`\`json ... \`\`\`:
{
  "errorType": "Short error type/name",
  "severity": "critical | high | medium | low",
  "summary": "1-2 sentence plain English explanation of what went wrong",
  "rootCause": "Detailed explanation of the underlying cause",
  "steps": ["Step 1 to fix", "Step 2 to fix", "Step 3 to fix"],
  "fixedCode": "The corrected code snippet (if code was provided), or empty string",
  "prevention": "How to prevent this error in the future",
  "references": ["MDN: ...", "Docs: ...", "Search: ..."]
}`;

    try {
      const res = await generateAI("debug", prompt);

      if (!res.data.success) throw new Error("AI generation failed");

      const rawText = res.data.data.trim();
      const parsed = parseAIResponse(rawText);
      setResult(parsed);
    } catch (e) {
      setApiError("Could not reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const sev = result ? (SEVERITY_MAP[result.severity] || SEVERITY_MAP.medium) : null;
  const selectedLangLabel = LANGUAGES.find(l => l.id === lang)?.label || "Auto Detect";

  return (
    <>
      <Helmet>
        <title>Error Debugger – AI-Powered Bug Fixer | ShauryaTools</title>
        <meta name="description" content="Paste any error message and code snippet to get an instant AI-powered explanation, root cause analysis, and step-by-step fix. Free." />
        <meta name="keywords" content="error debugger, bug fixer, AI debugger, code error fix, stack trace analyzer, developer tools" />
        <link rel="canonical" href="https://shauryatools.vercel.app/error-debugger" />
      </Helmet>

      <div className="ed-page" onClick={() => showLang && setShowLang(false)}>
        <div className="ed-inner">

          {/* ── Header ── */}
          <div className="ed-header">
            <div className="ed-icon"><IconBug /></div>
            <div>
              <span className="ed-cat">Developer Tools</span>
              <h1>Error Debugger</h1>
              <p>Paste your error message — get an instant root cause analysis and fix.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="ed-card">

            {/* Error Input */}
            <div className="ed-field">
              <div className="ed-label-row">
                <label className="ed-label">
                  <IconAlert /> Error Message / Stack Trace
                  <span className="ed-required">*</span>
                </label>
                {errorText && (
                  <span className="ed-char-count">{errorText.length} chars</span>
                )}
              </div>
              <textarea
                className="ed-error-input"
                value={errorText}
                onChange={e => { setErrorText(e.target.value); setApiError(""); setResult(null); }}
                placeholder={"TypeError: Cannot read properties of undefined (reading 'map')\n    at App.render (App.jsx:42:18)\n    at ..."}
                rows={5}
                spellCheck={false}
              />
            </div>

            <div className="ed-divider" />

            {/* Code + Language row */}
            <div className="ed-row">
              <div className="ed-field ed-field-grow">
                <div className="ed-label-row">
                  <label className="ed-label"><IconCode /> Code Context <span className="ed-optional">(optional but recommended)</span></label>
                </div>
                <textarea
                  className="ed-code-input"
                  value={codeText}
                  onChange={e => { setCodeText(e.target.value); setResult(null); }}
                  placeholder={"// Paste the relevant code snippet here\nconst items = data.results;\nreturn items.map(item => <Item key={item.id} {...item} />);"}
                  rows={6}
                  spellCheck={false}
                />
              </div>

              <div className="ed-field ed-field-lang" onClick={e => e.stopPropagation()}>
                <label className="ed-label">Language</label>
                <div className="ed-lang-wrap">
                  <button
                    className={`ed-lang-btn ${lang === "auto" ? "ed-lang-auto" : ""}`}
                    onClick={() => setShowLang(s => !s)}
                  >
                    <span className="ed-lang-text">{selectedLangLabel}</span>
                    <span className={`ed-chev ${showLang ? "ed-chev-open" : ""}`}><IconChevron /></span>
                  </button>
                  {showLang && (
                    <div className="ed-lang-dd">
                      {LANGUAGES.map(l => (
                        <button
                          key={l.id}
                          className={`ed-lang-opt ${lang === l.id ? "ed-lang-on" : ""}`}
                          onClick={() => { setLang(l.id); setShowLang(false); }}
                        >
                          {l.label}
                          {lang === l.id && <IconCheck />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* API Error */}
            {apiError && (
              <div className="ed-error-msg">
                <IconAlert /> {apiError}
              </div>
            )}

            {/* Actions */}
            <div className="ed-actions">
              {(result || errorText) && (
                <button className="ed-reset-btn" onClick={handleReset}>
                  <IconRefresh /> Reset
                </button>
              )}
              <button
                className="ed-debug-btn"
                onClick={handleDebug}
                disabled={loading || !canDebug}
              >
                {loading ? <><IconSpinner /> Analyzing...</> : <><IconSearch /> Debug Error</>}
              </button>
            </div>
          </div>

          {/* ── Loading Skeleton ── */}
          {loading && (
            <div className="ed-card ed-skeleton-card animate-in">
              <div className="ed-skel ed-skel-title" />
              <div className="ed-skel ed-skel-line" />
              <div className="ed-skel ed-skel-line ed-skel-short" />
              <div className="ed-skel ed-skel-block" />
              <div className="ed-skel ed-skel-line" />
              <div className="ed-skel ed-skel-line ed-skel-short" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="ed-card animate-in">

              {/* Result Header */}
              <div className="ed-result-header">
                <div className="ed-result-meta">
                  {result.errorType && (
                    <span className="ed-error-type">{result.errorType}</span>
                  )}
                  {sev && (
                    <span className={`ed-severity ${sev.cls}`}>{sev.label} Severity</span>
                  )}
                </div>
                <div className="ed-result-tabs">
                  <button className={`ed-tab ${activeTab === "analysis" ? "ed-tab-on" : ""}`} onClick={() => setActiveTab("analysis")}>Analysis</button>
                  {result.fixedCode && (
                    <button className={`ed-tab ${activeTab === "fix" ? "ed-tab-on" : ""}`} onClick={() => setActiveTab("fix")}>Fixed Code</button>
                  )}
                </div>
              </div>

              <div className="ed-result-divider" />

              {activeTab === "analysis" && (
                <div className="ed-analysis">

                  {/* Summary */}
                  {result.summary && (
                    <div className="ed-section">
                      <h3 className="ed-section-title">
                        <span className="ed-section-icon">💬</span> What happened
                      </h3>
                      <p className="ed-section-body">{renderInline(result.summary)}</p>
                    </div>
                  )}

                  {/* Root Cause */}
                  {result.rootCause && (
                    <div className="ed-section">
                      <h3 className="ed-section-title">
                        <span className="ed-section-icon">🔍</span> Root Cause
                      </h3>
                      <p className="ed-section-body">{renderInline(result.rootCause)}</p>
                    </div>
                  )}

                  {/* Fix Steps */}
                  {result.steps && result.steps.length > 0 && (
                    <div className="ed-section">
                      <h3 className="ed-section-title">
                        <span className="ed-section-icon">🛠️</span> How to Fix
                      </h3>
                      <ol className="ed-steps">
                        {result.steps.map((step, i) => (
                          <li key={i} className="ed-step">
                            <span className="ed-step-num">{i + 1}</span>
                            <span className="ed-step-text">{renderInline(step)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Prevention */}
                  {result.prevention && (
                    <div className="ed-section ed-section-prevention">
                      <h3 className="ed-section-title">
                        <span className="ed-section-icon"><IconLightbulb /></span> Prevention
                      </h3>
                      <p className="ed-section-body">{renderInline(result.prevention)}</p>
                    </div>
                  )}

                  {/* References */}
                  {result.references && result.references.length > 0 && (
                    <div className="ed-section">
                      <h3 className="ed-section-title">
                        <span className="ed-section-icon">📚</span> References
                      </h3>
                      <ul className="ed-refs">
                        {result.references.map((ref, i) => (
                          <li key={i} className="ed-ref">{renderInline(ref)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "fix" && result.fixedCode && (
                <div className="ed-fix animate-in">
                  <div className="ed-code-header">
                    <span className="ed-code-label"><IconCode /> Fixed Code</span>
                    <button
                      className={`ed-copy-btn ${copiedKey === "fix" ? "ed-copied" : ""}`}
                      onClick={() => handleCopy(result.fixedCode, "fix")}
                    >
                      {copiedKey === "fix" ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                    </button>
                  </div>
                  <pre className="ed-code-block"><code>{result.fixedCode}</code></pre>
                </div>
              )}

              {/* Footer copy */}
              <div className="ed-result-footer">
                <button
                  className={`ed-copy-full ${copiedKey === "full" ? "ed-copied" : ""}`}
                  onClick={() => {
                    const fullText = [
                      result.errorType && `Error: ${result.errorType}`,
                      result.summary   && `\nSummary: ${result.summary}`,
                      result.rootCause && `\nRoot Cause: ${result.rootCause}`,
                      result.steps?.length && `\nFix Steps:\n${result.steps.map((s,i)=>`${i+1}. ${s}`).join("\n")}`,
                      result.fixedCode && `\nFixed Code:\n${result.fixedCode}`,
                      result.prevention && `\nPrevention: ${result.prevention}`,
                    ].filter(Boolean).join("\n");
                    handleCopy(fullText, "full");
                  }}
                >
                  {copiedKey === "full" ? <><IconCheck /> Copied to clipboard!</> : <><IconCopy /> Copy Full Analysis</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
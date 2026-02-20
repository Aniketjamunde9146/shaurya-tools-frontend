/* eslint-disable no-unused-vars */
import { useState, useRef, useMemo } from "react";
import "./RegexTester.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconRegex = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v8M12 18v4M4.93 10.93l5.66 5.66M13.41 7.41l5.66 5.66M2 15h8M14 15h8M4.93 19.07l5.66-5.66M13.41 12.59l5.66-5.66"/>
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
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

/* ══════════════════════════════════
   Highlight matches in test string
   ══════════════════════════════════ */
const MATCH_COLORS = [
  { bg: "#fef9c3", border: "#fde047", text: "#713f12" },
  { bg: "#dbeafe", border: "#93c5fd", text: "#1e3a8a" },
  { bg: "#dcfce7", border: "#86efac", text: "#14532d" },
  { bg: "#fce7f3", border: "#f9a8d4", text: "#831843" },
  { bg: "#f3e8ff", border: "#d8b4fe", text: "#581c87" },
  { bg: "#ffedd5", border: "#fdba74", text: "#7c2d12" },
];

function buildHighlightedHtml(text, matches) {
  if (!matches.length) return escHtml(text);
  const parts = [];
  let last = 0;
  matches.forEach((m, mi) => {
    if (m.index > last) parts.push(escHtml(text.slice(last, m.index)));
    const col = MATCH_COLORS[mi % MATCH_COLORS.length];
    const groups = m.groups ? Object.entries(m.groups).map(([k, v]) => `${k}: ${v}`).join(", ") : "";
    const title = groups ? `Match ${mi + 1}: "${m[0]}" (${groups})` : `Match ${mi + 1}: "${m[0]}"`;
    parts.push(
      `<mark class="rx-match" style="background:${col.bg};border-color:${col.border};color:${col.text}" title="${escHtml(title)}" data-idx="${mi}">${escHtml(m[0])}</mark>`
    );
    last = m.index + m[0].length;
  });
  if (last < text.length) parts.push(escHtml(text.slice(last)));
  return parts.join("");
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "&#10;");
}

/* ══════════════════════
   Regex reference data
   ══════════════════════ */
const REFERENCE = [
  {
    group: "Character Classes",
    items: [
      { token: ".",    desc: "Any character except newline" },
      { token: "\\w",  desc: "Word character [a-zA-Z0-9_]" },
      { token: "\\W",  desc: "Non-word character" },
      { token: "\\d",  desc: "Digit [0-9]" },
      { token: "\\D",  desc: "Non-digit" },
      { token: "\\s",  desc: "Whitespace (space, tab, newline)" },
      { token: "\\S",  desc: "Non-whitespace" },
      { token: "[abc]",desc: "Character in set" },
      { token: "[^abc]",desc: "Character NOT in set" },
      { token: "[a-z]",desc: "Character in range" },
    ],
  },
  {
    group: "Anchors",
    items: [
      { token: "^",    desc: "Start of string / line" },
      { token: "$",    desc: "End of string / line" },
      { token: "\\b",  desc: "Word boundary" },
      { token: "\\B",  desc: "Not a word boundary" },
      { token: "\\A",  desc: "Start of string" },
      { token: "\\Z",  desc: "End of string" },
    ],
  },
  {
    group: "Quantifiers",
    items: [
      { token: "*",    desc: "0 or more (greedy)" },
      { token: "+",    desc: "1 or more (greedy)" },
      { token: "?",    desc: "0 or 1 (optional)" },
      { token: "{n}",  desc: "Exactly n times" },
      { token: "{n,}", desc: "n or more times" },
      { token: "{n,m}",desc: "Between n and m times" },
      { token: "*?",   desc: "0 or more (lazy)" },
      { token: "+?",   desc: "1 or more (lazy)" },
    ],
  },
  {
    group: "Groups",
    items: [
      { token: "(abc)",       desc: "Capturing group" },
      { token: "(?:abc)",     desc: "Non-capturing group" },
      { token: "(?<name>abc)",desc: "Named capturing group" },
      { token: "(?=abc)",     desc: "Positive lookahead" },
      { token: "(?!abc)",     desc: "Negative lookahead" },
      { token: "(?<=abc)",    desc: "Positive lookbehind" },
      { token: "(?<!abc)",    desc: "Negative lookbehind" },
      { token: "\\1",         desc: "Backreference to group 1" },
    ],
  },
  {
    group: "Flags",
    items: [
      { token: "g",   desc: "Global — find all matches" },
      { token: "i",   desc: "Case-insensitive" },
      { token: "m",   desc: "Multiline — ^ and $ match line boundaries" },
      { token: "s",   desc: "Dot matches newline (dotAll)" },
      { token: "u",   desc: "Unicode mode" },
      { token: "y",   desc: "Sticky — match from lastIndex" },
    ],
  },
  {
    group: "Common Patterns",
    items: [
      { token: "^[\\w.-]+@[\\w.-]+\\.\\w{2,}$",     desc: "Email address" },
      { token: "https?:\\/\\/[\\w./?#=&%-]+",         desc: "URL" },
      { token: "^\\+?[\\d\\s\\-()]{7,15}$",           desc: "Phone number" },
      { token: "^\\d{4}-\\d{2}-\\d{2}$",              desc: "Date (YYYY-MM-DD)" },
      { token: "#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})",  desc: "Hex color" },
      { token: "^(?=.*[A-Z])(?=.*\\d).{8,}$",         desc: "Strong password" },
      { token: "^\\d{1,3}(\\.\\d{1,3}){3}$",          desc: "IPv4 address" },
      { token: "^[a-z][a-z0-9-]{1,61}[a-z0-9]$",      desc: "Slug / URL-safe string" },
    ],
  },
];

/* ══════════════════
   Preset tests
   ══════════════════ */
const PRESETS = [
  {
    label: "Email",
    pattern: "[\\w.-]+@[\\w.-]+\\.\\w{2,}",
    flags: "g",
    text: "Contact us at hello@shaurya.tools or support@example.com\nInvalid: not-an-email, @missing.com, user@",
  },
  {
    label: "URLs",
    pattern: "https?:\\/\\/[\\w./?#=&%-]+",
    flags: "g",
    text: "Visit https://shaurya.tools or http://example.com/path?q=test&page=1\nNot a URL: ftp://old.com or just example.com",
  },
  {
    label: "Hex Colors",
    pattern: "#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b",
    flags: "g",
    text: "Colors: #ff5733 #FFF #1a2b3c #abc #GGGGGG is invalid\nCSS vars: color: #0f0f0f; background: #f5f5f5;",
  },
  {
    label: "IPv4",
    pattern: "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b",
    flags: "g",
    text: "Server IPs: 192.168.1.1, 10.0.0.255, 172.16.0.1\nInvalid: 999.999.999.999 or 1.2.3",
  },
  {
    label: "Dates",
    pattern: "\\b(\\d{4})-(\\d{2})-(\\d{2})\\b",
    flags: "g",
    text: "Released on 2024-01-15. Updated 2024-06-30.\nBad formats: 24-1-5, 2024/01/15, Jan 15 2024",
  },
  {
    label: "Words",
    pattern: "\\b\\w{5,}\\b",
    flags: "gi",
    text: "The quick brown fox jumps over the lazy dog.\nShort: a be cat dog — Long: programming, regex, testing",
  },
];

const DEFAULT_TEXT = `The quick brown fox jumps over the lazy dog.
Contact: hello@example.com | Phone: +1 (555) 123-4567
Visit https://shaurya.tools for free developer tools.
Colors: #ff5733 and #abc | Date: 2024-01-15
IP: 192.168.1.1 | Price: $29.99 | Version: v2.1.0`;

/* ══════════════════
   Main Component
   ══════════════════ */
export default function RegexTester() {
  const [pattern,   setPattern]   = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags,     setFlags]     = useState("g");
  const [testText,  setTestText]  = useState(DEFAULT_TEXT);
  const [replaceWith, setReplaceWith] = useState("");
  const [activeTab, setActiveTab] = useState("match"); // match | replace
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [refOpen,   setRefOpen]   = useState(null);
  const [hoveredMatch, setHoveredMatch] = useState(null);

  /* ── Build regex + run matches ── */
  const { regex, error, matches, groups } = useMemo(() => {
    if (!pattern) return { regex: null, error: null, matches: [], groups: [] };
    try {
      const safeFlags = flags.includes("g") ? flags : flags + "g";
      const rx = new RegExp(pattern, safeFlags);
      const found = [];
      let m;
      rx.lastIndex = 0;
      while ((m = rx.exec(testText)) !== null) {
        found.push({
          index:  m.index,
          0:      m[0],
          groups: m.groups || null,
          captures: Array.from(m).slice(1),
        });
        if (m[0].length === 0) rx.lastIndex++;
        if (found.length > 500) break;
      }
      // Named groups list
      const namedGroups = found.length && found[0].groups
        ? Object.keys(found[0].groups)
        : [];
      return { regex: rx, error: null, matches: found, groups: namedGroups };
    } catch (e) {
      return { regex: null, error: e.message, matches: [], groups: [] };
    }
  }, [pattern, flags, testText]);

  /* ── Replace ── */
  const replaced = useMemo(() => {
    if (!regex || !replaceWith && replaceWith !== "") return "";
    try {
      const rx = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      return testText.replace(rx, replaceWith);
    } catch { return ""; }
  }, [regex, pattern, flags, testText, replaceWith]);

  /* ── Flag toggle ── */
  const toggleFlag = (f) => {
    setFlags(prev =>
      prev.includes(f)
        ? prev.replace(f, "")
        : prev + f
    );
  };

  /* ── Apply preset ── */
  const applyPreset = (p) => {
    setPattern(p.pattern);
    setFlags(p.flags);
    setTestText(p.text);
    setActiveTab("match");
  };

  /* ── Copy ── */
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const status = error ? "error" : matches.length > 0 ? "match" : pattern ? "nomatch" : "idle";

  const highlightedHtml = useMemo(
    () => buildHighlightedHtml(testText, matches),
    [testText, matches]
  );

  return (
    <>
    <Helmet>
      <title>Free Regex Tester & Debugger Online – Live Match Highlighting</title>
      <meta name="description" content="Build and test regular expressions with live match highlighting, capture groups, and a replace tab. Includes a full reference guide. Free regex tool." />
      <meta name="keywords" content="regex tester, regular expression tester, online regex, regex debugger, regex match, regex validator, javascript regex" />
      <link rel="canonical" href="https://shauryatools.vercel.app/regex-tester" />
    </Helmet>
    <div className="rx-page">
      <div className="rx-inner">

        {/* ── Header ── */}
        <div className="rx-header">
          <div className="rx-icon"><IconRegex /></div>
          <div>
            <span className="rx-cat">Dev Tools</span>
            <h1>Regex Tester</h1>
            <p>Build, test, and debug regular expressions with live match highlighting, capture groups, and replace.</p>
          </div>
        </div>

        {/* ── Presets ── */}
        <div className="rx-presets">
          <span className="rx-presets-label">Presets:</span>
          {PRESETS.map(p => (
            <button key={p.label} className="rx-preset-btn" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ══════════════ TOP SECTION ══════════════ */}
        <div className="rx-top">

          {/* ── Regex input ── */}
          <div className="rx-card rx-regex-card">
            <div className="rx-regex-row">
              <span className="rx-slash">/</span>
              <input
                className={`rx-pattern-input ${error ? "rx-input-err" : pattern && !error ? "rx-input-ok" : ""}`}
                value={pattern}
                onChange={e => setPattern(e.target.value)}
                placeholder="Enter regular expression…"
                spellCheck={false}
              />
              <span className="rx-slash">/</span>
              <div className="rx-flags-input-wrap">
                <input
                  className="rx-flags-input"
                  value={flags}
                  onChange={e => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))}
                  placeholder="flags"
                  maxLength={6}
                  spellCheck={false}
                />
              </div>
              <button
                className="rx-copy-pattern-btn"
                onClick={() => handleCopy(`/${pattern}/${flags}`, "pattern")}
                title="Copy regex"
              >
                {copiedIdx === "pattern" ? <IconCheck /> : <IconCopy />}
              </button>
            </div>

            {/* Flag toggles */}
            <div className="rx-flags-row">
              {[
                { f: "g", label: "g", title: "Global" },
                { f: "i", label: "i", title: "Case-insensitive" },
                { f: "m", label: "m", title: "Multiline" },
                { f: "s", label: "s", title: "Dot-all" },
                { f: "u", label: "u", title: "Unicode" },
                { f: "y", label: "y", title: "Sticky" },
              ].map(({ f, label, title }) => (
                <button
                  key={f}
                  className={`rx-flag-btn ${flags.includes(f) ? "rx-flag-on" : ""}`}
                  onClick={() => toggleFlag(f)}
                  title={title}
                >
                  {label}
                  <span className="rx-flag-title">{title}</span>
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="rx-error-bar">
                <span className="rx-error-dot" />
                {error}
              </div>
            )}

            {/* Status */}
            {!error && (
              <div className={`rx-status-bar rx-status-${status}`}>
                {status === "match"   && <><span className="rx-status-dot" /><span><strong>{matches.length}</strong> match{matches.length !== 1 ? "es" : ""} found</span></>}
                {status === "nomatch" && <><span className="rx-status-dot" /><span>No matches found</span></>}
                {status === "idle"    && <span>Enter a pattern above to start matching</span>}
              </div>
            )}
          </div>

        </div>

        {/* ══════════════ MAIN GRID ══════════════ */}
        <div className="rx-grid">

          {/* ── Left: Test string + highlighted view ── */}
          <div className="rx-col-left">

            {/* Test string editor */}
            <div className="rx-card rx-test-card">
              <div className="rx-card-head">
                <span className="rx-card-title">Test String</span>
                <div className="rx-card-actions">
                  <span className="rx-char-count">{testText.length} chars</span>
                  {testText && (
                    <button className="rx-sm-btn rx-danger" onClick={() => setTestText("")}>
                      <IconTrash />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                className="rx-test-textarea"
                value={testText}
                onChange={e => setTestText(e.target.value)}
                placeholder="Enter test string here…"
                spellCheck={false}
              />
            </div>

            {/* Highlighted view */}
            {matches.length > 0 && (
              <div className="rx-card">
                <div className="rx-card-head">
                  <span className="rx-card-title">Match Highlights</span>
                  <span className="rx-match-count-badge">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
                </div>
                <div
                  className="rx-highlighted"
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              </div>
            )}

            {/* Replace tab */}
            <div className="rx-card">
              <div className="rx-card-head">
                <div className="rx-tabs-mini">
                  <button className={`rx-tab-mini ${activeTab === "match" ? "rx-tab-on" : ""}`} onClick={() => setActiveTab("match")}>Match</button>
                  <button className={`rx-tab-mini ${activeTab === "replace" ? "rx-tab-on" : ""}`} onClick={() => setActiveTab("replace")}>Replace</button>
                </div>
                {activeTab === "replace" && replaced && (
                  <button className="rx-sm-btn" onClick={() => handleCopy(replaced, "replaced")}>
                    {copiedIdx === "replaced" ? <IconCheck /> : <IconCopy />}
                    {copiedIdx === "replaced" ? " Copied!" : " Copy"}
                  </button>
                )}
              </div>

              {activeTab === "match" && (
                <div className="rx-match-summary">
                  {matches.length === 0 && !error && (
                    <p className="rx-no-matches">{pattern ? "No matches in test string." : "Enter a pattern to see matches."}</p>
                  )}
                  {matches.map((m, i) => (
                    <div key={i} className={`rx-match-item ${hoveredMatch === i ? "rx-match-hover" : ""}`}>
                      <div className="rx-match-header">
                        <span className="rx-match-num" style={{ background: MATCH_COLORS[i % MATCH_COLORS.length].bg, color: MATCH_COLORS[i % MATCH_COLORS.length].text, borderColor: MATCH_COLORS[i % MATCH_COLORS.length].border }}>
                          {i + 1}
                        </span>
                        <code className="rx-match-value">"{m[0]}"</code>
                        <span className="rx-match-pos">@ {m.index}</span>
                        <button className="rx-sm-btn" onClick={() => handleCopy(m[0], `m${i}`)}>
                          {copiedIdx === `m${i}` ? <IconCheck /> : <IconCopy />}
                        </button>
                      </div>
                      {/* Capture groups */}
                      {m.captures.some(c => c !== undefined) && (
                        <div className="rx-groups">
                          {m.captures.map((cap, gi) => (
                            <span key={gi} className="rx-group-chip">
                              <span className="rx-group-idx">Group {gi + 1}</span>
                              <span className="rx-group-val">{cap ?? <em>undefined</em>}</span>
                            </span>
                          ))}
                          {m.groups && Object.entries(m.groups).map(([name, val]) => (
                            <span key={name} className="rx-group-chip rx-group-named">
                              <span className="rx-group-idx">{name}</span>
                              <span className="rx-group-val">{val ?? <em>undefined</em>}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "replace" && (
                <div className="rx-replace-section">
                  <div className="rx-replace-input-wrap">
                    <label className="rx-replace-label">Replace with</label>
                    <input
                      className="rx-replace-input"
                      value={replaceWith}
                      onChange={e => setReplaceWith(e.target.value)}
                      placeholder="Replacement string… ($1 for group 1, $& for full match)"
                    />
                  </div>
                  {replaced && (
                    <pre className="rx-replaced-output">{replaced}</pre>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── Right: Reference ── */}
          <div className="rx-col-right">
            <div className="rx-card rx-ref-card">
              <div className="rx-card-head">
                <span className="rx-card-title">Quick Reference</span>
              </div>
              <div className="rx-ref-body">
                {REFERENCE.map((section) => (
                  <div key={section.group} className="rx-ref-section">
                    <button
                      className="rx-ref-toggle"
                      onClick={() => setRefOpen(o => o === section.group ? null : section.group)}
                    >
                      <span>{section.group}</span>
                      <IconChevron open={refOpen === section.group} />
                    </button>
                    {refOpen === section.group && (
                      <div className="rx-ref-items">
                        {section.items.map(item => (
                          <div key={item.token} className="rx-ref-item">
                            <button
                              className="rx-ref-token"
                              title="Click to insert"
                              onClick={() => {
                                setPattern(prev => prev + item.token);
                              }}
                            >
                              {item.token}
                            </button>
                            <span className="rx-ref-desc">{item.desc}</span>
                            <button
                              className="rx-ref-copy"
                              onClick={() => handleCopy(item.token, item.token)}
                              title="Copy"
                            >
                              {copiedIdx === item.token ? <IconCheck /> : <IconCopy />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
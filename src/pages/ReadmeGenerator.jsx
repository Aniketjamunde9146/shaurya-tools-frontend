/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./ReadmeGenerator.css";
import { Helmet } from "react-helmet";

const SECTIONS = [
  { id: "description",  label: "Description",  default: true  },
  { id: "install",      label: "Installation", default: true  },
  { id: "usage",        label: "Usage",        default: true  },
  { id: "features",     label: "Features",     default: true  },
  { id: "tech",         label: "Tech Stack",   default: true  },
  { id: "contributing", label: "Contributing", default: false },
  { id: "license",      label: "License",      default: false },
  { id: "badges",       label: "Badges",       default: false },
];

/* ── Icons ── */
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
const IconGithub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IconFork = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
    <path d="M18 9v2a2 2 0 01-2 2H8a2 2 0 01-2-2V9M12 15v-3"/>
  </svg>
);

/* ── Helpers ── */
function parseGithubUrl(url) {
  try {
    const clean = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
    const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) return { owner: match[1], repo: match[2] };
  } catch {}
  return null;
}

function getUrlState(url) {
  if (!url.trim()) return "empty";
  if (url.includes("github.com/") && parseGithubUrl(url)) return "valid";
  return "invalid";
}

/* ── Component ── */
export default function ReadmeGenerator() {
  const [url,        setUrl]        = useState("");
  const [sections,   setSections]   = useState(
    new Set(SECTIONS.filter(s => s.default).map(s => s.id))
  );
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [result,     setResult]     = useState("");
  const [repoInfo,   setRepoInfo]   = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [activeTab,  setActiveTab]  = useState("preview");

  const urlState = getUrlState(url);

  const toggleSection = (id) => {
    setSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSections(new Set(SECTIONS.map(s => s.id)));
  const clearAll  = () => setSections(new Set());

  async function handleGenerate() {
    const parsed = parseGithubUrl(url);
    if (!parsed) { setFetchError("Please enter a valid GitHub repository URL."); return; }
    if (sections.size === 0) { setFetchError("Please select at least one section."); return; }

    setLoading(true);
    setFetchError("");
    setResult("");
    setRepoInfo(null);

    try {
      const apiUrl   = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
      const repoRes  = await fetch(apiUrl);

      let repoData      = {};
      let languagesData = {};
      let packageJson   = null;

      if (repoRes.ok) {
        repoData = await repoRes.json();
        if (repoData.message === "Not Found") throw new Error("Repo not found");

        try {
          const langRes = await fetch(`${apiUrl}/languages`);
          if (langRes.ok) languagesData = await langRes.json();
        } catch {}

        // Try main then master for package.json
        for (const branch of ["main", "master"]) {
          try {
            const pkgRes = await fetch(
              `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/package.json`
            );
            if (pkgRes.ok) { packageJson = await pkgRes.json(); break; }
          } catch {}
        }

        setRepoInfo({
          name:        repoData.name,
          owner:       parsed.owner,
          description: repoData.description,
          stars:       repoData.stargazers_count,
          forks:       repoData.forks_count,
          language:    repoData.language,
          topics:      repoData.topics || [],
          url:         repoData.html_url,
          license:     repoData.license?.spdx_id,
        });
      } else {
        throw new Error("Could not fetch repository.");
      }

      const selectedSections = SECTIONS.filter(s => sections.has(s.id)).map(s => s.label);

      const contextLines = [
        `Repository: ${parsed.owner}/${parsed.repo}`,
        repoData.description        ? `Description: ${repoData.description}` : "",
        repoData.language           ? `Primary language: ${repoData.language}` : "",
        Object.keys(languagesData).length ? `Languages used: ${Object.keys(languagesData).join(", ")}` : "",
        repoData.topics?.length     ? `Topics/tags: ${repoData.topics.join(", ")}` : "",
        repoData.license?.name      ? `License: ${repoData.license.name}` : "",
        packageJson?.dependencies   ? `Dependencies: ${Object.keys(packageJson.dependencies).slice(0, 14).join(", ")}` : "",
        packageJson?.devDependencies? `Dev Dependencies: ${Object.keys(packageJson.devDependencies).slice(0, 8).join(", ")}` : "",
        packageJson?.scripts        ? `Scripts: ${Object.keys(packageJson.scripts).join(", ")}` : "",
      ].filter(Boolean).join("\n");

      const msg = `You are an expert technical writer. Generate a professional, comprehensive README.md file.

Repository info:
${contextLines}

Include ONLY these sections: ${selectedSections.join(", ")}

STRICT RULES:
• Output ONLY the raw markdown. Nothing else before or after.
• Use proper markdown headings, code blocks, and formatting.
• Make it genuinely useful — not generic filler.
• Use the actual repo name and details throughout.
• For code examples, use the correct language syntax highlighting.
• Keep it clean, well-structured, and developer-friendly.`;

     const res = await generateAI("readme", msg);

if (!res.data.success) {
  throw new Error("AI generation failed");
}

let raw = res.data.data.trim();

raw = raw
  .replace(/^```markdown\n?/, "")
  .replace(/^```\n?/, "")
  .replace(/\n?```$/, "")
  .trim();

setResult(raw);
setActiveTab("preview");


    } catch (e) {
      setFetchError(
        e.message === "Repo not found"
          ? "Repository not found. Make sure it's public and the URL is correct."
          : "Could not fetch repository data. Check the URL and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    const blob = new Blob([result], { type: "text/markdown" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setUrl(""); setResult(""); setFetchError(""); setRepoInfo(null); setCopied(false);
  }

  return (
    <>
    <Helmet>
      <title>Free GitHub README Generator – Professional README.md | ShauryaTools</title>
      <meta name="description" content="Generate a professional, well-structured GitHub README.md file instantly. Add badges, installation steps, usage, and contributing sections. Free." />
      <meta name="keywords" content="readme generator, github readme, readme.md generator, markdown readme, github project readme, open source readme" />
      <link rel="canonical" href="https://shauryatools.vercel.app/readme-generator" />
    </Helmet>
    <div className="rg-page">
      <div className="rg-inner">

        {/* ── Header ── */}
        <div className="rg-header">
          <div className="rg-icon"><IconGithub /></div>
          <div>
            <span className="rg-cat">Developer Tools</span>
            <h1>README Generator</h1>
            <p>Paste a GitHub repo URL — get a professional README.md instantly.</p>
          </div>
        </div>

        {/* ── Input Card ── */}
        <div className="rg-card">

          {/* URL Field */}
          <div className="rg-field">
            <div className="rg-label-row">
              <label className="rg-label">GitHub Repository URL</label>
              {urlState === "valid"   && <span className="rg-url-badge rg-url-ok">✓ Valid repo URL</span>}
              {urlState === "invalid" && <span className="rg-url-badge rg-url-bad">✗ Invalid URL</span>}
            </div>
            <div className="rg-url-wrap">
              <span className="rg-url-prefix"><IconGithub /></span>
              <input
                className={`rg-url-input ${urlState === "invalid" ? "rg-input-err" : urlState === "valid" ? "rg-input-ok" : ""}`}
                value={url}
                onChange={e => { setUrl(e.target.value); setFetchError(""); }}
                onKeyDown={e => e.key === "Enter" && urlState === "valid" && handleGenerate()}
                placeholder="https://github.com/username/repository"
                autoFocus
              />
              {url && (
                <button className="rg-clear" onClick={() => { setUrl(""); setFetchError(""); }}>✕</button>
              )}
            </div>
            {fetchError && (
              <div className="rg-error-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {fetchError}
              </div>
            )}
          </div>

          <div className="rg-divider" />

          {/* Sections */}
          <div className="rg-field">
            <div className="rg-label-row">
              <label className="rg-label">Sections to include</label>
              <div className="rg-sec-actions">
                <button className="rg-text-btn" onClick={selectAll}>All</button>
                <span className="rg-dot">·</span>
                <button className="rg-text-btn" onClick={clearAll}>None</button>
              </div>
            </div>
            <div className="rg-sections">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={`rg-section-btn ${sections.has(s.id) ? "rg-sec-on" : ""}`}
                  onClick={() => toggleSection(s.id)}
                >
                  {sections.has(s.id) && <IconCheck />}
                  {s.label}
                </button>
              ))}
            </div>
            <p className="rg-hint">
              {sections.size === 0
                ? "⚠️ Select at least one section"
                : `${sections.size} of ${SECTIONS.length} sections selected`}
            </p>
          </div>

          {/* Generate */}
          <button
            className="rg-gen-btn"
            onClick={handleGenerate}
            disabled={loading || urlState !== "valid" || sections.size === 0}
          >
            {loading ? (
              <><span className="rg-spinner" /> Generating README...</>
            ) : (
              <><IconGithub /> Generate README</>
            )}
          </button>
        </div>

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="rg-card rg-skeleton-card animate-in">
            <div className="rg-skel rg-skel-title" />
            <div className="rg-skel rg-skel-line" />
            <div className="rg-skel rg-skel-line rg-skel-short" />
            <div className="rg-skel rg-skel-line" />
            <div className="rg-skel rg-skel-block" />
            <div className="rg-skel rg-skel-line rg-skel-short" />
            <div className="rg-skel rg-skel-line" />
          </div>
        )}

        {/* ── Repo Banner ── */}
        {repoInfo && !loading && (
          <div className="rg-repo-banner animate-in">
            <div className="rg-repo-left">
              <a
                className="rg-repo-name"
                href={repoInfo.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {repoInfo.owner} / {repoInfo.name}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
              {repoInfo.description && <span className="rg-repo-desc">{repoInfo.description}</span>}
            </div>
            <div className="rg-repo-right">
              {repoInfo.language && <span className="rg-repo-tag">{repoInfo.language}</span>}
              {repoInfo.stars > 0 && (
                <span className="rg-repo-tag rg-tag-star">
                  <IconStar /> {repoInfo.stars.toLocaleString()}
                </span>
              )}
              {repoInfo.forks > 0 && (
                <span className="rg-repo-tag rg-tag-fork">
                  <IconFork /> {repoInfo.forks.toLocaleString()}
                </span>
              )}
              {repoInfo.license && <span className="rg-repo-tag">{repoInfo.license}</span>}
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <div className="rg-card animate-in">

            {/* Sticky top bar */}
            <div className="rg-result-top">
              <div className="rg-tabs">
                <button
                  className={`rg-tab ${activeTab === "preview" ? "rg-tab-on" : ""}`}
                  onClick={() => setActiveTab("preview")}
                >Preview</button>
                <button
                  className={`rg-tab ${activeTab === "raw" ? "rg-tab-on" : ""}`}
                  onClick={() => setActiveTab("raw")}
                >Raw Markdown</button>
              </div>
              <div className="rg-actions">
                <button className="rg-action-btn" onClick={handleReset} title="Start over">
                  <IconRefresh /> New
                </button>
                <button className="rg-action-btn" onClick={handleDownload} title="Download README.md">
                  <IconDownload /> Download
                </button>
                <button className={`rg-copy-btn ${copied ? "rg-copied" : ""}`} onClick={handleCopy}>
                  {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                </button>
              </div>
            </div>

            {activeTab === "preview" && (
              <div className="rg-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
            )}

            {activeTab === "raw" && (
              <pre className="rg-raw">{result}</pre>
            )}

            {/* Word count footer */}
            <div className="rg-result-footer">
              <span className="rg-word-count">
                ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
              </span>
              <button className={`rg-copy-full ${copied ? "rg-copied" : ""}`} onClick={handleCopy}>
                {copied ? <><IconCheck /> Copied to clipboard!</> : <><IconCopy /> Copy README.md</>}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  );
}

/* ── Markdown renderer (fixed list handling) ── */
function renderMarkdown(md) {
  // We process line by line for accuracy
  const lines  = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n");

  const output   = [];
  let inCode     = false;
  let codeLang   = "";
  let codeLines  = [];
  let inList     = false;
  let listItems  = [];
  let listOrdered= false;

  const flushList = () => {
    if (!listItems.length) return;
    const tag = listOrdered ? "ol" : "ul";
    output.push(`<${tag}>${listItems.map(li => `<li>${li}</li>`).join("")}</${tag}>`);
    listItems = [];
    inList    = false;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code block toggle
    if (/^```/.test(line)) {
      if (!inCode) {
        flushList();
        inCode   = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        output.push(
          `<pre class="rg-code-block"><code class="lang-${codeLang}">${codeLines.join("\n")}</code></pre>`
        );
        inCode = false;
      }
      continue;
    }

    if (inCode) { codeLines.push(line); continue; }

    // HR
    if (/^-{3,}$/.test(line.trim())) { flushList(); output.push("<hr />"); continue; }

    // Headings
    const hm = line.match(/^(#{1,3}) (.+)$/);
    if (hm) {
      flushList();
      const lvl = hm[1].length;
      const txt = inline(hm[2]);
      output.push(`<h${lvl}>${txt}</h${lvl}>`);
      continue;
    }

    // Blockquote
    if (/^&gt; /.test(line)) {
      flushList();
      output.push(`<blockquote>${inline(line.slice(5))}</blockquote>`);
      continue;
    }

    // Unordered list
    const ulm = line.match(/^[\-\*] (.+)$/);
    if (ulm) {
      if (inList && listOrdered) flushList();
      inList = true; listOrdered = false;
      listItems.push(inline(ulm[1]));
      continue;
    }

    // Ordered list
    const olm = line.match(/^\d+\. (.+)$/);
    if (olm) {
      if (inList && !listOrdered) flushList();
      inList = true; listOrdered = true;
      listItems.push(inline(olm[1]));
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      output.push("");
      continue;
    }

    // Paragraph
    flushList();
    output.push(`<p>${inline(line)}</p>`);
  }

  flushList();

  return output.filter(Boolean).join("\n");
}

function inline(text) {
  return text
    // Inline code (before bold/italic to avoid conflicts)
    .replace(/`([^`]+)`/g, `<code class="rg-inline-code">$1</code>`)
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Image (before link)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, `<img alt="$1" src="$2" class="rg-img" />`)
    // Link
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}
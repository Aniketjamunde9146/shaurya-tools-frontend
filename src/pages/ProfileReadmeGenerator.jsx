/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./ProfileReadmeGenerator.css";
import { Helmet } from "react-helmet";

/* ══════════════════
   Sections config
   ══════════════════ */
const SECTIONS = [
  { id: "intro",        label: "Intro & Tagline",      default: true  },
  { id: "about",        label: "About Me",             default: true  },
  { id: "skills",       label: "Skills & Languages",   default: true  },
  { id: "stats",        label: "GitHub Stats",         default: true  },
  { id: "streak",       label: "Streak Stats",         default: true  },
  { id: "top_repos",    label: "Top Repositories",     default: true  },
  { id: "badges",       label: "Badges",               default: true  },
  { id: "trophies",     label: "Trophies",             default: false },
  { id: "social",       label: "Social Links",         default: false },
  { id: "visitor",      label: "Visitor Counter",      default: false },
  { id: "contributions",label: "Activity Graph",       default: false },
  { id: "quote",        label: "Dev Quote",            default: false },
];

const STYLES = [
  { id: "minimal",   label: "Minimal",   emoji: "🤍" },
  { id: "vibrant",   label: "Vibrant",   emoji: "🌈" },
  { id: "dark",      label: "Dark Mode", emoji: "🌑" },
  { id: "corporate", label: "Corporate", emoji: "💼" },
  { id: "creative",  label: "Creative",  emoji: "🎨" },
];

const STAT_THEMES = ["default", "dark", "radical", "merko", "gruvbox", "tokyonight", "onedark", "cobalt", "synthwave", "highcontrast", "dracula"];

/* ── Icons ── */
const IconGithub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
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
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IconLink = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ══════════════════
   Helpers
   ══════════════════ */
function cleanUsername(input) {
  const stripped = input.trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/$/, "")
    .split("/")[0];
  return stripped;
}

function isValidUsername(u) {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(u);
}

/* ══════════════════
   Markdown renderer
   ══════════════════ */
function renderMarkdown(md) {
  const lines = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n");

  const output    = [];
  let inCode      = false;
  let codeLang    = "";
  let codeLines   = [];
  let inList      = false;
  let listItems   = [];
  let listOrdered = false;

  const flushList = () => {
    if (!listItems.length) return;
    const tag = listOrdered ? "ol" : "ul";
    output.push(`<${tag}>${listItems.map(li => `<li>${li}</li>`).join("")}</${tag}>`);
    listItems = []; inList = false;
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (!inCode) {
        flushList();
        inCode = true; codeLang = line.slice(3).trim(); codeLines = [];
      } else {
        output.push(`<pre class="pg-code-block"><code class="lang-${codeLang}">${codeLines.join("\n")}</code></pre>`);
        inCode = false;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (/^-{3,}$/.test(line.trim())) { flushList(); output.push("<hr />"); continue; }

    const hm = line.match(/^(#{1,3}) (.+)$/);
    if (hm) {
      flushList();
      output.push(`<h${hm[1].length}>${inline(hm[2])}</h${hm[1].length}>`);
      continue;
    }

    if (/^&gt; /.test(line)) {
      flushList();
      output.push(`<blockquote>${inline(line.slice(5))}</blockquote>`);
      continue;
    }

    // Table row detection
    if (/^\|/.test(line)) {
      flushList();
      if (/^\|[-| :]+\|$/.test(line)) { output.push("<thead-sep />"); continue; }
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      output.push(`<tr>${cells.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`);
      continue;
    }

    const ulm = line.match(/^[-*] (.+)$/);
    if (ulm) {
      if (inList && listOrdered) flushList();
      inList = true; listOrdered = false;
      listItems.push(inline(ulm[1]));
      continue;
    }

    const olm = line.match(/^\d+\. (.+)$/);
    if (olm) {
      if (inList && !listOrdered) flushList();
      inList = true; listOrdered = true;
      listItems.push(inline(olm[1]));
      continue;
    }

    if (!line.trim()) { flushList(); output.push(""); continue; }

    flushList();
    output.push(`<p>${inline(line)}</p>`);
  }

  flushList();

  // Post-process table rows
  let html = output.filter(Boolean).join("\n");
  html = html.replace(/(<tr>.*?<\/tr>\n?)+/gs, match => `<table>${match}</table>`);

  return html;
}

function inline(text) {
  return text
    .replace(/`([^`]+)`/g, `<code class="pg-inline-code">$1</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, `<img alt="$1" src="$2" style="max-width:100%;height:auto;border-radius:6px;" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

/* ══════════════════
   Main Component
   ══════════════════ */
export default function ProfileReadmeGenerator() {
  const [rawInput,   setRawInput]   = useState("");
  const [sections,   setSections]   = useState(new Set(SECTIONS.filter(s => s.default).map(s => s.id)));
  const [style,      setStyle]      = useState("minimal");
  const [statTheme,  setStatTheme]  = useState("tokyonight");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [result,     setResult]     = useState("");
  const [profile,    setProfile]    = useState(null);
  const [activeTab,  setActiveTab]  = useState("preview");
  const [copied,     setCopied]     = useState(false);

  /* ── Derived username ── */
  const username    = cleanUsername(rawInput);
  const inputState  = !rawInput.trim() ? "empty" : isValidUsername(username) ? "valid" : "invalid";

  /* ── Section toggles ── */
  const toggleSection = (id) => setSections(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const selectAll = () => setSections(new Set(SECTIONS.map(s => s.id)));
  const clearAll  = () => setSections(new Set());

  /* ── Generate ── */
  async function handleGenerate() {
    if (inputState !== "valid" || sections.size === 0) return;

    setLoading(true);
    setError("");
    setResult("");
    setProfile(null);

    try {
      /* 1 — Fetch GitHub profile */
      const profileRes = await fetch(`https://api.github.com/users/${username}`);
      if (!profileRes.ok) throw new Error(profileRes.status === 404 ? "not_found" : "fetch_fail");
      const profileData = await profileRes.json();

      /* 2 — Fetch top repos (sorted by stars) */
      let topRepos = [];
      try {
        const reposRes = await fetch(
          `https://api.github.com/users/${username}/repos?sort=stargazers&per_page=6&type=owner`
        );
        if (reposRes.ok) {
          const reposData = await reposRes.json();
          topRepos = reposData.map(r => ({
            name:        r.name,
            description: r.description,
            stars:       r.stargazers_count,
            forks:       r.forks_count,
            language:    r.language,
            url:         r.html_url,
          }));
        }
      } catch {}

      /* 3 — Aggregate languages across repos */
      let langMap = {};
      try {
        const allReposRes = await fetch(
          `https://api.github.com/users/${username}/repos?per_page=30&sort=pushed`
        );
        if (allReposRes.ok) {
          const allRepos = await allReposRes.json();
          allRepos.forEach(r => {
            if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
          });
        }
      } catch {}

      const topLanguages = Object.entries(langMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([lang]) => lang);

      const totalStars = topRepos.reduce((acc, r) => acc + r.stars, 0);

      setProfile({
        username:   profileData.login,
        name:       profileData.name || profileData.login,
        bio:        profileData.bio,
        avatar:     profileData.avatar_url,
        url:        profileData.html_url,
        followers:  profileData.followers,
        following:  profileData.following,
        repos:      profileData.public_repos,
        company:    profileData.company,
        location:   profileData.location,
        blog:       profileData.blog,
        twitter:    profileData.twitter_username,
        totalStars,
      });

      /* 4 — Build prompt */
      const selectedSections = SECTIONS.filter(s => sections.has(s.id)).map(s => s.label);

      const contextLines = [
        `GitHub Username: ${profileData.login}`,
        profileData.name         ? `Full Name: ${profileData.name}` : "",
        profileData.bio           ? `Bio: ${profileData.bio}` : "",
        profileData.location      ? `Location: ${profileData.location}` : "",
        profileData.company       ? `Company: ${profileData.company}` : "",
        profileData.blog          ? `Website: ${profileData.blog}` : "",
        profileData.twitter_username ? `Twitter: @${profileData.twitter_username}` : "",
        `Public Repos: ${profileData.public_repos}`,
        `Followers: ${profileData.followers} | Following: ${profileData.following}`,
        topLanguages.length       ? `Top Languages (by repo count): ${topLanguages.join(", ")}` : "",
        topRepos.length           ? `Top Repos by Stars: ${topRepos.map(r => `${r.name} (⭐${r.stars}${r.language ? ", " + r.language : ""})`).join(" | ")}` : "",
        `Total Stars Across Top Repos: ${totalStars}`,
        `Profile Style: ${style}`,
        `GitHub Stats Card Theme: ${statTheme}`,
      ].filter(Boolean).join("\n");

      const shieldsExamples = `
Shields.io badge format: ![Label](https://img.shields.io/badge/Label-Value-color?style=for-the-badge&logo=logoname&logoColor=white)
GitHub Stats: ![Stats](https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=${statTheme}&count_private=true)
Top Languages: ![Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=${statTheme})
Streak Stats: ![Streak](https://github-readme-streak-stats.herokuapp.com/?user=${username}&theme=${statTheme})
Trophy: ![Trophy](https://github-profile-trophy.vercel.app/?username=${username}&theme=${statTheme === "default" ? "flat" : statTheme}&no-frame=true&row=1&column=7)
Activity Graph: ![Activity](https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=${statTheme === "tokyonight" ? "tokyo-night" : statTheme})
Visitor Badge: ![Visitors](https://komarev.com/ghpvc/?username=${username}&color=rose&style=flat-square)
Dev Quote: ![Quote](https://quotes-github-readme.vercel.app/api?type=horizontal&theme=${statTheme})`;

      const prompt = `You are an expert GitHub profile README writer. Generate a world-class, visually stunning GitHub profile README.md.

Developer Info:
${contextLines}

Sections to include: ${selectedSections.join(", ")}

Dynamic badge/widget URLs to embed where relevant:
${shieldsExamples}

STYLE GUIDE for "${style}" style:
${style === "minimal"   ? "Clean and elegant. Mostly text, one or two stat cards, subtle badges. No clutter. Let the work speak." : ""}
${style === "vibrant"   ? "Colorful! Use multiple animated badges, all stat widgets, emoji section headers, wave dividers, typing SVGs. Make it pop." : ""}
${style === "dark"      ? "Dark aesthetic with dark-themed stat cards. Use high-contrast badges. Sleek and mysterious." : ""}
${style === "corporate" ? "Professional and polished. Focus on skills, experience, current work. Clean badge rows. No excess emojis." : ""}
${style === "creative"  ? "Unique layout with ASCII art touches, creative section dividers, personality-forward writing. Stand out." : ""}

STRICT RULES:
• Output ONLY raw markdown. Absolutely nothing before or after — no preamble, no explanation.
• Use actual dynamic URLs for every badge, stat card, streak widget — embed them properly as markdown images.
• Use real shields.io badges for languages and tools (match to the developer's actual languages: ${topLanguages.join(", ")}).
• Section headers should use emoji + text for personality.
• Make the intro section genuinely engaging — not generic filler.
• Align stat cards side-by-side using HTML image tags when possible for layout.
• Use [![badge](url)](link) pattern so badges are also clickable.
• The README should make visitors want to explore this developer's work.`;

      /* 5 — Call AI */
      const res = await generateAI("profile_readme", prompt);

      if (!res.data.success) throw new Error("ai_fail");

      let raw = res.data.data.trim()
        .replace(/^```markdown\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "")
        .trim();

      setResult(raw);
      setActiveTab("preview");

    } catch (e) {
      const msg = e.message;
      setError(
        msg === "not_found"
          ? "GitHub user not found. Double-check the username."
          : msg === "ai_fail"
          ? "AI generation failed. Please try again."
          : "Could not fetch GitHub data. Check the username and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ── Copy / Download ── */
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
    setRawInput(""); setResult(""); setError(""); setProfile(null); setCopied(false);
  }

  /* ── Render ── */
  return (
    <>
    <Helmet>
      <title>Free GitHub Profile README Generator – Badges, Stats & Trophies</title>
      <meta name="description" content="Generate a stunning GitHub profile README with stats, streak badges, trophies, and language bars. Enter any GitHub username and get markdown instantly." />
      <meta name="keywords" content="github profile readme generator, github readme, github stats badge, github profile generator, readme md generator, github bio" />
      <link rel="canonical" href="https://shauryatools.vercel.app/github-profile-readme-generator" />
    </Helmet>
    <div className="pg-page">
      <div className="pg-inner">

        {/* ── Header ── */}
        <div className="pg-header">
          <div className="pg-icon"><IconGithub /></div>
          <div>
            <span className="pg-cat">Dev Tools</span>
            <h1>GitHub Profile README Generator</h1>
            <p>Enter a GitHub username — get a stunning, badge-rich profile README with stats, streaks, and trophies.</p>
          </div>
        </div>

        {/* ── Input Card ── */}
        <div className="pg-card">
          <div className="pg-input-body">

            {/* Username */}
            <div className="pg-username-row">
              <div className="pg-label-row">
                <label className="pg-label">GitHub Username</label>
                {inputState === "valid"   && <span className="pg-badge pg-badge-ok">✓ Valid username</span>}
                {inputState === "invalid" && <span className="pg-badge pg-badge-bad">✗ Invalid username</span>}
              </div>
              <div className={`pg-input-wrap ${inputState === "invalid" ? "err" : inputState === "valid" ? "ok" : ""}`}>
                <span className="pg-input-prefix">github.com/</span>
                <input
                  className="pg-username-input"
                  value={rawInput}
                  onChange={e => { setRawInput(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && inputState === "valid" && handleGenerate()}
                  placeholder="torvalds"
                  autoFocus
                  spellCheck={false}
                />
                {rawInput && (
                  <button className="pg-input-clear" onClick={() => { setRawInput(""); setError(""); }}>✕</button>
                )}
              </div>
              {error && (
                <div className="pg-error-msg">
                  <IconAlert /> {error}
                </div>
              )}
            </div>

            <hr className="pg-divider" />

            {/* Sections */}
            <div className="pg-sections-wrap">
              <div className="pg-label-row">
                <span className="pg-label">Sections to Include</span>
                <div className="pg-sec-actions">
                  <button className="pg-text-btn" onClick={selectAll}>All</button>
                  <span className="pg-dot">·</span>
                  <button className="pg-text-btn" onClick={clearAll}>None</button>
                </div>
              </div>
              <div className="pg-sections">
                {SECTIONS.map(s => (
                  <button
                    key={s.id}
                    className={`pg-sec-btn ${sections.has(s.id) ? "pg-sec-on" : ""}`}
                    onClick={() => toggleSection(s.id)}
                  >
                    {sections.has(s.id) && <IconCheck />}
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="pg-hint">
                {sections.size === 0
                  ? "⚠️ Select at least one section"
                  : `${sections.size} of ${SECTIONS.length} sections selected`}
              </p>
            </div>

            <hr className="pg-divider" />

            {/* Style */}
            <div className="pg-style-row">
              <span className="pg-label">README Style</span>
              <div className="pg-styles">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    className={`pg-style-btn ${style === s.id ? "pg-style-on" : ""}`}
                    onClick={() => setStyle(s.id)}
                  >
                    <span className="pg-style-emoji">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat card theme */}
            <div className="pg-style-row">
              <div className="pg-label-row">
                <span className="pg-label">Stats Card Theme</span>
                <span style={{ fontSize: "0.7rem", color: "var(--grey-3)", fontWeight: 500 }}>
                  github-readme-stats theme
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STAT_THEMES.map(t => (
                  <button
                    key={t}
                    className={`pg-sec-btn ${statTheme === t ? "pg-sec-on" : ""}`}
                    style={{ fontSize: "0.7rem", padding: "4px 10px" }}
                    onClick={() => setStatTheme(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <hr className="pg-divider" />

            {/* Generate button */}
            <button
              className="pg-gen-btn"
              onClick={handleGenerate}
              disabled={loading || inputState !== "valid" || sections.size === 0}
            >
              {loading
                ? <><span className="pg-spinner" /> Generating Profile README…</>
                : <><IconGithub /> Generate Profile README</>
              }
            </button>

          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="pg-card pg-skeleton-card animate-in">
            <div className="pg-skel pg-skel-title" />
            <div className="pg-skel pg-skel-line" />
            <div className="pg-skel pg-skel-short pg-skel-line" />
            <div className="pg-skel pg-skel-block" />
            <div className="pg-skel pg-skel-line" />
            <div className="pg-skel pg-skel-short pg-skel-line" />
          </div>
        )}

        {/* ── Profile banner ── */}
        {profile && !loading && (
          <div className="pg-profile-banner animate-in">
            <img className="pg-profile-avatar" src={profile.avatar} alt={profile.name} />
            <div className="pg-profile-info">
              <a className="pg-profile-name" href={profile.url} target="_blank" rel="noopener noreferrer">
                {profile.name}
                {profile.name !== profile.username && (
                  <span style={{ fontWeight: 400, color: "var(--grey-3)" }}>  @{profile.username}</span>
                )}
                <IconLink />
              </a>
              {profile.bio && <div className="pg-profile-bio">{profile.bio}</div>}
            </div>
            <div className="pg-profile-stats">
              <span className="pg-profile-stat pg-stat-repo">
                📁 {profile.repos} repos
              </span>
              <span className="pg-profile-stat pg-stat-follow">
                👥 {profile.followers.toLocaleString()} followers
              </span>
              {profile.totalStars > 0 && (
                <span className="pg-profile-stat pg-stat-star">
                  <IconStar /> {profile.totalStars.toLocaleString()} stars
                </span>
              )}
              {profile.location && (
                <span className="pg-profile-stat">📍 {profile.location}</span>
              )}
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <div className="pg-card animate-in">

            {/* Sticky top bar */}
            <div className="pg-result-top">
              <div className="pg-tabs">
                <button className={`pg-tab ${activeTab === "preview" ? "pg-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>
                  Preview
                </button>
                <button className={`pg-tab ${activeTab === "raw" ? "pg-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>
                  Raw Markdown
                </button>
              </div>
              <div className="pg-actions">
                <button className="pg-action-btn" onClick={handleReset}>
                  <IconRefresh /> New
                </button>
                <button className="pg-action-btn" onClick={handleDownload}>
                  <IconDownload /> Download
                </button>
                <button className={`pg-copy-btn ${copied ? "pg-copied" : ""}`} onClick={handleCopy}>
                  {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                </button>
              </div>
            </div>

            {activeTab === "preview" && (
              <div className="pg-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
            )}

            {activeTab === "raw" && (
              <pre className="pg-raw">{result}</pre>
            )}

            {/* Footer */}
            <div className="pg-result-footer">
              <span className="pg-word-count">
                ~{result.split(/\s+/).filter(Boolean).length} words · {result.split("\n").length} lines
              </span>
              <button className={`pg-copy-full ${copied ? "pg-copied" : ""}`} onClick={handleCopy}>
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
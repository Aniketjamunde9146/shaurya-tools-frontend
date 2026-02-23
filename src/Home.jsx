/* eslint-disable react-refresh/only-export-components */
import React, { useState, useMemo } from "react";
import { tools } from "./data/toolsData";
import { iconMap } from "./data/svgdata";
import { Link } from "react-router-dom";
import "./Home.css";
import { Helmet } from "react-helmet";

const CATEGORY_META = {
  "AI Tools": {
    bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe",
    accent: "#2563eb", dot: "#60a5fa",
    label: "AI Tools",
  },
  "Social": {
    bg: "#fff7ed", color: "#ea580c", border: "#fed7aa",
    accent: "#ea580c", dot: "#fb923c",
    label: "Social",
  },
  "Utility": {
    bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0",
    accent: "#16a34a", dot: "#4ade80",
    label: "Utility",
  },
  "Dev Tools": {
    bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe",
    accent: "#7c3aed", dot: "#a78bfa",
    label: "Dev Tools",
  },
};

const ALL_CATEGORIES = ["All", ...Object.keys(CATEGORY_META)];

const STATS = [
  { value: "99+", label: "Free tools" },
  { value: "0",   label: "Sign-ups needed" },
  { value: "∞",   label: "Uses per day" },
];

const Home = () => {
  const [search,   setSearch]   = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filtered = useMemo(() => {
    return tools.filter(t => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeTab === "All" || t.category === activeTab;
      return matchSearch && matchCat;
    });
  }, [search, activeTab]);

  const groupedByCategory = useMemo(() => {
    if (search || activeTab !== "All") return null;
    const groups = {};
    tools.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [search, activeTab]);

  const showGrouped = groupedByCategory !== null;

  return (
    <>
      <Helmet>
        <title>ShauryaTools – Free Online Developer & Creator Tools</title>
        <meta name="description" content="Fast, free utilities for developers and creators. JSON formatter, password generator, regex tester, unit converter and more — no sign-up, no nonsense." />
        <meta name="keywords" content="free developer tools, online utilities, json formatter, password generator, regex tester, unit converter, markdown previewer" />
        <link rel="canonical" href="https://shauryatools.vercel.app/" />
      </Helmet>

      <div className="hp-root">

        {/* ════ HERO ════ */}
        <section className="hp-hero">
          {/* Background mesh */}
          <div className="hp-hero-mesh" aria-hidden="true">
            <div className="mesh-blob mesh-1" />
            <div className="mesh-blob mesh-2" />
            <div className="mesh-blob mesh-3" />
            <div className="mesh-grid" />
          </div>

          <div className="hp-hero-inner">
            <div className="hp-hero-badge">
              <span className="badge-dot" />
              Free · No account · No limits
            </div>

            <h1 className="hp-h1">
              Simple Tools,<br />
              <em>Built Right.</em>
            </h1>

            <p className="hp-sub">
              Fast, free utilities for developers, creators, and students.<br />
              Pick a tool. Get it done.
            </p>

            {/* Stats row */}
            <div className="hp-stats">
              {STATS.map(s => (
                <div key={s.label} className="hp-stat">
                  <span className="hp-stat-val">{s.value}</span>
                  <span className="hp-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="hp-search-wrap">
              <svg className="hp-search-ico" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="hp-search"
                value={search}
                onChange={e => { setSearch(e.target.value); if (e.target.value) setActiveTab("All"); }}
                placeholder="Search 40+ tools…"
                autoComplete="off"
                spellCheck={false}
              />
              {search && (
                <button className="hp-search-clear" onClick={() => setSearch("")} aria-label="Clear">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* Category filter tabs */}
            <div className="hp-tabs">
              {ALL_CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    className={`hp-tab ${activeTab === cat ? "hp-tab-on" : ""}`}
                    onClick={() => setActiveTab(cat)}
                    style={activeTab === cat && meta ? {
                      background: meta.bg,
                      color:      meta.color,
                      borderColor:meta.border,
                    } : {}}
                  >
                    {meta && <span className="hp-tab-dot" style={{ background: meta.dot }} />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════ TOOLS SECTION ════ */}
        <main className="hp-main">
          <div className="hp-container">

            {/* Search result count */}
            {(search || activeTab !== "All") && (
              <div className="hp-result-bar">
                <span className="hp-result-count">
                  {filtered.length} tool{filtered.length !== 1 ? "s" : ""}
                  {search ? ` for "${search}"` : ""}
                  {activeTab !== "All" ? ` in ${activeTab}` : ""}
                </span>
                {(search || activeTab !== "All") && (
                  <button className="hp-clear-filters" onClick={() => { setSearch(""); setActiveTab("All"); }}>
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* ── Grouped by category (default view) ── */}
            {showGrouped && Object.entries(groupedByCategory).map(([cat, catTools]) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META["Utility"];
              return (
                <section key={cat} className="hp-category-section">
                  <div className="hp-cat-header">
                    <div className="hp-cat-label" style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
                      <span className="hp-cat-dot" style={{ background: meta.dot }} />
                      {cat}
                    </div>
                    <div className="hp-cat-line" />
                    <span className="hp-cat-count">{catTools.length} tools</span>
                  </div>

                  <div className="hp-grid">
                    {catTools.map((tool, i) => (
                      <ToolCard key={tool.id} tool={tool} meta={meta} delay={i * 40} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* ── Flat filtered grid ── */}
            {!showGrouped && (
              <>
                {filtered.length > 0 ? (
                  <div className="hp-grid">
                    {filtered.map((tool, i) => {
                      const meta = CATEGORY_META[tool.category] || CATEGORY_META["Utility"];
                      return <ToolCard key={tool.id} tool={tool} meta={meta} delay={i * 30} />;
                    })}
                  </div>
                ) : (
                  <div className="hp-empty">
                    <div className="hp-empty-icon">🔍</div>
                    <h3>No tools found</h3>
                    <p>No results for "{search}"</p>
                    <button onClick={() => { setSearch(""); setActiveTab("All"); }}>Clear search</button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* ════ FOOTER ════ */}
        <footer className="hp-footer">
          <div className="hp-footer-inner">
            <span className="hp-footer-brand">ShauryaTools</span>
            <span className="hp-footer-sep">·</span>
            <span>© 2026 — Built with ♥</span>
            <span className="hp-footer-sep">·</span>
            <span>Free forever</span>
          </div>
        </footer>

      </div>
    </>
  );
};

/* ── Tool Card ── */
function ToolCard({ tool, meta, delay = 0 }) {
  return (
    <Link
      to={`/${tool.slug}`}
      className="hp-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="hp-card-top">
        <div className="hp-card-icon" style={{ background: meta.bg, borderColor: meta.border }}>
          {iconMap[tool.icon] || iconMap.hashtag}
        </div>
        <span
          className="hp-card-cat"
          style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
        >
          {tool.category}
        </span>
      </div>

      <div className="hp-card-body">
        <h3 className="hp-card-name">{tool.name}</h3>
        <p  className="hp-card-desc">{tool.description}</p>
      </div>

      <div className="hp-card-cta" style={{ color: meta.accent }}>
        <span>Use Tool</span>
        <svg className="hp-cta-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>

      {/* Hover shine */}
      <div className="hp-card-shine" aria-hidden="true" />
    </Link>
  );
}

export default Home;
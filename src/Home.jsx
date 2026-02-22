/* eslint-disable react-refresh/only-export-components */
import React, { useState } from "react";
import { tools } from "./data/toolsData";
import { iconMap } from "./data/svgdata";  // stays the same, Vite resolves .jsx automatically
import { Link } from "react-router-dom";
import "./Home.css";

import { Helmet } from "react-helmet";

const categoryColors = {
  Social: {
    bg: "#fff7ed",
    color: "#ea580c",
    border: "#fed7aa",
  },

  "AI Tools": {
    bg: "#eff6ff",
    color: "#2563eb",
    border: "#bfdbfe",
  },

  Utility: {
    bg: "#f0fdf4",
    color: "#16a34a",
    border: "#bbf7d0",
  },

  "Dev Tools": {
    bg: "#f5f3ff",
    color: "#7c3aed",
    border: "#ddd6fe",
  },
};


const Home = () => {
  const [search, setSearch] = useState("");

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
    <Helmet>
      <title>ShauryaTools – Free Online Developer & Creator Tools</title>
      <meta name="description" content="Fast, free utilities for developers and creators. JSON formatter, password generator, regex tester, unit converter and more — no sign-up, no nonsense." />
      <meta name="keywords" content="free developer tools, online utilities, json formatter, password generator, regex tester, unit converter, markdown previewer" />
      <link rel="canonical" href="https://shauryatools.vercel.app/" />
    </Helmet>
    <div className="page">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">

          <h1>Simple Tools, <span className="green">Built Right.</span></h1>
          <p className="sub">Fast, free utilities — no sign-up, no nonsense.</p>

          <div className="search-wrap">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools..."
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
        </div>
      </section>

      {/* ── Tools ── */}
      <main className="tools-section">
        <div className="container">
          {search && (
            <p className="results-info">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
            </p>
          )}

          <div className="tools-grid">
            {filtered.map((tool) => {
              const cat = categoryColors[tool.category] || categoryColors["Utility"];
              return (
                <Link to={`/${tool.slug}`} key={tool.id} className="tool-card">
                  <div className="card-top">
                    <div className="icon-box">
                      {iconMap[tool.icon] || iconMap.hashtag}
                    </div>
                    <span className="cat-tag" style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}>
                      {tool.category}
                    </span>
                  </div>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  <div className="card-cta">
                    Use Tool
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
    
              );
            })}
            

            {filtered.length === 0 && (
              <div className="empty">
                <div className="empty-icon">🔍</div>
                <p>No tools found for "{search}"</p>
                <button onClick={() => setSearch("")}>Clear search</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>© 2026 Shaurya Tools — Built with ♥</p>
      </footer>

    </div>
    </>
  );
};

export default Home;
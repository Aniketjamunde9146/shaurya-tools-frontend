/* eslint-disable react-refresh/only-export-components */
import React, { useState } from "react";
import { tools } from "../data/toolsData";
import { Link } from "react-router-dom";
import "./Home.css";
import TextTools from "./TextTools";
import { Helmet } from "react-helmet";

export const iconMap = {
  // --- SOCIAL & CONTENT ---
  hashtag: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
  instagramBio: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="19" height="19" rx="6" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" />
    </svg>
  ),
  youtubeDescription: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3" /><polygon points="10 9 15 12 10 15" /><line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  ),
  youtubeTitleOptimizer: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /><path d="M16 5l3-3 3 3" />
    </svg>
  ),
  linkedinPost: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" /><line x1="7" y1="10" x2="17" y2="10" /><line x1="7" y1="14" x2="17" y2="14" /><line x1="7" y1="18" x2="13" y2="18" /><rect x="7" y="6" width="3" height="3" />
    </svg>
  ),
  captionGenerator: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="14" y2="13" />
    </svg>
  ),

  // --- DEV TOOLS ---
  prompt: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  ),
  readme: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
    </svg>
  ),
  profileReadme: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="13" r="2.5"/><path d="M8 20a4 4 0 0 1 8 0"/>
    </svg>
  ),
  braces: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H7a2 2 0 00-2 2v5a2 2 0 01-2 2 2 2 0 012 2v5c0 1.1.9 2 2 2h1" /><path d="M16 3h1a2 2 0 012 2v5a2 2 0 002 2 2 2 0 00-2 2v5a2 2 0 01-2 2h-1" />
    </svg>
  ),
  fileCode: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="10 13 8 15 10 17" /><polyline points="14 13 16 15 14 17" />
    </svg>
  ),
  meta: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="10" y1="20" x2="14" y2="4" />
    </svg>
  ),
  git: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="M18 9V6a3 3 0 0 0-3-3H9"/>
    </svg>
  ),
  license: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  zap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  markdown: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 12v4M6 8v4M10 8l2 4 2-4M18 8v8M18 8l-3 4M18 8l3 4"/>
    </svg>
  ),
  regex: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8M12 18v4M4.93 10.93l5.66 5.66M13.41 7.41l5.66 5.66M2 15h8M14 15h8M4.93 19.07l5.66-5.66M13.41 12.59l5.66-5.66"/>
    </svg>
  ),

  // --- UTILS & SECURITY ---
  lock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  link: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
  uuidGenerator: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/>
    </svg>
  ),
  passwordGenerator: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /><circle cx="8" cy="16" r="1" /><circle cx="12" cy="16" r="1" /><circle cx="16" cy="16" r="1" />
    </svg>
  ),
  qrCodeGenerator: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3z" /><path d="M18 18h3v3h-3z" /><path d="M14 21h3" /><path d="M21 14v3" />
    </svg>
  ),
  unitConverter: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7L4 11L8 15" /><path d="M16 17L20 13L16 9" /><line x1="4" y1="11" x2="13" y2="11" /><line x1="11" y1="13" x2="20" y2="13" />
    </svg>
  ),

  // --- HEALTH & FINANCE ---
  bmiCalculator: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" /><line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  ),
  loanEmiCalculator: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="18" y2="11" /><line x1="8" y1="15" x2="18" y2="15" />
    </svg>
  ),
  ageCalculator: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><circle cx="12" cy="14" r="3" />
    </svg>
  ),
  emojiCombiner: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M15 15l6 6" /><path d="M18 15l3 3" /><path d="M9 9h.01" /><path d="M15 9h.01" /><path d="M8 15s1.5 2 4 2 4-2 4-2" />
    </svg>
  ),
  textTools: (
    <svg 
      width="22" 
      height="22" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* The Text/Case Symbol */}
      <path d="M3 12h10" />
      <path d="M3 18h10" />
      <path d="M3 6h18" />
      <path d="M16 20l3-8 3 8" />
      <path d="M17 18h4" />
    </svg>
  ),
 colorPicker: (
  <svg 
    width="22" 
    height="22" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M19 11l-6-6" />
    <path d="M5 19l8-8" />
    <path d="M14 4l6 6-2 2-6-6z" />
    <circle cx="5" cy="19" r="2" />
  </svg>
),
codePrettifier: (
  <svg 
    width="22" 
    height="22" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
    <line x1="9" y1="18" x2="15" y2="6" />
  </svg>
)






};

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
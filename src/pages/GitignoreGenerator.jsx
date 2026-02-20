/* eslint-disable no-unused-vars */
import { useState, useMemo, useRef } from "react";
import { Helmet } from "react-helmet";
import "./GitignoreGenerator.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/gitignore-generator`;

/* ── Icons ── */
const IconGitignore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const TEMPLATES = [
  {
    category: "Languages",
    items: [
      { name: "Node.js", badge: "JS", rules: ["# Node.js","node_modules/","npm-debug.log*","yarn-debug.log*","yarn-error.log*","pnpm-debug.log*",".npm",".yarn/cache",".yarn/unplugged",".pnp.*","package-lock.json",""] },
      { name: "Python", badge: "PY", rules: ["# Python","__pycache__/","*.py[cod]","*$py.class","*.so",".Python","env/","venv/",".venv/","ENV/","*.egg","*.egg-info/","dist/","build/",".eggs/","pip-log.txt","pip-delete-this-directory.txt",""] },
      { name: "Java", badge: "JV", rules: ["# Java","*.class","*.log","*.jar","*.war","*.nar","*.ear","*.zip","*.tar.gz","*.rar","target/",".mvn/",""] },
      { name: "Go", badge: "GO", rules: ["# Go","*.exe","*.exe~","*.dll","*.so","*.dylib","*.test","*.out","vendor/",""] },
      { name: "Rust", badge: "RS", rules: ["# Rust","target/","Cargo.lock","**/*.rs.bk",""] },
      { name: "Ruby", badge: "RB", rules: ["# Ruby","*.gem","*.rbc","/.config","/coverage/","/InstalledFiles","/pkg/","/spec/reports/","/test/tmp/","/test/version_tmp/","/tmp/",".bundle/","vendor/bundle","Gemfile.lock",""] },
      { name: "PHP", badge: "PHP", rules: ["# PHP","vendor/","composer.phar",".env","*.log",""] },
      { name: "Swift", badge: "SW", rules: ["# Swift",".build/","*.resolved","*.xcodeproj/","*.xcworkspace/","DerivedData/",".swiftpm/",""] },
      { name: "Kotlin", badge: "KT", rules: ["# Kotlin","*.class","*.kotlin_module","build/",".gradle/","local.properties",""] },
    ],
  },
  {
    category: "Frameworks",
    items: [
      { name: "React / Next.js", badge: "RCT", rules: ["# React / Next.js",".next/","out/","build/",".vercel","*.tsbuildinfo",""] },
      { name: "Vue / Nuxt", badge: "VUE", rules: ["# Vue / Nuxt",".nuxt/",".output/","dist/",""] },
      { name: "Angular", badge: "NG", rules: ["# Angular","dist/","tmp/","/connect.lock","/coverage","/libpeerconnection.log","npm-debug.log","testem.log",".tmp/",".sass-cache/","connect.lock","typings/",""] },
      { name: "Django", badge: "DJG", rules: ["# Django","*.log","*.pot","*.pyc","__pycache__/","local_settings.py","db.sqlite3","db.sqlite3-journal","media/",""] },
      { name: "Laravel", badge: "LAR", rules: ["# Laravel","/node_modules","/public/hot","/public/storage","/storage/*.key","/vendor",".env",".env.backup",".phpunit.result.cache","Homestead.json","Homestead.yaml","npm-debug.log","yarn-error.log",""] },
      { name: "Spring Boot", badge: "SPR", rules: ["# Spring Boot","target/","!.mvn/wrapper/maven-wrapper.jar","!**/src/main/**/target/","!**/src/test/**/target/","*.log",""] },
      { name: "Flutter", badge: "FL", rules: ["# Flutter",".dart_tool/",".flutter-plugins",".flutter-plugins-dependencies",".packages",".pub-cache/",".pub/","build/",""] },
    ],
  },
  {
    category: "IDEs & Editors",
    items: [
      { name: "VS Code", badge: "VSC", rules: ["# VS Code",".vscode/*","!.vscode/settings.json","!.vscode/tasks.json","!.vscode/launch.json","!.vscode/extensions.json","*.code-workspace",".history/",""] },
      { name: "JetBrains", badge: "JB", rules: ["# JetBrains IDEs",".idea/","*.iws","*.iml","*.ipr","out/",""] },
      { name: "Vim / Neovim", badge: "VIM", rules: ["# Vim / Neovim","[._]*.s[a-v][a-z]","[._]*.sw[a-p]","[._]s[a-rt-v][a-z]","[._]ss[a-gi-z]","[._]sw[a-p]","Session.vim","Sessionx.vim",".netrwhist","*~","tags","[._]*.un~",""] },
      { name: "Emacs", badge: "EMC", rules: ["# Emacs","*~","\\#*\\#","/.emacs.desktop","/.emacs.desktop.lock","*.elc","auto-save-list","tramp",".#*",""] },
      { name: "Xcode", badge: "XC", rules: ["# Xcode","build/","*.pbxuser","!default.pbxuser","*.mode1v3","!default.mode1v3","*.mode2v3","!default.mode2v3","*.perspectivev3","!default.perspectivev3","xcuserdata/","*.xccheckout","*.moved-aside","DerivedData/",""] },
    ],
  },
  {
    category: "OS",
    items: [
      { name: "macOS", badge: "MAC", rules: ["# macOS",".DS_Store",".AppleDouble",".LSOverride","Icon","._*",".DocumentRevisions-V100",".fseventsd",".Spotlight-V100",".TemporaryItems",".Trashes",".VolumeIcon.icns",".com.apple.timemachine.donotpresent",""] },
      { name: "Windows", badge: "WIN", rules: ["# Windows","Thumbs.db","Thumbs.db:encryptable","ehthumbs.db","ehthumbs_vista.db","*.stackdump","[Dd]esktop.ini","$RECYCLE.BIN/","*.cab","*.msi","*.msix","*.msm","*.msp","*.lnk",""] },
      { name: "Linux", badge: "LNX", rules: ["# Linux","*~",".fuse_hidden*",".directory",".Trash-*",".nfs*",""] },
    ],
  },
  {
    category: "Tools & CI",
    items: [
      { name: "Docker", badge: "DKR", rules: ["# Docker",".dockerignore","docker-compose.override.yml",""] },
      { name: "Terraform", badge: "TF", rules: ["# Terraform",".terraform/","*.tfstate","*.tfstate.*","crash.log","crash.*.log","*.tfvars","*.tfvars.json","override.tf","override.tf.json","*_override.tf","*_override.tf.json",".terraformrc","terraform.rc",""] },
      { name: "Ansible", badge: "ANS", rules: ["# Ansible","*.retry",""] },
      { name: "Environment Files", badge: "ENV", rules: ["# Environment & secrets",".env",".env.*","!.env.example","!.env.sample","*.local",".env.local",".env.development.local",".env.test.local",".env.production.local",""] },
      { name: "Logs", badge: "LOG", rules: ["# Logs","logs/","*.log","npm-debug.log*","yarn-debug.log*","yarn-error.log*","lerna-debug.log*","*.log.*",""] },
      { name: "Coverage & Testing", badge: "TST", rules: ["# Coverage & Testing","coverage/",".coverage","*.lcov",".nyc_output/","htmlcov/",".pytest_cache/",".cache/","jest_html_reporters.html",""] },
      { name: "Build Artifacts", badge: "BLD", rules: ["# Build artifacts","dist/","build/","out/","*.min.js","*.min.css","*.map",""] },
    ],
  },
  {
    category: "Package Managers",
    items: [
      { name: "npm", badge: "NPM", rules: ["# npm","node_modules/",".npm","npm-debug.log*","package-lock.json",""] },
      { name: "Yarn", badge: "YRN", rules: ["# Yarn",".yarn/cache",".yarn/unplugged",".yarn/build-state.yml",".yarn/install-state.gz",".pnp.*",""] },
      { name: "pnpm", badge: "PNP", rules: ["# pnpm","node_modules/",".pnpm-store/",""] },
      { name: "pip / Poetry", badge: "PIP", rules: ["# pip / Poetry","*.egg-info/","dist/","*.egg","pip-log.txt","poetry.lock",""] },
    ],
  },
];

const HEADER_COMMENT = `# .gitignore — generated by shaurya.tools
# https://shaurya.tools/gitignore
#
# Edit freely. Lines starting with # are comments.
# Blank lines are ignored by Git.

`;

export default function GitignoreGenerator() {
  const [selected,     setSelected]     = useState(new Set());
  const [customRules,  setCustomRules]  = useState([]);
  const [customInput,  setCustomInput]  = useState("");
  const [search,       setSearch]       = useState("");
  const [openCats,     setOpenCats]     = useState(new Set(["Languages", "Frameworks", "OS", "Tools & CI"]));
  const [copiedOutput, setCopiedOutput] = useState(false);

  const toggleTemplate = (name) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleCat = (cat) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const addCustomRule = () => {
    const trimmed = customInput.trim();
    if (!trimmed || customRules.includes(trimmed)) return;
    setCustomRules(prev => [...prev, trimmed]);
    setCustomInput("");
  };

  const removeCustomRule = (rule) => {
    setCustomRules(prev => prev.filter(r => r !== rule));
  };

  const output = useMemo(() => {
    if (selected.size === 0 && customRules.length === 0) return "";
    const allTemplates = TEMPLATES.flatMap(c => c.items);
    const sections = [];
    allTemplates.forEach(t => {
      if (selected.has(t.name)) sections.push(t.rules.join("\n"));
    });
    if (customRules.length > 0) sections.push(["# Custom rules", ...customRules, ""].join("\n"));
    return HEADER_COMMENT + sections.join("\n");
  }, [selected, customRules]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = ".gitignore"; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return TEMPLATES;
    const q = search.toLowerCase();
    return TEMPLATES.map(cat => ({
      ...cat,
      items: cat.items.filter(t => t.name.toLowerCase().includes(q) || t.badge.toLowerCase().includes(q)),
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  const lineCount = output ? output.split("\n").length : 0;

  return (
    <>
      <Helmet>
        <title>.gitignore Generator – Create .gitignore Files Instantly | ShauryaTools</title>
        <meta
          name="description"
          content="Generate a clean, ready-to-use .gitignore file for any tech stack. Pick languages, frameworks, IDEs and OS templates. Add custom rules and download instantly. Free."
        />
        <meta
          name="keywords"
          content="gitignore generator, .gitignore generator, create gitignore, gitignore file, gitignore for react, gitignore for python, gitignore for node"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content=".gitignore Generator – Free Online Tool" />
        <meta property="og:description" content="Instantly generate .gitignore files for any stack. Pick templates and download." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content=".gitignore Generator Online" />
        <meta name="twitter:description" content="Generate perfect .gitignore files for any tech stack. Free and instant." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": ".gitignore Generator",
            "url": PAGE_URL,
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "All",
            "description": "Free online .gitignore generator. Create gitignore files for any language, framework, IDE or OS with one click.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="gi-page">
        <div className="gi-inner">

          <div className="gi-header">
            <div className="gi-icon"><IconGitignore /></div>
            <div>
              <span className="gi-cat">Dev Tools</span>
              <h1>.gitignore Generator</h1>
              <p>Pick your stack, frameworks, and OS. Get a clean, ready-to-use .gitignore file instantly.</p>
            </div>
          </div>

          <div className="gi-grid">

            <div className="gi-col-left">
              <div className="gi-card">
                <div className="gi-card-head">
                  <span className="gi-card-title">Templates</span>
                  {selected.size > 0 && (
                    <button className="gi-sm-btn" onClick={() => setSelected(new Set())}>
                      <IconTrash /> Clear all
                    </button>
                  )}
                </div>

                <div className="gi-search-wrap">
                  <span className="gi-search-icon"><IconSearch /></span>
                  <input
                    className="gi-search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search templates…"
                  />
                </div>

                <div className="gi-selected-strip">
                  {selected.size === 0
                    ? <span className="gi-selected-empty">No templates selected yet</span>
                    : [...selected].map(name => (
                      <span key={name} className="gi-tag">
                        {name}
                        <button className="gi-tag-remove" onClick={() => toggleTemplate(name)}>×</button>
                      </span>
                    ))
                  }
                </div>

                <div className="gi-categories">
                  {filteredTemplates.map(cat => (
                    <div key={cat.category} className="gi-category-section">
                      <div className="gi-category-header" onClick={() => toggleCat(cat.category)}>
                        <span className="gi-category-label">{cat.category}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="gi-category-count">
                            {cat.items.filter(t => selected.has(t.name)).length}/{cat.items.length}
                          </span>
                          <IconChevron open={openCats.has(cat.category)} />
                        </div>
                      </div>
                      {openCats.has(cat.category) && (
                        <div className="gi-category-items">
                          {cat.items.map(t => (
                            <div
                              key={t.name}
                              className={`gi-template-item ${selected.has(t.name) ? "gi-selected" : ""}`}
                              onClick={() => toggleTemplate(t.name)}
                            >
                              <span className="gi-template-check">
                                {selected.has(t.name) && <IconCheck />}
                              </span>
                              <span className="gi-template-name">{t.name}</span>
                              <span className="gi-template-badge">{t.badge}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="gi-card">
                <div className="gi-card-head">
                  <span className="gi-card-title">Custom Rules</span>
                  {customRules.length > 0 && <span className="gi-count-badge">{customRules.length}</span>}
                </div>
                <div className="gi-custom-body">
                  <div className="gi-custom-row">
                    <input
                      className="gi-custom-input"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomRule()}
                      placeholder="e.g.  *.secret  or  /my-folder/"
                    />
                    <button className="gi-custom-add-btn" onClick={addCustomRule}>
                      <IconPlus /> Add
                    </button>
                  </div>
                  {customRules.length > 0 && (
                    <div className="gi-custom-rules">
                      {customRules.map(rule => (
                        <span key={rule} className="gi-custom-tag">
                          {rule}
                          <button className="gi-custom-tag-remove" onClick={() => removeCustomRule(rule)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="gi-col-right">
              <div className="gi-card">
                <div className="gi-card-head">
                  <span className="gi-card-title">Output — .gitignore</span>
                  <div className="gi-card-actions">
                    {output && <span className="gi-count-badge">{lineCount} lines</span>}
                    {output && (
                      <>
                        <button className="gi-sm-btn" onClick={handleCopy}>
                          {copiedOutput ? <IconCheck /> : <IconCopy />}
                          {copiedOutput ? " Copied!" : " Copy"}
                        </button>
                        <button className="gi-sm-btn" onClick={handleDownload}>
                          <IconDownload /> Download
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!output ? (
                  <div className="gi-empty">
                    <span className="gi-empty-icon">🗂️</span>
                    <span>Select templates on the left to generate your .gitignore</span>
                  </div>
                ) : (
                  <div className="gi-output-wrap">
                    <textarea className="gi-output" value={output} onChange={e => {}} spellCheck={false} />
                    <span className="gi-line-count">{lineCount} lines</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
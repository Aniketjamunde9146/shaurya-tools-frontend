/* eslint-disable no-unused-vars */
import { useState, useMemo } from "react";
import "./InstagramBioGenerator.css";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconIG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

/* ══════════════════════
   Static data
   ══════════════════════ */
const EMOJI_STYLES = [
  { id: "none",     label: "No emojis",   sample: "ABC" },
  { id: "minimal",  label: "Minimal",     sample: "✦ · •" },
  { id: "playful",  label: "Playful",     sample: "🌸 💫 ✨" },
  { id: "bold",     label: "Bold",        sample: "🔥 💪 🚀" },
  { id: "elegant",  label: "Elegant",     sample: "✨ 🌙 🕊️" },
  { id: "business", label: "Business",    sample: "📌 💼 📈" },
];

const TONES = ["Professional", "Witty & Humorous", "Inspiring & Motivational", "Casual & Friendly", "Bold & Confident", "Aesthetic & Poetic"];

const LINE_STYLES = [
  { id: "lines",    label: "Line by line" },
  { id: "compact",  label: "Compact paragraph" },
  { id: "symbols",  label: "Symbols as separators" },
];

const NICHES = [
  "Fitness & Wellness", "Fashion & Style", "Food & Cooking", "Travel", "Photography",
  "Business & Entrepreneur", "Tech & Developer", "Art & Design", "Music", "Beauty & Skincare",
  "Lifestyle", "Parenting", "Finance & Investing", "Education", "Gaming",
  "Comedy & Entertainment", "Mental Health & Mindfulness", "Sports", "Personal Brand", "Other",
];

const PRESETS = [
  {
    label: "Fitness Coach",
    fields: {
      name: "Sarah M.", niche: "Fitness & Wellness", role: "Online Fitness Coach & Nutritionist",
      tagline: "Helping women feel strong from the inside out",
      highlights: "10K+ clients transformed, NASM certified, Mom of 2",
      cta: "Book a free consultation 👇", link: "linktr.ee/sarahfits",
      tone: "Inspiring & Motivational", emojiStyle: "bold", lineStyle: "lines",
    },
  },
  {
    label: "Travel Creator",
    fields: {
      name: "Kai Travels", niche: "Travel", role: "Full-time travel creator",
      tagline: "Turning passport stamps into stories",
      highlights: "50+ countries | Budget travel tips | Solo travel safe",
      cta: "New travel guide 👇", link: "kaitravels.com",
      tone: "Casual & Friendly", emojiStyle: "playful", lineStyle: "lines",
    },
  },
  {
    label: "Tech Founder",
    fields: {
      name: "Alex Chen", niche: "Business & Entrepreneur", role: "Founder @ StartupXYZ | SaaS Builder",
      tagline: "Building in public. Failing forward.",
      highlights: "2x founder | $2M ARR | YC W23",
      cta: "Follow my building journey 👇", link: "alexchen.co",
      tone: "Bold & Confident", emojiStyle: "business", lineStyle: "symbols",
    },
  },
  {
    label: "Aesthetic Creator",
    fields: {
      name: "Luna", niche: "Lifestyle", role: "Slow living & minimal aesthetics",
      tagline: "Finding magic in the everyday moments",
      highlights: "Film photography | cozy corners | morning rituals",
      cta: "Shop my presets ✨", link: "luna.studio",
      tone: "Aesthetic & Poetic", emojiStyle: "elegant", lineStyle: "lines",
    },
  },
  {
    label: "Food Blogger",
    fields: {
      name: "Priya Eats", niche: "Food & Cooking", role: "Recipe developer & food photographer",
      tagline: "Making desi flavors accessible to everyone",
      highlights: "500+ recipes | NYT featured | Cookbook author",
      cta: "Get my free recipe ebook 👇", link: "priyaeats.com",
      tone: "Casual & Friendly", emojiStyle: "playful", lineStyle: "lines",
    },
  },
];

const TIPS = [
  { text: <><strong>150 characters max</strong> — Instagram hard cuts off your bio at this limit.</> },
  { text: <><strong>Name field</strong> is indexed by search — use keywords your audience searches for.</> },
  { text: <><strong>Line breaks</strong> create visual breathing room and make bios easier to scan.</> },
  { text: <><strong>One clear CTA</strong> in your bio dramatically improves link clicks.</> },
  { text: <><strong>Emojis</strong> act as visual bullets and draw the eye to key info.</> },
];

const SEPARATORS = {
  none:    "\n",
  lines:   "\n",
  compact: " ",
  symbols: " • ",
};

/* ══════════════════════
   Bio builder logic
   ══════════════════════ */
function buildBios(f) {
  const { name, niche, role, tagline, highlights, cta, link, tone, emojiStyle, lineStyle } = f;

  const sep = lineStyle === "compact" ? " " : "\n";
  const symSep = lineStyle === "symbols" ? " • " : "\n";

  const emojiMap = {
    none:     { bullet: "",    star: "",    fire: "",    pin: "",   wave: "",   heart: "" },
    minimal:  { bullet: "·",   star: "✦",   fire: "✦",   pin: "·",  wave: "~",  heart: "·" },
    playful:  { bullet: "🌸",  star: "💫",  fire: "✨",  pin: "📍", wave: "👋", heart: "💖" },
    bold:     { bullet: "🔥",  star: "⭐",  fire: "🚀",  pin: "📌", wave: "💪", heart: "❤️" },
    elegant:  { bullet: "✨",  star: "🌙",  fire: "✨",  pin: "🕊️", wave: "🌿", heart: "🤍" },
    business: { bullet: "📌",  star: "📈",  fire: "💼",  pin: "📌", wave: "🤝", heart: "💡" },
  };

  const e = emojiMap[emojiStyle] || emojiMap.none;

  // Tone-adjusted copy helpers
  const toneRole = {
    "Professional":           role,
    "Witty & Humorous":       role + " (don't worry, I'm funnier in real life)",
    "Inspiring & Motivational": role,
    "Casual & Friendly":      role,
    "Bold & Confident":       role.toUpperCase().length < 40 ? role : role,
    "Aesthetic & Poetic":     role,
  }[tone] || role;

  const parts = {
    role:       toneRole,
    tagline:    tagline,
    highlights: highlights,
    cta:        cta,
    link:       link ? `🔗 ${link}` : "",
  };

  const bios = [];

  /* ── Bio 1: Role first, tagline, highlights, CTA ── */
  {
    const lines = [];
    if (parts.role)       lines.push(`${e.bullet ? e.bullet + " " : ""}${parts.role}`);
    if (parts.tagline)    lines.push(`${e.star ? e.star + " " : ""}${parts.tagline}`);
    if (parts.highlights) lines.push(parts.highlights);
    if (parts.cta)        lines.push(parts.cta);
    if (parts.link)       lines.push(parts.link);
    bios.push(lines.filter(Boolean).join(lineStyle === "compact" ? " | " : "\n"));
  }

  /* ── Bio 2: Tagline first, punchier ── */
  {
    const lines = [];
    if (parts.tagline)    lines.push(`${e.fire ? e.fire + " " : ""}"${parts.tagline}"`);
    if (parts.role)       lines.push(parts.role);
    if (parts.highlights) lines.push(parts.highlights);
    if (parts.cta)        lines.push(parts.cta);
    if (parts.link)       lines.push(parts.link);
    bios.push(lines.filter(Boolean).join("\n"));
  }

  /* ── Bio 3: Symbol-separated compact ── */
  {
    const chunks = [];
    if (parts.role)       chunks.push(parts.role);
    if (parts.tagline)    chunks.push(parts.tagline);
    if (parts.highlights) chunks.push(parts.highlights);
    const mainLine = chunks.filter(Boolean).join(lineStyle === "lines" ? "\n" : " • ");
    const lines = [mainLine];
    if (parts.cta)  lines.push(parts.cta);
    if (parts.link) lines.push(parts.link);
    bios.push(lines.filter(Boolean).join("\n"));
  }

  /* ── Bio 4: Highlights as bullets ── */
  {
    const lines = [];
    if (parts.role) lines.push(parts.role);
    if (parts.tagline) lines.push(`${e.star ? e.star + " " : ""}${parts.tagline}`);

    // Split highlights by commas, semicolons, or pipe
    if (parts.highlights) {
      const items = parts.highlights.split(/[,;|]+/).map(s => s.trim()).filter(Boolean).slice(0, 3);
      items.forEach(item => lines.push(`${e.bullet ? e.bullet + " " : "▸ "}${item}`));
    }

    if (parts.cta)  lines.push(parts.cta);
    if (parts.link) lines.push(parts.link);
    bios.push(lines.filter(Boolean).join("\n"));
  }

  /* ── Bio 5: Minimal — just the essentials ── */
  {
    const lines = [];
    if (parts.tagline)    lines.push(parts.tagline);
    if (parts.role)       lines.push(parts.role);
    if (parts.cta)        lines.push(parts.cta);
    if (parts.link)       lines.push(parts.link);
    bios.push(lines.filter(Boolean).join("\n"));
  }

  // Remove exact duplicates & filter empty
  const seen = new Set();
  return bios.filter(b => {
    const t = b.trim();
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  }).slice(0, 5);
}

function charClass(len) {
  if (len > 150) return "over";
  if (len >= 120) return "good";
  return "";
}

/* ══════════════════════
   Main Component
   ══════════════════════ */
const EMPTY_FIELDS = {
  name: "", niche: "", role: "", tagline: "", highlights: "",
  cta: "", link: "", tone: "Inspiring & Motivational",
  emojiStyle: "playful", lineStyle: "lines",
};

export default function InstagramBioGenerator() {
  const [f, setF] = useState(EMPTY_FIELDS);
  const [activeBioIdx, setActiveBioIdx] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const set = (key) => (val) => setF(prev => ({ ...prev, [key]: val }));

  const applyPreset = (preset) => {
    setF({ ...EMPTY_FIELDS, ...preset.fields });
    setActiveBioIdx(0);
    setCopiedIdx(null);
  };

  /* ── Build bios live ── */
  const bios = useMemo(() => {
    const hasContent = f.name || f.role || f.tagline || f.highlights || f.cta;
    if (!hasContent) return [];
    return buildBios(f);
  }, [f]);

  const activeBio = bios[activeBioIdx] || "";

  /* ── Copy ── */
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  /* ── Username display ── */
  const displayUsername = f.name
    ? f.name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9._]/g, "")
    : "yourhandle";

  return (
    <>
    <Helmet>
      <title>Free Instagram Bio Generator – Create the Perfect Bio</title>
      <meta name="description" content="Generate up to 5 Instagram bio variations instantly. Customize emoji style, tone, and layout with a live phone preview. 100% free, no sign-up." />
      <meta name="keywords" content="instagram bio generator, free instagram bio, ig bio creator, instagram profile bio, bio generator tool" />
      <link rel="canonical" href="https://shauryatools.vercel.app/instagram-bio-generator" />
    </Helmet>
    <div className="ib-page">
      <div className="ib-inner">

        {/* ── Header ── */}
        <div className="ib-header">
          <div className="ib-icon"><IconIG /></div>
          <div>
            <span className="ib-cat">Social Tools</span>
            <h1>Instagram Bio Generator</h1>
            <p>Fill in your details and get 5 ready-to-use Instagram bios — with live profile preview.</p>
          </div>
        </div>

        {/* ── Presets strip ── */}
        <div className="ib-presets">
          <span className="ib-presets-label">Quick start:</span>
          {PRESETS.map(p => (
            <button key={p.label} className="ib-preset-btn" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="ib-grid">

          {/* ── Left: form ── */}
          <div className="ib-col-left">
            <div className="ib-card">
              <div className="ib-card-head">
                <span className="ib-card-title">Your Details</span>
              </div>
              <div className="ib-form-body">

                {/* Identity */}
                <div className="ib-divider">Identity</div>

                <div className="ib-row2">
                  <div className="ib-field">
                    <div className="ib-field-top">
                      <span className="ib-label">Name / Handle</span>
                    </div>
                    <input className="ib-input" value={f.name} onChange={e => set("name")(e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div className="ib-field">
                    <div className="ib-field-top">
                      <span className="ib-label">Niche / Category</span>
                    </div>
                    <select className="ib-select" value={f.niche} onChange={e => set("niche")(e.target.value)}>
                      <option value="">Select niche…</option>
                      {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <div className="ib-field">
                  <div className="ib-field-top">
                    <span className="ib-label">Role / Title <span className="ib-label-sub">shown in bold on Instagram</span></span>
                    <span className={`ib-char ${f.role.length > 30 ? "warn" : ""}`}>{f.role.length}/30</span>
                  </div>
                  <input
                    className="ib-input"
                    value={f.role}
                    onChange={e => set("role")(e.target.value)}
                    placeholder="Fitness Coach · Content Creator"
                    maxLength={60}
                  />
                </div>

                {/* Bio content */}
                <div className="ib-divider" style={{ marginTop: 4 }}>Bio Content</div>

                <div className="ib-field">
                  <div className="ib-field-top">
                    <span className="ib-label">Tagline / Value Proposition</span>
                    <span className={`ib-char ${charClass(f.tagline.length)}`}>{f.tagline.length}</span>
                  </div>
                  <input
                    className="ib-input"
                    value={f.tagline}
                    onChange={e => set("tagline")(e.target.value)}
                    placeholder="Helping busy moms feel strong and confident"
                  />
                </div>

                <div className="ib-field">
                  <div className="ib-field-top">
                    <span className="ib-label">Highlights / Credentials <span className="ib-label-sub">comma-separated</span></span>
                  </div>
                  <input
                    className="ib-input"
                    value={f.highlights}
                    onChange={e => set("highlights")(e.target.value)}
                    placeholder="10K+ clients, NASM certified, Featured in Forbes"
                  />
                </div>

                <div className="ib-row2">
                  <div className="ib-field">
                    <div className="ib-field-top">
                      <span className="ib-label">Call to Action</span>
                    </div>
                    <input
                      className="ib-input"
                      value={f.cta}
                      onChange={e => set("cta")(e.target.value)}
                      placeholder="Free guide below 👇"
                    />
                  </div>
                  <div className="ib-field">
                    <div className="ib-field-top">
                      <span className="ib-label">Link in Bio</span>
                    </div>
                    <input
                      className="ib-input"
                      value={f.link}
                      onChange={e => set("link")(e.target.value)}
                      placeholder="linktr.ee/yourhandle"
                    />
                  </div>
                </div>

                {/* Style */}
                <div className="ib-divider" style={{ marginTop: 4 }}>Style</div>

                <div className="ib-field">
                  <span className="ib-label">Tone</span>
                  <select className="ib-select" value={f.tone} onChange={e => set("tone")(e.target.value)}>
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="ib-field">
                  <span className="ib-label">Emoji Style</span>
                  <div className="ib-emoji-row">
                    {EMOJI_STYLES.map(s => (
                      <button
                        key={s.id}
                        className={`ib-emoji-btn ${f.emojiStyle === s.id ? "ib-emoji-on" : ""}`}
                        onClick={() => set("emojiStyle")(s.id)}
                      >
                        <span style={{ fontSize: "0.8rem" }}>{s.sample}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ib-field">
                  <span className="ib-label">Line Format</span>
                  <div className="ib-emoji-row">
                    {LINE_STYLES.map(s => (
                      <button
                        key={s.id}
                        className={`ib-emoji-btn ${f.lineStyle === s.id ? "ib-emoji-on" : ""}`}
                        onClick={() => set("lineStyle")(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Generated bios */}
            <div className="ib-card">
              <div className="ib-card-head">
                <span className="ib-card-title">Generated Bios</span>
                {bios.length > 0 && <span className="ib-count-badge">{bios.length} variations</span>}
              </div>

              {bios.length === 0 ? (
                <div className="ib-empty">
                  <span className="ib-empty-icon">✍️</span>
                  <span className="ib-empty-text">Fill in your details above to generate bio variations</span>
                </div>
              ) : (
                <div className="ib-bios-list">
                  {bios.map((bio, i) => {
                    const len = bio.length;
                    return (
                      <div
                        key={i}
                        className={`ib-bio-item ${activeBioIdx === i ? "ib-bio-active" : ""}`}
                      >
                        <div className="ib-bio-item-top" onClick={() => setActiveBioIdx(i)}>
                          <span className="ib-bio-num">{i + 1}</span>
                          <span className="ib-bio-text-preview">{bio}</span>
                        </div>
                        <div className="ib-bio-item-foot">
                          <span className={`ib-bio-chars ${len > 150 ? "over" : len >= 100 ? "good" : ""}`}>
                            {len}/150 chars{len > 150 ? " — over limit!" : ""}
                          </span>
                          <button
                            className={`ib-bio-copy ${copiedIdx === i ? "copied" : ""}`}
                            onClick={() => handleCopy(bio, i)}
                          >
                            {copiedIdx === i ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                          </button>
                        </div>
                      </div>
   
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="ib-card">
              <div className="ib-card-head">
                <span className="ib-card-title">Pro Tips</span>
              </div>
              <div className="ib-tips-body">
                {TIPS.map((tip, i) => (
                  <div key={i} className="ib-tip">
                    <span className="ib-tip-dot" />
                    <span className="ib-tip-text">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: phone preview ── */}
          <div className="ib-col-right">

            <div className="ib-phone-wrap">
              <div className="ib-phone">
                {/* Top bar */}
                <div className="ig-topbar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--grey-3)" }}><polyline points="15 18 9 12 15 6"/></svg>
                  <span className="ig-topbar-username">{displayUsername}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--grey-3)" }}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </div>

                {/* Profile row */}
                <div className="ig-profile-row">
                  <div className="ig-avatar">
                    <div className="ig-avatar-inner">
                      {f.name ? f.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  </div>
                  <div className="ig-stats">
                    <div className="ig-stat">
                      <span className="ig-stat-num">–</span>
                      <span className="ig-stat-label">posts</span>
                    </div>
                    <div className="ig-stat">
                      <span className="ig-stat-num">–</span>
                      <span className="ig-stat-label">followers</span>
                    </div>
                    <div className="ig-stat">
                      <span className="ig-stat-num">–</span>
                      <span className="ig-stat-label">following</span>
                    </div>
                  </div>
                </div>

                {/* Bio section */}
                <div className="ig-bio-section">
                  {f.name && <div className="ig-display-name">{f.name}</div>}
                  <div className="ig-bio-text">
                    {activeBio
                      ? activeBio
                      : <span className="ig-bio-placeholder">Your bio will appear here as you fill in your details…</span>
                    }
                  </div>
                  {f.link && (
                    <span className="ig-bio-link">{f.link}</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="ig-buttons">
                  <div className="ig-btn">Edit profile</div>
                  <div className="ig-btn">Share profile</div>
                </div>

                {/* Story highlights */}
                <div className="ig-highlights">
                  {["New", "Tips", "About", "Work"].map((h, i) => (
                    <div key={i} className="ig-highlight">
                      <div className="ig-highlight-circle">
                        {["✨", "💡", "👤", "💼"][i]}
                      </div>
                      <span className="ig-highlight-label">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Posts grid */}
                <div className="ig-grid">
                  {[1,2,3,4,5,6].map(n => <div key={n} className="ig-grid-cell" />)}
                </div>
              </div>

              {/* Character count for active bio */}
              {activeBio && (
                <div style={{
                  background: "var(--white)",
                  border: "1.5px solid var(--grey-2)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontSize: "0.68rem", fontWeight: 700, color: "var(--grey-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Bio {activeBioIdx + 1} selected
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: activeBio.length > 150 ? "var(--red)" : activeBio.length >= 100 ? "var(--green)" : "var(--grey-4)",
                    }}>
                      {activeBio.length} / 150 characters
                    </span>
                    {activeBio.length > 150 && (
                      <span style={{ fontSize: "0.68rem", color: "var(--red)" }}>Over limit — trim {activeBio.length - 150} chars</span>
                    )}
                  </div>
                  <button
                    className="ib-sm-btn"
                    style={{ fontSize: "0.75rem", padding: "7px 14px" }}
                    onClick={() => handleCopy(activeBio, "preview")}
                  >
                    {copiedIdx === "preview" ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy this bio</>}
                  </button>
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
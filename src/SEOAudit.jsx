/* eslint-disable no-unused-vars */
import { useState } from "react";

const fixes = [
  {
    status: "fixed",
    area: "Title Tag",
    before: "100% Free Online Tools – No Login, No Signup | Free Tools",
    after: "Free Online Tools – No Login, No Signup | Shaurya Tools",
    why: "Brand name at the end is standard. '100%' looks spammy to Google. Cleaner = higher CTR.",
  },
  {
    status: "fixed",
    area: "Meta Description",
    before: "Shaurya Tools offers 100% free online developer and AI tools...",
    after: "30+ free online tools for developers, creators & everyone... — no login, no signup, instant results.",
    why: "Lists specific tools (JSON, UUID, QR Code) which match search queries better. '30+' adds social proof.",
  },
  {
    status: "fixed",
    area: "OG Image Size",
    before: "og:image only — no width/height specified",
    after: "Added og:image:width=1200, og:image:height=630 + og:image:alt",
    why: "Without dimensions, social platforms may crop or skip your preview image.",
  },
  {
    status: "fixed",
    area: "OG Site Name",
    before: "Missing og:site_name",
    after: 'og:site_name="Shaurya Tools"',
    why: "Shows your brand name in Facebook/LinkedIn link previews below the title.",
  },
  {
    status: "fixed",
    area: "Robots Meta",
    before: "index, follow, max-image-preview:large",
    after: "Added max-snippet:-1 and max-video-preview:-1",
    why: "Allows Google to show rich snippets and longer descriptions in search results.",
  },
  {
    status: "fixed",
    area: "Schema: SearchAction",
    before: "Basic WebSite schema only",
    after: "Added potentialAction SearchAction (Sitelinks Searchbox)",
    why: "Enables a search box directly in Google results for your site — huge CTR boost.",
  },
  {
    status: "fixed",
    area: "Schema: @graph",
    before: "Single WebSite object",
    after: "WebSite + Organization in @graph, linked by @id",
    why: "Google prefers linked entities. Organization helps with Knowledge Panel eligibility.",
  },
  {
    status: "fixed",
    area: "Font Loading",
    before: "Direct <link> to Google Fonts (render blocking)",
    after: "Added rel=preconnect to fonts.googleapis.com and fonts.gstatic.com first",
    why: "Preconnect shaves ~200-300ms off font load. Better Core Web Vitals = better rankings.",
  },
  {
    status: "fixed",
    area: "Theme Color",
    before: "No theme-color meta",
    after: '<meta name="theme-color" content="#6c47ff">',
    why: "Colors the browser chrome on mobile. Also used by Google in mobile search results.",
  },
  {
    status: "fixed",
    area: "Apple Touch Icon",
    before: "No apple-touch-icon",
    after: '<link rel="apple-touch-icon" href="/logo.png">',
    why: "Required for a nice icon when users 'Add to Home Screen' on iOS.",
  },
  {
    status: "fixed",
    area: "Sitemap: lastmod",
    before: "No lastmod on any URL",
    after: "Added lastmod to all URLs",
    why: "Tells Google when pages were last updated — helps re-crawl priority.",
  },
  {
    status: "fixed",
    area: "Sitemap: changefreq",
    before: "No changefreq",
    after: "homepage=weekly, tools=monthly",
    why: "Hints to Googlebot how often to revisit pages.",
  },
  {
    status: "action",
    area: "OG Image File",
    before: "og:image points to logo.png (square logo)",
    after: "Create a 1200×630px og-image.png (landscape banner)",
    why: "Square logos look bad in link previews. A proper banner = more clicks on social.",
  },
  {
    status: "action",
    area: "Twitter Handle",
    before: "twitter:site is commented out",
    after: "Add <meta name='twitter:site' content='@YourHandle'>",
    why: "Required for Twitter/X to show your brand on rich cards.",
  },
  {
    status: "action",
    area: "Per-Page Meta Tags",
    before: "All tool pages likely share the homepage meta",
    after: "Use react-helmet or Vite's vite-plugin-ssr to set unique title/desc per tool page",
    why: "Each tool URL (/json-formatter, /uuid-generator) should have its own optimized title and description for that keyword.",
  },
  {
    status: "action",
    area: "robots.txt",
    before: "Looks good (Allow: /, Sitemap linked)",
    after: "No changes needed ✅",
    why: "Your robots.txt is correctly configured.",
  },
];

const statusConfig = {
  fixed: { label: "✅ Fixed", bg: "bg-emerald-950", border: "border-emerald-700", badge: "bg-emerald-700 text-emerald-100" },
  action: { label: "⚡ Action Needed", bg: "bg-amber-950", border: "border-amber-700", badge: "bg-amber-600 text-amber-100" },
};

export default function SEOAudit() {
  const [expanded, setExpanded] = useState(null);
  const fixed = fixes.filter((f) => f.status === "fixed");
  const actions = fixes.filter((f) => f.status === "action");

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0a0a0f", minHeight: "100vh", padding: "32px 16px", color: "#e2e2ef" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6c47ff,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔍</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#f0f0ff" }}>SEO Audit — Shaurya Tools</h1>
          </div>
          <p style={{ margin: 0, color: "#8888aa", fontSize: 14 }}>index.html + sitemap.xml · {fixes.length} checks total</p>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <div style={{ background: "#0d1f17", border: "1px solid #1a4a2e", borderRadius: 10, padding: "10px 18px", flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#4ade80" }}>{fixed.length}</div>
              <div style={{ fontSize: 12, color: "#6aae88" }}>Fixes Applied</div>
            </div>
            <div style={{ background: "#1f1500", border: "1px solid #4a3000", borderRadius: 10, padding: "10px 18px", flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#fbbf24" }}>{actions.length}</div>
              <div style={{ fontSize: 12, color: "#aa8a44" }}>Actions For You</div>
            </div>
            <div style={{ background: "#0d0d1f", border: "1px solid #2a2a5a", borderRadius: 10, padding: "10px 18px", flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#818cf8" }}>{Math.round((fixed.length / fixes.length) * 100)}%</div>
              <div style={{ fontSize: 12, color: "#5555aa" }}>Auto-Fixed</div>
            </div>
          </div>
        </div>

        {/* Section: Fixed */}
        <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4ade80", textTransform: "uppercase" }}>✅ Applied in your new index.html</div>
        {fixed.map((item, i) => (
          <Card key={i} item={item} i={i} expanded={expanded} setExpanded={setExpanded} />
        ))}

        {/* Section: Actions */}
        <div style={{ marginTop: 28, marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#fbbf24", textTransform: "uppercase" }}>⚡ You Need to Do These</div>
        {actions.map((item, i) => (
          <Card key={i + 100} item={item} i={i + 100} expanded={expanded} setExpanded={setExpanded} />
        ))}

        <div style={{ textAlign: "center", marginTop: 40, color: "#44445a", fontSize: 12 }}>
          Tip: Submit your sitemap at <span style={{ color: "#6c47ff" }}>search.google.com/search-console</span> after deploying
        </div>
      </div>
    </div>
  );
}

function Card({ item, i, expanded, setExpanded }) {
  const isOpen = expanded === i;
  const cfg = statusConfig[item.status];
  return (
    <div
      onClick={() => setExpanded(isOpen ? null : i)}
      style={{
        background: "#111118",
        border: `1px solid ${isOpen ? (item.status === "fixed" ? "#4ade8066" : "#fbbf2466") : "#22222f"}`,
        borderRadius: 12,
        marginBottom: 8,
        cursor: "pointer",
        transition: "border-color 0.2s",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", padding: "13px 16px", gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: "3px 8px", background: item.status === "fixed" ? "#052e16" : "#2d1a00", color: item.status === "fixed" ? "#4ade80" : "#fbbf24", whiteSpace: "nowrap" }}>
          {item.status === "fixed" ? "FIXED" : "TODO"}
        </span>
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1, color: "#d4d4f0" }}>{item.area}</span>
        <span style={{ color: "#44445a", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
      </div>
      {isOpen && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1a1a28" }}>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#55556a", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Before</div>
            <div style={{ background: "#0e0e18", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#ff8888", fontFamily: "monospace", lineHeight: 1.5 }}>{item.before}</div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#55556a", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>After</div>
            <div style={{ background: "#0e0e18", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#88ff88", fontFamily: "monospace", lineHeight: 1.5 }}>{item.after}</div>
          </div>
          <div style={{ marginTop: 10, background: "#13131f", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#9999cc", lineHeight: 1.6 }}>
            💡 {item.why}
          </div>
        </div>
      )}
    </div>
  );
}
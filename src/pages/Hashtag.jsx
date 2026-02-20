import { useState } from "react";
import { Helmet } from "react-helmet";
import { generateAI } from "../api";
import "./Hashtag.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/hashtag-generator`;

const PLATFORMS = ["Instagram", "Twitter", "YouTube", "TikTok", "LinkedIn"];
const COUNT_OPTIONS = [5, 10, 15, 20, 30];

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function Hashtag() {
  const [input, setInput]               = useState("");
  const [platform, setPlatform]         = useState("Instagram");
  const [count, setCount]               = useState(15);
  const [output, setOutput]             = useState([]);
  const [caption, setCaption]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedTags, setCopiedTags]     = useState(false);
  const [selected, setSelected]         = useState(new Set());

  const handleGenerate = async () => {
    if (!input.trim()) return;
    try {
      setLoading(true);
      setOutput([]);
      setSelected(new Set());

      const prompt = `Generate exactly ${count} trending hashtags for ${platform} about: "${input}".
Return ONLY the hashtags separated by spaces. No explanation, no numbering, no line breaks. Just: #tag1 #tag2 #tag3`;

      const res = await generateAI("hashtag", prompt);
      if (!res.data.success) throw new Error("Hashtag generation failed");

      const raw = res.data.data;
      const tags = raw.match(/#[\w]+/g) || [];
      setOutput(tags);
      setSelected(new Set(tags));
    } catch (err) {
      console.error("Hashtag Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const selectedTags  = output.filter((t) => selected.has(t));
  const hashtagString = selectedTags.join(" ");

  const addToCaption = () => {
    if (!hashtagString) return;
    setCaption((prev) => {
      const base = prev.trimEnd();
      if (!base) return hashtagString;
      if (base.includes(hashtagString)) return prev;
      const lastDbl  = base.lastIndexOf("\n\n");
      const afterLast = lastDbl !== -1 ? base.slice(lastDbl + 2) : "";
      if (afterLast.startsWith("#")) return base.slice(0, lastDbl + 2) + hashtagString;
      return base + "\n\n" + hashtagString;
    });
  };

  const copyCaption = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const copyTags = () => {
    if (!hashtagString) return;
    navigator.clipboard.writeText(hashtagString);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  return (
    <>
      <Helmet>
        <title>Free Hashtag Generator – Instagram, Twitter, TikTok & More | ShauryaTools</title>
        <meta
          name="description"
          content="Generate trending hashtags for Instagram, Twitter, TikTok, YouTube and LinkedIn instantly with AI. Pick your platform, set hashtag count, and build your caption. Free."
        />
        <meta
          name="keywords"
          content="hashtag generator, Instagram hashtags, TikTok hashtags, Twitter hashtags, free hashtag generator, trending hashtags, hashtags for Instagram"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Free Hashtag Generator – Instagram, Twitter, TikTok & More" />
        <meta property="og:description" content="Generate trending hashtags for any social media platform instantly. Free AI-powered tool." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Hashtag Generator Online" />
        <meta name="twitter:description" content="AI-powered hashtag generator for Instagram, TikTok, Twitter and more. Free." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Hashtag Generator",
            "url": PAGE_URL,
            "applicationCategory": "SocialNetworkingApplication",
            "operatingSystem": "All",
            "description": "Free AI-powered hashtag generator for Instagram, Twitter, TikTok, YouTube, and LinkedIn.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="ht-page">
        <div className="ht-inner">

          <div className="ht-header">
            <div className="ht-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
                <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
              </svg>
            </div>
            <div>
              <span className="ht-cat">Social</span>
              <h1>Hashtag Generator</h1>
              <p>Pick platform, choose count, generate &amp; build your caption.</p>
            </div>
          </div>

          <div className="ht-card">

            <div className="ht-field">
              <label className="ht-label">Topic or Description</label>
              <input
                className="ht-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="e.g. sunset photography, gym motivation, travel vlog..."
                maxLength={200}
              />
            </div>

            <div className="ht-field">
              <label className="ht-label">Platform</label>
              <div className="ht-pills">
                {PLATFORMS.map((p) => (
                  <button key={p} className={`ht-pill ${platform === p ? "ht-pill-on" : ""}`} onClick={() => setPlatform(p)}>{p}</button>
                ))}
              </div>
            </div>

            <div className="ht-field">
              <label className="ht-label">How many hashtags?</label>
              <div className="ht-pills">
                {COUNT_OPTIONS.map((n) => (
                  <button key={n} className={`ht-pill ht-pill-num ${count === n ? "ht-pill-on" : ""}`} onClick={() => setCount(n)}>{n}</button>
                ))}
              </div>
            </div>

            <button className="ht-generate-btn" onClick={handleGenerate} disabled={loading || !input.trim()}>
              {loading ? (
                <><span className="ht-spinner" /> Generating...</>
              ) : (
                <>Generate {count} Hashtags
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>

            {output.length > 0 && (
              <div className="ht-results">
                <div className="ht-results-top">
                  <div className="ht-counts">
                    <span className="ht-badge-green">{output.length} generated</span>
                    <span className="ht-badge-blue">{selected.size} selected</span>
                  </div>
                  <div className="ht-results-actions">
                    <button className="ht-text-btn" onClick={() => setSelected(new Set(output))}>All</button>
                    <span className="ht-sep">·</span>
                    <button className="ht-text-btn" onClick={() => setSelected(new Set())}>None</button>
                    <button className="ht-outline-btn" onClick={copyTags} disabled={selected.size === 0}>
                      {copiedTags ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                    </button>
                  </div>
                </div>

                <p className="ht-hint">Tap to select / deselect</p>

                <div className="ht-chips">
                  {output.map((tag, i) => (
                    <button key={i} className={`ht-chip ${selected.has(tag) ? "chip-on" : "chip-off"}`} onClick={() => toggleTag(tag)}>{tag}</button>
                  ))}
                </div>

                <button className="ht-add-btn" onClick={addToCaption} disabled={selected.size === 0}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Add {selected.size} hashtag{selected.size !== 1 ? "s" : ""} to Caption
                </button>
              </div>
            )}
          </div>

          <div className="ht-card">
            <div className="ht-caption-head">
              <div>
                <h2 className="ht-caption-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Caption Builder
                </h2>
                <p className="ht-caption-sub">Write your caption, add hashtags, then copy &amp; paste.</p>
              </div>
              {caption && <button className="ht-danger-btn" onClick={() => setCaption("")}>Clear</button>}
            </div>

            <textarea
              className="ht-textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={"Write your caption here...\n\nThen click 'Add to Caption' above to append hashtags automatically."}
              rows={7}
            />

            <div className="ht-caption-foot">
              <span className="ht-charcount">
                {caption.length} chars · {(caption.match(/#[\w]+/g) || []).length} hashtags
              </span>
              <button className="ht-copy-btn" onClick={copyCaption} disabled={!caption}>
                {copiedCaption ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy Caption</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Hashtag;
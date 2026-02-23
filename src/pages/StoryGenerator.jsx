/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./StoryGenerator.css";
import { Helmet } from "react-helmet";
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Swords,
  Heart,
  Ghost,
  Rocket,
  Laugh,
  TreePine,
  Wand2,
  Globe,
  FlameKindling,
  Microscope,
  ChevronDown,
  User,
  Clock,
  Image,
  Video,
  Type,
  AlignLeft,
} from "lucide-react";

/* ── Story Genres ── */
const GENRES = [
  { id: "fantasy",     label: "Fantasy",       icon: Wand2,         desc: "Magic & realms"      },
  { id: "scifi",       label: "Sci-Fi",         icon: Rocket,        desc: "Future & space"      },
  { id: "romance",     label: "Romance",        icon: Heart,         desc: "Love & connection"   },
  { id: "thriller",    label: "Thriller",       icon: FlameKindling, desc: "Suspense & tension"  },
  { id: "horror",      label: "Horror",         icon: Ghost,         desc: "Fear & dread"        },
  { id: "adventure",   label: "Adventure",      icon: Swords,        desc: "Action & quests"     },
  { id: "mystery",     label: "Mystery",        icon: Globe,         desc: "Secrets & clues"     },
  { id: "comedy",      label: "Comedy",         icon: Laugh,         desc: "Humor & fun"         },
  { id: "nature",      label: "Nature",         icon: TreePine,      desc: "Earth & wild"        },
  { id: "historical",  label: "Historical",     icon: Clock,         desc: "Past eras & events"  },
  { id: "sciencelitf", label: "Sci-Fiction",    icon: Microscope,    desc: "Hard science stories"},
  { id: "literary",    label: "Literary",       icon: BookOpen,      desc: "Deep & meaningful"   },
];

/* ── Tone Options ── */
const TONES = [
  { id: "dramatic",    label: "Dramatic"    },
  { id: "whimsical",   label: "Whimsical"   },
  { id: "dark",        label: "Dark"        },
  { id: "uplifting",   label: "Uplifting"   },
  { id: "suspenseful", label: "Suspenseful" },
  { id: "humorous",    label: "Humorous"    },
];

/* ── Length Options ── */
const LENGTHS = [
  { id: "flash",    label: "Flash",    desc: "~150 words"   },
  { id: "short",    label: "Short",    desc: "~400 words"   },
  { id: "medium",   label: "Medium",   desc: "~800 words"   },
];

/* ── POV Options ── */
const POVS = [
  { id: "first",   label: "1st Person" },
  { id: "third",   label: "3rd Person" },
  { id: "second",  label: "2nd Person" },
];

/* ── Language Options ── */
const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Hindi", "Arabic", "Chinese (Simplified)",
  "Japanese", "Korean",
];

/* ── Component ── */
export default function StoryGenerator() {
  const [genre,        setGenre]        = useState("fantasy");
  const [prompt,       setPrompt]       = useState("");
  const [protagonist,  setProtagonist]  = useState("");
  const [setting,      setSetting]      = useState("");
  const [tone,         setTone]         = useState("dramatic");
  const [length,       setLength]       = useState("short");
  const [pov,          setPov]          = useState("third");
  const [language,     setLanguage]     = useState("English");
  const [mediaPrompt,  setMediaPrompt]  = useState("");   // image/video prompt line
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [result,       setResult]       = useState(null); // { title, story, imagePrompt, videoPrompt }
  const [copied,       setCopied]       = useState("");
  const [activeTab,    setActiveTab]    = useState("story");

  const charMax   = 800;
  const canSubmit = prompt.trim().length > 5 && !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectedGenre  = GENRES.find(g => g.id === genre);
    const selectedLength = LENGTHS.find(l => l.id === length);
    const selectedPov    = POVS.find(p => p.id === pov);

    const aiPrompt = `You are a master storyteller and creative writer. Write an immersive, compelling story.

Genre: ${selectedGenre?.label} — ${selectedGenre?.desc}
Story Idea / Prompt: ${prompt.trim()}
${protagonist.trim() ? `Protagonist: ${protagonist.trim()}` : ""}
${setting.trim()     ? `Setting: ${setting.trim()}`         : ""}
${mediaPrompt.trim() ? `Visual Style / Mood Reference: ${mediaPrompt.trim()}` : ""}
Tone: ${tone}
Length: ${selectedLength?.label} — ${selectedLength?.desc}
Point of View: ${selectedPov?.label}
Language: ${language}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro text, no explanation, no markdown.
Exact required shape:
{ "title": "...", "story": "...", "imagePrompt": "...", "videoPrompt": "..." }

RULES:
• "title" — a compelling, evocative story title.
• "story" — the complete story text matching the genre, tone, POV, and length described. Use paragraph breaks (\\n\\n) for readability. No chapter headings.
• "imagePrompt" — a detailed image generation prompt (Midjourney / DALL·E style) that captures the key scene or mood of this story. 1–2 sentences, vivid and descriptive.
• "videoPrompt" — a short video generation prompt (Sora / Runway style) describing a cinematic scene from this story. 1–2 sentences, action-oriented with camera direction.
• Write everything in ${language}.
• Do NOT include markdown, code fences, or any text outside the JSON object.`;

    try {
      const res = await generateAI("story-gen", aiPrompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/, "")
        .trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.title || !parsed.story) throw new Error("Invalid response format");

      setResult(parsed);
      setActiveTab("story");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(part) {
    const text =
      part === "title"       ? result.title :
      part === "story"       ? result.story :
      part === "imagePrompt" ? result.imagePrompt :
      part === "videoPrompt" ? result.videoPrompt :
      `${result.title}\n\n${result.story}`;

    navigator.clipboard.writeText(text);
    setCopied(part);
    setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    const text = `${result.title}\n\n${result.story}\n\n---\nImage Prompt:\n${result.imagePrompt}\n\nVideo Prompt:\n${result.videoPrompt}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "story.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setPrompt(""); setProtagonist(""); setSetting(""); setMediaPrompt("");
    setResult(null); setError(""); setCopied("");
    setGenre("fantasy"); setTone("dramatic");
    setLength("short"); setPov("third"); setLanguage("English");
  }

  const selectedGenreData = GENRES.find(g => g.id === genre);
  const GenreIcon = selectedGenreData?.icon;

  return (
    <>
      <Helmet>
        <title>Free AI Story Generator – Create Original Stories Instantly | ShauryaTools</title>
        <meta name="description" content="Generate original, immersive stories instantly with AI. Choose from 12 genres, set tone, length, POV and language. Free AI story writer tool." />
        <meta name="keywords" content="story generator, ai story writer, story creator, ai fiction generator, short story generator, creative writing ai" />
        <link rel="canonical" href="https://shauryatools.vercel.app/story-generator" />
      </Helmet>

      <div className="sg-page">
        <div className="sg-inner">

          {/* ── Header ── */}
          <div className="sg-header">
            <div className="sg-icon">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="sg-cat">AI Creative Tools</span>
              <h1>Story Generator</h1>
              <p>Describe your idea — get a full original story with image & video prompts instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="sg-card">

            {/* Genre */}
            <div className="sg-field">
              <div className="sg-label-row">
                <label className="sg-label">Genre</label>
                {selectedGenreData && (
                  <span className="sg-selected-badge">
                    {GenreIcon && <GenreIcon size={11} strokeWidth={2.5} />}
                    {selectedGenreData.label}
                  </span>
                )}
              </div>
              <div className="sg-genres">
                {GENRES.map(g => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.id}
                      className={`sg-genre-btn ${genre === g.id ? "sg-genre-on" : ""}`}
                      onClick={() => setGenre(g.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="sg-genre-icon" />
                      <span className="sg-genre-label">{g.label}</span>
                      <span className="sg-genre-desc">{g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sg-divider" />

            {/* Story Prompt */}
            <div className="sg-field">
              <div className="sg-label-row">
                <label className="sg-label">
                  <Type size={14} strokeWidth={2.5} className="sg-label-icon" />
                  Story Idea / Prompt
                </label>
                <span className={`sg-char-count ${prompt.length > charMax * 0.9 ? "sg-char-warn" : ""}`}>
                  {prompt.length}/{charMax}
                </span>
              </div>
              <textarea
                className="sg-textarea"
                value={prompt}
                onChange={e => {
                  if (e.target.value.length <= charMax) {
                    setPrompt(e.target.value);
                    setError("");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder={
                  genre === "fantasy"    ? "e.g. A young wizard discovers an ancient map that leads to a forbidden library holding the universe's darkest secrets..." :
                  genre === "scifi"      ? "e.g. The last crew of a generation ship discovers their destination planet is already colonized by their own descendants..." :
                  genre === "horror"     ? "e.g. Every night at 3am the same unknown number calls, and tonight someone finally answered..." :
                  genre === "romance"    ? "e.g. Two rival chefs are forced to share a kitchen for a competition and slowly fall for each other..." :
                                          "Describe your story idea, key plot points, or a scene you want to explore..."
                }
                rows={4}
              />
            </div>

            <div className="sg-divider" />

            {/* Protagonist + Setting */}
            <div className="sg-row">
              <div className="sg-field sg-field-half">
                <label className="sg-label">
                  <User size={14} strokeWidth={2.5} className="sg-label-icon" />
                  Protagonist
                </label>
                <input
                  className="sg-input"
                  type="text"
                  value={protagonist}
                  onChange={e => setProtagonist(e.target.value)}
                  placeholder="e.g. Elara, a skeptical botanist"
                />
              </div>
              <div className="sg-field sg-field-half">
                <label className="sg-label">
                  <Globe size={14} strokeWidth={2.5} className="sg-label-icon" />
                  Setting
                </label>
                <input
                  className="sg-input"
                  type="text"
                  value={setting}
                  onChange={e => setSetting(e.target.value)}
                  placeholder="e.g. Fog-covered Victorian London"
                />
              </div>
            </div>

            <div className="sg-divider" />

            {/* ── Image / Video Prompt Line ── */}
            <div className="sg-field">
              <label className="sg-label">
                <Image size={14} strokeWidth={2.5} className="sg-label-icon" />
                Visual Style / Mood Reference
                <span className="sg-optional-tag">optional</span>
              </label>
              <div className="sg-media-prompt-wrap">
                <div className="sg-media-icons">
                  <span className="sg-media-pill">
                    <Image size={11} strokeWidth={2.5} /> Image
                  </span>
                  <span className="sg-media-pill">
                    <Video size={11} strokeWidth={2.5} /> Video
                  </span>
                </div>
                <input
                  className="sg-input sg-media-input"
                  type="text"
                  value={mediaPrompt}
                  onChange={e => setMediaPrompt(e.target.value)}
                  placeholder="e.g. cinematic dark fantasy, oil painting style, volumetric fog, golden hour..."
                />
              </div>
              <p className="sg-media-hint">
                This guides the AI-generated image &amp; video prompts included in your output.
              </p>
            </div>

            <div className="sg-divider" />

            {/* Tone */}
            <div className="sg-field">
              <label className="sg-label">Tone</label>
              <div className="sg-tones">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    className={`sg-tone-btn ${tone === t.id ? "sg-tone-on" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sg-divider" />

            {/* POV + Length + Language */}
            <div className="sg-row sg-row-3">
              {/* POV */}
              <div className="sg-field">
                <label className="sg-label">
                  <AlignLeft size={14} strokeWidth={2.5} className="sg-label-icon" />
                  Point of View
                </label>
                <div className="sg-povs">
                  {POVS.map(p => (
                    <button
                      key={p.id}
                      className={`sg-pov-btn ${pov === p.id ? "sg-pov-on" : ""}`}
                      onClick={() => setPov(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div className="sg-field">
                <label className="sg-label">Length</label>
                <div className="sg-lengths">
                  {LENGTHS.map(l => (
                    <button
                      key={l.id}
                      className={`sg-length-btn ${length === l.id ? "sg-len-on" : ""}`}
                      onClick={() => setLength(l.id)}
                    >
                      <span className="sg-len-label">{l.label}</span>
                      <span className="sg-len-desc">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="sg-field">
                <label className="sg-label">Language</label>
                <div className="sg-select-wrap">
                  <select
                    className="sg-select"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="sg-select-arrow" />
                </div>
              </div>
            </div>

            {error && (
              <div className="sg-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button className="sg-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="sg-spinner" /> Writing Story...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Story</>}
            </button>

            <p className="sg-hint">Press Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="sg-card sg-skeleton-card animate-in">
              <div className="sg-skel sg-skel-short" />
              <div className="sg-skel" />
              <div className="sg-skel" />
              <div className="sg-skel sg-skel-med" />
              <div className="sg-skel" />
              <div className="sg-skel sg-skel-short" />
              <div className="sg-skel" />
              <div className="sg-skel sg-skel-med" />
              <div className="sg-skel" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="sg-card animate-in">

              {/* Top bar */}
              <div className="sg-result-top">
                <div className="sg-result-meta">
                  {GenreIcon && (
                    <span className="sg-result-badge">
                      <GenreIcon size={11} strokeWidth={2.5} />
                      {selectedGenreData?.label}
                    </span>
                  )}
                  <span className="sg-result-badge sg-badge-tone">{tone}</span>
                  <span className="sg-result-badge sg-badge-pov">{POVS.find(p => p.id === pov)?.label}</span>
                  {language !== "English" && (
                    <span className="sg-result-badge sg-badge-lang">{language}</span>
                  )}
                </div>

                <div className="sg-tabs">
                  <button className={`sg-tab ${activeTab === "story"  ? "sg-tab-on" : ""}`} onClick={() => setActiveTab("story")}>Story</button>
                  <button className={`sg-tab ${activeTab === "prompts"? "sg-tab-on" : ""}`} onClick={() => setActiveTab("prompts")}>
                    <Image size={12} strokeWidth={2.5} /> Prompts
                  </button>
                  <button className={`sg-tab ${activeTab === "raw"    ? "sg-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                </div>

                <div className="sg-actions">
                  <button className="sg-action-btn" onClick={handleReset} title="Start over">
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="sg-action-btn" onClick={handleDownload} title="Download story">
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`sg-copy-btn ${copied === "all" ? "sg-copied" : ""}`} onClick={() => handleCopy("all")}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* ── Story Tab ── */}
              {activeTab === "story" && (
                <div className="sg-story-preview">
                  {/* Title */}
                  <div className="sg-title-block">
                    <div className="sg-section-row">
                      <span className="sg-section-label">Title</span>
                      <button
                        className={`sg-mini-copy ${copied === "title" ? "sg-copied" : ""}`}
                        onClick={() => handleCopy("title")}
                      >
                        {copied === "title"
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <p className="sg-title-text">{result.title}</p>
                  </div>

                  {/* Story Body */}
                  <div className="sg-body-block">
                    <div className="sg-section-row">
                      <span className="sg-section-label">Story</span>
                      <button
                        className={`sg-mini-copy ${copied === "story" ? "sg-copied" : ""}`}
                        onClick={() => handleCopy("story")}
                      >
                        {copied === "story"
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <pre className="sg-body-text">{result.story}</pre>
                  </div>
                </div>
              )}

              {/* ── Prompts Tab ── */}
              {activeTab === "prompts" && (
                <div className="sg-prompts-view">

                  {/* Image Prompt */}
                  <div className="sg-prompt-card sg-prompt-image">
                    <div className="sg-section-row">
                      <span className="sg-prompt-type-badge sg-img-badge">
                        <Image size={12} strokeWidth={2.5} /> Image Prompt
                      </span>
                      <button
                        className={`sg-mini-copy ${copied === "imagePrompt" ? "sg-copied" : ""}`}
                        onClick={() => handleCopy("imagePrompt")}
                      >
                        {copied === "imagePrompt"
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <p className="sg-prompt-text">{result.imagePrompt}</p>
                    <p className="sg-prompt-note">Use with Midjourney, DALL·E, Stable Diffusion</p>
                  </div>

                  {/* Video Prompt */}
                  <div className="sg-prompt-card sg-prompt-video">
                    <div className="sg-section-row">
                      <span className="sg-prompt-type-badge sg-vid-badge">
                        <Video size={12} strokeWidth={2.5} /> Video Prompt
                      </span>
                      <button
                        className={`sg-mini-copy ${copied === "videoPrompt" ? "sg-copied" : ""}`}
                        onClick={() => handleCopy("videoPrompt")}
                      >
                        {copied === "videoPrompt"
                          ? <><Check size={11} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={11} strokeWidth={2.5} /> Copy</>}
                      </button>
                    </div>
                    <p className="sg-prompt-text">{result.videoPrompt}</p>
                    <p className="sg-prompt-note">Use with Sora, Runway, Kling, Pika</p>
                  </div>
                </div>
              )}

              {/* ── Raw Tab ── */}
              {activeTab === "raw" && (
                <pre className="sg-raw">{`${result.title}\n\n${result.story}\n\n---\nImage Prompt:\n${result.imagePrompt}\n\nVideo Prompt:\n${result.videoPrompt}`}</pre>
              )}

              {/* Footer */}
              <div className="sg-result-footer">
                <span className="sg-footer-count">
                  ~{result.story.split(/\s+/).filter(Boolean).length} words
                </span>
                <button className={`sg-copy-full ${copied === "all" ? "sg-copied" : ""}`} onClick={() => handleCopy("all")}>
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Full Story</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
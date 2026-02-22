/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./RelationshipCompatibilityChecker.css";
import { Helmet } from "react-helmet";
import {
  Heart,
  Sparkles,
  RefreshCw,
  AlertCircle,
  User,
  Star,
  Flame,
  MessageCircle,
  Shield,
  Zap,
  Sun,
  Moon,
  Music,
  Coffee,
  Compass,
  ChevronDown,
  HeartHandshake,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

/* ── Relationship Types ── */
const RELATIONSHIP_TYPES = [
  { id: "romantic",      label: "Romantic",        icon: Heart,         desc: "Love & dating"         },
  { id: "friendship",    label: "Friendship",       icon: HeartHandshake,desc: "Close friends"         },
  { id: "marriage",      label: "Marriage",         icon: Star,          desc: "Long-term partnership" },
  { id: "work",          label: "Work Partner",     icon: Zap,           desc: "Professional bond"     },
  { id: "family",        label: "Family",           icon: Shield,        desc: "Family connection"     },
  { id: "soulmate",      label: "Soulmate Check",   icon: Flame,         desc: "Deep soul connection"  },
];

/* ── Zodiac Signs ── */
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/* ── Personality Traits ── */
const PERSONALITY_TRAITS = [
  { id: "introvert",    label: "Introvert",   icon: Moon    },
  { id: "extrovert",    label: "Extrovert",   icon: Sun     },
  { id: "adventurous",  label: "Adventurous", icon: Compass },
  { id: "homebody",     label: "Homebody",    icon: Coffee  },
  { id: "creative",     label: "Creative",    icon: Music   },
  { id: "analytical",   label: "Analytical",  icon: Star    },
];

/* ── Love Languages ── */
const LOVE_LANGUAGES = [
  "Words of Affirmation",
  "Acts of Service",
  "Receiving Gifts",
  "Quality Time",
  "Physical Touch",
];

/* ── Component ── */
export default function RelationshipCompatibilityChecker() {
  const [relType,       setRelType]       = useState("romantic");
  const [person1Name,   setPerson1Name]   = useState("");
  const [person1Zodiac, setPerson1Zodiac] = useState("Aries");
  const [person1Trait,  setPerson1Trait]  = useState("introvert");
  const [person1Love,   setPerson1Love]   = useState("Quality Time");
  const [person1Extra,  setPerson1Extra]  = useState("");
  const [person2Name,   setPerson2Name]   = useState("");
  const [person2Zodiac, setPerson2Zodiac] = useState("Leo");
  const [person2Trait,  setPerson2Trait]  = useState("extrovert");
  const [person2Love,   setPerson2Love]   = useState("Words of Affirmation");
  const [person2Extra,  setPerson2Extra]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [result,        setResult]        = useState(null);

  const charMax   = 300;
  const canSubmit = !loading;

  async function handleCheck() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectedType = RELATIONSHIP_TYPES.find(t => t.id === relType);

    const prompt = `You are a relationship compatibility expert and astrologer. Analyze the compatibility between two people based on the given details.

Relationship Type: ${selectedType?.label} — ${selectedType?.desc}

Person 1:
- Name: ${person1Name.trim() || "Person A"}
- Zodiac Sign: ${person1Zodiac}
- Personality Trait: ${person1Trait}
- Love Language: ${person1Love}
- Additional Info: ${person1Extra.trim() || "None"}

Person 2:
- Name: ${person2Name.trim() || "Person B"}
- Zodiac Sign: ${person2Zodiac}
- Personality Trait: ${person2Trait}
- Love Language: ${person2Love}
- Additional Info: ${person2Extra.trim() || "None"}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro text, no explanation, no markdown.
Exact required shape:
{
  "score": <number 0-100>,
  "verdict": "<one catchy sentence verdict>",
  "summary": "<2-3 sentence overall compatibility summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "challenges": ["<challenge 1>", "<challenge 2>"],
  "advice": "<2-3 sentences of actionable relationship advice>",
  "astroNote": "<1-2 sentences about zodiac compatibility between ${person1Zodiac} and ${person2Zodiac}>",
  "loveLanguageNote": "<1 sentence about how their love languages ${person1Love} and ${person2Love} interact>"
}

RULES:
• score must be a realistic number between 20 and 98.
• verdict must be fun, catchy, and memorable (e.g. "A cosmic collision of hearts!" or "Best friends with electric chemistry!").
• strengths must be specific to THEIR combination, not generic.
• challenges must be honest but constructive.
• advice must be practical and warm.
• Do NOT include markdown, code fences, or any text outside the JSON object.`;

    try {
      const res = await generateAI("compatibility-checker", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/, "")
        .trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.score === "undefined" || !parsed.verdict) throw new Error("Invalid response format");

      setResult(parsed);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPerson1Name(""); setPerson1Zodiac("Aries"); setPerson1Trait("introvert");
    setPerson1Love("Quality Time"); setPerson1Extra("");
    setPerson2Name(""); setPerson2Zodiac("Leo"); setPerson2Trait("extrovert");
    setPerson2Love("Words of Affirmation"); setPerson2Extra("");
    setRelType("romantic"); setResult(null); setError("");
  }

  function getScoreColor(score) {
    if (score >= 80) return "rcc-score-high";
    if (score >= 55) return "rcc-score-mid";
    return "rcc-score-low";
  }

  function getScoreEmoji(score) {
    if (score >= 85) return "💖";
    if (score >= 70) return "💕";
    if (score >= 55) return "💛";
    if (score >= 40) return "🤍";
    return "💔";
  }

  const selectedTypeData = RELATIONSHIP_TYPES.find(t => t.id === relType);
  const TypeIcon = selectedTypeData?.icon;

  return (
    <>
      <Helmet>
        <title>Free AI Relationship Compatibility Checker – Discover Your Match | ShauryaTools</title>
        <meta name="description" content="Check relationship compatibility with AI. Analyze zodiac signs, personality traits, and love languages. Free AI compatibility tool." />
        <meta name="keywords" content="relationship compatibility, zodiac compatibility, love compatibility checker, personality match, ai compatibility tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/relationship-compatibility-checker" />
      </Helmet>

      <div className="rcc-page">
        <div className="rcc-inner">

          {/* ── Header ── */}
          <div className="rcc-header">
            <div className="rcc-icon">
              <Heart size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="rcc-cat">AI Relationship Tools</span>
              <h1>Compatibility Checker</h1>
              <p>Discover how well two people connect — across love, friendship, and beyond.</p>
            </div>
          </div>

          {/* ── Relationship Type ── */}
          <div className="rcc-card">
            <div className="rcc-field">
              <div className="rcc-label-row">
                <label className="rcc-label">Relationship Type</label>
                {selectedTypeData && (
                  <span className="rcc-selected-badge">
                    {TypeIcon && <TypeIcon size={11} strokeWidth={2.5} />}
                    {selectedTypeData.label}
                  </span>
                )}
              </div>
              <div className="rcc-types">
                {RELATIONSHIP_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      className={`rcc-type-btn ${relType === t.id ? "rcc-type-on" : ""}`}
                      onClick={() => setRelType(t.id)}
                    >
                      <Icon size={15} strokeWidth={2} className="rcc-type-icon" />
                      <span className="rcc-type-label">{t.label}</span>
                      <span className="rcc-type-desc">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Two Person Cards ── */}
          <div className="rcc-persons-row">
            {/* Person 1 */}
            <div className="rcc-card rcc-person-card rcc-person1">
              <div className="rcc-person-header">
                <div className="rcc-person-avatar rcc-avatar1">
                  <User size={18} strokeWidth={2} />
                </div>
                <div>
                  <span className="rcc-person-tag">Person 1</span>
                  <input
                    className="rcc-name-input"
                    type="text"
                    value={person1Name}
                    onChange={e => setPerson1Name(e.target.value)}
                    placeholder="Enter name (optional)"
                  />
                </div>
              </div>

              <div className="rcc-divider" />

              {/* Zodiac */}
              <div className="rcc-field">
                <label className="rcc-label">☀️ Zodiac Sign</label>
                <div className="rcc-select-wrap">
                  <select className="rcc-select" value={person1Zodiac} onChange={e => setPerson1Zodiac(e.target.value)}>
                    {ZODIAC_SIGNS.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="rcc-select-arrow" />
                </div>
              </div>

              {/* Personality */}
              <div className="rcc-field">
                <label className="rcc-label">🧠 Personality</label>
                <div className="rcc-traits">
                  {PERSONALITY_TRAITS.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        className={`rcc-trait-btn ${person1Trait === t.id ? "rcc-trait-on" : ""}`}
                        onClick={() => setPerson1Trait(t.id)}
                      >
                        <Icon size={12} strokeWidth={2} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Love Language */}
              <div className="rcc-field">
                <label className="rcc-label">💝 Love Language</label>
                <div className="rcc-select-wrap">
                  <select className="rcc-select" value={person1Love} onChange={e => setPerson1Love(e.target.value)}>
                    {LOVE_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="rcc-select-arrow" />
                </div>
              </div>

              {/* Extra */}
              <div className="rcc-field">
                <div className="rcc-label-row">
                  <label className="rcc-label">✏️ Extra Details</label>
                  <span className={`rcc-char-count ${person1Extra.length > charMax * 0.9 ? "rcc-char-warn" : ""}`}>
                    {person1Extra.length}/{charMax}
                  </span>
                </div>
                <textarea
                  className="rcc-textarea"
                  value={person1Extra}
                  onChange={e => { if (e.target.value.length <= charMax) setPerson1Extra(e.target.value); }}
                  placeholder="e.g. loves hiking, introverted, values loyalty..."
                  rows={2}
                />
              </div>
            </div>

            {/* VS Divider */}
            <div className="rcc-vs">
              <div className="rcc-vs-circle">
                <Heart size={16} strokeWidth={2.5} />
              </div>
              <span className="rcc-vs-text">vs</span>
            </div>

            {/* Person 2 */}
            <div className="rcc-card rcc-person-card rcc-person2">
              <div className="rcc-person-header">
                <div className="rcc-person-avatar rcc-avatar2">
                  <User size={18} strokeWidth={2} />
                </div>
                <div>
                  <span className="rcc-person-tag">Person 2</span>
                  <input
                    className="rcc-name-input"
                    type="text"
                    value={person2Name}
                    onChange={e => setPerson2Name(e.target.value)}
                    placeholder="Enter name (optional)"
                  />
                </div>
              </div>

              <div className="rcc-divider" />

              {/* Zodiac */}
              <div className="rcc-field">
                <label className="rcc-label">☀️ Zodiac Sign</label>
                <div className="rcc-select-wrap">
                  <select className="rcc-select" value={person2Zodiac} onChange={e => setPerson2Zodiac(e.target.value)}>
                    {ZODIAC_SIGNS.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="rcc-select-arrow" />
                </div>
              </div>

              {/* Personality */}
              <div className="rcc-field">
                <label className="rcc-label">🧠 Personality</label>
                <div className="rcc-traits">
                  {PERSONALITY_TRAITS.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        className={`rcc-trait-btn ${person2Trait === t.id ? "rcc-trait-on" : ""}`}
                        onClick={() => setPerson2Trait(t.id)}
                      >
                        <Icon size={12} strokeWidth={2} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Love Language */}
              <div className="rcc-field">
                <label className="rcc-label">💝 Love Language</label>
                <div className="rcc-select-wrap">
                  <select className="rcc-select" value={person2Love} onChange={e => setPerson2Love(e.target.value)}>
                    {LOVE_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="rcc-select-arrow" />
                </div>
              </div>

              {/* Extra */}
              <div className="rcc-field">
                <div className="rcc-label-row">
                  <label className="rcc-label">✏️ Extra Details</label>
                  <span className={`rcc-char-count ${person2Extra.length > charMax * 0.9 ? "rcc-char-warn" : ""}`}>
                    {person2Extra.length}/{charMax}
                  </span>
                </div>
                <textarea
                  className="rcc-textarea"
                  value={person2Extra}
                  onChange={e => { if (e.target.value.length <= charMax) setPerson2Extra(e.target.value); }}
                  placeholder="e.g. spontaneous, loves music, needs space..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rcc-error-msg">
              <AlertCircle size={14} strokeWidth={2.5} />
              {error}
            </div>
          )}

          {/* ── Check Button ── */}
          <button className="rcc-gen-btn" onClick={handleCheck} disabled={!canSubmit}>
            {loading
              ? <><span className="rcc-spinner" /> Analyzing Compatibility...</>
              : <><Sparkles size={16} strokeWidth={2} /> Check Compatibility</>}
          </button>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="rcc-card rcc-skeleton-card animate-in">
              <div className="rcc-skel rcc-skel-circle" />
              <div className="rcc-skel rcc-skel-short" />
              <div className="rcc-skel" />
              <div className="rcc-skel rcc-skel-med" />
              <div className="rcc-skel" />
              <div className="rcc-skel rcc-skel-short" />
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="rcc-card rcc-result animate-in">

              {/* Score */}
              <div className="rcc-score-section">
                <div className={`rcc-score-circle ${getScoreColor(result.score)}`}>
                  <span className="rcc-score-num">{result.score}</span>
                  <span className="rcc-score-pct">%</span>
                </div>
                <div className="rcc-score-info">
                  <div className="rcc-score-emoji">{getScoreEmoji(result.score)}</div>
                  <h2 className="rcc-verdict">{result.verdict}</h2>
                  <p className="rcc-summary">{result.summary}</p>
                </div>
              </div>

              {/* Score Bar */}
              <div className="rcc-bar-wrap">
                <div className="rcc-bar-track">
                  <div
                    className={`rcc-bar-fill ${getScoreColor(result.score)}`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
                <div className="rcc-bar-labels">
                  <span>Incompatible</span>
                  <span>Neutral</span>
                  <span>Perfect Match</span>
                </div>
              </div>

              <div className="rcc-divider" />

              {/* Strengths & Challenges */}
              <div className="rcc-insights-row">
                <div className="rcc-insight-block rcc-strengths">
                  <div className="rcc-insight-header">
                    <CheckCircle size={15} strokeWidth={2.5} className="rcc-insight-icon rcc-icon-green" />
                    <span>Strengths</span>
                  </div>
                  <ul className="rcc-insight-list">
                    {result.strengths?.map((s, i) => (
                      <li key={i} className="rcc-insight-item rcc-strength-item">
                        <TrendingUp size={12} strokeWidth={2.5} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rcc-insight-block rcc-challenges">
                  <div className="rcc-insight-header">
                    <AlertTriangle size={15} strokeWidth={2.5} className="rcc-insight-icon rcc-icon-amber" />
                    <span>Challenges</span>
                  </div>
                  <ul className="rcc-insight-list">
                    {result.challenges?.map((c, i) => (
                      <li key={i} className="rcc-insight-item rcc-challenge-item">
                        <Zap size={12} strokeWidth={2.5} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rcc-divider" />

              {/* Astro & Love Language Notes */}
              <div className="rcc-notes-row">
                <div className="rcc-note-block">
                  <span className="rcc-note-label">⭐ Astro Insight</span>
                  <p className="rcc-note-text">{result.astroNote}</p>
                </div>
                <div className="rcc-note-block">
                  <span className="rcc-note-label">💝 Love Language Match</span>
                  <p className="rcc-note-text">{result.loveLanguageNote}</p>
                </div>
              </div>

              <div className="rcc-divider" />

              {/* Advice */}
              <div className="rcc-advice-block">
                <div className="rcc-advice-header">
                  <MessageCircle size={15} strokeWidth={2.5} />
                  <span>Relationship Advice</span>
                </div>
                <p className="rcc-advice-text">{result.advice}</p>
              </div>

              {/* Footer */}
              <div className="rcc-result-footer">
                <span className="rcc-footer-note">✨ Results are for fun & insight only</span>
                <button className="rcc-reset-btn" onClick={handleReset}>
                  <RefreshCw size={13} strokeWidth={2.5} /> Check Again
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
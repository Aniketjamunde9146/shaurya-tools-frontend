/* eslint-disable no-empty */
import { useState, useEffect, useRef } from "react";
import { generateAI } from "../api";
import "./FlashcardGenerator.css";
import { Helmet } from "react-helmet";
import {
  Layers,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Brain,
  Zap,
  FileText,
  Target,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Eye,
  EyeOff,
  Hash,
  Star,
  StarOff,
  List,
  Grid,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

/* ── Subjects ── */
const SUBJECTS = [
  { id: "general",  label: "General",   icon: Brain   },
  { id: "science",  label: "Science",   icon: Zap     },
  { id: "history",  label: "History",   icon: BookOpen},
  { id: "language", label: "Language",  icon: FileText},
  { id: "math",     label: "Math",      icon: Hash    },
  { id: "custom",   label: "Custom",    icon: Target  },
];

/* ── Card Counts ── */
const COUNTS = [
  { id: "5",  label: "5",  desc: "Quick set"  },
  { id: "10", label: "10", desc: "Standard"   },
  { id: "15", label: "15", desc: "Study set"  },
  { id: "20", label: "20", desc: "Full deck"  },
  { id: "25", label: "25", desc: "Exam prep"  },
];

/* ── Difficulty ── */
const DIFFICULTIES = [
  { id: "beginner",     label: "Beginner",     desc: "Basic recall"        },
  { id: "intermediate", label: "Intermediate", desc: "Understanding"       },
  { id: "advanced",     label: "Advanced",     desc: "Deep analysis"       },
  { id: "mixed",        label: "Mixed",        desc: "All levels"          },
];

/* ── Card Style ── */
const CARD_STYLES = [
  { id: "term-def",    label: "Term / Definition", icon: BookOpen, desc: "Classic vocab style"   },
  { id: "qa",          label: "Q&A",               icon: Brain,    desc: "Question & answer"     },
  { id: "fill-blank",  label: "Fill in Blank",     icon: FileText, desc: "Cloze deletion"        },
  { id: "concept",     label: "Concept Map",       icon: Layers,   desc: "Idea & explanation"    },
];

/* ── Parse AI output into card objects ── */
function parseCards(raw) {
  const cards = [];
  // Match patterns like:  **Card 1** or ### Card 1 or CARD 1:
  const blocks = raw.split(/\n(?=\*\*Card\s+\d+|\#{1,3}\s+Card\s+\d+|Card\s+\d+:)/gi);
  for (const block of blocks) {
    if (!block.trim()) continue;
    // front: line starting with Front: or Q: or Term:
    const frontMatch = block.match(/(?:Front|Q(?:uestion)?|Term)\s*[:\-]\s*(.+?)(?:\n|$)/i);
    // back: line starting with Back: or A: or Definition:
    const backMatch  = block.match(/(?:Back|A(?:nswer)?|Definition|Explanation)\s*[:\-]\s*([\s\S]+?)(?:\n\*\*Card|\n###\s+Card|\n\n|$)/i);
    if (frontMatch && backMatch) {
      cards.push({
        id:      cards.length,
        front:   frontMatch[1].trim().replace(/\*\*/g, ""),
        back:    backMatch[1].trim().replace(/\*\*/g, ""),
        starred: false,
        known:   false,
      });
    }
  }
  return cards;
}

/* ── Single flip card ── */
function FlipCard({ card, flipped, onFlip, size = "lg" }) {
  return (
    <div
      className={`fcard-scene fcard-${size} ${flipped ? "fcard-flipped" : ""}`}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === " " || e.key === "Enter" ? onFlip() : null}
    >
      <div className="fcard-body">
        <div className="fcard-face fcard-front">
          <span className="fcard-side-label">Question</span>
          <p className="fcard-text">{card.front}</p>
          <span className="fcard-tap-hint">Tap to reveal</span>
        </div>
        <div className="fcard-face fcard-back">
          <span className="fcard-side-label fcard-side-back">Answer</span>
          <p className="fcard-text">{card.back}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Study mode ── */
function StudyMode({ cards, onClose }) {
  const [idx,       setIdx]     = useState(0);
  const [flipped,   setFlipped] = useState(false);
  const [deck,      setDeck]    = useState(cards.map((c, i) => ({ ...c, id: i })));
  const [finished,  setFin]     = useState(false);

  const card = deck[idx];
  const known  = deck.filter(c => c.known).length;
  const pct    = Math.round((known / deck.length) * 100);

  function mark(val) {
    setDeck(d => d.map((c, i) => i === idx ? { ...c, known: val } : c));
    next();
  }

  function next() {
    setFlipped(false);
    setTimeout(() => {
      if (idx + 1 >= deck.length) setFin(true);
      else setIdx(i => i + 1);
    }, 120);
  }

  function prev() { setFlipped(false); setTimeout(() => setIdx(i => Math.max(0, i - 1)), 120); }

  function restart() { setIdx(0); setFlipped(false); setFin(false); setDeck(cards.map((c, i) => ({ ...c, id: i, known: false }))); }

  function shuffle() {
    const shuffled = [...deck].sort(() => Math.random() - 0.5).map((c, i) => ({ ...c, id: i }));
    setDeck(shuffled); setIdx(0); setFlipped(false); setFin(false);
  }

  return (
    <div className="study-overlay">
      <div className="study-modal">
        {/* Header */}
        <div className="study-header">
          <div className="study-progress-wrap">
            <div className="study-progress-bar" style={{ width: `${((idx + 1) / deck.length) * 100}%` }} />
          </div>
          <div className="study-meta">
            <span className="study-counter">{idx + 1} / {deck.length}</span>
            <div className="study-actions-top">
              <button className="study-icon-btn" onClick={shuffle} title="Shuffle"><Shuffle size={15} strokeWidth={2} /></button>
              <button className="study-icon-btn" onClick={restart} title="Restart"><RotateCcw size={15} strokeWidth={2} /></button>
              <button className="study-icon-btn study-close-btn" onClick={onClose}><X size={16} strokeWidth={2} /></button>
            </div>
          </div>
        </div>

        {/* Card or finish screen */}
        {finished ? (
          <div className="study-finish">
            <div className="study-finish-icon"><CheckCircle2 size={48} strokeWidth={1.5} /></div>
            <h2>Deck Complete!</h2>
            <p>{known} / {deck.length} cards marked as known ({pct}%)</p>
            <div className="study-finish-bar"><div style={{ width: `${pct}%` }} /></div>
            <div className="study-finish-btns">
              <button className="study-btn-sec" onClick={onClose}>Back to deck</button>
              <button className="study-btn-pri" onClick={restart}>Study again</button>
            </div>
          </div>
        ) : (
          <>
            <div className="study-card-wrap">
              <FlipCard card={card} flipped={flipped} onFlip={() => setFlipped(f => !f)} size="study" />
            </div>

            {/* Known / Unknown buttons */}
            {flipped && (
              <div className="study-verdict animate-verdict">
                <button className="verdict-no"  onClick={() => mark(false)}><X size={18} strokeWidth={2.5} />Still learning</button>
                <button className="verdict-yes" onClick={() => mark(true)}><Check size={18} strokeWidth={2.5} />Got it!</button>
              </div>
            )}

            {/* Nav */}
            <div className="study-nav">
              <button className="study-nav-btn" onClick={prev} disabled={idx === 0}><ChevronLeft size={18} strokeWidth={2} /></button>
              <div className="study-dots">
                {deck.map((c, i) => (
                  <span key={i} className={`study-dot ${i === idx ? "dot-active" : ""} ${c.known ? "dot-known" : ""}`} />
                ))}
              </div>
              <button className="study-nav-btn" onClick={next}><ChevronRight size={18} strokeWidth={2} /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function FlashcardGenerator() {
  const [topic,      setTopic]     = useState("");
  const [notes,      setNotes]     = useState("");
  const [subject,    setSubject]   = useState("general");
  const [count,      setCount]     = useState("10");
  const [difficulty, setDiff]      = useState("mixed");
  const [cardStyle,  setStyle]     = useState("term-def");
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState("");
  const [cards,      setCards]     = useState([]);
  const [rawOutput,  setRaw]       = useState("");
  const [viewMode,   setViewMode]  = useState("grid");  // grid | list
  const [flippedMap, setFlipped]   = useState({});
  const [studying,   setStudying]  = useState(false);
  const [wordCount,  setWordCount] = useState(0);
  const [copied,     setCopied]    = useState(false);
  const [activeTab,  setActiveTab] = useState("cards"); // cards | raw

  const charMax = 5000;
  const canSubmit = (topic.trim().length > 2 || notes.trim().length > 10) && !loading;

  function handleNotesChange(e) {
    const v = e.target.value;
    if (v.length <= charMax) {
      setNotes(v);
      setWordCount(v.trim() ? v.trim().split(/\s+/).length : 0);
      setError("");
    }
  }

  function toggleFlip(id) {
    setFlipped(m => ({ ...m, [id]: !m[id] }));
  }

  function toggleStar(id) {
    setCards(cs => cs.map(c => c.id === id ? { ...c, starred: !c.starred } : c));
  }

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true); setError(""); setCards([]); setRaw(""); setFlipped({});

    const styleGuide = {
      "term-def":   `Format each card strictly as:\nFront: [Term or concept]\nBack: [Clear, concise definition — 1-3 sentences]`,
      "qa":         `Format each card strictly as:\nFront: [A question about the topic]\nBack: [Complete answer — 1-3 sentences]`,
      "fill-blank": `Format each card strictly as:\nFront: [Sentence with a key term replaced by _____]\nBack: [The missing term + full sentence for context]`,
      "concept":    `Format each card strictly as:\nFront: [Core concept or idea name]\nBack: [Explanation of the concept, why it matters, and one example]`,
    };

    const src = notes.trim()
      ? `Study Material:\n"""\n${notes.trim()}\n"""`
      : `Topic: ${topic.trim()}`;

    const prompt = `You are an expert educator specializing in spaced repetition and active recall flashcard creation.

Generate exactly ${count} high-quality flashcards.

${src}
Subject Area: ${SUBJECTS.find(s => s.id === subject)?.label}
Difficulty: ${difficulty}
Card Style: ${CARD_STYLES.find(s => s.id === cardStyle)?.label}

${styleGuide[cardStyle]}

STRICT FORMAT RULES:
• Start each card with: **Card [N]** (e.g. **Card 1**, **Card 2**, etc.)
• Then immediately the Front: line, then the Back: line.
• No extra text between cards. No preamble. No commentary after.
• Keep Front concise (under 20 words). Back can be 1–4 sentences.
• Make cards directly useful for studying — not trivial, not overly complex.
• Vary the cards — don't repeat similar concepts.
• Cards must be directly grounded in the provided material/topic.

Example format:
**Card 1**
Front: [question or term here]
Back: [answer or definition here]

**Card 2**
Front: [next question]
Back: [next answer]

Generate all ${count} cards now:`;

    try {
      const res = await generateAI("flashcard", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim()
        .replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();

      setRaw(raw);
      const parsed = parseCards(raw);
      if (parsed.length === 0) throw new Error("Could not parse cards");
      setCards(parsed);
      setActiveTab("cards");
    } catch (e) {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    const blob = new Blob([rawOutput], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `flashcards-${(topic || "deck").replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click(); URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setTopic(""); setNotes(""); setSubject("general"); setCount("10");
    setDiff("mixed"); setStyle("term-def"); setCards([]); setRaw("");
    setError(""); setFlipped({}); setWordCount(0); setCopied(false);
  }

  const starred = cards.filter(c => c.starred);

  return (
    <>
      <Helmet>
        <title>Free AI Flashcard Generator – Study Cards from Notes | ShauryaTools</title>
        <meta name="description" content="Generate AI-powered flashcards instantly from your study notes or any topic. Flip cards, study mode with spaced repetition, star important cards, and download your deck. Free tool." />
        <meta name="keywords" content="flashcard generator, ai flashcards, study cards generator, flashcard maker, spaced repetition, active recall, study tool, notes to flashcards" />
        <link rel="canonical" href="https://shauryatools.vercel.app/flashcard-generator" />
      </Helmet>

      <div className="fg-page">
        <div className="fg-inner">

          {/* ── Header ── */}
          <div className="fg-header">
            <div className="fg-icon"><Layers size={20} strokeWidth={2} /></div>
            <div>
              <span className="fg-cat">AI Study Tools</span>
              <h1>Flashcard Generator</h1>
              <p>Paste your notes or enter a topic — get a full study deck with flip cards, study mode & more.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="fg-card">

            {/* Topic */}
            <div className="fg-field">
              <label className="fg-label"><Target size={14} strokeWidth={2.5} className="fg-lbl-icon" />Topic</label>
              <input
                className="fg-input"
                type="text"
                placeholder="e.g. Photosynthesis, World War II, Python Decorators..."
                value={topic}
                onChange={e => { setTopic(e.target.value); setError(""); }}
              />
            </div>

            {/* OR divider */}
            <div className="fg-or"><span>OR paste your notes</span></div>

            {/* Notes */}
            <div className="fg-field">
              <div className="fg-label-row">
                <label className="fg-label"><FileText size={14} strokeWidth={2.5} className="fg-lbl-icon" />Study Notes</label>
                <div className="fg-meta-row">
                  {wordCount > 0 && <span className="fg-word-pill">{wordCount} words</span>}
                  <span className={`fg-char-count ${notes.length > charMax * 0.9 ? "fg-char-warn" : ""}`}>
                    {notes.length}/{charMax}
                  </span>
                </div>
              </div>
              <textarea
                className="fg-textarea"
                value={notes}
                onChange={handleNotesChange}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder="Paste your lecture notes, textbook content, or any study material here..."
                rows={6}
              />
              <p className="fg-hint">Ctrl+Enter to generate · {charMax - notes.length} chars remaining</p>
            </div>

            {error && (
              <div className="fg-error"><AlertCircle size={14} strokeWidth={2.5} />{error}</div>
            )}

            <div className="fg-divider" />

            {/* Subject */}
            <div className="fg-field">
              <label className="fg-label"><BookOpen size={14} strokeWidth={2.5} className="fg-lbl-icon" />Subject</label>
              <div className="fg-grid fg-grid-6">
                {SUBJECTS.map(s => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id} className={`fg-opt-btn ${subject === s.id ? "fg-opt-on" : ""}`} onClick={() => setSubject(s.id)}>
                      <Icon size={14} strokeWidth={2} className="fg-opt-icon" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="fg-divider" />

            {/* Card Style + Count */}
            <div className="fg-row-2">
              <div className="fg-field">
                <label className="fg-label"><Layers size={14} strokeWidth={2.5} className="fg-lbl-icon" />Card Style</label>
                <div className="fg-grid fg-grid-2">
                  {CARD_STYLES.map(s => {
                    const Icon = s.icon;
                    return (
                      <button key={s.id} className={`fg-fmt-btn ${cardStyle === s.id ? "fg-fmt-on" : ""}`} onClick={() => setStyle(s.id)}>
                        <Icon size={14} strokeWidth={2} className="fg-fmt-icon" />
                        <span className="fg-fmt-label">{s.label}</span>
                        <span className="fg-fmt-desc">{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="fg-field">
                <label className="fg-label"><Hash size={14} strokeWidth={2.5} className="fg-lbl-icon" />Card Count</label>
                <div className="fg-grid fg-grid-5">
                  {COUNTS.map(c => (
                    <button key={c.id} className={`fg-cnt-btn ${count === c.id ? "fg-cnt-on" : ""}`} onClick={() => setCount(c.id)}>
                      <span className="fg-cnt-val">{c.label}</span>
                      <span className="fg-cnt-desc">{c.desc}</span>
                    </button>
                  ))}
                </div>

                <label className="fg-label" style={{ marginTop: 14 }}><Brain size={14} strokeWidth={2.5} className="fg-lbl-icon" />Difficulty</label>
                <div className="fg-grid fg-grid-4">
                  {DIFFICULTIES.map(d => (
                    <button key={d.id} className={`fg-diff-btn ${difficulty === d.id ? "fg-diff-on" : ""}`} onClick={() => setDiff(d.id)}>
                      <span className="fg-diff-label">{d.label}</span>
                      <span className="fg-diff-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate */}
            <button className="fg-submit" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="fg-spinner" />Generating Flashcards...</>
                : <><Sparkles size={16} strokeWidth={2} />Generate Flashcards</>}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="fg-card fg-skel-card animate-in">
              {[55,100,70,100,80,100].map((w,i) => (
                <div key={i} className="fg-skel" style={{ width: `${w}%`, height: i % 3 === 0 ? 18 : 14 }} />
              ))}
            </div>
          )}

          {/* ── Results ── */}
          {cards.length > 0 && !loading && (
            <div className="fg-card animate-in">

              {/* Result top bar */}
              <div className="fg-result-top">
                <div className="fg-result-meta">
                  <span className="fg-badge"><Layers size={12} strokeWidth={2.5} />{cards.length} Cards</span>
                  <span className="fg-badge fg-badge-style">{CARD_STYLES.find(s => s.id === cardStyle)?.label}</span>
                  <span className="fg-badge fg-badge-diff">{DIFFICULTIES.find(d => d.id === difficulty)?.label}</span>
                  {starred.length > 0 && <span className="fg-badge fg-badge-star"><Star size={11} strokeWidth={2} />{starred.length} starred</span>}
                </div>

                <div className="fg-result-right">
                  {/* View toggle */}
                  <div className="fg-view-toggle">
                    <button className={`fg-view-btn ${viewMode === "grid" ? "fg-view-on" : ""}`} onClick={() => setViewMode("grid")}><Grid size={13} strokeWidth={2} /></button>
                    <button className={`fg-view-btn ${viewMode === "list" ? "fg-view-on" : ""}`} onClick={() => setViewMode("list")}><List size={13} strokeWidth={2} /></button>
                  </div>

                  {/* Tabs */}
                  <div className="fg-tabs">
                    <button className={`fg-tab ${activeTab === "cards" ? "fg-tab-on" : ""}`} onClick={() => setActiveTab("cards")}>Cards</button>
                    <button className={`fg-tab ${activeTab === "raw"   ? "fg-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                  </div>

                  {/* Actions */}
                  <div className="fg-actions">
                    <button className="fg-action-btn" onClick={handleReset}><RefreshCw size={13} strokeWidth={2.5} />New</button>
                    <button className="fg-action-btn" onClick={handleDownload}><Download size={13} strokeWidth={2.5} />Save</button>
                    <button className={`fg-copy-btn ${copied ? "fg-copied" : ""}`} onClick={handleCopy}>
                      {copied ? <><Check size={13} strokeWidth={2.5} />Copied!</> : <><Copy size={13} strokeWidth={2.5} />Copy</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Study mode button */}
              {activeTab === "cards" && (
                <button className="fg-study-btn" onClick={() => setStudying(true)}>
                  <Brain size={16} strokeWidth={2} />
                  Study Mode — flip through all {cards.length} cards
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
              )}

              {/* Cards grid/list */}
              {activeTab === "cards" && (
                <div className={`fg-cards-wrap ${viewMode === "list" ? "fg-cards-list" : "fg-cards-grid"}`}>
                  {cards.map(card => (
                    <div key={card.id} className={`fg-card-item ${viewMode === "list" ? "fg-card-list-item" : ""}`}>
                      {viewMode === "grid" ? (
                        <>
                          <FlipCard card={card} flipped={!!flippedMap[card.id]} onFlip={() => toggleFlip(card.id)} />
                          <div className="fg-card-foot">
                            <span className="fg-card-num">#{card.id + 1}</span>
                            <button className="fg-star-btn" onClick={() => toggleStar(card.id)}>
                              {card.starred
                                ? <Star size={14} strokeWidth={2} style={{ color: "var(--fg-amber)", fill: "var(--fg-amber)" }} />
                                : <StarOff size={14} strokeWidth={2} />}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="fg-list-row">
                          <span className="fg-list-num">#{card.id + 1}</span>
                          <div className="fg-list-content">
                            <div className="fg-list-front"><Eye size={12} strokeWidth={2} />{card.front}</div>
                            <div className="fg-list-back"><EyeOff size={12} strokeWidth={2} />{card.back}</div>
                          </div>
                          <button className="fg-star-btn" onClick={() => toggleStar(card.id)}>
                            {card.starred
                              ? <Star size={14} strokeWidth={2} style={{ color: "var(--fg-amber)", fill: "var(--fg-amber)" }} />
                              : <StarOff size={14} strokeWidth={2} />}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Raw tab */}
              {activeTab === "raw" && <pre className="fg-raw">{rawOutput}</pre>}

              {/* Footer */}
              <div className="fg-result-footer">
                <span className="fg-footer-count">{cards.length} flashcards · {rawOutput.split(/\s+/).filter(Boolean).length} words</span>
                <button className={`fg-copy-full ${copied ? "fg-copied" : ""}`} onClick={handleCopy}>
                  {copied ? <><Check size={14} strokeWidth={2.5} />Copied!</> : <><Copy size={14} strokeWidth={2.5} />Copy All Cards</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Study mode overlay ── */}
      {studying && <StudyMode cards={cards} onClose={() => setStudying(false)} />}
    </>
  );
}
import { useState } from "react";
import { generateAI } from "../api";
import "./Prompt.css";

import { Helmet } from "react-helmet";
import {
  
  Sparkles,
  Bot,
  Image,
  Code,
  Video,
  Mail,
  Lightbulb,
  BarChart,
  MessageSquare,
  Wand2,
  Cpu,
} from "lucide-react";


const AI_TOOLS = [
  { id: "chatgpt",    label: "ChatGPT",    icon: <Bot size={18} /> },
  { id: "claude",     label: "Claude",     icon: <Sparkles size={18} /> },
  { id: "midjourney", label: "Midjourney", icon: <Image size={18} /> },
  { id: "dalle",      label: "DALL·E",     icon: <Wand2 size={18} /> },
  { id: "gemini",     label: "Gemini",     icon: <Cpu size={18} /> },
  { id: "sora",       label: "Sora",       icon: <Video size={18} /> },
];


const OUTPUT_TYPES = [
  { id: "text",     label: "Text",        icon: <MessageSquare size={18} /> },
  { id: "image",    label: "Image",       icon: <Image size={18} /> },
  { id: "code",     label: "Code",        icon: <Code size={18} /> },
  { id: "video",    label: "Video",       icon: <Video size={18} /> },
  { id: "email",    label: "Email",       icon: <Mail size={18} /> },
  { id: "post",     label: "Social Post", icon: <MessageSquare size={18} /> },
  { id: "idea",     label: "Brainstorm",  icon: <Lightbulb size={18} /> },
  { id: "analysis", label: "Analysis",    icon: <BarChart size={18} /> },
];


const TONES = [
  "Professional", "Casual", "Creative", "Formal",
  "Friendly", "Persuasive", "Witty", "Empathetic",
];

const LENGTHS = [
  { id: "short",    label: "Short",    desc: "~100 words" },
  { id: "medium",   label: "Medium",   desc: "~300 words" },
  { id: "long",     label: "Long",     desc: "~600 words" },
  { id: "detailed", label: "Detailed", desc: "No limit"   },
];

const STEPS = ["Goal", "Details", "Style"];

/* ── Icons ── */
function IconCopy() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconArrowR() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
function IconArrowL() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}
function IconSpark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

/* ── Main ── */
export default function Prompt() {
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [result,  setResult]  = useState("");
  const [error,   setError]   = useState("");

  const [goal,       setGoal]       = useState("");
  const [aiTool,     setAiTool]     = useState("chatgpt");
  const [outputType, setOutputType] = useState("text");
  const [audience,   setAudience]   = useState("");
  const [context,    setContext]    = useState("");
  const [tone,       setTone]       = useState("Professional");
  const [length,     setLength]     = useState("medium");
  const [extras,     setExtras]     = useState("");

  const canNext = step === 0 ? goal.trim().length > 5 : true;
  const activeTool = AI_TOOLS.find(t => t.id === aiTool);

 async function handleGenerate() {
  setLoading(true);
  setError("");
  setResult("");
  setStep(3);

  const toolLabel   = activeTool?.label || aiTool;
  const outputLabel = OUTPUT_TYPES.find(t => t.id === outputType)?.label || outputType;

  const msg = `You are a world-class prompt engineer. Write the single best prompt for ${toolLabel}.

User needs:
- GOAL: ${goal}
- OUTPUT TYPE: ${outputLabel}
- AUDIENCE: ${audience || "General"}
- CONTEXT: ${context || "None"}
- TONE: ${tone}
- LENGTH: ${length}
- EXTRAS: ${extras || "None"}

STRICT OUTPUT RULES:
• Output ONLY the prompt.
• No intro text.
• No quotes.
• No explanation.
• No code blocks.`;

  try {
    const res = await generateAI("prompt", msg);

    if (!res.data.success) {
      throw new Error("Prompt generation failed");
    }

    let raw = res.data.data || "";

    // Clean extra formatting
    raw = raw.replace(/^```[\w]*\n?/, "")
             .replace(/\n?```$/, "")
             .replace(/^["']|["']$/g, "")
             .trim();

    setResult(raw);

  } catch (e) {
    console.error("Prompt Error:", e);
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}


  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleReset() {
    setStep(0); setResult(""); setError("");
    setGoal(""); setAudience(""); setContext(""); setExtras("");
    setCopied(false);
  }

  return (
    <>
    <Helmet>
      <title>Free AI Prompt Generator – ChatGPT, Claude, Midjourney & More</title>
      <meta name="description" content="Generate perfectly structured AI prompts in 3 steps. Select your AI tool, describe your goal, choose tone and length. Free prompt builder for all AI models." />
      <meta name="keywords" content="ai prompt generator, chatgpt prompt, claude prompt, midjourney prompt, prompt builder, ai prompt tool, prompt engineering" />
      <link rel="canonical" href="https://shauryatools.vercel.app/prompt-generator" />
    </Helmet>
    <div className="pt-page">
      <div className="pt-inner">

        {/* ── Page Header ── */}
        <div className="pt-header">
          <div className="pt-icon"><IconSpark /></div>
          <div>
            <span className="pt-cat">AI Utilities</span>
            <h1>Prompt Generator</h1>
            <p>Answer 3 quick questions — get a perfect AI prompt, ready to paste.</p>
          </div>
        </div>

        {/* ── Step Bar ── */}
        {step < 3 && (
          <div className="pt-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`pt-step ${i === step ? "ps-active" : i < step ? "ps-done" : "ps-upcoming"}`}>
                <div className="pt-dot">
                  {i < step ? <IconCheck /> : <span>{i + 1}</span>}
                </div>
                <span className="pt-step-label">{s}</span>
                {i < 2 && <div className={`pt-line ${i < step ? "pl-done" : ""}`} />}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 0: Goal ── */}
        {step === 0 && (
          <div className="pt-card animate-in">

            <div className="pt-field">
              <label className="pt-label">What do you want to achieve? <span className="pt-req">*</span></label>
              <p className="pt-sub">Describe your goal in plain words — more detail = better prompt.</p>
              <textarea
                className="pt-textarea"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Write a product description for my handmade candles that converts visitors to buyers..."
                rows={4}
                maxLength={500}
                autoFocus
              />
              <span className="pt-char">{goal.length} / 500</span>
            </div>

            <div className="pt-divider" />

            <div className="pt-field">
              <label className="pt-label">Which AI tool?</label>
              <div className="pt-tool-grid">
                {AI_TOOLS.map(t => (
                  <button
                    key={t.id}
                    className={`pt-tool-btn ${aiTool === t.id ? "pt-sel" : ""}`}
                    onClick={() => setAiTool(t.id)}
                  >
                   <span className="pt-tool-icon">
  {t.icon}
</span>

                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-divider" />

            <div className="pt-field">
              <label className="pt-label">Output type?</label>
              <div className="pt-output-grid">
                {OUTPUT_TYPES.map(t => (
                  <button
                    key={t.id}
                    className={`pt-output-btn ${outputType === t.id ? "pt-sel" : ""}`}
                    onClick={() => setOutputType(t.id)}
                  >
                    <span className="pt-out-icon">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <div className="pt-card animate-in">
            <div className="pt-field">
              <label className="pt-label">Who is your target audience?</label>
              <p className="pt-sub">Helps tailor language and complexity. Leave blank for general.</p>
              <input
                className="pt-input"
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. Startup founders, college students, fitness beginners..."
              />
            </div>
            <div className="pt-divider" />
            <div className="pt-field">
              <label className="pt-label">Any context or background? <span className="pt-opt">(optional)</span></label>
              <p className="pt-sub">Brand details, product info, situation — anything relevant.</p>
              <textarea
                className="pt-textarea"
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="e.g. My brand is eco-friendly, targeting Gen Z, launching in March..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Style ── */}
        {step === 2 && (
          <div className="pt-card animate-in">
            <div className="pt-field">
              <label className="pt-label">Tone of voice</label>
              <div className="pt-tone-wrap">
                {TONES.map(t => (
                  <button
                    key={t}
                    className={`pt-tone-btn ${tone === t ? "pt-sel" : ""}`}
                    onClick={() => setTone(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-divider" />

            <div className="pt-field">
              <label className="pt-label">Output length</label>
              <div className="pt-length-grid">
                {LENGTHS.map(l => (
                  <button
                    key={l.id}
                    className={`pt-length-btn ${length === l.id ? "pt-sel" : ""}`}
                    onClick={() => setLength(l.id)}
                  >
                    <span className="pt-len-label">{l.label}</span>
                    <span className="pt-len-desc">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-divider" />

            <div className="pt-field">
              <label className="pt-label">Extra instructions <span className="pt-opt">(optional)</span></label>
              <input
                className="pt-input"
                value={extras}
                onChange={e => setExtras(e.target.value)}
                placeholder='e.g. "Use bullet points", "Include 3 examples", "Avoid jargon"'
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === 3 && (
          <div className="pt-card animate-in">
            {loading ? (
              <div className="pt-loading">
                <div className="pt-spinner" />
                <p>Writing your prompt…</p>
                <span>Optimising for {activeTool?.label}</span>
              </div>
            ) : error ? (
              <div className="pt-error">
                <p>⚠️ {error}</p>
                <button className="pt-retry-btn" onClick={handleGenerate}>Try Again</button>
              </div>
            ) : (
              <div className="pt-result animate-in">
                {/* Context pills */}
                <div className="pt-pills">
                  <span className="pt-pill pt-pill-blue">{activeTool?.icon} {activeTool?.label}</span>
                  <span className="pt-pill pt-pill-orange">{OUTPUT_TYPES.find(t => t.id === outputType)?.icon} {OUTPUT_TYPES.find(t => t.id === outputType)?.label}</span>
                  <span className="pt-pill">{tone}</span>
                  <span className="pt-pill">{LENGTHS.find(l => l.id === length)?.label}</span>
                </div>

                {/* The prompt box */}
                <div className="pt-prompt-box">
                  <pre className="pt-prompt-text">{result}</pre>
                </div>

                {/* Big copy button */}
                <button
                  className={`pt-copy-btn ${copied ? "pt-copy-done" : ""}`}
                  onClick={handleCopy}
                >
                  {copied
                    ? <><IconCheck /> Copied to clipboard!</>
                    : <><IconCopy /> Copy Prompt</>}
                </button>
                <p className="pt-hint">Paste directly into {activeTool?.label}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="pt-nav">
          {/* Back / Start Over */}
          {((step > 0 && step < 3) || (step === 3 && !loading)) && (
            <button
              className="pt-back-btn"
              onClick={step === 3 ? handleReset : () => setStep(s => s - 1)}
            >
              <IconArrowL />
              {step === 3 ? "Start Over" : "Back"}
            </button>
          )}

          {/* Next */}
          {step < 2 && (
            <button
              className="pt-next-btn"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
            >
              Next <IconArrowR />
            </button>
          )}

          {/* Generate */}
          {step === 2 && (
            <button className="pt-gen-btn" onClick={handleGenerate}>
              <IconSpark /> Generate Prompt
            </button>
          )}
        </div>

      </div>
    </div>
    </>
  );
}
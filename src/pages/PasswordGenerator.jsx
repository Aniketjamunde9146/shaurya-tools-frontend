/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useCallback } from "react";
import {
  KeyRound, Copy, Check, RefreshCw, ShieldCheck, ShieldAlert,
  ShieldX, Eye, EyeOff, Sparkles, Download, Trash2, Plus,
  Lock, Unlock, AlertCircle, BarChart2, Hash, Type, Zap
} from "lucide-react";
import "./PasswordGenerator.css";
import { Helmet } from "react-helmet";

/* ─────────────── Constants ─────────────── */
const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers:   "0123456789",
  symbols:   "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const PRESETS = [
  { id: "pin",      label: "PIN",           length: 6,  upper: false, lower: false, nums: true,  syms: false, desc: "Simple numeric PIN" },
  { id: "simple",   label: "Simple",        length: 10, upper: true,  lower: true,  nums: true,  syms: false, desc: "Easy to remember" },
  { id: "strong",   label: "Strong",        length: 16, upper: true,  lower: true,  nums: true,  syms: true,  desc: "Recommended for most" },
  { id: "ultra",    label: "Ultra",         length: 24, upper: true,  lower: true,  nums: true,  syms: true,  desc: "Maximum security" },
  { id: "wifi",     label: "WiFi",          length: 20, upper: true,  lower: true,  nums: true,  syms: false, desc: "No special chars" },
  { id: "passphrase", label: "Passphrase",  length: 4,  upper: false, lower: false, nums: false, syms: false, desc: "4 random words", isPhrase: true },
];

const WORD_LIST = [
  "apple","brave","cloud","dance","earth","flame","grace","honey",
  "ivory","jolly","kneel","lemon","maple","noble","ocean","pearl",
  "queen","river","storm","tiger","ultra","vivid","willow","xenon",
  "yacht","zebra","amber","blaze","coral","delta","eagle","frost",
  "globe","haven","irony","jewel","karma","lunar","magic","nexus",
  "orbit","pulse","quest","razor","solar","torch","unity","valor",
  "sword","night","forge","speed","blade","crisp","drift","ember",
  "flint","graze","haste","input","judge","knack","lance","mercy",
  "nerve","onyx","pixel","quill","raven","slate","trend","ultra",
];

/* ─────────────── Helpers ─────────────── */
function generatePassword(length, upper, lower, nums, syms, exclude = "") {
  let pool = "";
  if (upper) pool += CHAR_SETS.uppercase;
  if (lower) pool += CHAR_SETS.lowercase;
  if (nums)  pool += CHAR_SETS.numbers;
  if (syms)  pool += CHAR_SETS.symbols;
  if (!pool) pool = CHAR_SETS.lowercase;

  // Remove excluded chars
  if (exclude) pool = pool.split("").filter(c => !exclude.includes(c)).join("");
  if (!pool) pool = CHAR_SETS.lowercase;

  // Guarantee at least one char from each selected set
  let required = [];
  if (upper && CHAR_SETS.uppercase.split("").some(c => !exclude.includes(c)))
    required.push(CHAR_SETS.uppercase.split("").filter(c => !exclude.includes(c)));
  if (lower && CHAR_SETS.lowercase.split("").some(c => !exclude.includes(c)))
    required.push(CHAR_SETS.lowercase.split("").filter(c => !exclude.includes(c)));
  if (nums && CHAR_SETS.numbers.split("").some(c => !exclude.includes(c)))
    required.push(CHAR_SETS.numbers.split("").filter(c => !exclude.includes(c)));
  if (syms && CHAR_SETS.symbols.split("").some(c => !exclude.includes(c)))
    required.push(CHAR_SETS.symbols.split("").filter(c => !exclude.includes(c)));

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);

  let pwd = required.map((set, i) => set[arr[i] % set.length]);
  const poolArr = pool.split("");
  for (let i = pwd.length; i < length; i++) {
    pwd.push(poolArr[arr[i] % poolArr.length]);
  }

  // Shuffle
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = arr[i] % (i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join("");
}

function generatePassphrase(wordCount = 4) {
  const arr = new Uint32Array(wordCount);
  crypto.getRandomValues(arr);
  const words = Array.from(arr).map(n => WORD_LIST[n % WORD_LIST.length]);
  const sep   = new Uint32Array(1);
  crypto.getRandomValues(sep);
  const separators = ["-", "_", ".", " ", ""];
  return words.join(separators[sep[0] % separators.length]);
}

function scorePassword(pwd) {
  if (!pwd) return { score: 0, label: "None", color: "#e5e5e5", level: 0 };
  let score = 0;
  const len = pwd.length;

  if (len >= 8)  score += 10;
  if (len >= 12) score += 15;
  if (len >= 16) score += 20;
  if (len >= 20) score += 10;
  if (/[A-Z]/.test(pwd)) score += 10;
  if (/[a-z]/.test(pwd)) score += 10;
  if (/[0-9]/.test(pwd)) score += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 15;

  // Entropy bonus
  const unique = new Set(pwd).size;
  if (unique > len * 0.7) score += 10;

  // Penalty for patterns
  if (/(.)\1{2,}/.test(pwd)) score -= 10;
  if (/012|123|234|345|456|567|678|789|abc|bcd/.test(pwd.toLowerCase())) score -= 10;

  score = Math.max(0, Math.min(100, score));

  if (score < 30)  return { score, label: "Weak",    color: "#ef4444", level: 1, Icon: ShieldX     };
  if (score < 55)  return { score, label: "Fair",    color: "#f97316", level: 2, Icon: ShieldAlert  };
  if (score < 75)  return { score, label: "Good",    color: "#d97706", level: 3, Icon: ShieldAlert  };
  if (score < 90)  return { score, label: "Strong",  color: "#16a34a", level: 4, Icon: ShieldCheck  };
  return             { score, label: "Excellent", color: "#15803d", level: 5, Icon: ShieldCheck  };
}

function estimateCrackTime(pwd) {
  if (!pwd) return "—";
  let pool = 0;
  if (/[a-z]/.test(pwd)) pool += 26;
  if (/[A-Z]/.test(pwd)) pool += 26;
  if (/[0-9]/.test(pwd)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) pool += 32;
  if (!pool) pool = 26;

  const combinations = Math.pow(pool, pwd.length);
  const guessesPerSec = 1e12; // 1 trillion/sec (modern GPU)
  const seconds = combinations / guessesPerSec;

  if (seconds < 1)        return "Instantly";
  if (seconds < 60)       return `${Math.round(seconds)} seconds`;
  if (seconds < 3600)     return `${Math.round(seconds/60)} minutes`;
  if (seconds < 86400)    return `${Math.round(seconds/3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds/86400)} days`;
  if (seconds < 3.15e9)   return `${Math.round(seconds/31536000)} years`;
  if (seconds < 3.15e13)  return `${(seconds/3.15e9).toFixed(1)}K years`;
  if (seconds < 3.15e16)  return `${(seconds/3.15e13).toFixed(1)}M years`;
  return "Billions of years";
}

/* ─────────────── Strength Meter ─────────────── */
function StrengthMeter({ pwd }) {
  const { score, label, color, level, Icon } = scorePassword(pwd);
  const crackTime = estimateCrackTime(pwd);

  return (
    <>
    <Helmet>
      <title>Free Secure Password Generator – Strength Analyzer | ShauryaTools</title>
      <meta name="description" content="Generate cryptographically secure passwords with strength scoring, crack-time estimation, and bulk export. Supports passphrases. 100% free, runs in browser." />
      <meta name="keywords" content="password generator, secure password generator, random password generator, strong password, password strength checker, bulk password generator" />
      <link rel="canonical" href="https://shauryatools.vercel.app/password-generator" />
    </Helmet>
    <div className="pg-strength">
      <div className="pg-strength-top">
        <div className="pg-strength-label-row">
          {Icon && <Icon size={14} color={color} strokeWidth={2.5} />}
          <span className="pg-strength-label" style={{ color }}>{label}</span>
          <span className="pg-strength-score">({score}/100)</span>
        </div>
        <span className="pg-crack-time">
          <Lock size={11} /> Crack time: <strong>{crackTime}</strong>
        </span>
      </div>
      <div className="pg-strength-bars">
        {[1,2,3,4,5].map(i => (
          <div
            key={i}
            className="pg-str-bar"
            style={{ background: i <= level ? color : "#e5e5e5" }}
          />
        ))}
      </div>
    </div>
    </>
  );
}

/* ─────────────── Password Display ─────────────── */
function PasswordDisplay({ pwd, onCopy, copiedId, id, showPassword }) {
  if (!pwd) return null;
  const chars = pwd.split("");

  return (
    <div className="pg-pwd-display">
      {showPassword ? (
        <div className="pg-pwd-chars">
          {chars.map((c, i) => {
            let cls = "pg-ch";
            if (/[A-Z]/.test(c)) cls += " pg-ch-upper";
            else if (/[0-9]/.test(c)) cls += " pg-ch-num";
            else if (/[^A-Za-z0-9]/.test(c)) cls += " pg-ch-sym";
            return <span key={i} className={cls}>{c}</span>;
          })}
        </div>
      ) : (
        <div className="pg-pwd-hidden">{"•".repeat(Math.min(pwd.length, 32))}</div>
      )}
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */
export default function PasswordGenerator() {
  const [length,      setLength]     = useState(16);
  const [useUpper,    setUseUpper]   = useState(true);
  const [useLower,    setUseLower]   = useState(true);
  const [useNums,     setUseNums]    = useState(true);
  const [useSyms,     setUseSyms]    = useState(true);
  const [exclude,     setExclude]    = useState("");
  const [isPhrase,    setIsPhrase]   = useState(false);
  const [phraseWords, setPhraseWords]= useState(4);
  const [password,    setPassword]   = useState("");
  const [showPwd,     setShowPwd]    = useState(true);
  const [copied,      setCopied]     = useState(false);
  const [history,     setHistory]    = useState([]);
  const [bulkCount,   setBulkCount]  = useState(5);
  const [bulkPwds,    setBulkPwds]   = useState([]);
  const [copiedBulk,  setCopiedBulk] = useState(null);
  const [activeTab,   setActiveTab]  = useState("single"); // "single" | "bulk"

  /* ── Generate ── */
  const generate = useCallback(() => {
    let pwd;
    if (isPhrase) {
      pwd = generatePassphrase(phraseWords);
    } else {
      pwd = generatePassword(length, useUpper, useLower, useNums, useSyms, exclude);
    }
    setPassword(pwd);
    setHistory(prev => [{ pwd, isPhrase, ts: Date.now() }, ...prev].slice(0, 8));
    setCopied(false);
  }, [length, useUpper, useLower, useNums, useSyms, exclude, isPhrase, phraseWords]);

  function generateBulk() {
    const pwds = Array.from({ length: bulkCount }, () =>
      isPhrase
        ? generatePassphrase(phraseWords)
        : generatePassword(length, useUpper, useLower, useNums, useSyms, exclude)
    );
    setBulkPwds(pwds);
  }

  function applyPreset(preset) {
    if (preset.isPhrase) {
      setIsPhrase(true);
      setPhraseWords(4);
    } else {
      setIsPhrase(false);
      setLength(preset.length);
      setUseUpper(preset.upper);
      setUseLower(preset.lower);
      setUseNums(preset.nums);
      setUseSyms(preset.syms);
    }
    setPassword("");
    setBulkPwds([]);
  }

  function handleCopy(text, key = "main") {
    navigator.clipboard.writeText(text);
    if (key === "main") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } else {
      setCopiedBulk(key);
      setTimeout(() => setCopiedBulk(null), 2200);
    }
  }

  function copyAllBulk() {
    handleCopy(bulkPwds.join("\n"), "all");
  }

  function downloadBulk() {
    const blob = new Blob([bulkPwds.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "passwords.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const atLeastOne = useUpper || useLower || useNums || useSyms;
  const strength = scorePassword(password);

  /* ─────────── JSX ─────────── */
  return (
    <div className="pg-page">
      <div className="pg-inner">

        {/* ── Header ── */}
        <div className="pg-header">
          <div className="pg-icon">
            <KeyRound size={20} strokeWidth={2} />
          </div>
          <div>
            <span className="pg-cat">Security Tools</span>
            <h1 className="pg-title">Password Generator</h1>
            <p className="pg-subtitle">
              Generate cryptographically secure passwords with strength analysis, crack-time estimation & bulk export.
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="pg-tabs-outer">
          <div className="pg-tabs">
            <button className={`pg-tab ${activeTab === "single" ? "pg-tab-on" : ""}`} onClick={() => setActiveTab("single")}>
              <Lock size={13} /> Single Password
            </button>
            <button className={`pg-tab ${activeTab === "bulk" ? "pg-tab-on" : ""}`} onClick={() => setActiveTab("bulk")}>
              <Zap size={13} /> Bulk Generate
            </button>
          </div>
        </div>

        {/* ── Settings Card ── */}
        <div className="pg-card">

          {/* Presets */}
          <div className="pg-field">
            <label className="pg-label">Quick Presets</label>
            <div className="pg-presets">
              {PRESETS.map(p => (
                <button key={p.id} className="pg-preset-btn" onClick={() => applyPreset(p)}>
                  <span className="pg-preset-name">{p.label}</span>
                  <span className="pg-preset-desc">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pg-divider" />

          {/* Type toggle */}
          <div className="pg-field">
            <label className="pg-label">Password Type</label>
            <div className="pg-type-row">
              <button
                className={`pg-type-btn ${!isPhrase ? "pg-type-on" : ""}`}
                onClick={() => { setIsPhrase(false); setPassword(""); }}
              >
                <Hash size={14} /> Random Characters
              </button>
              <button
                className={`pg-type-btn ${isPhrase ? "pg-type-on" : ""}`}
                onClick={() => { setIsPhrase(true); setPassword(""); }}
              >
                <Type size={14} /> Passphrase
              </button>
            </div>
          </div>

          <div className="pg-divider" />

          {!isPhrase ? (
            <>
              {/* Length slider */}
              <div className="pg-field">
                <div className="pg-label-row">
                  <label className="pg-label">Length</label>
                  <span className="pg-length-badge">{length} characters</span>
                </div>
                <input
                  type="range"
                  className="pg-slider"
                  min={4} max={64} value={length}
                  onChange={e => { setLength(+e.target.value); setPassword(""); }}
                />
                <div className="pg-slider-labels">
                  <span>4</span><span>16</span><span>32</span><span>48</span><span>64</span>
                </div>
              </div>

              <div className="pg-divider" />

              {/* Character sets */}
              <div className="pg-field">
                <label className="pg-label">Include Characters</label>
                <div className="pg-toggles">
                  {[
                    { key: "upper", val: useUpper, set: setUseUpper, label: "Uppercase",  sub: "A–Z",          sample: "ABC" },
                    { key: "lower", val: useLower, set: setUseLower, label: "Lowercase",  sub: "a–z",          sample: "abc" },
                    { key: "nums",  val: useNums,  set: setUseNums,  label: "Numbers",    sub: "0–9",          sample: "123" },
                    { key: "syms",  val: useSyms,  set: setUseSyms,  label: "Symbols",    sub: "!@#$%…",       sample: "@#!" },
                  ].map(tog => (
                    <div key={tog.key} className="pg-toggle-row">
                      <div className="pg-toggle-info">
                        <span className="pg-toggle-sample">{tog.sample}</span>
                        <div>
                          <p className="pg-toggle-label">{tog.label}</p>
                          <p className="pg-toggle-sub">{tog.sub}</p>
                        </div>
                      </div>
                      <button
                        className={`pg-toggle ${tog.val ? "pg-toggle-on" : ""}`}
                        onClick={() => {
                          const others = [useUpper, useLower, useNums, useSyms].filter((v, i) =>
                            ["upper","lower","nums","syms"][i] !== tog.key
                          );
                          if (tog.val && !others.some(Boolean)) return;
                          tog.set(v => !v);
                          setPassword("");
                        }}
                      >
                        <span className="pg-toggle-thumb" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pg-divider" />

              {/* Exclude chars */}
              <div className="pg-field">
                <label className="pg-label">
                  Exclude Characters <span className="pg-label-opt">(optional)</span>
                </label>
                <input
                  className="pg-input pg-mono"
                  value={exclude}
                  onChange={e => { setExclude(e.target.value); setPassword(""); }}
                  placeholder="e.g. 0O1lI (ambiguous characters)"
                  maxLength={30}
                />
              </div>
            </>
          ) : (
            /* Passphrase word count */
            <div className="pg-field">
              <div className="pg-label-row">
                <label className="pg-label">Word Count</label>
                <span className="pg-length-badge">{phraseWords} words</span>
              </div>
              <div className="pg-count-btns">
                {[3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    className={`pg-count-btn ${phraseWords === n ? "pg-count-on" : ""}`}
                    onClick={() => { setPhraseWords(n); setPassword(""); }}
                  >{n} words</button>
                ))}
              </div>
              <p className="pg-hint">Words are randomly separated with -, _, . or spaces</p>
            </div>
          )}

          {/* Bulk count (only on bulk tab) */}
          {activeTab === "bulk" && (
            <>
              <div className="pg-divider" />
              <div className="pg-field">
                <label className="pg-label">How many passwords?</label>
                <div className="pg-count-btns">
                  {[5, 10, 20, 50].map(n => (
                    <button
                      key={n}
                      className={`pg-count-btn ${bulkCount === n ? "pg-count-on" : ""}`}
                      onClick={() => setBulkCount(n)}
                    >{n}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Generate button */}
          {activeTab === "single" ? (
            <button className="pg-gen-btn" onClick={generate}>
              <RefreshCw size={15} /> Generate Password
            </button>
          ) : (
            <button className="pg-gen-btn" onClick={generateBulk}>
              <Zap size={15} /> Generate {bulkCount} Passwords
            </button>
          )}
        </div>

        {/* ── Single Password Result ── */}
        {activeTab === "single" && password && (
          <div className="pg-result-card animate-in">

            {/* Password display */}
            <div className="pg-result-top">
              <div className="pg-result-left">
                <StrengthMeter pwd={password} />
              </div>
              <div className="pg-result-btns">
                <button
                  className="pg-icon-btn"
                  onClick={() => setShowPwd(v => !v)}
                  title={showPwd ? "Hide" : "Show"}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button className="pg-icon-btn" onClick={generate} title="Regenerate">
                  <RefreshCw size={15} />
                </button>
                <button
                  className={`pg-copy-btn ${copied ? "pg-copied" : ""}`}
                  onClick={() => handleCopy(password)}
                >
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>

            <PasswordDisplay pwd={password} showPassword={showPwd} />

            {/* Details */}
            <div className="pg-details-grid">
              <div className="pg-detail-box">
                <span className="pg-detail-label"><BarChart2 size={11} /> Length</span>
                <span className="pg-detail-val">{password.length} chars</span>
              </div>
              <div className="pg-detail-box">
                <span className="pg-detail-label"><Sparkles size={11} /> Unique Chars</span>
                <span className="pg-detail-val">{new Set(password).size}</span>
              </div>
              <div className="pg-detail-box">
                <span className="pg-detail-label"><ShieldCheck size={11} /> Entropy</span>
                <span className="pg-detail-val">
                  {(() => {
                    let pool = 0;
                    if (/[a-z]/.test(password)) pool += 26;
                    if (/[A-Z]/.test(password)) pool += 26;
                    if (/[0-9]/.test(password)) pool += 10;
                    if (/[^A-Za-z0-9]/.test(password)) pool += 32;
                    return `${Math.round(password.length * Math.log2(pool || 26))} bits`;
                  })()}
                </span>
              </div>
              <div className="pg-detail-box pg-detail-highlight">
                <span className="pg-detail-label"><Lock size={11} /> Crack Time</span>
                <span className="pg-detail-val">{estimateCrackTime(password)}</span>
              </div>
            </div>

            {/* Colour legend */}
            <div className="pg-legend">
              <span className="pg-legend-item"><span className="pg-ch pg-ch-upper">A</span> Uppercase</span>
              <span className="pg-legend-item"><span className="pg-ch">a</span> Lowercase</span>
              <span className="pg-legend-item"><span className="pg-ch pg-ch-num">1</span> Number</span>
              <span className="pg-legend-item"><span className="pg-ch pg-ch-sym">@</span> Symbol</span>
            </div>
          </div>
        )}

        {/* ── Bulk Result ── */}
        {activeTab === "bulk" && bulkPwds.length > 0 && (
          <div className="pg-result-card animate-in">
            <div className="pg-bulk-top">
              <h3 className="pg-bulk-title">
                <Zap size={15} /> {bulkPwds.length} Generated Passwords
              </h3>
              <div className="pg-bulk-actions">
                <button
                  className={`pg-copy-btn ${copiedBulk === "all" ? "pg-copied" : ""}`}
                  onClick={copyAllBulk}
                >
                  {copiedBulk === "all" ? <><Check size={13}/> Copied!</> : <><Copy size={13}/> Copy All</>}
                </button>
                <button className="pg-action-btn" onClick={downloadBulk}>
                  <Download size={13} /> Download
                </button>
                <button className="pg-action-btn" onClick={() => setBulkPwds([])}>
                  <Trash2 size={13} /> Clear
                </button>
              </div>
            </div>

            <div className="pg-bulk-list">
              {bulkPwds.map((pwd, i) => {
                const s = scorePassword(pwd);
                const isCopied = copiedBulk === i;
                return (
                  <div key={i} className="pg-bulk-item">
                    <span className="pg-bulk-num">#{i + 1}</span>
                    <span className="pg-bulk-pwd pg-mono">{pwd}</span>
                    <div className="pg-bulk-right">
                      <span className="pg-bulk-score" style={{ color: s.color }}>{s.label}</span>
                      <button
                        className={`pg-copy-sm ${isCopied ? "pg-copied-sm" : ""}`}
                        onClick={() => handleCopy(pwd, i)}
                      >
                        {isCopied ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── History ── */}
        {history.length > 0 && activeTab === "single" && (
          <div className="pg-history animate-in">
            <div className="pg-history-header">
              <p className="pg-history-title">Recent Passwords</p>
              <button className="pg-text-btn" onClick={() => setHistory([])}>
                <Trash2 size={11} /> Clear
              </button>
            </div>
            <div className="pg-history-list">
              {history.map((h, i) => {
                const s = scorePassword(h.pwd);
                const isCopied = copiedBulk === `hist-${i}`;
                return (
                  <div key={i} className="pg-history-item">
                    <span className="pg-history-pwd pg-mono">{h.pwd}</span>
                    <div className="pg-history-right">
                      <span className="pg-history-score" style={{ color: s.color }}>{s.label}</span>
                      <button
                        className={`pg-copy-sm ${isCopied ? "pg-copied-sm" : ""}`}
                        onClick={() => handleCopy(h.pwd, `hist-${i}`)}
                      >
                        {isCopied ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Security Tips ── */}
        <div className="pg-tips-card">
          <p className="pg-tips-title"><ShieldCheck size={14} /> Security Tips</p>
          <div className="pg-tips-grid">
            {[
              { icon: <KeyRound size={13}/>, tip: "Use a unique password for every account — never reuse." },
              { icon: <Lock size={13}/>,      tip: "Store passwords in a trusted password manager, not in notes." },
              { icon: <RefreshCw size={13}/>, tip: "Change critical passwords every 3–6 months." },
              { icon: <ShieldCheck size={13}/>, tip: "Enable 2FA on all accounts for an extra layer of security." },
            ].map((t, i) => (
              <div key={i} className="pg-tip-item">
                <span className="pg-tip-icon">{t.icon}</span>
                <p className="pg-tip-text">{t.tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
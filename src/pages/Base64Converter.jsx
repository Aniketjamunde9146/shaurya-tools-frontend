/* eslint-disable no-unused-vars */
import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import "./Base64Converter.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/base64-converter`;

/* ── Icons ── */
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const IconCopy = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconUpload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconSwap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/>
    <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
);
const IconWarning = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconOk = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconImage = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

/* ── Helpers ── */
function encodeToBase64(text) {
  return btoa(
    new TextEncoder().encode(text)
      .reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
}

function decodeFromBase64(b64) {
  try {
    const binary = atob(b64.trim());
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error("Invalid Base64 string.");
  }
}

function isValidBase64(str) {
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str.replace(/\s/g, "")) && str.trim().length > 0;
}

function encodeFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isImageDataUri(str) {
  return str.startsWith("data:image/");
}

const SAMPLE_TEXT = `Hello, World! 🌍
This is a sample text for Base64 encoding.
ShauryaTools — Fast, free utilities.`;

const SAMPLE_B64 = `SGVsbG8sIFdvcmxkISDwn4yNCkZ1biBmYWN0OiBCYXNlNjQgZW5jb2RpbmcgaW5jcmVhc2VzIHNpemUgYnkgfjMzJS4KU2hhdXJ5YVRvb2xzIOKAlCBGYXN0LCBmcmVlIHV0aWxpdGllcy4=`;

export default function Base64Converter() {
  const [mode,       setMode]       = useState("encode");
  const [input,      setInput]      = useState("");
  const [output,     setOutput]     = useState("");
  const [error,      setError]      = useState(null);
  const [copiedOut,  setCopiedOut]  = useState(false);
  const [copiedIn,   setCopiedIn]   = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [fileMode,   setFileMode]   = useState(false);
  const [fileName,   setFileName]   = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  const isEncode = mode === "encode";

  function process(raw, currentMode = mode) {
    const text = raw;
    if (!text.trim()) { setOutput(""); setError(null); return; }
    try {
      if (currentMode === "encode") {
        setOutput(encodeToBase64(text));
      } else {
        const decoded = decodeFromBase64(text);
        setOutput(decoded);
      }
      setError(null);
    } catch (e) {
      setError(e.message);
      setOutput("");
    }
  }

  const handleInput = (val) => {
    setInput(val);
    setFileMode(false);
    setFileName("");
    setImagePreview(null);
    process(val);
  };

  const handleSwap = () => {
    const newMode = isEncode ? "decode" : "encode";
    setMode(newMode);
    const newInput = output;
    setInput(newInput);
    setOutput("");
    setError(null);
    setFileMode(false);
    setFileName("");
    setImagePreview(null);
    if (newInput.trim()) process(newInput, newMode);
  };

  const handleModeSwitch = (m) => {
    if (m === mode) return;
    setMode(m);
    setInput("");
    setOutput("");
    setError(null);
    setFileMode(false);
    setFileName("");
    setImagePreview(null);
  };

  const handleClear = () => {
    setInput(""); setOutput(""); setError(null);
    setFileMode(false); setFileName(""); setImagePreview(null);
  };

  const handleSample = () => {
    const s = isEncode ? SAMPLE_TEXT : SAMPLE_B64;
    setInput(s);
    setFileMode(false); setFileName(""); setImagePreview(null);
    process(s);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopiedOut(true);
    setTimeout(() => setCopiedOut(false), 2500);
  };

  const handleCopyInput = () => {
    navigator.clipboard.writeText(input);
    setCopiedIn(true);
    setTimeout(() => setCopiedIn(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = isEncode ? "encoded.b64" : "decoded.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (isEncode) {
      const dataUri = await encodeFileToBase64(file);
      setFileName(file.name);
      setFileMode(true);
      setInput(dataUri);
      setOutput(dataUri.split(",")[1]);
      setError(null);
      if (file.type.startsWith("image/")) setImagePreview(dataUri);
      else setImagePreview(null);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const txt = e.target.result;
        setInput(txt);
        setFileMode(false);
        setFileName(file.name);
        process(txt, mode);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const status = error ? "error" : output ? "valid" : "idle";

  const inputCharCount  = input.length;
  const outputCharCount = output.length;
  const sizeRatio = inputCharCount > 0
    ? ((outputCharCount / inputCharCount) * 100).toFixed(0)
    : null;

  return (
    <>
      <Helmet>
        <title>Base64 Encode & Decode Online – Free Tool | ShauryaTools</title>
        <meta
          name="description"
          content="Encode text or files to Base64 and decode Base64 strings back to text instantly in your browser. Free, fast, no signup required. Supports drag & drop file encoding."
        />
        <meta
          name="keywords"
          content="base64 encoder, base64 decoder, base64 converter, encode to base64, decode base64, base64 online, base64 file encoder"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Base64 Encode & Decode Online – Free Tool" />
        <meta property="og:description" content="Encode text or files to Base64 and decode Base64 strings instantly. Free browser-based tool." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Base64 Encode & Decode Online" />
        <meta name="twitter:description" content="Free online Base64 encoder and decoder. Works with text and files." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Base64 Converter",
            "url": PAGE_URL,
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "All",
            "description": "Free online Base64 encoder and decoder tool. Encode text or files to Base64, or decode Base64 strings back to text.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="b64-page">
        <div className="b64-inner">

          {/* ── Header ── */}
          <div className="b64-header">
            <div className="b64-icon"><IconLock /></div>
            <div>
              <span className="b64-cat">Utility</span>
              <h1>Base64 <span className="b64-slash">Encode / Decode</span></h1>
              <p>Encode text or files to Base64, or decode Base64 strings back — instantly in your browser.</p>
            </div>
          </div>

          {/* ── Mode bar ── */}
          <div className="b64-mode-bar">
            <div className="b64-mode-tabs">
              <button
                className={`b64-mode-tab ${isEncode ? "b64-mode-on" : ""}`}
                onClick={() => handleModeSwitch("encode")}
              >
                <span className="b64-badge b64-badge-text">Text</span>
                <span className="b64-arrow">→</span>
                <span className="b64-badge b64-badge-b64">Base64</span>
              </button>
              <button
                className={`b64-mode-tab ${!isEncode ? "b64-mode-on" : ""}`}
                onClick={() => handleModeSwitch("decode")}
              >
                <span className="b64-badge b64-badge-b64">Base64</span>
                <span className="b64-arrow">→</span>
                <span className="b64-badge b64-badge-text">Text</span>
              </button>
            </div>

            <button className="b64-swap-btn" onClick={handleSwap} title="Swap direction & content">
              <IconSwap /> Swap
            </button>
          </div>

          {/* ── Grid ── */}
          <div className="b64-grid">

            {/* ── Input panel ── */}
            <div className="b64-panel">
              <div className="b64-panel-head">
                <div className="b64-panel-title-row">
                  <span className={`b64-lang-badge ${isEncode ? "b64-badge-text" : "b64-badge-b64"}`}>
                    {isEncode ? "Text / File" : "Base64"}
                  </span>
                  <span className="b64-panel-label">Input</span>
                </div>
                <div className="b64-panel-actions">
                  <button className="b64-action-btn" onClick={handleSample}>Sample</button>
                  {isEncode && (
                    <button className="b64-action-btn" onClick={() => fileRef.current.click()}>
                      <IconUpload /> File
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="*/*"
                    style={{ display: "none" }}
                    onChange={e => handleFile(e.target.files[0])}
                  />
                  {input && (
                    <button className="b64-action-btn b64-danger-btn" onClick={handleClear}>
                      <IconTrash />
                    </button>
                  )}
                </div>
              </div>

              {imagePreview && (
                <div className="b64-image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <div className="b64-image-meta">
                    <IconImage />
                    <span>{fileName}</span>
                  </div>
                </div>
              )}

              <div
                className={`b64-textarea-wrap ${dragOver ? "b64-drag-over" : ""} ${imagePreview ? "b64-has-preview" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <textarea
                  className="b64-textarea"
                  value={fileMode ? `[File: ${fileName}]\n\nBase64 data ready in output →` : input}
                  onChange={e => !fileMode && handleInput(e.target.value)}
                  readOnly={fileMode}
                  placeholder={isEncode
                    ? `Type or paste text to encode…\n\nOr drag & drop any file`
                    : `Paste Base64 string to decode…`}
                  spellCheck={false}
                />
                {!input && !fileMode && (
                  <div className="b64-drop-hint">
                    <IconUpload />
                    <span>{isEncode ? "Drag & drop a file to encode" : "Paste Base64 text above"}</span>
                  </div>
                )}
              </div>

              <div className={`b64-status-bar b64-status-${status}`}>
                {status === "valid" && <><IconOk /><span>{isEncode ? "Encoded successfully" : "Decoded successfully"}</span></>}
                {status === "error" && <><IconWarning /><span>{error}</span></>}
                {status === "idle"  && <span className="b64-idle">Awaiting input…</span>}
              </div>
            </div>

            {/* ── Output panel ── */}
            <div className="b64-panel">
              <div className="b64-panel-head">
                <div className="b64-panel-title-row">
                  <span className={`b64-lang-badge ${isEncode ? "b64-badge-b64" : "b64-badge-text"}`}>
                    {isEncode ? "Base64" : "Text"}
                  </span>
                  <span className="b64-panel-label">Output</span>
                </div>
                <div className="b64-panel-actions">
                  {output && (
                    <>
                      <button className="b64-action-btn" onClick={handleDownload}>
                        <IconDownload />
                      </button>
                      <button className={`b64-copy-btn ${copiedOut ? "b64-copied" : ""}`} onClick={handleCopyOutput}>
                        {copiedOut ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy</>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="b64-output-wrap">
                {!output && !error && (
                  <div className="b64-empty">
                    <div className="b64-empty-icon"><IconLock /></div>
                    <p>Your {isEncode ? "encoded Base64" : "decoded text"} will appear here</p>
                  </div>
                )}

                {error && (
                  <div className="b64-error-panel">
                    <div className="b64-error-icon"><IconWarning /></div>
                    <p className="b64-error-title">Conversion Failed</p>
                    <p className="b64-error-detail">{error}</p>
                    <p className="b64-error-tip">Make sure your input is valid Base64.</p>
                  </div>
                )}

                {output && !error && (
                  <pre className={`b64-code ${isEncode ? "b64-encoded" : "b64-decoded"}`}>
                    {output}
                  </pre>
                )}
              </div>

              {output && (
                <div className="b64-stats-bar">
                  <span className="b64-stat"><strong>{inputCharCount.toLocaleString()}</strong> input chars</span>
                  <span className="b64-stat-sep">→</span>
                  <span className="b64-stat"><strong>{outputCharCount.toLocaleString()}</strong> output chars</span>
                  {sizeRatio && (
                    <>
                      <span className="b64-stat-sep">·</span>
                      <span className="b64-stat">
                        size <strong className={isEncode ? "b64-stat-up" : "b64-stat-down"}>
                          {isEncode ? `+${sizeRatio - 100}%` : `-${100 - sizeRatio}%`}
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── Info strip ── */}
          <div className="b64-info-strip">
            <div className="b64-info-item">
              <span className="b64-info-label">What is Base64?</span>
              <span className="b64-info-val">An encoding scheme that converts binary data into ASCII text using 64 characters (A–Z, a–z, 0–9, +, /).</span>
            </div>
            <div className="b64-info-divider" />
            <div className="b64-info-item">
              <span className="b64-info-label">Common uses</span>
              <span className="b64-info-val">Embedding images in HTML/CSS, encoding email attachments, storing binary data in JSON, JWT tokens.</span>
            </div>
            <div className="b64-info-divider" />
            <div className="b64-info-item">
              <span className="b64-info-label">Size overhead</span>
              <span className="b64-info-val">Base64 encoding increases data size by ~33%. Every 3 bytes of input becomes 4 Base64 characters.</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
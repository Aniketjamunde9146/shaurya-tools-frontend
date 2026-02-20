/* eslint-disable no-unused-vars */
import { useState, useCallback } from "react";
import { Helmet } from "react-helmet";

/* ── Icons ── */
const IconUUID = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="10" rx="3"/>
    <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01"/>
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
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ══════════════════
   UUID Generation
   ══════════════════ */
function generateV4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateV1Like() {
  // Simulated v1-like (time-based feel, not real v1)
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, "0");
  const rand = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-1${rand().slice(1)}-${((Math.random() * 0x3fff + 0x8000) | 0).toString(16)}-${rand()}${rand()}${rand().slice(0, 4)}`;
}

function generateNIL() {
  return "00000000-0000-0000-0000-000000000000";
}

function generateByVersion(version) {
  switch (version) {
    case "v1": return generateV1Like();
    case "nil": return generateNIL();
    default:   return generateV4();
  }
}

function formatUUID(uuid, fmt) {
  switch (fmt) {
    case "upper":    return uuid.toUpperCase();
    case "nodash":   return uuid.replace(/-/g, "");
    case "braces":   return `{${uuid}}`;
    case "urn":      return `urn:uuid:${uuid}`;
    default:         return uuid;
  }
}

const VERSIONS = [
  { key: "v4",  label: "v4",  title: "Random",      desc: "Cryptographically random (most common)" },
  { key: "v1",  label: "v1",  title: "Time-based",  desc: "Based on timestamp + node" },
  { key: "nil", label: "NIL", title: "Nil UUID",     desc: "All zeros — special null UUID" },
];

const FORMATS = [
  { key: "default", label: "Default",   example: "550e8400-e29b-41d4-a716-446655440000" },
  { key: "upper",   label: "Uppercase", example: "550E8400-E29B-41D4-A716-446655440000" },
  { key: "nodash",  label: "No Dashes", example: "550e8400e29b41d4a716446655440000" },
  { key: "braces",  label: "Braces",    example: "{550e8400-e29b-41d4-a716-446655440000}" },
  { key: "urn",     label: "URN",       example: "urn:uuid:550e8400-e29b-41d4-a716-446655440000" },
];

const UUID_PARTS = [
  { label: "time_low",          bits: "32 bits", chars: "8",  color: "#fef9c3", border: "#fde047", text: "#713f12" },
  { label: "time_mid",          bits: "16 bits", chars: "4",  color: "#dbeafe", border: "#93c5fd", text: "#1e3a8a" },
  { label: "time_hi_and_version", bits: "16 bits", chars: "4", color: "#dcfce7", border: "#86efac", text: "#14532d" },
  { label: "clock_seq",         bits: "16 bits", chars: "4",  color: "#fce7f3", border: "#f9a8d4", text: "#831843" },
  { label: "node",              bits: "48 bits", chars: "12", color: "#f3e8ff", border: "#d8b4fe", text: "#581c87" },
];

const PART_COLORS = [
  { bg: "#fef9c3", border: "#fde047", text: "#713f12" },
  { bg: "#dbeafe", border: "#93c5fd", text: "#1e3a8a" },
  { bg: "#dcfce7", border: "#86efac", text: "#14532d" },
  { bg: "#fce7f3", border: "#f9a8d4", text: "#831843" },
  { bg: "#f3e8ff", border: "#d8b4fe", text: "#581c87" },
];

/* ══════════════════
   Main Component
   ══════════════════ */
export default function UUIDGenerator() {
  const [version,  setVersion]  = useState("v4");
  const [format,   setFormat]   = useState("default");
  const [count,    setCount]    = useState(5);
  const [uuids,    setUUIDs]    = useState(() =>
    Array.from({ length: 5 }, () => generateV4())
  );
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showAnatomy, setShowAnatomy] = useState(false);

  /* ── Generate ── */
  const generate = useCallback(() => {
    setUUIDs(Array.from({ length: count }, () => generateByVersion(version)));
  }, [version, count]);

  const regenerateOne = (i) => {
    setUUIDs(prev => {
      const next = [...prev];
      next[i] = generateByVersion(version);
      return next;
    });
  };

  /* ── Copy ── */
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = () => {
    const all = uuids.map(u => formatUUID(u, format)).join("\n");
    handleCopy(all, "all");
  };

  /* ── Download ── */
  const handleDownload = () => {
    const all = uuids.map(u => formatUUID(u, format)).join("\n");
    const blob = new Blob([all], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "uuids.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Anatomy breakdown of first UUID ── */
  const anatomyUUID = uuids[0] || "";
  const rawParts = anatomyUUID.replace(/-/g, "").split("");
  const segments = [8, 4, 4, 4, 12];
  let offset = 0;
  const anatomySegments = segments.map((len, i) => {
    const hex = anatomyUUID.replace(/-/g, "").slice(offset, offset + len);
    offset += len;
    return { ...UUID_PARTS[i], hex, ...PART_COLORS[i] };
  });

  return (
    <>
      <Helmet>
        <title>Free UUID Generator Online – v1, v4, NIL with Anatomy View</title>
        <meta name="description" content="Generate UUIDs in v1, v4 or NIL format. Supports multiple output formats including URN and no-dash. Bulk generate, download, and view UUID anatomy. Free." />
        <meta name="keywords" content="uuid generator, uuid v4 generator, online uuid, random uuid, unique id generator, guid generator, bulk uuid" />
        <link rel="canonical" href="https://shauryatools.vercel.app/uuid-generator" />
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --white:      #ffffff;
          --black:      #0f0f0f;
          --grey-1:     #f5f5f5;
          --grey-2:     #e5e5e5;
          --grey-3:     #737373;
          --grey-4:     #404040;
          --green:      #16a34a;
          --green-bg:   #f0fdf4;
          --green-bd:   #bbf7d0;
          --blue:       #2563eb;
          --blue-bg:    #eff6ff;
          --blue-bd:    #bfdbfe;
          --orange:     #ea580c;
          --orange-bg:  #fff7ed;
          --orange-bd:  #fed7aa;
          --violet:     #7c3aed;
          --violet-bg:  #f5f3ff;
          --violet-bd:  #ddd6fe;
          --red:        #ef4444;
          --red-bg:     #fef2f2;
          --red-bd:     #fecaca;
          --rose:       #e11d48;
          --rose-bg:    #fff1f2;
          --rose-bd:    #fecdd3;
          --radius:     12px;
          --font-head:  'Poppins', sans-serif;
          --font-body:  'Inter', sans-serif;
          --font-mono:  'JetBrains Mono', 'Menlo', 'Consolas', monospace;
        }

        .ug-page {
          min-height: 100vh;
          background: var(--grey-1);
          font-family: var(--font-body);
          color: var(--black);
          padding: 80px 20px 60px;
        }

        .ug-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Header */
        .ug-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 4px 0 6px;
        }
        .ug-icon {
          width: 48px; height: 48px;
          background: var(--white);
          border: 1.5px solid var(--grey-2);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--rose);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .ug-cat {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--violet);
          background: var(--violet-bg);
          border: 1px solid var(--violet-bd);
          padding: 3px 10px;
          border-radius: 100px;
          margin-bottom: 6px;
        }
        .ug-header h1 {
          font-family: var(--font-head);
          font-size: clamp(1.4rem, 3.5vw, 1.85rem);
          font-weight: 700;
          color: var(--black);
          letter-spacing: -0.02em;
          margin-bottom: 4px;
          line-height: 1.2;
        }
        .ug-header p {
          font-size: 0.85rem;
          color: var(--grey-3);
          line-height: 1.5;
        }

        /* Card */
        .ug-card {
          background: var(--white);
          border: 1.5px solid var(--grey-2);
          border-radius: 16px;
          overflow: hidden;
        }
        .ug-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 16px;
          border-bottom: 1.5px solid var(--grey-2);
          background: var(--grey-1);
          gap: 10px;
          flex-wrap: wrap;
        }
        .ug-card-title {
          font-family: var(--font-head);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--grey-3);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .ug-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Controls card */
        .ug-controls-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .ug-control-row {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
        }

        .ug-control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 160px;
        }

        .ug-control-label {
          font-family: var(--font-head);
          font-size: 0.73rem;
          font-weight: 700;
          color: var(--grey-4);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Version buttons */
        .ug-version-btns {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ug-version-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          background: var(--white);
          border: 1.5px solid var(--grey-2);
          border-radius: 10px;
          font-family: var(--font-body);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--grey-4);
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }
        .ug-version-btn:hover:not(.ug-version-on) {
          border-color: var(--grey-3);
          color: var(--black);
        }
        .ug-version-on {
          background: var(--rose-bg) !important;
          border-color: var(--rose-bd) !important;
          color: var(--rose) !important;
        }
        .ug-version-badge {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--grey-1);
          color: var(--grey-4);
          border: 1px solid var(--grey-2);
        }
        .ug-version-on .ug-version-badge {
          background: var(--rose-bg);
          color: var(--rose);
          border-color: var(--rose-bd);
        }
        .ug-version-sub {
          font-size: 0.68rem;
          color: var(--grey-3);
          font-weight: 400;
          display: block;
          margin-top: 1px;
        }
        .ug-version-on .ug-version-sub { color: #f87171; }

        /* Format selector */
        .ug-format-btns {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .ug-format-btn {
          padding: 5px 12px;
          background: var(--white);
          border: 1.5px solid var(--grey-2);
          border-radius: 100px;
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--grey-4);
          cursor: pointer;
          transition: all 0.15s;
        }
        .ug-format-btn:hover:not(.ug-format-on) {
          border-color: var(--grey-3);
          color: var(--black);
        }
        .ug-format-on {
          background: var(--blue-bg) !important;
          border-color: var(--blue-bd) !important;
          color: var(--blue) !important;
        }

        /* Count + Generate */
        .ug-generate-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ug-count-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ug-count-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--grey-4);
          white-space: nowrap;
        }
        .ug-count-input {
          width: 64px;
          padding: 7px 10px;
          border: 1.5px solid var(--grey-2);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--black);
          background: var(--white);
          outline: none;
          text-align: center;
          transition: border-color 0.15s;
        }
        .ug-count-input:focus { border-color: var(--blue); }

        .ug-generate-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 20px;
          background: var(--rose);
          border: none;
          border-radius: 10px;
          font-family: var(--font-head);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--white);
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.01em;
        }
        .ug-generate-btn:hover { background: #be123c; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(225,29,72,0.25); }
        .ug-generate-btn:active { transform: translateY(0); box-shadow: none; }

        /* UUID list */
        .ug-list {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ug-uuid-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1.5px solid var(--grey-2);
          border-radius: 10px;
          transition: border-color 0.15s, background 0.15s;
        }
        .ug-uuid-item:hover { border-color: var(--grey-3); background: var(--grey-1); }

        .ug-uuid-num {
          font-family: var(--font-head);
          font-size: 0.65rem;
          font-weight: 700;
          width: 20px; height: 20px;
          border-radius: 5px;
          background: var(--grey-1);
          border: 1.5px solid var(--grey-2);
          color: var(--grey-3);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .ug-uuid-value {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--black);
          flex: 1;
          min-width: 0;
          word-break: break-all;
          letter-spacing: 0.02em;
        }

        .ug-uuid-actions {
          display: flex;
          gap: 5px;
          flex-shrink: 0;
        }

        /* Small buttons */
        .ug-sm-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          background: var(--white);
          border: 1.5px solid var(--grey-2);
          border-radius: 7px;
          font-family: var(--font-body);
          font-size: 0.73rem;
          font-weight: 600;
          color: var(--grey-4);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .ug-sm-btn:hover { border-color: var(--grey-3); color: var(--black); }
        .ug-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px;
          background: var(--white);
          border: 1.5px solid var(--grey-2);
          border-radius: 8px;
          color: var(--grey-3);
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .ug-icon-btn:hover { border-color: var(--grey-3); color: var(--black); }

        /* Anatomy card */
        .ug-anatomy-body {
          padding: 16px;
        }
        .ug-anatomy-uuid {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          align-items: center;
          margin-bottom: 16px;
          font-family: var(--font-mono);
          font-size: 0.88rem;
          font-weight: 600;
        }
        .ug-seg {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 5px;
          border: 1.5px solid;
          letter-spacing: 0.04em;
          cursor: default;
          transition: opacity 0.12s;
        }
        .ug-seg:hover { opacity: 0.75; }
        .ug-dash {
          color: var(--grey-3);
          padding: 0 1px;
          font-size: 1rem;
        }
        .ug-anatomy-parts {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ug-anatomy-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1.5px solid var(--grey-2);
          background: var(--grey-1);
        }
        .ug-anatomy-dot {
          width: 10px; height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
          border: 1.5px solid;
        }
        .ug-anatomy-name {
          font-family: var(--font-mono);
          font-size: 0.73rem;
          font-weight: 600;
          color: var(--grey-4);
          min-width: 160px;
        }
        .ug-anatomy-hex {
          font-family: var(--font-mono);
          font-size: 0.73rem;
          color: var(--black);
          font-weight: 500;
          flex: 1;
          word-break: break-all;
        }
        .ug-anatomy-bits {
          font-size: 0.68rem;
          color: var(--grey-3);
          font-weight: 600;
          white-space: nowrap;
          background: var(--white);
          border: 1px solid var(--grey-2);
          padding: 2px 7px;
          border-radius: 4px;
          font-family: var(--font-body);
        }

        /* Empty state */
        .ug-empty {
          padding: 40px 20px;
          text-align: center;
          font-size: 0.83rem;
          color: var(--grey-3);
        }

        /* Toggle anatomy btn */
        .ug-toggle-anatomy {
          padding: 5px 12px;
          background: var(--white);
          border: 1.5px solid var(--grey-2);
          border-radius: 7px;
          font-family: var(--font-body);
          font-size: 0.73rem;
          font-weight: 600;
          color: var(--grey-4);
          cursor: pointer;
          transition: all 0.15s;
        }
        .ug-toggle-anatomy:hover { border-color: var(--violet-bd); color: var(--violet); background: var(--violet-bg); }
        .ug-toggle-on { background: var(--violet-bg) !important; border-color: var(--violet-bd) !important; color: var(--violet) !important; }

        /* Grid layout */
        .ug-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
          align-items: start;
        }
        .ug-col-left, .ug-col-right {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Format preview */
        .ug-fmt-preview {
          padding: 10px 14px;
          background: var(--grey-1);
          border-top: 1px solid var(--grey-2);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--grey-3);
          word-break: break-all;
        }
        .ug-fmt-preview strong {
          color: var(--grey-4);
          font-weight: 600;
          margin-right: 6px;
        }

        /* Info card reference */
        .ug-info-section { border-bottom: 1px solid var(--grey-2); }
        .ug-info-section:last-child { border-bottom: none; }
        .ug-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 11px 16px;
          background: transparent;
          border: none;
          font-family: var(--font-head);
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--grey-4);
          cursor: pointer;
          text-align: left;
          transition: background 0.12s;
        }
        .ug-info-header:hover { background: var(--grey-1); }

        .ug-info-body {
          padding: 10px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ug-info-item {
          display: flex;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 8px;
        }
        .ug-info-item:hover { background: var(--grey-1); }
        .ug-info-key {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--rose);
          background: var(--rose-bg);
          border: 1.5px solid var(--rose-bd);
          border-radius: 5px;
          padding: 2px 7px;
          white-space: nowrap;
          align-self: flex-start;
          flex-shrink: 0;
        }
        .ug-info-val {
          font-size: 0.73rem;
          color: var(--grey-3);
          line-height: 1.5;
        }

        /* stats badge */
        .ug-count-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 9px;
          border-radius: 100px;
          background: var(--green-bg);
          color: var(--green);
          border: 1px solid var(--green-bd);
        }

        @media (max-width: 1024px) {
          .ug-grid { grid-template-columns: 1fr; }
          .ug-col-right { order: -1; }
        }
        @media (max-width: 640px) {
          .ug-page { padding: 72px 14px 48px; }
          .ug-header { flex-direction: column; gap: 10px; }
          .ug-version-btns { flex-direction: column; }
          .ug-control-row { flex-direction: column; gap: 14px; }
        }
      `}</style>

      <div className="ug-page">
        <div className="ug-inner">

          {/* ── Header ── */}
          <div className="ug-header">
            <div className="ug-icon"><IconUUID /></div>
            <div>
              <span className="ug-cat">Dev Tools</span>
              <h1>UUID Generator</h1>
              <p>Generate universally unique identifiers in multiple versions and formats, with anatomy breakdown.</p>
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="ug-card">
            <div className="ug-card-head">
              <span className="ug-card-title">Configuration</span>
            </div>
            <div className="ug-controls-body">

              <div className="ug-control-row">
                {/* Version */}
                <div className="ug-control-group">
                  <span className="ug-control-label">Version</span>
                  <div className="ug-version-btns">
                    {VERSIONS.map(v => (
                      <button
                        key={v.key}
                        className={`ug-version-btn ${version === v.key ? "ug-version-on" : ""}`}
                        onClick={() => setVersion(v.key)}
                      >
                        <span className="ug-version-badge">{v.label}</span>
                        <span style={{ display: "flex", flexDirection: "column" }}>
                          {v.title}
                          <span className="ug-version-sub">{v.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div className="ug-control-group">
                  <span className="ug-control-label">Format</span>
                  <div className="ug-format-btns">
                    {FORMATS.map(f => (
                      <button
                        key={f.key}
                        className={`ug-format-btn ${format === f.key ? "ug-format-on" : ""}`}
                        onClick={() => setFormat(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate row */}
              <div className="ug-generate-row">
                <div className="ug-count-wrap">
                  <span className="ug-count-label">Count:</span>
                  <input
                    className="ug-count-input"
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={e => setCount(Math.max(1, Math.min(100, +e.target.value || 1)))}
                  />
                </div>
                <button className="ug-generate-btn" onClick={generate}>
                  <IconRefresh />
                  Generate UUIDs
                </button>
              </div>

            </div>
            {/* Format preview */}
            <div className="ug-fmt-preview">
              <strong>Preview:</strong>
              {formatUUID(uuids[0] || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx", format)}
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="ug-grid">

            {/* Left: UUID list */}
            <div className="ug-col-left">
              <div className="ug-card">
                <div className="ug-card-head">
                  <span className="ug-card-title">Generated UUIDs</span>
                  <div className="ug-card-actions">
                    <span className="ug-count-badge">{uuids.length} UUID{uuids.length !== 1 ? "s" : ""}</span>
                    <button className="ug-sm-btn" onClick={handleCopyAll}>
                      {copiedIdx === "all" ? <IconCheck /> : <IconCopy />}
                      {copiedIdx === "all" ? " Copied!" : " Copy All"}
                    </button>
                    <button className="ug-sm-btn" onClick={handleDownload}>
                      <IconDownload /> Download
                    </button>
                    <button className="ug-sm-btn" onClick={() => setUUIDs([])}>
                      <IconTrash />
                    </button>
                  </div>
                </div>

                {uuids.length === 0 ? (
                  <div className="ug-empty">No UUIDs yet — click Generate above.</div>
                ) : (
                  <div className="ug-list">
                    {uuids.map((uuid, i) => (
                      <div key={i} className="ug-uuid-item">
                        <span className="ug-uuid-num">{i + 1}</span>
                        <code className="ug-uuid-value">{formatUUID(uuid, format)}</code>
                        <div className="ug-uuid-actions">
                          <button
                            className="ug-icon-btn"
                            title="Regenerate this UUID"
                            onClick={() => regenerateOne(i)}
                          >
                            <IconRefresh />
                          </button>
                          <button
                            className="ug-icon-btn"
                            title="Copy"
                            onClick={() => handleCopy(formatUUID(uuid, format), i)}
                          >
                            {copiedIdx === i ? <IconCheck /> : <IconCopy />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anatomy */}
              {uuids.length > 0 && (
                <div className="ug-card">
                  <div className="ug-card-head">
                    <span className="ug-card-title">UUID Anatomy</span>
                    <button
                      className={`ug-toggle-anatomy ${showAnatomy ? "ug-toggle-on" : ""}`}
                      onClick={() => setShowAnatomy(p => !p)}
                    >
                      {showAnatomy ? "Hide" : "Show breakdown"}
                    </button>
                  </div>
                  {showAnatomy && (
                    <div className="ug-anatomy-body">
                      {/* Colored UUID */}
                      <div className="ug-anatomy-uuid">
                        {anatomySegments.map((seg, i) => (
                          <span key={i}>
                            <span
                              className="ug-seg"
                              style={{ background: seg.bg, borderColor: seg.border, color: seg.text }}
                              title={seg.label}
                            >
                              {seg.hex}
                            </span>
                            {i < 4 && <span className="ug-dash">-</span>}
                          </span>
                        ))}
                      </div>
                      {/* Part breakdown */}
                      <div className="ug-anatomy-parts">
                        {anatomySegments.map((seg, i) => (
                          <div key={i} className="ug-anatomy-row">
                            <span
                              className="ug-anatomy-dot"
                              style={{ background: seg.bg, borderColor: seg.border }}
                            />
                            <span className="ug-anatomy-name">{seg.label}</span>
                            <code className="ug-anatomy-hex">{seg.hex}</code>
                            <span className="ug-anatomy-bits">{seg.bits}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Quick reference */}
            <div className="ug-col-right">
              <div className="ug-card">
                <div className="ug-card-head">
                  <span className="ug-card-title">Quick Reference</span>
                </div>

                {/* Version info */}
                <div className="ug-info-section">
                  <div className="ug-info-header" style={{ cursor: "default" }}>Versions</div>
                  <div className="ug-info-body">
                    {[
                      { key: "v1", val: "Time-based. Uses timestamp + MAC address. Sortable by creation time." },
                      { key: "v3", val: "Name-based using MD5. Same name always gives same UUID." },
                      { key: "v4", val: "Random. 122 bits of randomness. Most widely used today." },
                      { key: "v5", val: "Name-based using SHA-1. Preferred over v3." },
                      { key: "v7", val: "New. Unix timestamp + random bits. Monotonically sortable." },
                      { key: "NIL", val: "Special-case UUID of all zeros. Used as a null value." },
                    ].map(item => (
                      <div key={item.key} className="ug-info-item">
                        <span className="ug-info-key">{item.key}</span>
                        <span className="ug-info-val">{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Format info */}
                <div className="ug-info-section">
                  <div className="ug-info-header" style={{ cursor: "default" }}>Formats</div>
                  <div className="ug-info-body">
                    {FORMATS.map(f => (
                      <div key={f.key} className="ug-info-item">
                        <span className="ug-info-key">{f.label}</span>
                        <span className="ug-info-val" style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", wordBreak: "break-all" }}>
                          {f.example}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use cases */}
                <div className="ug-info-section">
                  <div className="ug-info-header" style={{ cursor: "default" }}>Common Uses</div>
                  <div className="ug-info-body">
                    {[
                      { key: "DB PKs",     val: "Primary keys in distributed databases — no coordination needed." },
                      { key: "Sessions",   val: "Session tokens and authentication identifiers." },
                      { key: "File IDs",   val: "Unique filenames to avoid collisions in storage." },
                      { key: "Events",     val: "Idempotency keys in event-driven architectures." },
                      { key: "API Keys",   val: "Generated API keys and secrets for clients." },
                    ].map(item => (
                      <div key={item.key} className="ug-info-item">
                        <span className="ug-info-key">{item.key}</span>
                        <span className="ug-info-val">{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
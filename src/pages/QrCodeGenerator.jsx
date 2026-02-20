/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/static-components */
/* eslint-disable no-case-declarations */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  QrCode, Link, Mail, Phone, MessageSquare, Wifi, MapPin,
  Contact, FileText, Copy, Check, Download, RefreshCw,
  Palette, Settings, ChevronDown, ChevronUp, Smartphone,
  AlertCircle, Eye, Type, Hash
} from "lucide-react";
import "./QrCodeGenerator.css";
import { Helmet } from "react-helmet";

/* ─────────────── QR Types ─────────────── */
const QR_TYPES = [
  { id: "url",      label: "URL / Link",      Icon: Link,         placeholder: "https://example.com" },
  { id: "text",     label: "Plain Text",      Icon: Type,         placeholder: "Enter any text or message..." },
  { id: "email",    label: "Email",           Icon: Mail,         placeholder: null },
  { id: "phone",    label: "Phone",           Icon: Phone,        placeholder: "+91 98765 43210" },
  { id: "sms",      label: "SMS",             Icon: MessageSquare, placeholder: null },
  { id: "wifi",     label: "WiFi",            Icon: Wifi,         placeholder: null },
  { id: "vcard",    label: "Contact / vCard", Icon: Contact,      placeholder: null },
  { id: "location", label: "Location",        Icon: MapPin,       placeholder: null },
  { id: "upi",      label: "UPI Payment",     Icon: Hash,         placeholder: null },
  { id: "custom",   label: "Custom Data",     Icon: FileText,     placeholder: "Any raw data..." },
];

const ERROR_LEVELS = [
  { id: "L", label: "Low (7%)",     desc: "Smallest QR size" },
  { id: "M", label: "Medium (15%)", desc: "Balanced" },
  { id: "Q", label: "High (25%)",   desc: "Better recovery" },
  { id: "H", label: "Max (30%)",    desc: "Logo-ready" },
];

const QR_SIZES = [128, 200, 256, 320, 400, 512];

const COLOR_PRESETS = [
  { fg: "#0f0f0f", bg: "#ffffff", label: "Classic" },
  { fg: "#16a34a", bg: "#f0fdf4", label: "Forest" },
  { fg: "#2563eb", bg: "#eff6ff", label: "Ocean" },
  { fg: "#7c3aed", bg: "#f5f3ff", label: "Violet" },
  { fg: "#dc2626", bg: "#fff1f2", label: "Red" },
  { fg: "#0f172a", bg: "#f8fafc", label: "Slate" },
  { fg: "#92400e", bg: "#fffbeb", label: "Amber" },
  { fg: "#ffffff", bg: "#0f0f0f", label: "Invert" },
];

/* ─────────────── Build QR string ─────────────── */
function buildQRString(type, fields) {
  switch (type) {
    case "url":
    case "text":
    case "phone":
    case "custom":
      return fields.main || "";

    case "email":
      let mailto = `mailto:${fields.email || ""}`;
      const params = [];
      if (fields.subject) params.push(`subject=${encodeURIComponent(fields.subject)}`);
      if (fields.body)    params.push(`body=${encodeURIComponent(fields.body)}`);
      if (params.length)  mailto += "?" + params.join("&");
      return mailto;

    case "sms":
      return `sms:${fields.phone || ""}${fields.message ? `?body=${encodeURIComponent(fields.message)}` : ""}`;

    case "wifi":
      const enc = fields.encryption || "WPA";
      return `WIFI:T:${enc};S:${fields.ssid || ""};P:${fields.password || ""};H:${fields.hidden ? "true" : "false"};;`;

    case "vcard":
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${fields.name || ""}`,
        `ORG:${fields.org || ""}`,
        `TEL:${fields.phone || ""}`,
        `EMAIL:${fields.email || ""}`,
        `URL:${fields.url || ""}`,
        `ADR:;;${fields.address || ""};;;;`,
        "END:VCARD",
      ].filter(l => !l.endsWith(":") && !l.endsWith(":;;;;;;")).join("\n");

    case "location":
      if (fields.lat && fields.lng)
        return `geo:${fields.lat},${fields.lng}${fields.label ? `?q=${encodeURIComponent(fields.label)}` : ""}`;
      return "";

    case "upi":
      let upi = `upi://pay?pa=${fields.upiId || ""}`;
      if (fields.name)   upi += `&pn=${encodeURIComponent(fields.name)}`;
      if (fields.amount) upi += `&am=${fields.amount}`;
      if (fields.note)   upi += `&tn=${encodeURIComponent(fields.note)}`;
      return upi;

    default:
      return fields.main || "";
  }
}

/* ─────────────── Input Fields per type ─────────────── */
function TypeFields({ type, fields, onChange }) {
  const F = (key, label, placeholder, type_ = "text", opts = {}) => (
    <div className="qr-field" key={key}>
      <label className="qr-label">{label}</label>
      {opts.textarea ? (
        <textarea
          className="qr-textarea"
          value={fields[key] || ""}
          onChange={e => onChange(key, e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : opts.select ? (
        <select
          className="qr-input qr-select"
          value={fields[key] || opts.default || ""}
          onChange={e => onChange(key, e.target.value)}
        >
          {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          className="qr-input"
          type={type_}
          value={fields[key] || ""}
          onChange={e => onChange(key, e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  const Grid = ({ children }) => <div className="qr-fields-grid">{children}</div>;

  switch (type) {
    case "url":
      return F("main", "Website URL", "https://yourwebsite.com", "url");
    case "text":
      return F("main", "Text Content", "Type anything — a quote, note, message...", "text", { textarea: true });
    case "phone":
      return F("main", "Phone Number", "+91 98765 43210", "tel");
    case "custom":
      return F("main", "Raw Data", "Any custom data string...", "text", { textarea: true });

    case "email":
      return <>
        {F("email",   "Email Address", "hello@example.com", "email")}
        {F("subject", "Subject",       "Your subject line")}
        {F("body",    "Body",          "Your message body...", "text", { textarea: true })}
      </>;

    case "sms":
      return <>
        {F("phone",   "Phone Number", "+91 98765 43210", "tel")}
        {F("message", "Message",      "Pre-filled SMS text...", "text", { textarea: true })}
      </>;

    case "wifi":
      return <>
        {F("ssid",       "Network Name (SSID)", "MyHomeNetwork")}
        {F("password",   "Password",            "Your WiFi password")}
        {F("encryption", "Security Type", "", "text", { select: true, default: "WPA", options: ["WPA", "WEP", "nopass"] })}
        <div className="qr-field">
          <label className="qr-label">Hidden Network</label>
          <div className="qr-toggle-row qr-inline-toggle">
            <div className="qr-toggle-info">
              <p className="qr-toggle-label">Network is hidden</p>
              <p className="qr-toggle-sub">Enable if SSID is not broadcast</p>
            </div>
            <button
              className={`qr-toggle ${fields.hidden ? "qr-toggle-on" : ""}`}
              onClick={() => onChange("hidden", !fields.hidden)}
            ><span className="qr-toggle-thumb" /></button>
          </div>
        </div>
      </>;

    case "vcard":
      return <>
        <Grid>
          {F("name",    "Full Name",    "John Doe")}
          {F("org",     "Organisation", "Company Ltd.")}
          {F("phone",   "Phone",        "+91 98765 43210", "tel")}
          {F("email",   "Email",        "john@company.com", "email")}
          {F("url",     "Website",      "https://company.com", "url")}
          {F("address", "Address",      "123 MG Road, Mumbai")}
        </Grid>
      </>;

    case "location":
      return <>
        <Grid>
          {F("lat",   "Latitude",  "18.5204")}
          {F("lng",   "Longitude", "73.8567")}
        </Grid>
        {F("label", "Place Label (optional)", "Pune, Maharashtra")}
      </>;

    case "upi":
      return <>
        {F("upiId",  "UPI ID",       "name@upi")}
        <Grid>
          {F("name",   "Payee Name",   "John Doe")}
          {F("amount", "Amount (₹)",   "100", "number")}
        </Grid>
        {F("note",   "Payment Note",  "Thanks for the payment!")}
      </>;

    default:
      return null;
  }
}

/* ─────────────── Main Component ─────────────── */
export default function QRCodeGenerator() {
  const [qrType,      setQrType]      = useState("url");
  const [fields,      setFields]      = useState({ main: "" });
  const [fgColor,     setFgColor]     = useState("#0f0f0f");
  const [bgColor,     setBgColor]     = useState("#ffffff");
  const [size,        setSize]        = useState(256);
  const [errorLevel,  setErrorLevel]  = useState("M");
  const [qrDataUrl,   setQrDataUrl]   = useState("");
  const [qrString,    setQrString]    = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [error,       setError]       = useState("");
  const canvasRef = useRef(null);
  const scriptRef = useRef(false);

  /* Load qrcodejs from CDN */
  useEffect(() => {
    if (scriptRef.current) return;
    scriptRef.current = true;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  function handleFieldChange(key, val) {
    setFields(prev => ({ ...prev, [key]: val }));
  }

  function switchType(newType) {
    setQrType(newType);
    setFields({});
    setQrDataUrl("");
    setQrString("");
    setError("");
  }

  /* ── Generate QR ── */
  const generateQR = useCallback(() => {
    const str = buildQRString(qrType, fields);
    if (!str.trim()) { setError("Please fill in the required fields."); return; }

    setError("");
    setGenerating(true);
    setQrString(str);

    try {
      // Use a hidden div to generate via qrcode.js, then grab the canvas/img
      const container = document.createElement("div");
      container.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
      document.body.appendChild(container);

      /* eslint-disable no-undef */
      const qr = new QRCode(container, {
        text:           str,
        width:          size,
        height:         size,
        colorDark:      fgColor,
        colorLight:     bgColor,
        correctLevel:   QRCode.CorrectLevel[errorLevel],
      });
      /* eslint-enable no-undef */

      // Small timeout to let the canvas render
      setTimeout(() => {
        const canvas = container.querySelector("canvas");
        const img    = container.querySelector("img");
        let dataUrl  = "";

        if (canvas) {
          dataUrl = canvas.toDataURL("image/png");
        } else if (img) {
          // qrcodejs sometimes renders an img tag
          dataUrl = img.src;
        }

        setQrDataUrl(dataUrl);
        document.body.removeChild(container);
        setGenerating(false);
      }, 120);

    } catch (e) {
      setError("Failed to generate QR code. The data may be too long.");
      setGenerating(false);
    }
  }, [qrType, fields, fgColor, bgColor, size, errorLevel]);

  /* Auto-generate for simple types */
  useEffect(() => {
    if (qrType === "url" || qrType === "text" || qrType === "phone" || qrType === "custom") {
      const str = buildQRString(qrType, fields);
      if (str.trim().length < 2) { setQrDataUrl(""); setQrString(""); return; }
      const t = setTimeout(generateQR, 400);
      return () => clearTimeout(t);
    }
  }, [fields.main, fgColor, bgColor, size, errorLevel]);

  /* ── Download ── */
  function handleDownload(fmt = "png") {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode.${fmt}`;
    a.click();
  }

  /* ── Copy data string ── */
  function handleCopyString() {
    if (!qrString) return;
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentType = QR_TYPES.find(t => t.id === qrType);
  const qrLength    = qrString.length;
  const isComplex   = !["url","text","phone","custom"].includes(qrType);
  const canGenerate = !!Object.values(fields).some(v => v && String(v).trim());

  return (
    <>
    <Helmet>
      <title>Free QR Code Generator – URL, WiFi & vCard | ShauryaTools</title>
      <meta name="description" content="Generate QR codes for URLs, WiFi credentials, contact cards, and plain text. Customize colors and size. Download as PNG or SVG. Free, instant." />
      <meta name="keywords" content="qr code generator, free qr code, qr code maker, url qr code, wifi qr code, vcard qr code, custom qr code" />
      <link rel="canonical" href="https://shauryatools.vercel.app/qr-code-generator" />
    </Helmet>
    <div className="qr-page">
      <div className="qr-inner">

        {/* ── Header ── */}
        <div className="qr-header">
          <div className="qr-icon">
            <QrCode size={20} strokeWidth={2} />
          </div>
          <div>
            <span className="qr-cat">Utility Tools</span>
            <h1 className="qr-title">QR Code Generator</h1>
            <p className="qr-subtitle">
              Generate QR codes for URLs, WiFi, contacts, UPI, location, email, SMS and more — download instantly.
            </p>
          </div>
        </div>

        {/* ── Main layout: form + preview ── */}
        <div className="qr-layout">

          {/* ── Left: Settings ── */}
          <div className="qr-left">

            {/* Type selector */}
            <div className="qr-card">
              <label className="qr-label">QR Code Type</label>
              <div className="qr-type-grid">
                {QR_TYPES.map(t => {
                  const Icon = t.Icon;
                  return (
                    <button
                      key={t.id}
                      className={`qr-type-btn ${qrType === t.id ? "qr-type-on" : ""}`}
                      onClick={() => switchType(t.id)}
                    >
                      <Icon size={15} strokeWidth={2} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            

            {/* Input fields */}
            <div className="qr-card">
              <div className="qr-card-title-row">
                <currentType.Icon size={15} strokeWidth={2} color="var(--green)" />
                <span className="qr-card-title">{currentType.label}</span>
              </div>

              <TypeFields
                type={qrType}
                fields={fields}
                onChange={handleFieldChange}
              />

              {error && (
                <div className="qr-error">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Generate button for complex types */}
              {isComplex && (
                <button
                  className="qr-gen-btn"
                  onClick={generateQR}
                  disabled={!canGenerate || generating}
                >
                  {generating
                    ? <><span className="qr-spinner" /> Generating...</>
                    : <><QrCode size={15} /> Generate QR Code</>
                  }
                </button>
              )}
            </div>

            {/* Advanced options */}
            <div className="qr-card">
              <button className="qr-options-toggle" onClick={() => setShowOptions(o => !o)}>
                <Settings size={14} />
                Customise QR Code
                {showOptions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showOptions && (
                <div className="qr-options animate-in">

                  {/* Color presets */}
                  <div className="qr-field">
                    <label className="qr-label">Color Presets</label>
                    <div className="qr-color-presets">
                      {COLOR_PRESETS.map((p, i) => (
                        <button
                          key={i}
                          className={`qr-color-preset ${fgColor === p.fg && bgColor === p.bg ? "qr-preset-on" : ""}`}
                          onClick={() => { setFgColor(p.fg); setBgColor(p.bg); }}
                          title={p.label}
                        >
                          <span
                            className="qr-preset-swatch"
                            style={{ background: p.bg, border: `3px solid ${p.fg}` }}
                          />
                          <span className="qr-preset-name">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom colors */}
                  <div className="qr-two-col">
                    <div className="qr-field">
                      <label className="qr-label">Foreground</label>
                      <div className="qr-color-row">
                        <input type="color" className="qr-color-picker" value={fgColor}
                          onChange={e => setFgColor(e.target.value)} />
                        <input className="qr-input qr-color-hex" value={fgColor}
                          onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setFgColor(e.target.value); }}
                          maxLength={7} />
                      </div>
                    </div>
                    <div className="qr-field">
                      <label className="qr-label">Background</label>
                      <div className="qr-color-row">
                        <input type="color" className="qr-color-picker" value={bgColor}
                          onChange={e => setBgColor(e.target.value)} />
                        <input className="qr-input qr-color-hex" value={bgColor}
                          onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setBgColor(e.target.value); }}
                          maxLength={7} />
                      </div>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="qr-field">
                    <label className="qr-label">QR Size</label>
                    <div className="qr-size-btns">
                      {QR_SIZES.map(s => (
                        <button
                          key={s}
                          className={`qr-size-btn ${size === s ? "qr-size-on" : ""}`}
                          onClick={() => setSize(s)}
                        >{s}px</button>
                      ))}
                    </div>
                  </div>

                  {/* Error correction */}
                  <div className="qr-field">
                    <label className="qr-label">Error Correction</label>
                    <div className="qr-ec-btns">
                      {ERROR_LEVELS.map(lv => (
                        <button
                          key={lv.id}
                          className={`qr-ec-btn ${errorLevel === lv.id ? "qr-ec-on" : ""}`}
                          onClick={() => setErrorLevel(lv.id)}
                        >
                          <span className="qr-ec-id">{lv.id}</span>
                          <span className="qr-ec-label">{lv.label}</span>
                          <span className="qr-ec-desc">{lv.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* ── Right: Preview ── */}
          <div className="qr-right">
            <div className="qr-preview-card">

              {/* QR preview area */}
              <div
                className="qr-canvas-wrap"
                style={{ background: bgColor }}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="qr-canvas-img animate-in"
                    style={{ width: Math.min(size, 260), height: Math.min(size, 260) }}
                  />
                ) : generating ? (
                  <div className="qr-placeholder">
                    <span className="qr-spinner qr-spinner-dark" />
                    <p>Generating…</p>
                  </div>
                ) : (
                  <div className="qr-placeholder">
                    <QrCode size={48} strokeWidth={1.2} color="var(--grey-3)" />
                    <p>Fill in the fields<br/>to generate your QR code</p>
                  </div>
                )}
              </div>

              {/* Meta */}
              {qrDataUrl && (
                <div className="qr-meta">
                  <div className="qr-meta-pills">
                    <span className="qr-meta-pill">{size}×{size}px</span>
                    <span className="qr-meta-pill">EC: {errorLevel}</span>
                    {qrLength > 0 && <span className="qr-meta-pill">{qrLength} chars</span>}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="qr-preview-actions">
                <button
                  className="qr-dl-btn qr-dl-primary"
                  onClick={() => handleDownload("png")}
                  disabled={!qrDataUrl}
                >
                  <Download size={14} /> Download PNG
                </button>
                <button
                  className="qr-dl-btn qr-dl-secondary"
                  onClick={() => handleDownload("svg")}
                  disabled={!qrDataUrl}
                >
                  <Download size={14} /> Download SVG
                </button>
              </div>

              {/* Copy QR string */}
              {qrString && (
                <div className="qr-string-box">
                  <div className="qr-string-header">
                    <span className="qr-string-label">
                      <Eye size={12} /> Encoded Data
                    </span>
                    <button
                      className={`qr-copy-btn ${copied ? "qr-copied" : ""}`}
                      onClick={handleCopyString}
                    >
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                  <p className="qr-string-text">{qrString.length > 120 ? qrString.slice(0, 120) + "…" : qrString}</p>
                </div>
              )}

              {/* Tips */}
              <div className="qr-scan-tip">
                <Smartphone size={13} />
                <span>Point your phone camera at the QR code to test it</span>
              </div>

            </div>
          </div>

        </div>

        {/* ── Use-case info strip ── */}
        <div className="qr-info-strip">
          <p className="qr-info-title">What can QR codes do?</p>
          <div className="qr-info-grid">
            {[
              { icon: <Link size={13}/>,         label: "Open any website instantly" },
              { icon: <Wifi size={13}/>,          label: "Connect to WiFi — no typing" },
              { icon: <Contact size={13}/>,       label: "Share contact cards" },
              { icon: <MapPin size={13}/>,        label: "Drop a map location pin" },
              { icon: <Hash size={13}/>,          label: "Accept UPI payments" },
              { icon: <Mail size={13}/>,          label: "Open a pre-filled email" },
              { icon: <MessageSquare size={13}/>, label: "Send a pre-filled SMS" },
              { icon: <FileText size={13}/>,      label: "Share text or notes" },
            ].map((item, i) => (
              <div key={i} className="qr-info-item">
                <span className="qr-info-icon">{item.icon}</span>
                <span className="qr-info-text">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
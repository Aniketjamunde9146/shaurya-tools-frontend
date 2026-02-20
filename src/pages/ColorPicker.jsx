import { useState, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Pipette, Copy, Check, RefreshCw, Shuffle, Heart, Trash2, Plus, Lock, Unlock } from "lucide-react";
import "./ColorPicker.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/color-picker`;

/* ── Conversion helpers ── */
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full  = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const n = parseInt(full, 16);
  if (isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      default: h = ((rn - gn) / d + 4) / 6;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function rgbToCmyk({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function getLuminance({ r, g, b }) {
  const toLinear = c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1), l2 = getLuminance(rgb2);
  return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
}

function isLight(rgb) { return getLuminance(rgb) > 0.179; }

function randomHex() {
  return "#" + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0").toUpperCase();
}

function generatePalette(hex, type) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const { h, s, l } = rgbToHsl(rgb);

  switch (type) {
    case "complementary":
      return [hex, rgbToHex(hslToRgb((h + 180) % 360, s, l))];
    case "triadic":
      return [hex, rgbToHex(hslToRgb((h + 120) % 360, s, l)), rgbToHex(hslToRgb((h + 240) % 360, s, l))];
    case "analogous":
      return [rgbToHex(hslToRgb((h - 30 + 360) % 360, s, l)), hex, rgbToHex(hslToRgb((h + 30) % 360, s, l))];
    case "split-complementary":
      return [hex, rgbToHex(hslToRgb((h + 150) % 360, s, l)), rgbToHex(hslToRgb((h + 210) % 360, s, l))];
    case "tetradic":
      return [hex, rgbToHex(hslToRgb((h + 90) % 360, s, l)), rgbToHex(hslToRgb((h + 180) % 360, s, l)), rgbToHex(hslToRgb((h + 270) % 360, s, l))];
    case "monochromatic":
      return [20, 35, 50, 65, 80].map(lv => rgbToHex(hslToRgb(h, s, lv)));
    case "shades":
      return [10, 25, 40, 55, 70, 85].map(lv => rgbToHex(hslToRgb(h, s, lv)));
    default:
      return [hex];
  }
}

const PALETTE_TYPES = [
  { id: "monochromatic",      label: "Monochromatic" },
  { id: "complementary",      label: "Complementary" },
  { id: "analogous",          label: "Analogous" },
  { id: "triadic",            label: "Triadic" },
  { id: "split-complementary",label: "Split Comp." },
  { id: "tetradic",           label: "Tetradic" },
  { id: "shades",             label: "Shades" },
];

const NAMED_COLORS = [
  "#FF0000","#FF4500","#FF6347","#FF7F50","#FF8C00","#FFA500",
  "#FFD700","#FFFF00","#9ACD32","#32CD32","#00FF00","#00FA9A",
  "#00FFFF","#00BFFF","#1E90FF","#0000FF","#8A2BE2","#9400D3",
  "#FF00FF","#FF1493","#C71585","#DC143C","#8B0000","#A0522D",
  "#D2691E","#F4A460","#DEB887","#FFDEAD","#FFFACD","#FFFFFF",
  "#F5F5F5","#DCDCDC","#C0C0C0","#808080","#404040","#000000",
];

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className={`cp-copy-mini ${small ? "cp-copy-small" : ""} ${copied ? "cp-copied-mini" : ""}`} onClick={handle}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function ColorPicker() {
  const [hex,         setHex]         = useState("#6366F1");
  const [hexInput,    setHexInput]    = useState("#6366F1");
  const [r,           setR]           = useState(99);
  const [g,           setG]           = useState(102);
  const [b,           setB]           = useState(241);
  const [paletteType, setPaletteType] = useState("monochromatic");
  const [saved,       setSaved]       = useState([]);
  const [copiedMain,  setCopiedMain]  = useState(false);
  const [tab,         setTab]         = useState("picker");
  const [randColors,  setRandColors]  = useState(() => Array.from({length:5}, randomHex));
  const [locked,      setLocked]      = useState([false,false,false,false,false]);

  const rgb     = useMemo(() => ({ r, g, b }), [r, g, b]);
  const hsl     = useMemo(() => rgbToHsl(rgb), [rgb]);
  const cmyk    = useMemo(() => rgbToCmyk(rgb), [rgb]);
  const light   = useMemo(() => isLight(rgb), [rgb]);
  const contrastW = useMemo(() => getContrastRatio(rgb, { r:255, g:255, b:255 }), [rgb]);
  const contrastB = useMemo(() => getContrastRatio(rgb, { r:0,   g:0,   b:0   }), [rgb]);
  const palette = useMemo(() => generatePalette(hex, paletteType), [hex, paletteType]);

  const syncFromHex = useCallback((h) => {
    const c = hexToRgb(h);
    if (!c) return;
    setHex(h.toUpperCase());
    setHexInput(h.toUpperCase());
    setR(c.r); setG(c.g); setB(c.b);
  }, []);

  const syncFromRgb = useCallback((nr, ng, nb) => {
    const h = rgbToHex({ r: nr, g: ng, b: nb });
    setHex(h); setHexInput(h);
    setR(nr); setG(ng); setB(nb);
  }, []);

  const handleHexInput = (v) => {
    setHexInput(v);
    const clean = v.startsWith("#") ? v : "#" + v;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) syncFromHex(clean);
  };

  const handleNativeChange = (v) => syncFromHex(v);
  const handleRSlider = (v) => syncFromRgb(+v, g, b);
  const handleGSlider = (v) => syncFromRgb(r, +v, b);
  const handleBSlider = (v) => syncFromRgb(r, g, +v);
  const handleHslH = (v) => { const c = hslToRgb(+v, hsl.s, hsl.l); syncFromRgb(c.r, c.g, c.b); };
  const handleHslS = (v) => { const c = hslToRgb(hsl.h, +v, hsl.l); syncFromRgb(c.r, c.g, c.b); };
  const handleHslL = (v) => { const c = hslToRgb(hsl.h, hsl.s, +v); syncFromRgb(c.r, c.g, c.b); };
  const handleRandom = () => syncFromHex(randomHex());
  const handleSave = () => { if (!saved.includes(hex)) setSaved(prev => [hex, ...prev].slice(0, 24)); };
  const handleCopyMain = () => {
    navigator.clipboard.writeText(hex);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 1800);
  };
  const handleRandShuffle = () => { setRandColors(prev => prev.map((c, i) => locked[i] ? c : randomHex())); };
  const toggleLock = (i) => setLocked(prev => prev.map((v, idx) => idx === i ? !v : v));

  const wcagRating = (ratio) => {
    const n = parseFloat(ratio);
    if (n >= 7)   return { label: "AAA", color: "green" };
    if (n >= 4.5) return { label: "AA",  color: "green" };
    if (n >= 3)   return { label: "AA Large", color: "amber" };
    return { label: "Fail", color: "red" };
  };

  return (
    <>
      <Helmet>
        <title>Color Picker – HEX, RGB, HSL, CMYK Converter & Palette Generator | ShauryaTools</title>
        <meta
          name="description"
          content="Free online color picker. Convert colors between HEX, RGB, HSL and CMYK. Generate color palettes, check WCAG accessibility contrast ratios, and explore random palettes."
        />
        <meta
          name="keywords"
          content="color picker, hex color picker, RGB to HEX, color converter, color palette generator, WCAG contrast checker, HSL color picker, CMYK converter"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Color Picker – HEX, RGB, HSL, CMYK & Palette Generator" />
        <meta property="og:description" content="Free color picker with format conversion, palette generation and WCAG accessibility checking." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Online Color Picker & Palette Generator" />
        <meta name="twitter:description" content="Pick colors, convert formats and generate palettes. Free tool." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Color Picker",
            "url": PAGE_URL,
            "applicationCategory": "DesignApplication",
            "operatingSystem": "All",
            "description": "Free online color picker with HEX, RGB, HSL, CMYK conversion, palette generation and WCAG accessibility checker.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="cp-page">
        <div className="cp-inner">

          <div className="cp-header">
            <div className="cp-icon"><Pipette size={20} /></div>
            <div>
              <span className="cp-cat-badge">Design Tools</span>
              <h1>Color Picker</h1>
              <p>Pick, convert, explore palettes, and check accessibility — all in one place.</p>
            </div>
          </div>

          <div className="cp-tab-bar">
            {[
              { id: "picker",  label: "🎨 Color Picker" },
              { id: "palette", label: "🖌️ Palettes" },
              { id: "random",  label: "🎲 Random Palette" },
              { id: "saved",   label: `❤️ Saved${saved.length ? ` (${saved.length})` : ""}` },
            ].map(t => (
              <button
                key={t.id}
                className={`cp-tab-main ${tab === t.id ? "cp-tab-on" : ""}`}
                onClick={() => setTab(t.id)}
              >{t.label}</button>
            ))}
          </div>

          {/* ── PICKER TAB ── */}
          {tab === "picker" && (
            <>
              <div className="cp-card">
                <div className="cp-preview-row">
                  <div className="cp-swatch-big" style={{ background: hex }}>
                    <span className={`cp-swatch-hex ${light ? "cp-text-dark" : "cp-text-light"}`}>{hex}</span>
                  </div>
                  <div className="cp-preview-info">
                    <div className="cp-preview-actions">
                      <button className="cp-action-btn" onClick={handleRandom} title="Random color">
                        <Shuffle size={14} /> Random
                      </button>
                      <button className="cp-action-btn" onClick={handleSave} title="Save color">
                        <Heart size={14} /> Save
                      </button>
                      <button className={`cp-action-btn cp-copy-main ${copiedMain ? "cp-copied-main" : ""}`} onClick={handleCopyMain}>
                        {copiedMain ? <Check size={14} /> : <Copy size={14} />}
                        {copiedMain ? "Copied!" : "Copy HEX"}
                      </button>
                    </div>
                    <label className="cp-native-wrap" title="Open color picker">
                      <Pipette size={13} />
                      Open Color Picker
                      <input
                        type="color"
                        className="cp-native-input"
                        value={hex}
                        onChange={e => handleNativeChange(e.target.value)}
                      />
                    </label>
                    <div className="cp-hex-field">
                      <label className="cp-field-label">HEX</label>
                      <input
                        className="cp-hex-input"
                        value={hexInput}
                        onChange={e => handleHexInput(e.target.value)}
                        placeholder="#6366F1"
                        maxLength={7}
                      />
                      <CopyBtn text={hex} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="cp-card">
                <p className="cp-section-title">RGB Sliders</p>
                {[
                  { label:"R", val:r, set:handleRSlider, color:"#ef4444", grad:`linear-gradient(to right, #000, rgb(255,0,0))` },
                  { label:"G", val:g, set:handleGSlider, color:"#22c55e", grad:`linear-gradient(to right, #000, rgb(0,255,0))` },
                  { label:"B", val:b, set:handleBSlider, color:"#3b82f6", grad:`linear-gradient(to right, #000, rgb(0,0,255))` },
                ].map(({ label, val, set, color, grad }) => (
                  <div className="cp-slider-row" key={label}>
                    <span className="cp-slider-label" style={{ color }}>{label}</span>
                    <div className="cp-slider-track" style={{ background: grad }}>
                      <input type="range" min="0" max="255" value={val} className="cp-slider" onChange={e => set(e.target.value)} style={{ "--thumb-color": color }} />
                    </div>
                    <input type="number" min="0" max="255" value={val} className="cp-num-input" onChange={e => set(Math.max(0, Math.min(255, +e.target.value)))} />
                  </div>
                ))}

                <div className="cp-divider" />
                <p className="cp-section-title">HSL Sliders</p>
                {[
                  { label:"H", val:hsl.h, max:360, set:handleHslH, grad:`linear-gradient(to right, hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))` },
                  { label:"S", val:hsl.s, max:100, set:handleHslS, grad:`linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))` },
                  { label:"L", val:hsl.l, max:100, set:handleHslL, grad:`linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))` },
                ].map(({ label, val, max, set, grad }) => (
                  <div className="cp-slider-row" key={label}>
                    <span className="cp-slider-label">{label}</span>
                    <div className="cp-slider-track" style={{ background: grad }}>
                      <input type="range" min="0" max={max} value={val} className="cp-slider" onChange={e => set(e.target.value)} />
                    </div>
                    <input type="number" min="0" max={max} value={val} className="cp-num-input" onChange={e => set(Math.max(0, Math.min(max, +e.target.value)))} />
                  </div>
                ))}
              </div>

              <div className="cp-card">
                <p className="cp-section-title">Color Values</p>
                <div className="cp-values-grid">
                  {[
                    { label: "HEX",  value: hex },
                    { label: "RGB",  value: `rgb(${r}, ${g}, ${b})` },
                    { label: "HSL",  value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
                    { label: "CMYK", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
                    { label: "CSS var", value: `--color: ${hex};` },
                    { label: "Tailwind approx", value: `bg-[${hex}]` },
                  ].map(({ label, value }) => (
                    <div className="cp-value-row" key={label}>
                      <span className="cp-value-label">{label}</span>
                      <span className="cp-value-val">{value}</span>
                      <CopyBtn text={value} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="cp-card">
                <p className="cp-section-title">Accessibility (WCAG)</p>
                <div className="cp-a11y-grid">
                  {[
                    { bg: "#ffffff", label: "On White", ratio: contrastW },
                    { bg: "#000000", label: "On Black", ratio: contrastB },
                  ].map(({ bg, label, ratio }) => {
                    const rating = wcagRating(ratio);
                    return (
                      <div key={label} className="cp-a11y-card" style={{ background: bg }}>
                        <div className="cp-a11y-sample" style={{ color: hex }}>Aa</div>
                        <div className="cp-a11y-sample cp-a11y-small" style={{ color: hex }}>Sample text</div>
                        <div className="cp-a11y-meta">
                          <span className="cp-a11y-label" style={{ color: bg === "#ffffff" ? "#666" : "#aaa" }}>{label}</span>
                          <span className="cp-a11y-ratio" style={{ color: bg === "#ffffff" ? "#333" : "#eee" }}>{ratio}:1</span>
                          <span className={`cp-a11y-badge cp-badge-${rating.color}`}>{rating.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cp-card">
                <p className="cp-section-title">Quick Pick</p>
                <div className="cp-swatches">
                  {NAMED_COLORS.map(c => (
                    <button key={c} className={`cp-swatch-sm ${hex === c ? "cp-swatch-active" : ""}`} style={{ background: c }} onClick={() => syncFromHex(c)} title={c} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── PALETTE TAB ── */}
          {tab === "palette" && (
            <div className="cp-card animate-in">
              <p className="cp-section-title">Palette Type</p>
              <div className="cp-palette-types">
                {PALETTE_TYPES.map(t => (
                  <button key={t.id} className={`cp-pal-type-btn ${paletteType === t.id ? "cp-pal-type-on" : ""}`} onClick={() => setPaletteType(t.id)}>{t.label}</button>
                ))}
              </div>
              <div className="cp-divider" />
              <div className="cp-palette-preview">
                {palette.map((c, i) => {
                  const cRgb = hexToRgb(c);
                  const textLight = cRgb ? !isLight(cRgb) : true;
                  return (
                    <div key={i} className="cp-pal-swatch" style={{ background: c }}>
                      <div className="cp-pal-swatch-inner">
                        <span className={`cp-pal-hex ${textLight ? "cp-text-light" : "cp-text-dark"}`}>{c}</span>
                        <div className="cp-pal-actions">
                          <button className="cp-pal-action" onClick={() => syncFromHex(c)} title="Set as main color"><Pipette size={13} /></button>
                          <button className="cp-pal-action" onClick={() => { if (!saved.includes(c)) setSaved(prev => [c, ...prev].slice(0,24)); }} title="Save"><Heart size={13} /></button>
                          <CopyBtn text={c} small />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cp-divider" />
              <p className="cp-section-title">All Palette Previews</p>
              <div className="cp-all-palettes">
                {PALETTE_TYPES.map(t => {
                  const pal = generatePalette(hex, t.id);
                  return (
                    <div key={t.id} className={`cp-mini-pal ${paletteType === t.id ? "cp-mini-pal-on" : ""}`} onClick={() => setPaletteType(t.id)}>
                      <div className="cp-mini-swatches">
                        {pal.map((c, i) => (<div key={i} className="cp-mini-swatch" style={{ background: c }} />))}
                      </div>
                      <span className="cp-mini-label">{t.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RANDOM PALETTE TAB ── */}
          {tab === "random" && (
            <div className="cp-card animate-in">
              <div className="cp-rand-header">
                <p className="cp-section-title">Random Color Palette</p>
                <button className="cp-shuffle-btn" onClick={handleRandShuffle}><Shuffle size={14} /> Shuffle</button>
              </div>
              <p className="cp-hint">🔒 Lock colors to keep them when shuffling.</p>
              <div className="cp-rand-palette">
                {randColors.map((c, i) => {
                  const cRgb = hexToRgb(c);
                  const tLight = cRgb ? !isLight(cRgb) : true;
                  return (
                    <div key={i} className="cp-rand-swatch" style={{ background: c }}>
                      <div className="cp-rand-top">
                        <button className={`cp-lock-btn ${locked[i] ? "cp-locked" : ""}`} onClick={() => toggleLock(i)} title={locked[i] ? "Unlock" : "Lock"}>
                          {locked[i] ? <Lock size={13} /> : <Unlock size={13} />}
                        </button>
                      </div>
                      <div className="cp-rand-bottom">
                        <span className={`cp-rand-hex ${tLight ? "cp-text-light" : "cp-text-dark"}`}>{c}</span>
                        <div className="cp-rand-btns">
                          <button className="cp-pal-action" onClick={() => syncFromHex(c)} title="Use color"><Pipette size={12} /></button>
                          <button className="cp-pal-action" onClick={() => { if (!saved.includes(c)) setSaved(p => [c,...p].slice(0,24)); }} title="Save"><Heart size={12} /></button>
                          <CopyBtn text={c} small />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SAVED TAB ── */}
          {tab === "saved" && (
            <div className="cp-card animate-in">
              <div className="cp-saved-header">
                <p className="cp-section-title">Saved Colors <span className="cp-saved-count">{saved.length}</span></p>
                {saved.length > 0 && (
                  <button className="cp-clear-btn" onClick={() => setSaved([])}><Trash2 size={13} /> Clear all</button>
                )}
              </div>
              {saved.length === 0 ? (
                <div className="cp-saved-empty">
                  <Heart size={32} className="cp-empty-icon" />
                  <p>No saved colors yet.</p>
                  <p className="cp-hint">Hit the heart button on any color to save it here.</p>
                </div>
              ) : (
                <div className="cp-saved-grid">
                  {saved.map((c, i) => {
                    const cRgb = hexToRgb(c);
                    const tLight = cRgb ? !isLight(cRgb) : true;
                    return (
                      <div key={i} className="cp-saved-swatch" style={{ background: c }}>
                        <span className={`cp-saved-hex ${tLight ? "cp-text-light" : "cp-text-dark"}`}>{c}</span>
                        <div className="cp-saved-actions">
                          <button className="cp-pal-action" onClick={() => { syncFromHex(c); setTab("picker"); }} title="Edit"><Pipette size={12} /></button>
                          <CopyBtn text={c} small />
                          <button className="cp-pal-action cp-del-btn" onClick={() => setSaved(p => p.filter((_, idx) => idx !== i))} title="Remove"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                  <button className="cp-saved-add" onClick={() => setTab("picker")}>
                    <Plus size={20} />
                    <span>Add More</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
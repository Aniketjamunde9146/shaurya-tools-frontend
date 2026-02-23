/* eslint-disable no-empty */
import { useState, useRef, useCallback, useEffect } from "react";
import "./ColorPaletteExtractor.css";
import { Helmet } from "react-helmet";
import {
  Pipette,
  Upload,
  Copy,
  CheckCircle,
  Settings,
  Download,
  Shuffle,
} from "lucide-react";

/* ── k-means color quantization ── */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function colorDistance(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function kMeans(pixels, k, iterations = 12) {
  // seed centroids by spread sampling
  let centroids = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) centroids.push([...pixels[i * step]]);

  let assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    // assign
    for (let i = 0; i < pixels.length; i++) {
      let minD = Infinity, best = 0;
      for (let j = 0; j < k; j++) {
        const d = colorDistance(pixels[i], centroids[j]);
        if (d < minD) { minD = d; best = j; }
      }
      assignments[i] = best;
    }
    // update centroids
    const sums  = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Array(k).fill(0);
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c][0] += pixels[i][0];
      sums[c][1] += pixels[i][1];
      sums[c][2] += pixels[i][2];
      counts[c]++;
    }
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        centroids[j] = [sums[j][0]/counts[j], sums[j][1]/counts[j], sums[j][2]/counts[j]];
      }
    }
  }

  // count cluster sizes for percentage
  const counts2 = new Array(k).fill(0);
  for (const a of assignments) counts2[a]++;
  const total = pixels.length;

  return centroids.map((c, i) => ({
    hex: rgbToHex(c[0], c[1], c[2]),
    r: Math.round(c[0]), g: Math.round(c[1]), b: Math.round(c[2]),
    pct: Math.round((counts2[i] / total) * 100),
  })).sort((a, b) => b.pct - a.pct);
}

/* ── Sample pixels from canvas (downsampled for speed) ── */
function extractColors(imgEl, colorCount) {
  const canvas = document.createElement("canvas");
  const MAX = 150; // sample at max 150px for speed
  const ratio = Math.min(MAX / imgEl.width, MAX / imgEl.height, 1);
  canvas.width  = Math.round(imgEl.width  * ratio);
  canvas.height = Math.round(imgEl.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // skip transparent
    pixels.push([data[i], data[i+1], data[i+2]]);
  }
  return kMeans(pixels, colorCount);
}

/* ── Luminance for contrast ── */
function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/* ── Component ── */
export default function ColorPaletteExtractor() {
  const [imgFile,    setImgFile]    = useState(null);
  const [imgEl,      setImgEl]      = useState(null);
  const [colors,     setColors]     = useState([]);
  const [colorCount, setColorCount] = useState(6);
  const [loading,    setLoading]    = useState(false);
  const [dragging,   setDragging]   = useState(false);
  const [copied,     setCopied]     = useState(null); // "hex:idx" | "rgb:idx" | "all"
  const fileInputRef = useRef(null);

  /* ── Load file ── */
  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file);
    setColors([]);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); setImgEl(img); };
    img.src = url;
  }, []);

  /* ── Auto-extract when image or colorCount changes ── */
  useEffect(() => {
    if (!imgEl) return;
    setLoading(true);
    // defer to let UI update
    setTimeout(() => {
      try {
        const result = extractColors(imgEl, colorCount);
        setColors(result);
      } catch (e) {}
      setLoading(false);
    }, 30);
  }, [imgEl, colorCount]);

  /* drag */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); };

  /* ── Copy helpers ── */
  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const copyAll = () => {
    const text = colors.map(c =>
      `${c.hex.toUpperCase()}  rgb(${c.r}, ${c.g}, ${c.b})  ${c.pct}%`
    ).join("\n");
    copyText(text, "all");
  };

  /* ── Export palette as PNG ── */
  const exportPalette = () => {
    if (!colors.length) return;
    const W = 120, H = 200, LABEL = 56;
    const canvas = document.createElement("canvas");
    canvas.width  = W * colors.length;
    canvas.height = H + LABEL;
    const ctx = canvas.getContext("2d");
    colors.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * W, 0, W, H);
      const lum = luminance(c.r, c.g, c.b);
      ctx.fillStyle = lum > 128 ? "#111" : "#fff";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(c.hex.toUpperCase(), i * W + W / 2, H + 18);
      ctx.font = "11px monospace";
      ctx.fillText(`rgb(${c.r},${c.g},${c.b})`, i * W + W / 2, H + 36);
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${c.pct}%`, i * W + W / 2, H + 52);
    });
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "palette.png";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };

  const hasImage = !!imgEl;

  return (
    <>
      <Helmet>
        <title>Color Palette Extractor – Extract Colors from Images | ShauryaTools</title>
        <meta name="description" content="Extract dominant colors from any image. Get hex codes, RGB values and percentages instantly in your browser. Free, private, no upload." />
        <meta name="keywords" content="color palette extractor, extract colors from image, dominant colors, hex codes, rgb values, color picker, free color tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/color-palette-extractor" />
      </Helmet>

      <div className="cpe-page">
        <div className="cpe-inner">

          {/* ── Header ── */}
          <div className="cpe-header">
            <div className="cpe-icon"><Pipette size={20} strokeWidth={2} /></div>
            <div>
              <span className="cpe-cat">Image Tools</span>
              <h1>Color Palette Extractor</h1>
              <p>Extract dominant colors from any image — hex codes, RGB values & percentages. 100% in-browser.</p>
            </div>
          </div>

          {/* ── Settings card ── */}
          <div className="cpe-card">
            <div className="cpe-field">
              <label className="cpe-label">
                <Settings size={14} strokeWidth={2.5} className="cpe-label-icon" />
                Extraction Settings
              </label>
              <div className="cpe-settings-row">
                <div className="cpe-setting-group">
                  <div className="cpe-setting-top">
                    <span className="cpe-setting-label">Number of Colors</span>
                    <span className="cpe-badge">{colorCount}</span>
                  </div>
                  <input type="range" min="2" max="12" step="1"
                    value={colorCount}
                    onChange={e => setColorCount(+e.target.value)}
                    className="cpe-slider"
                  />
                  <div className="cpe-slider-hints"><span>2 (minimal)</span><span>12 (detailed)</span></div>
                </div>
                <div className="cpe-info-pills">
                  <span className="cpe-info-pill"><span className="cpe-dot cpe-dot-hex" />HEX codes</span>
                  <span className="cpe-info-pill"><span className="cpe-dot cpe-dot-rgb" />RGB values</span>
                  <span className="cpe-info-pill"><span className="cpe-dot cpe-dot-pct" />% coverage</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Drop zone ── */}
          {!hasImage && (
            <div
              className={`cpe-dropzone ${dragging ? "cpe-dz-active" : ""}`}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*"
                className="cpe-file-input" onChange={e => loadFile(e.target.files[0])} />
              <div className="cpe-dz-content">
                <div className="cpe-dz-icon"><Upload size={28} strokeWidth={1.5} /></div>
                <p className="cpe-dz-title">Drop image here or <span className="cpe-dz-link">browse files</span></p>
                <p className="cpe-dz-sub">Supports JPG, PNG, WebP, GIF</p>
              </div>
            </div>
          )}

          {/* ── Results layout ── */}
          {hasImage && (
            <div className="cpe-results animate-in">

              {/* Image preview + meta */}
              <div className="cpe-image-panel">
                <div className="cpe-img-wrap">
                  <img src={URL.createObjectURL(imgFile)} alt="source" className="cpe-img" />
                  {loading && (
                    <div className="cpe-img-overlay">
                      <span className="cpe-big-spinner" />
                    </div>
                  )}
                </div>
                <div className="cpe-img-footer">
                  <div className="cpe-img-meta">
                    <p className="cpe-img-name">{imgFile.name}</p>
                    <p className="cpe-img-dim">{imgEl.width} × {imgEl.height}px</p>
                  </div>
                  <button className="cpe-change-btn" onClick={() => fileInputRef.current?.click()}>
                    <Shuffle size={12} strokeWidth={2.5} /> Change image
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*"
                    className="cpe-file-input" onChange={e => loadFile(e.target.files[0])} />
                </div>

                {/* Palette bar */}
                {colors.length > 0 && (
                  <div className="cpe-palette-bar">
                    {colors.map((c, i) => (
                      <div
                        key={i}
                        className="cpe-bar-segment"
                        style={{ background: c.hex, flex: c.pct }}
                        title={`${c.hex} · ${c.pct}%`}
                      />
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {colors.length > 0 && (
                  <div className="cpe-actions">
                    <button className={`cpe-action-btn ${copied === "all" ? "cpe-copied" : ""}`} onClick={copyAll}>
                      {copied === "all"
                        ? <><CheckCircle size={13} strokeWidth={2.5} /> Copied!</>
                        : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                    </button>
                    <button className="cpe-action-btn cpe-btn-export" onClick={exportPalette}>
                      <Download size={13} strokeWidth={2.5} /> Export PNG
                    </button>
                  </div>
                )}
              </div>

              {/* Color swatches */}
              <div className="cpe-swatches-panel">
                {loading && colors.length === 0 && (
                  <div className="cpe-loading-row">
                    <span className="cpe-big-spinner" />
                    <span className="cpe-loading-text">Extracting colors...</span>
                  </div>
                )}
                {colors.map((c, i) => {
                  const lum = luminance(c.r, c.g, c.b);
                  const textCol = lum > 160 ? "#111111" : "#ffffff";
                  return (
                    <div key={i} className="cpe-swatch-card">

                      {/* Big color block */}
                      <div
                        className="cpe-swatch-block"
                        style={{ background: c.hex }}
                      >
                        <span className="cpe-swatch-pct" style={{ color: textCol }}>
                          {c.pct}%
                        </span>
                      </div>

                      {/* Values */}
                      <div className="cpe-swatch-info">
                        <div className="cpe-value-row">
                          <span className="cpe-value-label">HEX</span>
                          <span className="cpe-value-text">{c.hex.toUpperCase()}</span>
                          <button
                            className={`cpe-copy-btn ${copied === `hex:${i}` ? "cpe-copy-done" : ""}`}
                            onClick={() => copyText(c.hex.toUpperCase(), `hex:${i}`)}
                            title="Copy HEX"
                          >
                            {copied === `hex:${i}`
                              ? <CheckCircle size={11} strokeWidth={2.5} />
                              : <Copy size={11} strokeWidth={2.5} />}
                          </button>
                        </div>
                        <div className="cpe-value-row">
                          <span className="cpe-value-label">RGB</span>
                          <span className="cpe-value-text">{c.r}, {c.g}, {c.b}</span>
                          <button
                            className={`cpe-copy-btn ${copied === `rgb:${i}` ? "cpe-copy-done" : ""}`}
                            onClick={() => copyText(`rgb(${c.r}, ${c.g}, ${c.b})`, `rgb:${i}`)}
                            title="Copy RGB"
                          >
                            {copied === `rgb:${i}`
                              ? <CheckCircle size={11} strokeWidth={2.5} />
                              : <Copy size={11} strokeWidth={2.5} />}
                          </button>
                        </div>
                        <div className="cpe-value-row">
                          <span className="cpe-value-label">HSL</span>
                          <span className="cpe-value-text">{rgbToHsl(c.r, c.g, c.b)}</span>
                          <button
                            className={`cpe-copy-btn ${copied === `hsl:${i}` ? "cpe-copy-done" : ""}`}
                            onClick={() => copyText(rgbToHsl(c.r, c.g, c.b), `hsl:${i}`)}
                            title="Copy HSL"
                          >
                            {copied === `hsl:${i}`
                              ? <CheckCircle size={11} strokeWidth={2.5} />
                              : <Copy size={11} strokeWidth={2.5} />}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          <div className="cpe-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — images are processed entirely in your browser. Nothing is uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}

/* ── RGB → HSL string ── */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
}
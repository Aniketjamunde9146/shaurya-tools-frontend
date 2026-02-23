/* eslint-disable no-empty */
import { useState, useRef, useCallback, useEffect } from "react";
import "./MemeGenerator.css";
import { Helmet } from "react-helmet";
import {
  Laugh,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  Settings,
  Type,
  Eye,
} from "lucide-react";

/* ── Font options ── */
const FONTS = [
  { label: "Impact",        value: "Impact, Arial Narrow, sans-serif" },
  { label: "Arial Black",   value: "'Arial Black', Gadget, sans-serif" },
  { label: "Comic Sans",    value: "'Comic Sans MS', cursive" },
  { label: "Oswald",        value: "Oswald, Impact, sans-serif" },
  { label: "Bebas",         value: "'Bebas Neue', Impact, sans-serif" },
  { label: "Bangers",       value: "Bangers, Impact, sans-serif" },
  { label: "Anton",         value: "Anton, Impact, sans-serif" },
];

/* ── Text align options ── */
const ALIGNS = ["left", "center", "right"];

/* ── Format file size ── */
function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ── Draw meme on canvas ── */
function drawMeme(canvas, img, settings) {
  const { topText, bottomText, font, fontSize, fontColor,
          strokeColor, strokeWidth, textAlign, allCaps } = settings;

  const ctx = canvas.getContext("2d");
  canvas.width  = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const scaledSize = Math.round((fontSize / 100) * img.height * 0.13);
  ctx.font      = `900 ${scaledSize}px ${font}`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = textAlign;
  ctx.textBaseline = "top";

  const pad = scaledSize * 0.5;
  const x   = textAlign === "left"   ? pad
             : textAlign === "right"  ? img.width - pad
             :                          img.width / 2;

  const drawOutlinedText = (text, cx, cy) => {
    const lines = wrapText(ctx, text, img.width - pad * 2);
    lines.forEach((line, i) => {
      const ly = cy + i * (scaledSize * 1.15);
      if (strokeWidth > 0) {
        ctx.lineWidth   = strokeWidth * (scaledSize / 40);
        ctx.strokeStyle = strokeColor;
        ctx.lineJoin    = "round";
        ctx.strokeText(line, cx, ly);
      }
      ctx.fillText(line, cx, ly);
    });
    return lines.length;
  };

  const processText = (t) => allCaps ? t.toUpperCase() : t;

  // Top text
  if (topText.trim()) {
    drawOutlinedText(processText(topText), x, pad);
  }

  // Bottom text — measure first so it sits above the bottom edge
  if (bottomText.trim()) {
    ctx.textBaseline = "bottom";
    const lines  = wrapText(ctx, processText(bottomText), img.width - pad * 2);
    const totalH = lines.length * (scaledSize * 1.15);
    const startY = img.height - pad - totalH;
    lines.forEach((line, i) => {
      const ly = startY + i * (scaledSize * 1.15) + scaledSize;
      if (strokeWidth > 0) {
        ctx.lineWidth   = strokeWidth * (scaledSize / 40);
        ctx.strokeStyle = strokeColor;
        ctx.lineJoin    = "round";
        ctx.strokeText(line, x, ly);
      }
      ctx.fillText(line, x, ly);
    });
  }
}

/* ── Word-wrap helper ── */
function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* ── Generate blob from canvas ── */
function canvasToBlob(canvas) {
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}

/* ── Component ── */
export default function MemeGenerator() {
  const [imgFile,     setImgFile]     = useState(null);
  const [imgEl,       setImgEl]       = useState(null);
  const [topText,     setTopText]     = useState("TOP TEXT");
  const [bottomText,  setBottomText]  = useState("BOTTOM TEXT");
  const [font,        setFont]        = useState(FONTS[0].value);
  const [fontSize,    setFontSize]    = useState(45);
  const [fontColor,   setFontColor]   = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [textAlign,   setTextAlign]   = useState("center");
  const [allCaps,     setAllCaps]     = useState(true);
  const [dragging,    setDragging]    = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);

  const canvasRef   = useRef(null);
  const fileInputRef= useRef(null);
  const previewRef  = useRef(null); // small preview canvas

  /* ── Load image file ── */
  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file);
    setDownloaded(false);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); setImgEl(img); };
    img.src = url;
  }, []);

  /* ── Redraw whenever anything changes ── */
  useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    const settings = { topText, bottomText, font, fontSize, fontColor, strokeColor, strokeWidth, textAlign, allCaps };
    drawMeme(canvasRef.current, imgEl, settings);
    setDownloaded(false);
  }, [imgEl, topText, bottomText, font, fontSize, fontColor, strokeColor, strokeWidth, textAlign, allCaps]);

  /* ── Download ── */
  const handleDownload = async () => {
    if (!canvasRef.current || !imgEl) return;
    const blob = await canvasToBlob(canvasRef.current);
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `meme-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    setDownloaded(true);
  };

  /* drag */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault(); setDragging(false);
    loadFile(e.dataTransfer.files[0]);
  };

  const hasImage = !!imgEl;

  return (
    <>
      <Helmet>
        <title>Free Meme Generator – Add Text to Images Online | ShauryaTools</title>
        <meta name="description" content="Create memes with top/bottom text, custom fonts, stroke outline and live preview. 100% in-browser, free, no account needed." />
        <meta name="keywords" content="meme generator, meme maker, add text to image, meme creator, impact font meme, free meme tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/meme-generator" />
      </Helmet>

      {/* Google Fonts for meme fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Bebas+Neue&family=Bangers&family=Anton&display=swap" rel="stylesheet" />

      <div className="mg-page">
        <div className="mg-inner">

          {/* ── Header ── */}
          <div className="mg-header">
            <div className="mg-icon"><Laugh size={20} strokeWidth={2} /></div>
            <div>
              <span className="mg-cat">Image Tools</span>
              <h1>Meme Generator</h1>
              <p>Add top & bottom text with custom fonts and stroke — live preview, 100% in your browser.</p>
            </div>
          </div>

          <div className="mg-layout">

            {/* ── Left: Controls ── */}
            <div className="mg-controls">

              {/* Upload */}
              {!hasImage ? (
                <div
                  className={`mg-dropzone ${dragging ? "mg-dz-active" : ""}`}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="mg-file-input"
                    onChange={e => loadFile(e.target.files[0])} />
                  <div className="mg-dz-content">
                    <div className="mg-dz-icon"><Upload size={26} strokeWidth={1.5} /></div>
                    <p className="mg-dz-title">Drop image or <span className="mg-dz-link">browse</span></p>
                    <p className="mg-dz-sub">JPG, PNG, WebP, GIF</p>
                  </div>
                </div>
              ) : (
                <div className="mg-card mg-img-info-row">
                  <div className="mg-thumb-wrap">
                    <img src={URL.createObjectURL(imgFile)} alt="source" className="mg-thumb" />
                  </div>
                  <div className="mg-img-meta">
                    <p className="mg-img-name">{imgFile.name}</p>
                    <p className="mg-img-size">{fmtSize(imgFile.size)} · {imgEl?.width}×{imgEl?.height}px</p>
                  </div>
                  <button className="mg-change-btn" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={12} strokeWidth={2.5} /> Change
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="mg-file-input"
                    onChange={e => loadFile(e.target.files[0])} />
                </div>
              )}

              {/* Settings card */}
              <div className="mg-card">
                <label className="mg-label">
                  <Settings size={14} strokeWidth={2.5} className="mg-label-icon" />
                  Text Settings
                </label>

                {/* Top / Bottom text */}
                <div className="mg-text-group">
                  <div className="mg-setting-group">
                    <span className="mg-setting-label">Top Text</span>
                    <input type="text" className="mg-text-input mg-text-top"
                      value={topText} onChange={e => setTopText(e.target.value)}
                      placeholder="TOP TEXT" maxLength={120} />
                  </div>
                  <div className="mg-setting-group">
                    <span className="mg-setting-label">Bottom Text</span>
                    <input type="text" className="mg-text-input mg-text-bottom"
                      value={bottomText} onChange={e => setBottomText(e.target.value)}
                      placeholder="BOTTOM TEXT" maxLength={120} />
                  </div>
                </div>

                <div className="mg-divider" />

                {/* Font */}
                <div className="mg-setting-group">
                  <span className="mg-setting-label">
                    <Type size={11} strokeWidth={2.5} /> Font
                  </span>
                  <div className="mg-font-grid">
                    {FONTS.map(f => (
                      <button
                        key={f.value}
                        className={`mg-font-btn ${font === f.value ? "mg-font-on" : ""}`}
                        style={{ fontFamily: f.value }}
                        onClick={() => setFont(f.value)}
                      >{f.label}</button>
                    ))}
                  </div>
                </div>

                <div className="mg-divider" />

                {/* Font size + align + allcaps row */}
                <div className="mg-row-3">
                  <div className="mg-setting-group">
                    <div className="mg-setting-top">
                      <span className="mg-setting-label">Size</span>
                      <span className="mg-badge">{fontSize}%</span>
                    </div>
                    <input type="range" min="15" max="100" step="5"
                      value={fontSize} onChange={e => setFontSize(+e.target.value)}
                      className="mg-slider" />
                    <div className="mg-slider-hints"><span>Small</span><span>Huge</span></div>
                  </div>

                  <div className="mg-setting-group">
                    <span className="mg-setting-label">Align</span>
                    <div className="mg-align-row">
                      {ALIGNS.map(a => (
                        <button key={a}
                          className={`mg-align-btn ${textAlign === a ? "mg-align-on" : ""}`}
                          onClick={() => setTextAlign(a)}
                          title={a}
                        >
                          {a === "left" ? "⬤·" : a === "center" ? "·⬤·" : "·⬤"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mg-setting-group">
                    <span className="mg-setting-label">ALL CAPS</span>
                    <div className="mg-align-row">
                      <button className={`mg-align-btn ${allCaps ? "mg-align-on" : ""}`}
                        onClick={() => setAllCaps(true)}>ON</button>
                      <button className={`mg-align-btn ${!allCaps ? "mg-align-on" : ""}`}
                        onClick={() => setAllCaps(false)}>off</button>
                    </div>
                  </div>
                </div>

                <div className="mg-divider" />

                {/* Colors + stroke */}
                <div className="mg-row-3">

                  <div className="mg-setting-group">
                    <span className="mg-setting-label">Text Color</span>
                    <div className="mg-color-row">
                      <input type="color" value={fontColor}
                        onChange={e => setFontColor(e.target.value)}
                        className="mg-color-input" />
                      <span className="mg-color-hex">{fontColor.toUpperCase()}</span>
                    </div>
                    <div className="mg-swatch-row">
                      {["#ffffff","#000000","#ffff00","#ff3b30","#059669"].map(c => (
                        <button key={c}
                          className={`mg-swatch ${fontColor === c ? "mg-swatch-on" : ""}`}
                          style={{ background: c }}
                          onClick={() => setFontColor(c)} />
                      ))}
                    </div>
                  </div>

                  <div className="mg-setting-group">
                    <span className="mg-setting-label">Stroke Color</span>
                    <div className="mg-color-row">
                      <input type="color" value={strokeColor}
                        onChange={e => setStrokeColor(e.target.value)}
                        className="mg-color-input" />
                      <span className="mg-color-hex">{strokeColor.toUpperCase()}</span>
                    </div>
                    <div className="mg-swatch-row">
                      {["#000000","#ffffff","#1e3a8a","#7c3aed","#b45309"].map(c => (
                        <button key={c}
                          className={`mg-swatch ${strokeColor === c ? "mg-swatch-on" : ""}`}
                          style={{ background: c }}
                          onClick={() => setStrokeColor(c)} />
                      ))}
                    </div>
                  </div>

                  <div className="mg-setting-group">
                    <div className="mg-setting-top">
                      <span className="mg-setting-label">Stroke Width</span>
                      <span className="mg-badge">{strokeWidth}</span>
                    </div>
                    <input type="range" min="0" max="20" step="1"
                      value={strokeWidth} onChange={e => setStrokeWidth(+e.target.value)}
                      className="mg-slider" />
                    <div className="mg-slider-hints"><span>None</span><span>Thick</span></div>
                  </div>

                </div>
              </div>

              {/* Download button */}
              <button
                className="mg-download-btn"
                onClick={handleDownload}
                disabled={!hasImage}
              >
                {downloaded
                  ? <><CheckCircle size={16} strokeWidth={2} /> Downloaded!</>
                  : <><Download size={16} strokeWidth={2} /> Download Meme</>
                }
              </button>

            </div>

            {/* ── Right: Live Preview ── */}
            <div className="mg-preview-panel">
              <div className="mg-preview-label">
                <Eye size={13} strokeWidth={2.5} />
                Live Preview
              </div>
              <div className="mg-canvas-wrap">
                {!hasImage && (
                  <div className="mg-canvas-empty">
                    <Laugh size={40} strokeWidth={1} className="mg-canvas-empty-icon" />
                    <p>Upload an image to start</p>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className={`mg-canvas ${!hasImage ? "mg-canvas-hidden" : ""}`}
                />
              </div>
              {hasImage && (
                <p className="mg-preview-hint">
                  {imgEl?.width}×{imgEl?.height}px · PNG export
                </p>
              )}
            </div>

          </div>

          <div className="mg-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — everything runs in your browser. Nothing is uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}
import { useState, useEffect, useRef, useCallback } from "react";
import "./ScreenshotEditor.css";
import { Helmet } from "react-helmet";
import {
  Image,
  Crop,
  ArrowUpRight,
  Type,
  Highlighter,
  Download,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Upload,
  Copy,
  Check,
  Minus,
  Plus,
  Square,
  EyeOff,
} from "lucide-react";

/* ──────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────── */
const TOOLS = [
  { id: "select",    label: "Select",    Icon: MousePointer, key: "V", tip: "Pan / select"         },
  { id: "crop",      label: "Crop",      Icon: Crop,         key: "C", tip: "Crop to selection"    },
  { id: "blur",      label: "Blur",      Icon: EyeOff,       key: "B", tip: "Blur sensitive info"  },
  { id: "arrow",     label: "Arrow",     Icon: ArrowUpRight, key: "A", tip: "Draw an arrow"        },
  { id: "highlight", label: "Highlight", Icon: Highlighter,  key: "H", tip: "Highlight a region"   },
  { id: "rect",      label: "Rectangle", Icon: Square,       key: "R", tip: "Draw a rectangle"     },
  { id: "text",      label: "Text",      Icon: Type,         key: "T", tip: "Add text label"       },
];

const COLORS = [
  { hex: "#ef4444", name: "Red"     },
  { hex: "#f97316", name: "Orange"  },
  { hex: "#eab308", name: "Yellow"  },
  { hex: "#22c55e", name: "Green"   },
  { hex: "#3b82f6", name: "Blue"    },
  { hex: "#8b5cf6", name: "Violet"  },
  { hex: "#ec4899", name: "Pink"    },
  { hex: "#ffffff", name: "White"   },
  { hex: "#111111", name: "Black"   },
];

const STROKE_SIZES = [2, 3, 5, 8, 12];
const FONT_SIZES   = [14, 18, 22, 28, 36, 48];
const BLUR_AMOUNTS = [
  { val: 6,  label: "Light"  },
  { val: 12, label: "Medium" },
  { val: 20, label: "Strong" },
  { val: 32, label: "Max"    },
];

/* ──────────────────────────────────────────
   CANVAS HELPERS
────────────────────────────────────────── */
function drawArrow(ctx, x1, y1, x2, y2, color, lw) {
  const angle   = Math.atan2(y2 - y1, x2 - x1);
  const headLen = Math.max(14, lw * 5);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = lw;
  ctx.lineCap     = "round";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur  = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRect(ctx, x, y, w, h, color, lw) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.lineJoin    = "round";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur  = 3;
  ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
  ctx.restore();
}

function drawHighlight(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle   = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function applyBlur(ctx, canvas, x, y, w, h, radius) {
  if (w < 2 || h < 2) return;
  // Pixelate approach (more reliable cross-browser than filter blur)
  const blockSize = Math.max(6, Math.floor(radius / 2));
  const imageData = ctx.getImageData(x, y, w, h);
  const data      = imageData.data;
  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
          const i = ((by + dy) * w + (bx + dx)) * 4;
          r += data[i]; g += data[i+1]; b += data[i+2]; a += data[i+3];
          count++;
        }
      }
      r = Math.round(r / count); g = Math.round(g / count);
      b = Math.round(b / count); a = Math.round(a / count);
      for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
          const i = ((by + dy) * w + (bx + dx)) * 4;
          data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = a;
        }
      }
    }
  }
  ctx.putImageData(imageData, x, y);
}

/* ──────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────── */
export default function ScreenshotEditor() {
  const fileRef     = useRef(null);
  const canvasRef   = useRef(null);
  const textRef     = useRef(null);
  const snapRef     = useRef(null); // ImageData snapshot before live draw

  const [hasImage,  setHasImage]  = useState(false);
  const [imgSize,   setImgSize]   = useState({ w: 0, h: 0 });
  const [tool,      setTool]      = useState("select");
  const [color,     setColor]     = useState("#ef4444");
  const [stroke,    setStroke]    = useState(3);
  const [fontSize,  setFontSize]  = useState(22);
  const [fontBold,  setFontBold]  = useState(false);
  const [blurAmt,   setBlurAmt]   = useState(12);
  const [zoom,      setZoom]      = useState(1);
  const [history,   setHistory]   = useState([]);
  const [dragging,  setDragging]  = useState(false);
  const [startPt,   setStartPt]   = useState(null);
  const [textCursor,setTextCursor]= useState(null); // {x, y}
  const [textVal,   setTextVal]   = useState("");
  const [isDrop,    setIsDrop]    = useState(false);
  const [copied,    setCopied]    = useState(false);

  /* ── coords from event ── */
  function evCoords(e) {
    const c   = canvasRef.current;
    const r   = c.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: Math.round((src.clientX - r.left)  / zoom),
      y: Math.round((src.clientY - r.top)   / zoom),
    };
  }

  /* ── save undo snapshot ── */
  const snap = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const data = c.getContext("2d").getImageData(0, 0, c.width, c.height);
    setHistory(h => [...h.slice(-24), data]);
  }, []);

  /* ── load image ── */
  const loadImg = useCallback((file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 1600;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const c   = canvasRef.current;
        c.width   = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        setImgSize({ w, h });
        setHasImage(true);
        setHistory([]);
        setZoom(1);
        setTextCursor(null);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  /* ── paste ── */
  useEffect(() => {
    const fn = e => {
      for (const item of e.clipboardData?.items || []) {
        if (item.type.startsWith("image/")) { loadImg(item.getAsFile()); break; }
      }
    };
    window.addEventListener("paste", fn);
    return () => window.removeEventListener("paste", fn);
  }, [loadImg]);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const fn = e => {
      if (textCursor) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { undo(); return; }
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-")                  setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)));
      const t = TOOLS.find(t => t.key === e.key.toUpperCase());
      if (t) { setTool(t.id); setTextCursor(null); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [textCursor, history]);

  /* ── undo ── */
  function undo() {
    if (!history.length) return;
    const c   = canvasRef.current;
    const ctx = c.getContext("2d");
    const d   = history[history.length - 1];
    c.width   = d.width; c.height = d.height;
    ctx.putImageData(d, 0, 0);
    setImgSize({ w: d.width, h: d.height });
    setHistory(h => h.slice(0, -1));
  }

  /* ── canvas snapshot for live-draw preview ── */
  function captureSnap() {
    const c = canvasRef.current;
    const tmp = document.createElement("canvas");
    tmp.width = c.width; tmp.height = c.height;
    tmp.getContext("2d").drawImage(c, 0, 0);
    snapRef.current = tmp;
  }

  function restoreSnap() {
    const c = canvasRef.current;
    if (snapRef.current) {
      c.getContext("2d").clearRect(0, 0, c.width, c.height);
      c.getContext("2d").drawImage(snapRef.current, 0, 0);
    }
  }

  /* ── pointer down ── */
  function onDown(e) {
    if (!hasImage || tool === "text") return;
    e.preventDefault();
    const pt = evCoords(e);
    setStartPt(pt);
    setDragging(true);
    if (tool !== "select") {
      snap();
      captureSnap();
    }
  }

  /* ── pointer move ── */
  function onMove(e) {
    if (!dragging || !startPt || !hasImage) return;
    e.preventDefault();
    const pt  = evCoords(e);
    const c   = canvasRef.current;
    const ctx = c.getContext("2d");
    const x   = Math.min(startPt.x, pt.x);
    const y   = Math.min(startPt.y, pt.y);
    const w   = Math.abs(pt.x - startPt.x);
    const h   = Math.abs(pt.y - startPt.y);

    restoreSnap();

    if (tool === "arrow") {
      drawArrow(ctx, startPt.x, startPt.y, pt.x, pt.y, color, stroke);
    } else if (tool === "rect") {
      drawRect(ctx, x, y, w, h, color, stroke);
    } else if (tool === "highlight") {
      drawHighlight(ctx, x, y, w, h, color);
    } else if (tool === "blur" || tool === "crop") {
      // show selection overlay
      ctx.save();
      if (tool === "crop") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.clearRect(x, y, w, h);
        ctx.drawImage(snapRef.current, x, y, w, h, x, y, w, h);
      }
      ctx.setLineDash([6, 3]);
      ctx.strokeStyle = tool === "blur" ? "rgba(255,100,100,0.9)" : "#fff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
      ctx.restore();
    }
  }

  /* ── pointer up ── */
  function onUp(e) {
    if (!dragging || !startPt || !hasImage) return;
    e.preventDefault();
    setDragging(false);

    const pt = e.changedTouches ? (() => {
      const t = e.changedTouches[0];
      const r = canvasRef.current.getBoundingClientRect();
      return { x: Math.round((t.clientX - r.left) / zoom), y: Math.round((t.clientY - r.top) / zoom) };
    })() : evCoords(e);

    const x = Math.min(startPt.x, pt.x);
    const y = Math.min(startPt.y, pt.y);
    const w = Math.abs(pt.x - startPt.x);
    const h = Math.abs(pt.y - startPt.y);

    if (w < 3 && h < 3 && tool !== "arrow") {
      restoreSnap(); setHistory(h => h.slice(0, -1)); return;
    }

    const c   = canvasRef.current;
    const ctx = c.getContext("2d");

    if (tool === "blur") {
      restoreSnap();
      applyBlur(ctx, c, x, y, w, h, blurAmt);
    } else if (tool === "crop") {
      if (w > 4 && h > 4) {
        const tmp = document.createElement("canvas");
        tmp.width = w; tmp.height = h;
        tmp.getContext("2d").drawImage(snapRef.current, x, y, w, h, 0, 0, w, h);
        c.width = w; c.height = h;
        ctx.drawImage(tmp, 0, 0);
        setImgSize({ w, h });
      } else restoreSnap();
    }
    // arrow, rect, highlight: already committed on canvas during move
    snapRef.current = null;
    setStartPt(null);
  }

  /* ── canvas click → text placement ── */
  function onCanvasClick(e) {
    if (!hasImage || tool !== "text") return;
    const pt = evCoords(e);
    setTextCursor(pt);
    setTextVal("");
    setTimeout(() => textRef.current?.focus(), 20);
  }

  /* ── commit text ── */
  function commitText() {
    if (textVal.trim() && textCursor) {
      snap();
      const c   = canvasRef.current;
      const ctx = c.getContext("2d");
      const w   = fontBold ? "bold" : "600";
      ctx.save();
      ctx.font          = `${w} ${fontSize}px 'Figtree', sans-serif`;
      ctx.fillStyle     = color;
      ctx.shadowColor   = color === "#ffffff" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.5)";
      ctx.shadowBlur    = 5;
      ctx.fillText(textVal, textCursor.x, textCursor.y);
      ctx.restore();
    }
    setTextCursor(null);
    setTextVal("");
  }

  /* ── reset ── */
  function reset() {
    const c = canvasRef.current;
    if (c) { const ctx = c.getContext("2d"); ctx.clearRect(0, 0, c.width, c.height); c.width = 0; c.height = 0; }
    setHasImage(false); setHistory([]); setImgSize({ w: 0, h: 0 });
    setTextCursor(null); setZoom(1); snapRef.current = null;
  }

  /* ── download ── */
  function download() {
    const a = document.createElement("a");
    a.href     = canvasRef.current.toDataURL("image/png");
    a.download = "screenshot-edited.png";
    a.click();
  }

  /* ── copy ── */
  async function copyImg() {
    canvasRef.current.toBlob(async blob => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    });
  }

  const cursorClass =
    tool === "text"   ? "cur-text"
    : tool === "select" ? "cur-default"
    : "cur-crosshair";

  return (
    <>
      <Helmet>
        <title>Free Screenshot Editor – Crop, Blur, Annotate | ShauryaTools</title>
        <meta name="description" content="Free browser-based screenshot editor. Crop, blur sensitive info, add arrows, highlight areas, draw rectangles and add text. No upload, works instantly." />
        <meta name="keywords" content="screenshot editor, crop screenshot, blur screenshot, annotate image, add arrow to screenshot, highlight screenshot, free online image editor" />
        <link rel="canonical" href="https://shauryatools.vercel.app/screenshot-editor" />
      </Helmet>

      <div className="se-root">

        {/* ════ TOP BAR ════ */}
        <header className="se-bar">
          <div className="se-bar-brand">
            <Image size={14} strokeWidth={2.5} />
            <span>Screenshot Editor</span>
          </div>

          {/* ── Tool buttons ── */}
          <nav className="se-toolstrip">
            {TOOLS.map(({ id, label, Icon, key, tip }) => (
              <button
                key={id}
                className={`se-tool ${tool === id ? "se-tool-on" : ""}`}
                onClick={() => { setTool(id); setTextCursor(null); }}
                title={`${tip}  [${key}]`}
                disabled={!hasImage && id !== "select"}
              >
                <Icon size={15} strokeWidth={2} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* ── Right controls ── */}
          <div className="se-bar-right">
            {/* zoom */}
            <div className="se-zoom">
              <button className="se-ic" onClick={() => setZoom(z => Math.max(0.25, +(z-0.25).toFixed(2)))} title="Zoom out (-)"><ZoomOut size={14} strokeWidth={2}/></button>
              <span className="se-zoom-val" onClick={() => setZoom(1)} title="Reset zoom">{Math.round(zoom * 100)}%</span>
              <button className="se-ic" onClick={() => setZoom(z => Math.min(4, +(z+0.25).toFixed(2)))} title="Zoom in (+)"><ZoomIn size={14} strokeWidth={2}/></button>
            </div>

            <div className="se-bar-divider"/>

            <button className="se-ic" onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)">
              <Undo2 size={14} strokeWidth={2}/>
            </button>
            <button className="se-ic se-ic-danger" onClick={reset} disabled={!hasImage} title="Clear canvas">
              <Trash2 size={14} strokeWidth={2}/>
            </button>

            <div className="se-bar-divider"/>

            <button className={`se-ic ${copied ? "se-ic-copied" : ""}`} onClick={copyImg} disabled={!hasImage} title="Copy image (Ctrl+C)">
              {copied ? <Check size={14} strokeWidth={2}/> : <Copy size={14} strokeWidth={2}/>}
            </button>
            <button className="se-dl-btn" onClick={download} disabled={!hasImage}>
              <Download size={14} strokeWidth={2}/>
              <span>Download</span>
            </button>
          </div>
        </header>

        {/* ════ OPTIONS BAR ════ */}
        {hasImage && (
          <div className="se-optbar">
            {/* Color — shown for arrow, highlight, rect, text */}
            {["arrow","highlight","rect","text"].includes(tool) && (
              <div className="se-opt-group">
                {COLORS.map(({ hex, name }) => (
                  <button
                    key={hex}
                    className={`se-swatch ${color === hex ? "se-swatch-on" : ""}`}
                    style={{ background: hex, boxShadow: hex === "#ffffff" ? "inset 0 0 0 1px #ccc" : "none" }}
                    onClick={() => setColor(hex)}
                    title={name}
                  />
                ))}
                <div className="se-opt-divider"/>
              </div>
            )}

            {/* Stroke size — arrow, rect */}
            {["arrow","rect"].includes(tool) && (
              <div className="se-opt-group">
                <span className="se-opt-lbl">Size</span>
                {STROKE_SIZES.map(s => (
                  <button key={s} className={`se-stroke-btn ${stroke === s ? "se-stroke-on" : ""}`} onClick={() => setStroke(s)}>
                    <span className="se-stroke-dot" style={{ width: s * 1.6, height: s * 1.6 }}/>
                  </button>
                ))}
                <div className="se-opt-divider"/>
              </div>
            )}

            {/* Blur amount */}
            {tool === "blur" && (
              <div className="se-opt-group">
                <span className="se-opt-lbl">Intensity</span>
                {BLUR_AMOUNTS.map(({ val, label }) => (
                  <button key={val} className={`se-pill ${blurAmt === val ? "se-pill-on" : ""}`} onClick={() => setBlurAmt(val)}>
                    {label}
                  </button>
                ))}
                <div className="se-opt-divider"/>
              </div>
            )}

            {/* Font options */}
            {tool === "text" && (
              <div className="se-opt-group">
                <span className="se-opt-lbl">Font size</span>
                <button className="se-ic se-ic-sm" onClick={() => setFontSize(s => Math.max(10, s - 2))}><Minus size={11}/></button>
                <span className="se-font-val">{fontSize}px</span>
                <button className="se-ic se-ic-sm" onClick={() => setFontSize(s => Math.min(96, s + 2))}><Plus size={11}/></button>
                <div className="se-opt-divider"/>
                <button className={`se-bold-btn ${fontBold ? "se-bold-on" : ""}`} onClick={() => setFontBold(v => !v)}><b>B</b></button>
                <div className="se-opt-divider"/>
              </div>
            )}

            {/* Crop hint */}
            {tool === "crop" && (
              <div className="se-opt-group">
                <span className="se-opt-lbl se-opt-hint">Drag to select crop area — release to apply</span>
              </div>
            )}

            {/* Dim info */}
            <div className="se-opt-group se-opt-right">
              <span className="se-dim">{imgSize.w} × {imgSize.h}px</span>
            </div>
          </div>
        )}

        {/* ════ WORKSPACE ════ */}
        <div className="se-workspace">

          {/* ── Drop zone ── */}
          {!hasImage && (
            <div
              className={`se-drop ${isDrop ? "se-drop-over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDrop(true); }}
              onDragLeave={() => setIsDrop(false)}
              onDrop={e => { e.preventDefault(); setIsDrop(false); loadImg(e.dataTransfer.files[0]); }}
            >
              <div className="se-drop-icon">
                <Upload size={40} strokeWidth={1.3}/>
              </div>
              <h2>Drop your screenshot here</h2>
              <p>or click to choose a file</p>
              <div className="se-paste-hint">
                <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste from clipboard
              </div>
              <div className="se-formats">PNG &nbsp;·&nbsp; JPG &nbsp;·&nbsp; WebP &nbsp;·&nbsp; GIF</div>
              <button className="se-upload-btn" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                <Upload size={14} strokeWidth={2}/>
                Choose File
              </button>
            </div>
          )}

          {/* ── Canvas stage ── */}
          <div
            className="se-stage-wrap"
            style={{ display: hasImage ? "flex" : "none" }}
          >
            <div
              className="se-stage"
              style={{
                width:  imgSize.w * zoom,
                height: imgSize.h * zoom,
              }}
            >
              <canvas
                ref={canvasRef}
                className={`se-canvas ${cursorClass}`}
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                onMouseDown={onDown}
                onMouseMove={onMove}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                onTouchStart={onDown}
                onTouchMove={onMove}
                onTouchEnd={onUp}
                onClick={onCanvasClick}
              />

              {/* Floating text input */}
              {textCursor && (
                <div
                  className="se-text-float"
                  style={{
                    left:     textCursor.x * zoom,
                    top:      textCursor.y * zoom - fontSize * zoom,
                    fontSize: fontSize * zoom,
                    fontWeight: fontBold ? 700 : 600,
                    color,
                  }}
                >
                  <input
                    ref={textRef}
                    className="se-text-input"
                    value={textVal}
                    onChange={e => setTextVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter")  commitText();
                      if (e.key === "Escape") { setTextCursor(null); setTextVal(""); }
                    }}
                    onBlur={commitText}
                    style={{ fontSize: fontSize * zoom, fontWeight: fontBold ? 700 : 600, color }}
                    placeholder="Type…"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => { loadImg(e.target.files[0]); e.target.value = ""; }}
        />
      </div>
    </>
  );
}
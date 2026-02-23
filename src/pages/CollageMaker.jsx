/* eslint-disable no-empty */
import { useState, useRef, useCallback, useEffect } from "react";
import "./CollageMaker.css";
import { Helmet } from "react-helmet";
import {
  LayoutGrid,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  Settings,
  Image as ImageIcon,
  Plus,
  Minus,
} from "lucide-react";

/* ── Layout presets ── */
const LAYOUTS = [
  {
    id: "grid-2x2", label: "2×2 Grid", slots: 4,
    cells: [
      { x: 0,   y: 0,   w: 50,  h: 50  },
      { x: 50,  y: 0,   w: 50,  h: 50  },
      { x: 0,   y: 50,  w: 50,  h: 50  },
      { x: 50,  y: 50,  w: 50,  h: 50  },
    ],
  },
  {
    id: "grid-3x1", label: "3 Columns", slots: 3,
    cells: [
      { x: 0,          y: 0, w: 33.33, h: 100 },
      { x: 33.33,      y: 0, w: 33.33, h: 100 },
      { x: 66.66,      y: 0, w: 33.34, h: 100 },
    ],
  },
  {
    id: "grid-1x3", label: "3 Rows", slots: 3,
    cells: [
      { x: 0, y: 0,          w: 100, h: 33.33 },
      { x: 0, y: 33.33,      w: 100, h: 33.33 },
      { x: 0, y: 66.66,      w: 100, h: 33.34 },
    ],
  },
  {
    id: "featured-left", label: "Feature Left", slots: 3,
    cells: [
      { x: 0,  y: 0,  w: 60, h: 100 },
      { x: 60, y: 0,  w: 40, h: 50  },
      { x: 60, y: 50, w: 40, h: 50  },
    ],
  },
  {
    id: "featured-right", label: "Feature Right", slots: 3,
    cells: [
      { x: 0,  y: 0,  w: 40, h: 50  },
      { x: 0,  y: 50, w: 40, h: 50  },
      { x: 40, y: 0,  w: 60, h: 100 },
    ],
  },
  {
    id: "featured-top", label: "Feature Top", slots: 3,
    cells: [
      { x: 0,  y: 0,  w: 100, h: 60 },
      { x: 0,  y: 60, w: 50,  h: 40 },
      { x: 50, y: 60, w: 50,  h: 40 },
    ],
  },
  {
    id: "grid-2x3", label: "2×3 Grid", slots: 6,
    cells: [
      { x: 0,  y: 0,          w: 50, h: 33.33 },
      { x: 50, y: 0,          w: 50, h: 33.33 },
      { x: 0,  y: 33.33,      w: 50, h: 33.33 },
      { x: 50, y: 33.33,      w: 50, h: 33.33 },
      { x: 0,  y: 66.66,      w: 50, h: 33.34 },
      { x: 50, y: 66.66,      w: 50, h: 33.34 },
    ],
  },
  {
    id: "triptych", label: "Triptych", slots: 3,
    cells: [
      { x: 0,  y: 10, w: 33.33, h: 80 },
      { x: 33.33, y: 0, w: 33.33, h: 100 },
      { x: 66.66, y: 10, w: 33.34, h: 80 },
    ],
  },
];

const CANVAS_SIZE = 1200; // output canvas px

function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ── Draw collage to canvas ── */
function drawCollage(canvas, layout, slots, gap, bgColor, canvasSize) {
  canvas.width  = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  layout.cells.forEach((cell, i) => {
    const img = slots[i]?.imgEl;
    if (!img) return;

    const gapPx = gap;
    const x  = (cell.x  / 100) * canvasSize + (i === 0 ? 0 : gapPx / 2);
    const y  = (cell.y  / 100) * canvasSize + (i === 0 ? 0 : gapPx / 2);
    const w  = (cell.w  / 100) * canvasSize - gapPx;
    const h  = (cell.h  / 100) * canvasSize - gapPx;

    // Proper gap: each cell shrinks inward by half a gap on each touching side
    const cx = (cell.x / 100) * canvasSize + gapPx / 2;
    const cy = (cell.y / 100) * canvasSize + gapPx / 2;
    const cw = (cell.w / 100) * canvasSize - gapPx;
    const ch = (cell.h / 100) * canvasSize - gapPx;

    // cover-fit
    const scale = Math.max(cw / img.width, ch / img.height);
    const sw = img.width  * scale;
    const sh = img.height * scale;
    const sx = cx + (cw - sw) / 2;
    const sy = cy + (ch - sh) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh);
    ctx.restore();
  });
}

/* ── Component ── */
export default function ImageCollageMaker() {
  const [layout,    setLayout]    = useState(LAYOUTS[0]);
  const [slots,     setSlots]     = useState([]); // [{ file, imgEl, preview }]
  const [gap,       setGap]       = useState(8);
  const [bgColor,   setBgColor]   = useState("#ffffff");
  const [outputSize,setOutputSize]= useState(1200);
  const [dragging,  setDragging]  = useState(false);
  const [dragOver,  setDragOver]  = useState(null); // slot index being dragged over
  const [generated, setGenerated] = useState(false);
  const [downloading,setDownloading]=useState(false);

  const canvasRef    = useRef(null);
  const fileInputRef = useRef(null);
  const slotInputRef = useRef(null);
  const activeSlotRef= useRef(null);

  /* ── Load an image file into a slot ── */
  const loadImageFile = (file) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.src = url;
    });
  };

  /* ── Add files to slots in order ── */
  const addFiles = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;

    const newSlots = await Promise.all(valid.map(async (f) => ({
      file:    f,
      imgEl:   await loadImageFile(f),
      preview: URL.createObjectURL(f),
    })));

    setSlots(prev => {
      const merged = [...prev];
      // fill empty slots first, then append
      let ni = 0;
      for (let i = 0; i < layout.cells.length && ni < newSlots.length; i++) {
        if (!merged[i]) { merged[i] = newSlots[ni++]; }
      }
      // append extras beyond current layout slot count (ignored in render)
      while (ni < newSlots.length) { merged.push(newSlots[ni++]); }
      return merged;
    });
    setGenerated(false);
  }, [layout]);

  /* ── Drop zone drag ── */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  /* ── Per-slot file pick ── */
  const pickSlotFile = (idx) => {
    activeSlotRef.current = idx;
    slotInputRef.current?.click();
  };
  const onSlotFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const imgEl   = await loadImageFile(f);
    const preview = URL.createObjectURL(f);
    setSlots(prev => {
      const next = [...prev];
      next[activeSlotRef.current] = { file: f, imgEl, preview };
      return next;
    });
    setGenerated(false);
    e.target.value = "";
  };

  /* ── Slot drag-and-drop reorder ── */
  const dragSrcRef = useRef(null);
  const onSlotDragStart = (i) => { dragSrcRef.current = i; };
  const onSlotDragEnter = (i) => { setDragOver(i); };
  const onSlotDragEnd   = ()  => { setDragOver(null); };
  const onSlotDrop      = (i) => {
    const src = dragSrcRef.current;
    if (src === null || src === i) return;
    setSlots(prev => {
      const next = [...prev];
      [next[src], next[i]] = [next[i], next[src]];
      return next;
    });
    setDragOver(null);
    setGenerated(false);
  };

  /* ── Remove slot ── */
  const removeSlot = (i) => {
    setSlots(prev => {
      const next = [...prev];
      if (next[i]?.preview) URL.revokeObjectURL(next[i].preview);
      next[i] = undefined;
      return next;
    });
    setGenerated(false);
  };

  /* ── Change layout ── */
  const changeLayout = (l) => {
    setLayout(l);
    setGenerated(false);
  };

  /* ── Redraw preview canvas on changes ── */
  useEffect(() => {
    if (!canvasRef.current) return;
    drawCollage(canvasRef.current, layout, slots, gap, bgColor, 600);
  }, [layout, slots, gap, bgColor]);

  /* ── Download ── */
  const handleDownload = async () => {
    setDownloading(true);
    const canvas = document.createElement("canvas");
    drawCollage(canvas, layout, slots, gap * (outputSize / 600), bgColor, outputSize);
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `collage-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setGenerated(true);
      setDownloading(false);
    }, "image/png");
  };

  const filledSlots = layout.cells.filter((_, i) => slots[i]?.imgEl).length;
  const totalSlots  = layout.cells.length;
  const canDownload = filledSlots > 0;

  return (
    <>
      <Helmet>
        <title>Free Image Collage Maker – Create Photo Collages Online | ShauryaTools</title>
        <meta name="description" content="Create beautiful photo collages with multiple layouts. Drag and drop images, adjust gap and background. 100% in-browser, free, private." />
        <meta name="keywords" content="collage maker, photo collage, image collage, free collage maker, online collage, photo grid" />
        <link rel="canonical" href="https://shauryatools.vercel.app/collage-maker" />
      </Helmet>

      <div className="col-page">
        <div className="col-inner">

          {/* ── Header ── */}
          <div className="col-header">
            <div className="col-icon"><LayoutGrid size={20} strokeWidth={2} /></div>
            <div>
              <span className="col-cat">Image Tools</span>
              <h1>Collage Maker</h1>
              <p>Pick a layout, drop your photos, tweak gap & background — download in full resolution.</p>
            </div>
          </div>

          <div className="col-layout-wrapper">

            {/* ── Left: Controls ── */}
            <div className="col-controls">

              {/* Layout picker */}
              <div className="col-card">
                <label className="col-label">
                  <LayoutGrid size={14} strokeWidth={2.5} className="col-label-icon" />
                  Layout
                </label>
                <div className="col-layout-grid">
                  {LAYOUTS.map(l => (
                    <button
                      key={l.id}
                      className={`col-layout-btn ${layout.id === l.id ? "col-layout-on" : ""}`}
                      onClick={() => changeLayout(l)}
                    >
                      {/* Mini preview SVG */}
                      <svg viewBox="0 0 60 60" className="col-layout-svg">
                        {l.cells.map((c, i) => (
                          <rect key={i}
                            x={c.x * 0.6 + 1} y={c.y * 0.6 + 1}
                            width={c.w * 0.6 - 2} height={c.h * 0.6 - 2}
                            rx="2"
                            fill={layout.id === l.id ? "#a7f3d0" : "#e5e5e5"}
                            stroke={layout.id === l.id ? "#059669" : "#d4d4d4"}
                            strokeWidth="1"
                          />
                        ))}
                      </svg>
                      <span className="col-layout-label">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="col-card">
                <label className="col-label">
                  <Settings size={14} strokeWidth={2.5} className="col-label-icon" />
                  Settings
                </label>

                {/* Gap */}
                <div className="col-setting-group">
                  <div className="col-setting-top">
                    <span className="col-setting-label">Gap / Border</span>
                    <span className="col-badge">{gap}px</span>
                  </div>
                  <input type="range" min="0" max="40" step="2"
                    value={gap} onChange={e => { setGap(+e.target.value); setGenerated(false); }}
                    className="col-slider"
                  />
                  <div className="col-slider-hints"><span>None</span><span>Wide</span></div>
                </div>

                {/* Background color */}
                <div className="col-setting-group">
                  <span className="col-setting-label">Background Color</span>
                  <div className="col-color-row">
                    <input type="color" value={bgColor}
                      onChange={e => { setBgColor(e.target.value); setGenerated(false); }}
                      className="col-color-input"
                    />
                    <span className="col-color-hex">{bgColor.toUpperCase()}</span>
                    {["#ffffff","#000000","#f5f5f5","#059669","#1e3a8a","#7c3aed"].map(c => (
                      <button key={c}
                        className={`col-swatch ${bgColor === c ? "col-swatch-on" : ""}`}
                        style={{ background: c }}
                        onClick={() => { setBgColor(c); setGenerated(false); }}
                      />
                    ))}
                  </div>
                </div>

                {/* Output size */}
                <div className="col-setting-group">
                  <span className="col-setting-label">Output Size</span>
                  <div className="col-size-row">
                    {[800, 1200, 2000, 3000].map(s => (
                      <button key={s}
                        className={`col-size-btn ${outputSize === s ? "col-size-on" : ""}`}
                        onClick={() => setOutputSize(s)}
                      >{s}px</button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Upload drop zone */}
              <div
                className={`col-dropzone ${dragging ? "col-dz-active" : ""}`}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/*"
                  multiple className="col-file-input"
                  onChange={e => addFiles(e.target.files)}
                />
                <div className="col-dz-content">
                  <div className="col-dz-icon"><Upload size={22} strokeWidth={1.5} /></div>
                  <p className="col-dz-title">Add photos or <span className="col-dz-link">browse</span></p>
                  <p className="col-dz-sub">Fill {totalSlots} slots · JPG, PNG, WebP</p>
                </div>
              </div>

              {/* Progress & download */}
              <div className="col-card col-footer-card">
                <div className="col-progress-row">
                  <span className="col-progress-label">
                    {filledSlots}/{totalSlots} slots filled
                  </span>
                  <div className="col-progress-bar">
                    <div
                      className="col-progress-fill"
                      style={{ width: `${(filledSlots / totalSlots) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  className="col-download-btn"
                  onClick={handleDownload}
                  disabled={!canDownload || downloading}
                >
                  {downloading ? (
                    <><span className="col-spinner" /> Generating...</>
                  ) : generated ? (
                    <><CheckCircle size={16} strokeWidth={2} /> Downloaded!</>
                  ) : (
                    <><Download size={16} strokeWidth={2} /> Download Collage ({outputSize}px)</>
                  )}
                </button>
              </div>

            </div>

            {/* ── Right: Live canvas preview + slot grid ── */}
            <div className="col-preview-col">

              <div className="col-preview-label">
                <ImageIcon size={13} strokeWidth={2.5} />
                Live Preview
              </div>

              {/* Canvas preview */}
              <div className="col-canvas-wrap">
                <canvas ref={canvasRef} className="col-canvas" />
              </div>

              {/* Slot thumbnails */}
              <div className="col-slots-label">Photo Slots — click to replace, drag to reorder</div>
              <div className="col-slots-grid">
                {layout.cells.map((_, i) => {
                  const slot = slots[i];
                  return (
                    <div
                      key={i}
                      className={`col-slot ${slot ? "col-slot-filled" : "col-slot-empty"} ${dragOver === i ? "col-slot-dragover" : ""}`}
                      draggable={!!slot}
                      onDragStart={() => onSlotDragStart(i)}
                      onDragEnter={() => onSlotDragEnter(i)}
                      onDragEnd={onSlotDragEnd}
                      onDrop={() => onSlotDrop(i)}
                      onDragOver={e => e.preventDefault()}
                      onClick={() => pickSlotFile(i)}
                    >
                      {slot ? (
                        <>
                          <img src={slot.preview} alt="" className="col-slot-img" />
                          <div className="col-slot-num">{i + 1}</div>
                          <button
                            className="col-slot-remove"
                            onClick={e => { e.stopPropagation(); removeSlot(i); }}
                            title="Remove"
                          >
                            <Trash2 size={10} strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <div className="col-slot-add">
                          <Plus size={18} strokeWidth={2} />
                          <span>{i + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <input ref={slotInputRef} type="file" accept="image/*"
                className="col-file-input" onChange={onSlotFileChange}
              />

            </div>
          </div>

          <div className="col-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — images are processed entirely in your browser. Nothing is uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}
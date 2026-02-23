/* eslint-disable no-empty */
import { useState, useRef, useCallback, useEffect } from "react";
import "./WatermarkAdder.css";
import { Helmet } from "react-helmet";
import {
  Stamp,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Settings,
  Type,
  ImageIcon,
  Sliders,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";

/* ── Position grid options ── */
const POSITIONS = [
  { id: "top-left",     label: "↖" },
  { id: "top-center",   label: "↑" },
  { id: "top-right",    label: "↗" },
  { id: "middle-left",  label: "←" },
  { id: "center",       label: "⊙" },
  { id: "middle-right", label: "→" },
  { id: "bottom-left",  label: "↙" },
  { id: "bottom-center",label: "↓" },
  { id: "bottom-right", label: "↘" },
];

/* ── Format file size ── */
function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ── Apply watermark via canvas ── */
function applyWatermark(file, settings) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas  = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const { type, text, font, fontSize, fontColor, opacity,
              position, padding, logoFile, logoScale, tiled } = settings;

      ctx.globalAlpha = opacity / 100;

      const pad = Math.round((padding / 100) * Math.min(img.width, img.height));

      const drawAt = (cx, cy, drawFn) => drawFn(cx, cy);

      const getXY = (ww, wh) => {
        const [vert, horiz] = (() => {
          switch (position) {
            case "top-left":      return ["top",    "left"];
            case "top-center":    return ["top",    "center"];
            case "top-right":     return ["top",    "right"];
            case "middle-left":   return ["middle", "left"];
            case "center":        return ["middle", "center"];
            case "middle-right":  return ["middle", "right"];
            case "bottom-left":   return ["bottom", "left"];
            case "bottom-center": return ["bottom", "center"];
            case "bottom-right":  return ["bottom", "right"];
            default:              return ["bottom", "right"];
          }
        })();
        const x = horiz === "left"   ? pad + ww / 2
                : horiz === "center" ? img.width / 2
                :                      img.width - pad - ww / 2;
        const y = vert === "top"    ? pad + wh / 2
                : vert === "middle" ? img.height / 2
                :                     img.height - pad - wh / 2;
        return { x, y };
      };

      const finish = () => {
        ctx.globalAlpha = 1;
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Watermark failed")); return; }
            resolve({ blob, width: img.width, height: img.height });
          },
          "image/png"
        );
      };

      if (type === "text") {
        const scaledSize = Math.round((fontSize / 100) * Math.min(img.width, img.height) * 0.18);
        ctx.font      = `bold ${scaledSize}px ${font}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";

        if (tiled) {
          const metrics = ctx.measureText(text);
          const tw = metrics.width + scaledSize * 2;
          const th = scaledSize * 3;
          ctx.globalAlpha = (opacity / 100) * 0.35;
          for (let y = -th; y < img.height + th; y += th) {
            for (let x = -tw; x < img.width + tw; x += tw) {
              ctx.save();
              ctx.translate(x + tw / 2, y + th / 2);
              ctx.rotate(-Math.PI / 6);
              ctx.fillText(text, 0, 0);
              ctx.restore();
            }
          }
        } else {
          const metrics  = ctx.measureText(text);
          const { x, y } = getXY(metrics.width, scaledSize);
          ctx.fillText(text, x, y);
        }
        finish();

      } else if (type === "logo" && logoFile) {
        const logoImg = new Image();
        const logoUrl = URL.createObjectURL(logoFile);
        logoImg.onload = () => {
          URL.revokeObjectURL(logoUrl);
          const maxLogoW = img.width  * (logoScale / 100);
          const maxLogoH = img.height * (logoScale / 100);
          const ratio    = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height);
          const lw = logoImg.width  * ratio;
          const lh = logoImg.height * ratio;

          if (tiled) {
            const gap = lw * 0.6;
            ctx.globalAlpha = (opacity / 100) * 0.45;
            for (let y = -lh; y < img.height + lh; y += lh + gap) {
              for (let x = -lw; x < img.width + lw; x += lw + gap) {
                ctx.drawImage(logoImg, x, y, lw, lh);
              }
            }
          } else {
            const { x, y } = getXY(lw, lh);
            ctx.drawImage(logoImg, x - lw / 2, y - lh / 2, lw, lh);
          }
          finish();
        };
        logoImg.onerror = () => reject(new Error("Failed to load logo"));
        logoImg.src = logoUrl;
      } else {
        finish();
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/* ── Component ── */
export default function WatermarkAdder() {
  const [files,      setFiles]      = useState([]);
  const [wmType,     setWmType]     = useState("text");      // "text" | "logo"
  const [text,       setText]       = useState("© ShauryaTools");
  const [font,       setFont]       = useState("Arial");
  const [fontSize,   setFontSize]   = useState(40);
  const [fontColor,  setFontColor]  = useState("#ffffff");
  const [opacity,    setOpacity]    = useState(70);
  const [position,   setPosition]   = useState("bottom-right");
  const [padding,    setPadding]    = useState(30);
  const [logoFile,   setLogoFile]   = useState(null);
  const [logoPreview,setLogoPreview]= useState(null);
  const [logoScale,  setLogoScale]  = useState(20);
  const [tiled,      setTiled]      = useState(false);
  const [dragging,   setDragging]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const FONTS = ["Arial", "Georgia", "Impact", "Verdana", "Times New Roman", "Courier New", "Trebuchet MS"];

  useEffect(() => {
    return () => { if (logoPreview) URL.revokeObjectURL(logoPreview); };
  }, [logoPreview]);

  /* ── Add image files ── */
  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter(f =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    if (!valid.length) return;
    const entries = valid.map(f => ({
      id:         Math.random().toString(36).slice(2),
      file:       f,
      original:   { size: f.size, name: f.name, type: f.type },
      preview:    URL.createObjectURL(f),
      watermarked: null,
      status:     "idle",
      error:      null,
    }));
    setFiles(prev => [...prev, ...entries]);
  }, []);

  /* ── Logo file pick ── */
  const handleLogoFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  /* drag */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  /* ── Build settings object ── */
  const buildSettings = () => ({
    type: wmType, text, font, fontSize, fontColor,
    opacity, position, padding, logoFile, logoScale, tiled,
  });

  /* ── Apply watermark to all ── */
  const handleApplyAll = async () => {
    if (!files.length || processing) return;
    if (wmType === "logo" && !logoFile) return;
    setProcessing(true);
    const settings = buildSettings();
    const updated  = [...files];

    for (let i = 0; i < updated.length; i++) {
      const entry = updated[i];
      if (entry.status === "done") continue;
      updated[i] = { ...entry, status: "processing" };
      setFiles([...updated]);
      try {
        const { blob, width, height } = await applyWatermark(entry.file, settings);
        const wUrl     = URL.createObjectURL(blob);
        const baseName = entry.original.name.replace(/\.[^.]+$/, "");
        updated[i] = {
          ...entry,
          status: "done",
          watermarked: {
            blob, url: wUrl, size: blob.size, width, height,
            fileName: `${baseName}-watermarked.png`,
          },
        };
      } catch (err) {
        updated[i] = { ...entry, status: "error", error: err.message };
      }
      setFiles([...updated]);
    }
    setProcessing(false);
  };

  /* ── Download ── */
  const downloadFile = (entry) => {
    if (!entry.watermarked) return;
    const a = document.createElement("a");
    a.href     = entry.watermarked.url;
    a.download = entry.watermarked.fileName;
    a.click();
  };
  const downloadAll = () => files.filter(f => f.status === "done").forEach(downloadFile);

  /* ── Remove / Reset ── */
  const removeFile = (id) => {
    setFiles(prev => {
      const e = prev.find(f => f.id === id);
      if (e?.preview)          URL.revokeObjectURL(e.preview);
      if (e?.watermarked?.url) URL.revokeObjectURL(e.watermarked.url);
      return prev.filter(f => f.id !== id);
    });
  };
  const resetAll = () => {
    files.forEach(f => {
      if (f.preview)          URL.revokeObjectURL(f.preview);
      if (f.watermarked?.url) URL.revokeObjectURL(f.watermarked.url);
    });
    setFiles([]);
  };

  /* reset done files when settings change */
  const resetDone = () =>
    setFiles(prev => prev.map(f =>
      f.status === "done" ? { ...f, status: "idle", watermarked: null } : f
    ));

  const doneCount    = files.filter(f => f.status === "done").length;
  const pendingCount = files.filter(f => f.status === "idle").length;

  return (
    <>
      <Helmet>
        <title>Free Watermark Adder – Add Text & Logo Watermarks Online | ShauryaTools</title>
        <meta name="description" content="Add text or logo watermarks to images with adjustable opacity, position and tiling. 100% in-browser, free, private." />
        <meta name="keywords" content="watermark adder, add watermark to image, text watermark, logo watermark, image watermark online, free watermark tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/watermark-adder" />
      </Helmet>

      <div className="wm-page">
        <div className="wm-inner">

          {/* ── Header ── */}
          <div className="wm-header">
            <div className="wm-icon">
              <Stamp size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="wm-cat">Image Tools</span>
              <h1>Watermark Adder</h1>
              <p>Add text or logo watermarks with custom opacity, position & tiling — 100% in your browser.</p>
            </div>
          </div>

          {/* ── Settings Card ── */}
          <div className="wm-card">
            <div className="wm-field">
              <label className="wm-label">
                <Settings size={14} strokeWidth={2.5} className="wm-label-icon" />
                Watermark Settings
              </label>

              {/* Type toggle */}
              <div className="wm-type-row">
                <button
                  className={`wm-type-btn ${wmType === "text" ? "wm-type-on" : ""}`}
                  onClick={() => { setWmType("text"); resetDone(); }}
                >
                  <Type size={14} strokeWidth={2.5} />
                  Text Watermark
                </button>
                <button
                  className={`wm-type-btn ${wmType === "logo" ? "wm-type-on" : ""}`}
                  onClick={() => { setWmType("logo"); resetDone(); }}
                >
                  <ImageIcon size={14} strokeWidth={2.5} />
                  Logo Watermark
                </button>
              </div>

              <div className="wm-divider" />

              {/* Text settings */}
              {wmType === "text" && (
                <div className="wm-settings-grid">

                  <div className="wm-setting-group wm-col-span-2">
                    <span className="wm-setting-label">Watermark Text</span>
                    <input
                      type="text"
                      value={text}
                      onChange={e => { setText(e.target.value); resetDone(); }}
                      className="wm-text-input"
                      placeholder="Enter watermark text..."
                      maxLength={80}
                    />
                  </div>

                  <div className="wm-setting-group">
                    <span className="wm-setting-label">Font</span>
                    <select
                      className="wm-select"
                      value={font}
                      onChange={e => { setFont(e.target.value); resetDone(); }}
                    >
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  <div className="wm-setting-group">
                    <div className="wm-setting-top">
                      <span className="wm-setting-label">Font Size</span>
                      <span className="wm-badge">{fontSize}%</span>
                    </div>
                    <input type="range" min="10" max="100" step="5"
                      value={fontSize}
                      onChange={e => { setFontSize(+e.target.value); resetDone(); }}
                      className="wm-slider"
                    />
                    <div className="wm-slider-hints"><span>Small</span><span>Large</span></div>
                  </div>

                  <div className="wm-setting-group">
                    <span className="wm-setting-label">Font Color</span>
                    <div className="wm-color-row">
                      <input
                        type="color"
                        value={fontColor}
                        onChange={e => { setFontColor(e.target.value); resetDone(); }}
                        className="wm-color-input"
                      />
                      <span className="wm-color-label">{fontColor.toUpperCase()}</span>
                      {["#ffffff","#000000","#ff0000","#ffff00","#059669"].map(c => (
                        <button
                          key={c}
                          className={`wm-color-swatch ${fontColor === c ? "wm-swatch-on" : ""}`}
                          style={{ background: c }}
                          onClick={() => { setFontColor(c); resetDone(); }}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Logo settings */}
              {wmType === "logo" && (
                <div className="wm-settings-grid">

                  <div className="wm-setting-group wm-col-span-2">
                    <span className="wm-setting-label">Logo Image</span>
                    <div
                      className="wm-logo-drop"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="wm-file-input"
                        onChange={e => { handleLogoFile(e.target.files[0]); resetDone(); }}
                      />
                      {logoPreview ? (
                        <div className="wm-logo-preview-wrap">
                          <img src={logoPreview} alt="Logo" className="wm-logo-preview" />
                          <span className="wm-logo-name">{logoFile?.name}</span>
                        </div>
                      ) : (
                        <div className="wm-logo-placeholder">
                          <Upload size={18} strokeWidth={1.5} />
                          <span>Click to upload logo (PNG with transparency recommended)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="wm-setting-group">
                    <div className="wm-setting-top">
                      <span className="wm-setting-label">Logo Size</span>
                      <span className="wm-badge">{logoScale}%</span>
                    </div>
                    <input type="range" min="5" max="60" step="5"
                      value={logoScale}
                      onChange={e => { setLogoScale(+e.target.value); resetDone(); }}
                      className="wm-slider"
                    />
                    <div className="wm-slider-hints"><span>Tiny</span><span>Large</span></div>
                  </div>

                </div>
              )}

              <div className="wm-divider" />

              {/* Shared settings row */}
              <div className="wm-settings-grid">

                {/* Opacity */}
                <div className="wm-setting-group">
                  <div className="wm-setting-top">
                    <span className="wm-setting-label">
                      <Sliders size={11} strokeWidth={2.5} />
                      Opacity
                    </span>
                    <span className="wm-badge">{opacity}%</span>
                  </div>
                  <input type="range" min="5" max="100" step="5"
                    value={opacity}
                    onChange={e => { setOpacity(+e.target.value); resetDone(); }}
                    className="wm-slider"
                  />
                  <div className="wm-slider-hints"><span>Subtle</span><span>Solid</span></div>
                </div>

                {/* Padding */}
                <div className="wm-setting-group">
                  <div className="wm-setting-top">
                    <span className="wm-setting-label">Padding</span>
                    <span className="wm-badge">{padding}%</span>
                  </div>
                  <input type="range" min="0" max="80" step="5"
                    value={padding}
                    onChange={e => { setPadding(+e.target.value); resetDone(); }}
                    className="wm-slider"
                  />
                  <div className="wm-slider-hints"><span>Edge</span><span>Center</span></div>
                </div>

                {/* Tiled toggle */}
                <div className="wm-setting-group">
                  <span className="wm-setting-label">
                    <LayoutGrid size={11} strokeWidth={2.5} />
                    Repeat / Tile
                  </span>
                  <div className="wm-tile-row">
                    <button
                      className={`wm-tile-btn ${!tiled ? "wm-tile-on" : ""}`}
                      onClick={() => { setTiled(false); resetDone(); }}
                    >Single</button>
                    <button
                      className={`wm-tile-btn ${tiled ? "wm-tile-on" : ""}`}
                      onClick={() => { setTiled(true); resetDone(); }}
                    >Tiled</button>
                  </div>
                  <p className="wm-hint">
                    {tiled ? "Watermark repeats across the whole image" : "Single watermark at selected position"}
                  </p>
                </div>

              </div>

              {/* Position grid (only when not tiled) */}
              {!tiled && (
                <>
                  <div className="wm-divider" />
                  <div className="wm-setting-group">
                    <span className="wm-setting-label">Position</span>
                    <div className="wm-position-grid">
                      {POSITIONS.map(p => (
                        <button
                          key={p.id}
                          className={`wm-pos-btn ${position === p.id ? "wm-pos-on" : ""}`}
                          onClick={() => { setPosition(p.id); resetDone(); }}
                          title={p.id.replace(/-/g, " ")}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* ── Drop Zone ── */}
          <div
            className={`wm-dropzone ${dragging ? "wm-dz-active" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="wm-file-input"
              onChange={e => addFiles(e.target.files)}
            />
            <div className="wm-dz-content">
              <div className="wm-dz-icon">
                <Upload size={28} strokeWidth={1.5} />
              </div>
              <p className="wm-dz-title">Drop images here or <span className="wm-dz-link">browse files</span></p>
              <p className="wm-dz-sub">Supports JPG, PNG, WebP · Multiple files at once</p>
            </div>
          </div>

          {/* ── File List ── */}
          {files.length > 0 && (
            <div className="wm-card animate-in">

              <div className="wm-summary-bar">
                <div className="wm-summary-left">
                  <span className="wm-summary-count">{files.length} image{files.length > 1 ? "s" : ""}</span>
                  {doneCount > 0 && (
                    <span className="wm-summary-done">
                      <CheckCircle size={12} strokeWidth={2.5} />
                      {doneCount} watermarked
                    </span>
                  )}
                </div>
                <div className="wm-summary-actions">
                  {doneCount > 0 && (
                    <button className="wm-action-btn wm-btn-dl-all" onClick={downloadAll}>
                      <Download size={13} strokeWidth={2.5} />
                      Download All ({doneCount})
                    </button>
                  )}
                  <button className="wm-action-btn" onClick={resetAll}>
                    <Trash2 size={13} strokeWidth={2.5} />
                    Clear All
                  </button>
                </div>
              </div>

              <div className="wm-divider" />

              <div className="wm-file-list">
                {files.map(entry => (
                  <div key={entry.id} className={`wm-file-row wm-row-${entry.status}`}>

                    <div className="wm-thumb-wrap">
                      <img
                        src={entry.status === "done" ? entry.watermarked.url : entry.preview}
                        alt={entry.original.name}
                        className="wm-thumb"
                      />
                    </div>

                    <div className="wm-file-info">
                      <p className="wm-file-name">{entry.original.name}</p>
                      <div className="wm-file-meta">
                        <span className="wm-size-original">{fmtSize(entry.original.size)}</span>
                        {entry.status === "done" && (
                          <>
                            <ArrowRight size={12} strokeWidth={2.5} className="wm-arrow" />
                            <span className="wm-size-done">{fmtSize(entry.watermarked.size)}</span>
                            <span className="wm-done-badge">
                              <CheckCircle size={10} strokeWidth={2.5} />
                              Watermarked
                            </span>
                          </>
                        )}
                      </div>
                      {entry.status === "error" && (
                        <p className="wm-file-error">
                          <AlertCircle size={12} strokeWidth={2.5} />
                          {entry.error}
                        </p>
                      )}
                    </div>

                    <div className="wm-file-actions">
                      {entry.status === "idle" && (
                        <span className="wm-status-pill wm-status-idle">Queued</span>
                      )}
                      {entry.status === "processing" && (
                        <span className="wm-status-pill wm-status-processing">
                          <span className="wm-mini-spinner" />
                          Applying...
                        </span>
                      )}
                      {entry.status === "done" && (
                        <button className="wm-dl-btn" onClick={() => downloadFile(entry)}>
                          <Download size={13} strokeWidth={2.5} />
                          Save
                        </button>
                      )}
                      {entry.status === "error" && (
                        <span className="wm-status-pill wm-status-error">Failed</span>
                      )}
                      <button className="wm-remove-btn" onClick={() => removeFile(entry.id)}>
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              <div className="wm-divider" />

              <button
                className="wm-apply-btn"
                onClick={handleApplyAll}
                disabled={processing || pendingCount === 0 || (wmType === "logo" && !logoFile)}
              >
                {processing ? (
                  <><span className="wm-spinner" /> Applying Watermark...</>
                ) : pendingCount === 0 ? (
                  <><CheckCircle size={16} strokeWidth={2} /> All Done!</>
                ) : (
                  <><Stamp size={16} strokeWidth={2} /> Apply Watermark to {pendingCount} Image{pendingCount !== 1 ? "s" : ""}</>
                )}
              </button>

              {wmType === "logo" && !logoFile && (
                <p className="wm-warn">⚠ Please upload a logo image before applying.</p>
              )}

            </div>
          )}

          <div className="wm-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — images are processed entirely in your browser. Nothing is uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}
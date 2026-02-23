/* eslint-disable no-empty */
import { useState, useRef, useCallback } from "react";
import "./ImageResizer.css";
import { Helmet } from "react-helmet";
import {
  Maximize2,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings,
  Lock,
  Unlock,
  LayoutGrid,
  FileImage,
} from "lucide-react";

/* ── Presets ── */
const PRESETS = [
  { label: "Custom",              w: null,  h: null  },
  { label: "Instagram Post",      w: 1080,  h: 1080  },
  { label: "Instagram Story",     w: 1080,  h: 1920  },
  { label: "Instagram Landscape", w: 1080,  h: 566   },
  { label: "YouTube Thumbnail",   w: 1280,  h: 720   },
  { label: "YouTube Banner",      w: 2560,  h: 1440  },
  { label: "Twitter Post",        w: 1200,  h: 675   },
  { label: "Twitter Header",      w: 1500,  h: 500   },
  { label: "Facebook Post",       w: 1200,  h: 630   },
  { label: "Facebook Cover",      w: 851,   h: 315   },
  { label: "LinkedIn Banner",     w: 1584,  h: 396   },
  { label: "OG / Share Image",    w: 1200,  h: 630   },
  { label: "HD (1280×720)",       w: 1280,  h: 720   },
  { label: "Full HD (1920×1080)", w: 1920,  h: 1080  },
  { label: "4K (3840×2160)",      w: 3840,  h: 2160  },
];

/* ── Format file size ── */
function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ── Resize via canvas ── */
function resizeImage(file, targetW, targetH, outputFormat, fit) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const srcW = img.width;
      const srcH = img.height;

      let dstW = targetW;
      let dstH = targetH;

      if (fit === "contain") {
        const ratio = Math.min(targetW / srcW, targetH / srcH);
        dstW = Math.round(srcW * ratio);
        dstH = Math.round(srcH * ratio);
      } else if (fit === "stretch") {
        dstW = targetW;
        dstH = targetH;
      } else {
        // cover — crop to fill
        dstW = targetW;
        dstH = targetH;
      }

      const canvas = document.createElement("canvas");
      canvas.width  = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext("2d");

      if (fit === "cover") {
        const ratio = Math.max(targetW / srcW, targetH / srcH);
        const scaledW = Math.round(srcW * ratio);
        const scaledH = Math.round(srcH * ratio);
        const sx = Math.round((scaledW - targetW) / 2);
        const sy = Math.round((scaledH - targetH) / 2);
        ctx.drawImage(img, -sx, -sy, scaledW, scaledH);
      } else {
        ctx.drawImage(img, 0, 0, dstW, dstH);
      }

      const mime = outputFormat === "png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Resize failed")); return; }
          resolve({ blob, width: dstW, height: dstH });
        },
        mime,
        outputFormat === "png" ? undefined : 0.92
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/* ── Component ── */
export default function ImageResizer() {
  const [files,      setFiles]      = useState([]);
  const [preset,     setPreset]     = useState(PRESETS[0]);
  const [customW,    setCustomW]    = useState(1080);
  const [customH,    setCustomH]    = useState(1080);
  const [lockRatio,  setLockRatio]  = useState(true);
  const [outputFmt,  setOutputFmt]  = useState("jpeg");
  const [fit,        setFit]        = useState("contain");
  const [dragging,   setDragging]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  /* derive final target dims */
  const targetW = preset.w ?? customW;
  const targetH = preset.h ?? customH;

  /* ── handle width/height changes with aspect lock ── */
  const handleCustomW = (val) => {
    const n = Math.max(1, +val);
    if (lockRatio && customW) {
      setCustomH(Math.round(n * (customH / customW)));
    }
    setCustomW(n);
  };
  const handleCustomH = (val) => {
    const n = Math.max(1, +val);
    if (lockRatio && customH) {
      setCustomW(Math.round(n * (customW / customH)));
    }
    setCustomH(n);
  };

  /* ── apply preset ── */
  const applyPreset = (p) => {
    setPreset(p);
    if (p.w) setCustomW(p.w);
    if (p.h) setCustomH(p.h);
  };

  /* ── Add files ── */
  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter(f =>
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
    );
    if (!valid.length) return;
    const entries = valid.map(f => ({
      id:      Math.random().toString(36).slice(2),
      file:    f,
      original: { size: f.size, name: f.name, type: f.type },
      preview: URL.createObjectURL(f),
      resized: null,
      status:  "idle",
      error:   null,
    }));
    setFiles(prev => [...prev, ...entries]);
  }, []);

  /* drag */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  /* ── Resize all ── */
  const handleResizeAll = async () => {
    if (!files.length || processing) return;
    setProcessing(true);
    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      const entry = updated[i];
      if (entry.status === "done") continue;
      updated[i] = { ...entry, status: "processing" };
      setFiles([...updated]);
      try {
        const { blob, width, height } = await resizeImage(
          entry.file, targetW, targetH, outputFmt, fit
        );
        const resizedUrl = URL.createObjectURL(blob);
        const ext = outputFmt === "png" ? "png" : "jpg";
        const baseName = entry.original.name.replace(/\.[^.]+$/, "");
        updated[i] = {
          ...entry,
          status: "done",
          resized: {
            blob,
            url:      resizedUrl,
            size:     blob.size,
            width,
            height,
            fileName: `${baseName}-${width}x${height}.${ext}`,
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
    if (!entry.resized) return;
    const a = document.createElement("a");
    a.href = entry.resized.url;
    a.download = entry.resized.fileName;
    a.click();
  };
  const downloadAll = () => files.filter(f => f.status === "done").forEach(downloadFile);

  /* ── Remove / Reset ── */
  const removeFile = (id) => {
    setFiles(prev => {
      const entry = prev.find(f => f.id === id);
      if (entry?.preview)       URL.revokeObjectURL(entry.preview);
      if (entry?.resized?.url)  URL.revokeObjectURL(entry.resized.url);
      return prev.filter(f => f.id !== id);
    });
  };
  const resetAll = () => {
    files.forEach(f => {
      if (f.preview)      URL.revokeObjectURL(f.preview);
      if (f.resized?.url) URL.revokeObjectURL(f.resized.url);
    });
    setFiles([]);
  };

  const doneCount = files.filter(f => f.status === "done").length;

  return (
    <>
      <Helmet>
        <title>Free Image Resizer – Resize JPG, PNG & WebP Online | ShauryaTools</title>
        <meta name="description" content="Resize images to exact dimensions or use presets like Instagram, YouTube, Twitter and more. 100% in-browser, private, free." />
        <meta name="keywords" content="image resizer, resize image online, image dimensions, instagram size, youtube thumbnail size, png resizer, jpg resizer" />
        <link rel="canonical" href="https://shauryatools.vercel.app/image-resizer" />
      </Helmet>

      <div className="ir-page">
        <div className="ir-inner">

          {/* ── Header ── */}
          <div className="ir-header">
            <div className="ir-icon">
              <Maximize2 size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="ir-cat">Image Tools</span>
              <h1>Image Resizer</h1>
              <p>Resize to exact dimensions or pick a preset — Instagram, YouTube, Twitter & more. 100% in-browser.</p>
            </div>
          </div>

          {/* ── Settings Card ── */}
          <div className="ir-card">
            <div className="ir-field">
              <label className="ir-label">
                <Settings size={14} strokeWidth={2.5} className="ir-label-icon" />
                Resize Settings
              </label>

              {/* Preset picker */}
              <div className="ir-setting-group">
                <span className="ir-setting-label">
                  <LayoutGrid size={12} strokeWidth={2.5} />
                  Preset
                </span>
                <div className="ir-preset-grid">
                  {PRESETS.map(p => (
                    <button
                      key={p.label}
                      className={`ir-preset-btn ${preset.label === p.label ? "ir-preset-on" : ""}`}
                      onClick={() => applyPreset(p)}
                    >
                      {p.label}
                      {p.w && <span className="ir-preset-dim">{p.w}×{p.h}</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ir-divider" />

              <div className="ir-settings-grid">

                {/* Custom dimensions */}
                <div className="ir-setting-group">
                  <div className="ir-setting-top">
                    <span className="ir-setting-label">Dimensions</span>
                    <button
                      className={`ir-lock-btn ${lockRatio ? "ir-lock-on" : ""}`}
                      onClick={() => setLockRatio(r => !r)}
                      title={lockRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                    >
                      {lockRatio
                        ? <Lock size={11} strokeWidth={2.5} />
                        : <Unlock size={11} strokeWidth={2.5} />}
                      {lockRatio ? "Locked" : "Free"}
                    </button>
                  </div>
                  <div className="ir-dim-row">
                    <div className="ir-dim-input-wrap">
                      <input
                        type="number" min="1" max="8000" step="1"
                        value={preset.w ?? customW}
                        disabled={!!preset.w}
                        onChange={e => handleCustomW(e.target.value)}
                        className="ir-dim-input"
                        placeholder="Width"
                      />
                      <span className="ir-dim-unit">W</span>
                    </div>
                    <span className="ir-dim-x">×</span>
                    <div className="ir-dim-input-wrap">
                      <input
                        type="number" min="1" max="8000" step="1"
                        value={preset.h ?? customH}
                        disabled={!!preset.h}
                        onChange={e => handleCustomH(e.target.value)}
                        className="ir-dim-input"
                        placeholder="Height"
                      />
                      <span className="ir-dim-unit">H</span>
                    </div>
                  </div>
                  {preset.w
                    ? <p className="ir-dim-hint">Using preset dimensions — select "Custom" to edit</p>
                    : <p className="ir-dim-hint">Enter exact pixel dimensions for your output image</p>
                  }
                </div>

                {/* Fit mode */}
                <div className="ir-setting-group">
                  <span className="ir-setting-label">Fit Mode</span>
                  <div className="ir-fmt-row ir-fmt-col">
                    {[
                      { val: "contain", desc: "Scale to fit, no crop" },
                      { val: "cover",   desc: "Fill & crop center" },
                      { val: "stretch", desc: "Stretch to exact size" },
                    ].map(f => (
                      <button
                        key={f.val}
                        className={`ir-fit-btn ${fit === f.val ? "ir-fmt-on" : ""}`}
                        onClick={() => setFit(f.val)}
                      >
                        <span className="ir-fit-label">{f.val.charAt(0).toUpperCase() + f.val.slice(1)}</span>
                        <span className="ir-fit-desc">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output format */}
                <div className="ir-setting-group">
                  <span className="ir-setting-label">Output Format</span>
                  <div className="ir-fmt-row">
                    {["jpeg", "png"].map(f => (
                      <button
                        key={f}
                        className={`ir-fmt-btn ${outputFmt === f ? "ir-fmt-on" : ""}`}
                        onClick={() => setOutputFmt(f)}
                      >
                        <FileImage size={14} strokeWidth={2} />
                        <span>{f.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                  <p className="ir-dim-hint">
                    {outputFmt === "jpeg"
                      ? "JPEG: best for photos, smaller files"
                      : "PNG: lossless, supports transparency"}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ── Drop Zone ── */}
          <div
            className={`ir-dropzone ${dragging ? "ir-dz-active" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="ir-file-input"
              onChange={e => addFiles(e.target.files)}
            />
            <div className="ir-dz-content">
              <div className="ir-dz-icon">
                <Upload size={28} strokeWidth={1.5} />
              </div>
              <p className="ir-dz-title">Drop images here or <span className="ir-dz-link">browse files</span></p>
              <p className="ir-dz-sub">Supports JPG, PNG, WebP, GIF · Multiple files at once</p>
            </div>
          </div>

          {/* ── File List ── */}
          {files.length > 0 && (
            <div className="ir-card animate-in">

              {/* Summary bar */}
              <div className="ir-summary-bar">
                <div className="ir-summary-left">
                  <span className="ir-summary-count">{files.length} image{files.length > 1 ? "s" : ""}</span>
                  {doneCount > 0 && (
                    <span className="ir-summary-saved">
                      <CheckCircle size={12} strokeWidth={2.5} />
                      {doneCount} resized to {targetW}×{targetH}px
                    </span>
                  )}
                </div>
                <div className="ir-summary-actions">
                  {doneCount > 0 && (
                    <button className="ir-action-btn ir-btn-dl-all" onClick={downloadAll}>
                      <Download size={13} strokeWidth={2.5} />
                      Download All ({doneCount})
                    </button>
                  )}
                  <button className="ir-action-btn" onClick={resetAll}>
                    <Trash2 size={13} strokeWidth={2.5} />
                    Clear All
                  </button>
                </div>
              </div>

              <div className="ir-divider" />

              {/* File rows */}
              <div className="ir-file-list">
                {files.map(entry => (
                  <div key={entry.id} className={`ir-file-row ir-row-${entry.status}`}>

                    {/* Preview */}
                    <div className="ir-thumb-wrap">
                      {entry.status === "done"
                        ? <img src={entry.resized.url} alt={entry.original.name} className="ir-thumb" />
                        : <img src={entry.preview}     alt={entry.original.name} className="ir-thumb" />
                      }
                    </div>

                    {/* Info */}
                    <div className="ir-file-info">
                      <p className="ir-file-name">{entry.original.name}</p>
                      <div className="ir-file-sizes">
                        <span className="ir-size-original">{fmtSize(entry.original.size)}</span>
                        {entry.status === "done" && (
                          <>
                            <ArrowRight size={12} strokeWidth={2.5} className="ir-arrow" />
                            <span className="ir-size-resized">{fmtSize(entry.resized.size)}</span>
                            <span className="ir-dim-badge">{entry.resized.width} × {entry.resized.height}px</span>
                          </>
                        )}
                      </div>
                      {entry.status === "error" && (
                        <p className="ir-file-error">
                          <AlertCircle size={12} strokeWidth={2.5} />
                          {entry.error}
                        </p>
                      )}
                    </div>

                    {/* Status / Actions */}
                    <div className="ir-file-actions">
                      {entry.status === "idle" && (
                        <span className="ir-status-pill ir-status-idle">Queued</span>
                      )}
                      {entry.status === "processing" && (
                        <span className="ir-status-pill ir-status-processing">
                          <span className="ir-mini-spinner" />
                          Resizing...
                        </span>
                      )}
                      {entry.status === "done" && (
                        <button className="ir-dl-btn" onClick={() => downloadFile(entry)}>
                          <Download size={13} strokeWidth={2.5} />
                          Save
                        </button>
                      )}
                      {entry.status === "error" && (
                        <span className="ir-status-pill ir-status-error">Failed</span>
                      )}
                      <button className="ir-remove-btn" onClick={() => removeFile(entry.id)} title="Remove">
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              <div className="ir-divider" />

              {/* Resize button */}
              <button
                className="ir-resize-btn"
                onClick={handleResizeAll}
                disabled={processing || files.every(f => f.status === "done")}
              >
                {processing ? (
                  <><span className="ir-spinner" /> Resizing...</>
                ) : files.every(f => f.status === "done") ? (
                  <><CheckCircle size={16} strokeWidth={2} /> All Done!</>
                ) : (
                  <><Maximize2 size={16} strokeWidth={2} /> Resize {files.filter(f => f.status !== "done").length} Image{files.filter(f => f.status !== "done").length > 1 ? "s" : ""} to {targetW}×{targetH}px</>
                )}
              </button>
            </div>
          )}

          {/* ── Privacy note ── */}
          <div className="ir-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — images are processed entirely in your browser. Nothing is uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}
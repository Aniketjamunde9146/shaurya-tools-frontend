/* eslint-disable no-empty */
import { useState, useRef, useCallback } from "react";
import "./ImageCompressor.css";
import { Helmet } from "react-helmet";
import {
  ImageIcon,
  Upload,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  FileImage,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings,
} from "lucide-react";

/* ── Format file size ── */
function fmtSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ── Compress via canvas ── */
function compressImage(file, quality, maxWidth, maxHeight, outputFormat) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const mime = outputFormat === "png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          resolve({ blob, width, height });
        },
        mime,
        outputFormat === "png" ? undefined : quality / 100
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/* ── Component ── */
export default function ImageCompressor() {
  const [files,       setFiles]       = useState([]); // { id, file, original, compressed, status, error }
  const [quality,     setQuality]     = useState(80);
  const [maxWidth,    setMaxWidth]    = useState(1920);
  const [maxHeight,   setMaxHeight]   = useState(1080);
  const [outputFmt,   setOutputFmt]   = useState("jpeg");
  const [dragging,    setDragging]    = useState(false);
  const [processing,  setProcessing]  = useState(false);
  const fileInputRef  = useRef(null);

  /* ── Add files ── */
  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter(f =>
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
    );
    if (!valid.length) return;

    const entries = valid.map(f => ({
      id:         Math.random().toString(36).slice(2),
      file:       f,
      original:   { size: f.size, name: f.name, type: f.type },
      preview:    URL.createObjectURL(f),
      compressed: null,
      status:     "idle", // idle | processing | done | error
      error:      null,
    }));
    setFiles(prev => [...prev, ...entries]);
  }, []);

  /* ── Drag handlers ── */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  /* ── Compress all ── */
  const handleCompressAll = async () => {
    if (!files.length || processing) return;
    setProcessing(true);

    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      const entry = updated[i];
      if (entry.status === "done") continue;
      updated[i] = { ...entry, status: "processing" };
      setFiles([...updated]);

      try {
        const { blob, width, height } = await compressImage(
          entry.file, quality, maxWidth, maxHeight, outputFmt
        );
        const compressedUrl = URL.createObjectURL(blob);
        const ext = outputFmt === "png" ? "png" : "jpg";
        const baseName = entry.original.name.replace(/\.[^.]+$/, "");
        updated[i] = {
          ...entry,
          status: "done",
          compressed: {
            blob,
            url:      compressedUrl,
            size:     blob.size,
            width,
            height,
            fileName: `${baseName}-compressed.${ext}`,
            saving:   Math.round((1 - blob.size / entry.original.size) * 100),
          },
        };
      } catch (err) {
        updated[i] = { ...entry, status: "error", error: err.message };
      }
      setFiles([...updated]);
    }
    setProcessing(false);
  };

  /* ── Download single ── */
  const downloadFile = (entry) => {
    if (!entry.compressed) return;
    const a = document.createElement("a");
    a.href     = entry.compressed.url;
    a.download = entry.compressed.fileName;
    a.click();
  };

  /* ── Download all ── */
  const downloadAll = () => {
    files.filter(f => f.status === "done").forEach(f => downloadFile(f));
  };

  /* ── Remove file ── */
  const removeFile = (id) => {
    setFiles(prev => {
      const entry = prev.find(f => f.id === id);
      if (entry?.preview)          URL.revokeObjectURL(entry.preview);
      if (entry?.compressed?.url)  URL.revokeObjectURL(entry.compressed.url);
      return prev.filter(f => f.id !== id);
    });
  };

  /* ── Reset all ── */
  const resetAll = () => {
    files.forEach(f => {
      if (f.preview)         URL.revokeObjectURL(f.preview);
      if (f.compressed?.url) URL.revokeObjectURL(f.compressed.url);
    });
    setFiles([]);
  };

  const doneCount = files.filter(f => f.status === "done").length;
  const totalSaved = files
    .filter(f => f.status === "done")
    .reduce((acc, f) => acc + (f.original.size - f.compressed.size), 0);

  return (
    <>
      <Helmet>
        <title>Free Image Compressor – Compress JPG, PNG & WebP Online | ShauryaTools</title>
        <meta name="description" content="Compress and resize images instantly in your browser. Supports JPG, PNG, WebP. No upload to server, 100% private. Free online image compressor tool." />
        <meta name="keywords" content="image compressor, compress image online, reduce image size, jpg compressor, png compressor, image optimizer, resize image, free image tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/image-compressor" />
      </Helmet>

      <div className="ic-page">
        <div className="ic-inner">

          {/* ── Header ── */}
          <div className="ic-header">
            <div className="ic-icon">
              <ImageIcon size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="ic-cat">Image Tools</span>
              <h1>Image Compressor</h1>
              <p>Compress JPG, PNG & WebP images instantly — 100% in your browser, nothing uploaded.</p>
            </div>
          </div>

          {/* ── Settings Card ── */}
          <div className="ic-card">
            <div className="ic-field">
              <label className="ic-label">
                <Settings size={14} strokeWidth={2.5} className="ic-label-icon" />
                Compression Settings
              </label>

              <div className="ic-settings-grid">

                {/* Quality */}
                <div className="ic-setting-group">
                  <div className="ic-setting-top">
                    <span className="ic-setting-label">Quality</span>
                    <span className="ic-quality-badge">{quality}%</span>
                  </div>
                  <input
                    type="range" min="10" max="100" step="5"
                    value={quality}
                    onChange={e => setQuality(+e.target.value)}
                    className="ic-slider"
                  />
                  <div className="ic-slider-hints">
                    <span>Smaller file</span>
                    <span>Best quality</span>
                  </div>
                </div>

                {/* Max dimensions */}
                <div className="ic-setting-group">
                  <span className="ic-setting-label">Max Dimensions</span>
                  <div className="ic-dim-row">
                    <div className="ic-dim-input-wrap">
                      <ZoomIn size={13} strokeWidth={2} className="ic-dim-icon" />
                      <input
                        type="number" min="100" max="8000" step="10"
                        value={maxWidth}
                        onChange={e => setMaxWidth(+e.target.value)}
                        className="ic-dim-input"
                        placeholder="Width"
                      />
                      <span className="ic-dim-unit">px W</span>
                    </div>
                    <span className="ic-dim-x">×</span>
                    <div className="ic-dim-input-wrap">
                      <ZoomOut size={13} strokeWidth={2} className="ic-dim-icon" />
                      <input
                        type="number" min="100" max="8000" step="10"
                        value={maxHeight}
                        onChange={e => setMaxHeight(+e.target.value)}
                        className="ic-dim-input"
                        placeholder="Height"
                      />
                      <span className="ic-dim-unit">px H</span>
                    </div>
                  </div>
                  <p className="ic-dim-hint">Images larger than this will be scaled down proportionally</p>
                </div>

                {/* Output format */}
                <div className="ic-setting-group">
                  <span className="ic-setting-label">Output Format</span>
                  <div className="ic-fmt-row">
                    {["jpeg", "png"].map(f => (
                      <button
                        key={f}
                        className={`ic-fmt-btn ${outputFmt === f ? "ic-fmt-on" : ""}`}
                        onClick={() => setOutputFmt(f)}
                      >
                        <FileImage size={14} strokeWidth={2} />
                        <span>{f.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                  <p className="ic-dim-hint">
                    {outputFmt === "jpeg"
                      ? "JPEG: best for photos, smaller files"
                      : "PNG: lossless, best for graphics & transparency"}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ── Drop Zone ── */}
          <div
            className={`ic-dropzone ${dragging ? "ic-dz-active" : ""}`}
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
              className="ic-file-input"
              onChange={e => addFiles(e.target.files)}
            />
            <div className="ic-dz-content">
              <div className="ic-dz-icon">
                <Upload size={28} strokeWidth={1.5} />
              </div>
              <p className="ic-dz-title">Drop images here or <span className="ic-dz-link">browse files</span></p>
              <p className="ic-dz-sub">Supports JPG, PNG, WebP, GIF · Multiple files at once</p>
            </div>
          </div>

          {/* ── File List ── */}
          {files.length > 0 && (
            <div className="ic-card animate-in">

              {/* Summary bar */}
              <div className="ic-summary-bar">
                <div className="ic-summary-left">
                  <span className="ic-summary-count">{files.length} image{files.length > 1 ? "s" : ""}</span>
                  {doneCount > 0 && (
                    <span className="ic-summary-saved">
                      <CheckCircle size={12} strokeWidth={2.5} />
                      Saved {fmtSize(totalSaved)} total
                    </span>
                  )}
                </div>
                <div className="ic-summary-actions">
                  {doneCount > 0 && (
                    <button className="ic-action-btn ic-btn-dl-all" onClick={downloadAll}>
                      <Download size={13} strokeWidth={2.5} />
                      Download All ({doneCount})
                    </button>
                  )}
                  <button className="ic-action-btn" onClick={resetAll}>
                    <Trash2 size={13} strokeWidth={2.5} />
                    Clear All
                  </button>
                </div>
              </div>

              <div className="ic-divider" />

              {/* File rows */}
              <div className="ic-file-list">
                {files.map(entry => (
                  <div key={entry.id} className={`ic-file-row ic-row-${entry.status}`}>

                    {/* Preview */}
                    <div className="ic-thumb-wrap">
                      <img src={entry.preview} alt={entry.original.name} className="ic-thumb" />
                    </div>

                    {/* Info */}
                    <div className="ic-file-info">
                      <p className="ic-file-name">{entry.original.name}</p>
                      <div className="ic-file-sizes">
                        <span className="ic-size-original">{fmtSize(entry.original.size)}</span>
                        {entry.status === "done" && (
                          <>
                            <ArrowRight size={12} strokeWidth={2.5} className="ic-arrow" />
                            <span className="ic-size-compressed">{fmtSize(entry.compressed.size)}</span>
                            <span className={`ic-saving-badge ${entry.compressed.saving > 0 ? "ic-saving-pos" : "ic-saving-neg"}`}>
                              {entry.compressed.saving > 0 ? `-${entry.compressed.saving}%` : `+${Math.abs(entry.compressed.saving)}%`}
                            </span>
                          </>
                        )}
                        {entry.status === "done" && (
                          <span className="ic-dim-badge">{entry.compressed.width} × {entry.compressed.height}px</span>
                        )}
                      </div>
                      {entry.status === "error" && (
                        <p className="ic-file-error">
                          <AlertCircle size={12} strokeWidth={2.5} />
                          {entry.error}
                        </p>
                      )}
                    </div>

                    {/* Status / Actions */}
                    <div className="ic-file-actions">
                      {entry.status === "idle" && (
                        <span className="ic-status-pill ic-status-idle">Queued</span>
                      )}
                      {entry.status === "processing" && (
                        <span className="ic-status-pill ic-status-processing">
                          <span className="ic-mini-spinner" />
                          Compressing...
                        </span>
                      )}
                      {entry.status === "done" && (
                        <button className="ic-dl-btn" onClick={() => downloadFile(entry)}>
                          <Download size={13} strokeWidth={2.5} />
                          Save
                        </button>
                      )}
                      {entry.status === "error" && (
                        <span className="ic-status-pill ic-status-error">Failed</span>
                      )}
                      <button className="ic-remove-btn" onClick={() => removeFile(entry.id)} title="Remove">
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              <div className="ic-divider" />

              {/* Compress button */}
              <button
                className="ic-compress-btn"
                onClick={handleCompressAll}
                disabled={processing || files.every(f => f.status === "done")}
              >
                {processing ? (
                  <><span className="ic-spinner" /> Compressing...</>
                ) : files.every(f => f.status === "done") ? (
                  <><CheckCircle size={16} strokeWidth={2} /> All Done!</>
                ) : (
                  <><ImageIcon size={16} strokeWidth={2} /> Compress {files.filter(f => f.status !== "done").length} Image{files.filter(f => f.status !== "done").length > 1 ? "s" : ""}</>
                )}
              </button>
            </div>
          )}

          {/* ── Privacy note ── */}
          <div className="ic-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — images are processed entirely in your browser. Nothing is uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}
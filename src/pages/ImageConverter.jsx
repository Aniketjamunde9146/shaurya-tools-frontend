/* eslint-disable no-empty */
import { useState, useRef, useCallback } from "react";
import "./ImageConverter.css";
import { Helmet } from "react-helmet";
import {
  RefreshCw,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings,
  FileImage,
  Shuffle,
} from "lucide-react";

/* ── Supported conversions ── */
const CONVERSIONS = [
  { from: "image/jpeg", to: "image/png",  fromLabel: "JPG",  toLabel: "PNG"  },
  { from: "image/jpeg", to: "image/webp", fromLabel: "JPG",  toLabel: "WebP" },
  { from: "image/png",  to: "image/jpeg", fromLabel: "PNG",  toLabel: "JPG"  },
  { from: "image/png",  to: "image/webp", fromLabel: "PNG",  toLabel: "WebP" },
  { from: "image/webp", to: "image/jpeg", fromLabel: "WebP", toLabel: "JPG"  },
  { from: "image/webp", to: "image/png",  fromLabel: "WebP", toLabel: "PNG"  },
  { from: "image/gif",  to: "image/png",  fromLabel: "GIF",  toLabel: "PNG"  },
  { from: "image/gif",  to: "image/jpeg", fromLabel: "GIF",  toLabel: "JPG"  },
  { from: "image/gif",  to: "image/webp", fromLabel: "GIF",  toLabel: "WebP" },
];

/* Quick-pick "output format" options shown in the settings card */
const OUTPUT_FORMATS = [
  { mime: "image/jpeg", label: "JPG",  ext: "jpg"  },
  { mime: "image/png",  label: "PNG",  ext: "png"  },
  { mime: "image/webp", label: "WebP", ext: "webp" },
];

const QUALITY_FORMATS = ["image/jpeg", "image/webp"]; // formats that support quality setting

/* ── Format file size ── */
function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ── Mime → ext ── */
function mimeToExt(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png")  return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif")  return "gif";
  return "img";
}

/* ── Convert via canvas ── */
function convertImage(file, outputMime, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      // fill white background for JPG (transparent → white)
      if (outputMime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      const q = QUALITY_FORMATS.includes(outputMime) ? quality / 100 : undefined;
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Conversion failed")); return; }
          resolve({ blob, width: img.width, height: img.height });
        },
        outputMime,
        q
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/* ── Component ── */
export default function ImageConverter() {
  const [files,      setFiles]      = useState([]);
  const [outputFmt,  setOutputFmt]  = useState(OUTPUT_FORMATS[1]); // PNG default
  const [quality,    setQuality]    = useState(90);
  const [dragging,   setDragging]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  /* accepted input types */
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  /* ── Add files ── */
  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter(f => ACCEPTED.includes(f.type));
    if (!valid.length) return;
    const entries = valid.map(f => ({
      id:       Math.random().toString(36).slice(2),
      file:     f,
      original: { size: f.size, name: f.name, type: f.type },
      preview:  URL.createObjectURL(f),
      converted: null,
      status:   "idle",
      error:    null,
    }));
    setFiles(prev => [...prev, ...entries]);
  }, []);

  /* drag */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  /* ── Convert all ── */
  const handleConvertAll = async () => {
    if (!files.length || processing) return;
    setProcessing(true);
    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      const entry = updated[i];
      if (entry.status === "done") continue;

      // Skip if already in target format
      if (entry.original.type === outputFmt.mime) {
        updated[i] = { ...entry, status: "error", error: "File is already in this format" };
        setFiles([...updated]);
        continue;
      }

      updated[i] = { ...entry, status: "processing" };
      setFiles([...updated]);

      try {
        const { blob, width, height } = await convertImage(entry.file, outputFmt.mime, quality);
        const convertedUrl = URL.createObjectURL(blob);
        const baseName = entry.original.name.replace(/\.[^.]+$/, "");
        updated[i] = {
          ...entry,
          status: "done",
          converted: {
            blob,
            url:      convertedUrl,
            size:     blob.size,
            width,
            height,
            fileName: `${baseName}.${outputFmt.ext}`,
            fromLabel: mimeToExt(entry.original.type).toUpperCase(),
            toLabel:   outputFmt.label,
            saving:    Math.round((1 - blob.size / entry.original.size) * 100),
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
    if (!entry.converted) return;
    const a = document.createElement("a");
    a.href = entry.converted.url;
    a.download = entry.converted.fileName;
    a.click();
  };
  const downloadAll = () => files.filter(f => f.status === "done").forEach(downloadFile);

  /* ── Remove / Reset ── */
  const removeFile = (id) => {
    setFiles(prev => {
      const entry = prev.find(f => f.id === id);
      if (entry?.preview)        URL.revokeObjectURL(entry.preview);
      if (entry?.converted?.url) URL.revokeObjectURL(entry.converted.url);
      return prev.filter(f => f.id !== id);
    });
  };
  const resetAll = () => {
    files.forEach(f => {
      if (f.preview)       URL.revokeObjectURL(f.preview);
      if (f.converted?.url) URL.revokeObjectURL(f.converted.url);
    });
    setFiles([]);
  };

  /* re-convert if settings change */
  const handleFormatChange = (fmt) => {
    setOutputFmt(fmt);
    // Reset done files so they re-convert with new settings
    setFiles(prev => prev.map(f =>
      f.status === "done"
        ? { ...f, status: "idle", converted: null }
        : f
    ));
  };

  const doneCount = files.filter(f => f.status === "done").length;
  const showQuality = QUALITY_FORMATS.includes(outputFmt.mime);

  return (
    <>
      <Helmet>
        <title>Free Image Converter – JPG, PNG, WebP, GIF Online | ShauryaTools</title>
        <meta name="description" content="Convert images between JPG, PNG, WebP and GIF formats instantly in your browser. No upload, 100% private. Free online image converter." />
        <meta name="keywords" content="image converter, jpg to png, png to webp, webp to jpg, gif to png, convert image online, free image converter" />
        <link rel="canonical" href="https://shauryatools.vercel.app/image-converter" />
      </Helmet>

      <div className="iconv-page">
        <div className="iconv-inner">

          {/* ── Header ── */}
          <div className="iconv-header">
            <div className="iconv-icon">
              <RefreshCw size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="iconv-cat">Image Tools</span>
              <h1>Image Converter</h1>
              <p>Convert between JPG, PNG, WebP & GIF instantly — 100% in your browser, nothing uploaded.</p>
            </div>
          </div>

          {/* ── Supported conversions badge strip ── */}
          <div className="iconv-support-strip">
            {CONVERSIONS.map((c, i) => (
              <span key={i} className="iconv-support-pill">
                <span className="iconv-from">{c.fromLabel}</span>
                <ArrowRight size={10} strokeWidth={3} />
                <span className="iconv-to">{c.toLabel}</span>
              </span>
            ))}
          </div>

          {/* ── Settings Card ── */}
          <div className="iconv-card">
            <div className="iconv-field">
              <label className="iconv-label">
                <Settings size={14} strokeWidth={2.5} className="iconv-label-icon" />
                Conversion Settings
              </label>

              <div className="iconv-settings-grid">

                {/* Output format */}
                <div className="iconv-setting-group">
                  <span className="iconv-setting-label">Convert To</span>
                  <div className="iconv-fmt-row">
                    {OUTPUT_FORMATS.map(f => (
                      <button
                        key={f.mime}
                        className={`iconv-fmt-btn ${outputFmt.mime === f.mime ? "iconv-fmt-on" : ""}`}
                        onClick={() => handleFormatChange(f)}
                      >
                        <FileImage size={14} strokeWidth={2} />
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="iconv-hint">
                    {outputFmt.mime === "image/jpeg" && "JPG: best for photos, smallest file size"}
                    {outputFmt.mime === "image/png"  && "PNG: lossless, supports transparency"}
                    {outputFmt.mime === "image/webp" && "WebP: modern format, great quality & size"}
                  </p>
                </div>

                {/* Quality (only for lossy formats) */}
                <div className={`iconv-setting-group ${!showQuality ? "iconv-group-disabled" : ""}`}>
                  <div className="iconv-setting-top">
                    <span className="iconv-setting-label">Quality</span>
                    <span className={`iconv-quality-badge ${!showQuality ? "iconv-badge-muted" : ""}`}>
                      {showQuality ? `${quality}%` : "N/A"}
                    </span>
                  </div>
                  <input
                    type="range" min="10" max="100" step="5"
                    value={quality}
                    disabled={!showQuality}
                    onChange={e => setQuality(+e.target.value)}
                    className="iconv-slider"
                  />
                  <div className="iconv-slider-hints">
                    <span>Smaller file</span>
                    <span>Best quality</span>
                  </div>
                  {!showQuality && (
                    <p className="iconv-hint">PNG is lossless — quality setting not applicable</p>
                  )}
                </div>

                {/* Info panel */}
                <div className="iconv-setting-group">
                  <span className="iconv-setting-label">About Formats</span>
                  <div className="iconv-info-box">
                    <div className="iconv-info-row">
                      <span className="iconv-info-fmt">JPG</span>
                      <span className="iconv-info-desc">Photos, lossy, small</span>
                    </div>
                    <div className="iconv-info-row">
                      <span className="iconv-info-fmt">PNG</span>
                      <span className="iconv-info-desc">Lossless, transparency</span>
                    </div>
                    <div className="iconv-info-row">
                      <span className="iconv-info-fmt">WebP</span>
                      <span className="iconv-info-desc">Modern, best ratio</span>
                    </div>
                    <div className="iconv-info-row">
                      <span className="iconv-info-fmt">GIF</span>
                      <span className="iconv-info-desc">Animated (read-only)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Drop Zone ── */}
          <div
            className={`iconv-dropzone ${dragging ? "iconv-dz-active" : ""}`}
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
              className="iconv-file-input"
              onChange={e => addFiles(e.target.files)}
            />
            <div className="iconv-dz-content">
              <div className="iconv-dz-icon">
                <Upload size={28} strokeWidth={1.5} />
              </div>
              <p className="iconv-dz-title">Drop images here or <span className="iconv-dz-link">browse files</span></p>
              <p className="iconv-dz-sub">Supports JPG, PNG, WebP, GIF · Multiple files at once</p>
            </div>
          </div>

          {/* ── File List ── */}
          {files.length > 0 && (
            <div className="iconv-card animate-in">

              {/* Summary bar */}
              <div className="iconv-summary-bar">
                <div className="iconv-summary-left">
                  <span className="iconv-summary-count">{files.length} image{files.length > 1 ? "s" : ""}</span>
                  {doneCount > 0 && (
                    <span className="iconv-summary-done">
                      <CheckCircle size={12} strokeWidth={2.5} />
                      {doneCount} converted to {outputFmt.label}
                    </span>
                  )}
                </div>
                <div className="iconv-summary-actions">
                  {doneCount > 0 && (
                    <button className="iconv-action-btn iconv-btn-dl-all" onClick={downloadAll}>
                      <Download size={13} strokeWidth={2.5} />
                      Download All ({doneCount})
                    </button>
                  )}
                  <button className="iconv-action-btn" onClick={resetAll}>
                    <Trash2 size={13} strokeWidth={2.5} />
                    Clear All
                  </button>
                </div>
              </div>

              <div className="iconv-divider" />

              {/* File rows */}
              <div className="iconv-file-list">
                {files.map(entry => (
                  <div key={entry.id} className={`iconv-file-row iconv-row-${entry.status}`}>

                    {/* Preview */}
                    <div className="iconv-thumb-wrap">
                      <img
                        src={entry.status === "done" ? entry.converted.url : entry.preview}
                        alt={entry.original.name}
                        className="iconv-thumb"
                      />
                    </div>

                    {/* Info */}
                    <div className="iconv-file-info">
                      <p className="iconv-file-name">{entry.original.name}</p>
                      <div className="iconv-file-meta">
                        <span className="iconv-size-original">{fmtSize(entry.original.size)}</span>
                        <span className="iconv-fmt-tag iconv-from-tag">
                          {mimeToExt(entry.original.type).toUpperCase()}
                        </span>
                        {entry.status === "done" && (
                          <>
                            <ArrowRight size={12} strokeWidth={2.5} className="iconv-arrow" />
                            <span className="iconv-fmt-tag iconv-to-tag">{entry.converted.toLabel}</span>
                            <span className="iconv-size-converted">{fmtSize(entry.converted.size)}</span>
                            {entry.converted.saving !== 0 && (
                              <span className={`iconv-saving-badge ${entry.converted.saving > 0 ? "iconv-saving-pos" : "iconv-saving-neg"}`}>
                                {entry.converted.saving > 0
                                  ? `-${entry.converted.saving}%`
                                  : `+${Math.abs(entry.converted.saving)}%`}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {entry.status === "error" && (
                        <p className="iconv-file-error">
                          <AlertCircle size={12} strokeWidth={2.5} />
                          {entry.error}
                        </p>
                      )}
                    </div>

                    {/* Status / Actions */}
                    <div className="iconv-file-actions">
                      {entry.status === "idle" && (
                        <span className="iconv-status-pill iconv-status-idle">Queued</span>
                      )}
                      {entry.status === "processing" && (
                        <span className="iconv-status-pill iconv-status-processing">
                          <span className="iconv-mini-spinner" />
                          Converting...
                        </span>
                      )}
                      {entry.status === "done" && (
                        <button className="iconv-dl-btn" onClick={() => downloadFile(entry)}>
                          <Download size={13} strokeWidth={2.5} />
                          Save
                        </button>
                      )}
                      {entry.status === "error" && (
                        <span className="iconv-status-pill iconv-status-error">Failed</span>
                      )}
                      <button className="iconv-remove-btn" onClick={() => removeFile(entry.id)} title="Remove">
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              <div className="iconv-divider" />

              {/* Convert button */}
              <button
                className="iconv-convert-btn"
                onClick={handleConvertAll}
                disabled={processing || files.every(f => f.status === "done" || f.status === "error")}
              >
                {processing ? (
                  <><span className="iconv-spinner" /> Converting...</>
                ) : files.every(f => f.status === "done" || f.status === "error") ? (
                  <><CheckCircle size={16} strokeWidth={2} /> All Done!</>
                ) : (
                  <>
                    <Shuffle size={16} strokeWidth={2} />
                    Convert {files.filter(f => f.status === "idle").length} Image{files.filter(f => f.status === "idle").length !== 1 ? "s" : ""} to {outputFmt.label}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Privacy note ── */}
          <div className="iconv-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — images are processed entirely in your browser. Nothing is uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}
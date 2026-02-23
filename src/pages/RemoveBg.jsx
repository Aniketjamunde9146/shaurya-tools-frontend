/* eslint-disable no-empty */
import { useState, useRef, useCallback } from "react";
import { removeBackground } from "@imgly/background-removal";
import "./RemoveBg.css";
import { Helmet } from "react-helmet";
import {
  Scissors,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Layers,
  Palette,
  Wand2,
  ZoomIn,
} from "lucide-react";

/* ── Background replace options ── */
const BG_OPTIONS = [
  { id: "transparent", label: "Transparent", color: null,      desc: "PNG with no background" },
  { id: "white",       label: "White",       color: "#ffffff", desc: "Clean white background" },
  { id: "black",       label: "Black",       color: "#000000", desc: "Dark background" },
  { id: "blur",        label: "Blur",        color: null,      desc: "Blurred original bg" },
  { id: "custom",      label: "Custom",      color: null,      desc: "Pick any color" },
];

const fmt = (b) =>
  b < 1024 ? `${b} B`
  : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB`
  : `${(b / (1024 * 1024)).toFixed(2)} MB`;

export default function RemoveBg() {
  const [imgFile,    setImgFile]    = useState(null);
  const [imgSrc,     setImgSrc]     = useState(null);   // original preview URL
  const [bgOption,   setBgOption]   = useState("transparent");
  const [customColor,setCustomColor]= useState("#4f46e5");
  const [dragging,   setDragging]   = useState(false);
  const [status,     setStatus]     = useState("idle"); // idle | loading | done | error
  const [progress,   setProgress]   = useState(0);
  const [result,     setResult]     = useState(null);   // { url, blob, size, w, h }
  const [errMsg,     setErrMsg]     = useState("");
  const [view,       setView]       = useState("split"); // split | result | original

  const fileInputRef = useRef(null);

  /* ── Load image ── */
  const loadImage = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file);
    setResult(null);
    setStatus("idle");
    setProgress(0);
    setErrMsg("");
    setView("split");
    const url = URL.createObjectURL(file);
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setImgSrc(url);
  }, [imgSrc]);

  /* ── Drag & Drop ── */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    loadImage(e.dataTransfer.files[0]);
  };

  /* ── Apply background to transparent PNG blob ── */
  const applyBackground = async (transparentBlob, origFile) => {
    const bg = BG_OPTIONS.find(b => b.id === bgOption);

    if (bgOption === "transparent") return transparentBlob;

    // Draw on canvas
    const img = new Image();
    const tUrl = URL.createObjectURL(transparentBlob);
    await new Promise(r => { img.onload = r; img.src = tUrl; });
    URL.revokeObjectURL(tUrl);

    const canvas = document.createElement("canvas");
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");

    if (bgOption === "blur") {
      // Draw original blurred then overlay transparent fg
      const orig = new Image();
      const oUrl = URL.createObjectURL(origFile);
      await new Promise(r => { orig.onload = r; orig.src = oUrl; });
      URL.revokeObjectURL(oUrl);
      ctx.filter = "blur(20px)";
      ctx.drawImage(orig, -20, -20, canvas.width + 40, canvas.height + 40);
      ctx.filter = "none";
    } else {
      const color = bgOption === "custom" ? customColor : bg.color;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    return new Promise(resolve =>
      canvas.toBlob(resolve, bgOption === "blur" ? "image/jpeg" : "image/png", 0.95)
    );
  };

  /* ── Main remove background handler ── */
  const handleRemove = async () => {
    if (!imgFile || status === "loading") return;
    setStatus("loading");
    setProgress(5);
    setErrMsg("");
    setResult(null);

    try {
      const config = {
        progress: (key, cur, total) => {
          if (total > 0) setProgress(10 + Math.round((cur / total) * 75));
        },
      };

      setProgress(10);
      const blob = await removeBackground(imgFile, config);
      setProgress(88);

      // Apply background
      const finalBlob = await applyBackground(blob, imgFile);
      setProgress(95);

      const url = URL.createObjectURL(finalBlob);
      const imgEl = new Image();
      await new Promise(r => { imgEl.onload = r; imgEl.src = url; });

      setResult({
        url,
        blob: finalBlob,
        size: finalBlob.size,
        w:    imgEl.naturalWidth,
        h:    imgEl.naturalHeight,
      });
      setProgress(100);
      setStatus("done");
      setView("split");
    } catch (e) {
      console.error(e);
      setErrMsg(e.message || "Something went wrong. Please try again.");
      setStatus("error");
      setProgress(0);
    }
  };

  /* ── Download ── */
  const handleDownload = () => {
    if (!result) return;
    const ext  = bgOption === "transparent" ? "png" : bgOption === "blur" ? "jpg" : "png";
    const base = (imgFile?.name || "image").replace(/\.[^.]+$/, "");
    const a    = document.createElement("a");
    a.href     = result.url;
    a.download = `${base}-nobg.${ext}`;
    a.click();
  };

  const handleReset = () => {
    if (imgSrc)       URL.revokeObjectURL(imgSrc);
    if (result?.url)  URL.revokeObjectURL(result.url);
    setImgFile(null); setImgSrc(null); setResult(null);
    setStatus("idle"); setProgress(0); setErrMsg(""); setView("split");
  };

  const progressLabel =
    progress < 15  ? "Loading AI model..." :
    progress < 80  ? "Detecting subject..." :
    progress < 95  ? "Removing background..." :
    "Applying background...";

  return (
    <>
      <Helmet>
        <title>Free AI Background Remover – Remove Image Background Online | ShauryaTools</title>
        <meta name="description" content="Remove image backgrounds instantly with AI. Replace with transparent, white, black, blurred, or any custom color background. 100% free, runs in your browser." />
        <meta name="keywords" content="remove background online free, ai background remover, transparent background tool, remove bg, image background eraser, photo background remover, cutout image tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/remove-background" />
      </Helmet>

      <div className="rb-page">
        <div className="rb-inner">

          {/* ── Header ── */}
          <div className="rb-header">
            <div className="rb-icon"><Scissors size={20} strokeWidth={2} /></div>
            <div>
              <span className="rb-cat">AI Image Tools</span>
              <h1>Background Remover</h1>
              <p>Remove image backgrounds with AI — replace with transparent, solid color, or blur. Runs entirely in your browser.</p>
            </div>
          </div>

          {/* ── Drop Zone ── */}
          {!imgSrc && (
            <div
              className={`rb-dropzone ${dragging ? "rb-dz-active" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="rb-file-input"
                onChange={e => loadImage(e.target.files[0])}
              />
              <div className="rb-dz-content">
                <div className="rb-dz-icon"><Upload size={30} strokeWidth={1.5} /></div>
                <p className="rb-dz-title">Drop an image or <span className="rb-dz-link">browse files</span></p>
                <p className="rb-dz-sub">JPG, PNG, WebP · Best results on photos with clear subjects</p>
                <div className="rb-dz-examples">
                  <span>👤 Portraits</span>
                  <span>🛍️ Products</span>
                  <span>🐾 Animals</span>
                  <span>🌿 Objects</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Editor ── */}
          {imgSrc && (
            <div className="rb-editor animate-in">

              {/* ── Preview area ── */}
              <div className="rb-preview-card">

                {/* View toggle */}
                {result && (
                  <div className="rb-view-tabs">
                    {["split","result","original"].map(v => (
                      <button
                        key={v}
                        className={`rb-view-tab ${view === v ? "rb-view-on" : ""}`}
                        onClick={() => setView(v)}
                      >
                        {v === "split" ? "Split View" : v === "result" ? "Result" : "Original"}
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview */}
                <div className="rb-preview-area">
                  {/* Original */}
                  {(view === "original" || view === "split") && (
                    <div className={`rb-img-wrap ${view === "split" ? "rb-half" : "rb-full"}`}>
                      {view === "split" && <span className="rb-img-label">Original</span>}
                      <img src={imgSrc} alt="Original" className="rb-img" />
                    </div>
                  )}

                  {/* Split divider */}
                  {view === "split" && result && (
                    <div className="rb-split-divider" />
                  )}

                  {/* Result */}
                  {result && (view === "result" || view === "split") && (
                    <div className={`rb-img-wrap rb-checkered ${view === "split" ? "rb-half" : "rb-full"}`}>
                      {view === "split" && <span className="rb-img-label rb-label-result">Result</span>}
                      <img src={result.url} alt="Background removed" className="rb-img" />
                    </div>
                  )}

                  {/* Loading overlay */}
                  {status === "loading" && (
                    <div className="rb-loading-overlay">
                      <div className="rb-loading-box">
                        <div className="rb-loading-icon">
                          <Wand2 size={24} strokeWidth={1.5} />
                        </div>
                        <p className="rb-loading-label">{progressLabel}</p>
                        <div className="rb-progress-track">
                          <div className="rb-progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="rb-progress-pct">{progress}%</p>
                        {progress < 20 && (
                          <p className="rb-loading-note">First run downloads the AI model (~40MB). Cached for future use.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {status === "error" && (
                  <div className="rb-error-msg">
                    <AlertCircle size={14} strokeWidth={2.5} />
                    {errMsg}
                  </div>
                )}

                {/* Result info */}
                {result && (
                  <div className="rb-result-bar">
                    <div className="rb-result-badges">
                      <span className="rb-badge rb-badge-green">
                        <CheckCircle size={11} strokeWidth={2.5} />
                        Background removed
                      </span>
                      <span className="rb-badge">{result.w} × {result.h}px</span>
                      <span className="rb-badge rb-badge-teal">{fmt(result.size)}</span>
                    </div>
                    <div className="rb-result-actions">
                      <button className="rb-dl-btn" onClick={handleDownload}>
                        <Download size={14} strokeWidth={2.5} />
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Controls ── */}
              <div className="rb-controls-card">

                {/* Background option */}
                <div className="rb-field">
                  <label className="rb-label">
                    <Palette size={14} strokeWidth={2.5} className="rb-label-icon" />
                    New Background
                  </label>
                  <div className="rb-bg-options">
                    {BG_OPTIONS.map(b => (
                      <button
                        key={b.id}
                        className={`rb-bg-btn ${bgOption === b.id ? "rb-bg-on" : ""}`}
                        onClick={() => setBgOption(b.id)}
                      >
                        <div className="rb-bg-swatch">
                          {b.id === "transparent" && (
                            <div className="rb-swatch-checker" />
                          )}
                          {b.id === "blur" && (
                            <div className="rb-swatch-blur">≋</div>
                          )}
                          {b.color && (
                            <div className="rb-swatch-solid" style={{ background: b.color }} />
                          )}
                          {b.id === "custom" && (
                            <div className="rb-swatch-solid" style={{ background: customColor }} />
                          )}
                        </div>
                        <span className="rb-bg-label">{b.label}</span>
                        <span className="rb-bg-desc">{b.desc}</span>
                      </button>
                    ))}
                  </div>

                  {bgOption === "custom" && (
                    <div className="rb-custom-color-row">
                      <span className="rb-sub-label">Pick color</span>
                      <div className="rb-color-wrap">
                        <input
                          type="color"
                          value={customColor}
                          onChange={e => setCustomColor(e.target.value)}
                          className="rb-color-input"
                        />
                        <span className="rb-color-label">{customColor.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rb-divider" />

                {/* File info */}
                {imgFile && (
                  <div className="rb-file-info">
                    <ImageIcon size={13} strokeWidth={2} className="rb-file-icon" />
                    <span className="rb-file-name">{imgFile.name}</span>
                    <span className="rb-file-size">{fmt(imgFile.size)}</span>
                  </div>
                )}

                {/* Main CTA */}
                <button
                  className="rb-process-btn"
                  onClick={handleRemove}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <><span className="rb-spinner" /> Removing Background...</>
                  ) : status === "done" ? (
                    <><Wand2 size={16} strokeWidth={2} /> Remove Again</>
                  ) : (
                    <><Wand2 size={16} strokeWidth={2} /> Remove Background</>
                  )}
                </button>

                {/* Change / Reset */}
                <div className="rb-secondary-row">
                  <button className="rb-secondary-btn" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={13} strokeWidth={2.5} /> New Image
                  </button>
                  <button className="rb-secondary-btn rb-reset" onClick={handleReset}>
                    <RefreshCw size={13} strokeWidth={2.5} /> Reset
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="rb-file-input"
                  onChange={e => loadImage(e.target.files[0])}
                />

                {/* Tips */}
                <div className="rb-tips">
                  <p className="rb-tips-title"><ZoomIn size={12} strokeWidth={2.5} /> Tips for best results</p>
                  <ul>
                    <li>Use images with a clear subject vs background</li>
                    <li>Portrait photos & product shots work best</li>
                    <li>Higher resolution = cleaner edges</li>
                    <li>First run may take ~30s to download the AI model</li>
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="rb-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — AI runs entirely in your browser using WebAssembly. No images are uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}
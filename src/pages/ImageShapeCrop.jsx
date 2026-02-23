/* eslint-disable no-empty */
import { useState, useRef, useCallback, useEffect } from "react";
import "./ImageShapeCrop.css";
import { Helmet } from "react-helmet";
import {
  Crop,
  Download,
  RefreshCw,
  Upload,
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  CheckCircle,
  Sliders,
} from "lucide-react";

/* ── Shape definitions ── */
const SHAPES = [
  { id: "original",   label: "Original",   icon: ImageIcon,      desc: "No clipping" },
  { id: "square",     label: "Square",     icon: Square,         desc: "1 : 1" },
  { id: "circle",     label: "Circle",     icon: Circle,         desc: "Round crop" },
  { id: "landscape",  label: "16:9",       icon: Square,         desc: "Widescreen" },
  { id: "portrait",   label: "4:5",        icon: Square,         desc: "Portrait" },
  { id: "banner",     label: "3:1",        icon: Square,         desc: "Banner" },
  { id: "triangle",   label: "Triangle",   icon: Triangle,       desc: "Clip shape" },
  { id: "hexagon",    label: "Hexagon",    icon: Hexagon,        desc: "Clip shape" },
  { id: "star",       label: "Star",       icon: Star,           desc: "Clip shape" },
  { id: "diamond",    label: "Diamond",    icon: Square,         desc: "Rotated square" },
  { id: "heart",      label: "Heart",      icon: Circle,         desc: "Heart shape" },
  { id: "custom",     label: "Custom",     icon: Crop,           desc: "Free crop" },
];

/* ── Output formats ── */
const FORMATS = ["PNG", "JPEG", "WEBP"];

/* ── Draw shape path on canvas ── */
function drawShapePath(ctx, shape, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  const r  = Math.min(w, h) / 2;

  ctx.beginPath();
  switch (shape) {
    case "circle":
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case "square":
    case "landscape":
    case "portrait":
    case "banner":
    case "original":
      ctx.rect(x, y, w, h);
      break;
    case "triangle": {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      break;
    }
    case "hexagon": {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case "star": {
      const outerR = r, innerR = r * 0.45;
      for (let i = 0; i < 10; i++) {
        const angle  = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? outerR : innerR;
        const px = cx + radius * Math.cos(angle);
        const py = cy + radius * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case "diamond": {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, cy);
      ctx.closePath();
      break;
    }
    case "heart": {
      const hw = w * 0.5, hh = h * 0.5;
      ctx.moveTo(cx, y + hh * 0.35);
      ctx.bezierCurveTo(cx, y, x + w * 0.1, y, x + w * 0.1, y + hh * 0.35);
      ctx.bezierCurveTo(x + w * 0.1, y + hh * 0.7, cx, y + hh, cx, y + h);
      ctx.bezierCurveTo(cx, y + hh, x + w * 0.9, y + hh * 0.7, x + w * 0.9, y + hh * 0.35);
      ctx.bezierCurveTo(x + w * 0.9, y, cx, y, cx, y + hh * 0.35);
      ctx.closePath();
      break;
    }
    case "custom":
      ctx.rect(x, y, w, h);
      break;
    default:
      ctx.rect(x, y, w, h);
  }
}

/* ── Get output dimensions by shape ratio ── */
function getOutputDims(shape, origW, origH, cropBox) {
  const minSide = Math.min(origW, origH);
  switch (shape) {
    case "square":    return { w: minSide, h: minSide };
    case "circle":    return { w: minSide, h: minSide };
    case "landscape": return { w: origW,   h: Math.round(origW * 9 / 16) };
    case "portrait":  return { w: origW,   h: Math.round(origW * 5 / 4) };
    case "banner":    return { w: origW,   h: Math.round(origW / 3) };
    case "triangle":  return { w: minSide, h: minSide };
    case "hexagon":   return { w: minSide, h: minSide };
    case "star":      return { w: minSide, h: minSide };
    case "diamond":   return { w: minSide, h: minSide };
    case "heart":     return { w: minSide, h: minSide };
    case "custom":    return cropBox
      ? { w: cropBox.w, h: cropBox.h }
      : { w: origW, h: origH };
    default: return { w: origW, h: origH };
  }
}

/* ── Component ── */
export default function ImageShapeCrop() {
  const [imgSrc,     setImgSrc]     = useState(null);
  const [imgFile,    setImgFile]    = useState(null);
  const [imgEl,      setImgEl]      = useState(null);
  const [shape,      setShape]      = useState("square");
  const [format,     setFormat]     = useState("PNG");
  const [quality,    setQuality]    = useState(90);
  const [rotation,   setRotation]   = useState(0);
  const [flipH,      setFlipH]      = useState(false);
  const [flipV,      setFlipV]      = useState(false);
  const [bgColor,    setBgColor]    = useState("#ffffff");
  const [transpBg,   setTranspBg]   = useState(true);
  const [dragging,   setDragging]   = useState(false);
  const [result,     setResult]     = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cropBox,    setCropBox]    = useState(null);
  const [draggingCrop, setDraggingCrop] = useState(false);
  const [cropStart,    setCropStart]   = useState(null);

  const fileInputRef   = useRef(null);
  const previewCanvasRef = useRef(null);
  const cropOverlayRef   = useRef(null);

  /* ── Load image ── */
  const loadImage = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file);
    setResult(null);
    setCropBox(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);

    const url = URL.createObjectURL(file);
    setImgSrc(url);

    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = url;
  }, []);

  /* ── Drag & drop ── */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  };

  /* ── Draw preview canvas ── */
  useEffect(() => {
    if (!imgEl || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const maxPreview = 420;
    const scale = Math.min(maxPreview / imgEl.naturalWidth, maxPreview / imgEl.naturalHeight, 1);
    canvas.width  = imgEl.naturalWidth  * scale;
    canvas.height = imgEl.naturalHeight * scale;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(imgEl, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();

    // Draw crop overlay for custom
    if (shape === "custom" && cropBox) {
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth   = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(cropBox.x * scale, cropBox.y * scale, cropBox.w * scale, cropBox.h * scale);
      ctx.setLineDash([]);
      // darken outside
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, canvas.width, cropBox.y * scale);
      ctx.fillRect(0, (cropBox.y + cropBox.h) * scale, canvas.width, canvas.height);
      ctx.fillRect(0, cropBox.y * scale, cropBox.x * scale, cropBox.h * scale);
      ctx.fillRect((cropBox.x + cropBox.w) * scale, cropBox.y * scale,
        canvas.width - (cropBox.x + cropBox.w) * scale, cropBox.h * scale);
    }
  }, [imgEl, rotation, flipH, flipV, shape, cropBox]);

  /* ── Custom crop mouse handlers ── */
  const onCropMouseDown = (e) => {
    if (shape !== "custom") return;
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const canvas = previewCanvasRef.current;
    const scaleX = imgEl.naturalWidth  / canvas.width;
    const scaleY = imgEl.naturalHeight / canvas.height;
    const x = (e.clientX - rect.left)  * scaleX;
    const y = (e.clientY - rect.top)   * scaleY;
    setCropStart({ x, y });
    setDraggingCrop(true);
    setCropBox(null);
  };

  const onCropMouseMove = (e) => {
    if (!draggingCrop || !cropStart) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const canvas = previewCanvasRef.current;
    const scaleX = imgEl.naturalWidth  / canvas.width;
    const scaleY = imgEl.naturalHeight / canvas.height;
    const x = (e.clientX - rect.left)  * scaleX;
    const y = (e.clientY - rect.top)   * scaleY;
    setCropBox({
      x: Math.min(cropStart.x, x),
      y: Math.min(cropStart.y, y),
      w: Math.abs(x - cropStart.x),
      h: Math.abs(y - cropStart.y),
    });
  };

  const onCropMouseUp = () => setDraggingCrop(false);

  /* ── Process ── */
  const handleProcess = async () => {
    if (!imgEl || processing) return;
    setProcessing(true);

    try {
      await new Promise(r => setTimeout(r, 40)); // let UI breathe

      const { w: outW, h: outH } = getOutputDims(shape, imgEl.naturalWidth, imgEl.naturalHeight, cropBox);
      const canvas = document.createElement("canvas");
      canvas.width  = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");

      // Background
      if (!transpBg || format === "JPEG") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, outW, outH);
      }

      // Clip path
      ctx.save();
      drawShapePath(ctx, shape, 0, 0, outW, outH);
      ctx.clip();

      // Apply transforms & draw
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      if (shape === "custom" && cropBox) {
        ctx.drawImage(
          imgEl,
          cropBox.x, cropBox.y, cropBox.w, cropBox.h,
          -outW / 2, -outH / 2, outW, outH
        );
      } else {
        // Center-crop source to fit output ratio
        const srcRatio = outW / outH;
        const imgRatio = imgEl.naturalWidth / imgEl.naturalHeight;
        let sx, sy, sw, sh;
        if (imgRatio > srcRatio) {
          sh = imgEl.naturalHeight;
          sw = sh * srcRatio;
          sx = (imgEl.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          sw = imgEl.naturalWidth;
          sh = sw / srcRatio;
          sx = 0;
          sy = (imgEl.naturalHeight - sh) / 2;
        }
        ctx.drawImage(imgEl, sx, sy, sw, sh, -outW / 2, -outH / 2, outW, outH);
      }
      ctx.restore();

      // Export
      const mime = format === "PNG" ? "image/png"
                 : format === "WEBP" ? "image/webp"
                 : "image/jpeg";
      const ext  = format.toLowerCase();
      canvas.toBlob(
        (blob) => {
          const url  = URL.createObjectURL(blob);
          const base = (imgFile?.name || "image").replace(/\.[^.]+$/, "");
          setResult({ url, blob, fileName: `${base}-${shape}.${ext}`, size: blob.size, w: outW, h: outH });
          setProcessing(false);
        },
        mime,
        format === "JPEG" ? quality / 100 : undefined
      );
    } catch {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href     = result.url;
    a.download = result.fileName;
    a.click();
  };

  const handleReset = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    if (result?.url) URL.revokeObjectURL(result.url);
    setImgSrc(null); setImgEl(null); setImgFile(null);
    setResult(null);  setCropBox(null);
    setRotation(0);   setFlipH(false); setFlipV(false);
  };

  const fmtSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024*1024)).toFixed(2)} MB`;

  return (
    <>
      <Helmet>
        <title>Free Image Shape Converter & Crop Tool – Circle, Square, Star & More | ShauryaTools</title>
        <meta name="description" content="Crop images into circles, squares, hexagons, stars, hearts, diamonds and more. Free browser-based image shape converter with rotation, flip and custom crop. No upload required." />
        <meta name="keywords" content="image shape converter, crop image circle, crop image square, image to circle, image crop tool, custom image crop, profile picture crop, image shape tool free" />
        <link rel="canonical" href="https://shauryatools.vercel.app/image-shape-crop" />
      </Helmet>

      <div className="isc-page">
        <div className="isc-inner">

          {/* ── Header ── */}
          <div className="isc-header">
            <div className="isc-icon"><Crop size={20} strokeWidth={2} /></div>
            <div>
              <span className="isc-cat">Image Tools</span>
              <h1>Image Shape Converter & Crop</h1>
              <p>Crop images into circles, squares, stars, hexagons, hearts & more — all in your browser.</p>
            </div>
          </div>

          {/* ── Drop zone (only if no image) ── */}
          {!imgEl && (
            <div
              className={`isc-dropzone ${dragging ? "isc-dz-active" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="isc-file-input"
                onChange={e => loadImage(e.target.files[0])}
              />
              <div className="isc-dz-content">
                <div className="isc-dz-icon"><Upload size={28} strokeWidth={1.5} /></div>
                <p className="isc-dz-title">Drop an image or <span className="isc-dz-link">browse</span></p>
                <p className="isc-dz-sub">JPG, PNG, WebP, GIF — processed entirely in your browser</p>
              </div>
            </div>
          )}

          {/* ── Main editor (once image loaded) ── */}
          {imgEl && (
            <div className="isc-editor animate-in">

              {/* Left — preview */}
              <div className="isc-preview-col">
                <div className="isc-preview-wrap">
                  <canvas
                    ref={previewCanvasRef}
                    className={`isc-preview-canvas ${shape === "custom" ? "isc-cursor-crosshair" : ""}`}
                    onMouseDown={onCropMouseDown}
                    onMouseMove={onCropMouseMove}
                    onMouseUp={onCropMouseUp}
                    onMouseLeave={onCropMouseUp}
                  />
                  {shape === "custom" && (
                    <p className="isc-crop-hint">
                      <Move size={12} strokeWidth={2.5} /> Click and drag on the image to define your crop area
                    </p>
                  )}
                </div>

                {/* Transform row */}
                <div className="isc-transform-row">
                  <button className="isc-transform-btn" onClick={() => setRotation(r => r - 90)} title="Rotate left">
                    <RotateCcw size={15} strokeWidth={2} />
                  </button>
                  <button className="isc-transform-btn" onClick={() => setRotation(r => r + 90)} title="Rotate right">
                    <RotateCw size={15} strokeWidth={2} />
                  </button>
                  <button className={`isc-transform-btn ${flipH ? "isc-tf-on" : ""}`} onClick={() => setFlipH(v => !v)} title="Flip horizontal">
                    <FlipHorizontal size={15} strokeWidth={2} />
                  </button>
                  <button className={`isc-transform-btn ${flipV ? "isc-tf-on" : ""}`} onClick={() => setFlipV(v => !v)} title="Flip vertical">
                    <FlipVertical size={15} strokeWidth={2} />
                  </button>
                  <button className="isc-transform-btn isc-tf-reset" onClick={() => { setRotation(0); setFlipH(false); setFlipV(false); }} title="Reset transforms">
                    <RefreshCw size={15} strokeWidth={2} />
                  </button>
                  <span className="isc-rotation-label">{rotation % 360}°</span>
                </div>

                {/* Change image */}
                <button className="isc-change-btn" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={13} strokeWidth={2.5} /> Change Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="isc-file-input"
                  onChange={e => loadImage(e.target.files[0])}
                />
              </div>

              {/* Right — controls */}
              <div className="isc-controls-col">

                {/* Shape */}
                <div className="isc-field">
                  <label className="isc-label">
                    <Crop size={14} strokeWidth={2.5} className="isc-label-icon" />
                    Output Shape
                  </label>
                  <div className="isc-shapes-grid">
                    {SHAPES.map(s => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.id}
                          className={`isc-shape-btn ${shape === s.id ? "isc-shape-on" : ""}`}
                          onClick={() => { setShape(s.id); setResult(null); setCropBox(null); }}
                        >
                          <Icon size={16} strokeWidth={s.id === "diamond" ? 1.5 : 2} className="isc-shape-icon" />
                          <span className="isc-shape-label">{s.label}</span>
                          <span className="isc-shape-desc">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="isc-divider" />

                {/* Format & Quality */}
                <div className="isc-field">
                  <label className="isc-label">
                    <Sliders size={14} strokeWidth={2.5} className="isc-label-icon" />
                    Export Settings
                  </label>

                  <div className="isc-fmt-row">
                    {FORMATS.map(f => (
                      <button
                        key={f}
                        className={`isc-fmt-btn ${format === f ? "isc-fmt-on" : ""}`}
                        onClick={() => setFormat(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {format === "JPEG" && (
                    <div className="isc-quality-row">
                      <div className="isc-quality-top">
                        <span className="isc-sub-label">Quality</span>
                        <span className="isc-q-badge">{quality}%</span>
                      </div>
                      <input
                        type="range" min="10" max="100" step="5"
                        value={quality}
                        onChange={e => setQuality(+e.target.value)}
                        className="isc-slider"
                      />
                    </div>
                  )}

                  {format !== "JPEG" && (
                    <button
                      className={`isc-toggle-check ${transpBg ? "isc-check-on" : ""}`}
                      onClick={() => setTranspBg(v => !v)}
                    >
                      <span className="isc-check-box">{transpBg ? "✓" : ""}</span>
                      <span className="isc-check-label">Transparent background</span>
                    </button>
                  )}

                  {(!transpBg || format === "JPEG") && (
                    <div className="isc-bg-row">
                      <span className="isc-sub-label">Background color</span>
                      <div className="isc-color-wrap">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={e => setBgColor(e.target.value)}
                          className="isc-color-input"
                        />
                        <span className="isc-color-label">{bgColor.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="isc-divider" />

                {/* Action buttons */}
                <button
                  className="isc-process-btn"
                  onClick={handleProcess}
                  disabled={processing || (shape === "custom" && !cropBox)}
                >
                  {processing
                    ? <><span className="isc-spinner" /> Processing...</>
                    : <><Crop size={16} strokeWidth={2} /> Apply Shape & Export</>}
                </button>

                {shape === "custom" && !cropBox && (
                  <p className="isc-hint-text">Draw a crop area on the preview first</p>
                )}

                {/* Result */}
                {result && (
                  <div className="isc-result-box animate-in">
                    <div className="isc-result-preview-wrap">
                      <img src={result.url} alt="Result" className="isc-result-img" />
                    </div>
                    <div className="isc-result-info">
                      <div className="isc-result-badges">
                        <span className="isc-r-badge">
                          <CheckCircle size={11} strokeWidth={2.5} />
                          {result.w} × {result.h}px
                        </span>
                        <span className="isc-r-badge isc-r-badge-size">{fmtSize(result.size)}</span>
                        <span className="isc-r-badge isc-r-badge-fmt">{format}</span>
                      </div>
                      <button className="isc-dl-btn" onClick={handleDownload}>
                        <Download size={14} strokeWidth={2.5} />
                        Download {result.fileName.split(".").pop().toUpperCase()}
                      </button>
                    </div>
                  </div>
                )}

                <button className="isc-reset-btn" onClick={handleReset}>
                  <RefreshCw size={13} strokeWidth={2.5} /> Start Over
                </button>

              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="isc-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — all processing happens in your browser. Nothing is uploaded.</span>
          </div>

        </div>
      </div>
    </>
  );
}
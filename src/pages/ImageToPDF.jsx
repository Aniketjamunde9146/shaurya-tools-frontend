/* eslint-disable no-empty */
import { useState, useRef, useCallback, useEffect } from "react";
import "./ImageToPDF.css";
import { Helmet } from "react-helmet";
import {
  Upload, Download, FileText, Trash2, CheckCircle,
  AlertCircle, MoveUp, MoveDown, RefreshCw, Plus,
} from "lucide-react";

/* ── jsPDF via CDN — injected once ── */
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload  = () => resolve(window.jspdf.jsPDF);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ── Page size options (mm) ── */
const PAGE_SIZES = [
  { id: "a4",      label: "A4",        w: 210,  h: 297  },
  { id: "a3",      label: "A3",        w: 297,  h: 420  },
  { id: "a5",      label: "A5",        w: 148,  h: 210  },
  { id: "letter",  label: "Letter",    w: 215.9,h: 279.4 },
  { id: "legal",   label: "Legal",     w: 215.9,h: 355.6 },
  { id: "fit",     label: "Fit Image", w: null, h: null  },
];

const ORIENTATIONS = [
  { id: "portrait",  label: "Portrait"  },
  { id: "landscape", label: "Landscape" },
];

const MARGINS = [
  { id: "none",   label: "None",   mm: 0  },
  { id: "small",  label: "Small",  mm: 10 },
  { id: "medium", label: "Medium", mm: 20 },
  { id: "large",  label: "Large",  mm: 30 },
];

const fmtSz = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(2)} MB`;
let uidCounter = 0;

export default function ImageToPDF() {
  const [images,      setImages]      = useState([]);   // {id, file, src, name, size}
  const [pageSize,    setPageSize]    = useState("a4");
  const [orientation, setOrientation] = useState("portrait");
  const [margin,      setMargin]      = useState("small");
  const [onePerPage,  setOnePerPage]  = useState(true);
  const [processing,  setProcessing]  = useState(false);
  const [result,      setResult]      = useState(null);
  const [errMsg,      setErrMsg]      = useState("");
  const [dragging,    setDragging]    = useState(false);
  const fileRef = useRef(null);

  /* ── Load images ── */
  const loadFiles = useCallback((files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setResult(null); setErrMsg("");
    const newImgs = imgs.map(file => ({
      id:   ++uidCounter,
      file,
      name: file.name,
      size: file.size,
      src:  URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImgs]);
  }, []);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); loadFiles(e.dataTransfer.files); };

  /* cleanup object URLs */
  useEffect(() => () => images.forEach(i => URL.revokeObjectURL(i.src)), []);

  const removeImage = (id) => {
    setImages(prev => { const img = prev.find(i=>i.id===id); if(img) URL.revokeObjectURL(img.src); return prev.filter(i=>i.id!==id); });
    setResult(null);
  };

  const moveUp   = (idx) => { if(idx===0) return; setImages(prev=>{const a=[...prev];[a[idx-1],a[idx]]=[a[idx],a[idx-1]];return a;}); setResult(null); };
  const moveDown = (idx) => { setImages(prev=>{if(idx===prev.length-1)return prev;const a=[...prev];[a[idx],a[idx+1]]=[a[idx+1],a[idx]];return a;}); setResult(null); };
  const clearAll = () => { images.forEach(i=>URL.revokeObjectURL(i.src)); setImages([]); setResult(null); setErrMsg(""); };

  /* ── Generate PDF ── */
  const handleGenerate = async () => {
    if (!images.length || processing) return;
    setProcessing(true); setErrMsg(""); setResult(null);
    try {
      const JsPDF = await loadJsPDF();
      const ps    = PAGE_SIZES.find(p => p.id === pageSize);
      const mg    = MARGINS.find(m => m.id === margin)?.mm || 0;

      /* Load all images as HTMLImageElement first */
      const loadedImgs = await Promise.all(images.map(img => new Promise((res, rej) => {
        const el = new Image();
        el.onload  = () => res({ el, img });
        el.onerror = rej;
        el.src = img.src;
      })));

      let pdf = null;

      for (let i = 0; i < loadedImgs.length; i++) {
        const { el, img } = loadedImgs[i];
        const iW = el.naturalWidth, iH = el.naturalHeight;

        /* Page dimensions */
        let pgW, pgH;
        if (ps.id === "fit") {
          pgW = iW * 0.264583; // px to mm at 96dpi
          pgH = iH * 0.264583;
        } else {
          pgW = orientation === "portrait" ? ps.w : ps.h;
          pgH = orientation === "portrait" ? ps.h : ps.w;
        }

        const orient = pgW > pgH ? "landscape" : "portrait";

        if (!pdf) {
          pdf = new JsPDF({ orientation: orient, unit: "mm", format: ps.id === "fit" ? [pgW, pgH] : ps.id });
        } else if (onePerPage) {
          pdf.addPage(ps.id === "fit" ? [pgW, pgH] : ps.id, orient);
        }

        /* Fit image inside page with margin */
        const availW = pgW - mg * 2;
        const availH = pgH - mg * 2;
        const imgAsp = iW / iH;
        const boxAsp = availW / availH;

        let drawW, drawH;
        if (imgAsp > boxAsp) { drawW = availW; drawH = availW / imgAsp; }
        else                  { drawH = availH; drawW = availH * imgAsp; }

        const x = mg + (availW - drawW) / 2;
        const y = mg + (availH - drawH) / 2;

        /* Draw image onto canvas at full res for quality */
        const canvas = document.createElement("canvas");
        canvas.width = iW; canvas.height = iH;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(el, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.96);

        const fmt = img.name.toLowerCase();
        const imgFmt = fmt.endsWith(".png") ? "PNG" : "JPEG";
        pdf.addImage(dataUrl, imgFmt, x, y, drawW, drawH, "", "FAST");
      }

      const pdfBlob = pdf.output("blob");
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        url:      URL.createObjectURL(pdfBlob),
        size:     pdfBlob.size,
        pages:    images.length,
        fileName: "images-converted.pdf",
      });
    } catch (e) {
      setErrMsg(e.message || "Failed to generate PDF. Please try again.");
    } finally { setProcessing(false); }
  };

  const dl = () => {
    if (!result) return;
    const a = document.createElement("a"); a.href = result.url; a.download = result.fileName; a.click();
  };

  return (
    <>
      <Helmet>
        <title>Image to PDF Converter – JPG PNG WebP to PDF | ShauryaTools</title>
        <meta name="description" content="Convert multiple images to PDF free. Supports JPG, PNG, WebP, GIF. Choose page size, orientation, margin. Reorder images. All browser-based, no upload." />
        <meta name="keywords" content="image to pdf, jpg to pdf, png to pdf, webp to pdf, convert image pdf, multiple images to pdf, free pdf converter" />
        <link rel="canonical" href="https://shauryatools.vercel.app/image-to-pdf" />
      </Helmet>

      <div className="itp-page">
        <div className="itp-inner">

          {/* Header */}
          <div className="itp-header">
            <div className="itp-icon"><FileText size={20} strokeWidth={2}/></div>
            <div>
              <span className="itp-cat">PDF Tools</span>
              <h1>Image to PDF</h1>
              <p>Convert JPG, PNG, WebP and more into a PDF. Add multiple images, reorder them, pick page size — done.</p>
            </div>
          </div>

          <div className="itp-layout">

            {/* LEFT: Upload + image list */}
            <div className="itp-left">

              {/* Drop zone */}
              <div
                className={`itp-dropzone ${dragging ? "itp-dz-active" : ""}`}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" multiple className="itp-file-input"
                  onChange={e => loadFiles(e.target.files)}/>
                <div className="itp-dz-content">
                  <div className="itp-dz-icon"><Upload size={26} strokeWidth={1.5}/></div>
                  <p className="itp-dz-title">
                    {images.length ? <><Plus size={14}/> Add more images</> : <>Drop images or <span className="itp-dz-link">browse</span></>}
                  </p>
                  <p className="itp-dz-sub">JPG · PNG · WebP · GIF · BMP — multiple files supported</p>
                </div>
              </div>

              {/* Image list */}
              {images.length > 0 && (
                <div className="itp-list animate-in">
                  <div className="itp-list-header">
                    <span className="itp-list-count">{images.length} image{images.length!==1?"s":""}</span>
                    <button className="itp-clear-btn" onClick={clearAll}><Trash2 size={13}/> Clear all</button>
                  </div>

                  {images.map((img, idx) => (
                    <div key={img.id} className="itp-item">
                      <img src={img.src} alt={img.name} className="itp-item-thumb"/>
                      <div className="itp-item-info">
                        <p className="itp-item-name">{img.name}</p>
                        <p className="itp-item-meta">{fmtSz(img.size)}</p>
                      </div>
                      <div className="itp-item-actions">
                        <button className="itp-order-btn" onClick={() => moveUp(idx)} disabled={idx===0} title="Move up"><MoveUp size={13}/></button>
                        <button className="itp-order-btn" onClick={() => moveDown(idx)} disabled={idx===images.length-1} title="Move down"><MoveDown size={13}/></button>
                        <button className="itp-remove-btn" onClick={() => removeImage(img.id)} title="Remove"><Trash2 size={13}/></button>
                      </div>
                      <div className="itp-item-num">{idx+1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Settings */}
            <div className="itp-right">
              <div className="itp-settings">

                {/* Page size */}
                <div className="itp-field">
                  <label className="itp-label">Page Size</label>
                  <div className="itp-grid-2">
                    {PAGE_SIZES.map(p => (
                      <button key={p.id}
                        className={`itp-opt-btn ${pageSize===p.id?"itp-opt-on":""}`}
                        onClick={() => { setPageSize(p.id); setResult(null); }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="itp-divider"/>

                {/* Orientation */}
                {pageSize !== "fit" && (
                  <>
                    <div className="itp-field">
                      <label className="itp-label">Orientation</label>
                      <div className="itp-grid-2">
                        {ORIENTATIONS.map(o => (
                          <button key={o.id}
                            className={`itp-opt-btn ${orientation===o.id?"itp-opt-on":""}`}
                            onClick={() => { setOrientation(o.id); setResult(null); }}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="itp-divider"/>
                  </>
                )}

                {/* Margin */}
                <div className="itp-field">
                  <label className="itp-label">Page Margin</label>
                  <div className="itp-grid-4">
                    {MARGINS.map(m => (
                      <button key={m.id}
                        className={`itp-opt-btn ${margin===m.id?"itp-opt-on":""}`}
                        onClick={() => { setMargin(m.id); setResult(null); }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="itp-divider"/>

                {/* One per page toggle */}
                <div className="itp-field">
                  <button
                    className={`itp-toggle ${onePerPage?"itp-toggle-on":""}`}
                    onClick={() => { setOnePerPage(v=>!v); setResult(null); }}>
                    <span className="itp-toggle-knob"/>
                  </button>
                  <span className="itp-toggle-label">One image per page</span>
                </div>

                <div className="itp-divider"/>

                {errMsg && <div className="itp-error"><AlertCircle size={13}/> {errMsg}</div>}

                {/* Convert button */}
                <button
                  className="itp-convert-btn"
                  onClick={handleGenerate}
                  disabled={processing || !images.length}>
                  {processing
                    ? <><span className="itp-spinner"/> Converting to PDF...</>
                    : <><FileText size={16}/> Convert to PDF</>}
                </button>

                {!images.length && (
                  <p className="itp-hint">Upload at least one image to get started</p>
                )}

                {/* Result */}
                {result && (
                  <div className="itp-result animate-in">
                    <div className="itp-result-icon"><FileText size={28} strokeWidth={1.5}/></div>
                    <div className="itp-result-info">
                      <p className="itp-result-name">{result.fileName}</p>
                      <div className="itp-result-badges">
                        <span className="itp-badge itp-badge-green"><CheckCircle size={10}/> Ready</span>
                        <span className="itp-badge">{result.pages} page{result.pages!==1?"s":""}</span>
                        <span className="itp-badge itp-badge-teal">{fmtSz(result.size)}</span>
                      </div>
                    </div>
                    <button className="itp-dl-btn" onClick={dl}>
                      <Download size={14}/> Download PDF
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="itp-privacy">
            <CheckCircle size={13}/>
            <span>100% private — all processing happens in your browser. Nothing is uploaded or stored.</span>
          </div>

        </div>
      </div>
    </>
  );
}
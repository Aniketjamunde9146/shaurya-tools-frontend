/* eslint-disable no-empty */
import { useState, useRef, useCallback } from "react";
import "./ImageQualityEnhancer.css";
import { Helmet } from "react-helmet";
import { Upload, Download, Zap, CheckCircle, AlertCircle } from "lucide-react";

const RESOLUTIONS = [
  { id: "original", label: "Original",  desc: "Keep source size",   w: null,  h: null  },
  { id: "2k",       label: "2K",        desc: "2048 × 1080",        w: 2048,  h: 1080  },
  { id: "4k",       label: "4K",        desc: "3840 × 2160",        w: 3840,  h: 2160  },
];

const FORMATS = [
  { id: "jpeg", label: "JPEG", mime: "image/jpeg", ext: "jpg"  },
  { id: "png",  label: "PNG",  mime: "image/png",  ext: "png"  },
  { id: "webp", label: "WEBP", mime: "image/webp", ext: "webp" },
  { id: "avif", label: "AVIF", mime: "image/avif", ext: "avif" },
  { id: "bmp",  label: "BMP",  mime: "image/bmp",  ext: "bmp"  },
  { id: "tiff", label: "TIFF", mime: "image/tiff", ext: "tiff" },
];

const fmtSz = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(2)} MB`;

/* ── Pixel-level quality enhancement ── */
function enhanceCanvas(ctx, w, h) {
  const id = ctx.getImageData(0, 0, w, h);
  const d  = id.data;
  const orig = new Uint8ClampedArray(d);

  /* 1. Mild auto-contrast stretch per channel */
  let rMin=255,rMax=0,gMin=255,gMax=0,bMin=255,bMax=0;
  for (let i=0;i<d.length;i+=4){
    if(d[i]<rMin)rMin=d[i]; if(d[i]>rMax)rMax=d[i];
    if(d[i+1]<gMin)gMin=d[i+1]; if(d[i+1]>gMax)gMax=d[i+1];
    if(d[i+2]<bMin)bMin=d[i+2]; if(d[i+2]>bMax)bMax=d[i+2];
  }
  const rR=rMax-rMin||1, gR=gMax-gMin||1, bR=bMax-bMin||1;
  for (let i=0;i<d.length;i+=4){
    d[i]   = Math.min(255,((d[i]  -rMin)/rR)*255*1.02);
    d[i+1] = Math.min(255,((d[i+1]-gMin)/gR)*255*1.02);
    d[i+2] = Math.min(255,((d[i+2]-bMin)/bR)*255*1.02);
  }

  /* 2. Light shadow lift */
  for (let i=0;i<d.length;i+=4){
    const lum=(d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114)/255;
    if(lum<0.35){
      const lift=12*(0.35-lum)/0.35;
      d[i]=Math.min(255,d[i]+lift);
      d[i+1]=Math.min(255,d[i+1]+lift);
      d[i+2]=Math.min(255,d[i+2]+lift);
    }
  }

  /* 3. Unsharp mask sharpening */
  const s = new Uint8ClampedArray(d);
  const k=[0,-1,0,-1,5,-1,0,-1,0];
  const str=0.5;
  for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
    let r=0,g=0,b=0;
    for(let ky=-1;ky<=1;ky++) for(let kx=-1;kx<=1;kx++){
      const pi=((y+ky)*w+(x+kx))*4, ki=(ky+1)*3+(kx+1);
      r+=s[pi]*k[ki]; g+=s[pi+1]*k[ki]; b+=s[pi+2]*k[ki];
    }
    const oi=(y*w+x)*4;
    d[oi]  =Math.min(255,Math.max(0, s[oi]  +(r-s[oi]  )*str));
    d[oi+1]=Math.min(255,Math.max(0, s[oi+1]+(g-s[oi+1])*str));
    d[oi+2]=Math.min(255,Math.max(0, s[oi+2]+(b-s[oi+2])*str));
  }

  ctx.putImageData(id, 0, 0);
}

export default function ImageQualityEnhancer() {
  const [imgFile,    setImgFile]    = useState(null);
  const [imgEl,      setImgEl]      = useState(null);
  const [imgSrc,     setImgSrc]     = useState(null);
  const [resolution, setResolution] = useState("2k");
  const [format,     setFormat]     = useState("jpeg");
  const [result,     setResult]     = useState(null);
  const [processing, setProcessing] = useState(false);
  const [errMsg,     setErrMsg]     = useState("");
  const [dragging,   setDragging]   = useState(false);
  const fileRef = useRef(null);

  /* ── Load image ── */
  const loadImage = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file); setResult(null); setErrMsg("");
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = url;
  }, [imgSrc]);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); loadImage(e.dataTransfer.files[0]); };

  /* ── Enhance ── */
  const handleEnhance = async () => {
    if (!imgEl || processing) return;
    setProcessing(true); setErrMsg(""); setResult(null);
    try {
      await new Promise(r => setTimeout(r, 40));

      const res = RESOLUTIONS.find(r => r.id === resolution);
      const fmt = FORMATS.find(f => f.id === format);

      /* Output size */
      let outW = imgEl.naturalWidth, outH = imgEl.naturalHeight;
      if (res.w && res.h) {
        /* Scale to fit within the target box, preserving aspect ratio */
        const aspect = imgEl.naturalWidth / imgEl.naturalHeight;
        if (aspect >= res.w / res.h) {
          outW = res.w;
          outH = Math.round(res.w / aspect);
        } else {
          outH = res.h;
          outW = Math.round(res.h * aspect);
        }
        /* Only upscale — don't downscale below original */
        if (outW < imgEl.naturalWidth) {
          outW = imgEl.naturalWidth;
          outH = imgEl.naturalHeight;
        }
      }

      /* Draw at output size with bicubic-quality imageSmoothingQuality */
      const canvas = document.createElement("canvas");
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled  = true;
      ctx.imageSmoothingQuality  = "high";
      ctx.filter = "brightness(102%) contrast(105%) saturate(108%)";
      ctx.drawImage(imgEl, 0, 0, outW, outH);
      ctx.filter = "none";

      /* Pixel-level enhancement */
      enhanceCanvas(ctx, outW, outH);

      /* Export */
      const quality = fmt.id === "jpeg" || fmt.id === "webp" ? 0.97 : undefined;
      const blob = await new Promise(res => canvas.toBlob(res, fmt.mime, quality));
      if (!blob) throw new Error("Export failed");

      if (result?.url) URL.revokeObjectURL(result.url);
      const base = (imgFile?.name || "image").replace(/\.[^.]+$/, "");
      setResult({
        url: URL.createObjectURL(blob),
        size: blob.size,
        w: outW, h: outH,
        fileName: `${base}-enhanced-${resolution}.${fmt.ext}`,
      });
    } catch (e) {
      setErrMsg(e.message || "Something went wrong. Please try again.");
    } finally { setProcessing(false); }
  };

  const dl = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url; a.download = result.fileName; a.click();
  };

  return (
    <>
      <Helmet>
        <title>Image Quality Enhancer – Upscale to 2K & 4K | ShauryaTools</title>
        <meta name="description" content="Enhance and upscale image quality to 2K or 4K resolution. Save as JPEG, PNG, WEBP, AVIF, BMP, TIFF. Free, browser-based, no upload." />
        <link rel="canonical" href="https://shauryatools.vercel.app/image-quality-enhancer" />
      </Helmet>

      <div className="iqe-page">
        <div className="iqe-inner">

          {/* Header */}
          <div className="iqe-header">
            <div className="iqe-icon"><Zap size={20} strokeWidth={2}/></div>
            <div>
              <span className="iqe-cat">Image Tools</span>
              <h1>Image Quality Enhancer</h1>
              <p>Upload an image, pick resolution and format, hit enhance — done.</p>
            </div>
          </div>

          {/* Main card */}
          <div className="iqe-card">

            {/* Upload area */}
            <div
              className={`iqe-upload ${imgEl ? "iqe-upload-sm" : ""} ${dragging ? "iqe-upload-drag" : ""}`}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept="image/*" className="iqe-file-input"
                onChange={e => loadImage(e.target.files[0])}/>
              {imgEl ? (
                <div className="iqe-upload-loaded">
                  <img src={imgSrc} alt="source" className="iqe-thumb"/>
                  <div className="iqe-upload-info">
                    <p className="iqe-upload-name">{imgFile?.name}</p>
                    <p className="iqe-upload-meta">{imgEl.naturalWidth}×{imgEl.naturalHeight}px · {fmtSz(imgFile?.size||0)}</p>
                  </div>
                  <span className="iqe-upload-change">Click to change</span>
                </div>
              ) : (
                <div className="iqe-upload-empty">
                  <div className="iqe-upload-icon"><Upload size={32} strokeWidth={1.5}/></div>
                  <p className="iqe-upload-title">Click or drag to upload image</p>
                  <p className="iqe-upload-sub">JPG, PNG, WebP, GIF and more</p>
                </div>
              )}
            </div>

            {imgEl && (
              <>
                <div className="iqe-divider"/>

                {/* Resolution */}
                <div className="iqe-section">
                  <p className="iqe-section-label">Output Resolution</p>
                  <div className="iqe-res-row">
                    {RESOLUTIONS.map(r => (
                      <button key={r.id}
                        className={`iqe-res-btn ${resolution === r.id ? "iqe-res-on" : ""}`}
                        onClick={() => { setResolution(r.id); setResult(null); }}>
                        <span className="iqe-res-label">{r.label}</span>
                        <span className="iqe-res-desc">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="iqe-divider"/>

                {/* Format */}
                <div className="iqe-section">
                  <p className="iqe-section-label">Save Format</p>
                  <div className="iqe-fmt-row">
                    {FORMATS.map(f => (
                      <button key={f.id}
                        className={`iqe-fmt-btn ${format === f.id ? "iqe-fmt-on" : ""}`}
                        onClick={() => { setFormat(f.id); setResult(null); }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="iqe-divider"/>

                {errMsg && (
                  <div className="iqe-error"><AlertCircle size={14}/> {errMsg}</div>
                )}

                {/* Enhance button */}
                <button className="iqe-enhance-btn" onClick={handleEnhance} disabled={processing}>
                  {processing
                    ? <><span className="iqe-spinner"/> Enhancing Image...</>
                    : <><Zap size={17}/> Increase Quality</>}
                </button>

                {/* Result */}
                {result && (
                  <div className="iqe-result animate-in">
                    <div className="iqe-result-preview">
                      <img src={result.url} alt="Enhanced" className="iqe-result-img"/>
                    </div>
                    <div className="iqe-result-info">
                      <div className="iqe-result-badges">
                        <span className="iqe-badge iqe-badge-green"><CheckCircle size={11}/> Ready</span>
                        <span className="iqe-badge">{result.w}×{result.h}px</span>
                        <span className="iqe-badge iqe-badge-teal">{fmtSz(result.size)}</span>
                        <span className="iqe-badge">{FORMATS.find(f=>f.id===format)?.label}</span>
                      </div>
                      <button className="iqe-dl-btn" onClick={dl}>
                        <Download size={14}/> Download Enhanced Image
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Privacy */}
          <div className="iqe-privacy">
            <CheckCircle size={13}/>
            <span>100% private — all processing happens in your browser. Nothing is uploaded.</span>
          </div>

        </div>
      </div>
    </>
  );
}
/* eslint-disable no-empty */
import { useState, useRef, useCallback, useEffect } from "react";
import "./PassportPhotoMaker.css";
import { Helmet } from "react-helmet";
import {
  Camera, Upload, Download, RefreshCw, CheckCircle, AlertCircle,
  ZoomIn, ZoomOut, Move, Grid, Printer, Globe, Crop, Sun,
  Scissors, ChevronRight, Key, Square, Circle, Triangle, Star,
  Hexagon, ImageIcon, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
} from "lucide-react";

/* ─── Helpers ─── */
const mm2px = (mm) => Math.round((mm / 25.4) * 300);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const fmtSz = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(2)} MB`;

/* ─── Shapes ─── */
const SHAPES = [
  { id: "none",     label: "None",     icon: ImageIcon },
  { id: "square",   label: "Square",   icon: Square    },
  { id: "circle",   label: "Circle",   icon: Circle    },
  { id: "triangle", label: "Triangle", icon: Triangle  },
  { id: "hexagon",  label: "Hexagon",  icon: Hexagon   },
  { id: "star",     label: "Star",     icon: Star      },
  { id: "diamond",  label: "Diamond",  icon: Square    },
  { id: "heart",    label: "Heart",    icon: Circle    },
];

/* ─── Draw shape clip path ─── */
function drawShapePath(ctx, shape, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  ctx.beginPath();
  switch (shape) {
    case "circle":
      ctx.arc(cx, cy, r, 0, Math.PI * 2); break;
    case "triangle":
      ctx.moveTo(cx, y); ctx.lineTo(x+w, y+h); ctx.lineTo(x, y+h); ctx.closePath(); break;
    case "hexagon":
      for (let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6;i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));}
      ctx.closePath(); break;
    case "star": {
      const ir=r*0.45;
      for(let i=0;i<10;i++){const a=(Math.PI/5)*i-Math.PI/2,rad=i%2===0?r:ir;i===0?ctx.moveTo(cx+rad*Math.cos(a),cy+rad*Math.sin(a)):ctx.lineTo(cx+rad*Math.cos(a),cy+rad*Math.sin(a));}
      ctx.closePath(); break;
    }
    case "diamond":
      ctx.moveTo(cx,y);ctx.lineTo(x+w,cy);ctx.lineTo(cx,y+h);ctx.lineTo(x,cy);ctx.closePath(); break;
    case "heart": {
      const hh=h*0.5;
      ctx.moveTo(cx,y+hh*0.35);
      ctx.bezierCurveTo(cx,y,x+w*0.1,y,x+w*0.1,y+hh*0.35);
      ctx.bezierCurveTo(x+w*0.1,y+hh*0.7,cx,y+hh,cx,y+h);
      ctx.bezierCurveTo(cx,y+hh,x+w*0.9,y+hh*0.7,x+w*0.9,y+hh*0.35);
      ctx.bezierCurveTo(x+w*0.9,y,cx,y,cx,y+hh*0.35);
      ctx.closePath(); break;
    }
    default: ctx.rect(x, y, w, h);
  }
}

/* ─── Country standards — India first / default ─── */
const STANDARDS = [
  {
    region: "🌏 Asia & Pacific",
    items: [
      { id:"india",       label:"India",        w:35, h:45, headMin:0.70, headMax:0.80, notes:"35×45 mm · white bg" },
      { id:"india_visa",  label:"India Visa",   w:51, h:51, headMin:0.60, headMax:0.75, notes:"2×2 inch · white bg" },
      { id:"china",       label:"China",        w:33, h:48, headMin:0.68, headMax:0.75, notes:"33×48 mm · white bg" },
      { id:"japan",       label:"Japan",        w:35, h:45, headMin:0.70, headMax:0.80, notes:"35×45 mm · white bg" },
      { id:"australia",   label:"Australia",    w:35, h:45, headMin:0.70, headMax:0.80, notes:"35–40×45–50 mm" },
      { id:"singapore",   label:"Singapore",    w:35, h:45, headMin:0.70, headMax:0.80, notes:"35×45 mm · white bg" },
      { id:"uae",         label:"UAE",          w:43, h:55, headMin:0.70, headMax:0.80, notes:"43×55 mm · white bg" },
      { id:"pakistan",    label:"Pakistan",     w:35, h:45, headMin:0.70, headMax:0.80, notes:"35×45 mm" },
      { id:"philippines", label:"Philippines",  w:35, h:45, headMin:0.65, headMax:0.80, notes:"35×45 mm · white bg" },
    ],
  },
  {
    region: "🇺🇸 Americas",
    items: [
      { id:"us",     label:"USA / Canada", w:51, h:51, headMin:0.50, headMax:0.69, notes:"2×2 inch · white bg" },
      { id:"brazil", label:"Brazil",       w:30, h:40, headMin:0.60, headMax:0.80, notes:"3×4 cm · white bg" },
      { id:"mexico", label:"Mexico",       w:35, h:45, headMin:0.60, headMax:0.75, notes:"35×45 mm · white bg" },
    ],
  },
  {
    region: "🇪🇺 Europe",
    items: [
      { id:"uk",      label:"UK",            w:35, h:45, headMin:0.70, headMax:0.80, notes:"35×45 mm" },
      { id:"eu",      label:"EU (Schengen)", w:35, h:45, headMin:0.70, headMax:0.80, notes:"35×45 mm · ICAO" },
      { id:"germany", label:"Germany",       w:35, h:45, headMin:0.70, headMax:0.80, notes:"35×45 mm · biometric" },
      { id:"france",  label:"France",        w:35, h:45, headMin:0.70, headMax:0.80, notes:"35×45 mm · white bg" },
    ],
  },
  {
    region: "🌍 Africa & Middle East",
    items: [
      { id:"nigeria",     label:"Nigeria",      w:35, h:45, headMin:0.65, headMax:0.80, notes:"35×45 mm" },
      { id:"southafrica", label:"South Africa", w:35, h:45, headMin:0.65, headMax:0.80, notes:"35×45 mm" },
      { id:"egypt",       label:"Egypt",        w:40, h:60, headMin:0.65, headMax:0.80, notes:"40×60 mm" },
      { id:"saudi",       label:"Saudi Arabia", w:45, h:55, headMin:0.65, headMax:0.80, notes:"45×55 mm · white bg" },
    ],
  },
];

const ALL_STD = STANDARDS.flatMap(g => g.items);

const PRINT_LAYOUTS = [
  { id:"4x6", label:'4×6" Print', wMM:152, hMM:102 },
  { id:"a4",  label:"A4 Sheet",   wMM:210, hMM:297 },
  { id:"3x4", label:'3×4" Print', wMM:102, hMM:76  },
];

const FORMATS = ["PNG","JPEG","WEBP"];

/* ══════════════════════════════════════════════════════ */
export default function PassportPhotoMaker() {
  const [step,         setStep]         = useState("upload"); // upload|crop|removebg|export
  const [imgFile,      setImgFile]      = useState(null);
  const [imgEl,        setImgEl]        = useState(null);
  const [imgSrc,       setImgSrc]       = useState(null);
  const [bgRemovedEl,  setBgRemovedEl]  = useState(null);
  const [bgRemovedSrc, setBgRemovedSrc] = useState(null);

  /* Crop/pan/zoom */
  const [zoom,      setZoom]      = useState(1);
  const [panX,      setPanX]      = useState(0);
  const [panY,      setPanY]      = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef(null);

  /* Transforms */
  const [rotation, setRotation] = useState(0);
  const [flipH,    setFlipH]    = useState(false);
  const [flipV,    setFlipV]    = useState(false);

  /* Shape & BG */
  const [shape,    setShape]    = useState("none");
  const [bgColor,  setBgColor]  = useState("#ffffff");
  const [transpBg, setTranspBg] = useState(false);
  const [format,   setFormat]   = useState("PNG");
  const [quality,  setQuality]  = useState(90);

  /* Settings */
  const [standard,    setStandard]    = useState("india"); // ← India default
  const [printLayout, setPrintLayout] = useState("4x6");
  const [apiKey,      setApiKey]      = useState("");
  const [showKey,     setShowKey]     = useState(false);

  /* Results */
  const [finalResult, setFinalResult] = useState(null);
  const [sheetResult, setSheetResult] = useState(null);

  /* UI */
  const [dragging,   setDragging]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errMsg,     setErrMsg]     = useState("");

  const fileRef    = useRef(null);
  const canvasRef  = useRef(null);
  const std        = ALL_STD.find(s => s.id === standard);
  const activeEl   = bgRemovedEl || imgEl;

  /* ─── Load image ─── */
  const loadImage = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file); setErrMsg("");
    setFinalResult(null); setSheetResult(null);
    setBgRemovedEl(null); setBgRemovedSrc(null);
    setZoom(1); setPanX(0); setPanY(0);
    setRotation(0); setFlipH(false); setFlipV(false);
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    const img = new Image();
    img.onload = () => { setImgEl(img); setStep("crop"); };
    img.src = url;
  }, [imgSrc]);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); loadImage(e.dataTransfer.files[0]); };

  /* ─── Draw preview ─── */
  useEffect(() => {
    if (!activeEl || !canvasRef.current || step === "upload") return;
    const canvas = canvasRef.current;
    const PW = canvas.offsetWidth || 320;
    const PH = Math.round(PW / (std.w / std.h));
    canvas.width = PW; canvas.height = PH;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, PW, PH);

    /* BG */
    if (!transpBg || format === "JPEG") {
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, PW, PH);
    } else {
      for (let cy=0;cy<PH;cy+=10) for (let cx=0;cx<PW;cx+=10) {
        ctx.fillStyle = ((cx+cy)/10)%2===0 ? "#d9d9d9":"#fff";
        ctx.fillRect(cx,cy,10,10);
      }
    }

    /* Shape clip */
    if (shape !== "none") { ctx.save(); drawShapePath(ctx,shape,0,0,PW,PH); ctx.clip(); }

    /* Image */
    const iW=activeEl.naturalWidth,iH=activeEl.naturalHeight;
    const fitScale = iW/iH > PW/PH ? PH/iH : PW/iW;
    const sW=iW*fitScale*zoom, sH=iH*fitScale*zoom;
    ctx.save();
    ctx.translate(PW/2+panX, PH/2+panY);
    ctx.rotate((rotation*Math.PI)/180);
    ctx.scale(flipH?-1:1, flipV?-1:1);
    ctx.drawImage(activeEl, -sW/2, -sH/2, sW, sH);
    ctx.restore();
    if (shape !== "none") ctx.restore();

    /* Guides on crop step */
    if (step === "crop") {
      ctx.strokeStyle="rgba(255,255,255,0.35)"; ctx.lineWidth=0.5; ctx.setLineDash([4,4]);
      [1,2].forEach(i=>{
        ctx.beginPath();ctx.moveTo(PW*i/3,0);ctx.lineTo(PW*i/3,PH);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,PH*i/3);ctx.lineTo(PW,PH*i/3);ctx.stroke();
      });
      ctx.setLineDash([]);
      const hT=PH*(1-std.headMax)*0.6, hB=PH*(1-std.headMin*0.3);
      ctx.strokeStyle="rgba(79,70,229,0.75)"; ctx.lineWidth=1.5; ctx.setLineDash([5,3]);
      ctx.strokeRect(PW*0.15,hT,PW*0.7,hB-hT); ctx.setLineDash([]);
    }
  }, [activeEl,zoom,panX,panY,rotation,flipH,flipV,bgColor,transpBg,shape,std,step,format]);

  /* ─── Pan ─── */
  const onMD  = (e) => { setIsPanning(true); panRef.current={x:e.clientX-panX,y:e.clientY-panY}; };
  const onMM  = (e) => { if(!isPanning||!panRef.current) return; setPanX(e.clientX-panRef.current.x); setPanY(e.clientY-panRef.current.y); };
  const onMU  = ()  => { setIsPanning(false); panRef.current=null; };
  const onTS  = (e) => { const t=e.touches[0]; panRef.current={x:t.clientX-panX,y:t.clientY-panY}; };
  const onTM  = (e) => { if(!panRef.current) return; const t=e.touches[0]; setPanX(t.clientX-panRef.current.x); setPanY(t.clientY-panRef.current.y); };
  const onTE  = ()  => { panRef.current=null; };

  /* ─── Render photo to canvas ─── */
  const renderToCanvas = (outW, outH) => {
    const el = bgRemovedEl || imgEl;
    const c = document.createElement("canvas");
    c.width=outW; c.height=outH;
    const ctx=c.getContext("2d");
    if (!transpBg || format==="JPEG") { ctx.fillStyle=bgColor; ctx.fillRect(0,0,outW,outH); }
    if (shape!=="none") { ctx.save(); drawShapePath(ctx,shape,0,0,outW,outH); ctx.clip(); }
    const pW=canvasRef.current?.width||outW, pH=canvasRef.current?.height||outH;
    const iW=el.naturalWidth,iH=el.naturalHeight;
    const fitScale=iW/iH>pW/pH?pH/iH:pW/iW;
    const sc=outW/pW;
    const sW=iW*fitScale*zoom*sc, sH=iH*fitScale*zoom*sc;
    ctx.save();
    ctx.translate(outW/2+panX*sc, outH/2+panY*sc);
    ctx.rotate((rotation*Math.PI)/180);
    ctx.scale(flipH?-1:1, flipV?-1:1);
    ctx.drawImage(el,-sW/2,-sH/2,sW,sH);
    ctx.restore();
    if (shape!=="none") ctx.restore();
    return c;
  };

  /* ─── Remove BG ─── */
  const handleRemoveBg = async () => {
    if (!imgEl) return;
    if (!apiKey.trim()) { setErrMsg("Please enter your remove.bg API key."); return; }
    setProcessing(true); setErrMsg("");
    try {
      const outW=mm2px(std.w), outH=mm2px(std.h);
      const blob=await new Promise(res=>renderToCanvas(outW,outH).toBlob(res,"image/png"));
      const fd=new FormData();
      fd.append("image_file",blob,"photo.png"); fd.append("size","auto");
      const res=await fetch("https://api.remove.bg/v1.0/removebg",{
        method:"POST", headers:{"X-Api-Key":apiKey.trim()}, body:fd,
      });
      if (!res.ok) { const j=await res.json().catch(()=>({})); throw new Error(j.errors?.[0]?.title||`API error ${res.status}`); }
      const rb=await res.blob();
      const url=URL.createObjectURL(rb);
      if (bgRemovedSrc) URL.revokeObjectURL(bgRemovedSrc);
      setBgRemovedSrc(url);
      const img=new Image();
      img.onload=()=>{ setBgRemovedEl(img); };
      img.src=url;
    } catch(e){ setErrMsg(e.message||"Background removal failed."); }
    finally { setProcessing(false); }
  };

  /* ─── Generate single photo ─── */
  const handleGenerate = async () => {
    if (!imgEl||processing) return;
    setProcessing(true); setErrMsg("");
    try {
      const outW=mm2px(std.w), outH=mm2px(std.h);
      const canvas=renderToCanvas(outW,outH);
      const mime=format==="JPEG"?"image/jpeg":format==="WEBP"?"image/webp":"image/png";
      const ext=format.toLowerCase();
      const blob=await new Promise(res=>canvas.toBlob(res,mime,format==="JPEG"?quality/100:undefined));
      if(finalResult?.url) URL.revokeObjectURL(finalResult.url);
      const base=(imgFile?.name||"photo").replace(/\.[^.]+$/,"");
      setFinalResult({url:URL.createObjectURL(blob),blob,size:blob.size,w:outW,h:outH,fileName:`${base}-passport-${std.id}.${ext}`});
    } catch { setErrMsg("Failed to generate photo."); }
    finally { setProcessing(false); }
  };

  /* ─── Generate print sheet ─── */
  const handlePrintSheet = async () => {
    if (!imgEl||processing) return;
    setProcessing(true); setErrMsg("");
    try {
      const layout=PRINT_LAYOUTS.find(l=>l.id===printLayout);
      const pW=mm2px(std.w),pH=mm2px(std.h);
      const sW=mm2px(layout.wMM),sH=mm2px(layout.hMM);
      const gap=mm2px(2);
      const cols=Math.floor((sW+gap)/(pW+gap)), rows=Math.floor((sH+gap)/(pH+gap));
      const sc=document.createElement("canvas");
      sc.width=sW; sc.height=sH;
      const sCtx=sc.getContext("2d");
      sCtx.fillStyle="#fff"; sCtx.fillRect(0,0,sW,sH);
      const photoC=renderToCanvas(pW,pH);
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
        const x=c*(pW+gap)+gap,y=r*(pH+gap)+gap;
        sCtx.drawImage(photoC,x,y);
        sCtx.strokeStyle="#ccc"; sCtx.lineWidth=1; sCtx.strokeRect(x,y,pW,pH);
      }
      const blob=await new Promise(res=>sc.toBlob(res,"image/jpeg",0.95));
      if(sheetResult?.url) URL.revokeObjectURL(sheetResult.url);
      const base=(imgFile?.name||"photo").replace(/\.[^.]+$/,"");
      setSheetResult({url:URL.createObjectURL(blob),blob,size:blob.size,count:cols*rows,cols,rows,fileName:`${base}-sheet-${printLayout}.jpg`});
    } catch { setErrMsg("Failed to generate sheet."); }
    finally { setProcessing(false); }
  };

  /* ─── Reset ─── */
  const handleReset = () => {
    [imgSrc,bgRemovedSrc,finalResult?.url,sheetResult?.url].forEach(u=>u&&URL.revokeObjectURL(u));
    setImgFile(null);setImgEl(null);setImgSrc(null);
    setBgRemovedEl(null);setBgRemovedSrc(null);
    setFinalResult(null);setSheetResult(null);setErrMsg("");
    setZoom(1);setPanX(0);setPanY(0);
    setRotation(0);setFlipH(false);setFlipV(false);
    setShape("none");setStep("upload");
  };

  const dl = (url,name) => { const a=document.createElement("a");a.href=url;a.download=name;a.click(); };

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <>
      <Helmet>
        <title>Passport Photo Maker – Shape Crop, Remove BG, Print Sheet | ShauryaTools</title>
        <meta name="description" content="Create passport photos for India, USA, UK and 20+ countries. Pick shape, AI BG removal, custom BG color, print sheet." />
        <link rel="canonical" href="https://shauryatools.vercel.app/passport-photo-maker" />
      </Helmet>

      <div className="ppm-page">
        <div className="ppm-inner">

          {/* Header */}
          <div className="ppm-header">
            <div className="ppm-icon"><Camera size={20} strokeWidth={2}/></div>
            <div>
              <span className="ppm-cat">Photo Tools</span>
              <h1>Passport Photo Maker</h1>
              <p>Crop · Shape · Remove Background · Apply BG Color · Print Sheet — all free, all in-browser.</p>
            </div>
          </div>

          {/* Step bar */}
          {step !== "upload" && (
            <div className="ppm-steps">
              {[
                {id:"crop",     label:"1. Crop & Shape"},
                {id:"removebg", label:"2. Remove BG"},
                {id:"export",   label:"3. Export & Print"},
              ].map((s,i) => {
                const order=["crop","removebg","export"];
                const cur=order.indexOf(step), si=order.indexOf(s.id);
                return (
                  <div key={s.id} className={`ppm-step ${si===cur?"ppm-step-active":""} ${si<cur?"ppm-step-done":""}`}>
                    <span className="ppm-step-ico">{si<cur?<CheckCircle size={12}/>:<span>{i+1}</span>}</span>
                    <span className="ppm-step-label">{s.label}</span>
                    {i<2 && <ChevronRight size={12} className="ppm-step-sep"/>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ UPLOAD ══ */}
          {step === "upload" && (
            <div
              className={`ppm-dropzone ${dragging?"ppm-dz-active":""}`}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={()=>fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept="image/*" className="ppm-file-input" onChange={e=>loadImage(e.target.files[0])}/>
              <div className="ppm-dz-content">
                <div className="ppm-dz-icon"><Upload size={30} strokeWidth={1.5}/></div>
                <p className="ppm-dz-title">Drop your photo or <span className="ppm-dz-link">browse</span></p>
                <p className="ppm-dz-sub">JPG, PNG, WebP · Clear front-facing portrait</p>
                <div className="ppm-dz-tips">
                  <span>✅ Face forward</span><span>✅ Plain background</span>
                  <span>✅ Good lighting</span><span>✅ Neutral expression</span>
                </div>
              </div>
            </div>
          )}

          {/* ══ EDITOR ══ */}
          {step !== "upload" && imgEl && (
            <div className="ppm-editor animate-in">

              {/* LEFT: Preview column */}
              <div className="ppm-preview-col">

                {/* Country */}
                <div className="ppm-field">
                  <label className="ppm-label"><Globe size={14} className="ppm-label-icon"/> Country Standard</label>
                  {STANDARDS.map(group=>(
                    <div key={group.region} className="ppm-std-group">
                      <p className="ppm-std-region">{group.region}</p>
                      <div className="ppm-std-grid">
                        {group.items.map(s=>(
                          <button key={s.id}
                            className={`ppm-std-btn ${standard===s.id?"ppm-std-on":""}`}
                            onClick={()=>{setStandard(s.id);setFinalResult(null);setSheetResult(null);}}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {std && (
                    <div className="ppm-std-info">
                      <span className="ppm-info-chip">{std.w}×{std.h} mm</span>
                      <span className="ppm-info-chip ppm-chip-px">{mm2px(std.w)}×{mm2px(std.h)} px</span>
                      <p className="ppm-info-note">{std.notes}</p>
                    </div>
                  )}
                </div>

                {/* Canvas */}
                <div className="ppm-canvas-wrap">
                  <canvas ref={canvasRef} className="ppm-canvas"
                    style={{cursor:isPanning?"grabbing":"grab",aspectRatio:`${std.w}/${std.h}`}}
                    onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
                    onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
                  />
                  <div className="ppm-canvas-badge"><Move size={11}/> Drag to reposition</div>
                  {step==="crop" && (
                    <div className="ppm-guide-legend">
                      <span className="ppm-guide-dot ppm-dot-head"/> Head zone
                      <span className="ppm-guide-dot ppm-dot-thirds"/> Rule of thirds
                    </div>
                  )}
                </div>

                {/* Zoom */}
                <div className="ppm-zoom-row">
                  <button className="ppm-zoom-btn" onClick={()=>setZoom(z=>clamp(z-0.1,0.5,4))}><ZoomOut size={15}/></button>
                  <div className="ppm-zoom-track">
                    <input type="range" min="50" max="400" step="5" value={Math.round(zoom*100)}
                      onChange={e=>setZoom(+e.target.value/100)} className="ppm-slider"/>
                  </div>
                  <button className="ppm-zoom-btn" onClick={()=>setZoom(z=>clamp(z+0.1,0.5,4))}><ZoomIn size={15}/></button>
                  <span className="ppm-zoom-label">{Math.round(zoom*100)}%</span>
                  <button className="ppm-zoom-reset" onClick={()=>{setZoom(1);setPanX(0);setPanY(0);}}><RefreshCw size={12}/></button>
                </div>

                {/* Transforms */}
                <div className="ppm-transform-row">
                  <button className="ppm-tf-btn" onClick={()=>setRotation(r=>r-90)} title="Rotate left"><RotateCcw size={14}/></button>
                  <button className="ppm-tf-btn" onClick={()=>setRotation(r=>r+90)} title="Rotate right"><RotateCw size={14}/></button>
                  <button className={`ppm-tf-btn ${flipH?"ppm-tf-on":""}`} onClick={()=>setFlipH(v=>!v)} title="Flip H"><FlipHorizontal size={14}/></button>
                  <button className={`ppm-tf-btn ${flipV?"ppm-tf-on":""}`} onClick={()=>setFlipV(v=>!v)} title="Flip V"><FlipVertical size={14}/></button>
                  <button className="ppm-tf-btn ppm-tf-reset" onClick={()=>{setRotation(0);setFlipH(false);setFlipV(false);}}><RefreshCw size={13}/></button>
                  <span className="ppm-rotation-label">{rotation%360}°</span>
                </div>

                {/* BG-removed badge */}
                {bgRemovedEl && (
                  <div className="ppm-bgr-success">
                    <CheckCircle size={13}/> Background removed — preview updated
                  </div>
                )}

                {/* Actions */}
                <div className="ppm-canvas-actions">
                  <button className="ppm-change-btn" onClick={()=>fileRef.current?.click()}><Upload size={13}/> Change Photo</button>
                  <button className="ppm-reset-btn"  onClick={handleReset}><RefreshCw size={13}/> Reset All</button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="ppm-file-input" onChange={e=>loadImage(e.target.files[0])}/>
              </div>

              {/* RIGHT: Step controls */}
              <div className="ppm-controls-col">

                {/* ══ STEP 1: CROP & SHAPE ══ */}
                {step === "crop" && (
                  <>
                    <p className="ppm-step-heading">Step 1 · Crop & Shape</p>
                    <p className="ppm-step-desc">Position your photo using drag and zoom. Pick an optional output shape — it will be applied on export.</p>
                    <div className="ppm-divider"/>

                    {/* Shape grid */}
                    <div className="ppm-field">
                      <label className="ppm-label"><Crop size={14} className="ppm-label-icon"/> Output Shape</label>
                      <div className="ppm-shapes-grid">
                        {SHAPES.map(s=>{
                          const Icon=s.icon;
                          return (
                            <button key={s.id}
                              className={`ppm-shape-btn ${shape===s.id?"ppm-shape-on":""}`}
                              onClick={()=>setShape(s.id)}>
                              <Icon size={15} strokeWidth={2} className="ppm-shape-icon"/>
                              <span className="ppm-shape-label">{s.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* BG color */}
                    <div className="ppm-field">
                      <label className="ppm-label"><Crop size={14} className="ppm-label-icon"/> Background Color</label>
                      <div className="ppm-bg-row">
                        {["#ffffff","#f5f0e8","#e8f4f8","#f0f0f0"].map(c=>(
                          <button key={c} className={`ppm-bg-swatch-btn ${bgColor===c&&!transpBg?"ppm-bg-on":""}`}
                            style={{background:c}} onClick={()=>{setBgColor(c);setTranspBg(false);}}/>
                        ))}
                        <div className="ppm-color-pick-wrap">
                          <input type="color" value={bgColor} onChange={e=>{setBgColor(e.target.value);setTranspBg(false);}} className="ppm-color-input"/>
                          <span className="ppm-color-label">{bgColor}</span>
                        </div>
                      </div>
                      {format!=="JPEG" && (
                        <button className={`ppm-toggle-check ${transpBg?"ppm-check-on":""}`} onClick={()=>setTranspBg(v=>!v)}>
                          <span className="ppm-check-box">{transpBg?"✓":""}</span>
                          <span className="ppm-check-label">Transparent background (PNG/WEBP)</span>
                        </button>
                      )}
                    </div>

                    <div className="ppm-divider"/>
                    {errMsg && <div className="ppm-error"><AlertCircle size={13}/> {errMsg}</div>}
                    <button className="ppm-gen-btn" onClick={()=>{setStep("removebg");setErrMsg("");}}>
                      <Scissors size={15}/> Next — Remove Background
                    </button>
                    <p className="ppm-skip-link" onClick={()=>{setStep("export");setErrMsg("");}}>Skip BG removal →</p>
                  </>
                )}

                {/* ══ STEP 2: REMOVE BG ══ */}
                {step === "removebg" && (
                  <>
                    <p className="ppm-step-heading">Step 2 · Remove Background</p>
                    <p className="ppm-step-desc">Use remove.bg AI to cleanly strip the background. Then pick a replacement color — or keep it transparent for PNG/WEBP.</p>
                    <div className="ppm-divider"/>

                    <div className="ppm-field">
                      <label className="ppm-label"><Key size={14} className="ppm-label-icon"/> remove.bg API Key</label>
                      <div className="ppm-apikey-wrap">
                        <input type={showKey?"text":"password"} value={apiKey}
                          onChange={e=>setApiKey(e.target.value)}
                          placeholder="Paste your remove.bg API key"
                          className="ppm-apikey-input"/>
                        <button className="ppm-apikey-toggle" onClick={()=>setShowKey(v=>!v)}>
                          {showKey?"Hide":"Show"}
                        </button>
                      </div>
                      <p className="ppm-apikey-hint">
                        Free at <a href="https://www.remove.bg/api" target="_blank" rel="noreferrer" className="ppm-link">remove.bg/api</a> · 50 free calls/month · key stays in-browser only
                      </p>
                    </div>

                    <div className="ppm-field">
                      <label className="ppm-label">Replace Background With</label>
                      <div className="ppm-bg-row">
                        {["#ffffff","#f5f0e8","#e8f4f8","#f0f0f0"].map(c=>(
                          <button key={c} className={`ppm-bg-swatch-btn ${bgColor===c&&!transpBg?"ppm-bg-on":""}`}
                            style={{background:c}} onClick={()=>{setBgColor(c);setTranspBg(false);}}/>
                        ))}
                        <div className="ppm-color-pick-wrap">
                          <input type="color" value={bgColor} onChange={e=>{setBgColor(e.target.value);setTranspBg(false);}} className="ppm-color-input"/>
                          <span className="ppm-color-label">{bgColor}</span>
                        </div>
                      </div>
                      {format!=="JPEG" && (
                        <button className={`ppm-toggle-check ${transpBg?"ppm-check-on":""}`} onClick={()=>setTranspBg(v=>!v)}>
                          <span className="ppm-check-box">{transpBg?"✓":""}</span>
                          <span className="ppm-check-label">Keep transparent (PNG/WEBP)</span>
                        </button>
                      )}
                    </div>

                    <div className="ppm-divider"/>
                    {errMsg && <div className="ppm-error"><AlertCircle size={13}/> {errMsg}</div>}

                    <button className="ppm-gen-btn" onClick={handleRemoveBg} disabled={processing}>
                      {processing?<><span className="ppm-spinner"/> Removing Background...</>:<><Scissors size={15}/> Remove Background</>}
                    </button>

                    {bgRemovedEl && (
                      <button className="ppm-sheet-btn" onClick={()=>{setStep("export");setErrMsg("");}}>
                        Continue to Export →
                      </button>
                    )}
                    <p className="ppm-skip-link" onClick={()=>{setStep("export");setErrMsg("");}}>Skip BG removal →</p>
                  </>
                )}

                {/* ══ STEP 3: EXPORT ══ */}
                {step === "export" && (
                  <>
                    <p className="ppm-step-heading">Step 3 · Export & Print</p>
                    <p className="ppm-step-desc">Choose your export format, download the photo or generate a print sheet.</p>
                    <div className="ppm-divider"/>

                    {/* BG color (if no BG removal done) */}
                    {!bgRemovedEl && (
                      <div className="ppm-field">
                        <label className="ppm-label">Background Color</label>
                        <div className="ppm-bg-row">
                          {["#ffffff","#f5f0e8","#e8f4f8","#f0f0f0"].map(c=>(
                            <button key={c} className={`ppm-bg-swatch-btn ${bgColor===c&&!transpBg?"ppm-bg-on":""}`}
                              style={{background:c}} onClick={()=>{setBgColor(c);setTranspBg(false);}}/>
                          ))}
                          <div className="ppm-color-pick-wrap">
                            <input type="color" value={bgColor} onChange={e=>{setBgColor(e.target.value);setTranspBg(false);}} className="ppm-color-input"/>
                            <span className="ppm-color-label">{bgColor}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Format */}
                    <div className="ppm-field">
                      <label className="ppm-label"><Sun size={14} className="ppm-label-icon"/> Export Format</label>
                      <div className="ppm-fmt-row">
                        {FORMATS.map(f=>(
                          <button key={f} className={`ppm-fmt-btn ${format===f?"ppm-fmt-on":""}`} onClick={()=>setFormat(f)}>{f}</button>
                        ))}
                      </div>
                      {format==="JPEG" && (
                        <div className="ppm-quality-row">
                          <div className="ppm-quality-top">
                            <span className="ppm-sub-label">Quality</span>
                            <span className="ppm-q-badge">{quality}%</span>
                          </div>
                          <input type="range" min="10" max="100" step="5" value={quality}
                            onChange={e=>setQuality(+e.target.value)} className="ppm-slider"/>
                        </div>
                      )}
                      {format!=="JPEG" && (
                        <button className={`ppm-toggle-check ${transpBg?"ppm-check-on":""}`} onClick={()=>setTranspBg(v=>!v)}>
                          <span className="ppm-check-box">{transpBg?"✓":""}</span>
                          <span className="ppm-check-label">Transparent background</span>
                        </button>
                      )}
                    </div>

                    <div className="ppm-divider"/>
                    {errMsg && <div className="ppm-error"><AlertCircle size={13}/> {errMsg}</div>}

                    <button className="ppm-gen-btn" onClick={handleGenerate} disabled={processing}>
                      {processing?<><span className="ppm-spinner"/> Generating...</>:<><Camera size={15}/> Generate Passport Photo</>}
                    </button>

                    {finalResult && (
                      <div className="ppm-result-box animate-in">
                        <div className="ppm-result-preview">
                          <img src={finalResult.url} alt="Passport photo" className="ppm-result-img"/>
                        </div>
                        <div className="ppm-result-meta">
                          <span className="ppm-r-badge ppm-r-green"><CheckCircle size={10}/> Ready</span>
                          <span className="ppm-r-badge">{finalResult.w}×{finalResult.h}px</span>
                          <span className="ppm-r-badge ppm-r-teal">{fmtSz(finalResult.size)}</span>
                        </div>
                        <button className="ppm-dl-btn" onClick={()=>dl(finalResult.url,finalResult.fileName)}>
                          <Download size={13}/> Download Photo
                        </button>
                      </div>
                    )}

                    <div className="ppm-divider"/>

                    <div className="ppm-field">
                      <label className="ppm-label"><Printer size={14} className="ppm-label-icon"/> Print Sheet</label>
                      <div className="ppm-layout-row">
                        {PRINT_LAYOUTS.map(l=>(
                          <button key={l.id} className={`ppm-layout-btn ${printLayout===l.id?"ppm-layout-on":""}`}
                            onClick={()=>setPrintLayout(l.id)}>{l.label}</button>
                        ))}
                      </div>
                      <button className="ppm-sheet-btn" onClick={handlePrintSheet} disabled={processing}>
                        {processing?<><span className="ppm-spinner ppm-spinner-sm"/> Generating...</>:<><Grid size={14}/> Generate Print Sheet</>}
                      </button>
                    </div>

                    {sheetResult && (
                      <div className="ppm-result-box animate-in">
                        <div className="ppm-result-preview ppm-sheet-preview">
                          <img src={sheetResult.url} alt="Print sheet" className="ppm-result-img"/>
                        </div>
                        <div className="ppm-result-meta">
                          <span className="ppm-r-badge ppm-r-green"><CheckCircle size={10}/> {sheetResult.count} photos ({sheetResult.cols}×{sheetResult.rows})</span>
                          <span className="ppm-r-badge ppm-r-teal">{fmtSz(sheetResult.size)}</span>
                        </div>
                        <button className="ppm-dl-btn" onClick={()=>dl(sheetResult.url,sheetResult.fileName)}>
                          <Download size={13}/> Download Print Sheet
                        </button>
                      </div>
                    )}

                    <div className="ppm-divider"/>
                    <button className="ppm-back-btn" onClick={()=>setStep("removebg")}>← Back to Remove BG</button>
                  </>
                )}

              </div>
            </div>
          )}

          {/* Privacy */}
          <div className="ppm-privacy">
            <CheckCircle size={13}/>
            <span>100% private — processed in-browser. Only sent to remove.bg for BG removal, never stored on our servers.</span>
          </div>

        </div>
      </div>
    </>
  );
}
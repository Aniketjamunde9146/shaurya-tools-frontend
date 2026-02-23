/* eslint-disable no-empty */
import { useState, useRef, useCallback } from "react";
import "./ImageMetadataViewer.css";
import { Helmet } from "react-helmet";
import {
  ScanSearch,
  Upload,
  Copy,
  CheckCircle,
  Camera,
  FileImage,
  Calendar,
  Maximize2,
  MapPin,
  Cpu,
  Info,
  Download,
} from "lucide-react";

/* ─────────────────────────────────────────
   Tiny EXIF parser — reads binary JPEG APP1
───────────────────────────────────────── */
function parseExif(buffer) {
  const view = new DataView(buffer);
  if (view.getUint16(0) !== 0xffd8) return null; // not JPEG

  let offset = 2;
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset);
    if (marker === 0xffe1) {
      // APP1 — check for "Exif\0\0"
      const exifHeader = String.fromCharCode(
        view.getUint8(offset + 4), view.getUint8(offset + 5),
        view.getUint8(offset + 6), view.getUint8(offset + 7)
      );
      if (exifHeader === "Exif") {
        return readIfd(view, offset + 10);
      }
    }
    if ((marker & 0xff00) !== 0xff00) break;
    offset += 2 + view.getUint16(offset + 2);
  }
  return {};
}

function readIfd(view, tiffStart) {
  const tags = {};
  try {
    const byteOrder = view.getUint16(tiffStart);
    const le = byteOrder === 0x4949; // little-endian
    const getU16 = (o) => view.getUint16(o, le);
    const getU32 = (o) => view.getUint32(o, le);
    const getI32 = (o) => view.getInt32(o, le);

    const readRational = (o) => {
      const num = getU32(o), den = getU32(o + 4);
      return den ? num / den : 0;
    };
    const readSRational = (o) => {
      const num = getI32(o), den = getI32(o + 4);
      return den ? num / den : 0;
    };

    const getString = (offset, len) => {
      let s = "";
      for (let i = 0; i < len - 1; i++) {
        const c = view.getUint8(offset + i);
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s.trim();
    };

    const TAG_NAMES = {
      0x010F: "Make",          0x0110: "Model",
      0x0112: "Orientation",   0x011A: "XResolution",
      0x011B: "YResolution",   0x0128: "ResolutionUnit",
      0x0131: "Software",      0x0132: "DateTime",
      0x013B: "Artist",        0x8298: "Copyright",
      0x8769: "ExifIFD",       0x8825: "GPSIFD",
      0x9003: "DateTimeOriginal", 0x9004: "DateTimeDigitized",
      0x9201: "ShutterSpeedValue", 0x9202: "ApertureValue",
      0x9203: "BrightnessValue",   0x9204: "ExposureBiasValue",
      0x9205: "MaxApertureValue",  0x9206: "SubjectDistance",
      0x9207: "MeteringMode",      0x9208: "LightSource",
      0x9209: "Flash",             0x920A: "FocalLength",
      0x927C: "MakerNote",         0xA000: "FlashPixVersion",
      0xA001: "ColorSpace",        0xA002: "PixelXDimension",
      0xA003: "PixelYDimension",   0xA402: "ExposureMode",
      0xA403: "WhiteBalance",      0xA405: "FocalLengthIn35mm",
      0xA406: "SceneCaptureType",  0x829A: "ExposureTime",
      0x829D: "FNumber",           0x8827: "ISOSpeedRatings",
      0x9286: "UserComment",
      // GPS
      0x0000: "GPSVersionID",  0x0001: "GPSLatitudeRef",
      0x0002: "GPSLatitude",   0x0003: "GPSLongitudeRef",
      0x0004: "GPSLongitude",  0x0005: "GPSAltitudeRef",
      0x0006: "GPSAltitude",   0x001D: "GPSDateStamp",
    };

    const readEntry = (ifdOffset) => {
      const count = getU16(ifdOffset);
      for (let i = 0; i < count; i++) {
        const entryOffset = ifdOffset + 2 + i * 12;
        const tag  = getU16(entryOffset);
        const type = getU16(entryOffset + 2);
        const num  = getU32(entryOffset + 4);
        const valOffset = entryOffset + 8;

        let value;
        try {
          if (type === 2) { // ASCII
            const strOffset = num > 4 ? tiffStart + getU32(valOffset) : valOffset;
            value = getString(strOffset, num);
          } else if (type === 3) { // SHORT
            value = getU16(valOffset);
          } else if (type === 4) { // LONG
            value = getU32(valOffset);
          } else if (type === 5) { // RATIONAL
            const rOff = tiffStart + getU32(valOffset);
            if (num > 1) {
              value = Array.from({ length: num }, (_, k) => readRational(rOff + k * 8));
            } else {
              value = readRational(rOff);
            }
          } else if (type === 10) { // SRATIONAL
            value = readSRational(tiffStart + getU32(valOffset));
          }
        } catch {}

        const name = TAG_NAMES[tag];
        if (name && value !== undefined) {
          if (name === "ExifIFD") {
            readEntry(tiffStart + value);
          } else if (name === "GPSIFD") {
            readEntry(tiffStart + value);
          } else {
            tags[name] = value;
          }
        }
      }
    };

    const ifdOffset = tiffStart + getU32(tiffStart + 4);
    readEntry(ifdOffset);
  } catch {}

  return tags;
}

/* ── Helper formatters ── */
function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtExposure(val) {
  if (!val) return null;
  if (val < 1) return `1/${Math.round(1 / val)}s`;
  return `${val}s`;
}

function fmtGps(arr, ref) {
  if (!Array.isArray(arr) || arr.length < 3) return null;
  const deg = arr[0], min = arr[1], sec = arr[2];
  const dd = deg + min / 60 + sec / 3600;
  const dir = ref === "S" || ref === "W" ? -1 : 1;
  return (dd * dir).toFixed(6);
}

function orientationLabel(n) {
  const map = {1:"Normal",2:"Flipped H",3:"Rotated 180°",4:"Flipped V",
    5:"Rotated 90° CW + Flipped",6:"Rotated 90° CW",7:"Rotated 90° CCW + Flipped",8:"Rotated 90° CCW"};
  return map[n] || `${n}`;
}

function meteringLabel(n) {
  const map = {0:"Unknown",1:"Average",2:"Center-weighted",3:"Spot",4:"Multi-spot",5:"Multi-segment",6:"Partial"};
  return map[n] || `${n}`;
}

function flashLabel(n) {
  if (n === undefined) return null;
  return n & 1 ? "Fired" : "Did not fire";
}

/* ── Section component ── */
function Section({ icon: Icon, title, children, color = "emerald" }) {
  return (
    <div className={`imv-section imv-section-${color}`}>
      <div className="imv-section-head">
        <div className={`imv-section-icon imv-icon-${color}`}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
        <span className="imv-section-title">{title}</span>
      </div>
      <div className="imv-rows">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false, copyable = false, onCopy, copied }) {
  if (!value && value !== 0) return null;
  return (
    <div className="imv-row">
      <span className="imv-row-label">{label}</span>
      <span className={`imv-row-value ${mono ? "imv-mono" : ""}`}>{value}</span>
      {copyable && (
        <button
          className={`imv-copy-btn ${copied ? "imv-copy-done" : ""}`}
          onClick={onCopy} title="Copy"
        >
          {copied ? <CheckCircle size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2.5} />}
        </button>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function ImageMetadataViewer() {
  const [imgFile,  setImgFile]  = useState(null);
  const [imgEl,    setImgEl]    = useState(null);
  const [exif,     setExif]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied,   setCopied]   = useState(null);
  const fileInputRef = useRef(null);

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  /* ── Load file ── */
  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file);
    setExif(null);
    setLoading(true);

    // load image element for dimensions
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); setImgEl(img); };
    img.src = url;

    // parse EXIF from binary
    const reader = new FileReader();
    reader.onload = (e) => {
      const tags = parseExif(e.target.result) || {};
      setExif(tags);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); };

  /* ── Export metadata as .txt ── */
  const exportTxt = () => {
    if (!exif || !imgFile) return;
    const lines = [
      `Image Metadata — ${imgFile.name}`,
      `Generated by ShauryaTools`,
      `${"─".repeat(40)}`,
      `File Name:    ${imgFile.name}`,
      `File Size:    ${fmtSize(imgFile.size)}`,
      `File Type:    ${imgFile.type}`,
      `Dimensions:   ${imgEl?.width} × ${imgEl?.height} px`,
      ``,
      `Camera Make:  ${exif.Make || "—"}`,
      `Camera Model: ${exif.Model || "—"}`,
      `Software:     ${exif.Software || "—"}`,
      ``,
      `Date Taken:   ${exif.DateTimeOriginal || exif.DateTime || "—"}`,
      `Exposure:     ${fmtExposure(exif.ExposureTime) || "—"}`,
      `Aperture:     ${exif.FNumber ? `f/${exif.FNumber.toFixed(1)}` : "—"}`,
      `ISO:          ${exif.ISOSpeedRatings || "—"}`,
      `Focal Length: ${exif.FocalLength ? `${exif.FocalLength.toFixed(0)}mm` : "—"}`,
      `Flash:        ${flashLabel(exif.Flash) || "—"}`,
      ``,
      `GPS Lat:      ${fmtGps(exif.GPSLatitude, exif.GPSLatitudeRef) || "—"}`,
      `GPS Lng:      ${fmtGps(exif.GPSLongitude, exif.GPSLongitudeRef) || "—"}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${imgFile.name}-metadata.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasData = !!exif && !!imgFile;
  const lat = exif ? fmtGps(exif.GPSLatitude, exif.GPSLatitudeRef) : null;
  const lng = exif ? fmtGps(exif.GPSLongitude, exif.GPSLongitudeRef) : null;
  const hasGps = lat && lng;

  return (
    <>
      <Helmet>
        <title>Image Metadata Viewer – View EXIF Data Online | ShauryaTools</title>
        <meta name="description" content="View EXIF data, camera info, GPS location, resolution and more from any image file. 100% in-browser, free, private." />
        <meta name="keywords" content="image metadata viewer, EXIF data, exif reader, image info, camera data, GPS from photo, photo metadata" />
        <link rel="canonical" href="https://shauryatools.vercel.app/image-metadata-viewer" />
      </Helmet>

      <div className="imv-page">
        <div className="imv-inner">

          {/* ── Header ── */}
          <div className="imv-header">
            <div className="imv-icon-wrap"><ScanSearch size={20} strokeWidth={2} /></div>
            <div>
              <span className="imv-cat">Image Tools</span>
              <h1>Image Metadata Viewer</h1>
              <p>Inspect EXIF data, camera settings, GPS coordinates, resolution & more — 100% in your browser.</p>
            </div>
          </div>

          {/* ── Drop zone ── */}
          {!hasData && (
            <div
              className={`imv-dropzone ${dragging ? "imv-dz-active" : ""}`}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*"
                className="imv-file-input" onChange={e => loadFile(e.target.files[0])} />
              <div className="imv-dz-content">
                <div className="imv-dz-icon">
                  {loading ? <span className="imv-spinner" /> : <Upload size={28} strokeWidth={1.5} />}
                </div>
                <p className="imv-dz-title">
                  {loading ? "Reading metadata..." : <>Drop image here or <span className="imv-dz-link">browse files</span></>}
                </p>
                <p className="imv-dz-sub">Supports JPG, PNG, WebP, HEIC · EXIF data from camera photos</p>
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {hasData && (
            <div className="imv-results animate-in">

              {/* Image preview panel */}
              <div className="imv-preview-panel">
                <div className="imv-img-wrap">
                  <img src={URL.createObjectURL(imgFile)} alt={imgFile.name} className="imv-img" />
                </div>

                <div className="imv-file-card">
                  <p className="imv-file-name" title={imgFile.name}>{imgFile.name}</p>
                  <div className="imv-quick-stats">
                    <div className="imv-quick-stat">
                      <span className="imv-qs-label">Size</span>
                      <span className="imv-qs-value">{fmtSize(imgFile.size)}</span>
                    </div>
                    <div className="imv-quick-stat">
                      <span className="imv-qs-label">Width</span>
                      <span className="imv-qs-value">{imgEl?.width}px</span>
                    </div>
                    <div className="imv-quick-stat">
                      <span className="imv-qs-label">Height</span>
                      <span className="imv-qs-value">{imgEl?.height}px</span>
                    </div>
                    <div className="imv-quick-stat">
                      <span className="imv-qs-label">Format</span>
                      <span className="imv-qs-value">{imgFile.type.split("/")[1].toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="imv-actions">
                  <button className="imv-action-btn imv-btn-export" onClick={exportTxt}>
                    <Download size={13} strokeWidth={2.5} /> Export .txt
                  </button>
                  <button className="imv-action-btn" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={13} strokeWidth={2.5} /> New Image
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*"
                    className="imv-file-input" onChange={e => loadFile(e.target.files[0])} />
                </div>

                {/* GPS map link */}
                {hasGps && (
                  <a
                    href={`https://maps.google.com/?q=${lat},${lng}`}
                    target="_blank" rel="noreferrer"
                    className="imv-gps-btn"
                  >
                    <MapPin size={13} strokeWidth={2.5} />
                    View on Google Maps
                  </a>
                )}
              </div>

              {/* Metadata sections */}
              <div className="imv-meta-col">

                {/* File info */}
                <Section icon={FileImage} title="File Information" color="blue">
                  <Row label="File Name"  value={imgFile.name} copyable onCopy={() => copyText(imgFile.name, "fname")} copied={copied === "fname"} />
                  <Row label="File Size"  value={fmtSize(imgFile.size)} />
                  <Row label="MIME Type"  value={imgFile.type} mono />
                  <Row label="Width"      value={imgEl ? `${imgEl.width} px` : null} />
                  <Row label="Height"     value={imgEl ? `${imgEl.height} px` : null} />
                  <Row label="Megapixels" value={imgEl ? `${((imgEl.width * imgEl.height) / 1_000_000).toFixed(1)} MP` : null} />
                  <Row label="Aspect Ratio" value={imgEl ? aspectRatio(imgEl.width, imgEl.height) : null} />
                  <Row label="X Resolution" value={exif.XResolution ? `${Math.round(exif.XResolution)} dpi` : null} />
                  <Row label="Y Resolution" value={exif.YResolution ? `${Math.round(exif.YResolution)} dpi` : null} />
                  <Row label="Orientation"  value={exif.Orientation ? orientationLabel(exif.Orientation) : null} />
                  <Row label="Color Space"  value={exif.ColorSpace === 1 ? "sRGB" : exif.ColorSpace === 65535 ? "Uncalibrated" : exif.ColorSpace ? `${exif.ColorSpace}` : null} />
                  <Row label="Software"   value={exif.Software} />
                </Section>

                {/* Camera info */}
                <Section icon={Camera} title="Camera Information" color="violet">
                  <Row label="Make"         value={exif.Make} />
                  <Row label="Model"        value={exif.Model} />
                  <Row label="Lens"         value={exif.LensModel} />
                  <Row label="Focal Length" value={exif.FocalLength ? `${exif.FocalLength.toFixed(0)} mm` : null} />
                  <Row label="35mm Equiv."  value={exif.FocalLengthIn35mm ? `${exif.FocalLengthIn35mm} mm` : null} />
                  <Row label="Aperture"     value={exif.FNumber ? `f/${exif.FNumber.toFixed(1)}` : null} />
                  <Row label="Shutter Speed" value={fmtExposure(exif.ExposureTime)} />
                  <Row label="ISO"          value={exif.ISOSpeedRatings} />
                  <Row label="Flash"        value={flashLabel(exif.Flash)} />
                  <Row label="Metering"     value={exif.MeteringMode ? meteringLabel(exif.MeteringMode) : null} />
                  <Row label="White Balance" value={exif.WhiteBalance === 0 ? "Auto" : exif.WhiteBalance === 1 ? "Manual" : null} />
                  <Row label="Exposure Mode" value={exif.ExposureMode === 0 ? "Auto" : exif.ExposureMode === 1 ? "Manual" : exif.ExposureMode === 2 ? "Auto Bracket" : null} />
                  <Row label="Exposure Bias" value={exif.ExposureBiasValue !== undefined ? `${exif.ExposureBiasValue > 0 ? "+" : ""}${exif.ExposureBiasValue.toFixed(1)} EV` : null} />
                  <Row label="Artist"       value={exif.Artist} />
                  <Row label="Copyright"    value={exif.Copyright} />
                </Section>

                {/* Date & time */}
                <Section icon={Calendar} title="Date & Time" color="amber">
                  <Row label="Date Taken"    value={exif.DateTimeOriginal} mono copyable onCopy={() => copyText(exif.DateTimeOriginal, "dto")} copied={copied === "dto"} />
                  <Row label="Date Modified" value={exif.DateTime} mono />
                  <Row label="Date Digitized" value={exif.DateTimeDigitized} mono />
                  <Row label="GPS Date"      value={exif.GPSDateStamp} mono />
                </Section>

                {/* GPS */}
                <Section icon={MapPin} title="GPS Location" color="red">
                  {hasGps ? (
                    <>
                      <Row label="Latitude"  value={`${lat}° ${exif.GPSLatitudeRef || ""}`} mono copyable onCopy={() => copyText(lat, "lat")} copied={copied === "lat"} />
                      <Row label="Longitude" value={`${lng}° ${exif.GPSLongitudeRef || ""}`} mono copyable onCopy={() => copyText(lng, "lng")} copied={copied === "lng"} />
                      {exif.GPSAltitude && (
                        <Row label="Altitude" value={`${exif.GPSAltitude.toFixed(1)} m`} />
                      )}
                      <Row label="Coordinates" value={`${lat}, ${lng}`} mono copyable onCopy={() => copyText(`${lat}, ${lng}`, "coords")} copied={copied === "coords"} />
                    </>
                  ) : (
                    <div className="imv-empty-row">
                      <Info size={13} strokeWidth={2} />
                      No GPS data found in this image
                    </div>
                  )}
                </Section>

                {/* Raw EXIF dump */}
                {Object.keys(exif).length > 0 && (
                  <Section icon={Cpu} title="All EXIF Tags" color="grey">
                    {Object.entries(exif)
                      .filter(([k]) => !["ExifIFD","GPSIFD","MakerNote"].includes(k))
                      .map(([k, v]) => (
                        <Row key={k} label={k} value={Array.isArray(v) ? v.map(n => typeof n === "number" ? n.toFixed(3) : n).join(", ") : String(v)} mono />
                      ))}
                  </Section>
                )}

                {Object.keys(exif).length === 0 && (
                  <div className="imv-no-exif">
                    <Info size={16} strokeWidth={2} />
                    <div>
                      <p className="imv-no-exif-title">No EXIF data found</p>
                      <p className="imv-no-exif-sub">This image may be a PNG, screenshot, or had its metadata stripped. File info above is still available.</p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          <div className="imv-privacy">
            <CheckCircle size={13} strokeWidth={2.5} />
            <span>100% private — images are processed entirely in your browser. Nothing is uploaded to any server.</span>
          </div>

        </div>
      </div>
    </>
  );
}

/* ── Aspect ratio helper ── */
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function aspectRatio(w, h) {
  const d = gcd(w, h);
  const rw = w / d, rh = h / d;
  if (rw > 20 || rh > 20) return `${(w / h).toFixed(2)}:1`;
  return `${rw}:${rh}`;
}
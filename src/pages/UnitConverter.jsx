/* eslint-disable no-unused-vars */
import { useState, useCallback } from "react";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import "./UnitConverter.css";
import { Helmet } from "react-helmet";

/* ── Conversion definitions ── */
const CATEGORIES = [
  {
    id: "length",
    label: "Length",
    emoji: "📏",
    units: [
      { id: "mm",  label: "Millimeter",   toBase: v => v / 1000,      fromBase: v => v * 1000 },
      { id: "cm",  label: "Centimeter",   toBase: v => v / 100,       fromBase: v => v * 100 },
      { id: "m",   label: "Meter",        toBase: v => v,             fromBase: v => v },
      { id: "km",  label: "Kilometer",    toBase: v => v * 1000,      fromBase: v => v / 1000 },
      { id: "in",  label: "Inch",         toBase: v => v * 0.0254,    fromBase: v => v / 0.0254 },
      { id: "ft",  label: "Foot",         toBase: v => v * 0.3048,    fromBase: v => v / 0.3048 },
      { id: "yd",  label: "Yard",         toBase: v => v * 0.9144,    fromBase: v => v / 0.9144 },
      { id: "mi",  label: "Mile",         toBase: v => v * 1609.344,  fromBase: v => v / 1609.344 },
    ],
  },
  {
    id: "weight",
    label: "Weight",
    emoji: "⚖️",
    units: [
      { id: "mg",  label: "Milligram",    toBase: v => v / 1e6,       fromBase: v => v * 1e6 },
      { id: "g",   label: "Gram",         toBase: v => v / 1000,      fromBase: v => v * 1000 },
      { id: "kg",  label: "Kilogram",     toBase: v => v,             fromBase: v => v },
      { id: "t",   label: "Metric Ton",   toBase: v => v * 1000,      fromBase: v => v / 1000 },
      { id: "oz",  label: "Ounce",        toBase: v => v * 0.028349,  fromBase: v => v / 0.028349 },
      { id: "lb",  label: "Pound",        toBase: v => v * 0.453592,  fromBase: v => v / 0.453592 },
      { id: "st",  label: "Stone",        toBase: v => v * 6.35029,   fromBase: v => v / 6.35029 },
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    emoji: "🌡️",
    units: [
      { id: "c",  label: "Celsius",    toBase: v => v,                     fromBase: v => v },
      { id: "f",  label: "Fahrenheit", toBase: v => (v - 32) * 5 / 9,     fromBase: v => v * 9 / 5 + 32 },
      { id: "k",  label: "Kelvin",     toBase: v => v - 273.15,            fromBase: v => v + 273.15 },
    ],
  },
  {
    id: "area",
    label: "Area",
    emoji: "▭",
    units: [
      { id: "mm2", label: "mm²",         toBase: v => v / 1e6,       fromBase: v => v * 1e6 },
      { id: "cm2", label: "cm²",         toBase: v => v / 1e4,       fromBase: v => v * 1e4 },
      { id: "m2",  label: "m²",          toBase: v => v,             fromBase: v => v },
      { id: "km2", label: "km²",         toBase: v => v * 1e6,       fromBase: v => v / 1e6 },
      { id: "in2", label: "in²",         toBase: v => v * 0.000645,  fromBase: v => v / 0.000645 },
      { id: "ft2", label: "ft²",         toBase: v => v * 0.0929,    fromBase: v => v / 0.0929 },
      { id: "ac",  label: "Acre",        toBase: v => v * 4046.86,   fromBase: v => v / 4046.86 },
      { id: "ha",  label: "Hectare",     toBase: v => v * 10000,     fromBase: v => v / 10000 },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    emoji: "🧪",
    units: [
      { id: "ml",  label: "Milliliter",  toBase: v => v / 1000,      fromBase: v => v * 1000 },
      { id: "l",   label: "Liter",       toBase: v => v,             fromBase: v => v },
      { id: "m3",  label: "m³",          toBase: v => v * 1000,      fromBase: v => v / 1000 },
      { id: "tsp", label: "Teaspoon",    toBase: v => v * 0.00493,   fromBase: v => v / 0.00493 },
      { id: "tbsp",label: "Tablespoon",  toBase: v => v * 0.01479,   fromBase: v => v / 0.01479 },
      { id: "cup", label: "Cup",         toBase: v => v * 0.2366,    fromBase: v => v / 0.2366 },
      { id: "pt",  label: "Pint",        toBase: v => v * 0.4732,    fromBase: v => v / 0.4732 },
      { id: "gal", label: "Gallon",      toBase: v => v * 3.78541,   fromBase: v => v / 3.78541 },
    ],
  },
  {
    id: "speed",
    label: "Speed",
    emoji: "💨",
    units: [
      { id: "mps",  label: "m/s",        toBase: v => v,             fromBase: v => v },
      { id: "kph",  label: "km/h",       toBase: v => v / 3.6,      fromBase: v => v * 3.6 },
      { id: "mph",  label: "mph",        toBase: v => v * 0.44704,  fromBase: v => v / 0.44704 },
      { id: "knot", label: "Knot",       toBase: v => v * 0.51444,  fromBase: v => v / 0.51444 },
      { id: "fps",  label: "ft/s",       toBase: v => v * 0.3048,   fromBase: v => v / 0.3048 },
    ],
  },
  {
    id: "data",
    label: "Data",
    emoji: "💾",
    units: [
      { id: "b",   label: "Bit",         toBase: v => v,             fromBase: v => v },
      { id: "B",   label: "Byte",        toBase: v => v * 8,         fromBase: v => v / 8 },
      { id: "KB",  label: "Kilobyte",    toBase: v => v * 8000,      fromBase: v => v / 8000 },
      { id: "MB",  label: "Megabyte",    toBase: v => v * 8e6,       fromBase: v => v / 8e6 },
      { id: "GB",  label: "Gigabyte",    toBase: v => v * 8e9,       fromBase: v => v / 8e9 },
      { id: "TB",  label: "Terabyte",    toBase: v => v * 8e12,      fromBase: v => v / 8e12 },
    ],
  },
  {
    id: "time",
    label: "Time",
    emoji: "⏱️",
    units: [
      { id: "ms",  label: "Millisecond", toBase: v => v / 1000,      fromBase: v => v * 1000 },
      { id: "s",   label: "Second",      toBase: v => v,             fromBase: v => v },
      { id: "min", label: "Minute",      toBase: v => v * 60,        fromBase: v => v / 60 },
      { id: "hr",  label: "Hour",        toBase: v => v * 3600,      fromBase: v => v / 3600 },
      { id: "day", label: "Day",         toBase: v => v * 86400,     fromBase: v => v / 86400 },
      { id: "wk",  label: "Week",        toBase: v => v * 604800,    fromBase: v => v / 604800 },
      { id: "yr",  label: "Year",        toBase: v => v * 31536000,  fromBase: v => v / 31536000 },
    ],
  },
];

function convert(value, fromUnit, toUnit, category) {
  if (!value || isNaN(value)) return "";
  const cat = CATEGORIES.find(c => c.id === category);
  if (!cat) return "";
  const from = cat.units.find(u => u.id === fromUnit);
  const to   = cat.units.find(u => u.id === toUnit);
  if (!from || !to) return "";
  const base   = from.toBase(parseFloat(value));
  const result = to.fromBase(base);
  if (!isFinite(result)) return "—";
  // Smart formatting
  if (Math.abs(result) >= 1e10 || (Math.abs(result) < 1e-6 && result !== 0)) {
    return result.toExponential(6);
  }
  const decimals = Math.abs(result) >= 1000 ? 2 : Math.abs(result) >= 1 ? 6 : 8;
  return parseFloat(result.toPrecision(8)).toString();
}

export default function UnitConverter() {
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit,   setToUnit]   = useState("ft");
  const [input,    setInput]    = useState("");
  const [flipped,  setFlipped]  = useState(false);

  const cat    = CATEGORIES.find(c => c.id === category);
  const output = convert(input, fromUnit, toUnit, category);

  const handleCategoryChange = (id) => {
    const newCat = CATEGORIES.find(c => c.id === id);
    setCategory(id);
    setFromUnit(newCat.units[0].id);
    setToUnit(newCat.units[1]?.id || newCat.units[0].id);
    setInput("");
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFlipped(f => !f);
    // Also swap input/output
    if (output && output !== "—") setInput(output);
  };

  const handleReset = () => { setInput(""); };

  const fromLabel = cat?.units.find(u => u.id === fromUnit)?.label || "";
  const toLabel   = cat?.units.find(u => u.id === toUnit)?.label || "";

  return (
    <>
    <Helmet>
      <title>Free Unit Converter Online – Length, Weight, Temperature & More</title>
      <meta name="description" content="Instantly convert units across length, weight, temperature, area, volume, speed, data storage, and time. Free online unit converter with all results shown." />
      <meta name="keywords" content="unit converter, length converter, weight converter, temperature converter, metric converter, online unit conversion, free converter tool" />
      <link rel="canonical" href="https://shauryatools.vercel.app/unit-converter" />
    </Helmet>
    <div className="uc-page">
      <div className="uc-inner">

        {/* Header */}
        <div className="uc-header">
          <div className="uc-icon">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <span className="uc-cat-badge">Developer Tools</span>
            <h1>Unit Converter</h1>
            <p>Instant conversions across length, weight, temperature, and more.</p>
          </div>
        </div>

        {/* Category Picker */}
        <div className="uc-card">
          <div className="uc-label-row">
            <label className="uc-label">Category</label>
          </div>
          <div className="uc-categories">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`uc-cat-btn ${category === c.id ? "uc-cat-on" : ""}`}
                onClick={() => handleCategoryChange(c.id)}
              >
                <span className="uc-cat-emoji">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Converter Card */}
        <div className="uc-card uc-converter-card">

          {/* From */}
          <div className="uc-field">
            <div className="uc-label-row">
              <label className="uc-label">From</label>
              <span className="uc-unit-label">{fromLabel}</span>
            </div>
            <div className="uc-input-row">
              <input
                className="uc-input"
                type="number"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter value…"
                autoFocus
              />
              <select
                className="uc-select"
                value={fromUnit}
                onChange={e => setFromUnit(e.target.value)}
              >
                {cat?.units.map(u => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap button */}
          <div className="uc-swap-row">
            <div className="uc-swap-line" />
            <button
              className={`uc-swap-btn ${flipped ? "uc-swap-flipped" : ""}`}
              onClick={handleSwap}
              title="Swap units"
            >
              <ArrowLeftRight size={16} />
            </button>
            <div className="uc-swap-line" />
          </div>

          {/* To */}
          <div className="uc-field">
            <div className="uc-label-row">
              <label className="uc-label">To</label>
              <span className="uc-unit-label">{toLabel}</span>
            </div>
            <div className="uc-input-row">
              <div className={`uc-output ${!output ? "uc-output-empty" : ""}`}>
                {output || <span className="uc-output-placeholder">Result will appear here</span>}
              </div>
              <select
                className="uc-select"
                value={toUnit}
                onChange={e => setToUnit(e.target.value)}
              >
                {cat?.units.map(u => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Formula display */}
          {input && output && output !== "—" && (
            <div className="uc-formula animate-in">
              <span className="uc-formula-text">
                <strong>{parseFloat(input).toLocaleString()}</strong> {fromLabel}
                {" = "}
                <strong>{output}</strong> {toLabel}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="uc-actions">
            <button className="uc-reset-btn" onClick={handleReset} disabled={!input}>
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Quick reference: all units for this category */}
        {input && parseFloat(input) !== 0 && (
          <div className="uc-card animate-in">
            <label className="uc-label">All {cat?.label} Conversions</label>
            <p className="uc-hint">for {parseFloat(input).toLocaleString()} {fromLabel}</p>
            <div className="uc-all-grid">
              {cat?.units.map(u => {
                const val = convert(input, fromUnit, u.id, category);
                const isActive = u.id === toUnit;
                return (
                  <button
                    key={u.id}
                    className={`uc-all-item ${isActive ? "uc-all-active" : ""}`}
                    onClick={() => setToUnit(u.id)}
                    title={`Switch output to ${u.label}`}
                  >
                    <span className="uc-all-val">{val || "—"}</span>
                    <span className="uc-all-unit">{u.label}</span>
                  </button>
   
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
     </>
  );
}
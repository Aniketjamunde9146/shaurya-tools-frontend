import { useState } from "react";
import { Helmet } from "react-helmet";
import { Activity, RefreshCw } from "lucide-react";
import "./BmiCalculator.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/bmi-calculator`;

const BMI_RANGES = [
  { label: "Underweight",      min: 0,    max: 18.5, color: "blue",   desc: "Below 18.5" },
  { label: "Normal weight",    min: 18.5, max: 25,   color: "green",  desc: "18.5 – 24.9" },
  { label: "Overweight",       min: 25,   max: 30,   color: "orange", desc: "25 – 29.9" },
  { label: "Obese",            min: 30,   max: 40,   color: "red",    desc: "30 and above" },
];

function getCategory(bmi) {
  return BMI_RANGES.find(r => bmi >= r.min && bmi < r.max) || BMI_RANGES[BMI_RANGES.length - 1];
}

function calcBMI(weight, height, unit) {
  if (!weight || !height || isNaN(weight) || isNaN(height)) return null;
  const w = parseFloat(weight);
  const h = parseFloat(height);
  if (w <= 0 || h <= 0) return null;
  if (unit === "metric") {
    const hm = h / 100;
    return w / (hm * hm);
  } else {
    return (w / (h * h)) * 703;
  }
}

function bmiToPercent(bmi) {
  const clamped = Math.max(10, Math.min(45, bmi));
  return ((clamped - 10) / 35) * 100;
}

export default function BMICalculator() {
  const [unit,   setUnit]   = useState("metric");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [feet,   setFeet]   = useState("");
  const [inches, setInches] = useState("");

  const heightInches = unit === "imperial" ? (parseFloat(feet || 0) * 12 + parseFloat(inches || 0)) : null;
  const bmi = unit === "metric"
    ? calcBMI(weight, height, "metric")
    : calcBMI(weight, heightInches, "imperial");

  const category  = bmi ? getCategory(bmi) : null;
  const pct       = bmi ? bmiToPercent(bmi) : null;

  const handleReset = () => {
    setWeight(""); setHeight(""); setFeet(""); setInches("");
  };

  const handleUnit = (u) => {
    setUnit(u);
    setWeight(""); setHeight(""); setFeet(""); setInches("");
  };

  let healthyRange = null;
  if (unit === "metric" && height) {
    const hm = parseFloat(height) / 100;
    if (hm > 0) {
      healthyRange = {
        low:  (18.5 * hm * hm).toFixed(1),
        high: (24.9 * hm * hm).toFixed(1),
        unit: "kg",
      };
    }
  } else if (unit === "imperial" && heightInches) {
    if (heightInches > 0) {
      healthyRange = {
        low:  ((18.5 * heightInches * heightInches) / 703).toFixed(1),
        high: ((24.9 * heightInches * heightInches) / 703).toFixed(1),
        unit: "lbs",
      };
    }
  }

  return (
    <>
      <Helmet>
        <title>Free BMI Calculator – Body Mass Index Calculator Online | ShauryaTools</title>
        <meta
          name="description"
          content="Calculate your Body Mass Index (BMI) instantly. Supports metric and imperial units. See your BMI category, healthy weight range, and visual gauge. Free, no signup."
        />
        <meta
          name="keywords"
          content="BMI calculator, body mass index calculator, free BMI calculator, online BMI, healthy weight calculator, BMI metric imperial"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Free BMI Calculator – Body Mass Index Online" />
        <meta property="og:description" content="Calculate your BMI instantly with metric or imperial units. Free online tool." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free BMI Calculator Online" />
        <meta name="twitter:description" content="Calculate your Body Mass Index in seconds. Metric & imperial supported." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "BMI Calculator",
            "url": PAGE_URL,
            "applicationCategory": "HealthApplication",
            "operatingSystem": "All",
            "description": "Free online BMI calculator. Calculate body mass index in metric or imperial units and see your health category.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="bmi-page">
        <div className="bmi-inner">

          {/* Header */}
          <div className="bmi-header">
            <div className="bmi-icon">
              <Activity size={20} />
            </div>
            <div>
              <span className="bmi-cat-badge">Health Tools</span>
              <h1>BMI Calculator</h1>
              <p>Calculate your Body Mass Index and see where you fall on the scale.</p>
            </div>
          </div>

          {/* Input Card */}
          <div className="bmi-card">

            <div className="bmi-label-row">
              <label className="bmi-label">Unit System</label>
            </div>
            <div className="bmi-tabs">
              <button
                className={`bmi-tab ${unit === "metric" ? "bmi-tab-on" : ""}`}
                onClick={() => handleUnit("metric")}
              >Metric (kg, cm)</button>
              <button
                className={`bmi-tab ${unit === "imperial" ? "bmi-tab-on" : ""}`}
                onClick={() => handleUnit("imperial")}
              >Imperial (lbs, ft)</button>
            </div>

            <div className="bmi-divider" />

            <div className="bmi-field">
              <label className="bmi-label">
                Weight <span className="bmi-sublabel">{unit === "metric" ? "kg" : "lbs"}</span>
              </label>
              <input
                className="bmi-input"
                type="number"
                min="1"
                placeholder={unit === "metric" ? "e.g. 70" : "e.g. 154"}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                autoFocus
              />
            </div>

            <div className="bmi-field">
              <label className="bmi-label">
                Height <span className="bmi-sublabel">{unit === "metric" ? "cm" : "ft & in"}</span>
              </label>
              {unit === "metric" ? (
                <input
                  className="bmi-input"
                  type="number"
                  min="1"
                  placeholder="e.g. 175"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                />
              ) : (
                <div className="bmi-height-row">
                  <div className="bmi-height-field">
                    <input
                      className="bmi-input"
                      type="number"
                      min="0"
                      placeholder="5"
                      value={feet}
                      onChange={e => setFeet(e.target.value)}
                    />
                    <span className="bmi-height-unit">ft</span>
                  </div>
                  <div className="bmi-height-field">
                    <input
                      className="bmi-input"
                      type="number"
                      min="0"
                      max="11"
                      placeholder="9"
                      value={inches}
                      onChange={e => setInches(e.target.value)}
                    />
                    <span className="bmi-height-unit">in</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bmi-actions">
              <button className="bmi-reset-btn" onClick={handleReset} disabled={!weight && !height && !feet && !inches}>
                <RefreshCw size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Result Card */}
          {bmi && category && (
            <div className="bmi-card bmi-result-card animate-in">

              <div className="bmi-score-row">
                <div className={`bmi-score bmi-score-${category.color}`}>
                  {bmi.toFixed(1)}
                </div>
                <div className="bmi-score-info">
                  <span className={`bmi-category-badge bmi-badge-${category.color}`}>
                    {category.label}
                  </span>
                  <p className="bmi-score-desc">Your BMI is <strong>{bmi.toFixed(1)}</strong></p>
                </div>
              </div>

              <div className="bmi-gauge-wrap">
                <div className="bmi-gauge-track">
                  <div className="bmi-gauge-segment bmi-seg-blue"   style={{ width: "24.3%" }} />
                  <div className="bmi-gauge-segment bmi-seg-green"  style={{ width: "18.6%" }} />
                  <div className="bmi-gauge-segment bmi-seg-orange" style={{ width: "14.3%" }} />
                  <div className="bmi-gauge-segment bmi-seg-red"    style={{ width: "42.8%" }} />
                  <div
                    className={`bmi-gauge-needle bmi-needle-${category.color}`}
                    style={{ left: `${pct}%` }}
                  />
                </div>
                <div className="bmi-gauge-labels">
                  <span>10</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>45+</span>
                </div>
              </div>

              <div className="bmi-ranges">
                {BMI_RANGES.map(r => (
                  <div
                    key={r.label}
                    className={`bmi-range-row ${category.label === r.label ? `bmi-range-active bmi-active-${r.color}` : ""}`}
                  >
                    <span className={`bmi-range-dot bmi-dot-${r.color}`} />
                    <span className="bmi-range-label">{r.label}</span>
                    <span className="bmi-range-val">{r.desc}</span>
                  </div>
                ))}
              </div>

              {healthyRange && (
                <div className="bmi-healthy-hint">
                  <span className="bmi-healthy-icon">✓</span>
                  <span>
                    Healthy weight for your height:{" "}
                    <strong>{healthyRange.low} – {healthyRange.high} {healthyRange.unit}</strong>
                  </span>
                </div>
              )}

              <p className="bmi-disclaimer">
                BMI is a screening tool, not a diagnostic measure. Consult a healthcare professional for a full health assessment.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
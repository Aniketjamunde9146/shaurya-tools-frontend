import { useState } from "react";
import "./FuelCalculator.css";
import { Helmet } from "react-helmet";
import {
  Fuel,
  MapPin,
  Gauge,
  IndianRupee,
  Calculator,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Navigation,
  Repeat,
  Car,
  Target,
} from "lucide-react";

/* ── Helpers ── */
function fmt2(n) { return n.toFixed(2); }
function fmtN(n) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/* ── Vehicle presets ── */
const VEHICLES = [
  { id: "bike",    label: "Bike",      icon: "🏍️", mileage: 45 },
  { id: "scooter", label: "Scooter",   icon: "🛵", mileage: 55 },
  { id: "car",     label: "Hatchback", icon: "🚗", mileage: 18 },
  { id: "sedan",   label: "Sedan",     icon: "🚙", mileage: 15 },
  { id: "suv",     label: "SUV",       icon: "🚐", mileage: 12 },
  { id: "custom",  label: "Custom",    icon: "⚙️", mileage: 0  },
];

const FUEL_TYPES = [
  { id: "petrol",  label: "Petrol",   price: 106.31 },
  { id: "diesel",  label: "Diesel",   price: 92.76  },
  { id: "cng",     label: "CNG",      price: 80.00  },
  { id: "custom",  label: "Custom",   price: 0      },
];

const TRIP_TYPES = [
  { id: "one-way",   label: "One Way"   },
  { id: "round",     label: "Round Trip"},
];

/* ── Calculation ── */
function calcFuel({ distance, mileage, fuelPrice, trips }) {
  const totalDist  = distance * trips;
  const fuelNeeded = totalDist / mileage;
  const totalCost  = fuelNeeded * fuelPrice;
  const costPerKm  = totalCost / totalDist;
  return { totalDist, fuelNeeded, totalCost, costPerKm };
}

/* ── Main Component ── */
export default function FuelCalculator() {
  const [vehicle,      setVehicle]    = useState("car");
  const [mileage,      setMileage]    = useState("18");
  const [fuelType,     setFuelType]   = useState("petrol");
  const [fuelPrice,    setFuelPrice]  = useState("106.31");
  const [distance,     setDistance]   = useState("");
  const [tripType,     setTripType]   = useState("one-way");
  const [days,         setDays]       = useState("1");
  const [result,       setResult]     = useState(null);
  const [error,        setError]      = useState("");
  const [copied,       setCopied]     = useState(false);

  /* Sync vehicle mileage preset */
  function handleVehicle(v) {
    setVehicle(v.id);
    if (v.id !== "custom") setMileage(String(v.mileage));
    setResult(null); setError("");
  }

  /* Sync fuel price preset */
  function handleFuelType(f) {
    setFuelType(f.id);
    if (f.id !== "custom") setFuelPrice(String(f.price));
    setResult(null); setError("");
  }

  function calculate() {
    setError("");
    const dist  = parseFloat(distance);
    const mil   = parseFloat(mileage);
    const fp    = parseFloat(fuelPrice);
    const d     = parseInt(days, 10) || 1;
    const trips = tripType === "round" ? 2 : 1;

    if (!dist || dist <= 0)  { setError("Enter a valid distance."); return; }
    if (!mil  || mil <= 0)   { setError("Enter a valid mileage (km/l)."); return; }
    if (!fp   || fp <= 0)    { setError("Enter a valid fuel price."); return; }

    const single   = calcFuel({ distance: dist, mileage: mil, fuelPrice: fp, trips });
    const daily    = calcFuel({ distance: dist, mileage: mil, fuelPrice: fp, trips: trips * d });
    const monthly  = calcFuel({ distance: dist, mileage: mil, fuelPrice: fp, trips: trips * 26 });
    const yearly   = calcFuel({ distance: dist, mileage: mil, fuelPrice: fp, trips: trips * 312 });

    setResult({ dist, mil, fp, trips, days: d, tripType, single, daily, monthly, yearly });
  }

  function handleReset() {
    setVehicle("car"); setMileage("18"); setFuelType("petrol");
    setFuelPrice("106.31"); setDistance(""); setTripType("one-way");
    setDays("1"); setResult(null); setError(""); setCopied(false);
  }

  function handleCopy() {
    if (!result) return;
    const r = result;
    const lines = [
      `Fuel Expense Summary`,
      `Distance      : ${r.dist} km (${r.tripType === "round" ? "Round Trip" : "One Way"})`,
      `Mileage       : ${r.mil} km/l`,
      `Fuel Price    : ₹${r.fp}/litre`,
      ``,
      `Per Trip      : ₹${fmtN(r.single.totalCost)} (${fmt2(r.single.fuelNeeded)}L)`,
      `Daily (${r.days}d)   : ₹${fmtN(r.daily.totalCost)} (${fmt2(r.daily.fuelNeeded)}L)`,
      `Monthly (26d) : ₹${fmtN(r.monthly.totalCost)} (${fmt2(r.monthly.fuelNeeded)}L)`,
      `Yearly        : ₹${fmtN(r.yearly.totalCost)} (${fmt2(r.yearly.fuelNeeded)}L)`,
      `Cost per km   : ₹${fmt2(r.single.costPerKm)}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const canCalc = distance && mileage && fuelPrice;

  return (
    <>
      <Helmet>
        <title>Fuel Expense Calculator – Daily, Monthly & Trip Cost | ShauryaTools</title>
        <meta name="description" content="Calculate fuel cost for any trip. Enter distance, mileage, and fuel price to get per trip, daily, monthly and yearly fuel expenses. Supports petrol, diesel and CNG." />
        <meta name="keywords" content="fuel cost calculator, petrol expense calculator, fuel expense calculator, trip fuel cost, mileage calculator India, daily fuel cost" />
        <link rel="canonical" href="https://shauryatools.vercel.app/fuel-calculator" />
      </Helmet>

      <div className="fc-page">
        <div className="fc-inner">

          {/* ── Header ── */}
          <div className="fc-header">
            <div className="fc-icon"><Fuel size={22} strokeWidth={2} /></div>
            <div>
              <span className="fc-cat">Finance Tools</span>
              <h1>Fuel Expense Calculator</h1>
              <p>Calculate your trip fuel cost, daily commute spend, and monthly fuel budget in seconds.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="fc-card">

            {/* Vehicle type */}
            <div className="fc-field">
              <div className="fc-label"><Car size={14} strokeWidth={2.5} className="fc-lbl-icon" />Vehicle Type</div>
              <div className="fc-vehicle-grid">
                {VEHICLES.map(v => (
                  <button
                    key={v.id}
                    className={`fc-vehicle-btn ${vehicle === v.id ? "fc-vehicle-on" : ""}`}
                    onClick={() => handleVehicle(v)}
                  >
                    <span className="fc-vehicle-emoji">{v.icon}</span>
                    <span className="fc-vehicle-label">{v.label}</span>
                    {v.mileage > 0 && <span className="fc-vehicle-mil">{v.mileage} km/l</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="fc-divider" />

            {/* Mileage + Fuel type row */}
            <div className="fc-row-2">
              <div className="fc-field">
                <div className="fc-label"><Gauge size={14} strokeWidth={2.5} className="fc-lbl-icon" />Mileage (km/l)</div>
                <div className="fc-input-wrap">
                  <input
                    className="fc-input"
                    type="number" min="1"
                    placeholder="e.g. 18"
                    value={mileage}
                    onChange={e => { setMileage(e.target.value); setVehicle("custom"); setResult(null); setError(""); }}
                  />
                  <span className="fc-suffix">km/l</span>
                </div>
              </div>

              <div className="fc-field">
                <div className="fc-label"><IndianRupee size={14} strokeWidth={2.5} className="fc-lbl-icon" />Fuel Price (₹/L)</div>
                <div className="fc-input-wrap">
                  <span className="fc-prefix">₹</span>
                  <input
                    className="fc-input fc-input-has-prefix"
                    type="number" min="1"
                    placeholder="e.g. 106"
                    value={fuelPrice}
                    onChange={e => { setFuelPrice(e.target.value); setFuelType("custom"); setResult(null); setError(""); }}
                  />
                </div>
              </div>
            </div>

            {/* Fuel type chips */}
            <div className="fc-field">
              <div className="fc-label"><Fuel size={14} strokeWidth={2.5} className="fc-lbl-icon" />Fuel Type <span className="fc-lbl-sub">(auto-fills price)</span></div>
              <div className="fc-chips">
                {FUEL_TYPES.map(f => (
                  <button
                    key={f.id}
                    className={`fc-chip ${fuelType === f.id ? "fc-chip-on" : ""}`}
                    onClick={() => handleFuelType(f)}
                  >
                    {f.label}
                    {f.price > 0 && <span className="fc-chip-price">₹{f.price}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="fc-divider" />

            {/* Distance + trip type */}
            <div className="fc-row-2">
              <div className="fc-field">
                <div className="fc-label"><MapPin size={14} strokeWidth={2.5} className="fc-lbl-icon" />Distance (km)</div>
                <div className="fc-input-wrap">
                  <input
                    className="fc-input"
                    type="number" min="1"
                    placeholder="e.g. 25"
                    value={distance}
                    onChange={e => { setDistance(e.target.value); setResult(null); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && calculate()}
                  />
                  <span className="fc-suffix">km</span>
                </div>
              </div>

              <div className="fc-field">
                <div className="fc-label"><Navigation size={14} strokeWidth={2.5} className="fc-lbl-icon" />Trip Type</div>
                <div className="fc-toggle">
                  {TRIP_TYPES.map(t => (
                    <button
                      key={t.id}
                      className={`fc-toggle-btn ${tripType === t.id ? "fc-toggle-on" : ""}`}
                      onClick={() => { setTripType(t.id); setResult(null); }}
                    >
                      {t.id === "round" && <Repeat size={12} strokeWidth={2.5} />}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Days per week */}
            <div className="fc-field">
              <div className="fc-label"><Target size={14} strokeWidth={2.5} className="fc-lbl-icon" />Trips per Day <span className="fc-lbl-sub">(for daily estimate)</span></div>
              <div className="fc-chips">
                {["1","2","3","4","5"].map(d => (
                  <button
                    key={d}
                    className={`fc-chip ${days === d ? "fc-chip-on" : ""}`}
                    onClick={() => { setDays(d); setResult(null); }}
                  >
                    {d}×
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="fc-error"><AlertCircle size={14} strokeWidth={2.5} />{error}</div>
            )}

            <button className="fc-submit" onClick={calculate} disabled={!canCalc}>
              <Calculator size={16} strokeWidth={2} />
              Calculate Fuel Cost
            </button>
          </div>

          {/* ── Results ── */}
          {result && (
            <>
              {/* Hero */}
              <div className="fc-result-hero fc-animate">
                <div className="fc-hero-left">
                  <span className="fc-hero-label">Cost Per Trip</span>
                  <div className="fc-hero-amount">₹{fmtN(result.single.totalCost)}</div>
                  <p className="fc-hero-sub">
                    {fmt2(result.single.fuelNeeded)}L fuel · {result.single.totalDist} km
                    {result.tripType === "round" ? " (round trip)" : ""}
                  </p>
                </div>
                <div className="fc-hero-right">
                  <div className="fc-hero-stat">
                    <span className="fc-hero-stat-val">₹{fmt2(result.single.costPerKm)}</span>
                    <span className="fc-hero-stat-lbl">per km</span>
                  </div>
                </div>
              </div>

              {/* Period cards */}
              <div className="fc-period-grid fc-animate">
                {[
                  { label: "Per Trip",       val: result.single.totalCost,  fuel: result.single.fuelNeeded,  sub: `${result.single.totalDist} km`,     color: "accent"  },
                  { label: "Daily",          val: result.daily.totalCost,   fuel: result.daily.fuelNeeded,   sub: `${result.days} trip${result.days > 1 ? "s" : ""}·day`, color: "violet"  },
                  { label: "Monthly",        val: result.monthly.totalCost, fuel: result.monthly.fuelNeeded, sub: "26 working days",                   color: "amber"   },
                  { label: "Yearly",         val: result.yearly.totalCost,  fuel: result.yearly.fuelNeeded,  sub: "312 working days",                  color: "green"   },
                ].map((p, i) => (
                  <div key={i} className={`fc-period-card fc-period-${p.color}`}>
                    <span className="fc-period-label">{p.label}</span>
                    <span className="fc-period-val">₹{fmtN(p.val)}</span>
                    <span className="fc-period-fuel">{fmt2(p.fuel)}L</span>
                    <span className="fc-period-sub">{p.sub}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="fc-card fc-animate">
                <div className="fc-card-title">
                  <BarChart2 size={15} strokeWidth={2.5} />
                  Full Breakdown
                </div>

                {/* Visual bar */}
                <div className="fc-bar-section">
                  {[
                    { label: "Per Trip",  val: result.single.totalCost,  color: "var(--fg-accent)" },
                    { label: "Monthly",   val: result.monthly.totalCost, color: "var(--fg-amber)"  },
                    { label: "Yearly",    val: result.yearly.totalCost,  color: "var(--fg-violet)" },
                  ].map((b, i) => {
                    const pct = (b.val / result.yearly.totalCost) * 100;
                    return (
                      <div key={i} className="fc-bar-row">
                        <span className="fc-bar-lbl">{b.label}</span>
                        <div className="fc-bar-track">
                          <div className="fc-bar-fill" style={{ width: `${pct}%`, background: b.color }} />
                        </div>
                        <span className="fc-bar-val">₹{fmtN(b.val)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="fc-divider" />

                {/* Details table */}
                <div className="fc-detail-header">
                  <span>Period</span>
                  <span>Distance</span>
                  <span>Fuel</span>
                  <span>Cost</span>
                </div>
                <div className="fc-details">
                  {[
                    { label: "Per Trip",  r: result.single  },
                    { label: `Daily (${result.days}×)`, r: result.daily   },
                    { label: "Monthly",   r: result.monthly },
                    { label: "Yearly",    r: result.yearly  },
                  ].map((row, i) => (
                    <div key={i} className={`fc-detail-row ${i === 3 ? "fc-detail-total" : ""}`}>
                      <span className="fc-detail-label">{row.label}</span>
                      <span className="fc-detail-dist">{fmtN(row.r.totalDist)} km</span>
                      <span className="fc-detail-fuel">{fmt2(row.r.fuelNeeded)} L</span>
                      <span className="fc-detail-cost">₹{fmtN(row.r.totalCost)}</span>
                    </div>
                  ))}
                </div>

                <div className="fc-divider" />

                {/* Footer */}
                <div className="fc-footer">
                  <span className="fc-footer-note">
                    {result.mil} km/l · ₹{result.fp}/L · {result.dist}km
                    {result.tripType === "round" ? " RT" : ""}
                  </span>
                  <div className="fc-footer-btns">
                    <button className="fc-action-btn" onClick={handleReset}>
                      <RefreshCw size={13} strokeWidth={2.5} />New
                    </button>
                    <button className={`fc-copy-btn ${copied ? "fc-copy-done" : ""}`} onClick={handleCopy}>
                      {copied
                        ? <><Check size={13} strokeWidth={2.5} />Copied!</>
                        : <><Copy size={13} strokeWidth={2.5} />Copy Results</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="fc-card fc-animate fc-tips-card">
                <div className="fc-card-title">
                  <TrendingUp size={15} strokeWidth={2.5} />
                  Fuel Saving Tips
                </div>
                <div className="fc-tips">
                  {[
                    { tip: "Maintain optimal tyre pressure to improve mileage by up to 3%." },
                    { tip: "Avoid aggressive acceleration — smooth driving saves fuel." },
                    { tip: "Service your vehicle regularly; clogged filters reduce mileage." },
                    { tip: "Turn off the engine at long signals — idling wastes fuel." },
                    { tip: "Plan your route to avoid traffic — stop-start driving is fuel-heavy." },
                  ].map((t, i) => (
                    <div key={i} className="fc-tip-row">
                      <span className="fc-tip-num">{i + 1}</span>
                      <span className="fc-tip-text">{t.tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
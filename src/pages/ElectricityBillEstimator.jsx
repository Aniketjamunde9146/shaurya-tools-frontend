/* eslint-disable no-empty */
import { useState, useMemo } from "react";
import "./ElectricityBillEstimator.css";
import { Helmet } from "react-helmet";
import {
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingDown,
  BarChart2,
  CheckCircle2,
} from "lucide-react";

/* ── State slab rates ── */
const STATE_RATES = [
  { id: "maharashtra",  label: "Maharashtra",    slabs: [[0,100,3.79],[101,300,6.53],[301,500,9.57],[501,Infinity,11.19]] },
  { id: "delhi",        label: "Delhi",          slabs: [[0,200,0],[201,400,3.0],[401,800,4.5],[801,1200,6.5],[1201,Infinity,8.0]] },
  { id: "karnataka",    label: "Karnataka",      slabs: [[0,30,3.15],[31,100,5.55],[101,200,6.55],[201,Infinity,7.60]] },
  { id: "tamilnadu",    label: "Tamil Nadu",     slabs: [[0,100,0],[101,200,1.5],[201,500,3.5],[501,Infinity,5.75]] },
  { id: "gujarat",      label: "Gujarat",        slabs: [[0,50,1.90],[51,150,3.30],[151,250,4.70],[251,Infinity,6.10]] },
  { id: "rajasthan",    label: "Rajasthan",      slabs: [[0,50,3.0],[51,150,4.5],[151,300,6.5],[301,Infinity,7.25]] },
  { id: "up",           label: "Uttar Pradesh",  slabs: [[0,150,3.35],[151,300,4.90],[301,500,5.55],[501,Infinity,6.15]] },
  { id: "wb",           label: "West Bengal",    slabs: [[0,75,4.00],[76,200,5.30],[201,400,6.22],[401,Infinity,7.17]] },
  { id: "mp",           label: "Madhya Pradesh", slabs: [[0,50,2.90],[51,150,4.10],[151,300,5.60],[301,Infinity,6.65]] },
  { id: "punjab",       label: "Punjab",         slabs: [[0,100,4.19],[101,300,6.10],[301,500,6.94],[501,Infinity,7.55]] },
  { id: "custom",       label: "Custom Rate",    slabs: null },
];

/* ── Appliance presets with emoji (no Lucide needed) ── */
const APPLIANCE_PRESETS = [
  { id: "ac",          label: "Air Conditioner", emoji: "❄️",  watts: 1500, defaultHours: 8   },
  { id: "fridge",      label: "Refrigerator",    emoji: "🧊",  watts: 150,  defaultHours: 24  },
  { id: "tv",          label: "Television",      emoji: "📺",  watts: 100,  defaultHours: 6   },
  { id: "fan",         label: "Ceiling Fan",     emoji: "🌀",  watts: 75,   defaultHours: 10  },
  { id: "light_led",   label: "LED Bulb",        emoji: "💡",  watts: 10,   defaultHours: 8   },
  { id: "light_cfl",   label: "CFL Bulb",        emoji: "🔦",  watts: 20,   defaultHours: 8   },
  { id: "washer",      label: "Washing Machine", emoji: "🫧",  watts: 500,  defaultHours: 1   },
  { id: "microwave",   label: "Microwave",       emoji: "📡",  watts: 1200, defaultHours: 0.5 },
  { id: "desktop",     label: "Desktop PC",      emoji: "🖥️",  watts: 200,  defaultHours: 6   },
  { id: "laptop",      label: "Laptop",          emoji: "💻",  watts: 50,   defaultHours: 8   },
  { id: "airpurifier", label: "Air Purifier",    emoji: "🌬️",  watts: 50,   defaultHours: 8   },
  { id: "speaker",     label: "Music System",    emoji: "🔊",  watts: 30,   defaultHours: 3   },
  { id: "geyser",      label: "Geyser",          emoji: "🚿",  watts: 2000, defaultHours: 0.5 },
  { id: "iron",        label: "Iron",            emoji: "👔",  watts: 1000, defaultHours: 0.5 },
  { id: "custom",      label: "Custom Appliance",emoji: "⚡",  watts: null, defaultHours: null },
];

const FIXED_CHARGES = {
  maharashtra: 130, delhi: 125, karnataka: 50, tamilnadu: 40,
  gujarat: 95, rajasthan: 75, up: 60, wb: 70, mp: 65, punjab: 100, custom: 0,
};

const COLORS = ["#0d9488","#7c3aed","#d97706","#ef4444","#4f46e5","#059669","#ec4899","#f59e0b","#6366f1","#16a34a","#0ea5e9","#dc2626"];

function computeSlabBill(units, slabs) {
  if (!slabs || units <= 0) return 0;
  let bill = 0, remaining = units;
  for (const [from, to, rate] of slabs) {
    if (remaining <= 0) break;
    const size = to === Infinity ? remaining : to - from + 1;
    const use  = Math.min(remaining, size);
    bill += use * rate;
    remaining -= use;
  }
  return bill;
}

function fmtINR(n, dec = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: dec, maximumFractionDigits: dec,
  }).format(n || 0);
}
function fmtNum(n, dec = 1) { return Number(n).toFixed(dec); }

/* ── SVG Donut ── */
function DonutBreakdown({ items, size = 110 }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0) return null;
  const r = 38, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} className="eb-donut">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--grey-2)" strokeWidth={13} />
      {items.map((item, i) => {
        const pct  = item.value / total;
        const dash = `${pct * circ} ${circ}`;
        const rot  = offset * 360 - 90;
        offset += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={item.color}
            strokeWidth={13} strokeDasharray={dash}
            transform={`rotate(${rot} ${cx} ${cy})`}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        );
      })}
    </svg>
  );
}

/* ── Appliance Row ── */
function ApplianceRow({ app, onUpdate, onDelete }) {
  return (
    <div className="eb-app-row">
      <div className="eb-app-emoji-wrap" style={{ background: app.color + "18", borderColor: app.color + "44" }}>
        <span className="eb-app-emoji">{app.emoji}</span>
      </div>
      <span className="eb-app-name">{app.label}</span>
      <div className="eb-app-fields">
        <div className="eb-app-field-wrap">
          <input className="eb-app-input" type="number" min="0"
            placeholder="Watts" value={app.watts}
            onChange={e => onUpdate(app.uid, "watts", e.target.value)} />
          <span className="eb-app-unit">W</span>
        </div>
        <span className="eb-app-times">×</span>
        <div className="eb-app-field-wrap">
          <input className="eb-app-input" type="number" min="0" step="0.5"
            placeholder="Hrs/day" value={app.hours}
            onChange={e => onUpdate(app.uid, "hours", e.target.value)} />
          <span className="eb-app-unit">hr</span>
        </div>
        <span className="eb-app-times">×</span>
        <div className="eb-app-field-wrap">
          <input className="eb-app-input" type="number" min="1" max="30"
            placeholder="Days" value={app.days}
            onChange={e => onUpdate(app.uid, "days", e.target.value)} />
          <span className="eb-app-unit">day</span>
        </div>
      </div>
      <span className="eb-app-kwh">
        {fmtNum((parseFloat(app.watts) * parseFloat(app.hours) * parseFloat(app.days)) / 1000, 2)} kWh
      </span>
      <button className="eb-app-del" onClick={() => onDelete(app.uid)}>
        <Trash2 size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ── Main Component ── */
export default function ElectricityBillEstimator() {
  const [state,          setState]      = useState("maharashtra");
  const [customRate,     setCustomRate] = useState("8");
  const [appliances,     setApps]       = useState([
    { uid: 1, id: "ac",        label: "Air Conditioner", emoji: "❄️",  watts: 1500, hours: 8,  days: 30, color: "#0d9488" },
    { uid: 2, id: "fridge",    label: "Refrigerator",    emoji: "🧊",  watts: 150,  hours: 24, days: 30, color: "#7c3aed" },
    { uid: 3, id: "fan",       label: "Ceiling Fan",     emoji: "🌀",  watts: 75,   hours: 10, days: 30, color: "#d97706" },
    { uid: 4, id: "light_led", label: "LED Bulb (×4)",   emoji: "💡",  watts: 40,   hours: 8,  days: 30, color: "#4f46e5" },
    { uid: 5, id: "tv",        label: "Television",      emoji: "📺",  watts: 100,  hours: 6,  days: 30, color: "#ef4444" },
  ]);
  const [selectedPreset, setSelectedPreset] = useState("ac");
  const [activeTab,      setActiveTab]  = useState("bill");
  const [openFAQ,        setOpenFAQ]    = useState(null);

  function addAppliance() {
    const preset = APPLIANCE_PRESETS.find(p => p.id === selectedPreset);
    if (!preset) return;
    setApps(a => [...a, {
      uid: Date.now(), id: preset.id, label: preset.label, emoji: preset.emoji,
      watts: preset.watts ?? 100, hours: preset.defaultHours ?? 4, days: 30,
      color: COLORS[a.length % COLORS.length],
    }]);
  }

  function updateApp(uid, field, val) {
    setApps(a => a.map(ap => ap.uid === uid ? { ...ap, [field]: val } : ap));
  }
  function deleteApp(uid) { setApps(a => a.filter(ap => ap.uid !== uid)); }

  function handleReset() {
    setState("maharashtra"); setCustomRate("8"); setActiveTab("bill");
    setApps([
      { uid: 1, id: "ac",        label: "Air Conditioner", emoji: "❄️",  watts: 1500, hours: 8,  days: 30, color: "#0d9488" },
      { uid: 2, id: "fridge",    label: "Refrigerator",    emoji: "🧊",  watts: 150,  hours: 24, days: 30, color: "#7c3aed" },
      { uid: 3, id: "fan",       label: "Ceiling Fan",     emoji: "🌀",  watts: 75,   hours: 10, days: 30, color: "#d97706" },
      { uid: 4, id: "light_led", label: "LED Bulb (×4)",   emoji: "💡",  watts: 40,   hours: 8,  days: 30, color: "#4f46e5" },
      { uid: 5, id: "tv",        label: "Television",      emoji: "📺",  watts: 100,  hours: 6,  days: 30, color: "#ef4444" },
    ]);
  }

  const calc = useMemo(() => {
    const stateData    = STATE_RATES.find(s => s.id === state);
    const fixedCharge  = FIXED_CHARGES[state] || 0;
    const appData      = appliances.map(ap => {
      const kwh = (parseFloat(ap.watts) * parseFloat(ap.hours) * parseFloat(ap.days)) / 1000;
      return { ...ap, kwh: isNaN(kwh) ? 0 : kwh };
    });
    const totalUnits   = appData.reduce((s, a) => s + a.kwh, 0);
    const energyCharge = state === "custom"
      ? totalUnits * (parseFloat(customRate) || 0)
      : computeSlabBill(totalUnits, stateData?.slabs);
    const tax          = energyCharge * 0.08;
    const totalBill    = energyCharge + fixedCharge + tax;

    const appWithCost  = [...appData].sort((a, b) => b.kwh - a.kwh).map(ap => ({
      ...ap,
      share: totalUnits > 0 ? (ap.kwh / totalUnits) * 100 : 0,
      cost:  totalUnits > 0 ? (ap.kwh / totalUnits) * energyCharge : 0,
    }));

    const tips = [];
    const ac = appData.find(a => a.id === "ac");
    if (ac && parseFloat(ac.hours) > 6) tips.push("Set your AC to 24°C instead of 18°C — each degree saves ~6% on cooling costs.");
    if (appData.find(a => a.id === "light_cfl")) tips.push("Switch CFL bulbs to LED — LEDs use 50–75% less energy for the same brightness.");
    const highDraw = appData.filter(a => parseFloat(a.watts) > 1000 && parseFloat(a.hours) > 2);
    if (highDraw.length > 0) tips.push(`${highDraw[0].label} is your biggest load — reducing by 1 hr/day saves significantly.`);
    if (totalUnits > 300) tips.push("You're in a high-consumption slab. A 10% usage cut can drop you to a cheaper rate tier.");
    if (tips.length === 0) tips.push("Your usage looks efficient! Consider solar panels to reduce grid dependency further.");

    return {
      totalUnits, energyCharge, fixedCharge, tax, totalBill, appWithCost, tips,
      donutItems: [
        { label: "Energy Charge", value: energyCharge, color: "var(--eb-accent)" },
        { label: "Fixed Charge",  value: fixedCharge,  color: "var(--eb-violet)" },
        { label: "Tax / Duty",    value: tax,           color: "var(--eb-amber)"  },
      ],
      avgPerDay:  totalBill / 30,
      avgPerUnit: totalUnits > 0 ? energyCharge / totalUnits : 0,
    };
  }, [appliances, state, customRate]);

  const faqs = [
    { q: "What is a slab tariff system?", a: "India's electricity boards use progressive slab rates — the more you consume, the higher the rate per unit. The first 100 units are cheapest, and higher slabs cost more. This encourages conservation and subsidises low-income households." },
    { q: "What is a 'unit' of electricity?", a: "One unit = 1 kWh (kilowatt-hour). A 1000W appliance running for 1 hour consumes 1 unit. A 100W bulb running for 10 hours also consumes 1 unit. Your electricity meter counts these units." },
    { q: "What are fixed charges on my bill?", a: "Fixed / meter charges are levied regardless of consumption — they cover maintaining the distribution network, meter reading, and billing infrastructure. They vary by state and connection type." },
    { q: "How accurate is this estimator?", a: "This tool uses publicly available slab rates for a close approximation. Actual bills may vary due to Time-of-Day tariffs, power factor surcharges, fuel adjustment charges, and local DISCOM variations." },
    { q: "How can I reduce my electricity bill the most?", a: "AC is typically the largest load. Setting it 2°C higher and using a 5-star rated unit can cut your bill by 20–30%. Replacing all CFL/incandescent with LED is the next highest-impact change." },
  ];

  return (
    <>
      <Helmet>
        <title>Electricity Bill Estimator India – Slab Rate Calculator | ShauryaTools</title>
        <meta name="description" content="Estimate your monthly electricity bill by appliance. Supports Indian state slab tariffs for Maharashtra, Delhi, Karnataka, Tamil Nadu and more. Free tool." />
        <meta name="keywords" content="electricity bill calculator, electricity bill estimator india, slab rate calculator, bijli bill calculator, electricity unit calculator" />
        <link rel="canonical" href="https://shauryatools.vercel.app/electricity-bill-estimator" />
      </Helmet>

      <div className="eb-page">
        <div className="eb-inner">

          {/* Header */}
          <div className="eb-header">
            <div className="eb-icon"><Zap size={20} strokeWidth={2} /></div>
            <div>
              <span className="eb-cat">Finance Tools</span>
              <h1>Electricity Bill Estimator</h1>
              <p>Add your appliances, pick your state — get an instant monthly bill estimate with slab rates, breakdown and saving tips.</p>
            </div>
          </div>

          {/* State Card */}
          <div className="eb-card">
            <div className="eb-field">
              <label className="eb-label">
                <span className="eb-label-emoji">🏛️</span> State / Tariff
              </label>
              <div className="eb-state-grid">
                {STATE_RATES.map(s => (
                  <button key={s.id}
                    className={`eb-state-btn ${state === s.id ? "eb-state-on" : ""}`}
                    onClick={() => setState(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
              {state === "custom" && (
                <div className="eb-custom-rate-row animate-in">
                  <span className="eb-custom-rate-label">Your flat rate per unit</span>
                  <div className="eb-rate-input-wrap">
                    <span className="eb-rupee-small">₹</span>
                    <input className="eb-rate-input" type="number" min="0" step="0.1"
                      value={customRate} onChange={e => setCustomRate(e.target.value)} />
                    <span className="eb-per-unit">/kWh</span>
                  </div>
                </div>
              )}
              {state !== "custom" && (
                <div className="eb-slab-pills">
                  {STATE_RATES.find(s2 => s2.id === state)?.slabs?.map(([from, to, rate], i) => (
                    <span key={i} className="eb-slab-pill">
                      {from}–{to === Infinity ? "∞" : to} units: ₹{rate}/kWh
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Appliances Card */}
          <div className="eb-card">
            <div className="eb-field">
              <label className="eb-label">
                <Zap size={14} strokeWidth={2.5} className="eb-lbl-icon" /> Appliances
              </label>
              <div className="eb-apps-wrap">
                <div className="eb-apps-header-row">
                  <span className="eb-apps-col eb-apps-col-name">Appliance</span>
                  <span className="eb-apps-col">Watts</span>
                  <span className="eb-apps-col">Hrs/Day</span>
                  <span className="eb-apps-col">Days</span>
                  <span className="eb-apps-col">kWh</span>
                  <span style={{ width: 28 }} />
                </div>
                {appliances.map(app => (
                  <ApplianceRow key={app.uid} app={app} onUpdate={updateApp} onDelete={deleteApp} />
                ))}
              </div>
              <div className="eb-add-row">
                <select className="eb-select" value={selectedPreset}
                  onChange={e => setSelectedPreset(e.target.value)}>
                  {APPLIANCE_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.label}{p.watts ? ` (${p.watts}W)` : ""}
                    </option>
                  ))}
                </select>
                <button className="eb-add-btn" onClick={addAppliance}>
                  <Plus size={14} strokeWidth={2.5} /> Add
                </button>
              </div>
            </div>

            <div className="eb-usage-strip">
              <div className="eb-usage-item">
                <span className="eb-usage-label">Total Units</span>
                <span className="eb-usage-val eb-val-accent">{fmtNum(calc.totalUnits, 1)} kWh</span>
              </div>
              <div className="eb-usage-sep" />
              <div className="eb-usage-item">
                <span className="eb-usage-label">Avg / Day</span>
                <span className="eb-usage-val">{fmtNum(calc.totalUnits / 30, 2)} kWh</span>
              </div>
              <div className="eb-usage-sep" />
              <div className="eb-usage-item">
                <span className="eb-usage-label">Energy Cost</span>
                <span className="eb-usage-val">{fmtINR(calc.energyCharge)}</span>
              </div>
              <div className="eb-usage-sep" />
              <div className="eb-usage-item">
                <span className="eb-usage-label">Est. Total Bill</span>
                <span className="eb-usage-val eb-val-big">{fmtINR(calc.totalBill)}</span>
              </div>
            </div>
          </div>

          {/* Results */}
          {calc.totalUnits > 0 && (
            <div className="eb-card animate-in">
              <div className="eb-result-top">
                <div className="eb-result-meta">
                  <span className="eb-badge">⚡ {fmtNum(calc.totalUnits, 1)} kWh / mo</span>
                  <span className="eb-badge eb-badge-rate">₹ {fmtINR(calc.avgPerUnit, 2)}/unit avg</span>
                </div>
                <div className="eb-result-right">
                  <div className="eb-tabs">
                    <button className={`eb-tab ${activeTab === "bill"       ? "eb-tab-on" : ""}`} onClick={() => setActiveTab("bill")}>Bill</button>
                    <button className={`eb-tab ${activeTab === "appliances" ? "eb-tab-on" : ""}`} onClick={() => setActiveTab("appliances")}>Appliances</button>
                    <button className={`eb-tab ${activeTab === "tips"       ? "eb-tab-on" : ""}`} onClick={() => setActiveTab("tips")}>Tips</button>
                  </div>
                  <button className="eb-action-btn" onClick={handleReset}>
                    <RefreshCw size={13} strokeWidth={2.5} /> Reset
                  </button>
                </div>
              </div>

              {/* Bill Tab */}
              {activeTab === "bill" && (
                <div className="eb-bill-tab animate-in">
                  <div className="eb-hero">
                    <div className="eb-hero-left">
                      <span className="eb-hero-label">Estimated Monthly Bill</span>
                      <span className="eb-hero-val">{fmtINR(calc.totalBill)}</span>
                      <span className="eb-hero-sub">{fmtINR(calc.avgPerDay, 2)} / day · {STATE_RATES.find(s => s.id === state)?.label}</span>
                    </div>
                    <DonutBreakdown items={calc.donutItems} size={110} />
                    <div className="eb-hero-right">
                      {calc.donutItems.map((it, i) => (
                        <div key={i} className="eb-donut-row">
                          <span className="eb-donut-dot" style={{ background: it.color }} />
                          <div>
                            <span className="eb-donut-label">{it.label}</span>
                            <span className="eb-donut-val">{fmtINR(it.value, 2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="eb-stats-grid">
                    {[
                      { label: "Energy Charge",   val: fmtINR(calc.energyCharge),          cls: "eb-stat-accent" },
                      { label: "Fixed Charge",    val: fmtINR(calc.fixedCharge),            cls: "eb-stat-violet" },
                      { label: "Tax / Duty (8%)", val: fmtINR(calc.tax),                    cls: "eb-stat-amber"  },
                      { label: "Total Bill",      val: fmtINR(calc.totalBill),              cls: "eb-stat-bold"   },
                      { label: "Avg Rate / Unit", val: fmtINR(calc.avgPerUnit, 2) + "/kWh", cls: ""               },
                      { label: "Cost / Day",      val: fmtINR(calc.avgPerDay, 2),           cls: ""               },
                    ].map((s, i) => (
                      <div key={i} className="eb-stat-card">
                        <span className="eb-stat-label">{s.label}</span>
                        <span className={`eb-stat-val ${s.cls}`}>{s.val}</span>
                      </div>
                    ))}
                  </div>

                  {state !== "custom" && (
                    <div className="eb-slab-breakdown">
                      <span className="eb-slab-title">
                        <BarChart2 size={13} strokeWidth={2.5} className="eb-slab-icon" /> Slab Breakdown
                      </span>
                      <div className="eb-slab-rows">
                        {STATE_RATES.find(s => s.id === state)?.slabs?.map(([from, to, rate], i) => {
                          const slabSize = to === Infinity ? Infinity : to - from + 1;
                          const slabUsed = Math.max(0, Math.min(calc.totalUnits - from, slabSize === Infinity ? calc.totalUnits : slabSize));
                          const slabCost = slabUsed * rate;
                          const active   = calc.totalUnits > from;
                          return active ? (
                            <div key={i} className="eb-slab-row eb-slab-active">
                              <span className="eb-slab-range">{from}–{to === Infinity ? "∞" : to} units</span>
                              <span className="eb-slab-rate">₹{rate}/kWh</span>
                              <div className="eb-slab-bar-wrap">
                                <div className="eb-slab-bar" style={{ width: `${Math.min(100,(slabUsed / Math.max(1, calc.totalUnits)) * 100)}%` }} />
                              </div>
                              <span className="eb-slab-units">{fmtNum(slabUsed, 1)} kWh</span>
                              <span className="eb-slab-cost">{fmtINR(slabCost)}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {calc.totalBill > 3000 && (
                    <div className="eb-warn-banner">
                      <span className="eb-warn-emoji">🔥</span>
                      <span>Your estimated bill is above ₹3,000. You're likely in the highest slab. Check the <strong>Tips</strong> tab to reduce consumption.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Appliances Tab */}
              {activeTab === "appliances" && (
                <div className="eb-apps-tab animate-in">
                  <p className="eb-apps-intro">Energy consumed and estimated cost per appliance this month.</p>
                  <div className="eb-apps-breakdown">
                    {calc.appWithCost.map(ap => (
                      <div key={ap.uid} className="eb-app-breakdown-row">
                        <div className="eb-app-bd-icon" style={{ background: ap.color + "18", borderColor: ap.color + "44" }}>
                          <span className="eb-app-emoji">{ap.emoji}</span>
                        </div>
                        <div className="eb-app-bd-info">
                          <span className="eb-app-bd-name">{ap.label}</span>
                          <span className="eb-app-bd-meta">{ap.watts}W · {ap.hours}h/day · {ap.days} days</span>
                        </div>
                        <div className="eb-app-bd-right">
                          <div className="eb-app-bd-bar-wrap">
                            <div className="eb-app-bd-bar" style={{ width: `${ap.share}%`, background: ap.color }} />
                          </div>
                          <div className="eb-app-bd-nums">
                            <span className="eb-app-bd-kwh">{fmtNum(ap.kwh, 2)} kWh</span>
                            <span className="eb-app-bd-cost">{fmtINR(ap.cost)}</span>
                            <span className="eb-app-bd-pct">{fmtNum(ap.share, 1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips Tab */}
              {activeTab === "tips" && (
                <div className="eb-tips-tab animate-in">
                  <p className="eb-tips-intro">Personalised saving tips based on your appliance list.</p>
                  <div className="eb-tips-list">
                    {calc.tips.map((tip, i) => (
                      <div key={i} className="eb-tip-row">
                        <div className="eb-tip-icon-wrap"><TrendingDown size={14} strokeWidth={2.5} /></div>
                        <p className="eb-tip-text">{tip}</p>
                      </div>
                    ))}
                  </div>
                  {[
                    "Use appliances with BEE 5-Star ratings — they consume 20–40% less than non-rated equivalents.",
                    "Unplug chargers and TVs on standby — phantom load can be 5–10% of your bill.",
                    "Use the washing machine with full loads and cold water to save on motor and heating energy.",
                  ].map((tip, i) => (
                    <div key={i} className="eb-tip-generic">
                      <CheckCircle2 size={13} strokeWidth={2.5} className="eb-tip-check" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FAQ */}
          <div className="eb-card">
            <div className="eb-faq-header">
              <Info size={14} strokeWidth={2.5} className="eb-lbl-icon" />
              <span className="eb-faq-title">Common Questions</span>
            </div>
            {faqs.map((faq, i) => (
              <div key={i} className="eb-faq-item">
                <button className="eb-faq-q" onClick={() => setOpenFAQ(openFAQ === i ? null : i)}>
                  {faq.q}
                  {openFAQ === i
                    ? <ChevronUp size={14} strokeWidth={2} className="eb-faq-chevron" />
                    : <ChevronDown size={14} strokeWidth={2} className="eb-faq-chevron" />}
                </button>
                {openFAQ === i && <p className="eb-faq-a animate-in">{faq.a}</p>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
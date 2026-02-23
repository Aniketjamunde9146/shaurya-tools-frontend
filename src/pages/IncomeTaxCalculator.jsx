import { useState } from "react";
import "./IncomeTaxCalculator.css";
import { Helmet } from "react-helmet";
import {
  Landmark,
  IndianRupee,
  User,
  Calculator,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  BarChart2,
  ShieldCheck,
  TrendingDown,
  Percent,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

/* ─────────────────────────────────────────────
   TAX SLABS — FY 2024-25 (AY 2025-26)
───────────────────────────────────────────── */

// NEW REGIME (default from FY 2023-24)
const NEW_SLABS = [
  { min: 0,         max: 300000,   rate: 0  },
  { min: 300000,    max: 700000,   rate: 5  },
  { min: 700000,    max: 1000000,  rate: 10 },
  { min: 1000000,   max: 1200000,  rate: 15 },
  { min: 1200000,   max: 1500000,  rate: 20 },
  { min: 1500000,   max: Infinity, rate: 30 },
];

// OLD REGIME
const OLD_SLABS_GENERAL = [
  { min: 0,         max: 250000,   rate: 0  },
  { min: 250000,    max: 500000,   rate: 5  },
  { min: 500000,    max: 1000000,  rate: 20 },
  { min: 1000000,   max: Infinity, rate: 30 },
];
const OLD_SLABS_SENIOR = [
  { min: 0,         max: 300000,   rate: 0  },
  { min: 300000,    max: 500000,   rate: 5  },
  { min: 500000,    max: 1000000,  rate: 20 },
  { min: 1000000,   max: Infinity, rate: 30 },
];
const OLD_SLABS_SUPER = [
  { min: 0,         max: 500000,   rate: 0  },
  { min: 500000,    max: 1000000,  rate: 20 },
  { min: 1000000,   max: Infinity, rate: 30 },
];

/* ── Standard deduction ── */
const STD_DEDUCTION_NEW = 75000;
const STD_DEDUCTION_OLD = 50000;

/* ── Surcharge ── */
function surchargeRate(taxableIncome, regime) {
  if (regime === "new") {
    if (taxableIncome > 50000000)  return 25;
    if (taxableIncome > 20000000)  return 25;
    if (taxableIncome > 10000000)  return 15;
    if (taxableIncome > 5000000)   return 10;
    return 0;
  }
  if (taxableIncome > 50000000)  return 37;
  if (taxableIncome > 20000000)  return 25;
  if (taxableIncome > 10000000)  return 15;
  if (taxableIncome > 5000000)   return 10;
  return 0;
}

/* ── Cess ── */
const CESS_RATE = 4; // Health & Education Cess

/* ── Rebate 87A ── */
function rebate87A(income, basicTax, regime) {
  if (regime === "new"  && income <= 700000)  return Math.min(basicTax, 25000);
  if (regime === "old"  && income <= 500000)  return Math.min(basicTax, 12500);
  return 0;
}

/* ── Compute tax on slabs ── */
function computeSlabTax(income, slabs) {
  let tax = 0;
  const breakdown = [];
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    const slabTax = (taxable * slab.rate) / 100;
    tax += slabTax;
    if (slab.rate > 0 || taxable > 0) {
      breakdown.push({
        range: `₹${fmtSlab(slab.min)} – ${slab.max === Infinity ? "Above" : "₹" + fmtSlab(slab.max)}`,
        rate:  slab.rate,
        taxableAmt: taxable,
        tax: slabTax,
      });
    }
  }
  return { tax, breakdown };
}

/* ── Full tax calculation ── */
function calcTax({ grossIncome, regime, ageGroup, deductions80C, deductions80D, hra, lta, otherDeductions }) {
  const slabsOld = ageGroup === "super" ? OLD_SLABS_SUPER
                 : ageGroup === "senior" ? OLD_SLABS_SENIOR
                 : OLD_SLABS_GENERAL;

  let taxableIncome, stdDed, totalDeductions;

  if (regime === "new") {
    stdDed = STD_DEDUCTION_NEW;
    totalDeductions = stdDed;
    taxableIncome = Math.max(0, grossIncome - stdDed);
  } else {
    stdDed = STD_DEDUCTION_OLD;
    const ded80C    = Math.min(parseFloat(deductions80C) || 0, 150000);
    const ded80D    = Math.min(parseFloat(deductions80D) || 0, ageGroup === "senior" || ageGroup === "super" ? 100000 : 75000);
    const dedHRA    = Math.min(parseFloat(hra) || 0, grossIncome * 0.4);
    const dedLTA    = parseFloat(lta)  || 0;
    const dedOther  = parseFloat(otherDeductions) || 0;
    totalDeductions = stdDed + ded80C + ded80D + dedHRA + dedLTA + dedOther;
    taxableIncome   = Math.max(0, grossIncome - totalDeductions);
  }

  const slabs = regime === "new" ? NEW_SLABS : slabsOld;
  const { tax: basicTax, breakdown } = computeSlabTax(taxableIncome, slabs);

  const rebate    = rebate87A(taxableIncome, basicTax, regime);
  const taxAfterR = Math.max(0, basicTax - rebate);
  const surRate   = surchargeRate(taxableIncome, regime);
  const surcharge = (taxAfterR * surRate) / 100;
  const taxPlusSur = taxAfterR + surcharge;
  const cess      = (taxPlusSur * CESS_RATE) / 100;
  const totalTax  = taxPlusSur + cess;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
  const inHand    = grossIncome - totalTax;
  const monthly   = inHand / 12;

  return {
    grossIncome, taxableIncome, totalDeductions, stdDed,
    basicTax, rebate, taxAfterR, surRate, surcharge, cess,
    totalTax, effectiveRate, inHand, monthly, breakdown, regime,
  };
}

/* ─────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────── */
function fmt(n) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n));
}
function fmtDec(n) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function fmtSlab(n) {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(0)}Cr`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(0)}L`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtL(n) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${fmt(n)}`;
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function IncomeTaxCalculator() {
  const [regime,      setRegime]   = useState("new");
  const [ageGroup,    setAge]      = useState("general");   // general | senior | super
  const [gross,       setGross]    = useState("");
  const [ded80C,      setDed80C]   = useState("");
  const [ded80D,      setDed80D]   = useState("");
  const [hra,         setHRA]      = useState("");
  const [lta,         setLTA]      = useState("");
  const [otherDed,    setOther]    = useState("");
  const [result,      setResult]   = useState(null);
  const [resultOld,   setResultOld]= useState(null);
  const [error,       setError]    = useState("");
  const [copied,      setCopied]   = useState(false);
  const [showSlabs,   setShowSlabs]= useState(false);

  const canCalc = parseFloat(gross) > 0;

  function calculate() {
    setError("");
    const g = parseFloat(gross.replace(/,/g, ""));
    if (!g || g <= 0) { setError("Please enter a valid gross annual income."); return; }
    if (g > 100_00_00_000) { setError("Income seems too high. Please check the value."); return; }

    const params = { grossIncome: g, regime, ageGroup, deductions80C: ded80C, deductions80D: ded80D, hra, lta, otherDeductions: otherDed };
    const res = calcTax(params);
    setResult(res);

    // always compute both for comparison
    const paramsNew = { ...params, regime: "new" };
    const paramsOld = { ...params, regime: "old" };
    setResultOld({ new: calcTax(paramsNew), old: calcTax(paramsOld) });
  }

  function handleReset() {
    setGross(""); setDed80C(""); setDed80D(""); setHRA(""); setLTA(""); setOther("");
    setResult(null); setResultOld(null); setError(""); setCopied(false);
    setRegime("new"); setAge("general");
  }

  function handleCopy() {
    if (!result) return;
    const lines = [
      `Income Tax Summary — FY 2024-25 (AY 2025-26)`,
      `Regime: ${result.regime === "new" ? "New Tax Regime" : "Old Tax Regime"}`,
      `Gross Income      : ₹${fmt(result.grossIncome)}`,
      `Total Deductions  : ₹${fmt(result.totalDeductions)}`,
      `Taxable Income    : ₹${fmt(result.taxableIncome)}`,
      `Basic Tax         : ₹${fmt(result.basicTax)}`,
      result.rebate > 0 ? `Rebate u/s 87A    : -₹${fmt(result.rebate)}` : "",
      result.surcharge > 0 ? `Surcharge (${result.surRate}%)   : ₹${fmt(result.surcharge)}` : "",
      `Health & Edu Cess : ₹${fmt(result.cess)}`,
      `Total Tax Payable : ₹${fmt(result.totalTax)}`,
      `Effective Rate    : ${result.effectiveRate.toFixed(2)}%`,
      `Net In-Hand (yr)  : ₹${fmt(result.inHand)}`,
      `Monthly In-Hand   : ₹${fmt(result.monthly)}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const saving = resultOld ? resultOld.old.totalTax - resultOld.new.totalTax : 0;

  return (
    <>
      <Helmet>
        <title>Income Tax Calculator India FY 2024-25 – New & Old Regime | ShauryaTools</title>
        <meta name="description" content="Calculate your income tax for FY 2024-25 (AY 2025-26) under New and Old Tax Regime. Includes slab-wise breakdown, 87A rebate, surcharge, cess, deductions and regime comparison." />
        <meta name="keywords" content="income tax calculator India, new regime tax calculator, old regime tax calculator, FY 2024-25 tax, 80C deduction, salary tax calculator India, tax slab India" />
        <link rel="canonical" href="https://shauryatools.vercel.app/income-tax-calculator" />
      </Helmet>

      <div className="itc-page">
        <div className="itc-inner">

          {/* ── Header ── */}
          <div className="itc-header">
            <div className="itc-icon"><Landmark size={22} strokeWidth={2} /></div>
            <div>
              <span className="itc-cat">Finance Tools</span>
              <h1>Income Tax Calculator</h1>
              <p>FY 2024-25 (AY 2025-26) · New & Old Regime · Slab-wise breakdown · Rebate & Cess included.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="itc-card">

            {/* Regime */}
            <div className="itc-field">
              <div className="itc-label"><ShieldCheck size={14} strokeWidth={2.5} className="itc-lbl-icon" />Tax Regime</div>
              <div className="itc-regime-toggle">
                <button className={`itc-regime-btn itc-regime-new ${regime === "new" ? "itc-regime-on-new" : ""}`} onClick={() => { setRegime("new"); setResult(null); }}>
                  <span className="itc-regime-name">New Regime</span>
                  <span className="itc-regime-sub">Default · Lower rates · No deductions</span>
                </button>
                <button className={`itc-regime-btn itc-regime-old ${regime === "old" ? "itc-regime-on-old" : ""}`} onClick={() => { setRegime("old"); setResult(null); }}>
                  <span className="itc-regime-name">Old Regime</span>
                  <span className="itc-regime-sub">Higher rates · 80C, HRA deductions</span>
                </button>
              </div>
            </div>

            <div className="itc-divider" />

            {/* Age */}
            <div className="itc-field">
              <div className="itc-label"><User size={14} strokeWidth={2.5} className="itc-lbl-icon" />Age Group</div>
              <div className="itc-chips">
                {[
                  { id: "general", label: "Below 60",  sub: "General"     },
                  { id: "senior",  label: "60 – 80",   sub: "Senior"      },
                  { id: "super",   label: "80+",        sub: "Super Senior"},
                ].map(a => (
                  <button key={a.id} className={`itc-age-btn ${ageGroup === a.id ? "itc-age-on" : ""}`} onClick={() => { setAge(a.id); setResult(null); }}>
                    <span className="itc-age-label">{a.label}</span>
                    <span className="itc-age-sub">{a.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="itc-divider" />

            {/* Gross Income */}
            <div className="itc-field">
              <div className="itc-label"><IndianRupee size={14} strokeWidth={2.5} className="itc-lbl-icon" />Annual Gross Income <span className="itc-lbl-hint">(CTC / Total Income)</span></div>
              <div className="itc-input-wrap">
                <span className="itc-prefix">₹</span>
                <input className="itc-input itc-input-pl" type="number" min="0" placeholder="e.g. 1200000" value={gross} onChange={e => { setGross(e.target.value); setResult(null); setError(""); }} onKeyDown={e => e.key === "Enter" && calculate()} />
              </div>
              <div className="itc-chips" style={{ marginTop: 4 }}>
                {["500000","800000","1200000","1500000","2000000","3000000","5000000"].map(v => (
                  <button key={v} className={`itc-chip ${gross === v ? "itc-chip-on" : ""}`} onClick={() => { setGross(v); setResult(null); }}>
                    {fmtL(parseFloat(v))}
                  </button>
                ))}
              </div>
            </div>

            {/* Old regime deductions */}
            {regime === "old" && (
              <>
                <div className="itc-divider" />
                <div className="itc-ded-title">
                  <TrendingDown size={14} strokeWidth={2.5} />
                  Deductions (Old Regime Only)
                </div>
                <div className="itc-row-2">
                  {[
                    { label: "80C (PPF, ELSS, LIC…)", hint: "Max ₹1.5L", val: ded80C, set: setDed80C },
                    { label: "80D (Health Insurance)",  hint: "Max ₹25K–1L", val: ded80D, set: setDed80D },
                    { label: "HRA Exemption",            hint: "Up to 40% of basic", val: hra, set: setHRA },
                    { label: "LTA Exemption",            hint: "As per employer", val: lta, set: setLTA },
                    { label: "Other Deductions",         hint: "NPS, interest etc.", val: otherDed, set: setOther },
                  ].map((d, i) => (
                    <div key={i} className="itc-ded-field">
                      <div className="itc-ded-label">{d.label}</div>
                      <div className="itc-input-wrap">
                        <span className="itc-prefix">₹</span>
                        <input className="itc-input itc-input-pl itc-input-sm" type="number" min="0" placeholder="0" value={d.val} onChange={e => { d.set(e.target.value); setResult(null); }} />
                      </div>
                      <span className="itc-ded-hint">{d.hint}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && <div className="itc-error"><AlertCircle size={14} strokeWidth={2.5} />{error}</div>}

            <button className="itc-submit" onClick={calculate} disabled={!canCalc}>
              <Calculator size={16} strokeWidth={2} />
              Calculate Tax
            </button>
          </div>

          {/* ── Results ── */}
          {result && (
            <>
              {/* Hero */}
              <div className="itc-hero itc-animate">
                <div className="itc-hero-left">
                  <span className="itc-hero-label">Total Tax Payable — FY 2024-25</span>
                  <div className="itc-hero-amount">₹{fmt(result.totalTax)}</div>
                  <p className="itc-hero-sub">
                    Effective rate {result.effectiveRate.toFixed(2)}% · {result.regime === "new" ? "New" : "Old"} Regime
                  </p>
                </div>
                <div className="itc-hero-right">
                  <div className="itc-inhand-box">
                    <span className="itc-inhand-label">Monthly In-Hand</span>
                    <span className="itc-inhand-val">₹{fmt(result.monthly)}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="itc-stats-grid itc-animate">
                {[
                  { icon: <IndianRupee size={14} strokeWidth={2.5} />, cls: "accent", val: `₹${fmt(result.grossIncome)}`, lbl: "Gross Income"     },
                  { icon: <TrendingDown size={14} strokeWidth={2.5} />, cls: "violet", val: `₹${fmt(result.totalDeductions)}`, lbl: "Deductions"   },
                  { icon: <Percent size={14} strokeWidth={2.5} />, cls: "amber",  val: `₹${fmt(result.taxableIncome)}`, lbl: "Taxable Income"      },
                  { icon: <BarChart2 size={14} strokeWidth={2.5} />, cls: "green",  val: `₹${fmt(result.inHand)}`, lbl: "Net In-Hand (Yr)"        },
                ].map((s, i) => (
                  <div key={i} className="itc-stat-box">
                    <div className={`itc-stat-icon itc-si-${s.cls}`}>{s.icon}</div>
                    <span className="itc-stat-val">{s.val}</span>
                    <span className="itc-stat-lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>

              {/* Tax breakdown */}
              <div className="itc-card itc-animate">
                <div className="itc-card-title"><BarChart2 size={15} strokeWidth={2.5} />Tax Breakdown</div>

                <div className="itc-breakdown">
                  {[
                    { label: "Gross Income",        val: result.grossIncome,      sign: ""   },
                    { label: `Standard Deduction`,  val: -result.stdDed,          sign: "-", cls: "ded" },
                    result.regime === "old" && result.totalDeductions > result.stdDed
                      ? { label: "Other Deductions", val: -(result.totalDeductions - result.stdDed), sign: "-", cls: "ded" }
                      : null,
                    { label: "Taxable Income",      val: result.taxableIncome,    sign: "",  cls: "total", sep: true },
                    { label: "Basic Tax",           val: result.basicTax,         sign: "",  cls: "tax"  },
                    result.rebate > 0 ? { label: "Rebate u/s 87A", val: -result.rebate, sign: "-", cls: "ded" } : null,
                    result.surcharge > 0 ? { label: `Surcharge (${result.surRate}%)`, val: result.surcharge, sign: "+", cls: "tax" } : null,
                    { label: `Health & Edu Cess (${CESS_RATE}%)`, val: result.cess, sign: "+", cls: "tax" },
                    { label: "Total Tax Payable",   val: result.totalTax,         sign: "",  cls: "final", sep: true },
                  ].filter(Boolean).map((row, i) => (
                    <div key={i} className={`itc-bk-row ${row.sep ? "itc-bk-sep" : ""} ${row.cls === "final" ? "itc-bk-final" : ""}`}>
                      <span className={`itc-bk-label ${row.cls === "ded" ? "itc-bk-ded" : ""}`}>{row.label}</span>
                      <span className={`itc-bk-val ${row.cls === "ded" ? "itc-bk-val-ded" : ""} ${row.cls === "final" ? "itc-bk-val-final" : ""}`}>
                        {row.sign}{row.sign === "-" ? "" : ""}{row.sign === "" ? "₹" : "₹"}{fmt(Math.abs(row.val))}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Slab detail toggle */}
                {result.breakdown.length > 0 && (
                  <>
                    <button className="itc-slab-toggle" onClick={() => setShowSlabs(s => !s)}>
                      <BarChart2 size={13} strokeWidth={2.5} />
                      Slab-wise Tax Detail
                      {showSlabs ? <ChevronUp size={14} strokeWidth={2.5} style={{ marginLeft: "auto" }} /> : <ChevronDown size={14} strokeWidth={2.5} style={{ marginLeft: "auto" }} />}
                    </button>
                    {showSlabs && (
                      <div className="itc-slabs itc-animate">
                        <div className="itc-slab-header">
                          <span>Income Slab</span>
                          <span>Rate</span>
                          <span>Taxable Amount</span>
                          <span>Tax</span>
                        </div>
                        {result.breakdown.map((s, i) => (
                          <div key={i} className="itc-slab-row">
                            <span className="itc-slab-range">{s.range}</span>
                            <span className="itc-slab-rate">{s.rate}%</span>
                            <span className="itc-slab-amt">₹{fmt(s.taxableAmt)}</span>
                            <span className="itc-slab-tax">₹{fmt(s.tax)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Regime comparison */}
              {resultOld && (
                <div className="itc-card itc-animate">
                  <div className="itc-card-title">
                    <ShieldCheck size={15} strokeWidth={2.5} />
                    Regime Comparison
                    <span className="itc-card-meta">FY 2024-25</span>
                  </div>

                  <div className="itc-compare-grid">
                    {[
                      { key: "New Regime",  res: resultOld.new, accent: "new" },
                      { key: "Old Regime",  res: resultOld.old, accent: "old" },
                    ].map(({ key, res, accent }) => (
                      <div key={key} className={`itc-cmp-box ${regime === (accent) ? "itc-cmp-active" : ""}`}>
                        <div className="itc-cmp-header">
                          <span className="itc-cmp-name">{key}</span>
                          {regime === accent && <span className="itc-cmp-badge">Selected</span>}
                        </div>
                        <div className="itc-cmp-tax">₹{fmt(res.totalTax)}</div>
                        <div className="itc-cmp-rows">
                          <div className="itc-cmp-row"><span>Taxable Income</span><span>₹{fmt(res.taxableIncome)}</span></div>
                          <div className="itc-cmp-row"><span>Basic Tax</span><span>₹{fmt(res.basicTax)}</span></div>
                          <div className="itc-cmp-row"><span>Cess</span><span>₹{fmt(res.cess)}</span></div>
                          <div className="itc-cmp-row itc-cmp-row-bold"><span>Net In-Hand/yr</span><span>₹{fmt(res.inHand)}</span></div>
                          <div className="itc-cmp-row"><span>Effective Rate</span><span>{res.effectiveRate.toFixed(2)}%</span></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`itc-saving-banner ${saving >= 0 ? "itc-saving-new" : "itc-saving-old"}`}>
                    <ShieldCheck size={15} strokeWidth={2.5} />
                    {saving > 0
                      ? `New Regime saves you ₹${fmt(saving)} compared to Old Regime`
                      : saving < 0
                        ? `Old Regime saves you ₹${fmt(Math.abs(saving))} compared to New Regime`
                        : `Both regimes result in the same tax — choose either!`
                    }
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="itc-note itc-animate">
                <Info size={13} strokeWidth={2.5} />
                This is an estimate for FY 2024-25. Actual tax may vary. Consult a CA for precise computation.
              </div>

              {/* Footer */}
              <div className="itc-card itc-animate" style={{ gap: 0, padding: "16px 20px" }}>
                <div className="itc-footer">
                  <span className="itc-footer-note">FY 2024-25 · {result.regime === "new" ? "New" : "Old"} Regime · Effective {result.effectiveRate.toFixed(2)}%</span>
                  <div className="itc-footer-btns">
                    <button className="itc-action-btn" onClick={handleReset}><RefreshCw size={13} strokeWidth={2.5} />Reset</button>
                    <button className={`itc-copy-btn ${copied ? "itc-copy-done" : ""}`} onClick={handleCopy}>
                      {copied ? <><Check size={13} strokeWidth={2.5} />Copied!</> : <><Copy size={13} strokeWidth={2.5} />Copy Summary</>}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
/* eslint-disable no-empty */
import { useState, useMemo } from "react";
import "./CreditCardEMICalculator.css";
import { Helmet } from "react-helmet";
import {
  CreditCard,
  DollarSign,
  Percent,
  Calendar,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  Clock,
  ShieldCheck,
  BarChart2,
  Repeat,
  CircleDollarSign,
  Flame,
  BadgePercent,
} from "lucide-react";

/* ── Card Presets ── */
const CARD_PRESETS = [
  { id: "hdfc",    label: "HDFC",         rate: 3.5  },
  { id: "sbi",     label: "SBI",          rate: 3.35 },
  { id: "icici",   label: "ICICI",        rate: 3.5  },
  { id: "axis",    label: "Axis",         rate: 3.6  },
  { id: "kotak",   label: "Kotak",        rate: 3.5  },
  { id: "amex",    label: "Amex",         rate: 3.0  },
  { id: "hsbc",    label: "HSBC",         rate: 3.3  },
  { id: "custom",  label: "Custom",       rate: null },
];

/* ── Tenure Options ── */
const TENURES = [3, 6, 9, 12, 18, 24];

/* ── Processing fee options ── */
const FEE_OPTIONS = [
  { id: "none",   label: "None",  value: 0    },
  { id: "99",     label: "₹99",   value: 99   },
  { id: "199",    label: "₹199",  value: 199  },
  { id: "299",    label: "₹299",  value: 299  },
  { id: "499",    label: "₹499",  value: 499  },
  { id: "custom", label: "Custom",value: null },
];

/* ── Formatter ── */
function fmtINR(n, dec = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: dec, maximumFractionDigits: dec,
  }).format(n || 0);
}
function fmtNum(n, dec = 2) { return Number(n).toFixed(dec); }

/* ── Mini sparkline ── */
function BalanceSparkline({ schedule }) {
  if (!schedule || schedule.length < 2) return null;
  const w = 300, h = 56;
  const max = schedule[0].balance;
  const pts = schedule.map((s, i) => {
    const x = (i / (schedule.length - 1)) * w;
    const y = h - (s.balance / max) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="emi-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="emiGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--emi-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--emi-accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#emiGrad)" />
      <polyline points={pts} fill="none" stroke="var(--emi-accent)" strokeWidth="2.2"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── Donut ── */
function MiniDonut({ principal, interest, fee, size = 100 }) {
  const total = principal + interest + fee;
  if (total <= 0) return null;
  const r = 36, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pPct = principal / total;
  const iPct = interest / total;
  const fPct = fee / total;

  function slice(pct, offset, color) {
    return (
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={14}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={-offset * circ}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    );
  }

  return (
    <svg width={size} height={size} className="emi-donut">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--grey-2)" strokeWidth={14} />
      {slice(pPct, 0, "var(--emi-accent)")}
      {slice(iPct, pPct, "var(--red)")}
      {fPct > 0 && slice(fPct, pPct + iPct, "var(--emi-amber)")}
    </svg>
  );
}

/* ── Main ── */
export default function CreditCardEMICalculator() {
  const [preset,       setPreset]    = useState("hdfc");
  const [loanAmt,      setLoanAmt]   = useState("");
  const [monthlyRate,  setRate]      = useState("3.5");
  const [tenure,       setTenure]    = useState(12);
  const [feeOption,    setFeeOption] = useState("none");
  const [customFee,    setCustomFee] = useState("");
  const [compareMode,  setCompare]   = useState(false);
  const [altTenure,    setAltTenure] = useState(6);
  const [activeTab,    setActiveTab] = useState("summary");
  const [openFAQ,      setOpenFAQ]   = useState(null);
  const [openRows,     setOpenRows]  = useState(false);

  function applyPreset(p) {
    setPreset(p.id);
    if (p.rate !== null) setRate(String(p.rate));
  }

  const processingFee = useMemo(() => {
    if (feeOption === "custom") return parseFloat(customFee) || 0;
    return FEE_OPTIONS.find(f => f.id === feeOption)?.value || 0;
  }, [feeOption, customFee]);

  /* ── Core EMI math ── */
  function calcEMI(principal, mRate, months, fee) {
    if (!principal || !months) return null;
    const p = parseFloat(principal);
    const r = parseFloat(mRate) / 100;
    const n = parseInt(months);
    if (p <= 0 || n <= 0) return null;

    let emi;
    if (r === 0) {
      emi = p / n;
    } else {
      emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalPayment    = emi * n + fee;
    const totalInterest   = totalPayment - p - fee;
    const annualRate      = r * 12 * 100;
    const effectiveAnnual = (Math.pow(1 + r, 12) - 1) * 100;

    /* amortization schedule */
    const schedule = [];
    let balance = p;
    for (let i = 1; i <= n; i++) {
      const interestCharge = balance * r;
      const principalPaid  = emi - interestCharge;
      balance = Math.max(0, balance - principalPaid);
      schedule.push({
        month:           i,
        emi:             emi,
        principalPaid:   principalPaid,
        interestCharge:  interestCharge,
        balance:         balance,
        cumPrincipal:    p - balance,
        cumInterest:     (i * emi) - (p - balance),
      });
    }

    return {
      emi, totalPayment, totalInterest, annualRate,
      effectiveAnnual, principal: p, months: n,
      processingFee: fee, schedule,
      interestPct: ((totalInterest / p) * 100),
    };
  }

  const result  = useMemo(() => calcEMI(loanAmt, monthlyRate, tenure,    processingFee), [loanAmt, monthlyRate, tenure, processingFee]);
  const altResult = useMemo(() => compareMode ? calcEMI(loanAmt, monthlyRate, altTenure, processingFee) : null, [loanAmt, monthlyRate, altTenure, processingFee, compareMode]);

  function handleReset() {
    setPreset("hdfc"); setLoanAmt(""); setRate("3.5"); setTenure(12);
    setFeeOption("none"); setCustomFee(""); setCompare(false);
    setAltTenure(6); setActiveTab("summary");
  }

  const hasResult = result !== null;

  const faqs = [
    { q: "What is EMI on a credit card?", a: "EMI (Equated Monthly Installment) converts your large credit card purchase into fixed monthly payments over a chosen tenure. The bank charges interest (typically 1.5%–3.6% per month) on the outstanding amount." },
    { q: "Is credit card EMI better than paying minimum due?", a: "Almost always yes. Paying only the minimum due (usually 5%) attracts revolving credit interest of 3–4% per month on the full balance. A structured EMI plan has a fixed, typically lower rate and a clear payoff date." },
    { q: "What is the difference between reducing balance and flat rate?", a: "This calculator uses the reducing balance method — interest is charged only on the outstanding principal each month. Flat rate charges interest on the full original amount every month, making it effectively more expensive." },
    { q: "Does processing fee affect my EMI?", a: "The processing fee is usually a one-time upfront charge added to your first statement, not included in the EMI itself. This calculator shows it separately so you see your true total cost." },
    { q: "What is a good monthly interest rate for EMI?", a: "Below 1.5% per month (18% p.a.) is considered reasonable. Most Indian bank credit cards charge 1.5%–3.6% per month. Always compare the effective annual rate (EAR) which accounts for monthly compounding." },
  ];

  return (
    <>
      <Helmet>
        <title>Credit Card EMI Calculator – Monthly Payment & Interest | ShauryaTools</title>
        <meta name="description" content="Calculate your credit card EMI, total interest, and amortization schedule. Compare tenures, see your full repayment breakdown and decide the best plan. Free tool." />
        <meta name="keywords" content="credit card emi calculator, emi calculator, credit card interest calculator, loan emi, monthly installment calculator, amortization schedule" />
        <link rel="canonical" href="https://shauryatools.vercel.app/credit-card-emi-calculator" />
      </Helmet>

      <div className="emi-page">
        <div className="emi-inner">

          {/* ── Header ── */}
          <div className="emi-header">
            <div className="emi-icon"><CreditCard size={20} strokeWidth={2} /></div>
            <div>
              <span className="emi-cat">Finance Tools</span>
              <h1>Credit Card EMI Calculator</h1>
              <p>Enter your outstanding amount, interest rate and tenure — get your EMI, total interest and full repayment schedule instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="emi-card">

            {/* Card presets */}
            <div className="emi-field">
              <label className="emi-label"><CreditCard size={14} strokeWidth={2.5} className="emi-lbl-icon" />Select Your Bank</label>
              <div className="emi-presets-grid">
                {CARD_PRESETS.map(p => (
                  <button key={p.id}
                    className={`emi-preset-btn ${preset === p.id ? "emi-preset-on" : ""}`}
                    onClick={() => applyPreset(p)}>
                    <span className="emi-preset-name">{p.label}</span>
                    {p.rate !== null && <span className="emi-preset-rate">{p.rate}%/mo</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="emi-divider" />

            {/* Loan Amount */}
            <div className="emi-field">
              <label className="emi-label"><CircleDollarSign size={14} strokeWidth={2.5} className="emi-lbl-icon" />Outstanding / Purchase Amount</label>
              <div className="emi-amount-wrap">
                <span className="emi-rupee">₹</span>
                <input className="emi-amount-input" type="number" min="0"
                  placeholder="e.g. 50000"
                  value={loanAmt}
                  onChange={e => setLoanAmt(e.target.value)} />
              </div>
              {loanAmt && (
                <p className="emi-hint">
                  {new Intl.NumberFormat("en-IN").format(parseFloat(loanAmt) || 0)} rupees
                </p>
              )}
            </div>

            <div className="emi-divider" />

            {/* Interest Rate */}
            <div className="emi-field">
              <label className="emi-label"><Percent size={14} strokeWidth={2.5} className="emi-lbl-icon" />Monthly Interest Rate</label>
              <div className="emi-rate-row">
                <div className="emi-rate-wrap">
                  <input className="emi-rate-input" type="number" min="0" max="10" step="0.05"
                    value={monthlyRate}
                    onChange={e => { setRate(e.target.value); setPreset("custom"); }} />
                  <span className="emi-rate-label">% / month</span>
                </div>
                <span className="emi-rate-equiv">≈ {fmtNum(parseFloat(monthlyRate) * 12, 2)}% p.a.</span>
              </div>
              <div className="emi-rate-chips">
                {[["1.5","Low"], ["2","Standard"], ["2.99","Common"], ["3.5","High"], ["3.6","Max"]].map(([v, lbl]) => (
                  <button key={v} className={`emi-rate-chip ${monthlyRate === v ? "emi-rate-chip-on" : ""}`}
                    onClick={() => { setRate(v); setPreset("custom"); }}>
                    {v}% <span className="emi-chip-sub">{lbl}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="emi-divider" />

            {/* Tenure */}
            <div className="emi-field">
              <label className="emi-label"><Calendar size={14} strokeWidth={2.5} className="emi-lbl-icon" />Repayment Tenure</label>
              <div className="emi-tenure-grid">
                {TENURES.map(t => (
                  <button key={t}
                    className={`emi-tenure-btn ${tenure === t ? "emi-tenure-on" : ""}`}
                    onClick={() => setTenure(t)}>
                    <span className="emi-tenure-num">{t}</span>
                    <span className="emi-tenure-mo">months</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="emi-divider" />

            {/* Processing Fee */}
            <div className="emi-field">
              <label className="emi-label"><BadgePercent size={14} strokeWidth={2.5} className="emi-lbl-icon" />Processing Fee <span className="emi-optional">(one-time)</span></label>
              <div className="emi-fee-grid">
                {FEE_OPTIONS.map(f => (
                  <button key={f.id}
                    className={`emi-fee-btn ${feeOption === f.id ? "emi-fee-on" : ""}`}
                    onClick={() => setFeeOption(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
              {feeOption === "custom" && (
                <div className="emi-amount-wrap animate-in" style={{ marginTop: 8 }}>
                  <span className="emi-rupee">₹</span>
                  <input className="emi-amount-input" type="number" min="0"
                    placeholder="Enter fee amount"
                    value={customFee}
                    onChange={e => setCustomFee(e.target.value)} />
                </div>
              )}
            </div>

            <div className="emi-divider" />

            {/* Compare toggle */}
            <div className="emi-field">
              <div className="emi-compare-toggle-row">
                <div className="emi-compare-info">
                  <BarChart2 size={14} strokeWidth={2.5} className="emi-lbl-icon" />
                  <span className="emi-label" style={{ margin: 0 }}>Compare with another tenure</span>
                </div>
                <button
                  className={`emi-toggle ${compareMode ? "emi-toggle-on" : ""}`}
                  onClick={() => setCompare(c => !c)}>
                  <span className="emi-toggle-knob" />
                </button>
              </div>
              {compareMode && (
                <div className="emi-tenure-grid animate-in">
                  {TENURES.filter(t => t !== tenure).map(t => (
                    <button key={t}
                      className={`emi-tenure-btn ${altTenure === t ? "emi-tenure-on" : ""}`}
                      onClick={() => setAltTenure(t)}>
                      <span className="emi-tenure-num">{t}</span>
                      <span className="emi-tenure-mo">months</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── Results ── */}
          {hasResult && (
            <div className="emi-card animate-in">

              {/* Top bar */}
              <div className="emi-result-top">
                <div className="emi-result-meta">
                  <span className="emi-badge"><CreditCard size={11} strokeWidth={2.5} />{tenure} months</span>
                  <span className="emi-badge emi-badge-rate"><Percent size={11} strokeWidth={2} />{monthlyRate}% / mo</span>
                  {result.interestPct > 25 && (
                    <span className="emi-badge emi-badge-warn"><AlertTriangle size={11} strokeWidth={2} />High interest</span>
                  )}
                </div>
                <div className="emi-result-right">
                  <div className="emi-tabs">
                    <button className={`emi-tab ${activeTab === "summary"   ? "emi-tab-on" : ""}`} onClick={() => setActiveTab("summary")}>Summary</button>
                    <button className={`emi-tab ${activeTab === "schedule"  ? "emi-tab-on" : ""}`} onClick={() => setActiveTab("schedule")}>Schedule</button>
                    {compareMode && <button className={`emi-tab ${activeTab === "compare" ? "emi-tab-on" : ""}`} onClick={() => setActiveTab("compare")}>Compare</button>}
                  </div>
                  <button className="emi-action-btn" onClick={handleReset}><RefreshCw size={13} strokeWidth={2.5} />Reset</button>
                </div>
              </div>

              {/* ── SUMMARY TAB ── */}
              {activeTab === "summary" && (
                <div className="emi-summary animate-in">

                  {/* EMI hero */}
                  <div className="emi-hero">
                    <div className="emi-hero-left">
                      <span className="emi-hero-label">Monthly EMI</span>
                      <span className="emi-hero-val">{fmtINR(result.emi)}</span>
                      <span className="emi-hero-sub">for {result.months} months</span>
                    </div>
                    <MiniDonut
                      principal={result.principal}
                      interest={result.totalInterest}
                      fee={result.processingFee}
                      size={110}
                    />
                    <div className="emi-hero-right">
                      <div className="emi-hero-stat">
                        <span className="emi-donut-dot emi-dot-principal" />
                        <div>
                          <span className="emi-hero-stat-label">Principal</span>
                          <span className="emi-hero-stat-val">{fmtINR(result.principal)}</span>
                        </div>
                      </div>
                      <div className="emi-hero-stat">
                        <span className="emi-donut-dot emi-dot-interest" />
                        <div>
                          <span className="emi-hero-stat-label">Total Interest</span>
                          <span className="emi-hero-stat-val emi-val-red">{fmtINR(result.totalInterest)}</span>
                        </div>
                      </div>
                      {result.processingFee > 0 && (
                        <div className="emi-hero-stat">
                          <span className="emi-donut-dot emi-dot-fee" />
                          <div>
                            <span className="emi-hero-stat-label">Processing Fee</span>
                            <span className="emi-hero-stat-val emi-val-amber">{fmtINR(result.processingFee)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="emi-stats-grid">
                    {[
                      { label: "EMI",              val: fmtINR(result.emi, 2),                  accent: true  },
                      { label: "Total Payment",     val: fmtINR(result.totalPayment),            accent: false },
                      { label: "Total Interest",    val: fmtINR(result.totalInterest),           red: true     },
                      { label: "Interest %",        val: fmtNum(result.interestPct, 1) + "%",    red: result.interestPct > 20 },
                      { label: "Monthly Rate",      val: monthlyRate + "% p.m.",                 accent: false },
                      { label: "Eff. Annual Rate",  val: fmtNum(result.effectiveAnnual, 2) + "%",red: true     },
                    ].map((s, i) => (
                      <div key={i} className="emi-stat-card">
                        <span className="emi-stat-label">{s.label}</span>
                        <span className={`emi-stat-val ${s.accent ? "emi-stat-accent" : ""} ${s.red ? "emi-stat-red" : ""}`}>{s.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Balance chart */}
                  <div className="emi-chart-card">
                    <div className="emi-chart-header">
                      <span className="emi-chart-title"><TrendingDown size={13} strokeWidth={2.5} className="emi-chart-icon" />Outstanding Balance Over Time</span>
                      <span className="emi-chart-range">{tenure} months</span>
                    </div>
                    <BalanceSparkline schedule={result.schedule} />
                    <div className="emi-chart-labels">
                      <span>Month 1 — {fmtINR(result.principal)}</span>
                      <span>Month {tenure} — ₹0</span>
                    </div>
                  </div>

                  {/* Warning / tip */}
                  {result.interestPct > 25 && (
                    <div className="emi-warn-banner">
                      <Flame size={14} strokeWidth={2} className="emi-warn-icon" />
                      <span>You'll pay <strong>{fmtINR(result.totalInterest)}</strong> in interest — {fmtNum(result.interestPct, 1)}% of the principal. Consider a shorter tenure or a personal loan at a lower rate.</span>
                    </div>
                  )}
                  {result.interestPct <= 15 && (
                    <div className="emi-tip-banner">
                      <ShieldCheck size={14} strokeWidth={2} className="emi-tip-icon" />
                      <span>Good deal! Interest is only <strong>{fmtNum(result.interestPct, 1)}%</strong> of the principal — this is a reasonable EMI plan.</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── SCHEDULE TAB ── */}
              {activeTab === "schedule" && (
                <div className="emi-schedule animate-in">
                  <div className="emi-schedule-summary">
                    <span><strong>{fmtINR(result.emi, 2)}</strong> / month × {tenure} months</span>
                    <span className="emi-schedule-total">Total: {fmtINR(result.totalPayment)}</span>
                  </div>

                  <div className="emi-table-wrap">
                    <table className="emi-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>EMI</th>
                          <th>Principal</th>
                          <th>Interest</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(openRows ? result.schedule : result.schedule.slice(0, 6)).map(row => (
                          <tr key={row.month}>
                            <td className="emi-td-month">{row.month}</td>
                            <td>{fmtINR(row.emi, 2)}</td>
                            <td className="emi-td-principal">{fmtINR(row.principalPaid, 2)}</td>
                            <td className="emi-td-interest">{fmtINR(row.interestCharge, 2)}</td>
                            <td className="emi-td-balance">{fmtINR(row.balance, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {result.schedule.length > 6 && (
                    <button className="emi-show-more" onClick={() => setOpenRows(r => !r)}>
                      {openRows
                        ? <><ChevronUp size={13} strokeWidth={2} />Show less</>
                        : <><ChevronDown size={13} strokeWidth={2} />Show all {result.schedule.length} months</>}
                    </button>
                  )}

                  <div className="emi-schedule-totals">
                    <div className="emi-schedule-total-row">
                      <span>Total Principal Paid</span>
                      <span className="emi-tot-accent">{fmtINR(result.principal)}</span>
                    </div>
                    <div className="emi-schedule-total-row">
                      <span>Total Interest Paid</span>
                      <span className="emi-tot-red">{fmtINR(result.totalInterest)}</span>
                    </div>
                    {result.processingFee > 0 && (
                      <div className="emi-schedule-total-row">
                        <span>Processing Fee</span>
                        <span className="emi-tot-amber">{fmtINR(result.processingFee)}</span>
                      </div>
                    )}
                    <div className="emi-schedule-total-row emi-tot-grand">
                      <span>Grand Total</span>
                      <span>{fmtINR(result.totalPayment)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── COMPARE TAB ── */}
              {activeTab === "compare" && altResult && (
                <div className="emi-compare animate-in">
                  <p className="emi-compare-intro">Comparing <strong>{tenure} months</strong> vs <strong>{altTenure} months</strong> for {fmtINR(result.principal)} at {monthlyRate}% / month.</p>

                  <div className="emi-compare-grid">
                    {/* Plan A */}
                    <div className={`emi-compare-card ${result.totalInterest <= altResult.totalInterest ? "emi-compare-winner" : ""}`}>
                      {result.totalInterest <= altResult.totalInterest && (
                        <div className="emi-winner-badge"><CheckCircle2 size={12} strokeWidth={2.5} />Lower interest</div>
                      )}
                      <span className="emi-compare-plan">Plan A — {tenure} months</span>
                      <span className="emi-compare-emi">{fmtINR(result.emi, 2)}<small>/mo</small></span>
                      <div className="emi-compare-rows">
                        <div className="emi-compare-row"><span>Total Interest</span><span className="emi-val-red">{fmtINR(result.totalInterest)}</span></div>
                        <div className="emi-compare-row"><span>Total Payment</span><span>{fmtINR(result.totalPayment)}</span></div>
                        <div className="emi-compare-row"><span>Interest %</span><span>{fmtNum(result.interestPct, 1)}%</span></div>
                        <div className="emi-compare-row"><span>Eff. Annual Rate</span><span>{fmtNum(result.effectiveAnnual, 2)}%</span></div>
                      </div>
                    </div>

                    {/* Plan B */}
                    <div className={`emi-compare-card ${altResult.totalInterest < result.totalInterest ? "emi-compare-winner" : ""}`}>
                      {altResult.totalInterest < result.totalInterest && (
                        <div className="emi-winner-badge"><CheckCircle2 size={12} strokeWidth={2.5} />Lower interest</div>
                      )}
                      <span className="emi-compare-plan">Plan B — {altTenure} months</span>
                      <span className="emi-compare-emi">{fmtINR(altResult.emi, 2)}<small>/mo</small></span>
                      <div className="emi-compare-rows">
                        <div className="emi-compare-row"><span>Total Interest</span><span className="emi-val-red">{fmtINR(altResult.totalInterest)}</span></div>
                        <div className="emi-compare-row"><span>Total Payment</span><span>{fmtINR(altResult.totalPayment)}</span></div>
                        <div className="emi-compare-row"><span>Interest %</span><span>{fmtNum(altResult.interestPct, 1)}%</span></div>
                        <div className="emi-compare-row"><span>Eff. Annual Rate</span><span>{fmtNum(altResult.effectiveAnnual, 2)}%</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Difference callout */}
                  <div className="emi-diff-callout">
                    <ArrowRight size={14} strokeWidth={2.5} className="emi-diff-icon" />
                    <span>
                      Choosing <strong>{tenure < altTenure ? tenure : altTenure} months</strong> saves{" "}
                      <strong className="emi-val-green">{fmtINR(Math.abs(result.totalInterest - altResult.totalInterest))}</strong> in interest
                      but costs <strong>{fmtINR(Math.abs(result.emi - altResult.emi))}</strong> more per month.
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── FAQ ── */}
          <div className="emi-card">
            <div className="emi-faq-header">
              <Info size={14} strokeWidth={2.5} className="emi-lbl-icon" />
              <span className="emi-faq-title">Common Questions</span>
            </div>
            {faqs.map((faq, i) => (
              <div key={i} className="emi-faq-item">
                <button className="emi-faq-q" onClick={() => setOpenFAQ(openFAQ === i ? null : i)}>
                  {faq.q}
                  {openFAQ === i
                    ? <ChevronUp size={14} strokeWidth={2} className="emi-faq-chevron" />
                    : <ChevronDown size={14} strokeWidth={2} className="emi-faq-chevron" />}
                </button>
                {openFAQ === i && <p className="emi-faq-a animate-in">{faq.a}</p>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
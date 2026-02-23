import { useState, useCallback } from "react";
import "./SIPCalculator.css";
import { Helmet } from "react-helmet";
import {
  TrendingUp,
  IndianRupee,
  Calendar,
  Percent,
  Calculator,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  PiggyBank,
  BarChart2,
  Award,
  Zap,
  ArrowUpRight,
  Target,
} from "lucide-react";

/* ── Helpers ── */
function fmt(n) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtCr(n) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${fmt(n)}`;
}

function fmtShort(n) {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(1)} K`;
  return n.toFixed(0);
}

/* ── SIP Calculation ── */
function calcSIP(monthly, rate, years) {
  const n   = years * 12;
  const r   = rate / 100 / 12;
  const fv  = r === 0
    ? monthly * n
    : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  const returns  = fv - invested;
  return { fv, invested, returns, n, r };
}

/* Build year-by-year data for chart */
function buildYearData(monthly, rate, years) {
  const data = [];
  for (let y = 1; y <= years; y++) {
    const { fv, invested, returns } = calcSIP(monthly, rate, y);
    data.push({ year: y, fv, invested, returns });
  }
  return data;
}

/* ── Preset rates ── */
const RATE_PRESETS = [
  { id: "8",  label: "8%",  desc: "Conservative" },
  { id: "10", label: "10%", desc: "Moderate"     },
  { id: "12", label: "12%", desc: "Expected"     },
  { id: "15", label: "15%", desc: "Optimistic"   },
  { id: "18", label: "18%", desc: "Aggressive"   },
];

const YEAR_PRESETS = [
  { id: "3",  label: "3Y"  },
  { id: "5",  label: "5Y"  },
  { id: "10", label: "10Y" },
  { id: "15", label: "15Y" },
  { id: "20", label: "20Y" },
  { id: "25", label: "25Y" },
  { id: "30", label: "30Y" },
];

const SIP_PRESETS = [
  { id: "500",   label: "₹500"   },
  { id: "1000",  label: "₹1K"    },
  { id: "2000",  label: "₹2K"    },
  { id: "5000",  label: "₹5K"    },
  { id: "10000", label: "₹10K"   },
  { id: "25000", label: "₹25K"   },
];

/* ── Mini bar chart ── */
function MiniChart({ data, maxFv }) {
  if (!data.length) return null;
  const max = maxFv || Math.max(...data.map(d => d.fv));
  return (
    <div className="sip-chart">
      {data.map((d, i) => {
        const totalH = (d.fv / max) * 100;
        const invH   = (d.invested / max) * 100;
        const retH   = ((d.fv - d.invested) / max) * 100;
        return (
          <div key={i} className="sip-chart-col" title={`Year ${d.year}: ₹${fmtShort(d.fv)}`}>
            <div className="sip-chart-bar-wrap" style={{ height: `${totalH}%` }}>
              <div className="sip-chart-ret"   style={{ flex: retH }} />
              <div className="sip-chart-inv"   style={{ flex: invH }} />
            </div>
            {(i === 0 || (i + 1) % 5 === 0 || i === data.length - 1) && (
              <span className="sip-chart-lbl">{d.year}Y</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Donut ring ── */
function DonutRing({ invested, returns }) {
  const total   = invested + returns;
  const invPct  = (invested / total) * 100;
  const retPct  = (returns / total) * 100;
  const r = 44, circ = 2 * Math.PI * r;
  const invDash = (invPct / 100) * circ;
  const retDash = (retPct / 100) * circ;

  return (
    <svg viewBox="0 0 100 100" className="sip-donut" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--grey-2)" strokeWidth="10" />
      {/* invested arc */}
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="var(--fg-accent)" strokeWidth="10"
        strokeDasharray={`${invDash} ${circ - invDash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="butt"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
      {/* returns arc */}
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="var(--green)" strokeWidth="10"
        strokeDasharray={`${retDash} ${circ - retDash}`}
        strokeDashoffset={circ * 0.25 - invDash}
        strokeLinecap="butt"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.1s" }}
      />
      <text x="50" y="46" textAnchor="middle" className="sip-donut-val">{retPct.toFixed(0)}%</text>
      <text x="50" y="60" textAnchor="middle" className="sip-donut-sub">Returns</text>
    </svg>
  );
}

/* ── Main Component ── */
export default function SIPCalculator() {
  const [monthly,    setMonthly]   = useState("5000");
  const [rate,       setRate]      = useState("12");
  const [years,      setYears]     = useState("10");
  const [rateCustom, setRateCust]  = useState("");
  const [useCustomR, setUseCustomR]= useState(false);
  const [result,     setResult]    = useState(null);
  const [error,      setError]     = useState("");
  const [copied,     setCopied]    = useState(false);

  const effectiveRate = useCustomR ? parseFloat(rateCustom) || 0 : parseFloat(rate);

  /* live preview while typing */
  const liveMonthly = parseFloat(monthly) || 0;
  const liveYears   = parseInt(years, 10)  || 0;
  const canCalc     = liveMonthly > 0 && liveYears > 0 && effectiveRate > 0;

  function calculate() {
    setError("");
    const m = parseFloat(monthly);
    const y = parseInt(years, 10);
    const r = effectiveRate;

    if (!m || m <= 0)         { setError("Enter a valid monthly SIP amount."); return; }
    if (!y || y <= 0 || y > 50) { setError("Investment period must be between 1 and 50 years."); return; }
    if (!r || r <= 0 || r > 100){ setError("Expected return rate must be between 0.1% and 100%."); return; }

    const res   = calcSIP(m, r, y);
    const chart = buildYearData(m, r, y);
    setResult({ monthly: m, rate: r, years: y, ...res, chart });
  }

  function handleReset() {
    setMonthly("5000"); setRate("12"); setYears("10");
    setRateCust(""); setUseCustomR(false);
    setResult(null); setError(""); setCopied(false);
  }

  function handleCopy() {
    if (!result) return;
    const lines = [
      `SIP Return Summary`,
      `Monthly SIP     : ₹${fmt(result.monthly)}`,
      `Duration        : ${result.years} years (${result.n} months)`,
      `Expected Return : ${result.rate}% p.a.`,
      ``,
      `Total Invested  : ₹${fmt(result.invested)}`,
      `Est. Returns    : ₹${fmt(result.returns)}`,
      `Maturity Value  : ₹${fmt(result.fv)}`,
      `Wealth Gained   : ${((result.returns / result.invested) * 100).toFixed(1)}%`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const wealthRatio = result ? ((result.returns / result.invested) * 100).toFixed(1) : null;

  return (
    <>
      <Helmet>
        <title>SIP Return Calculator – Mutual Fund SIP Calculator | ShauryaTools</title>
        <meta name="description" content="Calculate your SIP returns instantly. Enter monthly investment, expected rate, and duration to see maturity value, total invested, estimated gains, and a year-by-year growth chart." />
        <meta name="keywords" content="SIP calculator, SIP return calculator, mutual fund calculator, SIP maturity calculator, monthly investment calculator, compound interest calculator India" />
        <link rel="canonical" href="https://shauryatools.vercel.app/sip-calculator" />
      </Helmet>

      <div className="sip-page">
        <div className="sip-inner">

          {/* ── Header ── */}
          <div className="sip-header">
            <div className="sip-icon"><TrendingUp size={22} strokeWidth={2} /></div>
            <div>
              <span className="sip-cat">Finance Tools</span>
              <h1>SIP Return Calculator</h1>
              <p>Estimate your Systematic Investment Plan returns — maturity value, wealth gained & year-by-year growth.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="sip-card">

            {/* Monthly SIP */}
            <div className="sip-field">
              <div className="sip-label">
                <IndianRupee size={14} strokeWidth={2.5} className="sip-lbl-icon" />
                Monthly SIP Amount
              </div>
              <div className="sip-input-wrap">
                <span className="sip-prefix">₹</span>
                <input
                  className="sip-input sip-input-has-prefix"
                  type="number" min="100"
                  placeholder="e.g. 5000"
                  value={monthly}
                  onChange={e => { setMonthly(e.target.value); setResult(null); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && calculate()}
                />
              </div>
              <div className="sip-chips">
                {SIP_PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`sip-chip ${monthly === p.id ? "sip-chip-on" : ""}`}
                    onClick={() => { setMonthly(p.id); setResult(null); setError(""); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sip-divider" />

            {/* Expected Rate */}
            <div className="sip-field">
              <div className="sip-label">
                <Percent size={14} strokeWidth={2.5} className="sip-lbl-icon" />
                Expected Annual Return
              </div>
              <div className="sip-rate-grid">
                {RATE_PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`sip-rate-btn ${!useCustomR && rate === p.id ? "sip-rate-on" : ""}`}
                    onClick={() => { setRate(p.id); setUseCustomR(false); setResult(null); setError(""); }}
                  >
                    {p.label}
                    <span className="sip-rate-sub">{p.desc}</span>
                  </button>
                ))}
              </div>
              <div className="sip-custom-wrap">
                <input
                  className="sip-custom-input"
                  type="number" min="0.1" max="100" step="0.1"
                  placeholder="Custom"
                  value={rateCustom}
                  onChange={e => { setRateCust(e.target.value); setUseCustomR(true); setResult(null); setError(""); }}
                />
                <span className="sip-custom-label">% — custom rate</span>
              </div>
            </div>

            <div className="sip-divider" />

            {/* Duration */}
            <div className="sip-field">
              <div className="sip-label">
                <Calendar size={14} strokeWidth={2.5} className="sip-lbl-icon" />
                Investment Period
              </div>
              <div className="sip-year-grid">
                {YEAR_PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`sip-year-btn ${years === p.id ? "sip-year-on" : ""}`}
                    onClick={() => { setYears(p.id); setResult(null); setError(""); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="sip-custom-wrap">
                <input
                  className="sip-custom-input"
                  type="number" min="1" max="50"
                  placeholder="Custom"
                  value={YEAR_PRESETS.find(p => p.id === years) ? "" : years}
                  onChange={e => { setYears(e.target.value); setResult(null); setError(""); }}
                />
                <span className="sip-custom-label">years — custom period</span>
              </div>
            </div>

            {error && (
              <div className="sip-error"><AlertCircle size={14} strokeWidth={2.5} />{error}</div>
            )}

            <button className="sip-submit" onClick={calculate} disabled={!canCalc}>
              <Calculator size={16} strokeWidth={2} />
              Calculate Returns
            </button>
          </div>

          {/* ── Results ── */}
          {result && (
            <>
              {/* Hero */}
              <div className="sip-result-hero sip-animate">
                <div className="sip-hero-left">
                  <span className="sip-hero-label">Estimated Maturity Value</span>
                  <div className="sip-hero-amount">{fmtCr(result.fv)}</div>
                  <p className="sip-hero-sub">
                    After {result.years} years · ₹{fmt(result.monthly)}/mo @ {result.rate}% p.a.
                  </p>
                </div>
                <div className="sip-hero-right">
                  <div className="sip-wealth-badge">
                    <ArrowUpRight size={16} strokeWidth={2.5} />
                    {wealthRatio}% gains
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="sip-stats-grid sip-animate">
                <div className="sip-stat-box">
                  <div className="sip-stat-icon sip-si-accent"><PiggyBank size={14} strokeWidth={2.5} /></div>
                  <span className="sip-stat-val">{fmtCr(result.invested)}</span>
                  <span className="sip-stat-lbl">Total Invested</span>
                </div>
                <div className="sip-stat-box">
                  <div className="sip-stat-icon sip-si-green"><TrendingUp size={14} strokeWidth={2.5} /></div>
                  <span className="sip-stat-val sip-val-green">{fmtCr(result.returns)}</span>
                  <span className="sip-stat-lbl">Est. Returns</span>
                </div>
                <div className="sip-stat-box">
                  <div className="sip-stat-icon sip-si-violet"><Award size={14} strokeWidth={2.5} /></div>
                  <span className="sip-stat-val">{fmtCr(result.fv)}</span>
                  <span className="sip-stat-lbl">Maturity Value</span>
                </div>
                <div className="sip-stat-box">
                  <div className="sip-stat-icon sip-si-amber"><Zap size={14} strokeWidth={2.5} /></div>
                  <span className="sip-stat-val">{wealthRatio}%</span>
                  <span className="sip-stat-lbl">Wealth Gained</span>
                </div>
              </div>

              {/* Chart + Donut */}
              <div className="sip-card sip-animate">
                <div className="sip-card-title">
                  <BarChart2 size={15} strokeWidth={2.5} />
                  Year-by-Year Growth
                </div>

                <div className="sip-visual-row">
                  {/* Bar chart */}
                  <div className="sip-chart-wrap">
                    <MiniChart data={result.chart} maxFv={result.fv} />
                    <div className="sip-chart-legend">
                      <div className="sip-legend-item">
                        <div className="sip-legend-dot sip-dot-inv" />
                        Invested
                      </div>
                      <div className="sip-legend-item">
                        <div className="sip-legend-dot sip-dot-ret" />
                        Returns
                      </div>
                    </div>
                  </div>

                  {/* Donut */}
                  <div className="sip-donut-wrap">
                    <DonutRing invested={result.invested} returns={result.returns} />
                    <div className="sip-donut-legend">
                      <div className="sip-donut-row">
                        <span className="sip-donut-dot sip-dot-inv" />
                        <span className="sip-donut-key">Invested</span>
                        <span className="sip-donut-pct">{((result.invested / result.fv) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="sip-donut-row">
                        <span className="sip-donut-dot sip-dot-ret" />
                        <span className="sip-donut-key">Returns</span>
                        <span className="sip-donut-pct sip-pct-green">{((result.returns / result.fv) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown table */}
              <div className="sip-card sip-animate">
                <div className="sip-card-title">
                  <Target size={15} strokeWidth={2.5} />
                  Investment Summary
                </div>

                <div className="sip-breakdown">
                  {[
                    { label: "Monthly SIP",       val: `₹${fmt(result.monthly)}`,         sub: "Per month"             },
                    { label: "Investment Period",  val: `${result.years} Years`,            sub: `${result.n} months`    },
                    { label: "Expected Return",    val: `${result.rate}% p.a.`,             sub: "Annual rate"           },
                    { label: "Total Invested",     val: `₹${fmt(result.invested)}`,         sub: fmtCr(result.invested), dot: "acc" },
                    { label: "Est. Returns",       val: `₹${fmt(result.returns)}`,          sub: `+${wealthRatio}%`,     dot: "ret", accent: true },
                    { label: "Maturity Value",     val: `₹${fmt(result.fv)}`,               sub: fmtCr(result.fv),       dot: "total", total: true },
                  ].map((row, i) => (
                    <div key={i} className={`sip-bk-row ${row.total ? "sip-bk-total" : ""}`}>
                      <div className="sip-bk-left">
                        {row.dot && <div className={`sip-bk-dot sip-bk-dot-${row.dot}`} />}
                        <div>
                          <div className="sip-bk-label">{row.label}</div>
                          {row.sub && <div className="sip-bk-sub">{row.sub}</div>}
                        </div>
                      </div>
                      <div className={`sip-bk-val ${row.accent ? "sip-bk-val-green" : ""} ${row.total ? "sip-bk-val-total" : ""}`}>
                        {row.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone table — 5Y increments */}
              {result.years >= 5 && (
                <div className="sip-card sip-animate">
                  <div className="sip-card-title">
                    <Award size={15} strokeWidth={2.5} />
                    Milestones
                    <span className="sip-card-meta">Every 5 years</span>
                  </div>
                  <div className="sip-milestone-header">
                    <span>Year</span>
                    <span>Invested</span>
                    <span>Returns</span>
                    <span>Maturity</span>
                  </div>
                  <div className="sip-milestones">
                    {result.chart
                      .filter(d => d.year % 5 === 0 || d.year === result.years)
                      .map((d, i) => (
                        <div key={i} className={`sip-milestone-row ${d.year === result.years ? "sip-ms-final" : ""}`}>
                          <span className="sip-ms-year">Yr {d.year}</span>
                          <span className="sip-ms-inv">{fmtCr(d.invested)}</span>
                          <span className="sip-ms-ret">+{fmtCr(d.returns)}</span>
                          <span className="sip-ms-fv">{fmtCr(d.fv)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="sip-card sip-animate" style={{ gap: 0, padding: "16px 20px" }}>
                <div className="sip-footer">
                  <span className="sip-footer-note">
                    ₹{fmt(result.monthly)}/mo · {result.rate}% · {result.years}Y
                  </span>
                  <div className="sip-footer-btns">
                    <button className="sip-action-btn" onClick={handleReset}>
                      <RefreshCw size={13} strokeWidth={2.5} />New
                    </button>
                    <button className={`sip-copy-btn ${copied ? "sip-copy-done" : ""}`} onClick={handleCopy}>
                      {copied
                        ? <><Check size={13} strokeWidth={2.5} />Copied!</>
                        : <><Copy size={13} strokeWidth={2.5} />Copy Summary</>}
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
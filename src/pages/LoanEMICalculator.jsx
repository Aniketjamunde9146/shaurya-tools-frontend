import { useState, useMemo } from "react";
import { Calculator, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import "./LoanEMICalculator.css";
import { Helmet } from "react-helmet";

function calcEMI(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) return null;
  const p = parseFloat(principal);
  const r = parseFloat(annualRate) / 12 / 100;
  const n = parseFloat(tenureMonths);
  if (p <= 0 || r < 0 || n <= 0) return null;
  if (r === 0) return { emi: p / n, total: p, interest: 0 };
  const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - p;
  return { emi, total, interest };
}

function buildSchedule(principal, annualRate, tenureMonths) {
  const p = parseFloat(principal);
  const r = parseFloat(annualRate) / 12 / 100;
  const n = parseFloat(tenureMonths);
  if (p <= 0 || n <= 0) return [];
  const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = p;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const interestPart = r === 0 ? 0 : balance * r;
    const principalPart = emi - interestPart;
    balance -= principalPart;
    rows.push({
      month: i,
      emi,
      principal: principalPart,
      interest: interestPart,
      balance: Math.max(0, balance),
    });
  }
  return rows;
}

function fmt(n, decimals = 2) {
  if (isNaN(n) || n === null) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function DonutChart({ principal, interest }) {
  const total = principal + interest;
  if (!total) return null;
  const pPct = (principal / total) * 100;
  const iPct = (interest / total) * 100;
  // SVG donut: cx=50,cy=50,r=38, circumference=238.76
  const C = 2 * Math.PI * 38;
  const pDash = (pPct / 100) * C;
  const iDash = (iPct / 100) * C;
  return (
    <>
    <Helmet>
      <title>Free Loan EMI Calculator – Monthly Installment & Amortization</title>
      <meta name="description" content="Calculate your monthly EMI, total interest, and full amortization schedule instantly. Supports multiple currencies. Free loan calculator, no sign-up." />
      <meta name="keywords" content="loan emi calculator, emi calculator, monthly installment calculator, loan calculator online, amortization schedule, home loan emi" />
      <link rel="canonical" href="https://shauryatools.vercel.app/loan-emi-calculator" />
    </Helmet>
    <div className="emi-donut-wrap">
      <svg viewBox="0 0 100 100" className="emi-donut-svg">
        {/* Interest segment */}
        <circle
          cx="50" cy="50" r="38"
          fill="none"
          stroke="var(--orange)"
          strokeWidth="14"
          strokeDasharray={`${iDash} ${C - iDash}`}
          strokeDashoffset={C * 0.25}
          opacity="0.85"
        />
        {/* Principal segment */}
        <circle
          cx="50" cy="50" r="38"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="14"
          strokeDasharray={`${pDash} ${C - pDash}`}
          strokeDashoffset={C * 0.25 - iDash}
          opacity="0.9"
        />
        <text x="50" y="46" textAnchor="middle" className="emi-donut-label-top">EMI</text>
        <text x="50" y="58" textAnchor="middle" className="emi-donut-label-pct">{pPct.toFixed(0)}% P</text>
      </svg>
      <div className="emi-donut-legend">
        <div className="emi-legend-item">
          <span className="emi-legend-dot emi-dot-teal" />
          <span className="emi-legend-text">Principal</span>
          <span className="emi-legend-pct">{pPct.toFixed(1)}%</span>
        </div>
        <div className="emi-legend-item">
          <span className="emi-legend-dot emi-dot-orange" />
          <span className="emi-legend-text">Interest</span>
          <span className="emi-legend-pct">{iPct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
    </>
  );
}

export default function LoanEMICalculator() {
  const [principal,  setPrincipal]  = useState("");
  const [rate,       setRate]       = useState("");
  const [tenureVal,  setTenureVal]  = useState("");
  const [tenureUnit, setTenureUnit] = useState("months"); // months | years
  const [showTable,  setShowTable]  = useState(false);
  const [currency,   setCurrency]   = useState("₹");

  const tenureMonths = tenureUnit === "years"
    ? (parseFloat(tenureVal) * 12 || 0)
    : (parseFloat(tenureVal) || 0);

  const result   = useMemo(() => calcEMI(principal, rate, tenureMonths), [principal, rate, tenureMonths]);
  const schedule = useMemo(() => showTable && result ? buildSchedule(principal, rate, tenureMonths) : [], [showTable, principal, rate, tenureMonths, result]);

  const handleReset = () => {
    setPrincipal(""); setRate(""); setTenureVal(""); setShowTable(false);
  };

  const hasInput = principal || rate || tenureVal;

  return (
    <div className="emi-page">
      <div className="emi-inner">

        {/* Header */}
        <div className="emi-header">
          <div className="emi-icon">
            <Calculator size={20} />
          </div>
          <div>
            <span className="emi-cat-badge">Finance Tools</span>
            <h1>Loan EMI Calculator</h1>
            <p>Calculate your monthly installment, total interest, and full repayment schedule.</p>
          </div>
        </div>

        {/* Input Card */}
        <div className="emi-card">

          {/* Currency selector */}
          <div className="emi-label-row">
            <label className="emi-label">Currency</label>
            <div className="emi-currency-pills">
              {["₹", "$", "€", "£"].map(c => (
                <button
                  key={c}
                  className={`emi-currency-btn ${currency === c ? "emi-currency-on" : ""}`}
                  onClick={() => setCurrency(c)}
                >{c}</button>
              ))}
            </div>
          </div>

          <div className="emi-divider" />

          {/* Loan Amount */}
          <div className="emi-field">
            <label className="emi-label">
              Loan Amount <span className="emi-sublabel">{currency}</span>
            </label>
            <div className="emi-input-wrap">
              <span className="emi-prefix">{currency}</span>
              <input
                className="emi-input emi-input-prefixed"
                type="number"
                min="0"
                placeholder="e.g. 500000"
                value={principal}
                onChange={e => setPrincipal(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Interest Rate */}
          <div className="emi-field">
            <label className="emi-label">
              Annual Interest Rate <span className="emi-sublabel">% per annum</span>
            </label>
            <div className="emi-input-wrap">
              <input
                className="emi-input emi-input-suffixed"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 8.5"
                value={rate}
                onChange={e => setRate(e.target.value)}
              />
              <span className="emi-suffix">%</span>
            </div>
          </div>

          {/* Tenure */}
          <div className="emi-field">
            <label className="emi-label">Loan Tenure</label>
            <div className="emi-tenure-row">
              <input
                className="emi-input"
                type="number"
                min="1"
                placeholder={tenureUnit === "years" ? "e.g. 5" : "e.g. 60"}
                value={tenureVal}
                onChange={e => setTenureVal(e.target.value)}
              />
              <div className="emi-tenure-tabs">
                <button
                  className={`emi-tenure-tab ${tenureUnit === "months" ? "emi-tenure-on" : ""}`}
                  onClick={() => setTenureUnit("months")}
                >Months</button>
                <button
                  className={`emi-tenure-tab ${tenureUnit === "years" ? "emi-tenure-on" : ""}`}
                  onClick={() => setTenureUnit("years")}
                >Years</button>
              </div>
            </div>
            {tenureVal && tenureUnit === "years" && (
              <p className="emi-hint">= {tenureMonths} months</p>
            )}
            {tenureVal && tenureUnit === "months" && parseFloat(tenureVal) >= 12 && (
              <p className="emi-hint">= {(tenureMonths / 12).toFixed(1)} years</p>
            )}
          </div>

          <div className="emi-actions">
            <button className="emi-reset-btn" onClick={handleReset} disabled={!hasInput}>
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Result Card */}
        {result && (
          <div className="emi-card emi-result-card animate-in">

            {/* EMI Hero */}
            <div className="emi-hero">
              <div className="emi-hero-left">
                <span className="emi-hero-label">Monthly EMI</span>
                <div className="emi-hero-amount">
                  <span className="emi-hero-currency">{currency}</span>
                  {fmt(result.emi)}
                </div>
              </div>
              <DonutChart principal={parseFloat(principal)} interest={result.interest} />
            </div>

            {/* Stat grid */}
            <div className="emi-stats">
              <div className="emi-stat emi-stat-teal">
                <span className="emi-stat-label">Principal</span>
                <span className="emi-stat-val">{currency}{fmt(parseFloat(principal), 0)}</span>
              </div>
              <div className="emi-stat emi-stat-orange">
                <span className="emi-stat-label">Total Interest</span>
                <span className="emi-stat-val">{currency}{fmt(result.interest, 0)}</span>
              </div>
              <div className="emi-stat emi-stat-purple">
                <span className="emi-stat-label">Total Payment</span>
                <span className="emi-stat-val">{currency}{fmt(result.total, 0)}</span>
              </div>
              <div className="emi-stat emi-stat-grey">
                <span className="emi-stat-label">Tenure</span>
                <span className="emi-stat-val">{tenureMonths} months</span>
              </div>
            </div>

            {/* Amortization table toggle */}
            <button
              className="emi-schedule-toggle"
              onClick={() => setShowTable(t => !t)}
            >
              {showTable ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {showTable ? "Hide" : "Show"} Amortization Schedule
            </button>

            {showTable && schedule.length > 0 && (
              <div className="emi-table-wrap animate-in">
                <table className="emi-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>EMI ({currency})</th>
                      <th>Principal ({currency})</th>
                      <th>Interest ({currency})</th>
                      <th>Balance ({currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map(row => (
                      <tr key={row.month}>
                        <td className="emi-td-month">{row.month}</td>
                        <td>{fmt(row.emi)}</td>
                        <td className="emi-td-principal">{fmt(row.principal)}</td>
                        <td className="emi-td-interest">{fmt(row.interest)}</td>
                        <td className="emi-td-balance">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="emi-disclaimer">
              Results are indicative. Actual EMI may vary based on lender's compounding method and processing fees.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
import { useState } from "react";
import "./GSTCalculator.css";
import { Helmet } from "react-helmet";
import {
  Receipt,
  Plus,
  Minus,
  Calculator,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  IndianRupee,
  Percent,
  BarChart2,
  Trash2,
  ArrowRight,
  SplitSquareHorizontal,
  Clock,
} from "lucide-react";

/* ── GST Rate presets ── */
const GST_RATES = [
  { id: "0",    label: "0%",   desc: "Exempt"   },
  { id: "0.1",  label: "0.1%", desc: "Special"  },
  { id: "0.25", label: "0.25%",desc: "Special"  },
  { id: "3",    label: "3%",   desc: "Gold"     },
  { id: "5",    label: "5%",   desc: "Essential"},
  { id: "12",   label: "12%",  desc: "Standard" },
  { id: "18",   label: "18%",  desc: "Standard" },
  { id: "28",   label: "28%",  desc: "Luxury"   },
];

/* ── Number formatting ── */
function fmt(n) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtShort(n) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/* ── GST logic ── */
function calcAdd(amount, rate) {
  const base     = amount;
  const gstAmt   = (base * rate) / 100;
  const total    = base + gstAmt;
  const cgst     = gstAmt / 2;
  const sgst     = gstAmt / 2;
  return { base, gstAmt, total, cgst, sgst, igst: gstAmt, rate };
}

function calcRemove(amount, rate) {
  const base     = (amount * 100) / (100 + rate);
  const gstAmt   = amount - base;
  const total    = amount;
  const cgst     = gstAmt / 2;
  const sgst     = gstAmt / 2;
  return { base, gstAmt, total, cgst, sgst, igst: gstAmt, rate };
}

/* ── Main Component ── */
export default function GSTCalculator() {
  const [mode,       setMode]      = useState("add");      // "add" | "remove"
  const [amount,     setAmount]    = useState("");
  const [rateId,     setRateId]    = useState("18");
  const [customRate, setCustom]    = useState("");
  const [useCustom,  setUseCustom] = useState(false);
  const [taxType,    setTaxType]   = useState("intra");    // "intra" | "inter"
  const [result,     setResult]    = useState(null);
  const [history,    setHistory]   = useState([]);
  const [error,      setError]     = useState("");
  const [copied,     setCopied]    = useState(false);

  /* Effective rate */
  const effectiveRate = useCustom
    ? parseFloat(customRate) || 0
    : parseFloat(rateId);

  /* ── Calculate ── */
  function calculate() {
    setError("");
    const amt = parseFloat(amount.replace(/,/g, ""));
    if (!amount || isNaN(amt) || amt <= 0) { setError("Please enter a valid amount greater than 0."); return; }
    if (effectiveRate < 0 || effectiveRate > 100) { setError("GST rate must be between 0 and 100."); return; }

    const res = mode === "add" ? calcAdd(amt, effectiveRate) : calcRemove(amt, effectiveRate);
    const entry = {
      id:       Date.now(),
      mode,
      amount:   amt,
      rate:     effectiveRate,
      taxType,
      result:   res,
    };
    setResult(entry);
    setHistory(h => [entry, ...h.slice(0, 9)]);
  }

  /* ── Copy ── */
  function handleCopy() {
    if (!result) return;
    const r = result.result;
    const lines = [
      `GST Calculation (${result.mode === "add" ? "Add GST" : "Remove GST"})`,
      `Amount Entered  : ₹${fmt(result.amount)}`,
      `GST Rate        : ${result.rate}%`,
      `Base Amount     : ₹${fmt(r.base)}`,
      `GST Amount      : ₹${fmt(r.gstAmt)}`,
      taxType === "intra"
        ? `  CGST (${result.rate / 2}%)   : ₹${fmt(r.cgst)}\n  SGST (${result.rate / 2}%)   : ₹${fmt(r.sgst)}`
        : `  IGST (${result.rate}%)   : ₹${fmt(r.igst)}`,
      `Total Amount    : ₹${fmt(r.total)}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleReset() {
    setAmount(""); setResult(null); setError(""); setCopied(false);
    setRateId("18"); setCustom(""); setUseCustom(false); setTaxType("intra");
  }

  function handleHistoryClick(entry) {
    setMode(entry.mode);
    setAmount(String(entry.amount));
    if (GST_RATES.find(r => r.id === String(entry.rate))) {
      setRateId(String(entry.rate)); setUseCustom(false);
    } else {
      setCustom(String(entry.rate)); setUseCustom(true);
    }
    setTaxType(entry.taxType);
    setResult(entry);
  }

  function deleteHistory(id) {
    setHistory(h => h.filter(e => e.id !== id));
    if (result?.id === id) setResult(null);
  }

  /* ── Bar widths ── */
  const baseBarPct = result
    ? (result.result.base / result.result.total) * 100
    : 0;
  const gstBarPct = result
    ? (result.result.gstAmt / result.result.total) * 100
    : 0;

  return (
    <>
      <Helmet>
        <title>GST Calculator – Add & Remove GST Online | ShauryaTools</title>
        <meta name="description" content="Calculate GST instantly. Add GST to a base price or remove GST from an inclusive price. Supports all GST slabs — 0%, 5%, 12%, 18%, 28%. CGST, SGST & IGST breakdown included." />
        <meta name="keywords" content="GST calculator, add GST, remove GST, GST inclusive exclusive, CGST SGST IGST, GST percentage calculator, India GST" />
        <link rel="canonical" href="https://shauryatools.vercel.app/gst-calculator" />
      </Helmet>

      <div className="gst-page">
        <div className="gst-inner">

          {/* ── Header ── */}
          <div className="gst-header">
            <div className="gst-icon"><Receipt size={22} strokeWidth={2} /></div>
            <div>
              <span className="gst-cat">Finance Tools</span>
              <h1>GST Calculator</h1>
              <p>Add GST to a base price or extract GST from an inclusive price — with full CGST, SGST & IGST breakdown.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="gst-card">

            {/* Mode toggle */}
            <div className="gst-mode-toggle">
              <button
                className={`gst-mode-btn gst-mode-add ${mode === "add" ? "gst-mode-on" : ""}`}
                onClick={() => { setMode("add"); setResult(null); setError(""); }}
              >
                <Plus size={16} strokeWidth={2.5} className="gst-mode-icon-add" />
                Add GST
              </button>
              <button
                className={`gst-mode-btn gst-mode-remove ${mode === "remove" ? "gst-mode-on" : ""}`}
                onClick={() => { setMode("remove"); setResult(null); setError(""); }}
              >
                <Minus size={16} strokeWidth={2.5} className="gst-mode-icon-remove" />
                Remove GST
              </button>
            </div>

            <p className="gst-mode-desc">
              {mode === "add"
                ? "Enter the base (pre-tax) amount → get the GST-inclusive total"
                : "Enter the GST-inclusive amount → extract the base price and GST paid"}
            </p>

            <div className="gst-divider" />

            {/* Amount */}
            <div>
              <div className="gst-label">
                <IndianRupee size={14} strokeWidth={2.5} className="gst-lbl-icon" />
                {mode === "add" ? "Base Amount (Excluding GST)" : "Total Amount (Including GST)"}
              </div>
              <div className="gst-input-wrap">
                <span className="gst-prefix">₹</span>
                <input
                  className="gst-input gst-input-has-prefix"
                  type="number"
                  min="0"
                  placeholder="e.g. 10000"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setResult(null); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && calculate()}
                />
              </div>
            </div>

            <div className="gst-divider" />

            {/* GST Rate */}
            <div>
              <div className="gst-label">
                <Percent size={14} strokeWidth={2.5} className="gst-lbl-icon" />
                GST Rate
              </div>
              <div className="gst-rate-grid">
                {GST_RATES.map(r => (
                  <button
                    key={r.id}
                    className={`gst-rate-btn ${!useCustom && rateId === r.id ? "gst-rate-on" : ""}`}
                    onClick={() => { setRateId(r.id); setUseCustom(false); setResult(null); setError(""); }}
                  >
                    {r.label}
                    <span className="gst-rate-sub">{r.desc}</span>
                  </button>
                ))}
              </div>
              <div className="gst-custom-wrap">
                <input
                  className="gst-custom-input"
                  type="number" min="0" max="100" step="0.01"
                  placeholder="Custom"
                  value={customRate}
                  onChange={e => { setCustom(e.target.value); setUseCustom(true); setResult(null); setError(""); }}
                />
                <span className="gst-custom-label">% — enter a custom rate</span>
              </div>
            </div>

            <div className="gst-divider" />

            {/* Tax type */}
            <div>
              <div className="gst-label">
                <SplitSquareHorizontal size={14} strokeWidth={2.5} className="gst-lbl-icon" />
                Transaction Type
                <span className="gst-lbl-sub">(affects CGST/SGST vs IGST split)</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: "intra", label: "Intra-State", sub: "CGST + SGST" },
                  { id: "inter", label: "Inter-State", sub: "IGST" },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`gst-rate-btn ${taxType === t.id ? "gst-rate-on" : ""}`}
                    style={{ flex: 1, padding: "11px 10px" }}
                    onClick={() => { setTaxType(t.id); setResult(null); }}
                  >
                    {t.label}
                    <span className="gst-rate-sub">{t.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="gst-error"><AlertCircle size={14} strokeWidth={2.5} />{error}</div>
            )}

            <button
              className="gst-submit"
              onClick={calculate}
              disabled={!amount}
            >
              <Calculator size={16} strokeWidth={2} />
              Calculate GST
            </button>
          </div>

          {/* ── Result ── */}
          {result && (
            <>
              {/* Hero */}
              <div className={`gst-result-hero ${result.mode === "add" ? "gst-hero-add" : "gst-hero-remove"} gst-animate`}>
                <div className="gst-hero-left">
                  <span className="gst-hero-label">
                    {result.mode === "add" ? "Total Payable (GST Inclusive)" : "Base Price (GST Exclusive)"}
                  </span>
                  <div className="gst-hero-amount">
                    ₹{fmt(result.mode === "add" ? result.result.total : result.result.base)}
                  </div>
                  <p className="gst-hero-sub">
                    GST @ {result.rate}% · ₹{fmt(result.result.gstAmt)} tax amount
                  </p>
                </div>
                <div className="gst-hero-badge">
                  {result.rate}% GST
                </div>
              </div>

              {/* Stats */}
              <div className="gst-stats-row gst-animate">
                <div className="gst-stat-box">
                  <div className="gst-stat-icon gst-si-accent"><IndianRupee size={14} strokeWidth={2.5} /></div>
                  <span className="gst-stat-val">₹{fmt(result.result.base)}</span>
                  <span className="gst-stat-lbl">Base Amount</span>
                </div>
                <div className="gst-stat-box">
                  <div className="gst-stat-icon gst-si-violet"><Percent size={14} strokeWidth={2.5} /></div>
                  <span className="gst-stat-val">₹{fmt(result.result.gstAmt)}</span>
                  <span className="gst-stat-lbl">GST Amount</span>
                </div>
                <div className="gst-stat-box">
                  <div className="gst-stat-icon gst-si-green"><Receipt size={14} strokeWidth={2.5} /></div>
                  <span className="gst-stat-val">₹{fmt(result.result.total)}</span>
                  <span className="gst-stat-lbl">Total Amount</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="gst-card gst-animate">
                <div className="gst-card-title">
                  <BarChart2 size={15} strokeWidth={2.5} />
                  Full Breakdown
                </div>

                <div className="gst-breakdown">
                  {/* Base */}
                  <div className="gst-bk-row">
                    <div className="gst-bk-left">
                      <div className="gst-bk-dot gst-bk-dot-base" />
                      <div>
                        <div className="gst-bk-label">Base Amount</div>
                        <div className="gst-bk-sub">Pre-tax value</div>
                      </div>
                    </div>
                    <div className="gst-bk-right">
                      <div className="gst-bk-amount">₹{fmt(result.result.base)}</div>
                      <div className="gst-bk-pct">{((result.result.base / result.result.total) * 100).toFixed(1)}% of total</div>
                    </div>
                  </div>

                  {/* GST split */}
                  {taxType === "intra" ? (
                    <>
                      <div className="gst-bk-row">
                        <div className="gst-bk-left">
                          <div className="gst-bk-dot gst-bk-dot-cgst" />
                          <div>
                            <div className="gst-bk-label">CGST ({result.rate / 2}%)</div>
                            <div className="gst-bk-sub">Central GST</div>
                          </div>
                        </div>
                        <div className="gst-bk-right">
                          <div className="gst-bk-amount">₹{fmt(result.result.cgst)}</div>
                          <div className="gst-bk-pct">{((result.result.cgst / result.result.total) * 100).toFixed(1)}% of total</div>
                        </div>
                      </div>
                      <div className="gst-bk-row">
                        <div className="gst-bk-left">
                          <div className="gst-bk-dot gst-bk-dot-sgst" />
                          <div>
                            <div className="gst-bk-label">SGST ({result.rate / 2}%)</div>
                            <div className="gst-bk-sub">State GST</div>
                          </div>
                        </div>
                        <div className="gst-bk-right">
                          <div className="gst-bk-amount">₹{fmt(result.result.sgst)}</div>
                          <div className="gst-bk-pct">{((result.result.sgst / result.result.total) * 100).toFixed(1)}% of total</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="gst-bk-row">
                      <div className="gst-bk-left">
                        <div className="gst-bk-dot gst-bk-dot-igst" />
                        <div>
                          <div className="gst-bk-label">IGST ({result.rate}%)</div>
                          <div className="gst-bk-sub">Integrated GST</div>
                        </div>
                      </div>
                      <div className="gst-bk-right">
                        <div className="gst-bk-amount">₹{fmt(result.result.igst)}</div>
                        <div className="gst-bk-pct">{((result.result.igst / result.result.total) * 100).toFixed(1)}% of total</div>
                      </div>
                    </div>
                  )}

                  {/* Total row */}
                  <div className="gst-bk-row gst-bk-total-row">
                    <div className="gst-bk-left">
                      <div className="gst-bk-dot gst-bk-dot-total" />
                      <div>
                        <div className="gst-bk-label">Total Amount</div>
                        <div className="gst-bk-sub">GST inclusive</div>
                      </div>
                    </div>
                    <div className="gst-bk-right">
                      <div className="gst-bk-amount" style={{ fontSize: "1.15rem", color: "var(--green)" }}>
                        ₹{fmt(result.result.total)}
                      </div>
                      <div className="gst-bk-pct">100%</div>
                    </div>
                  </div>
                </div>

                {/* Visual split bar */}
                <div className="gst-bar-section">
                  <div className="gst-bar-label-row">
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--grey-3)" }}>Amount composition</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--fg-accent)" }}>
                      Base {((result.result.base / result.result.total) * 100).toFixed(1)}% · GST {((result.result.gstAmt / result.result.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="gst-bar-track">
                    <div className="gst-bar-base" style={{ width: `${baseBarPct}%` }} />
                    <div className={`gst-bar-gst ${result.mode === "add" ? "gst-bar-gst-add" : "gst-bar-gst-remove"}`} style={{ width: `${gstBarPct}%` }} />
                  </div>
                  <div className="gst-bar-legend">
                    <div className="gst-bar-legend-item">
                      <div className="gst-bar-legend-dot" style={{ background: "var(--fg-accent)" }} />
                      Base ₹{fmt(result.result.base)}
                    </div>
                    <div className="gst-bar-legend-item">
                      <div className="gst-bar-legend-dot" style={{ background: result.mode === "add" ? "var(--green)" : "var(--red)" }} />
                      GST ₹{fmt(result.result.gstAmt)}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="gst-footer">
                  <span className="gst-footer-note">
                    {result.mode === "add" ? "GST added to base" : "GST extracted from inclusive price"} · Rate {result.rate}%
                  </span>
                  <div className="gst-footer-btns">
                    <button className="gst-action-btn" onClick={handleReset}>
                      <RefreshCw size={13} strokeWidth={2.5} />New
                    </button>
                    <button className={`gst-copy-btn ${copied ? "gst-copy-btn-done" : ""}`} onClick={handleCopy}>
                      {copied
                        ? <><Check size={13} strokeWidth={2.5} />Copied!</>
                        : <><Copy size={13} strokeWidth={2.5} />Copy Result</>}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── History ── */}
          <div className="gst-card">
            <div className="gst-card-title">
              <Clock size={15} strokeWidth={2.5} />
              Recent Calculations
              {history.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 500, color: "var(--grey-3)" }}>
                  Click to restore
                </span>
              )}
            </div>

            {history.length === 0 ? (
              <div className="gst-history-empty">
                <div className="gst-history-empty-icon">🧾</div>
                <p className="gst-history-empty-text">Your calculations will appear here</p>
              </div>
            ) : (
              <div className="gst-history">
                {history.map(entry => (
                  <div key={entry.id} className="gst-history-row" onClick={() => handleHistoryClick(entry)}>
                    <div className={`gst-hist-mode-dot ${entry.mode === "add" ? "gst-hist-add" : "gst-hist-remove"}`} />
                    <div className="gst-hist-info">
                      <div className="gst-hist-top">
                        <span className="gst-hist-amount">₹{fmt(entry.amount)}</span>
                        <span className={`gst-hist-mode-tag ${entry.mode === "add" ? "gst-hist-tag-add" : "gst-hist-tag-remove"}`}>
                          {entry.mode === "add" ? "+ GST" : "− GST"}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--grey-3)", fontWeight: 600 }}>@ {entry.rate}%</span>
                      </div>
                      <div className="gst-hist-sub">
                        GST: ₹{fmt(entry.result.gstAmt)} · {entry.taxType === "intra" ? "Intra-State" : "Inter-State"}
                      </div>
                    </div>
                    <ArrowRight size={12} strokeWidth={2} style={{ color: "var(--grey-3)", flexShrink: 0 }} />
                    <span className={`gst-hist-result ${entry.mode === "add" ? "gst-hist-result-add" : "gst-hist-result-remove"}`}>
                      ₹{fmt(entry.result.total)}
                    </span>
                    <button
                      className="gst-hist-del"
                      onClick={e => { e.stopPropagation(); deleteHistory(entry.id); }}
                      title="Remove"
                    >
                      <Trash2 size={12} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
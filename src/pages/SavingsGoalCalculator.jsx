/* eslint-disable no-empty */
import { useState, useMemo } from "react";
import "./SavingsGoalCalculator.css";
import { Helmet } from "react-helmet";
import {
  PiggyBank,
  Target,
  DollarSign,
  Calendar,
  TrendingUp,
  Percent,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  Briefcase,
  Shield,
  Sparkles,
  Info,
  AlertTriangle,
} from "lucide-react";

/* ── Goal Presets ── */
const GOAL_PRESETS = [
  { id: "emergency",   label: "Emergency Fund", icon: Shield,       amount: 10000, months: 12  },
  { id: "house",       label: "House Down Pmt", icon: Home,         amount: 50000, months: 60  },
  { id: "car",         label: "Car",            icon: Car,          amount: 15000, months: 24  },
  { id: "vacation",    label: "Vacation",       icon: Plane,        amount: 5000,  months: 12  },
  { id: "education",   label: "Education",      icon: GraduationCap,amount: 20000, months: 36  },
  { id: "retirement",  label: "Retirement",     icon: Briefcase,    amount: 500000,months: 360 },
  { id: "wedding",     label: "Wedding",        icon: Heart,        amount: 25000, months: 24  },
  { id: "custom",      label: "Custom Goal",    icon: Target,       amount: "",    months: ""  },
];

/* ── Contribution Frequencies ── */
const FREQUENCIES = [
  { id: "monthly",  label: "Monthly",  perYear: 12  },
  { id: "weekly",   label: "Weekly",   perYear: 52  },
  { id: "biweekly", label: "Bi-weekly",perYear: 26  },
  { id: "daily",    label: "Daily",    perYear: 365 },
];

/* ── Format helpers ── */
function fmt(n, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n || 0);
}
function fmtNum(n) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}
function monthsToReadable(m) {
  if (m < 1) return "< 1 month";
  const y = Math.floor(m / 12);
  const mo = Math.round(m % 12);
  if (y === 0) return `${mo} mo`;
  if (mo === 0) return `${y} yr`;
  return `${y} yr ${mo} mo`;
}

/* ── Mini line sparkline ── */
function Sparkline({ data, color = "var(--sgc-accent)" }) {
  if (!data || data.length < 2) return null;
  const w = 280, h = 60;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="sgc-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sgcGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sgcGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── Milestone row ── */
function MilestoneRow({ pct, label, date, reached }) {
  return (
    <div className={`sgc-milestone ${reached ? "sgc-milestone-done" : ""}`}>
      <div className="sgc-milestone-dot-wrap">
        {reached
          ? <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: "var(--green)" }} />
          : <div className="sgc-milestone-dot" />}
      </div>
      <div className="sgc-milestone-info">
        <span className="sgc-milestone-label">{pct}% — {label}</span>
        <span className="sgc-milestone-date">{date}</span>
      </div>
    </div>
  );
}

/* ── Progress ring ── */
function ProgressRing({ pct, size = 120, stroke = 10, color = "var(--sgc-accent)" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="sgc-ring">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--grey-2)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text x={size/2} y={size/2 - 6} textAnchor="middle" className="sgc-ring-pct">{Math.round(pct)}%</text>
      <text x={size/2} y={size/2 + 12} textAnchor="middle" className="sgc-ring-label">saved</text>
    </svg>
  );
}

/* ── Main Component ── */
export default function SavingsGoalCalculator() {
  const [preset,       setPreset]     = useState("emergency");
  const [goalAmount,   setGoalAmt]    = useState("10000");
  const [savedAlready, setSaved]      = useState("");
  const [contribution, setContrib]    = useState("");
  const [frequency,    setFreq]       = useState("monthly");
  const [annualRate,   setRate]       = useState("4.5");
  const [timelineMode, setMode]       = useState("by-contrib"); // by-contrib | by-date
  const [targetMonths, setTargetMo]   = useState("");
  const [activeTab,    setActiveTab]  = useState("results");
  const [openFAQ,      setOpenFAQ]    = useState(null);

  /* ── Apply preset ── */
  function applyPreset(p) {
    setPreset(p.id);
    if (p.id !== "custom") {
      setGoalAmt(String(p.amount));
      setTargetMo(String(p.months));
    }
  }

  /* ── Core calculations ── */
  const calc = useMemo(() => {
    const goal    = parseFloat(goalAmount)   || 0;
    const saved   = parseFloat(savedAlready) || 0;
    const contrib = parseFloat(contribution) || 0;
    const rateAnn = parseFloat(annualRate)   || 0;
    const freq    = FREQUENCIES.find(f => f.id === frequency);
    const perYear = freq?.perYear || 12;
    const ratePerPeriod = rateAnn / 100 / perYear;
    const remaining = Math.max(0, goal - saved);

    if (goal <= 0) return null;

    /* --- Mode A: given contribution → compute time --- */
    let monthsNeeded = 0;
    let totalContributed = 0;
    let totalInterest = 0;
    let periodsNeeded = 0;

    if (timelineMode === "by-contrib" && contrib > 0) {
      if (ratePerPeriod === 0) {
        periodsNeeded = remaining / contrib;
      } else {
        // FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r  solve for n
        // n = log((FV*r + PMT) / (PV*r + PMT)) / log(1+r)
        const pv = saved;
        const fv = goal;
        const pmt = contrib;
        const r = ratePerPeriod;
        const num = Math.log((fv * r + pmt) / (pv * r + pmt));
        const den = Math.log(1 + r);
        periodsNeeded = num / den;
      }
      if (periodsNeeded < 0 || !isFinite(periodsNeeded)) {
        periodsNeeded = 0;
      }
      monthsNeeded = (periodsNeeded / perYear) * 12;
      totalContributed = contrib * periodsNeeded;
      const fvContribs = ratePerPeriod === 0
        ? totalContributed
        : contrib * ((Math.pow(1 + ratePerPeriod, periodsNeeded) - 1) / ratePerPeriod);
      const fvSaved = saved * Math.pow(1 + ratePerPeriod, periodsNeeded);
      totalInterest = Math.max(0, fvSaved + fvContribs - saved - totalContributed);
    }

    /* --- Mode B: given target months → compute required contribution --- */
    let requiredContrib = 0;
    if (timelineMode === "by-date") {
      const tgtMonths = parseFloat(targetMonths) || 0;
      const n = Math.round((tgtMonths / 12) * perYear);
      if (n > 0) {
        if (ratePerPeriod === 0) {
          requiredContrib = remaining / n;
        } else {
          const r = ratePerPeriod;
          const pv = saved;
          const fv = goal;
          // PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
          const growth = Math.pow(1 + r, n);
          requiredContrib = (fv - pv * growth) * r / (growth - 1);
        }
        if (requiredContrib < 0) requiredContrib = 0;
        periodsNeeded = n;
        monthsNeeded = tgtMonths;
        totalContributed = requiredContrib * n;
        const fvContribs = ratePerPeriod === 0
          ? totalContributed
          : requiredContrib * ((Math.pow(1 + ratePerPeriod, n) - 1) / ratePerPeriod);
        const fvSaved = saved * Math.pow(1 + ratePerPeriod, n);
        totalInterest = Math.max(0, fvSaved + fvContribs - saved - totalContributed);
      }
    }

    const displayContrib = timelineMode === "by-contrib" ? contrib : requiredContrib;

    /* --- Growth data for sparkline (monthly points) --- */
    const sparkMonths = Math.min(Math.ceil(monthsNeeded), 360);
    const sparkData = [];
    let bal = saved;
    const monthlyRate = rateAnn / 100 / 12;
    const contribPerMonth = displayContrib * (perYear / 12);
    for (let m = 0; m <= sparkMonths; m++) {
      sparkData.push(bal);
      bal = bal * (1 + monthlyRate) + contribPerMonth;
      if (bal >= goal) { sparkData.push(goal); break; }
    }

    /* --- Milestones --- */
    const now = new Date();
    function dateAtMonth(m) {
      const d = new Date(now);
      d.setMonth(d.getMonth() + Math.round(m));
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    const milestones = [25, 50, 75, 100].map(p => {
      const target = goal * (p / 100);
      if (target <= saved) return { pct: p, label: fmt(target), date: "Already reached", reached: true };
      const subRemaining = target - saved;
      let moPct;
      if (ratePerPeriod === 0) {
        moPct = (subRemaining / contribPerMonth);
      } else {
        const r = monthlyRate;
        const pv = saved;
        const pmt = contribPerMonth;
        const fv = target;
        const num = Math.log((fv * r + pmt) / (pv * r + pmt));
        const den = Math.log(1 + r);
        moPct = num / den;
      }
      return { pct: p, label: fmt(target), date: dateAtMonth(moPct), reached: false };
    });

    const savedPct = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;

    return {
      goal, saved, remaining,
      monthsNeeded, periodsNeeded, totalContributed,
      totalInterest, displayContrib, sparkData, milestones,
      savedPct, frequency: freq,
      endDate: dateAtMonth(monthsNeeded),
      interestMultiple: totalContributed > 0 ? ((totalContributed + totalInterest) / totalContributed) : 1,
    };
  }, [goalAmount, savedAlready, contribution, frequency, annualRate, timelineMode, targetMonths]);

  function handleReset() {
    setPreset("emergency"); setGoalAmt("10000"); setSaved("");
    setContrib(""); setFreq("monthly"); setRate("4.5");
    setMode("by-contrib"); setTargetMo(""); setActiveTab("results");
  }

  const hasResult = calc && calc.goal > 0 &&
    ((timelineMode === "by-contrib" && parseFloat(contribution) > 0) ||
     (timelineMode === "by-date"    && parseFloat(targetMonths) > 0));

  const faqs = [
    { q: "What interest rate should I use?", a: "For a High-Yield Savings Account (HYSA), use 4–5%. For a money market account, use 3–4.5%. For investing in index funds (long-term), historically 7–10%. For a regular savings account, 0.5–2%." },
    { q: "Does compounding frequency matter?", a: "Yes, but for savings goals the difference is modest. Daily compounding earns slightly more than monthly. This calculator uses your selected contribution frequency for compounding, which is a conservative and practical estimate." },
    { q: "How does already-saved amount help?", a: "Your existing savings immediately starts earning interest, giving it a head start. Even a small initial deposit significantly reduces the time and contributions needed to reach your goal." },
    { q: "What is the 50/30/20 rule for savings?", a: "The 50/30/20 rule suggests allocating 50% of income to needs, 30% to wants, and 20% to savings and debt repayment. Use the 20% savings slice to fund your goal contributions." },
  ];

  return (
    <>
      <Helmet>
        <title>Free Savings Goal Calculator – Plan Your Savings with Interest | ShauryaTools</title>
        <meta name="description" content="Calculate how long it takes to reach your savings goal. Enter your goal amount, contributions, and interest rate to get a personalized savings timeline, milestones, and growth chart. Free tool." />
        <meta name="keywords" content="savings goal calculator, savings calculator, how long to save, savings timeline, compound interest calculator, personal finance tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/savings-goal-calculator" />
      </Helmet>

      <div className="sgc-page">
        <div className="sgc-inner">

          {/* ── Header ── */}
          <div className="sgc-header">
            <div className="sgc-icon"><PiggyBank size={20} strokeWidth={2} /></div>
            <div>
              <span className="sgc-cat">AI Finance Tools</span>
              <h1>Savings Goal Calculator</h1>
              <p>Set your goal, enter your contributions and interest rate — see exactly when you'll hit your target.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="sgc-card">

            {/* Goal Presets */}
            <div className="sgc-field">
              <label className="sgc-label"><Target size={14} strokeWidth={2.5} className="sgc-lbl-icon" />Savings Goal</label>
              <div className="sgc-presets-grid">
                {GOAL_PRESETS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} className={`sgc-preset-btn ${preset === p.id ? "sgc-preset-on" : ""}`} onClick={() => applyPreset(p)}>
                      <Icon size={14} strokeWidth={2} className="sgc-preset-icon" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="sgc-amount-input-wrap">
                <span className="sgc-dollar">$</span>
                <input
                  className="sgc-amount-input"
                  type="number" min="0"
                  placeholder="Enter goal amount..."
                  value={goalAmount}
                  onChange={e => { setGoalAmt(e.target.value); setPreset("custom"); }}
                />
              </div>
            </div>

            <div className="sgc-divider" />

            {/* Already Saved */}
            <div className="sgc-field">
              <label className="sgc-label"><PiggyBank size={14} strokeWidth={2.5} className="sgc-lbl-icon" />Already Saved <span className="sgc-optional">(optional)</span></label>
              <div className="sgc-amount-input-wrap">
                <span className="sgc-dollar">$</span>
                <input
                  className="sgc-amount-input"
                  type="number" min="0"
                  placeholder="e.g. 1500"
                  value={savedAlready}
                  onChange={e => setSaved(e.target.value)}
                />
              </div>
            </div>

            <div className="sgc-divider" />

            {/* Interest Rate */}
            <div className="sgc-field">
              <label className="sgc-label"><Percent size={14} strokeWidth={2.5} className="sgc-lbl-icon" />Annual Interest Rate</label>
              <div className="sgc-rate-row">
                <div className="sgc-rate-input-wrap">
                  <input
                    className="sgc-rate-input"
                    type="number" min="0" max="30" step="0.1"
                    value={annualRate}
                    onChange={e => setRate(e.target.value)}
                  />
                  <span className="sgc-rate-pct">%</span>
                </div>
                <div className="sgc-rate-presets">
                  {[["0", "No interest"], ["2", "Regular savings"], ["4.5", "HYSA"], ["7", "Investing"]].map(([v, lbl]) => (
                    <button key={v} className={`sgc-rate-chip ${annualRate === v ? "sgc-rate-chip-on" : ""}`} onClick={() => setRate(v)}>
                      {v}% <span className="sgc-rate-chip-sub">{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sgc-divider" />

            {/* Mode toggle */}
            <div className="sgc-field">
              <div className="sgc-mode-toggle">
                <button className={`sgc-mode-btn ${timelineMode === "by-contrib" ? "sgc-mode-on" : ""}`} onClick={() => setMode("by-contrib")}>
                  <DollarSign size={13} strokeWidth={2.5} />I know my contribution
                </button>
                <button className={`sgc-mode-btn ${timelineMode === "by-date" ? "sgc-mode-on" : ""}`} onClick={() => setMode("by-date")}>
                  <Calendar size={13} strokeWidth={2.5} />I have a target date
                </button>
              </div>
            </div>

            {/* By Contribution */}
            {timelineMode === "by-contrib" && (
              <div className="sgc-field animate-in">
                <label className="sgc-label"><DollarSign size={14} strokeWidth={2.5} className="sgc-lbl-icon" />Contribution Amount</label>
                <div className="sgc-contrib-row">
                  <div className="sgc-amount-input-wrap" style={{ flex: 1 }}>
                    <span className="sgc-dollar">$</span>
                    <input
                      className="sgc-amount-input"
                      type="number" min="0"
                      placeholder="e.g. 500"
                      value={contribution}
                      onChange={e => setContrib(e.target.value)}
                    />
                  </div>
                  <div className="sgc-freq-group">
                    {FREQUENCIES.map(f => (
                      <button key={f.id} className={`sgc-freq-btn ${frequency === f.id ? "sgc-freq-on" : ""}`} onClick={() => setFreq(f.id)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* By Date */}
            {timelineMode === "by-date" && (
              <div className="sgc-field animate-in">
                <label className="sgc-label"><Calendar size={14} strokeWidth={2.5} className="sgc-lbl-icon" />Target Timeline</label>
                <div className="sgc-contrib-row">
                  <div className="sgc-months-input-wrap">
                    <input
                      className="sgc-amount-input"
                      type="number" min="1"
                      placeholder="e.g. 24"
                      value={targetMonths}
                      onChange={e => setTargetMo(e.target.value)}
                    />
                    <span className="sgc-months-label">months</span>
                  </div>
                  <div className="sgc-freq-group">
                    {FREQUENCIES.map(f => (
                      <button key={f.id} className={`sgc-freq-btn ${frequency === f.id ? "sgc-freq-on" : ""}`} onClick={() => setFreq(f.id)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {targetMonths && (
                  <p className="sgc-hint">
                    Target: {new Date(new Date().setMonth(new Date().getMonth() + parseInt(targetMonths || 0))).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            )}

          </div>

          {/* ── Results ── */}
          {hasResult && calc && (
            <div className="sgc-card animate-in">

              {/* Result top bar */}
              <div className="sgc-result-top">
                <div className="sgc-result-meta">
                  <span className="sgc-badge"><Target size={12} strokeWidth={2.5} />{fmt(calc.goal)} Goal</span>
                  <span className="sgc-badge sgc-badge-time"><Clock size={11} strokeWidth={2} />{monthsToReadable(calc.monthsNeeded)}</span>
                </div>
                <div className="sgc-result-right">
                  <div className="sgc-tabs">
                    <button className={`sgc-tab ${activeTab === "results"    ? "sgc-tab-on" : ""}`} onClick={() => setActiveTab("results")}>Results</button>
                    <button className={`sgc-tab ${activeTab === "milestones" ? "sgc-tab-on" : ""}`} onClick={() => setActiveTab("milestones")}>Milestones</button>
                    <button className={`sgc-tab ${activeTab === "breakdown"  ? "sgc-tab-on" : ""}`} onClick={() => setActiveTab("breakdown")}>Breakdown</button>
                  </div>
                  <button className="sgc-action-btn" onClick={handleReset}><RefreshCw size={13} strokeWidth={2.5} />Reset</button>
                </div>
              </div>

              {/* ── RESULTS TAB ── */}
              {activeTab === "results" && (
                <div className="sgc-results animate-in">

                  {/* Hero row */}
                  <div className="sgc-hero-row">
                    <ProgressRing pct={calc.savedPct} size={130} stroke={11}
                      color={calc.savedPct >= 100 ? "var(--green)" : "var(--sgc-accent)"} />
                    <div className="sgc-hero-stats">
                      <div className="sgc-hero-stat">
                        <span className="sgc-hero-stat-label">
                          {timelineMode === "by-contrib" ? "Time to Goal" : "Required Contribution"}
                        </span>
                        <span className="sgc-hero-stat-val sgc-hero-accent">
                          {timelineMode === "by-contrib"
                            ? monthsToReadable(calc.monthsNeeded)
                            : fmt(calc.displayContrib) + " / " + calc.frequency.label.toLowerCase()}
                        </span>
                      </div>
                      <div className="sgc-hero-stat">
                        <span className="sgc-hero-stat-label">Goal Reached</span>
                        <span className="sgc-hero-stat-val">{calc.endDate}</span>
                      </div>
                      <div className="sgc-hero-stat">
                        <span className="sgc-hero-stat-label">Still Needed</span>
                        <span className="sgc-hero-stat-val">{fmt(calc.remaining)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="sgc-stats-grid">
                    <div className="sgc-stat-card">
                      <span className="sgc-stat-label">Goal Amount</span>
                      <span className="sgc-stat-val sgc-stat-goal">{fmt(calc.goal)}</span>
                    </div>
                    <div className="sgc-stat-card">
                      <span className="sgc-stat-label">Total Contributed</span>
                      <span className="sgc-stat-val">{fmt(calc.totalContributed + (parseFloat(savedAlready) || 0))}</span>
                    </div>
                    <div className="sgc-stat-card">
                      <span className="sgc-stat-label">Interest Earned</span>
                      <span className="sgc-stat-val sgc-stat-interest">{fmt(calc.totalInterest)}</span>
                    </div>
                    <div className="sgc-stat-card">
                      <span className="sgc-stat-label">Interest Boost</span>
                      <span className="sgc-stat-val sgc-stat-interest">
                        {calc.totalInterest > 0 ? "+" + fmt(calc.totalInterest) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Sparkline chart */}
                  {calc.sparkData.length > 2 && (
                    <div className="sgc-chart-card">
                      <div className="sgc-chart-header">
                        <span className="sgc-chart-title"><TrendingUp size={13} strokeWidth={2.5} className="sgc-chart-icon" />Savings Growth</span>
                        <span className="sgc-chart-range">{monthsToReadable(calc.monthsNeeded)}</span>
                      </div>
                      <Sparkline data={calc.sparkData} />
                      <div className="sgc-chart-labels">
                        <span>Today — {fmt(parseFloat(savedAlready) || 0)}</span>
                        <span>{calc.endDate} — {fmt(calc.goal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Tip banner */}
                  {calc.totalInterest > 0 && (
                    <div className="sgc-tip-banner">
                      <Sparkles size={14} strokeWidth={2} className="sgc-tip-icon" />
                      <span>Compound interest will earn you <strong>{fmt(calc.totalInterest)}</strong> — that's money you never had to save!</span>
                    </div>
                  )}
                  {calc.monthsNeeded > 120 && (
                    <div className="sgc-warn-banner">
                      <AlertTriangle size={14} strokeWidth={2} className="sgc-warn-icon" />
                      <span>This goal takes over {Math.round(calc.monthsNeeded / 12)} years. Consider increasing contributions or a higher-yield account.</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── MILESTONES TAB ── */}
              {activeTab === "milestones" && (
                <div className="sgc-milestones animate-in">
                  <p className="sgc-milestones-intro">Track your journey to {fmt(calc.goal)} with these key checkpoints.</p>
                  <div className="sgc-milestones-list">
                    {calc.milestones.map((m, i) => (
                      <MilestoneRow key={i} pct={m.pct} label={m.label} date={m.date} reached={m.reached} />
                    ))}
                  </div>
                  <div className="sgc-milestones-tip">
                    <Info size={13} strokeWidth={2.5} className="sgc-info-icon" />
                    <span>Dates assume consistent {fmt(calc.displayContrib)} {calc.frequency?.label.toLowerCase()} contributions at {annualRate}% APY.</span>
                  </div>
                </div>
              )}

              {/* ── BREAKDOWN TAB ── */}
              {activeTab === "breakdown" && (
                <div className="sgc-breakdown animate-in">
                  {/* Stacked bar */}
                  <div className="sgc-breakdown-bar-wrap">
                    <div className="sgc-breakdown-bar">
                      {parseFloat(savedAlready) > 0 && (
                        <div className="sgc-bar-seg sgc-bar-saved" style={{ width: `${(parseFloat(savedAlready) / calc.goal) * 100}%` }} title="Already saved" />
                      )}
                      <div className="sgc-bar-seg sgc-bar-contrib" style={{ width: `${(calc.totalContributed / calc.goal) * 100}%` }} title="Contributions" />
                      <div className="sgc-bar-seg sgc-bar-interest" style={{ width: `${(calc.totalInterest / calc.goal) * 100}%` }} title="Interest" />
                    </div>
                    <div className="sgc-bar-legend">
                      <span><span className="sgc-legend-dot sgc-dot-saved" />Already saved ({fmt(parseFloat(savedAlready) || 0)})</span>
                      <span><span className="sgc-legend-dot sgc-dot-contrib" />Contributions ({fmt(calc.totalContributed)})</span>
                      <span><span className="sgc-legend-dot sgc-dot-interest" />Interest ({fmt(calc.totalInterest)})</span>
                    </div>
                  </div>

                  {/* Breakdown rows */}
                  <div className="sgc-breakdown-rows">
                    {[
                      { label: "Goal Amount",          val: fmt(calc.goal),                              note: "Target" },
                      { label: "Already Saved",         val: fmt(parseFloat(savedAlready) || 0),          note: "Head start" },
                      { label: "Still Needed",          val: fmt(calc.remaining),                         note: "To contribute" },
                      { label: `${calc.frequency?.label} Contribution`, val: fmt(calc.displayContrib),   note: "Per period" },
                      { label: "Total Periods",         val: fmtNum(calc.periodsNeeded),                  note: calc.frequency?.label },
                      { label: "Total Contributed",     val: fmt(calc.totalContributed),                  note: "Your money" },
                      { label: "Interest Earned",       val: fmt(calc.totalInterest),                     note: "Free money 🎉" },
                      { label: "Time to Goal",          val: monthsToReadable(calc.monthsNeeded),          note: "Timeline" },
                      { label: "Goal Reached By",       val: calc.endDate,                                note: "Target date" },
                    ].map((row, i) => (
                      <div key={i} className="sgc-breakdown-row">
                        <span className="sgc-breakdown-key">{row.label}</span>
                        <span className="sgc-breakdown-note">{row.note}</span>
                        <span className="sgc-breakdown-val">{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FAQ ── */}
          <div className="sgc-card">
            <div className="sgc-faq-header">
              <Info size={14} strokeWidth={2.5} className="sgc-lbl-icon" />
              <span className="sgc-faq-title">Common Questions</span>
            </div>
            {faqs.map((faq, i) => (
              <div key={i} className="sgc-faq-item">
                <button className="sgc-faq-q" onClick={() => setOpenFAQ(openFAQ === i ? null : i)}>
                  {faq.q}
                  {openFAQ === i
                    ? <ChevronUp size={14} strokeWidth={2} className="sgc-faq-chevron" />
                    : <ChevronDown size={14} strokeWidth={2} className="sgc-faq-chevron" />}
                </button>
                {openFAQ === i && <p className="sgc-faq-a animate-in">{faq.a}</p>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
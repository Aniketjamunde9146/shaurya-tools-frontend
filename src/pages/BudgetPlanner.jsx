/* eslint-disable no-empty */
import { useState, useCallback } from "react";
import { generateAI } from "../api";
import "./BudgetPlanner.css";
import { Helmet } from "react-helmet";
import {
  Wallet,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Home,
  Car,
  ShoppingCart,
  Utensils,
  Heart,
  Plane,
  Smartphone,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PieChart,
  BarChart2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

/* ── Income Frequencies ── */
const FREQUENCIES = [
  { id: "monthly",    label: "Monthly"   },
  { id: "biweekly",  label: "Bi-weekly" },
  { id: "weekly",    label: "Weekly"    },
  { id: "annual",    label: "Annual"    },
];

/* ── Budget Goals ── */
const GOALS = [
  { id: "save",      label: "Save More",       icon: TrendingUp  },
  { id: "debt",      label: "Pay Off Debt",    icon: TrendingDown},
  { id: "invest",    label: "Start Investing", icon: BarChart2   },
  { id: "emergency", label: "Emergency Fund",  icon: Heart       },
  { id: "travel",    label: "Travel Fund",     icon: Plane       },
  { id: "custom",    label: "Custom Goal",     icon: Target      },
];

/* ── Lifestyle ── */
const LIFESTYLES = [
  { id: "student",     label: "Student",     desc: "College / grad"  },
  { id: "single",      label: "Single",      desc: "Living alone"    },
  { id: "couple",      label: "Couple",      desc: "Two incomes"     },
  { id: "family",      label: "Family",      desc: "With kids"       },
  { id: "retiree",     label: "Retiree",     desc: "Post-career"     },
  { id: "freelancer",  label: "Freelancer",  desc: "Self-employed"   },
];

/* ── Default expense categories ── */
const DEFAULT_CATEGORIES = [
  { id: 1, name: "Housing",       icon: Home,         amount: "", color: "#0d9488" },
  { id: 2, name: "Transportation",icon: Car,          amount: "", color: "#7c3aed" },
  { id: 3, name: "Groceries",     icon: ShoppingCart, amount: "", color: "#d97706" },
  { id: 4, name: "Dining Out",    icon: Utensils,     amount: "", color: "#ef4444" },
  { id: 5, name: "Health",        icon: Heart,        amount: "", color: "#ec4899" },
  { id: 6, name: "Subscriptions", icon: Smartphone,   amount: "", color: "#6366f1" },
  { id: 7, name: "Education",     icon: GraduationCap,amount: "", color: "#059669" },
  { id: 8, name: "Entertainment", icon: Plane,        amount: "", color: "#f59e0b" },
];

/* ── Format currency ── */
function fmt(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

/* ── Parse AI response into sections ── */
function parseAIBudget(raw) {
  const sections = [];
  const lines = raw.split("\n").filter(l => l.trim());
  let current = null;
  for (const line of lines) {
    if (line.match(/^#{1,3}\s/) || line.match(/^\*\*[^*]+\*\*\s*$/) || line.match(/^[A-Z][A-Z\s]+:/)) {
      if (current) sections.push(current);
      current = { title: line.replace(/^#{1,3}\s|\*\*/g, "").replace(/:$/, "").trim(), items: [] };
    } else if (current && line.trim() && line.match(/^[-•*]|^\d+\./)) {
      current.items.push(line.replace(/^[-•*]\s*|\d+\.\s*/, "").trim());
    } else if (current && line.trim()) {
      current.items.push(line.trim());
    }
  }
  if (current) sections.push(current);
  return sections.filter(s => s.items.length > 0);
}

/* ── Donut chart (SVG) ── */
function DonutChart({ data, total }) {
  const size = 160;
  const r = 60;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;
  const slices = data.map(d => {
    const pct = total > 0 ? d.amount / total : 0;
    const dashArray = `${pct * circumference} ${circumference}`;
    const rotation = (cumulative / 1) * 360 - 90;
    cumulative += pct;
    return { ...d, dashArray, rotation };
  });

  return (
    <svg width={size} height={size} className="bp-donut">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--grey-2)" strokeWidth={22} />
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={22}
          strokeDasharray={s.dashArray}
          strokeDashoffset={0}
          transform={`rotate(${s.rotation} ${cx} ${cy})`}
          strokeLinecap="butt"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" className="bp-donut-label-top">Total</text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="bp-donut-label-amt">{fmt(total)}</text>
    </svg>
  );
}

/* ── Category Row ── */
function CategoryRow({ cat, onUpdate, onDelete }) {
  const Icon = cat.icon || DollarSign;
  return (
    <div className="bp-cat-row">
      <div className="bp-cat-icon-wrap" style={{ background: cat.color + "1a", borderColor: cat.color + "44" }}>
        <Icon size={14} strokeWidth={2} style={{ color: cat.color }} />
      </div>
      <span className="bp-cat-name">{cat.name}</span>
      <div className="bp-cat-input-wrap">
        <span className="bp-cat-dollar">$</span>
        <input
          className="bp-cat-input"
          type="number"
          min="0"
          placeholder="0"
          value={cat.amount}
          onChange={e => onUpdate(cat.id, e.target.value)}
        />
      </div>
      <button className="bp-cat-del" onClick={() => onDelete(cat.id)} title="Remove">
        <Trash2 size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ── AI Plan Section ── */
function PlanSection({ section, idx }) {
  const [open, setOpen] = useState(idx < 2);
  const icons = [TrendingUp, PieChart, Target, CheckCircle2, AlertTriangle, DollarSign];
  const Icon = icons[idx % icons.length];
  return (
    <div className="bp-plan-section">
      <button className="bp-plan-section-header" onClick={() => setOpen(o => !o)}>
        <div className="bp-plan-section-title">
          <Icon size={14} strokeWidth={2.5} className="bp-plan-section-icon" />
          {section.title}
        </div>
        {open ? <ChevronUp size={15} strokeWidth={2} className="bp-chevron" /> : <ChevronDown size={15} strokeWidth={2} className="bp-chevron" />}
      </button>
      {open && (
        <ul className="bp-plan-list animate-in">
          {section.items.map((item, i) => (
            <li key={i} className="bp-plan-item">
              <ArrowRight size={12} strokeWidth={2.5} className="bp-plan-arrow" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function BudgetPlanner() {
  const [income,      setIncome]    = useState("");
  const [frequency,   setFreq]      = useState("monthly");
  const [lifestyle,   setLifestyle] = useState("single");
  const [goal,        setGoal]      = useState("save");
  const [goalAmount,  setGoalAmt]   = useState("");
  const [categories,  setCats]      = useState(DEFAULT_CATEGORIES);
  const [newCatName,  setNewCat]    = useState("");
  const [loading,     setLoading]   = useState(false);
  const [error,       setError]     = useState("");
  const [plan,        setPlan]      = useState([]);
  const [rawOutput,   setRaw]       = useState("");
  const [activeTab,   setActiveTab] = useState("overview");
  const [copied,      setCopied]    = useState(false);
  const [notes,       setNotes]     = useState("");

  /* Monthly income normalised */
  const monthlyIncome = useCallback(() => {
    const v = parseFloat(income) || 0;
    if (frequency === "weekly")   return v * 52 / 12;
    if (frequency === "biweekly") return v * 26 / 12;
    if (frequency === "annual")   return v / 12;
    return v;
  }, [income, frequency]);

  const totalExpenses = categories.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const monthlyInc    = monthlyIncome();
  const remaining     = monthlyInc - totalExpenses;
  const savingsRate   = monthlyInc > 0 ? Math.round((remaining / monthlyInc) * 100) : 0;

  const chartData = categories
    .filter(c => parseFloat(c.amount) > 0)
    .map(c => ({ name: c.name, amount: parseFloat(c.amount), color: c.color }));

  const canSubmit = parseFloat(income) > 0 && !loading;

  function updateCat(id, val) {
    setCats(cs => cs.map(c => c.id === id ? { ...c, amount: val } : c));
    setError("");
  }

  function deleteCat(id) {
    setCats(cs => cs.filter(c => c.id !== id));
  }

  function addCategory() {
    if (!newCatName.trim()) return;
    const colors = ["#0d9488","#7c3aed","#d97706","#ef4444","#6366f1","#059669","#f59e0b","#ec4899"];
    setCats(cs => [...cs, {
      id: Date.now(),
      name: newCatName.trim(),
      icon: DollarSign,
      amount: "",
      color: colors[cs.length % colors.length],
    }]);
    setNewCat("");
  }

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true); setError(""); setPlan([]); setRaw("");

    const expenseList = categories
      .filter(c => parseFloat(c.amount) > 0)
      .map(c => `- ${c.name}: ${fmt(parseFloat(c.amount))}/month`)
      .join("\n");

    const prompt = `You are a certified financial planner. Create a detailed, personalized budget plan.

FINANCIAL SNAPSHOT:
- Monthly Income: ${fmt(monthlyInc)}
- Total Monthly Expenses: ${fmt(totalExpenses)}
- Monthly Remaining: ${fmt(remaining)}
- Savings Rate: ${savingsRate}%
- Lifestyle: ${lifestyle}
- Primary Goal: ${GOALS.find(g => g.id === goal)?.label}
${goalAmount ? `- Goal Amount: ${fmt(parseFloat(goalAmount))}` : ""}
${notes ? `- Additional context: ${notes}` : ""}

CURRENT EXPENSES:
${expenseList || "No expenses entered yet"}

Please provide a comprehensive budget plan with the following sections:

### Budget Health Assessment
Analyze their current budget, spending ratios, and financial health score.

### Recommended Budget Breakdown (50/30/20 Rule or adjusted)
Suggest ideal allocation percentages and amounts for needs, wants, and savings.

### Actionable Savings Tips
5-7 specific, practical tips to reduce expenses based on their spending.

### Goal Strategy
Step-by-step plan to achieve their primary goal (${GOALS.find(g => g.id === goal)?.label}).

### Monthly Milestones
Concrete monthly targets to track progress.

### Warning Signs to Watch
Red flags in their current budget that need attention.

Keep advice specific to their numbers. Be direct and actionable. No fluff.`;

    try {
      const res = await generateAI("budget", prompt);
      if (!res.data.success) throw new Error("AI generation failed");
      const raw = res.data.data.trim().replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
      setRaw(raw);
      const parsed = parseAIBudget(raw);
      if (parsed.length === 0) throw new Error("Could not parse plan");
      setPlan(parsed);
      setActiveTab("plan");
    } catch (e) {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    const blob = new Blob([rawOutput], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `budget-plan-${new Date().toISOString().split("T")[0]}.txt`;
    a.click(); URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setIncome(""); setFreq("monthly"); setLifestyle("single"); setGoal("save");
    setGoalAmt(""); setCats(DEFAULT_CATEGORIES); setNewCat(""); setNotes("");
    setPlan([]); setRaw(""); setError(""); setCopied(false); setActiveTab("overview");
  }

  const healthStatus =
    savingsRate >= 20 ? { label: "Excellent", color: "var(--green)", bg: "var(--green-bg)", bd: "var(--green-bd)" } :
    savingsRate >= 10 ? { label: "Good",      color: "#d97706",      bg: "#fffbeb",         bd: "#fde68a"         } :
    savingsRate >= 0  ? { label: "Tight",     color: "#ef4444",      bg: "#fef2f2",         bd: "#fecaca"         } :
                        { label: "Over Budget",color: "#ef4444",     bg: "#fef2f2",         bd: "#fecaca"         };

  return (
    <>
      <Helmet>
        <title>Free AI Budget Planner – Personal Budget Optimizer | ShauryaTools</title>
        <meta name="description" content="Plan your monthly budget with AI. Enter your income and expenses, get a personalized budget plan, savings tips, and goal strategies. Free budget planner tool." />
        <meta name="keywords" content="budget planner, ai budget, personal finance, expense tracker, savings planner, monthly budget, financial planning tool" />
        <link rel="canonical" href="https://shauryatools.vercel.app/budget-planner" />
      </Helmet>

      <div className="bp-page">
        <div className="bp-inner">

          {/* ── Header ── */}
          <div className="bp-header">
            <div className="bp-icon"><Wallet size={20} strokeWidth={2} /></div>
            <div>
              <span className="bp-cat">AI Finance Tools</span>
              <h1>Budget Planner</h1>
              <p>Enter your income and expenses — get a personalized AI budget plan with savings tips and goal strategies.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="bp-card">

            {/* Income */}
            <div className="bp-field">
              <label className="bp-label"><DollarSign size={14} strokeWidth={2.5} className="bp-lbl-icon" />Monthly Income</label>
              <div className="bp-income-row">
                <div className="bp-income-input-wrap">
                  <span className="bp-income-dollar">$</span>
                  <input
                    className="bp-income-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 4500"
                    value={income}
                    onChange={e => { setIncome(e.target.value); setError(""); }}
                  />
                </div>
                <div className="bp-freq-group">
                  {FREQUENCIES.map(f => (
                    <button key={f.id} className={`bp-freq-btn ${frequency === f.id ? "bp-freq-on" : ""}`} onClick={() => setFreq(f.id)}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {monthlyInc > 0 && frequency !== "monthly" && (
                <p className="bp-hint">≈ {fmt(monthlyInc)} / month</p>
              )}
            </div>

            <div className="bp-divider" />

            {/* Lifestyle */}
            <div className="bp-field">
              <label className="bp-label"><Heart size={14} strokeWidth={2.5} className="bp-lbl-icon" />Lifestyle</label>
              <div className="bp-grid bp-grid-6">
                {LIFESTYLES.map(l => (
                  <button key={l.id} className={`bp-opt-btn ${lifestyle === l.id ? "bp-opt-on" : ""}`} onClick={() => setLifestyle(l.id)}>
                    <span className="bp-opt-main">{l.label}</span>
                    <span className="bp-opt-sub">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bp-divider" />

            {/* Goal */}
            <div className="bp-field">
              <label className="bp-label"><Target size={14} strokeWidth={2.5} className="bp-lbl-icon" />Primary Goal</label>
              <div className="bp-grid bp-grid-6">
                {GOALS.map(g => {
                  const Icon = g.icon;
                  return (
                    <button key={g.id} className={`bp-goal-btn ${goal === g.id ? "bp-goal-on" : ""}`} onClick={() => setGoal(g.id)}>
                      <Icon size={14} strokeWidth={2} className="bp-goal-icon" />
                      <span>{g.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="bp-goal-amount-row">
                <span className="bp-goal-amt-label">Target amount (optional)</span>
                <div className="bp-goal-amt-wrap">
                  <span className="bp-income-dollar">$</span>
                  <input
                    className="bp-goal-amt-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 10000"
                    value={goalAmount}
                    onChange={e => setGoalAmt(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bp-divider" />

            {/* Expenses */}
            <div className="bp-field">
              <label className="bp-label"><ShoppingCart size={14} strokeWidth={2.5} className="bp-lbl-icon" />Monthly Expenses</label>
              <div className="bp-cats-wrap">
                {categories.map(cat => (
                  <CategoryRow key={cat.id} cat={cat} onUpdate={updateCat} onDelete={deleteCat} />
                ))}
              </div>

              {/* Add category */}
              <div className="bp-add-cat-row">
                <input
                  className="bp-add-cat-input"
                  type="text"
                  placeholder="Add custom category..."
                  value={newCatName}
                  onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCategory()}
                />
                <button className="bp-add-cat-btn" onClick={addCategory} disabled={!newCatName.trim()}>
                  <Plus size={14} strokeWidth={2.5} />Add
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="bp-field">
              <label className="bp-label"><Info size={14} strokeWidth={2.5} className="bp-lbl-icon" />Additional Notes <span className="bp-optional">(optional)</span></label>
              <textarea
                className="bp-textarea"
                rows={3}
                placeholder="e.g. I have $5000 in credit card debt, saving for a house, irregular income..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="bp-error"><AlertCircle size={14} strokeWidth={2.5} />{error}</div>
            )}

            {/* Quick summary strip */}
            {monthlyInc > 0 && (
              <div className="bp-summary-strip">
                <div className="bp-summary-item">
                  <span className="bp-summary-label">Income</span>
                  <span className="bp-summary-val bp-summary-income">{fmt(monthlyInc)}</span>
                </div>
                <div className="bp-summary-sep" />
                <div className="bp-summary-item">
                  <span className="bp-summary-label">Expenses</span>
                  <span className="bp-summary-val bp-summary-expense">{fmt(totalExpenses)}</span>
                </div>
                <div className="bp-summary-sep" />
                <div className="bp-summary-item">
                  <span className="bp-summary-label">Remaining</span>
                  <span className="bp-summary-val" style={{ color: remaining >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(remaining)}</span>
                </div>
                <div className="bp-summary-sep" />
                <div className="bp-summary-item">
                  <span className="bp-summary-label">Health</span>
                  <span className="bp-health-badge" style={{ color: healthStatus.color, background: healthStatus.bg, borderColor: healthStatus.bd }}>
                    {healthStatus.label}
                  </span>
                </div>
              </div>
            )}

            {/* Generate */}
            <button className="bp-submit" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="bp-spinner" />Analyzing Your Budget...</>
                : <><Sparkles size={16} strokeWidth={2} />Generate Budget Plan</>}
            </button>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="bp-card bp-skel-card animate-in">
              {[60,100,75,100,85,100,55,90].map((w, i) => (
                <div key={i} className="bp-skel" style={{ width: `${w}%`, height: i % 4 === 0 ? 20 : 14 }} />
              ))}
            </div>
          )}

          {/* ── Results ── */}
          {plan.length > 0 && !loading && (
            <div className="bp-card animate-in">

              {/* Result top bar */}
              <div className="bp-result-top">
                <div className="bp-result-meta">
                  <span className="bp-badge"><PieChart size={12} strokeWidth={2.5} />{plan.length} Sections</span>
                  <span className="bp-badge bp-badge-goal"><Target size={11} strokeWidth={2} />{GOALS.find(g => g.id === goal)?.label}</span>
                  <span className="bp-badge bp-badge-lifestyle">{LIFESTYLES.find(l => l.id === lifestyle)?.label}</span>
                </div>
                <div className="bp-result-right">
                  <div className="bp-tabs">
                    <button className={`bp-tab ${activeTab === "overview" ? "bp-tab-on" : ""}`} onClick={() => setActiveTab("overview")}>Overview</button>
                    <button className={`bp-tab ${activeTab === "plan"     ? "bp-tab-on" : ""}`} onClick={() => setActiveTab("plan")}>AI Plan</button>
                    <button className={`bp-tab ${activeTab === "raw"      ? "bp-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw</button>
                  </div>
                  <div className="bp-actions">
                    <button className="bp-action-btn" onClick={handleReset}><RefreshCw size={13} strokeWidth={2.5} />New</button>
                    <button className="bp-action-btn" onClick={handleDownload}><Download size={13} strokeWidth={2.5} />Save</button>
                    <button className={`bp-copy-btn ${copied ? "bp-copied" : ""}`} onClick={handleCopy}>
                      {copied ? <><Check size={13} strokeWidth={2.5} />Copied!</> : <><Copy size={13} strokeWidth={2.5} />Copy</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Overview tab */}
              {activeTab === "overview" && (
                <div className="bp-overview animate-in">
                  {/* Donut + legend */}
                  {chartData.length > 0 && (
                    <div className="bp-chart-row">
                      <DonutChart data={chartData} total={totalExpenses} />
                      <div className="bp-legend">
                        {chartData.map((d, i) => (
                          <div key={i} className="bp-legend-item">
                            <span className="bp-legend-dot" style={{ background: d.color }} />
                            <span className="bp-legend-name">{d.name}</span>
                            <span className="bp-legend-amt">{fmt(d.amount)}</span>
                            <span className="bp-legend-pct">{totalExpenses > 0 ? Math.round((d.amount / totalExpenses) * 100) : 0}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="bp-stats-grid">
                    <div className="bp-stat-card">
                      <span className="bp-stat-label">Monthly Income</span>
                      <span className="bp-stat-val bp-stat-income">{fmt(monthlyInc)}</span>
                    </div>
                    <div className="bp-stat-card">
                      <span className="bp-stat-label">Total Expenses</span>
                      <span className="bp-stat-val bp-stat-expense">{fmt(totalExpenses)}</span>
                    </div>
                    <div className="bp-stat-card">
                      <span className="bp-stat-label">Remaining</span>
                      <span className="bp-stat-val" style={{ color: remaining >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(remaining)}</span>
                    </div>
                    <div className="bp-stat-card">
                      <span className="bp-stat-label">Savings Rate</span>
                      <span className="bp-stat-val" style={{ color: savingsRate >= 20 ? "var(--green)" : savingsRate >= 10 ? "#d97706" : "var(--red)" }}>
                        {savingsRate}%
                      </span>
                    </div>
                  </div>

                  {/* Expense ratio bar */}
                  {monthlyInc > 0 && totalExpenses > 0 && (
                    <div className="bp-ratio-wrap">
                      <div className="bp-ratio-label-row">
                        <span className="bp-ratio-label">Expense Ratio</span>
                        <span className="bp-ratio-pct">{Math.round((totalExpenses / monthlyInc) * 100)}% of income spent</span>
                      </div>
                      <div className="bp-ratio-bar">
                        <div
                          className="bp-ratio-fill"
                          style={{
                            width: `${Math.min(100, (totalExpenses / monthlyInc) * 100)}%`,
                            background: totalExpenses > monthlyInc ? "var(--red)" : totalExpenses / monthlyInc > 0.8 ? "#d97706" : "var(--bp-accent)",
                          }}
                        />
                      </div>
                      <div className="bp-ratio-ticks">
                        <span>0%</span><span>50%</span><span>80%</span><span>100%</span>
                      </div>
                    </div>
                  )}

                  <button className="bp-view-plan-btn" onClick={() => setActiveTab("plan")}>
                    <Sparkles size={15} strokeWidth={2} />
                    View Full AI Budget Plan
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>
                </div>
              )}

              {/* AI Plan tab */}
              {activeTab === "plan" && (
                <div className="bp-plan animate-in">
                  {plan.map((section, i) => (
                    <PlanSection key={i} section={section} idx={i} />
                  ))}
                </div>
              )}

              {/* Raw tab */}
              {activeTab === "raw" && <pre className="bp-raw">{rawOutput}</pre>}

              {/* Footer */}
              <div className="bp-result-footer">
                <span className="bp-footer-note">{plan.length} sections · AI-generated financial guidance</span>
                <button className={`bp-copy-full ${copied ? "bp-copied" : ""}`} onClick={handleCopy}>
                  {copied ? <><Check size={14} strokeWidth={2.5} />Copied!</> : <><Copy size={14} strokeWidth={2.5} />Copy Full Plan</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
import { useState } from "react";
import {
  Receipt,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  Users,
  DollarSign,
  ArrowRight,
  SplitSquareHorizontal,
  Percent,
  Equal,
  Hash,
  UserPlus,
  ChevronDown,
  Wallet,
  TrendingUp,
  BadgePercent,
} from "lucide-react";

/* ─── Split Modes ─── */
const SPLIT_MODES = [
  { id: "equal",   label: "Equal Split",    icon: Equal,      desc: "Everyone pays the same" },
  { id: "percent", label: "By Percentage",  icon: Percent,    desc: "Custom % per person"    },
  { id: "custom",  label: "Custom Amounts", icon: Hash,       desc: "Exact amounts per person"},
  { id: "shares",  label: "By Shares",      icon: TrendingUp, desc: "Weighted contribution"  },
];

/* ─── Currencies ─── */
const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", label: "Swiss Franc" },
];

/* ─── Category Presets ─── */
const CATEGORIES = [
  "Dinner / Food", "Trip / Travel", "Groceries", "Utilities",
  "Rent", "Entertainment", "Shopping", "Other",
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmt(symbol, amount) {
  return `${symbol}${Number(amount).toFixed(2)}`;
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function ExpenseSplitCalculator() {
  /* ── State ── */
  const [title,       setTitle]       = useState("");
  const [category,    setCategory]    = useState("Dinner / Food");
  const [total,       setTotal]       = useState("");
  const [currency,    setCurrency]    = useState("USD");
  const [splitMode,   setSplitMode]   = useState("equal");
  const [tip,         setTip]         = useState("");
  const [tax,         setTax]         = useState("");
  const [paidBy,      setPaidBy]      = useState("");
  const [people, setPeople] = useState([
    { id: uid(), name: "Alice", value: "" },
    { id: uid(), name: "Bob",   value: "" },
  ]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState(null);
  const [copied,      setCopied]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("summary");

  const currencyObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const sym = currencyObj.symbol;

  const totalNum  = parseFloat(total)  || 0;
  const tipNum    = parseFloat(tip)    || 0;
  const taxNum    = parseFloat(tax)    || 0;
  const grandTotal = totalNum + (totalNum * tipNum / 100) + (totalNum * taxNum / 100);

  /* ── People helpers ── */
  function addPerson() {
    setPeople(p => [...p, { id: uid(), name: `Person ${p.length + 1}`, value: "" }]);
  }
  function removePerson(id) {
    if (people.length <= 2) return;
    setPeople(p => p.filter(x => x.id !== id));
  }
  function updatePerson(id, key, val) {
    setPeople(p => p.map(x => x.id === id ? { ...x, [key]: val } : x));
  }

  /* ── Validation ── */
  function validate() {
    if (!totalNum || totalNum <= 0) return "Please enter a valid total amount.";
    if (people.some(p => !p.name.trim())) return "All participants must have a name.";
    if (splitMode === "percent") {
      const sum = people.reduce((a, p) => a + (parseFloat(p.value) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) return `Percentages must sum to 100% (currently ${sum.toFixed(1)}%).`;
    }
    if (splitMode === "custom") {
      const sum = people.reduce((a, p) => a + (parseFloat(p.value) || 0), 0);
      if (Math.abs(sum - grandTotal) > 0.01) return `Custom amounts must sum to ${fmt(sym, grandTotal)} (currently ${fmt(sym, sum)}).`;
    }
    if (splitMode === "shares") {
      if (people.some(p => !parseFloat(p.value))) return "All participants must have a share value.";
    }
    return null;
  }

  /* ── Calculate locally ── */
  function calculateSplit() {
    const shares = people.map(p => {
      let amount = 0;
      if (splitMode === "equal") {
        amount = grandTotal / people.length;
      } else if (splitMode === "percent") {
        amount = grandTotal * (parseFloat(p.value) || 0) / 100;
      } else if (splitMode === "custom") {
        amount = parseFloat(p.value) || 0;
      } else if (splitMode === "shares") {
        const totalShares = people.reduce((a, x) => a + (parseFloat(x.value) || 1), 0);
        amount = grandTotal * (parseFloat(p.value) || 1) / totalShares;
      }
      return { ...p, amount };
    });

    // Settlements
    const payer = paidBy.trim() || (people[0]?.name || "");
    const settlements = [];
    shares.forEach(p => {
      if (p.name.trim() !== payer) {
        settlements.push({ from: p.name, to: payer, amount: p.amount });
      }
    });

    return { shares, settlements };
  }

  /* ── AI-enhanced generate ── */
  async function handleGenerate() {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    setResult(null);

    const { shares, settlements } = calculateSplit();

    const prompt = `You are a friendly expense-split assistant. Given this group expense, provide a clear JSON summary.

Expense Title: ${title.trim() || "Group Expense"}
Category: ${category}
Base Amount: ${sym}${totalNum.toFixed(2)}
Tip: ${tipNum}%
Tax: ${taxNum}%
Grand Total: ${sym}${grandTotal.toFixed(2)}
Currency: ${currency}
Split Mode: ${splitMode}
Paid By: ${paidBy.trim() || people[0]?.name || "Unknown"}
Participants:
${shares.map(p => `  - ${p.name}: owes ${sym}${p.amount.toFixed(2)}`).join("\n")}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No markdown, no intro.
Shape:
{
  "title": "...",
  "summary": "...",
  "grandTotal": "${sym}${grandTotal.toFixed(2)}",
  "perPersonBreakdown": [
    { "name": "...", "owes": "...", "percent": "..." }
  ],
  "settlements": [
    { "from": "...", "to": "...", "amount": "...", "note": "..." }
  ],
  "insights": ["...", "..."],
  "fairnessTip": "..."
}

RULES:
- "title": short catchy title for this expense split
- "summary": 1-2 sentence friendly summary of who's splitting what
- "perPersonBreakdown": each person's name, formatted amount they owe (${currency}), and % of total
- "settlements": who pays whom and how much. Add a friendly note for each. If someone paid already, note it.
- "insights": 2-3 interesting or helpful observations (e.g. "Splitting ${sym}X equally is common for friend groups")
- "fairnessTip": one short tip about fair expense splitting
- All amounts formatted with ${sym} symbol and 2 decimal places
- Keep tone friendly and conversational
- Return ONLY the JSON, no extra text`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      let raw = data.content.map(i => i.text || "").join("").trim();
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("bad format");
      const parsed = JSON.parse(jsonMatch[0]);
      setResult({ ...parsed, _shares: shares, _settlements: settlements });
      setActiveTab("summary");
    } catch {
      // Fallback to local calculation
      const { shares: sh, settlements: se } = calculateSplit();
      setResult({
        title: title.trim() || `${category} Split`,
        summary: `${people.length} people splitting ${fmt(sym, grandTotal)} for ${category.toLowerCase()}.`,
        grandTotal: fmt(sym, grandTotal),
        perPersonBreakdown: sh.map(p => ({
          name: p.name,
          owes: fmt(sym, p.amount),
          percent: ((p.amount / grandTotal) * 100).toFixed(1) + "%",
        })),
        settlements: se.map(s => ({
          from: s.from,
          to: s.to,
          amount: fmt(sym, s.amount),
          note: `${s.from} needs to pay ${s.to}`,
        })),
        insights: [
          `Total including tip & tax: ${fmt(sym, grandTotal)}`,
          `Average per person: ${fmt(sym, grandTotal / people.length)}`,
        ],
        fairnessTip: "Always confirm amounts before transferring money.",
        _shares: sh,
        _settlements: se,
      });
      setActiveTab("summary");
    } finally {
      setLoading(false);
    }
  }

  function buildRawText() {
    if (!result) return "";
    let t = `${result.title}\n${"─".repeat(40)}\n${result.summary}\n\n`;
    t += `Grand Total: ${result.grandTotal}\n\n`;
    t += `BREAKDOWN\n${"─".repeat(20)}\n`;
    result.perPersonBreakdown?.forEach(p => {
      t += `  ${p.name}: ${p.owes} (${p.percent})\n`;
    });
    t += `\nSETTLEMENTS\n${"─".repeat(20)}\n`;
    result.settlements?.forEach(s => {
      t += `  ${s.from} → ${s.to}: ${s.amount}\n`;
    });
    if (result.insights?.length) {
      t += `\nINSIGHTS\n${"─".repeat(20)}\n`;
      result.insights.forEach(i => { t += `  • ${i}\n`; });
    }
    if (result.fairnessTip) t += `\n💡 ${result.fairnessTip}`;
    return t;
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildRawText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    const blob = new Blob([buildRawText()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expense-split.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setTitle(""); setCategory("Dinner / Food"); setTotal(""); setTip(""); setTax("");
    setPaidBy(""); setSplitMode("equal"); setCurrency("USD");
    setPeople([{ id: uid(), name: "Alice", value: "" }, { id: uid(), name: "Bob", value: "" }]);
    setResult(null); setError(""); setCopied(false);
  }

  const selectedMode = SPLIT_MODES.find(m => m.id === splitMode);
  const ModeIcon = selectedMode?.icon;

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.iconBox}>
            <SplitSquareHorizontal size={20} color="var(--ac)" strokeWidth={2} />
          </div>
          <div>
            <span style={styles.cat}>AI Productivity Tools</span>
            <h1 style={styles.h1}>Expense Split Calculator</h1>
            <p style={styles.sub}>Add your group expense, choose how to split — get instant settlements powered by AI.</p>
          </div>
        </div>

        {/* ── Input Card ── */}
        <div style={styles.card}>

          {/* Title + Category */}
          <div style={styles.twoCol}>
            <div style={styles.field}>
              <label style={styles.label}>
                <Receipt size={13} color="var(--ac)" /> Expense Title
              </label>
              <input
                style={styles.input}
                placeholder="e.g. Team Dinner, Bali Trip..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Category</label>
              <div style={{ position: "relative" }}>
                <select style={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} style={styles.selectArrow} />
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Amount + Tip + Tax + Currency */}
          <div style={{ ...styles.twoCol, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div style={styles.field}>
              <label style={styles.label}>
                <DollarSign size={13} color="var(--ac)" /> Total Amount
              </label>
              <div style={{ position: "relative" }}>
                <span style={styles.inputPre}>{sym}</span>
                <input
                  style={{ ...styles.input, paddingLeft: "28px" }}
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={total}
                  onChange={e => setTotal(e.target.value)}
                />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>
                <BadgePercent size={13} color="var(--ac)" /> Tip %
              </label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...styles.input, paddingRight: "28px" }}
                  type="number" min="0" max="100" placeholder="0"
                  value={tip} onChange={e => setTip(e.target.value)}
                />
                <span style={styles.inputSuf}>%</span>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tax %</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...styles.input, paddingRight: "28px" }}
                  type="number" min="0" max="100" placeholder="0"
                  value={tax} onChange={e => setTax(e.target.value)}
                />
                <span style={styles.inputSuf}>%</span>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Currency</label>
              <div style={{ position: "relative" }}>
                <select style={styles.select} value={currency} onChange={e => setCurrency(e.target.value)}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
                </select>
                <ChevronDown size={13} style={styles.selectArrow} />
              </div>
            </div>
          </div>

          {/* Grand Total Preview */}
          {totalNum > 0 && (
            <div style={styles.grandTotalBar}>
              <span style={styles.gtLabel}>Grand Total</span>
              <span style={styles.gtAmount}>{fmt(sym, grandTotal)}</span>
              {(tipNum > 0 || taxNum > 0) && (
                <span style={styles.gtBreakdown}>
                  Base {fmt(sym, totalNum)}
                  {tipNum > 0 && ` + Tip ${fmt(sym, totalNum * tipNum / 100)}`}
                  {taxNum > 0 && ` + Tax ${fmt(sym, totalNum * taxNum / 100)}`}
                </span>
              )}
            </div>
          )}

          <div style={styles.divider} />

          {/* Split Mode */}
          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label}>
                <SplitSquareHorizontal size={13} color="var(--ac)" /> Split Mode
              </label>
              {selectedMode && (
                <span style={styles.badge}>
                  {ModeIcon && <ModeIcon size={10} strokeWidth={2.5} />}
                  {selectedMode.label}
                </span>
              )}
            </div>
            <div style={styles.modeGrid}>
              {SPLIT_MODES.map(m => {
                const Icon = m.icon;
                const on = splitMode === m.id;
                return (
                  <button
                    key={m.id}
                    style={{ ...styles.modeBtn, ...(on ? styles.modeBtnOn : {}) }}
                    onClick={() => setSplitMode(m.id)}
                  >
                    <Icon size={15} strokeWidth={2} color={on ? "var(--ac)" : "#737373"} style={{ marginBottom: 3 }} />
                    <span style={{ ...styles.modeLbl, ...(on ? styles.modeLblOn : {}) }}>{m.label}</span>
                    <span style={{ ...styles.modeDesc, ...(on ? styles.modeDescOn : {}) }}>{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.divider} />

          {/* People */}
          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label}>
                <Users size={13} color="var(--ac)" /> Participants
                <span style={styles.optional}>({people.length} people)</span>
              </label>
              <button style={styles.addBtn} onClick={addPerson}>
                <UserPlus size={12} strokeWidth={2.5} /> Add Person
              </button>
            </div>

            <div style={styles.peopleList}>
              {people.map((p, i) => (
                <div key={p.id} style={styles.personRow}>
                  <div style={styles.personNum}>{i + 1}</div>
                  <input
                    style={{ ...styles.input, flex: 2 }}
                    placeholder={`Name ${i + 1}`}
                    value={p.name}
                    onChange={e => updatePerson(p.id, "name", e.target.value)}
                  />
                  {splitMode !== "equal" && (
                    <div style={{ position: "relative", flex: 1 }}>
                      {splitMode === "percent" && <span style={styles.inputSuf}>%</span>}
                      {splitMode === "custom" && <span style={styles.inputPre}>{sym}</span>}
                      <input
                        style={{
                          ...styles.input,
                          paddingLeft: splitMode === "custom" ? "24px" : "12px",
                          paddingRight: splitMode === "percent" ? "24px" : "12px",
                        }}
                        type="number" min="0"
                        placeholder={splitMode === "percent" ? "%" : splitMode === "shares" ? "shares" : "0.00"}
                        value={p.value}
                        onChange={e => updatePerson(p.id, "value", e.target.value)}
                      />
                    </div>
                  )}
                  <button
                    style={{ ...styles.removeBtn, opacity: people.length <= 2 ? 0.3 : 1 }}
                    onClick={() => removePerson(p.id)}
                    disabled={people.length <= 2}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {splitMode === "equal" && totalNum > 0 && (
              <div style={styles.equalPreview}>
                Each person pays <strong>{fmt(sym, grandTotal / people.length)}</strong>
              </div>
            )}
          </div>

          <div style={styles.divider} />

          {/* Paid By */}
          <div style={styles.field}>
            <label style={styles.label}>
              <Wallet size={13} color="var(--ac)" /> Who Paid?
              <span style={styles.optional}>(optional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <select style={styles.select} value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                <option value="">Select who paid...</option>
                {people.map(p => p.name.trim() && (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={13} style={styles.selectArrow} />
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={14} strokeWidth={2.5} />
              {error}
            </div>
          )}

          <button style={{ ...styles.genBtn, opacity: loading ? 0.7 : 1 }} onClick={handleGenerate} disabled={loading}>
            {loading
              ? <><span style={styles.spinner} /> Calculating & Analyzing...</>
              : <><Sparkles size={16} strokeWidth={2} /> Calculate Split</>}
          </button>
          <p style={styles.hint}>Press Calculate to get AI-powered insights & settlements</p>
        </div>

        {/* ── Skeleton ── */}
        {loading && (
          <div style={styles.card}>
            <div style={{ ...styles.skel, width: "40%" }} />
            <div style={styles.skel} />
            <div style={{ display: "flex", gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8,
                  padding: 14, border: "1.5px solid #e5e5e5", borderRadius: 12 }}>
                  <div style={{ ...styles.skel, width: "50%" }} />
                  <div style={styles.skel} />
                  <div style={{ ...styles.skel, width: "70%" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <div style={styles.card}>

            {/* Top bar */}
            <div style={styles.resultTop}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={styles.badge}><SplitSquareHorizontal size={10} /> {splitMode}</span>
                <span style={{ ...styles.badge, background: "#fff7ed", borderColor: "#fed7aa", color: "#ea580c" }}>
                  <DollarSign size={10} /> {result.grandTotal}
                </span>
                <span style={{ ...styles.badge, background: "#f0f9ff", borderColor: "#bae6fd", color: "#0284c7" }}>
                  <Users size={10} /> {people.length} people
                </span>
              </div>

              <div style={styles.tabs}>
                {["summary", "settlements", "raw"].map(tab => (
                  <button
                    key={tab}
                    style={{ ...styles.tab, ...(activeTab === tab ? styles.tabOn : {}) }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div style={styles.actions}>
                <button style={styles.actionBtn} onClick={handleReset}>
                  <RefreshCw size={12} strokeWidth={2.5} /> New
                </button>
                <button style={styles.actionBtn} onClick={handleDownload}>
                  <Download size={12} strokeWidth={2.5} /> Save
                </button>
                <button style={{ ...styles.copyBtn, ...(copied ? styles.copiedBtn : {}) }} onClick={handleCopy}>
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div style={styles.preview}>
                <div style={styles.planHeader}>
                  <div style={styles.planTitle}>{result.title}</div>
                  {result.summary && <p style={styles.planSummary}>{result.summary}</p>}
                </div>

                {/* Per person breakdown */}
                <div style={styles.breakdownGrid}>
                  {result.perPersonBreakdown?.map((p, i) => (
                    <div key={i} style={styles.personCard}>
                      <div style={styles.personAvatar}>{p.name.charAt(0).toUpperCase()}</div>
                      <div style={styles.personName}>{p.name}</div>
                      <div style={styles.personOwes}>{p.owes}</div>
                      <div style={styles.personPct}>{p.percent}</div>
                    </div>
                  ))}
                </div>

                {/* Insights */}
                {result.insights?.length > 0 && (
                  <div style={styles.insightBlock}>
                    <div style={styles.blockHeader}>
                      <TrendingUp size={13} color="#7c3aed" /> Insights
                    </div>
                    <ul style={styles.insightList}>
                      {result.insights.map((ins, i) => (
                        <li key={i} style={styles.insightItem}>{ins}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fairness tip */}
                {result.fairnessTip && (
                  <div style={styles.affirmation}>
                    <Sparkles size={13} color="var(--ac)" style={{ flexShrink: 0 }} />
                    <span style={styles.affText}>💡 {result.fairnessTip}</span>
                  </div>
                )}
              </div>
            )}

            {/* Settlements Tab */}
            {activeTab === "settlements" && (
              <div style={styles.preview}>
                <div style={styles.planHeader}>
                  <div style={styles.planTitle}>Who Pays Whom</div>
                  <p style={styles.planSummary}>Clear settlement instructions for everyone.</p>
                </div>
                {result.settlements?.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#737373", fontSize: "0.85rem" }}>
                    🎉 No settlements needed — everyone paid equally!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {result.settlements?.map((s, i) => (
                      <div key={i} style={styles.settlementRow}>
                        <div style={styles.settleName}>{s.from}</div>
                        <div style={styles.settleArrow}>
                          <ArrowRight size={16} color="var(--ac)" />
                        </div>
                        <div style={styles.settleName}>{s.to}</div>
                        <div style={styles.settleAmount}>{s.amount}</div>
                        {s.note && <div style={styles.settleNote}>{s.note}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Raw Tab */}
            {activeTab === "raw" && (
              <pre style={styles.raw}>{buildRawText()}</pre>
            )}

            {/* Footer */}
            <div style={styles.resultFooter}>
              <span style={{ fontSize: "0.75rem", color: "#737373", fontWeight: 500 }}>
                {people.length} participants · {result.grandTotal} total
              </span>
              <button style={{ ...styles.copyFullBtn, ...(copied ? styles.copiedFullBtn : {}) }} onClick={handleCopy}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Full Summary</>}
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        :root { --ac: #0d9488; --ac-bg: #f0fdfa; --ac-bd: #99f6e4; --ac-dk: #0f766e; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input:focus, select:focus { outline: none; border-color: var(--ac) !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.12) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════
   STYLES OBJECT  (mirrors the CSS vars)
═══════════════════════════════════════ */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#0f0f0f",
    padding: "48px 20px 64px",
    paddingTop: 120,
  },
  inner: {
    maxWidth: 820,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  /* Header */
  header: { display: "flex", alignItems: "flex-start", gap: 16, padding: "4px 0 8px" },
  iconBox: {
    width: 48, height: 48,
    background: "#fff",
    border: "1.5px solid #e5e5e5",
    borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 2,
  },
  cat: {
    display: "inline-block",
    fontSize: "0.68rem", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.08em",
    color: "var(--ac)",
    background: "var(--ac-bg)",
    border: "1px solid var(--ac-bd)",
    padding: "3px 10px", borderRadius: 100, marginBottom: 6,
  },
  h1: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "clamp(1.4rem, 4vw, 1.75rem)",
    fontWeight: 700, color: "#0f0f0f",
    letterSpacing: "-0.02em", marginBottom: 4, lineHeight: 1.2,
  },
  sub: { fontSize: "0.85rem", color: "#737373", lineHeight: 1.5 },

  /* Card */
  card: {
    background: "#fff",
    border: "1.5px solid #e5e5e5",
    borderRadius: 16,
    padding: 24,
    display: "flex", flexDirection: "column", gap: 18,
    animation: "fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)",
  },
  divider: { height: 1, background: "#e5e5e5", margin: "2px 0" },

  /* Fields */
  field: { display: "flex", flexDirection: "column", gap: 8 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" },
  label: {
    fontFamily: "'Poppins', sans-serif", fontSize: "0.88rem", fontWeight: 600,
    color: "#0f0f0f", display: "flex", alignItems: "center", gap: 6,
  },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  optional: { fontSize: "0.75rem", fontWeight: 400, color: "#737373", fontFamily: "inherit" },
  hint: { fontSize: "0.73rem", color: "#737373", textAlign: "center" },

  /* Input */
  input: {
    width: "100%", padding: "10px 13px",
    border: "1.5px solid #e5e5e5", borderRadius: 12,
    fontFamily: "inherit", fontSize: "0.88rem", color: "#0f0f0f",
    background: "#fff", transition: "border-color 0.2s, box-shadow 0.2s",
  },
  inputPre: {
    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
    fontSize: "0.85rem", color: "#737373", pointerEvents: "none",
  },
  inputSuf: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    fontSize: "0.85rem", color: "#737373", pointerEvents: "none",
  },

  /* Select */
  select: {
    width: "100%", appearance: "none",
    padding: "10px 36px 10px 13px",
    border: "1.5px solid #e5e5e5", borderRadius: 12,
    fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 500,
    color: "#0f0f0f", background: "#fff", cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  selectArrow: {
    position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
    color: "#737373", pointerEvents: "none",
  },

  /* Grand Total */
  grandTotalBar: {
    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    padding: "12px 16px",
    background: "var(--ac-bg)", border: "1.5px solid var(--ac-bd)",
    borderRadius: 12,
  },
  gtLabel: { fontSize: "0.8rem", fontWeight: 600, color: "var(--ac-dk)" },
  gtAmount: { fontSize: "1.1rem", fontWeight: 700, color: "var(--ac-dk)", fontFamily: "'Poppins', sans-serif" },
  gtBreakdown: { fontSize: "0.75rem", color: "var(--ac)", marginLeft: "auto" },

  /* Split Mode Grid */
  modeGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  modeBtn: {
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3,
    padding: "10px 12px",
    border: "1.5px solid #e5e5e5", borderRadius: 12,
    background: "#fff", cursor: "pointer", textAlign: "left",
    transition: "all 0.15s",
  },
  modeBtnOn: { background: "var(--ac-bg)", borderColor: "var(--ac-bd)", boxShadow: "0 0 0 1px var(--ac-bd)" },
  modeLbl: { fontSize: "0.79rem", fontWeight: 600, color: "#0f0f0f", lineHeight: 1.2 },
  modeLblOn: { color: "var(--ac-dk)" },
  modeDesc: { fontSize: "0.67rem", color: "#737373", lineHeight: 1.3 },
  modeDescOn: { color: "var(--ac)", opacity: 0.85 },

  /* Badge */
  badge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: "0.72rem", fontWeight: 600,
    padding: "2px 9px", borderRadius: 100,
    border: "1px solid var(--ac-bd)",
    color: "var(--ac)", background: "var(--ac-bg)",
  },

  /* People */
  peopleList: { display: "flex", flexDirection: "column", gap: 8 },
  personRow: { display: "flex", gap: 8, alignItems: "center" },
  personNum: {
    width: 28, height: 28, borderRadius: "50%",
    background: "var(--ac-bg)", border: "1.5px solid var(--ac-bd)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.75rem", fontWeight: 700, color: "var(--ac)", flexShrink: 0,
  },
  addBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "6px 12px",
    background: "var(--ac-bg)", border: "1.5px solid var(--ac-bd)",
    borderRadius: 100, fontSize: "0.78rem", fontWeight: 600,
    color: "var(--ac-dk)", cursor: "pointer",
  },
  removeBtn: {
    width: 32, height: 32, borderRadius: 8,
    background: "#fef2f2", border: "1.5px solid #fecaca",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#ef4444", cursor: "pointer", flexShrink: 0,
  },
  equalPreview: {
    padding: "10px 14px",
    background: "var(--ac-bg)", border: "1px dashed var(--ac-bd)",
    borderRadius: 10, fontSize: "0.83rem", color: "var(--ac-dk)",
    textAlign: "center",
  },

  /* Error */
  errorBox: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: "0.8rem", color: "#ef4444", fontWeight: 500,
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 8, padding: "8px 12px",
  },

  /* Generate Button */
  genBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "13px 20px",
    border: "none", borderRadius: 12,
    fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 600,
    cursor: "pointer", color: "#fff",
    background: "var(--ac)",
    transition: "all 0.2s",
  },
  spinner: {
    display: "inline-block", width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.7s linear infinite", flexShrink: 0,
  },

  /* Result */
  resultTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 10,
    paddingBottom: 4, borderBottom: "1.5px solid #e5e5e5",
  },
  tabs: {
    display: "flex", background: "#f5f5f5",
    border: "1.5px solid #e5e5e5", borderRadius: 10, padding: 3, gap: 2,
  },
  tab: {
    padding: "6px 16px", borderRadius: 7, border: "none",
    background: "transparent", fontFamily: "inherit",
    fontSize: "0.82rem", fontWeight: 500, color: "#737373", cursor: "pointer",
  },
  tabOn: { background: "#fff", color: "#0f0f0f", fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  actions: { display: "flex", gap: 7, alignItems: "center" },
  actionBtn: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "7px 13px", background: "#fff",
    border: "1.5px solid #e5e5e5", borderRadius: 9,
    fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 600,
    color: "#404040", cursor: "pointer",
  },
  copyBtn: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "7px 13px", background: "#eff6ff",
    border: "1.5px solid #bfdbfe", borderRadius: 9,
    fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 600,
    color: "#2563eb", cursor: "pointer",
  },
  copiedBtn: { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" },

  /* Preview */
  preview: { border: "1.5px solid #e5e5e5", borderRadius: 12, overflow: "hidden" },
  planHeader: {
    padding: "18px 20px 16px",
    background: "var(--ac-bg)", borderBottom: "1.5px solid var(--ac-bd)",
  },
  planTitle: {
    fontFamily: "'Poppins', sans-serif", fontSize: "1.05rem",
    fontWeight: 700, color: "var(--ac-dk)", marginBottom: 6,
  },
  planSummary: { fontSize: "0.87rem", color: "var(--ac)", lineHeight: 1.6, fontStyle: "italic" },

  breakdownGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 0, borderBottom: "1px solid #e5e5e5",
  },
  personCard: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "18px 12px", textAlign: "center",
    borderRight: "1px solid #e5e5e5",
    borderBottom: "1px solid #e5e5e5",
  },
  personAvatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "var(--ac-bg)", border: "2px solid var(--ac-bd)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1rem", fontWeight: 700, color: "var(--ac-dk)",
    marginBottom: 8,
  },
  personName: { fontSize: "0.82rem", fontWeight: 600, color: "#0f0f0f", marginBottom: 4 },
  personOwes: { fontSize: "1rem", fontWeight: 700, color: "var(--ac-dk)", fontFamily: "'Poppins', sans-serif", marginBottom: 2 },
  personPct: { fontSize: "0.7rem", color: "#737373", background: "#f5f5f5", padding: "1px 8px", borderRadius: 100 },

  insightBlock: {
    padding: "14px 20px",
    background: "#f5f3ff", borderTop: "1.5px solid #e5e5e5",
  },
  blockHeader: {
    display: "flex", alignItems: "center", gap: 7,
    fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem", fontWeight: 700,
    color: "#404040", textTransform: "uppercase", letterSpacing: "0.07em",
    marginBottom: 10,
  },
  insightList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 6 },
  insightItem: {
    fontSize: "0.83rem", color: "#4c1d95", paddingLeft: 14,
    position: "relative", lineHeight: 1.5,
  },

  settlementRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "16px 20px", borderBottom: "1px solid #f5f5f5",
    flexWrap: "wrap",
  },
  settleName: { fontSize: "0.9rem", fontWeight: 600, color: "#0f0f0f", minWidth: 80 },
  settleArrow: { display: "flex", alignItems: "center" },
  settleAmount: {
    marginLeft: "auto", fontSize: "0.95rem", fontWeight: 700,
    color: "var(--ac-dk)", fontFamily: "'Poppins', sans-serif",
    background: "var(--ac-bg)", border: "1px solid var(--ac-bd)",
    padding: "3px 12px", borderRadius: 100,
  },
  settleNote: { width: "100%", fontSize: "0.75rem", color: "#737373", fontStyle: "italic" },

  affirmation: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "14px 20px",
    background: "var(--ac-bg)", borderTop: "1.5px solid var(--ac-bd)",
    fontSize: "0.87rem", lineHeight: 1.5,
  },
  affText: { fontStyle: "italic", fontWeight: 500, color: "var(--ac-dk)" },

  raw: {
    background: "#f5f5f5", border: "1.5px solid #e5e5e5",
    borderRadius: 12, padding: 20,
    fontFamily: "'Courier New', monospace", fontSize: "0.83rem",
    lineHeight: 1.7, color: "#404040",
    whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto",
  },

  resultFooter: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, flexWrap: "wrap", paddingTop: 4, borderTop: "1.5px solid #e5e5e5",
  },
  copyFullBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "10px 22px", color: "#fff",
    border: "none", borderRadius: 12,
    fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600,
    cursor: "pointer", background: "var(--ac)",
    transition: "all 0.15s",
  },
  copiedFullBtn: { background: "#16a34a" },

  /* Skeleton */
  skel: {
    height: 14, borderRadius: 8, width: "100%",
    background: "linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)",
    backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite",
  },
};
import { useState, useCallback } from "react";
import "./PercentageCalculator.css";
import { Helmet } from "react-helmet";
import {
  Percent,
  Plus,
  Trash2,
  Calculator,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Award,
  TrendingUp,
  BookOpen,
  BarChart2,
  Star,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/* ── Grading Systems ── */
const GRADING_SYSTEMS = [
  { id: "percentage", label: "Percentage" },
  { id: "10point",    label: "10-Point GPA" },
  { id: "4point",     label: "4-Point GPA" },
];

const PASS_MARKS = {
  percentage: 33,
  "10point":  33,
  "4point":   33,
};

/* ── Grade Logic ── */
function getGrade(pct, system) {
  if (system === "10point") {
    if (pct >= 90) return { letter: "O",  gpa: "10",  cls: "a-plus", label: "Outstanding" };
    if (pct >= 80) return { letter: "A+", gpa: "9",   cls: "a",      label: "Excellent"   };
    if (pct >= 70) return { letter: "A",  gpa: "8",   cls: "a",      label: "Very Good"   };
    if (pct >= 60) return { letter: "B+", gpa: "7",   cls: "b",      label: "Good"        };
    if (pct >= 55) return { letter: "B",  gpa: "6",   cls: "b",      label: "Above Avg"   };
    if (pct >= 50) return { letter: "C",  gpa: "5",   cls: "c",      label: "Average"     };
    if (pct >= 45) return { letter: "P",  gpa: "4",   cls: "c",      label: "Pass"        };
    if (pct >= 33) return { letter: "P",  gpa: "4",   cls: "d",      label: "Pass"        };
    return                { letter: "F",  gpa: "0",   cls: "f",      label: "Fail"        };
  }
  if (system === "4point") {
    if (pct >= 93) return { letter: "A+", gpa: "4.0", cls: "a-plus", label: "Excellent"   };
    if (pct >= 90) return { letter: "A",  gpa: "4.0", cls: "a",      label: "Excellent"   };
    if (pct >= 87) return { letter: "A-", gpa: "3.7", cls: "a",      label: "Very Good"   };
    if (pct >= 83) return { letter: "B+", gpa: "3.3", cls: "b",      label: "Good"        };
    if (pct >= 80) return { letter: "B",  gpa: "3.0", cls: "b",      label: "Good"        };
    if (pct >= 77) return { letter: "B-", gpa: "2.7", cls: "b",      label: "Above Avg"   };
    if (pct >= 73) return { letter: "C+", gpa: "2.3", cls: "c",      label: "Average"     };
    if (pct >= 70) return { letter: "C",  gpa: "2.0", cls: "c",      label: "Average"     };
    if (pct >= 67) return { letter: "C-", gpa: "1.7", cls: "c",      label: "Below Avg"   };
    if (pct >= 60) return { letter: "D",  gpa: "1.0", cls: "d",      label: "Poor"        };
    return                { letter: "F",  gpa: "0.0", cls: "f",      label: "Fail"        };
  }
  // percentage
  if (pct >= 90) return { letter: "A+", gpa: "10",  cls: "a-plus", label: "Outstanding" };
  if (pct >= 80) return { letter: "A",  gpa: "9",   cls: "a",      label: "Distinction" };
  if (pct >= 70) return { letter: "B+", gpa: "8",   cls: "b",      label: "First Class" };
  if (pct >= 60) return { letter: "B",  gpa: "7",   cls: "b",      label: "Second Class"};
  if (pct >= 50) return { letter: "C",  gpa: "6",   cls: "c",      label: "Third Class" };
  if (pct >= 33) return { letter: "D",  gpa: "4",   cls: "d",      label: "Pass"        };
  return                { letter: "F",  gpa: "0",   cls: "f",      label: "Fail"        };
}

/* Bar color by grade class */
const BAR_COLORS = {
  "a-plus": "#059669",
  "a":      "#16a34a",
  "b":      "#0d9488",
  "c":      "#4f46e5",
  "d":      "#d97706",
  "f":      "#ef4444",
};

/* Grade legend definitions */
const LEGEND_PCT = [
  { letter: "A+", range: "90–100", gpa: "10", cls: "a-plus" },
  { letter: "A",  range: "80–89",  gpa: "9",  cls: "a"      },
  { letter: "B+", range: "70–79",  gpa: "8",  cls: "b"      },
  { letter: "B",  range: "60–69",  gpa: "7",  cls: "b"      },
  { letter: "C",  range: "50–59",  gpa: "6",  cls: "c"      },
  { letter: "D",  range: "33–49",  gpa: "4",  cls: "d"      },
  { letter: "F",  range: "< 33",   gpa: "0",  cls: "f"      },
];

const LEGEND_10 = [
  { letter: "O",  range: "90–100", gpa: "10", cls: "a-plus" },
  { letter: "A+", range: "80–89",  gpa: "9",  cls: "a"      },
  { letter: "A",  range: "70–79",  gpa: "8",  cls: "a"      },
  { letter: "B+", range: "60–69",  gpa: "7",  cls: "b"      },
  { letter: "B",  range: "55–59",  gpa: "6",  cls: "b"      },
  { letter: "C",  range: "50–54",  gpa: "5",  cls: "c"      },
  { letter: "F",  range: "< 33",   gpa: "0",  cls: "f"      },
];

const LEGEND_4 = [
  { letter: "A+", range: "93–100", gpa: "4.0", cls: "a-plus" },
  { letter: "A",  range: "90–92",  gpa: "4.0", cls: "a"      },
  { letter: "B+", range: "83–89",  gpa: "3.3", cls: "b"      },
  { letter: "B",  range: "80–82",  gpa: "3.0", cls: "b"      },
  { letter: "C+", range: "73–79",  gpa: "2.3", cls: "c"      },
  { letter: "C",  range: "70–72",  gpa: "2.0", cls: "c"      },
  { letter: "F",  range: "< 60",   gpa: "0.0", cls: "f"      },
];

const LEGENDS = { percentage: LEGEND_PCT, "10point": LEGEND_10, "4point": LEGEND_4 };

/* Grade cell color style */
function gradeStyle(cls, active) {
  const map = {
    "a-plus": { color: "#059669", bg: "#ecfdf5", bd: "#6ee7b7" },
    "a":      { color: "#16a34a", bg: "#f0fdf4", bd: "#86efac" },
    "b":      { color: "#0f766e", bg: "#f0fdfa", bd: "#99f6e4" },
    "c":      { color: "#4f46e5", bg: "#eef2ff", bd: "#c7d2fe" },
    "d":      { color: "#d97706", bg: "#fffbeb", bd: "#fde68a" },
    "f":      { color: "#ef4444", bg: "#fef2f2", bd: "#fecaca" },
  };
  const s = map[cls] || map["f"];
  return active
    ? { color: s.color, background: s.bg, borderColor: s.bd, borderWidth: "2px" }
    : {};
}

/* ── Unique ID ── */
let uid = 0;
function newId() { return ++uid; }

const DEFAULT_ROWS = [
  { id: newId(), name: "Mathematics",  obtained: "", max: "100" },
  { id: newId(), name: "Science",      obtained: "", max: "100" },
  { id: newId(), name: "English",      obtained: "", max: "100" },
];

/* ── Main Component ── */
export default function MarksCalculator() {
  const [rows,    setRows]    = useState(DEFAULT_ROWS);
  const [system,  setSystem]  = useState("percentage");
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  /* ── Row CRUD ── */
  function addRow() {
    setRows(r => [...r, { id: newId(), name: "", obtained: "", max: "100" }]);
  }

  function deleteRow(id) {
    setRows(r => r.filter(row => row.id !== id));
    setResults(null);
  }

  function updateRow(id, field, value) {
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));
    setResults(null);
    setError("");
  }

  /* ── Calculate ── */
  function calculate() {
    setError("");
    const filled = rows.filter(r => r.name.trim() && r.obtained !== "" && r.max !== "");
    if (filled.length === 0) { setError("Please fill in at least one subject with marks."); return; }

    const computed = [];
    for (const r of filled) {
      const obt = parseFloat(r.obtained);
      const max = parseFloat(r.max);
      if (isNaN(obt) || isNaN(max) || max <= 0) { setError(`Invalid marks for "${r.name || "a subject"}".`); return; }
      if (obt < 0 || obt > max) { setError(`Marks for "${r.name}" must be between 0 and ${max}.`); return; }
      const pct   = (obt / max) * 100;
      const grade = getGrade(pct, system);
      const pass  = pct >= PASS_MARKS[system];
      computed.push({ ...r, obt, max, pct, grade, pass });
    }

    const totalObt = computed.reduce((a, r) => a + r.obt, 0);
    const totalMax = computed.reduce((a, r) => a + r.max, 0);
    const overallPct = (totalObt / totalMax) * 100;
    const overallGrade = getGrade(overallPct, system);
    const passedCount  = computed.filter(r => r.pass).length;
    const highestPct   = Math.max(...computed.map(r => r.pct));
    const lowestPct    = Math.min(...computed.map(r => r.pct));
    const avgGpa       = computed.reduce((a, r) => a + parseFloat(r.grade.gpa), 0) / computed.length;

    setResults({ rows: computed, overallPct, overallGrade, totalObt, totalMax, passedCount, highestPct, lowestPct, avgGpa: avgGpa.toFixed(2) });
  }

  /* ── Copy ── */
  function handleCopy() {
    if (!results) return;
    const lines = [
      `Marks Result Summary`,
      `Grading System: ${GRADING_SYSTEMS.find(g => g.id === system)?.label}`,
      ``,
      ...results.rows.map(r =>
        `${r.name}: ${r.obt}/${r.max} — ${r.pct.toFixed(2)}% — Grade: ${r.grade.letter} — ${r.pass ? "Pass" : "Fail"}`
      ),
      ``,
      `Overall: ${results.overallPct.toFixed(2)}% — Grade: ${results.overallGrade.letter} (${results.overallGrade.label})`,
      `GPA: ${results.avgGpa}`,
      `Subjects Passed: ${results.passedCount}/${results.rows.length}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleReset() {
    setRows(DEFAULT_ROWS.map(r => ({ ...r, id: newId(), obtained: "" })));
    setResults(null); setError(""); setCopied(false);
  }

  const canCalc = rows.some(r => r.name.trim() && r.obtained !== "" && r.max !== "");
  const legend  = LEGENDS[system];

  return (
    <>
      <Helmet>
        <title>Marks Percentage Calculator – Grade & GPA Calculator | ShauryaTools</title>
        <meta name="description" content="Calculate your marks percentage, grade, and GPA instantly. Supports percentage, 10-point, and 4-point grading systems. Add multiple subjects and get a detailed result breakdown." />
        <meta name="keywords" content="marks percentage calculator, grade calculator, GPA calculator, exam marks calculator, percentage to grade, marks to percentage" />
        <link rel="canonical" href="https://shauryatools.vercel.app/marks-calculator" />
      </Helmet>

      <div className="mc-page">
        <div className="mc-inner">

          {/* ── Header ── */}
          <div className="mc-header">
            <div className="mc-icon"><Percent size={22} strokeWidth={2.5} /></div>
            <div>
              <span className="mc-cat">AI Study Tools</span>
              <h1>Marks Percentage Calculator</h1>
              <p>Enter your marks per subject to instantly calculate your percentage, grade, and GPA.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="mc-card">

            {/* Grading system */}
            <div>
              <div className="mc-label"><BarChart2 size={14} strokeWidth={2.5} className="mc-lbl-icon" />Grading System</div>
              <div className="mc-chips">
                {GRADING_SYSTEMS.map(g => (
                  <button
                    key={g.id}
                    className={`mc-chip ${system === g.id ? "mc-chip-on" : ""}`}
                    onClick={() => { setSystem(g.id); setResults(null); }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mc-divider" />

            {/* Table header */}
            <div className="mc-subj-header">
              <span>Subject Name</span>
              <span style={{ textAlign: "center" }}>Obtained</span>
              <span style={{ textAlign: "center" }}>Max Marks</span>
              <span style={{ textAlign: "center" }}>Result</span>
              <span />
            </div>

            {/* Rows */}
            <div className="mc-subjects">
              {rows.map(row => {
                const obt = parseFloat(row.obtained);
                const max = parseFloat(row.max);
                const valid = !isNaN(obt) && !isNaN(max) && max > 0 && obt >= 0 && obt <= max;
                const pct   = valid ? (obt / max) * 100 : null;
                const grade = pct !== null ? getGrade(pct, system) : null;
                const hasErr = row.obtained !== "" && (!isNaN(obt)) && (!isNaN(max)) && obt > max;

                return (
                  <div key={row.id} className="mc-subj-row">
                    <input
                      className="mc-subj-name-input"
                      type="text"
                      placeholder="Subject name"
                      value={row.name}
                      onChange={e => updateRow(row.id, "name", e.target.value)}
                    />
                    <input
                      className={`mc-subj-marks-input ${hasErr ? "mc-marks-error" : ""}`}
                      type="number" min="0"
                      placeholder="0"
                      value={row.obtained}
                      onChange={e => updateRow(row.id, "obtained", e.target.value)}
                    />
                    <input
                      className="mc-subj-marks-input"
                      type="number" min="1"
                      placeholder="100"
                      value={row.max}
                      onChange={e => updateRow(row.id, "max", e.target.value)}
                    />
                    <div className="mc-subj-result">
                      {grade ? (
                        <span className={`mc-pct-badge mc-pct-${grade.cls}`}>
                          {pct.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--grey-3)" }}>—</span>
                      )}
                    </div>
                    <button
                      className="mc-del-btn"
                      onClick={() => deleteRow(row.id)}
                      disabled={rows.length === 1}
                      style={rows.length === 1 ? { opacity: 0.25, cursor: "not-allowed" } : {}}
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>

            <button className="mc-add-btn" onClick={addRow}>
              <Plus size={14} strokeWidth={2.5} />
              Add Subject
            </button>

            {error && (
              <div className="mc-error"><AlertCircle size={14} strokeWidth={2.5} />{error}</div>
            )}

            <div className="mc-divider" />

            <button className="mc-submit" onClick={calculate} disabled={!canCalc}>
              <Calculator size={16} strokeWidth={2} />
              Calculate Result
            </button>
          </div>

          {/* ── Results ── */}
          {results && (
            <>
              {/* Hero */}
              <div className={`mc-result-hero mc-hero-grade-${results.overallGrade.cls} mc-animate`}>
                <div className="mc-hero-left">
                  <span className="mc-hero-label">Overall Percentage</span>
                  <div className="mc-hero-pct">{results.overallPct.toFixed(2)}%</div>
                  <p className="mc-hero-sub">
                    {results.totalObt.toFixed(0)} / {results.totalMax} marks ·{" "}
                    {results.overallGrade.label}
                  </p>
                </div>
                <div className="mc-hero-right">
                  <div className="mc-hero-grade-pill">{results.overallGrade.letter}</div>
                  <div className="mc-hero-stats">
                    <span className="mc-hero-stat">GPA · {results.avgGpa}</span>
                    <span className="mc-hero-stat">
                      {results.passedCount}/{results.rows.length} subjects passed
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mc-stats-row mc-animate">
                <div className="mc-stat-box">
                  <div className="mc-stat-icon mc-stat-icon-accent"><TrendingUp size={14} strokeWidth={2.5} /></div>
                  <span className="mc-stat-val">{results.highestPct.toFixed(1)}%</span>
                  <span className="mc-stat-lbl">Highest</span>
                </div>
                <div className="mc-stat-box">
                  <div className="mc-stat-icon mc-stat-icon-violet"><ChevronDown size={14} strokeWidth={2.5} /></div>
                  <span className="mc-stat-val">{results.lowestPct.toFixed(1)}%</span>
                  <span className="mc-stat-lbl">Lowest</span>
                </div>
                <div className="mc-stat-box">
                  <div className="mc-stat-icon mc-stat-icon-green"><Award size={14} strokeWidth={2.5} /></div>
                  <span className="mc-stat-val">{results.passedCount}/{results.rows.length}</span>
                  <span className="mc-stat-lbl">Passed</span>
                </div>
                <div className="mc-stat-box">
                  <div className="mc-stat-icon mc-stat-icon-amber"><Star size={14} strokeWidth={2.5} /></div>
                  <span className="mc-stat-val">{results.overallGrade.letter}</span>
                  <span className="mc-stat-lbl">Grade</span>
                </div>
              </div>

              {/* Subject breakdown */}
              <div className="mc-card mc-animate">
                <div className="mc-card-title">
                  <BookOpen size={15} strokeWidth={2.5} />
                  Subject-wise Breakdown
                </div>
                <div className="mc-result-rows">
                  {results.rows.map((r, i) => (
                    <div key={r.id} className="mc-result-row" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="mc-result-row-top">
                        <span className="mc-result-subj">{r.name}</span>
                        <div className="mc-result-right-top">
                          <span className="mc-result-fraction">{r.obt}/{r.max}</span>
                          <span className={`mc-pct-badge mc-pct-${r.grade.cls}`}>{r.pct.toFixed(2)}%</span>
                          <span className={`mc-pct-badge mc-pct-${r.grade.cls}`}>{r.grade.letter}</span>
                          {r.pass
                            ? <span className="mc-pass-chip">Pass</span>
                            : <span className="mc-fail-chip">Fail</span>
                          }
                        </div>
                      </div>
                      <div className="mc-result-bar-track">
                        <div
                          className="mc-result-bar-fill"
                          style={{ width: `${r.pct}%`, background: BAR_COLORS[r.grade.cls] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grade legend */}
              <div className="mc-card mc-animate">
                <div className="mc-card-title">
                  <BarChart2 size={15} strokeWidth={2.5} />
                  Grade Reference
                  <span style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 500, color: "var(--grey-3)" }}>
                    {GRADING_SYSTEMS.find(g => g.id === system)?.label}
                  </span>
                </div>
                <div className="mc-grade-legend">
                  {legend.map(g => {
                    const active = results.overallGrade.letter === g.letter;
                    return (
                      <div
                        key={g.letter}
                        className={`mc-grade-cell ${active ? "mc-grade-cell-active" : ""}`}
                        style={gradeStyle(g.cls, active)}
                      >
                        <span className="mc-grade-letter" style={active ? { color: gradeStyle(g.cls, true).color } : { color: "var(--black)" }}>
                          {g.letter}
                        </span>
                        <span className="mc-grade-range">{g.range}%</span>
                        <span className="mc-grade-gpa" style={{ color: active ? gradeStyle(g.cls, true).color : "var(--grey-3)" }}>
                          GPA {g.gpa}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer actions */}
              <div className="mc-card mc-animate" style={{ gap: 0, padding: "16px 20px" }}>
                <div className="mc-result-footer">
                  <span className="mc-footer-note">
                    {results.rows.length} subjects · {results.overallPct.toFixed(2)}% overall
                  </span>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button className="mc-reset-btn" onClick={handleReset}>
                      <RefreshCw size={13} strokeWidth={2.5} />
                      New Calculation
                    </button>
                    <button className={`mc-copy-full ${copied ? "mc-copy-copied" : ""}`} onClick={handleCopy}>
                      {copied
                        ? <><Check size={14} strokeWidth={2.5} />Copied!</>
                        : <><Copy size={14} strokeWidth={2.5} />Copy Results</>
                      }
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
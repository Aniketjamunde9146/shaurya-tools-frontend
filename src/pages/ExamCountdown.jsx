/* eslint-disable no-empty */
import { useState, useEffect, useRef } from "react";
import "./ExamCountdown.css";
import { Helmet } from "react-helmet";
import {
  GraduationCap,
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Flame,
  BookOpen,
  Timer,
  Star,
  StarOff,
  Edit2,
  X,
  Check,
  Calendar,
  Zap,
} from "lucide-react";

/* ── Priority levels ── */
const PRIORITIES = [
  { id: "high",   label: "High",   color: "var(--ec-red)",    bg: "var(--ec-red-bg)",    bd: "var(--ec-red-bd)"    },
  { id: "medium", label: "Medium", color: "var(--ec-amber)",  bg: "var(--ec-amber-bg)",  bd: "var(--ec-amber-bd)"  },
  { id: "low",    label: "Low",    color: "var(--ec-green)",  bg: "var(--ec-green-bg)",  bd: "var(--ec-green-bd)"  },
];

/* ── Urgency thresholds (days) ── */
function getUrgency(days) {
  if (days < 0)   return { label: "Passed",   cls: "ec-passed",   icon: CheckCircle2 };
  if (days === 0) return { label: "Today!",   cls: "ec-today",    icon: Zap          };
  if (days <= 3)  return { label: "Critical", cls: "ec-critical", icon: AlertTriangle };
  if (days <= 7)  return { label: "Soon",     cls: "ec-soon",     icon: Flame        };
  if (days <= 14) return { label: "Coming",   cls: "ec-coming",   icon: Clock        };
  return           { label: "Upcoming",  cls: "ec-upcoming", icon: CalendarDays };
}

/* ── Pad ── */
function pad(n) { return String(Math.abs(n)).padStart(2, "0"); }

/* ── Days/hours/mins/secs breakdown ── */
function breakdown(targetDate) {
  const now   = new Date();
  const diff  = new Date(targetDate) - now;
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, total: diff };
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);
  const secs  = Math.floor((diff % 60000)    / 1000);
  return { days, hours, mins, secs, total: diff };
}

/* ── Friendly date display ── */
function friendlyDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/* ── Days remaining (calendar days) ── */
function daysRemaining(dateStr) {
  const now   = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.floor((target - now) / 86400000);
}

/* ── Empty state SVG ── */
function EmptyIllustration() {
  return (
    <div className="ec-empty">
      <GraduationCap size={48} strokeWidth={1.5} />
      <p>No exams added yet</p>
      <span>Add your first exam using the form above</span>
    </div>
  );
}

/* ── Single Countdown Card ── */
function ExamCard({ exam, onDelete, onEdit, onToggleStar }) {
  const [tick, setTick] = useState(breakdown(exam.datetime));

  useEffect(() => {
    const id = setInterval(() => setTick(breakdown(exam.datetime)), 1000);
    return () => clearInterval(id);
  }, [exam.datetime]);

  const days    = daysRemaining(exam.datetime);
  const urgency = getUrgency(days);
  const UrgIcon = urgency.icon;
  const priority = PRIORITIES.find(p => p.id === exam.priority) || PRIORITIES[1];
  const isPassed = tick.total <= 0;

  return (
    <div className={`ec-card ${urgency.cls} ${isPassed ? "ec-card-passed" : ""}`}>
      {/* Top row */}
      <div className="ec-card-top">
        <div className="ec-card-meta">
          <span className={`ec-urgency-badge ec-badge-${urgency.cls}`}>
            <UrgIcon size={11} strokeWidth={2.5} />
            {urgency.label}
          </span>
          <span
            className="ec-priority-badge"
            style={{ color: priority.color, background: priority.bg, borderColor: priority.bd }}
          >
            {priority.label}
          </span>
          {exam.subject && (
            <span className="ec-subject-badge">
              <BookOpen size={11} strokeWidth={2.5} />
              {exam.subject}
            </span>
          )}
        </div>
        <div className="ec-card-actions">
          <button className="ec-icon-btn" onClick={() => onToggleStar(exam.id)} title="Star">
            {exam.starred
              ? <Star size={14} strokeWidth={2} style={{ color: "var(--ec-amber)", fill: "var(--ec-amber)" }} />
              : <StarOff size={14} strokeWidth={2} />}
          </button>
          <button className="ec-icon-btn" onClick={() => onEdit(exam)} title="Edit">
            <Edit2 size={14} strokeWidth={2} />
          </button>
          <button className="ec-icon-btn ec-icon-del" onClick={() => onDelete(exam.id)} title="Delete">
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Exam name */}
      <h2 className="ec-card-name">{exam.name}</h2>

      {/* Date */}
      <div className="ec-card-date">
        <Calendar size={13} strokeWidth={2} />
        {friendlyDate(exam.datetime)}
        {exam.time && <span className="ec-card-time"><Clock size={11} strokeWidth={2} />{exam.time}</span>}
      </div>

      {/* Countdown display */}
      {!isPassed ? (
        <div className="ec-countdown-grid">
          {[
            { val: tick.days,  unit: "Days"    },
            { val: tick.hours, unit: "Hours"   },
            { val: tick.mins,  unit: "Minutes" },
            { val: tick.secs,  unit: "Seconds" },
          ].map(({ val, unit }) => (
            <div key={unit} className="ec-unit">
              <span className="ec-unit-val">{pad(val)}</span>
              <span className="ec-unit-label">{unit}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="ec-passed-msg">
          <CheckCircle2 size={18} strokeWidth={2} />
          Exam date has passed
        </div>
      )}

      {/* Notes */}
      {exam.notes && <p className="ec-card-notes">{exam.notes}</p>}

      {/* Progress bar — % of time elapsed since added */}
      {!isPassed && exam.addedAt && (
        <div className="ec-progress-wrap">
          <div
            className="ec-progress-bar"
            style={{
              width: `${Math.min(100, Math.max(0, ((Date.now() - exam.addedAt) / (new Date(exam.datetime) - exam.addedAt)) * 100))}%`,
              background: urgency.cls === "ec-critical" || urgency.cls === "ec-today"
                ? "var(--ec-red)"
                : urgency.cls === "ec-soon"
                ? "var(--ec-amber)"
                : "var(--ec-indigo)",
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function ExamCountdown() {
  const [exams,      setExams]      = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [sortBy,     setSortBy]     = useState("date");   // date | priority | name
  const [filterPri,  setFilterPri]  = useState("all");
  const [search,     setSearch]     = useState("");

  /* Form state */
  const [name,     setName]     = useState("");
  const [subject,  setSubject]  = useState("");
  const [date,     setDate]     = useState("");
  const [time,     setTime]     = useState("");
  const [priority, setPriority] = useState("medium");
  const [notes,    setNotes]    = useState("");
  const [formErr,  setFormErr]  = useState("");

  /* ── Persist to localStorage ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ec_exams");
      if (saved) setExams(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("ec_exams", JSON.stringify(exams)); } catch {}
  }, [exams]);

  /* ── Form helpers ── */
  function resetForm() {
    setName(""); setSubject(""); setDate(""); setTime("");
    setPriority("medium"); setNotes(""); setFormErr(""); setEditTarget(null);
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(exam) {
    setName(exam.name);
    setSubject(exam.subject || "");
    const dt = new Date(exam.datetime);
    setDate(dt.toISOString().slice(0, 10));
    setTime(exam.time || "");
    setPriority(exam.priority);
    setNotes(exam.notes || "");
    setFormErr("");
    setEditTarget(exam.id);
    setShowForm(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim())   { setFormErr("Exam name is required."); return; }
    if (!date)          { setFormErr("Exam date is required."); return; }

    const datetime = time ? `${date}T${time}` : `${date}T09:00`;

    if (editTarget) {
      setExams(prev => prev.map(ex =>
        ex.id === editTarget
          ? { ...ex, name: name.trim(), subject: subject.trim(), datetime, time, priority, notes: notes.trim() }
          : ex
      ));
    } else {
      setExams(prev => [...prev, {
        id: Date.now(),
        name: name.trim(),
        subject: subject.trim(),
        datetime,
        time,
        priority,
        notes: notes.trim(),
        starred: false,
        addedAt: Date.now(),
      }]);
    }
    resetForm();
    setShowForm(false);
  }

  /* ── Actions ── */
  function deleteExam(id)      { setExams(prev => prev.filter(e => e.id !== id)); }
  function toggleStar(id)      { setExams(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e)); }

  /* ── Sorted + filtered list ── */
  const displayed = exams
    .filter(e => filterPri === "all" || e.priority === filterPri)
    .filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.subject || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      if (sortBy === "date")     return new Date(a.datetime) - new Date(b.datetime);
      if (sortBy === "priority") { const ord = { high: 0, medium: 1, low: 2 }; return ord[a.priority] - ord[b.priority]; }
      if (sortBy === "name")     return a.name.localeCompare(b.name);
      return 0;
    });

  const upcomingCount = exams.filter(e => daysRemaining(e.datetime) >= 0).length;
  const criticalCount = exams.filter(e => { const d = daysRemaining(e.datetime); return d >= 0 && d <= 3; }).length;

  return (
    <>
      <Helmet>
        <title>Free Exam Countdown Timer – Track All Your Exams | ShauryaTools</title>
        <meta name="description" content="Track all your upcoming exams with live countdowns. Add exam dates, set priorities, get urgency alerts and never miss an exam again. Free student tool." />
        <meta name="keywords" content="exam countdown timer, exam date tracker, student countdown, exam reminder, study planner, exam scheduler, countdown to exam, test timer" />
        <link rel="canonical" href="https://shauryatools.vercel.app/exam-countdown" />
      </Helmet>

      <div className="ec-page">
        <div className="ec-inner">

          {/* ── Header ── */}
          <div className="ec-header">
            <div className="ec-header-left">
              <div className="ec-icon">
                <GraduationCap size={20} strokeWidth={2} />
              </div>
              <div>
                <span className="ec-cat">Student Tools</span>
                <h1>Exam Countdown Timer</h1>
                <p>Track all your exams with live countdowns, priorities & urgency alerts.</p>
              </div>
            </div>
            <button className="ec-add-btn" onClick={openAdd}>
              <Plus size={16} strokeWidth={2.5} />
              Add Exam
            </button>
          </div>

          {/* ── Stats pills ── */}
          {exams.length > 0 && (
            <div className="ec-stats-row">
              <div className="ec-stat-pill">
                <CalendarDays size={14} strokeWidth={2} />
                <strong>{upcomingCount}</strong> upcoming
              </div>
              {criticalCount > 0 && (
                <div className="ec-stat-pill ec-stat-critical">
                  <AlertTriangle size={14} strokeWidth={2} />
                  <strong>{criticalCount}</strong> critical
                </div>
              )}
              <div className="ec-stat-pill">
                <CheckCircle2 size={14} strokeWidth={2} />
                <strong>{exams.filter(e => daysRemaining(e.datetime) < 0).length}</strong> passed
              </div>
            </div>
          )}

          {/* ── Add / Edit Form ── */}
          {showForm && (
            <div className="ec-form-card ec-animate-in">
              <div className="ec-form-header">
                <span className="ec-form-title">
                  {editTarget ? <><Edit2 size={15} strokeWidth={2.5} /> Edit Exam</> : <><Plus size={15} strokeWidth={2.5} /> Add New Exam</>}
                </span>
                <button className="ec-icon-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <form className="ec-form" onSubmit={handleSubmit}>
                <div className="ec-form-row-2">
                  <div className="ec-form-field">
                    <label className="ec-form-label">Exam Name *</label>
                    <input
                      className="ec-input"
                      type="text"
                      placeholder="e.g. Mathematics Final"
                      value={name}
                      onChange={e => { setName(e.target.value); setFormErr(""); }}
                      maxLength={80}
                    />
                  </div>
                  <div className="ec-form-field">
                    <label className="ec-form-label">Subject <span className="ec-optional">(optional)</span></label>
                    <input
                      className="ec-input"
                      type="text"
                      placeholder="e.g. Calculus, Physics..."
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="ec-form-row-2">
                  <div className="ec-form-field">
                    <label className="ec-form-label"><CalendarDays size={13} strokeWidth={2.5} /> Exam Date *</label>
                    <input
                      className="ec-input"
                      type="date"
                      value={date}
                      onChange={e => { setDate(e.target.value); setFormErr(""); }}
                      min={new Date().toISOString().slice(0,10)}
                    />
                  </div>
                  <div className="ec-form-field">
                    <label className="ec-form-label"><Clock size={13} strokeWidth={2.5} /> Start Time <span className="ec-optional">(optional)</span></label>
                    <input
                      className="ec-input"
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Priority */}
                <div className="ec-form-field">
                  <label className="ec-form-label">Priority</label>
                  <div className="ec-priority-row">
                    {PRIORITIES.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`ec-pri-btn ${priority === p.id ? "ec-pri-on" : ""}`}
                        style={priority === p.id ? { color: p.color, background: p.bg, borderColor: p.bd } : {}}
                        onClick={() => setPriority(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="ec-form-field">
                  <label className="ec-form-label">Notes <span className="ec-optional">(optional)</span></label>
                  <input
                    className="ec-input"
                    type="text"
                    placeholder="e.g. Chapters 1–5, open book, Room 201..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    maxLength={200}
                  />
                </div>

                {formErr && (
                  <div className="ec-form-error">
                    <AlertTriangle size={13} strokeWidth={2.5} />
                    {formErr}
                  </div>
                )}

                <div className="ec-form-footer">
                  <button type="button" className="ec-cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="ec-save-btn">
                    <Check size={15} strokeWidth={2.5} />
                    {editTarget ? "Save Changes" : "Add Exam"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Controls bar ── */}
          {exams.length > 0 && (
            <div className="ec-controls-bar">
              <input
                className="ec-search"
                type="text"
                placeholder="Search exams..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="ec-bar-right">
                <select className="ec-select" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
                  <option value="all">All priorities</option>
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <select className="ec-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="date">Sort: Date</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>
          )}

          {/* ── Cards ── */}
          {exams.length === 0 && !showForm && <EmptyIllustration />}

          {displayed.length === 0 && exams.length > 0 && (
            <div className="ec-empty">
              <Timer size={36} strokeWidth={1.5} />
              <p>No exams match your filter</p>
            </div>
          )}

          <div className="ec-cards-grid">
            {displayed.map(exam => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onDelete={deleteExam}
                onEdit={openEdit}
                onToggleStar={toggleStar}
              />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
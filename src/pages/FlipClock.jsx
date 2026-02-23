import { useState, useEffect, useRef, useCallback } from "react";
import "./FlipClock.css";
import { Helmet } from "react-helmet";
import {
  Clock, AlarmClock, Timer, MapPin,
  Sun, Moon, Maximize2, Minimize2,
  Play, Pause, RotateCcw, Square,
  Plus, Minus, Calendar,
  Volume2, VolumeX, Settings, X,
  Flag, Bell, Check,
} from "lucide-react";

/* ──────────────────────────────────────────
   UTILS
────────────────────────────────────────── */
function pad(n) { return String(Math.abs(Math.floor(n))).padStart(2, "0"); }

function useBeep() {
  const ctxRef = useRef(null);
  const beep = useCallback((freq = 880, dur = 0.12, vol = 0.25) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch {}
  }, []);
  const chime = useCallback(() => {
    [0, 180, 360].forEach((d, i) => setTimeout(() => beep(660 + i * 220, 0.2, 0.2), d));
  }, [beep]);
  return { beep, chime };
}

function formatMs(ms) {
  const m  = Math.floor(ms / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000)  / 10);
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

/* ──────────────────────────────────────────
   FLIP DIGIT
────────────────────────────────────────── */
function FlipDigit({ value }) {
  const [cur,  setCur]  = useState(value);
  const [prev, setPrev] = useState(value);
  const [flip, setFlip] = useState(false);
  const tRef = useRef(null);

  useEffect(() => {
    if (value === cur) return;
    setPrev(cur);
    setFlip(true);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      setCur(value);
      setFlip(false);
    }, 290);
    return () => clearTimeout(tRef.current);
  }, [value]);

  return (
    <div className={`fd-wrap ${flip ? "fd-flipping" : ""}`}>
      <div className="fd-half fd-top"><span>{cur}</span></div>
      <div className="fd-half fd-bot"><span>{cur}</span></div>
      {flip && <>
        <div className="fd-flap fd-old"><span>{prev}</span></div>
        <div className="fd-flap fd-new"><span>{cur}</span></div>
      </>}
      <div className="fd-split" />
    </div>
  );
}

/* ──────────────────────────────────────────
   FLIP GROUP  (HH or MM or SS)
────────────────────────────────────────── */
function FlipGroup({ value, label, size = "lg" }) {
  const s = pad(value);
  return (
    <div className={`fg-wrap fg-${size}`}>
      <div className="fg-digits">
        <FlipDigit value={s[0]} />
        <FlipDigit value={s[1]} />
      </div>
      {label && <span className="fg-label">{label}</span>}
    </div>
  );
}

function Sep({ dim, size = "lg" }) {
  return (
    <div className={`fc-sep fc-sep-${size} ${dim ? "fc-sep-dim" : ""}`}>
      <span /><span />
    </div>
  );
}

/* ──────────────────────────────────────────
   CLOCK MODE
────────────────────────────────────────── */
function ClockMode({ show24, showSec, showDate }) {
  const [now, setNow] = useState(new Date());
  const [dim, setDim] = useState(false);
  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); setDim(d => !d); }, 1000);
    return () => clearInterval(id);
  }, []);

  let h = now.getHours();
  const m = now.getMinutes(), s = now.getSeconds();
  let ampm = "";
  if (!show24) { ampm = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; }

  const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const ds = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  return (
    <div className="mode-wrap">
      {showDate && <div className="fc-date-pill"><Calendar size={12} />{ds}</div>}
      <div className="fc-row">
        <FlipGroup value={h} label="HRS" />
        <Sep dim={dim} />
        <FlipGroup value={m} label="MIN" />
        {showSec && <><Sep dim={dim} /><FlipGroup value={s} label="SEC" /></>}
        {!show24 && <div className="fc-ampm">{ampm}</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   COUNTDOWN MODE
────────────────────────────────────────── */
function CountdownMode({ sound }) {
  const { beep, chime } = useBeep();
  const [setH, setSetH] = useState(0);
  const [setM, setSetM] = useState(25);
  const [setS, setSetSS] = useState(0);
  const [total,   setTotal]   = useState(25 * 60);
  const [left,    setLeft]    = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(false);
  const [dim,     setDim]     = useState(false);
  const intRef = useRef(null);

  useEffect(() => {
    if (running) {
      intRef.current = setInterval(() => {
        setLeft(l => {
          if (l <= 1) {
            clearInterval(intRef.current);
            setRunning(false); setDone(true);
            if (sound) chime();
            return 0;
          }
          if (l <= 4 && sound) beep(440, 0.08, 0.12);
          setDim(d => !d);
          return l - 1;
        });
      }, 1000);
    } else clearInterval(intRef.current);
    return () => clearInterval(intRef.current);
  }, [running]);

  function applySet() {
    const t = setH * 3600 + setM * 60 + setS;
    if (t === 0) return;
    setTotal(t); setLeft(t); setRunning(false); setDone(false);
  }
  function reset() { setLeft(total); setRunning(false); setDone(false); }

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const pct = total > 0 ? (left / total) * 100 : 0;
  const C = 2 * Math.PI * 100;

  return (
    <div className="mode-wrap">
      {/* Ring */}
      <div className="cd-ring">
        <svg viewBox="0 0 220 220" className="cd-svg">
          <circle cx="110" cy="110" r="100" fill="none" stroke="var(--ring-track)" strokeWidth="7" />
          <circle cx="110" cy="110" r="100" fill="none"
            stroke={pct < 20 && !done ? "var(--danger)" : "var(--accent)"}
            strokeWidth="7" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
            transform="rotate(-90 110 110)"
            style={{ transition: "stroke-dashoffset 0.85s ease, stroke 0.4s" }}
          />
        </svg>
        <div className="cd-inner">
          {done ? (
            <div className="cd-done"><Bell size={28} /><span>Time's Up!</span></div>
          ) : (
            <div className="fc-row fc-row-sm">
              {h > 0 && <><FlipGroup value={h} label="HRS" size="sm" /><Sep dim={dim && running} size="sm" /></>}
              <FlipGroup value={m} label="MIN" size="sm" />
              <Sep dim={dim && running} size="sm" />
              <FlipGroup value={s} label="SEC" size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Set time row */}
      {!running && (
        <div className="cd-set">
          {[{l:"H",v:setH,fn:setSetH,max:23},{l:"M",v:setM,fn:setSetM,max:59},{l:"S",v:setS,fn:setSetSS,max:59}].map(({l,v,fn,max}) => (
            <div key={l} className="cd-adj-unit">
              <button className="cd-adj-btn" onClick={() => fn(x => Math.min(max, x+1))}><Plus size={13} strokeWidth={2.5}/></button>
              <div className="cd-adj-val">{pad(v)}<em>{l}</em></div>
              <button className="cd-adj-btn" onClick={() => fn(x => Math.max(0, x-1))}><Minus size={13} strokeWidth={2.5}/></button>
            </div>
          ))}
          <button className="cd-set-btn" onClick={applySet}><Check size={14} strokeWidth={2.5}/>Set</button>
        </div>
      )}

      {/* Controls */}
      <div className="fc-ctrl-row">
        <button className="fc-ctrl-sm" onClick={reset}><RotateCcw size={17} strokeWidth={2}/></button>
        <button className={`fc-ctrl-lg ${running ? "ctrl-running" : ""}`}
          onClick={() => { setDone(false); setRunning(v => !v); if (!running && sound) beep(660,0.07,0.18); }}>
          {running ? <Pause size={26} strokeWidth={2}/> : <Play size={26} strokeWidth={2} style={{marginLeft:3}}/>}
        </button>
        <button className="fc-ctrl-sm" onClick={() => { setLeft(total); setRunning(false); setDone(false); }}>
          <Square size={15} strokeWidth={2}/>
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   STOPWATCH MODE
────────────────────────────────────────── */
function StopwatchMode({ sound }) {
  const { beep } = useBeep();
  const [ms,      setMs]      = useState(0);
  const [running, setRunning] = useState(false);
  const [laps,    setLaps]    = useState([]);
  const startRef = useRef(null);
  const baseRef  = useRef(0);

  useEffect(() => {
    let raf;
    if (running) {
      startRef.current = performance.now();
      const tick = () => { setMs(baseRef.current + (performance.now() - startRef.current)); raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, [running]);

  function toggle() {
    if (running) { baseRef.current += performance.now() - startRef.current; setRunning(false); }
    else { setRunning(true); if (sound) beep(660, 0.07, 0.18); }
  }
  function reset() { setMs(0); setRunning(false); baseRef.current = 0; setLaps([]); }
  function lap() {
    const prevTotal = laps.length > 0 ? laps[0].total : 0;
    setLaps(prev => [{ id: prev.length + 1, total: ms, split: ms - prevTotal }, ...prev]);
    if (sound) beep(880, 0.06, 0.14);
  }

  const h  = Math.floor(ms / 3600000);
  const m  = Math.floor((ms % 3600000) / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);

  return (
    <div className="mode-wrap">
      <div className="sw-display">
        <div className="fc-row">
          {h > 0 && <><FlipGroup value={h} label="HRS" /><Sep dim={false} /></>}
          <FlipGroup value={m} label="MIN" />
          <Sep dim={false} />
          <FlipGroup value={s} label="SEC" />
        </div>
        <div className="sw-cs">.{pad(cs)}</div>
      </div>

      <div className="fc-ctrl-row">
        <button className="fc-ctrl-sm" onClick={reset} style={{ opacity: ms > 0 ? 1 : 0.3 }}>
          <RotateCcw size={17} strokeWidth={2}/>
        </button>
        <button className={`fc-ctrl-lg ${running ? "ctrl-running" : ""}`} onClick={toggle}>
          {running ? <Pause size={26} strokeWidth={2}/> : <Play size={26} strokeWidth={2} style={{marginLeft:3}}/>}
        </button>
        <button className="fc-ctrl-sm" onClick={lap} disabled={!running} style={{ opacity: running ? 1 : 0.3 }}>
          <Flag size={15} strokeWidth={2}/>
        </button>
      </div>

      {laps.length > 0 && (
        <div className="sw-laps">
          <div className="sw-laps-hdr"><span>#</span><span>Split</span><span>Total</span></div>
          <div className="sw-laps-body">
            {laps.map((l, i) => (
              <div key={l.id} className={`sw-lap-row ${i === 0 ? "sw-lap-new" : ""}`}>
                <span>{l.id}</span>
                <span>{formatMs(l.split)}</span>
                <span>{formatMs(l.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   WORLD CLOCK
────────────────────────────────────────── */
const ZONES = [
  {city:"New York",    tz:"America/New_York"   },
  {city:"Los Angeles", tz:"America/Los_Angeles"},
  {city:"São Paulo",   tz:"America/Sao_Paulo"  },
  {city:"London",      tz:"Europe/London"      },
  {city:"Paris",       tz:"Europe/Paris"       },
  {city:"Dubai",       tz:"Asia/Dubai"         },
  {city:"Mumbai",      tz:"Asia/Kolkata"       },
  {city:"Singapore",   tz:"Asia/Singapore"     },
  {city:"Tokyo",       tz:"Asia/Tokyo"         },
  {city:"Sydney",      tz:"Australia/Sydney"   },
];

function WorldClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="mode-wrap wc-wrap">
      <div className="wc-grid">
        {ZONES.map(({ city, tz }) => {
          const fmt = o => new Intl.DateTimeFormat("en", { timeZone: tz, ...o }).format(now);
          const h24 = parseInt(fmt({ hour: "numeric", hour12: false }));
          const ampm = h24 >= 12 ? "PM" : "AM";
          const hd = h24 % 12 || 12;
          const ts = `${pad(hd)}:${fmt({minute:"2-digit"})}:${fmt({second:"2-digit"})} ${ampm}`;
          const day = fmt({ weekday: "short", month: "short", day: "numeric" });
          const isNight = h24 >= 20 || h24 < 6;
          return (
            <div key={tz} className={`wc-card ${isNight ? "wc-night" : "wc-day"}`}>
              <div className="wc-city"><MapPin size={11} strokeWidth={2}/>{city}</div>
              <div className="wc-time">{ts}</div>
              <div className="wc-day-str">{day}</div>
              <div className="wc-indicator">{isNight ? <Moon size={10}/> : <Sun size={10}/>}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   SETTINGS PANEL
────────────────────────────────────────── */
const ACCENTS = ["#818cf8","#f59e0b","#10b981","#ef4444","#38bdf8","#f472b6","#a3e635"];

function SettingsPanel({ cfg, setCfg, onClose }) {
  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));
  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-panel" onClick={e => e.stopPropagation()}>
        <div className="sp-hdr">
          <span><Settings size={14} strokeWidth={2.5} />Settings</span>
          <button className="sp-x" onClick={onClose}><X size={16} strokeWidth={2}/></button>
        </div>
        <div className="sp-body">
          {[
            { k:"show24",    l:"24-hour format"  },
            { k:"showSec",   l:"Show seconds"    },
            { k:"showDate",  l:"Show date"       },
            { k:"sound",     l:"Sound effects"   },
            { k:"grain",     l:"Film grain"      },
          ].map(({ k, l }) => (
            <div key={k} className="sp-row">
              <span>{l}</span>
              <button className={`sp-tog ${cfg[k] ? "sp-tog-on" : ""}`} onClick={() => set(k, !cfg[k])}>
                <span className="sp-thumb" />
              </button>
            </div>
          ))}

          <div className="sp-hr" />
          <div className="sp-row sp-row-col">
            <span>Scale</span>
            <div className="sp-scale-btns">
              {["xs","sm","md","lg","xl"].map(s => (
                <button key={s} className={`sp-scale-btn ${cfg.scale === s ? "sp-scale-on" : ""}`}
                  onClick={() => set("scale", s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="sp-hr" />
          <div className="sp-row sp-row-col">
            <span>Accent colour</span>
            <div className="sp-colors">
              {ACCENTS.map(c => (
                <button key={c} className={`sp-clr ${cfg.accent === c ? "sp-clr-on" : ""}`}
                  style={{ background: c }} onClick={() => set("accent", c)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ROOT
────────────────────────────────────────── */
const TABS = [
  { id:"clock",     label:"Clock",     Icon: Clock      },
  { id:"countdown", label:"Countdown", Icon: AlarmClock },
  { id:"stopwatch", label:"Stopwatch", Icon: Timer      },
  { id:"world",     label:"World",     Icon: MapPin     },
];

export default function FlipClock() {
  const [tab,   setTab]   = useState("clock");
  const [dark,  setDark]  = useState(true);
  const [fs,    setFs]    = useState(false);
  const [sOpen, setSOpen] = useState(false);
  const [cfg,   setCfg]   = useState({
    show24: false, showSec: true, showDate: true,
    sound: true, grain: true,
    scale: "lg", accent: "#818cf8",
  });

  /* ── fullscreen ── */
  useEffect(() => {
    const fn = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);
  function toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }

  /* ── accent var ── */
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", cfg.accent);
  }, [cfg.accent]);

  return (
    <>
      <Helmet>
        <title>Flip Clock – Live Clock, Countdown, Stopwatch & World Clock | ShauryaTools</title>
        <meta name="description" content="All-in-one animated flip clock with countdown timer, stopwatch with lap times, 10-city world clock, dark/light mode, fullscreen & custom accent colours." />
        <meta name="keywords" content="flip clock, countdown timer, stopwatch, world clock, online clock, animated flip clock, retro clock, dark mode clock" />
        <link rel="canonical" href="https://shauryatools.vercel.app/flip-clock" />
      </Helmet>

      <div className={[
        "fc-root",
        dark ? "fc-dark" : "fc-light",
        `fc-scale-${cfg.scale}`,
        cfg.grain ? "fc-grain-on" : "",
        fs ? "fc-fs" : "",
      ].join(" ")}>

        {/* Grain overlay */}
        {cfg.grain && <div className="fc-grain-layer" />}

        {/* ── Top bar ── */}
        <header className="fc-bar">
          <div className="fc-brand">
            <Clock size={14} strokeWidth={2.5} />
            <span>FlipClock</span>
          </div>

          <nav className="fc-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} className={`fc-tab ${tab === id ? "fc-tab-on" : ""}`} onClick={() => setTab(id)}>
                <Icon size={13} strokeWidth={2.5} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="fc-bar-right">
            <button className="fc-bar-btn" title="Sound" onClick={() => setCfg(c => ({ ...c, sound: !c.sound }))}>
              {cfg.sound ? <Volume2 size={14} strokeWidth={2}/> : <VolumeX size={14} strokeWidth={2}/>}
            </button>
            <button className="fc-bar-btn" title="Theme" onClick={() => setDark(d => !d)}>
              {dark ? <Sun size={14} strokeWidth={2}/> : <Moon size={14} strokeWidth={2}/>}
            </button>
            <button className="fc-bar-btn" title="Settings" onClick={() => setSOpen(true)}>
              <Settings size={14} strokeWidth={2}/>
            </button>
            <button className="fc-bar-btn fc-bar-btn-fs" title="Fullscreen" onClick={toggleFs}>
              {fs ? <Minimize2 size={14} strokeWidth={2}/> : <Maximize2 size={14} strokeWidth={2}/>}
            </button>
          </div>
        </header>

        {/* ── Stage ── */}
        <main className="fc-stage">
          {tab === "clock"     && <ClockMode     show24={cfg.show24} showSec={cfg.showSec} showDate={cfg.showDate} />}
          {tab === "countdown" && <CountdownMode sound={cfg.sound} />}
          {tab === "stopwatch" && <StopwatchMode sound={cfg.sound} />}
          {tab === "world"     && <WorldClock />}
        </main>

        {/* ── Settings ── */}
        {sOpen && <SettingsPanel cfg={cfg} setCfg={setCfg} onClose={() => setSOpen(false)} />}

        {/* ── Rotate hint (portrait phones only) ── */}
        <div className="fc-rotate-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="1"/>
          </svg>
          Rotate for best experience
        </div>
      </div>
    </>
  );
}
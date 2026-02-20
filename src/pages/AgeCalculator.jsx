import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { CalendarDays, RefreshCw } from "lucide-react";
import "./AgeCalculator.css";

const SITE_URL = "https://shauryatools.vercel.app";
const PAGE_URL = `${SITE_URL}/age-calculator`;

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const ZODIAC = [
  { sign: "Capricorn",   emoji: "♑", start: [12,22], end: [1,19]  },
  { sign: "Aquarius",    emoji: "♒", start: [1,20],  end: [2,18]  },
  { sign: "Pisces",      emoji: "♓", start: [2,19],  end: [3,20]  },
  { sign: "Aries",       emoji: "♈", start: [3,21],  end: [4,19]  },
  { sign: "Taurus",      emoji: "♉", start: [4,20],  end: [5,20]  },
  { sign: "Gemini",      emoji: "♊", start: [5,21],  end: [6,20]  },
  { sign: "Cancer",      emoji: "♋", start: [6,21],  end: [7,22]  },
  { sign: "Leo",         emoji: "♌", start: [7,23],  end: [8,22]  },
  { sign: "Virgo",       emoji: "♍", start: [8,23],  end: [9,22]  },
  { sign: "Libra",       emoji: "♎", start: [9,23],  end: [10,22] },
  { sign: "Scorpio",     emoji: "♏", start: [10,23], end: [11,21] },
  { sign: "Sagittarius", emoji: "♐", start: [11,22], end: [12,21] },
];

function getZodiac(month, day) {
  for (const z of ZODIAC) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (sm === 12) {
      if ((month === 12 && day >= sd) || (month === 1 && day <= ed)) return z;
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return z;
    }
  }
  return null;
}

function getChineseZodiac(year) {
  const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
  const emojis  = ["🐀","🐂","🐅","🐇","🐉","🐍","🐎","🐑","🐒","🐓","🐕","🐖"];
  const idx = (year - 1900) % 12;
  return { animal: animals[idx], emoji: emojis[idx] };
}

function getDayOfWeek(year, month, day) {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const d = new Date(year, month - 1, day);
  return days[d.getDay()];
}

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function calcAge(birthDate, toDate) {
  const b = new Date(birthDate);
  const t = new Date(toDate);
  if (isNaN(b) || isNaN(t) || b > t) return null;

  let years  = t.getFullYear() - b.getFullYear();
  let months = t.getMonth()    - b.getMonth();
  let days   = t.getDate()     - b.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(t.getFullYear(), t.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { years--; months += 12; }

  const totalDays    = Math.floor((t - b) / 86400000);
  const totalWeeks   = Math.floor(totalDays / 7);
  const totalMonths  = years * 12 + months;
  const totalHours   = totalDays * 24;
  const totalMinutes = totalHours * 60;

  let nextBday = new Date(t.getFullYear(), b.getMonth(), b.getDate());
  if (nextBday <= t) nextBday.setFullYear(t.getFullYear() + 1);
  const daysToNextBday = Math.ceil((nextBday - t) / 86400000);

  const bYear  = b.getFullYear();
  const bMonth = b.getMonth() + 1;
  const bDay   = b.getDate();

  return {
    years, months, days,
    totalDays, totalWeeks, totalMonths, totalHours, totalMinutes,
    daysToNextBday,
    nextBdayYear: nextBday.getFullYear(),
    zodiac:   getZodiac(bMonth, bDay),
    chinese:  getChineseZodiac(bYear),
    dayOfWeek: getDayOfWeek(bYear, bMonth, bDay),
    isLeap:   isLeapYear(bYear),
    birthMonth: MONTHS[bMonth - 1],
    birthDay: bDay,
  };
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`ac-stat ac-stat-${color}`}>
      <span className="ac-stat-val">{value}</span>
      <span className="ac-stat-label">{label}</span>
      {sub && <span className="ac-stat-sub">{sub}</span>}
    </div>
  );
}

export default function AgeCalculator() {
  const today = new Date().toISOString().split("T")[0];
  const [dob,    setDob]    = useState("");
  const [toDate, setToDate] = useState(today);

  const result = useMemo(() => {
    if (!dob || !toDate) return null;
    return calcAge(dob, toDate);
  }, [dob, toDate]);

  const handleReset = () => { setDob(""); setToDate(today); };

  const maxDate = today;

  return (
    <>
      <Helmet>
        <title>Free Age Calculator – Find Your Exact Age Online | ShauryaTools</title>
        <meta name="description" content="Calculate your exact age in years, months and days. Get fun birth details like zodiac sign, Chinese zodiac, day of week, leap year status and days until your next birthday." />
        <meta name="keywords" content="age calculator, birthday calculator, exact age calculator, how old am I, age in days, zodiac sign calculator, days until birthday" />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Free Age Calculator – Find Your Exact Age Online" />
        <meta property="og:description" content="Enter your birthday and instantly see your exact age plus fun facts: zodiac sign, Chinese zodiac, day of week born and days until your next birthday." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Age Calculator Online" />
        <meta name="twitter:description" content="Find your exact age in years, months & days. Plus zodiac sign, leap year info and days until your next birthday. Free, no signup." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Age Calculator",
            "url": PAGE_URL,
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "All",
            "description": "Calculate your exact age in years, months and days. Includes zodiac sign, Chinese zodiac, day of week born, and days until next birthday.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
      </Helmet>

      <div className="ac-page">
        <div className="ac-inner">

          {/* Header */}
          <div className="ac-header">
            <div className="ac-icon">
              <CalendarDays size={20} />
            </div>
            <div>
              <span className="ac-cat-badge">Lifestyle Tools</span>
              <h1>Age Calculator</h1>
              <p>Find your exact age, fun facts about your birth date, and days until your next birthday.</p>
            </div>
          </div>

          {/* Input Card */}
          <div className="ac-card">
            <div className="ac-field">
              <label className="ac-label">Date of Birth</label>
              <input
                className="ac-input"
                type="date"
                value={dob}
                max={maxDate}
                onChange={e => setDob(e.target.value)}
              />
            </div>

            <div className="ac-divider" />

            <div className="ac-field">
              <div className="ac-label-row">
                <label className="ac-label">Calculate Age As Of</label>
                <button
                  className="ac-today-btn"
                  onClick={() => setToDate(today)}
                  disabled={toDate === today}
                >Today</button>
              </div>
              <input
                className="ac-input"
                type="date"
                value={toDate}
                max={maxDate}
                min={dob || undefined}
                onChange={e => setToDate(e.target.value)}
              />
            </div>

            <div className="ac-actions">
              <button className="ac-reset-btn" onClick={handleReset} disabled={!dob}>
                <RefreshCw size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="ac-card ac-result-card animate-in">

              {/* Hero age */}
              <div className="ac-hero">
                <div className="ac-hero-block">
                  <span className="ac-hero-num">{result.years}</span>
                  <span className="ac-hero-unit">years</span>
                </div>
                <div className="ac-hero-sep" />
                <div className="ac-hero-block">
                  <span className="ac-hero-num">{result.months}</span>
                  <span className="ac-hero-unit">months</span>
                </div>
                <div className="ac-hero-sep" />
                <div className="ac-hero-block">
                  <span className="ac-hero-num">{result.days}</span>
                  <span className="ac-hero-unit">days</span>
                </div>
              </div>

              {/* Next birthday banner */}
              <div className={`ac-bday-banner ${result.daysToNextBday === 0 ? "ac-bday-today" : ""}`}>
                {result.daysToNextBday === 0 ? (
                  <span>🎂 Happy Birthday! Your birthday is today!</span>
                ) : (
                  <span>
                    🎂 Your next birthday ({result.birthMonth} {result.birthDay}, {result.nextBdayYear}) is in{" "}
                    <strong>{result.daysToNextBday} {result.daysToNextBday === 1 ? "day" : "days"}</strong>
                  </span>
                )}
              </div>

              {/* Stats grid */}
              <div className="ac-stats-grid">
                <StatCard label="Total Days"    value={result.totalDays.toLocaleString()}    color="rose"   />
                <StatCard label="Total Weeks"   value={result.totalWeeks.toLocaleString()}   color="amber"  />
                <StatCard label="Total Months"  value={result.totalMonths.toLocaleString()}  color="violet" />
                <StatCard label="Total Hours"   value={result.totalHours.toLocaleString()}   color="sky"    />
              </div>

              {/* Fun facts */}
              <div className="ac-facts">
                <p className="ac-facts-title">Birth Details</p>
                <div className="ac-facts-grid">
                  <div className="ac-fact">
                    <span className="ac-fact-emoji">{result.zodiac?.emoji}</span>
                    <div>
                      <span className="ac-fact-label">Western Zodiac</span>
                      <span className="ac-fact-val">{result.zodiac?.sign}</span>
                    </div>
                  </div>
                  <div className="ac-fact">
                    <span className="ac-fact-emoji">{result.chinese?.emoji}</span>
                    <div>
                      <span className="ac-fact-label">Chinese Zodiac</span>
                      <span className="ac-fact-val">Year of the {result.chinese?.animal}</span>
                    </div>
                  </div>
                  <div className="ac-fact">
                    <span className="ac-fact-emoji">📅</span>
                    <div>
                      <span className="ac-fact-label">Day of Week Born</span>
                      <span className="ac-fact-val">{result.dayOfWeek}</span>
                    </div>
                  </div>
                  <div className="ac-fact">
                    <span className="ac-fact-emoji">{result.isLeap ? "✅" : "❌"}</span>
                    <div>
                      <span className="ac-fact-label">Leap Year</span>
                      <span className="ac-fact-val">{result.isLeap ? "Yes, leap year!" : "No"}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
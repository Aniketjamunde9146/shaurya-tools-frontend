/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./DietPlanGenerator.css";
import { Helmet } from "react-helmet";
import {
  Salad,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Languages,
  Target,
  Activity,
  User,
  Flame,
  Leaf,
  Beef,
  Fish,
  Heart,
  Zap,
  Clock,
  Apple,
  Coffee,
  Moon,
  Sun,
  AlignLeft,
} from "lucide-react";

/* ── Goal Types ── */
const GOALS = [
  { id: "weightloss",   label: "Weight Loss",     icon: Target,   desc: "Lose fat, stay lean"       },
  { id: "musclegain",   label: "Muscle Gain",      icon: Zap,      desc: "Build mass & strength"     },
  { id: "maintain",     label: "Maintain Weight",  icon: Activity, desc: "Stay at current weight"    },
  { id: "energy",       label: "Boost Energy",     icon: Flame,    desc: "Feel energized all day"    },
  { id: "cleaneating",  label: "Clean Eating",     icon: Leaf,     desc: "Whole foods, no junk"      },
  { id: "hearthealth",  label: "Heart Health",     icon: Heart,    desc: "Cardiovascular wellness"   },
  { id: "guthealth",    label: "Gut Health",       icon: Apple,    desc: "Digestion & microbiome"    },
  { id: "custom",       label: "Custom",           icon: AlignLeft,desc: "My own goals"              },
];

/* ── Diet Types ── */
const DIET_TYPES = [
  { id: "balanced",    label: "Balanced"      },
  { id: "keto",        label: "Keto"          },
  { id: "vegetarian",  label: "Vegetarian"    },
  { id: "vegan",       label: "Vegan"         },
  { id: "paleo",       label: "Paleo"         },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "intermittent", label: "Intermittent Fasting" },
  { id: "highprotein", label: "High Protein"  },
];

/* ── Activity Levels ── */
const ACTIVITY_LEVELS = [
  { id: "sedentary",  label: "Sedentary",   desc: "Little to no exercise"   },
  { id: "light",      label: "Light",       desc: "1–3 days/week"           },
  { id: "moderate",   label: "Moderate",    desc: "3–5 days/week"           },
  { id: "active",     label: "Very Active", desc: "6–7 days/week"           },
];

/* ── Meals Per Day ── */
const MEAL_COUNTS = [
  { id: "2", label: "2 meals" },
  { id: "3", label: "3 meals" },
  { id: "4", label: "4 meals" },
  { id: "5", label: "5 meals" },
];

/* ── Plan Duration ── */
const DURATIONS = [
  { id: "1day",  label: "1 Day",   desc: "Single day plan"  },
  { id: "3days", label: "3 Days",  desc: "Short program"    },
  { id: "7days", label: "1 Week",  desc: "Full week plan"   },
];

/* ── Languages ── */
const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Hindi", "Arabic", "Chinese (Simplified)",
  "Japanese", "Korean",
];

/* ── Meal Icon Map ── */
const MEAL_ICONS = {
  breakfast: <Sun    size={14} strokeWidth={2} />,
  lunch:     <Salad  size={14} strokeWidth={2} />,
  dinner:    <Moon   size={14} strokeWidth={2} />,
  snack:     <Apple  size={14} strokeWidth={2} />,
  snack1:    <Coffee size={14} strokeWidth={2} />,
  snack2:    <Apple  size={14} strokeWidth={2} />,
  default:   <Flame  size={14} strokeWidth={2} />,
};

/* ── Component ── */
export default function DietPlanGenerator() {
  const [goal,          setGoal]          = useState("weightloss");
  const [dietType,      setDietType]      = useState("balanced");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [mealsPerDay,   setMealsPerDay]   = useState("3");
  const [duration,      setDuration]      = useState("1day");
  const [preferences,   setPreferences]   = useState("");
  const [name,          setName]          = useState("");
  const [age,           setAge]           = useState("");
  const [language,      setLanguage]      = useState("English");
  const [includeCalories, setIncludeCalories] = useState(true);
  const [includeTips,     setIncludeTips]     = useState(true);
  const [includeGrocery,  setIncludeGrocery]  = useState(true);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [result,        setResult]        = useState(null);
  const [copied,        setCopied]        = useState("");
  const [activeTab,     setActiveTab]     = useState("preview");

  const charMax   = 500;
  const canSubmit = !loading;

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);

    const selectedGoal     = GOALS.find(g => g.id === goal);
    const selectedActivity = ACTIVITY_LEVELS.find(a => a.id === activityLevel);
    const selectedDuration = DURATIONS.find(d => d.id === duration);

    const prompt = `You are an expert nutritionist and diet coach. Create a personalized, detailed diet plan.

Goal: ${selectedGoal?.label} — ${selectedGoal?.desc}
Diet Type: ${dietType}
Activity Level: ${selectedActivity?.label} — ${selectedActivity?.desc}
Meals Per Day: ${mealsPerDay}
Plan Duration: ${selectedDuration?.label} — ${selectedDuration?.desc}
${name.trim() ? `Person's Name: ${name.trim()}` : ""}
${age.trim() ? `Age: ${age.trim()}` : ""}
${preferences.trim() ? `Preferences / Allergies / Restrictions: ${preferences.trim()}` : ""}
Include Calories: ${includeCalories ? "Yes" : "No"}
Include Tips: ${includeTips ? "Yes" : "No"}
Include Grocery List: ${includeGrocery ? "Yes" : "No"}
Language: ${language}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro text, no explanation, no markdown.
Exact required shape:
{
  "title": "...",
  "summary": "...",
  "days": [
    {
      "day": "Day 1",
      "meals": [
        {
          "type": "breakfast",
          "name": "...",
          "items": ["...", "..."],
          "calories": "...",
          "macros": { "protein": "...", "carbs": "...", "fat": "..." },
          "note": "..."
        }
      ],
      "dailyCalories": "..."
    }
  ],
  "groceryList": ["...", "..."],
  "tips": ["...", "..."],
  "affirmation": "..."
}

RULES:
• "title" — short personalized plan title (e.g. "Alex's 7-Day Weight Loss Plan").
• "summary" — 1–2 sentences describing the plan approach (in ${language}).
• "days" — array of days matching the duration. Each day has:
  - "day": label like "Day 1", "Monday", etc.
  - "meals": array of ${mealsPerDay} meals. Each meal:
    - "type": one of: breakfast | lunch | dinner | snack | snack1 | snack2
    - "name": meal name (in ${language})
    - "items": 2–5 food items in the meal (in ${language})
    - "calories": estimated calories if includeCalories is Yes, else ""
    - "macros": { "protein": "..g", "carbs": "..g", "fat": "..g" } if includeCalories is Yes, else all ""
    - "note": short helpful note about this meal (in ${language}), or ""
  - "dailyCalories": total estimated daily calories if includeCalories is Yes, else ""
• "groceryList" — array of 8–15 grocery items if includeGrocery is Yes, else []
• "tips" — array of 3–5 nutrition/health tips if includeTips is Yes, else []
• "affirmation" — one short motivational sentence for the journey (in ${language})
• Match the diet type strictly: ${dietType}. Match the goal: ${selectedGoal?.desc}.
• Write all meal names, items, notes, summary and affirmation in ${language}.
• Do NOT include markdown, code fences, or any text outside the JSON object.`;

    try {
      const res = await generateAI("diet-gen", prompt);
      if (!res.data.success) throw new Error("AI generation failed");

      let raw = res.data.data.trim();
      raw = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/, "")
        .trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.days || !Array.isArray(parsed.days)) throw new Error("Invalid response format");

      setResult(parsed);
      setActiveTab("preview");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function buildRawText() {
    if (!result) return "";
    let text = `${result.title}\n${"─".repeat(44)}\n${result.summary}\n\n`;
    result.days.forEach(day => {
      text += `【 ${day.day} 】\n`;
      day.meals.forEach(meal => {
        text += `  ${meal.type.toUpperCase()}: ${meal.name}`;
        if (meal.calories) text += ` (${meal.calories})`;
        text += `\n`;
        meal.items.forEach(item => { text += `    • ${item}\n`; });
        if (meal.macros?.protein) text += `    Protein: ${meal.macros.protein} | Carbs: ${meal.macros.carbs} | Fat: ${meal.macros.fat}\n`;
        if (meal.note) text += `    ↳ ${meal.note}\n`;
      });
      if (day.dailyCalories) text += `  Total: ${day.dailyCalories}\n`;
      text += "\n";
    });
    if (result.groceryList?.length) {
      text += `GROCERY LIST\n${"─".repeat(20)}\n`;
      result.groceryList.forEach(item => { text += `• ${item}\n`; });
      text += "\n";
    }
    if (result.tips?.length) {
      text += `TIPS\n${"─".repeat(20)}\n`;
      result.tips.forEach(tip => { text += `• ${tip}\n`; });
      text += "\n";
    }
    if (result.affirmation) text += `"${result.affirmation}"`;
    return text;
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildRawText());
    setCopied("all");
    setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    const blob = new Blob([buildRawText()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "diet-plan.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setPreferences(""); setName(""); setAge("");
    setResult(null); setError(""); setCopied("");
    setGoal("weightloss"); setDietType("balanced");
    setActivityLevel("moderate"); setMealsPerDay("3");
    setDuration("1day"); setLanguage("English");
    setIncludeCalories(true); setIncludeTips(true); setIncludeGrocery(true);
  }

  const selectedGoalData = GOALS.find(g => g.id === goal);
  const GoalIcon = selectedGoalData?.icon;
  const totalMeals = result ? result.days.reduce((a, d) => a + d.meals.length, 0) : 0;

  return (
    <>
      <Helmet>
        <title>Free AI Diet Plan Generator – Personalized Meal Plans Instantly | ShauryaTools</title>
        <meta name="description" content="Generate a personalized diet plan instantly with AI. Choose your goal, diet type, activity level and get a full meal plan with grocery list and tips. Free AI diet planner." />
        <meta name="keywords" content="diet plan generator, ai meal planner, free diet plan, weight loss meal plan, keto meal plan, vegan diet plan, ai nutrition planner" />
        <link rel="canonical" href="https://shauryatools.vercel.app/diet-plan-generator" />
      </Helmet>

      <div className="eg-page">
        <div className="eg-inner">

          {/* ── Header ── */}
          <div className="eg-header">
            <div className="eg-icon dt-icon">
              <Salad size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="eg-cat dt-cat">AI Productivity Tools</span>
              <h1>Diet Plan Generator</h1>
              <p>Share your goals and preferences — get a personalized meal plan with grocery list instantly.</p>
            </div>
          </div>

          {/* ── Input Card ── */}
          <div className="eg-card">

            {/* Goal */}
            <div className="eg-field">
              <div className="eg-label-row">
                <label className="eg-label">Your Goal</label>
                {selectedGoalData && (
                  <span className="eg-selected-badge dt-selected-badge">
                    {GoalIcon && <GoalIcon size={11} strokeWidth={2.5} />}
                    {selectedGoalData.label}
                  </span>
                )}
              </div>
              <div className="eg-types">
                {GOALS.map(g => {
                  const Icon = g.icon;
                  const isOn = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      className={`eg-type-btn ${isOn ? "dt-type-on" : ""}`}
                      onClick={() => setGoal(g.id)}
                    >
                      <Icon size={15} strokeWidth={2} className={`eg-type-icon ${isOn ? "dt-icon-on" : ""}`} />
                      <span className={`eg-type-label ${isOn ? "dt-label-on" : ""}`}>{g.label}</span>
                      <span className={`eg-type-desc  ${isOn ? "dt-desc-on"  : ""}`}>{g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eg-divider" />

            {/* Diet Type */}
            <div className="eg-field">
              <label className="eg-label">
                <Leaf size={14} strokeWidth={2.5} className="eg-label-icon dt-label-icon" />
                Diet Type
              </label>
              <div className="eg-tones">
                {DIET_TYPES.map(d => (
                  <button
                    key={d.id}
                    className={`eg-tone-btn ${dietType === d.id ? "dt-diet-on" : ""}`}
                    onClick={() => setDietType(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="eg-divider" />

            {/* Activity Level */}
            <div className="eg-field">
              <label className="eg-label">
                <Activity size={14} strokeWidth={2.5} className="eg-label-icon dt-label-icon" />
                Activity Level
              </label>
              <div className="dt-activity-row">
                {ACTIVITY_LEVELS.map(a => {
                  const isOn = activityLevel === a.id;
                  return (
                    <button
                      key={a.id}
                      className={`dt-activity-btn ${isOn ? "dt-activity-on" : ""}`}
                      onClick={() => setActivityLevel(a.id)}
                    >
                      <span className={`dt-act-label ${isOn ? "dt-act-label-on" : ""}`}>{a.label}</span>
                      <span className={`dt-act-desc  ${isOn ? "dt-act-desc-on"  : ""}`}>{a.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eg-divider" />

            {/* Meals per day + Duration */}
            <div className="eg-row">
              <div className="eg-field eg-field-half">
                <label className="eg-label">
                  <Clock size={14} strokeWidth={2.5} className="eg-label-icon dt-label-icon" />
                  Meals Per Day
                </label>
                <div className="dt-meals-row">
                  {MEAL_COUNTS.map(m => (
                    <button
                      key={m.id}
                      className={`dt-meal-count-btn ${mealsPerDay === m.id ? "dt-meal-on" : ""}`}
                      onClick={() => setMealsPerDay(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="eg-field eg-field-half">
                <label className="eg-label">Plan Duration</label>
                <div className="eg-lengths">
                  {DURATIONS.map(d => {
                    const isOn = duration === d.id;
                    return (
                      <button
                        key={d.id}
                        className={`eg-length-btn ${isOn ? "dt-dur-on" : ""}`}
                        onClick={() => setDuration(d.id)}
                      >
                        <span className={`eg-len-label ${isOn ? "dt-dur-label" : ""}`}>{d.label}</span>
                        <span className={`eg-len-desc  ${isOn ? "dt-dur-desc"  : ""}`}>{d.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="eg-divider" />

            {/* Name + Age + Language */}
            <div className="dt-three-row">
              <div className="eg-field">
                <label className="eg-label">
                  <User size={14} strokeWidth={2.5} className="eg-label-icon dt-label-icon" />
                  Your Name <span className="dt-optional">(optional)</span>
                </label>
                <input
                  className="eg-input dt-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex"
                />
              </div>
              <div className="eg-field">
                <label className="eg-label">
                  Age <span className="dt-optional">(optional)</span>
                </label>
                <input
                  className="eg-input dt-input"
                  type="number"
                  min="10"
                  max="100"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 28"
                />
              </div>
              <div className="eg-field">
                <label className="eg-label">
                  <Languages size={14} strokeWidth={2.5} className="eg-label-icon dt-label-icon" />
                  Language
                </label>
                <div className="eg-select-wrap">
                  <select
                    className="eg-select dt-select"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="eg-select-arrow" />
                </div>
              </div>
            </div>

            <div className="eg-divider" />

            {/* Preferences / Allergies */}
            <div className="eg-field">
              <div className="eg-label-row">
                <label className="eg-label">
                  <AlignLeft size={14} strokeWidth={2.5} className="eg-label-icon dt-label-icon" />
                  Preferences, Allergies & Restrictions
                </label>
                <span className={`eg-char-count ${preferences.length > charMax * 0.9 ? "eg-char-warn" : ""}`}>
                  {preferences.length}/{charMax}
                </span>
              </div>
              <textarea
                className="eg-textarea dt-textarea"
                value={preferences}
                onChange={e => {
                  if (e.target.value.length <= charMax) {
                    setPreferences(e.target.value);
                    setError("");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && canSubmit) handleGenerate(); }}
                placeholder="e.g. Allergic to nuts, hate broccoli, love spicy food, no dairy, prefer Indian cuisine..."
                rows={3}
              />
            </div>

            <div className="eg-divider" />

            {/* Toggle Options */}
            <div className="eg-field">
              <label className="eg-label">Include in Plan</label>
              <div className="dt-toggles-row">
                {[
                  { state: includeCalories, setter: setIncludeCalories, icon: <Flame size={13} strokeWidth={2}/>, label: "Calories & Macros" },
                  { state: includeGrocery,  setter: setIncludeGrocery,  icon: <Apple size={13} strokeWidth={2}/>, label: "Grocery List"      },
                  { state: includeTips,     setter: setIncludeTips,     icon: <Zap   size={13} strokeWidth={2}/>, label: "Nutrition Tips"    },
                ].map(({ state, setter, icon, label }) => (
                  <button
                    key={label}
                    className={`dt-toggle-chip ${state ? "dt-chip-on" : ""}`}
                    onClick={() => setter(v => !v)}
                  >
                    <span className="dt-chip-icon">{icon}</span>
                    {label}
                    {state && <Check size={12} strokeWidth={2.5} className="dt-chip-check" />}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="eg-error-msg">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button className="eg-gen-btn dt-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading
                ? <><span className="eg-spinner" /> Building Your Diet Plan...</>
                : <><Sparkles size={16} strokeWidth={2} /> Generate Diet Plan</>}
            </button>

            <p className="eg-hint">Press Ctrl+Enter to generate</p>
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="eg-card eg-skeleton-card animate-in">
              <div className="eg-skel eg-skel-short" />
              <div className="eg-skel" />
              <div className="dt-skel-blocks">
                {[1, 2, 3].map(i => (
                  <div key={i} className="dt-skel-block">
                    <div className="eg-skel" style={{ width: "30%" }} />
                    <div className="eg-skel" />
                    <div className="eg-skel eg-skel-med" />
                    <div className="eg-skel" />
                    <div className="eg-skel eg-skel-short" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <div className="eg-card animate-in">

              {/* Top bar */}
              <div className="eg-result-top">
                <div className="eg-result-meta">
                  {GoalIcon && (
                    <span className="eg-result-badge dt-result-badge">
                      <GoalIcon size={11} strokeWidth={2.5} />
                      {selectedGoalData?.label}
                    </span>
                  )}
                  <span className="eg-result-badge dt-diet-badge">{dietType}</span>
                  <span className="eg-result-badge dt-meals-badge">
                    <Flame size={11} strokeWidth={2.5} />
                    {totalMeals} meals
                  </span>
                  {language !== "English" && (
                    <span className="eg-result-badge eg-badge-lang">{language}</span>
                  )}
                </div>

                <div className="eg-tabs">
                  <button className={`eg-tab ${activeTab === "preview" ? "eg-tab-on" : ""}`} onClick={() => setActiveTab("preview")}>Preview</button>
                  <button className={`eg-tab ${activeTab === "raw"     ? "eg-tab-on" : ""}`} onClick={() => setActiveTab("raw")}>Raw Text</button>
                </div>

                <div className="eg-actions">
                  <button className="eg-action-btn" onClick={handleReset}>
                    <RefreshCw size={13} strokeWidth={2.5} /> New
                  </button>
                  <button className="eg-action-btn" onClick={handleDownload}>
                    <Download size={13} strokeWidth={2.5} /> Save
                  </button>
                  <button className={`eg-copy-btn ${copied === "all" ? "eg-copied" : ""}`} onClick={handleCopy}>
                    {copied === "all"
                      ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
                      : <><Copy size={13} strokeWidth={2.5} /> Copy All</>}
                  </button>
                </div>
              </div>

              {/* Preview */}
              {activeTab === "preview" && (
                <div className="dt-plan-preview">

                  {/* Plan Header */}
                  <div className="dt-plan-header">
                    <div className="dt-plan-title">{result.title}</div>
                    {result.summary && <p className="dt-plan-summary">{result.summary}</p>}
                  </div>

                  {/* Days */}
                  {result.days.map((day, di) => (
                    <div key={di} className="dt-day-block">
                      <div className="dt-day-header">
                        <span className="dt-day-label">{day.day}</span>
                        {day.dailyCalories && (
                          <span className="dt-day-cals">
                            <Flame size={11} strokeWidth={2.5} />
                            {day.dailyCalories}
                          </span>
                        )}
                      </div>

                      <div className="dt-meals">
                        {day.meals.map((meal, mi) => (
                          <div key={mi} className="dt-meal">
                            <div className="dt-meal-top">
                              <div className="dt-meal-label-row">
                                <span className="dt-meal-icon">
                                  {MEAL_ICONS[meal.type] || MEAL_ICONS.default}
                                </span>
                                <span className="dt-meal-type">{meal.type.toUpperCase()}</span>
                                {meal.calories && (
                                  <span className="dt-meal-cals">{meal.calories}</span>
                                )}
                              </div>
                              <span className="dt-meal-name">{meal.name}</span>
                            </div>

                            <ul className="dt-meal-items">
                              {meal.items.map((item, ii) => (
                                <li key={ii} className="dt-meal-item">{item}</li>
                              ))}
                            </ul>

                            {meal.macros?.protein && (
                              <div className="dt-macros">
                                <span className="dt-macro dt-macro-p">P: {meal.macros.protein}</span>
                                <span className="dt-macro dt-macro-c">C: {meal.macros.carbs}</span>
                                <span className="dt-macro dt-macro-f">F: {meal.macros.fat}</span>
                              </div>
                            )}

                            {meal.note && (
                              <p className="dt-meal-note">{meal.note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Grocery List */}
                  {includeGrocery && result.groceryList?.length > 0 && (
                    <div className="dt-extra-block dt-grocery-block">
                      <div className="dt-extra-header">
                        <Apple size={14} strokeWidth={2} className="dt-extra-icon" />
                        Grocery List
                      </div>
                      <div className="dt-grocery-grid">
                        {result.groceryList.map((item, i) => (
                          <span key={i} className="dt-grocery-item">
                            <Check size={10} strokeWidth={3} className="dt-grocery-check" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {includeTips && result.tips?.length > 0 && (
                    <div className="dt-extra-block dt-tips-block">
                      <div className="dt-extra-header">
                        <Zap size={14} strokeWidth={2} className="dt-extra-icon dt-tips-icon" />
                        Nutrition Tips
                      </div>
                      <ul className="dt-tips-list">
                        {result.tips.map((tip, i) => (
                          <li key={i} className="dt-tip-item">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Affirmation */}
                  {result.affirmation && (
                    <div className="dt-affirmation">
                      <Sparkles size={13} strokeWidth={2.5} className="dt-aff-icon" />
                      <span className="dt-aff-text">"{result.affirmation}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Raw */}
              {activeTab === "raw" && (
                <pre className="eg-raw">{buildRawText()}</pre>
              )}

              {/* Footer */}
              <div className="eg-result-footer">
                <span className="eg-footer-count">
                  {result.days.length} day{result.days.length > 1 ? "s" : ""} · {totalMeals} meals
                  {result.groceryList?.length ? ` · ${result.groceryList.length} groceries` : ""}
                </span>
                <button
                  className={`eg-copy-full dt-copy-full ${copied === "all" ? "eg-copied dt-copy-full-copied" : ""}`}
                  onClick={handleCopy}
                >
                  {copied === "all"
                    ? <><Check size={14} strokeWidth={2.5} /> Copied!</>
                    : <><Copy size={14} strokeWidth={2.5} /> Copy Full Plan</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
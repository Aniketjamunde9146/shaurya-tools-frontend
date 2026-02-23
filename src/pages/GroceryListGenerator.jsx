/* eslint-disable no-empty */
import { useState } from "react";
import { generateAI } from "../api";
import "./GroceryListGenerator.css";
import { Helmet } from "react-helmet";
import {
  ShoppingCart, Sparkles, Copy, Check, Download, RefreshCw,
  AlertCircle, ChevronDown, Users, Wallet, Leaf, Apple, Beef,
  Fish, Egg, Milk, Wheat, Salad, Cookie, FlameKindling, Clock,
  Tag, PackageCheck, Utensils, X,
} from "lucide-react";

const DIETS = [
  { id: "none",        label: "No Preference", icon: Utensils      },
  { id: "vegetarian",  label: "Vegetarian",    icon: Leaf          },
  { id: "vegan",       label: "Vegan",         icon: Apple         },
  { id: "keto",        label: "Keto",          icon: Beef          },
  { id: "paleo",       label: "Paleo",         icon: FlameKindling },
  { id: "pescatarian", label: "Pescatarian",   icon: Fish          },
  { id: "glutenfree",  label: "Gluten-Free",   icon: Wheat         },
  { id: "dairyfree",   label: "Dairy-Free",    icon: Milk          },
  { id: "lowcarb",     label: "Low-Carb",      icon: Salad         },
  { id: "highprotein", label: "High-Protein",  icon: Egg           },
];

const BUDGETS = [
  { id: "economy",     label: "Economy",     desc: "Under ₹500 / $15"   },
  { id: "moderate",    label: "Moderate",    desc: "₹500–₹1500 / $30"   },
  { id: "comfortable", label: "Comfortable", desc: "₹1500–₹3000 / $60"  },
  { id: "premium",     label: "Premium",     desc: "No limit"            },
];

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch",     label: "Lunch"     },
  { id: "dinner",    label: "Dinner"    },
  { id: "snacks",    label: "Snacks"    },
  { id: "drinks",    label: "Drinks"    },
];

const DURATIONS = [
  { id: "1",  label: "1 Day"   },
  { id: "3",  label: "3 Days"  },
  { id: "7",  label: "1 Week"  },
  { id: "14", label: "2 Weeks" },
];

const STORES = [
  { id: "any",         label: "Any Store"       },
  { id: "supermarket", label: "Supermarket"     },
  { id: "organic",     label: "Organic / Health"},
  { id: "local",       label: "Local Market"    },
  { id: "online",      label: "Online Delivery" },
];

const CAT_EMOJI = {
  "fruits": "🥦", "vegetable": "🥦", "dairy": "🥛", "egg": "🥛",
  "meat": "🥩", "seafood": "🐟", "grain": "🍞", "bakery": "🍞",
  "pantry": "🫙", "dry": "🫙", "frozen": "🧊", "beverage": "🧃",
  "drink": "🧃", "snack": "🍿", "condiment": "🧂", "spice": "🧂",
  "household": "🧻", "personal": "🧴",
};

function getCatEmoji(cat) {
  if (!cat) return "🛒";
  const lower = cat.toLowerCase();
  const match = Object.keys(CAT_EMOJI).find(k => lower.includes(k));
  return match ? CAT_EMOJI[match] : "🛒";
}

export default function GroceryListGenerator() {
  const [people,       setPeople]       = useState("2");
  const [diet,         setDiet]         = useState("none");
  const [budget,       setBudget]       = useState("moderate");
  const [duration,     setDuration]     = useState("7");
  const [mealTypes,    setMealTypes]    = useState(["breakfast","lunch","dinner"]);
  const [store,        setStore]        = useState("any");
  const [allergies,    setAllergies]    = useState("");
  const [preferences,  setPreferences]  = useState("");
  const [currency,     setCurrency]     = useState("INR");
  const [mealInput,    setMealInput]    = useState("");
  const [mealTags,     setMealTags]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [result,       setResult]       = useState(null);
  const [copied,       setCopied]       = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const [activeTab,    setActiveTab]    = useState("list");

  const canSubmit = !loading;

  function toggleMealType(id) {
    setMealTypes(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  function addMealTag(e) {
    if ((e.key === "Enter" || e.key === ",") && mealInput.trim()) {
      e.preventDefault();
      const tag = mealInput.trim().replace(/,$/, "");
      if (tag && !mealTags.includes(tag)) setMealTags(prev => [...prev, tag]);
      setMealInput("");
    }
  }

  function removeMealTag(tag) { setMealTags(prev => prev.filter(t => t !== tag)); }

  async function handleGenerate() {
    if (!canSubmit) return;
    setLoading(true); setError(""); setResult(null); setCheckedItems({});

    const selectedDiet   = DIETS.find(d => d.id === diet);
    const selectedBudget = BUDGETS.find(b => b.id === budget);
    const selectedMealTs = MEAL_TYPES.filter(m => mealTypes.includes(m.id)).map(m => m.label);

    const prompt = `You are an expert nutritionist, meal planner, and smart grocery assistant. Generate a complete, well-organized smart grocery list.

PARAMETERS:
- People: ${people}
- Duration: ${duration} day(s)
- Diet: ${selectedDiet?.label}
- Budget: ${selectedBudget?.label} (${selectedBudget?.desc})
- Currency: ${currency}
- Meals: ${selectedMealTs.join(", ")}
- Store: ${STORES.find(s => s.id === store)?.label}
${allergies.trim()   ? `- Allergies / Avoid: ${allergies.trim()}`                              : ""}
${preferences.trim() ? `- Preferences: ${preferences.trim()}`                                   : ""}
${mealTags.length    ? `- Specific dishes: ${mealTags.join(", ")}`                              : ""}

YOUR ENTIRE RESPONSE must be a single raw JSON object. No intro, no markdown, no code fences.

Shape:
{
  "summary": "<2 sentences about this plan>",
  "estimatedCost": "<range in ${currency}>",
  "totalItems": <number>,
  "categories": [
    {
      "name": "<aisle name>",
      "items": [
        { "name": "<item>", "quantity": "<qty>", "note": "<short tip or empty string>", "estimatedPrice": "<price in ${currency}>" }
      ]
    }
  ],
  "mealIdeas": [
    { "meal": "<name>", "type": "<Breakfast|Lunch|Dinner|Snack>", "ingredients": ["<item1>","<item2>"] }
  ],
  "shoppingTips": ["<tip1>","<tip2>","<tip3>"],
  "nutritionHighlights": ["<h1>","<h2>","<h3>"]
}

RULES:
• Category names must be real aisles: "Fruits & Vegetables", "Dairy & Eggs", "Meat & Seafood", "Grains & Bakery", "Pantry & Dry Goods", "Frozen Foods", "Beverages", "Condiments & Spices". Only include relevant ones.
• Items must be specific (not "vegetables" — say "Broccoli 300g").
• Scale quantities for ${people} people × ${duration} days.
• Prices realistic for ${currency}.
• 4–6 mealIdeas using the listed groceries.
• Strictly respect diet: ${selectedDiet?.label}.
${allergies.trim() ? `• Strictly exclude: ${allergies.trim()}` : ""}`;

    try {
      const res = await generateAI("grocery-gen", prompt);
      if (!res.data.success) throw new Error("failed");

      let raw = res.data.data.trim()
        .replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("bad format");

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.categories) throw new Error("bad format");

      setResult(parsed); setActiveTab("list");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCheck(catIdx, itemIdx) {
    const key = `${catIdx}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleCopy() {
    if (!result) return;
    let text = `🛒 SMART GROCERY LIST\n${"─".repeat(36)}\n${result.summary}\nEstimated: ${result.estimatedCost}\n\n`;
    result.categories.forEach(cat => {
      text += `${cat.name.toUpperCase()}\n`;
      cat.items.forEach(item => { text += `  • ${item.name} — ${item.quantity}${item.estimatedPrice ? ` (${item.estimatedPrice})` : ""}\n`; });
      text += "\n";
    });
    text += `TIPS\n${result.shoppingTips.map(t => `• ${t}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied("list"); setTimeout(() => setCopied(""), 2500);
  }

  function handleDownload() {
    if (!result) return;
    let text = `SMART GROCERY LIST\n${"═".repeat(36)}\n${result.summary}\nEstimated: ${result.estimatedCost} | Items: ${result.totalItems}\n\n`;
    result.categories.forEach(cat => {
      text += `${cat.name}\n${"─".repeat(28)}\n`;
      cat.items.forEach(item => {
        text += `☐  ${item.name} — ${item.quantity}`;
        if (item.estimatedPrice) text += ` (${item.estimatedPrice})`;
        if (item.note) text += ` [${item.note}]`;
        text += "\n";
      });
      text += "\n";
    });
    text += `MEAL IDEAS\n${result.mealIdeas.map(m => `• ${m.meal} (${m.type})`).join("\n")}\n\nSHOPPING TIPS\n${result.shoppingTips.map(t => `• ${t}`).join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "grocery-list.txt"; a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleReset() {
    setMealTags([]); setMealInput(""); setPeople("2"); setDiet("none");
    setBudget("moderate"); setDuration("7"); setMealTypes(["breakfast","lunch","dinner"]);
    setStore("any"); setAllergies(""); setPreferences(""); setCurrency("INR");
    setResult(null); setError(""); setCopied(""); setCheckedItems({});
  }

  const checkedCount   = Object.values(checkedItems).filter(Boolean).length;
  const totalItemCount = result?.categories?.reduce((s, c) => s + c.items.length, 0) || 0;

  const TABS = [
    { key: "list",  label: "🛒 Grocery List"  },
    { key: "meals", label: "🍽 Meal Ideas"     },
    { key: "tips",  label: "💡 Tips & Nutrition"},
  ];

  return (
    <>
      <Helmet>
        <title>Smart Grocery List Generator – AI Meal Planning | ShauryaTools</title>
        <meta name="description" content="Generate a smart, organized grocery list with AI. Plan meals by diet, budget, people count and duration. Free grocery planner tool." />
        <meta name="keywords" content="grocery list generator, ai grocery planner, smart shopping list, meal planning, diet grocery list, weekly grocery list" />
        <link rel="canonical" href="https://shauryatools.vercel.app/grocery-list-generator" />
      </Helmet>

      <div className="gl-page">
        <div className="gl-blob gl-blob-1" />
        <div className="gl-blob gl-blob-2" />

        <div className="gl-inner">

          {/* Header */}
          <div className="gl-header">
            <div className="gl-icon"><ShoppingCart size={22} strokeWidth={2} /></div>
            <div>
              <span className="gl-cat">AI Kitchen Tools</span>
              <h1>Smart Grocery List</h1>
              <p>Tell us your meals, diet & budget — get a perfectly organized shopping list in seconds.</p>
            </div>
          </div>

          {/* Input Card */}
          <div className="gl-card">

            {/* Diet */}
            <div className="gl-field">
              <label className="gl-label">Dietary Preference</label>
              <div className="gl-diets">
                {DIETS.map(d => {
                  const Icon = d.icon;
                  return (
                    <button key={d.id} className={`gl-diet-btn ${diet === d.id ? "gl-diet-on" : ""}`} onClick={() => setDiet(d.id)}>
                      <Icon size={13} strokeWidth={2} className="gl-diet-icon" />
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="gl-divider" />

            {/* Meal tag input */}
            <div className="gl-field">
              <label className="gl-label">
                <Utensils size={13} className="gl-label-icon" /> Specific Meals / Dishes
                <span className="gl-optional">optional</span>
              </label>
              <div className="gl-tag-wrap">
                {mealTags.map(tag => (
                  <span key={tag} className="gl-meal-tag">
                    {tag}
                    <button className="gl-tag-x" onClick={() => removeMealTag(tag)}><X size={10} strokeWidth={3} /></button>
                  </span>
                ))}
                <input
                  className="gl-tag-input"
                  value={mealInput}
                  onChange={e => setMealInput(e.target.value)}
                  onKeyDown={addMealTag}
                  placeholder={mealTags.length === 0 ? "Type a dish & press Enter — e.g. Pasta, Dal Tadka, Pancakes..." : "Add more..."}
                />
              </div>
              <p className="gl-tag-hint">Press Enter or comma after each dish</p>
            </div>

            <div className="gl-divider" />

            {/* People + Duration + Currency */}
            <div className="gl-row gl-row-3">
              <div className="gl-field">
                <label className="gl-label"><Users size={13} className="gl-label-icon" /> People</label>
                <div className="gl-select-wrap">
                  <select className="gl-select" value={people} onChange={e => setPeople(e.target.value)}>
                    {["1","2","3","4","5","6","8","10","12"].map(n => (
                      <option key={n} value={n}>{n} {n === "1" ? "person" : "people"}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="gl-select-arrow" />
                </div>
              </div>

              <div className="gl-field">
                <label className="gl-label"><Clock size={13} className="gl-label-icon" /> Duration</label>
                <div className="gl-durations">
                  {DURATIONS.map(d => (
                    <button key={d.id} className={`gl-dur-btn ${duration === d.id ? "gl-dur-on" : ""}`} onClick={() => setDuration(d.id)}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gl-field">
                <label className="gl-label"><Tag size={13} className="gl-label-icon" /> Currency</label>
                <div className="gl-select-wrap">
                  <select className="gl-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="INR">🇮🇳 INR (₹)</option>
                    <option value="USD">🇺🇸 USD ($)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                    <option value="GBP">🇬🇧 GBP (£)</option>
                    <option value="AED">🇦🇪 AED</option>
                    <option value="SGD">🇸🇬 SGD</option>
                  </select>
                  <ChevronDown size={14} className="gl-select-arrow" />
                </div>
              </div>
            </div>

            <div className="gl-divider" />

            {/* Meal types + Budget */}
            <div className="gl-row">
              <div className="gl-field">
                <label className="gl-label">Meals to Cover</label>
                <div className="gl-meal-types">
                  {MEAL_TYPES.map(m => (
                    <button key={m.id} className={`gl-mt-btn ${mealTypes.includes(m.id) ? "gl-mt-on" : ""}`} onClick={() => toggleMealType(m.id)}>
                      {mealTypes.includes(m.id) && <Check size={11} strokeWidth={3} />} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gl-field">
                <label className="gl-label"><Wallet size={13} className="gl-label-icon" /> Budget</label>
                <div className="gl-budgets">
                  {BUDGETS.map(b => (
                    <button key={b.id} className={`gl-budget-btn ${budget === b.id ? "gl-budget-on" : ""}`} onClick={() => setBudget(b.id)}>
                      <span className="gl-budget-label">{b.label}</span>
                      <span className="gl-budget-desc">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="gl-divider" />

            {/* Store */}
            <div className="gl-field">
              <label className="gl-label">Store Preference</label>
              <div className="gl-stores">
                {STORES.map(s => (
                  <button key={s.id} className={`gl-store-btn ${store === s.id ? "gl-store-on" : ""}`} onClick={() => setStore(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="gl-row">
              <div className="gl-field">
                <label className="gl-label">Allergies / Avoid</label>
                <input className="gl-input" type="text" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. peanuts, shellfish, soy" />
              </div>
              <div className="gl-field">
                <label className="gl-label">Extra Preferences</label>
                <input className="gl-input" type="text" value={preferences} onChange={e => setPreferences(e.target.value)} placeholder="e.g. prefer Indian cuisine, no processed food" />
              </div>
            </div>

            {error && <div className="gl-error"><AlertCircle size={14} strokeWidth={2.5} /> {error}</div>}

            <button className="gl-gen-btn" onClick={handleGenerate} disabled={!canSubmit}>
              {loading ? <><span className="gl-spinner" /> Building Your List...</> : <><Sparkles size={16} strokeWidth={2} /> Generate Grocery List</>}
            </button>
            <p className="gl-hint">Ctrl+Enter to generate</p>
          </div>

          {/* Skeleton */}
          {loading && (
            <div className="gl-card gl-skel-card animate-in">
              {[...Array(8)].map((_, i) => <div key={i} className={`gl-skel ${i % 3 === 0 ? "gl-skel-short" : i % 3 === 1 ? "gl-skel-med" : ""}`} />)}
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="gl-result-card animate-in">

              {/* Hero */}
              <div className="gl-result-hero">
                <div className="gl-hero-left">
                  <h2 className="gl-hero-title">Your Grocery List</h2>
                  <p className="gl-hero-summary">{result.summary}</p>
                  <div className="gl-hero-pills">
                    <span className="gl-pill gl-pill-green"><PackageCheck size={12} strokeWidth={2.5} /> {result.totalItems} items</span>
                    <span className="gl-pill gl-pill-amber"><Wallet size={12} strokeWidth={2.5} /> {result.estimatedCost}</span>
                    <span className="gl-pill gl-pill-terra"><Users size={12} strokeWidth={2.5} /> {people} {Number(people) === 1 ? "person" : "people"} · {duration} day{duration !== "1" ? "s" : ""}</span>
                  </div>
                </div>
                <div className="gl-hero-actions">
                  <button className="gl-action-btn" onClick={handleReset}><RefreshCw size={13} strokeWidth={2.5} /> New</button>
                  <button className="gl-action-btn" onClick={handleDownload}><Download size={13} strokeWidth={2.5} /> Save</button>
                  <button className={`gl-copy-btn ${copied === "list" ? "gl-copied" : ""}`} onClick={handleCopy}>
                    {copied === "list" ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy List</>}
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {checkedCount > 0 && (
                <div className="gl-progress-wrap">
                  <div className="gl-progress-track">
                    <div className="gl-progress-fill" style={{ width: `${(checkedCount / totalItemCount) * 100}%` }} />
                  </div>
                  <span className="gl-progress-label">{checkedCount} of {totalItemCount} items in cart</span>
                </div>
              )}

              {/* Tabs */}
              <div className="gl-tabs-bar">
                {TABS.map(tab => (
                  <button key={tab.key} className={`gl-tab ${activeTab === tab.key ? "gl-tab-on" : ""}`} onClick={() => setActiveTab(tab.key)}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB: List */}
              {activeTab === "list" && (
                <div className="gl-tab-body animate-in">
                  {result.categories.map((cat, catIdx) => (
                    <div key={catIdx} className="gl-category">
                      <div className="gl-cat-head">
                        <span className="gl-cat-emoji">{getCatEmoji(cat.name)}</span>
                        <span className="gl-cat-name">{cat.name}</span>
                        <span className="gl-cat-count">{cat.items.length}</span>
                      </div>
                      <div className="gl-items">
                        {cat.items.map((item, itemIdx) => {
                          const key = `${catIdx}-${itemIdx}`;
                          const checked = !!checkedItems[key];
                          return (
                            <div key={itemIdx} className={`gl-item ${checked ? "gl-item-checked" : ""}`} onClick={() => toggleCheck(catIdx, itemIdx)}>
                              <div className={`gl-checkbox ${checked ? "gl-checkbox-on" : ""}`}>
                                {checked && <Check size={10} strokeWidth={3.5} />}
                              </div>
                              <div className="gl-item-info">
                                <span className="gl-item-name">{item.name}</span>
                                <span className="gl-item-qty">{item.quantity}</span>
                                {item.note && <span className="gl-item-note">{item.note}</span>}
                              </div>
                              {item.estimatedPrice && <span className="gl-item-price">{item.estimatedPrice}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: Meals */}
              {activeTab === "meals" && (
                <div className="gl-tab-body animate-in">
                  <div className="gl-meals-grid">
                    {result.mealIdeas.map((meal, i) => (
                      <div key={i} className="gl-meal-card">
                        <div className={`gl-meal-type gl-mt-${meal.type?.toLowerCase()}`}>{meal.type}</div>
                        <h3 className="gl-meal-name">{meal.meal}</h3>
                        <div className="gl-meal-ings">
                          {meal.ingredients.map((ing, j) => <span key={j} className="gl-ing">{ing}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: Tips */}
              {activeTab === "tips" && (
                <div className="gl-tab-body animate-in">
                  <div className="gl-tips-block">
                    <div className="gl-block-head"><ShoppingCart size={15} strokeWidth={2.5} /> Shopping Tips</div>
                    <div className="gl-tips-list">
                      {result.shoppingTips.map((tip, i) => (
                        <div key={i} className="gl-tip-row">
                          <span className="gl-tip-num">{i + 1}</span>
                          <p>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="gl-nutri-block">
                    <div className="gl-block-head"><Leaf size={15} strokeWidth={2.5} /> Nutrition Highlights</div>
                    <div className="gl-nutri-list">
                      {result.nutritionHighlights.map((h, i) => (
                        <div key={i} className="gl-nutri-row">
                          <span className="gl-nutri-dot" />
                          <p>{h}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
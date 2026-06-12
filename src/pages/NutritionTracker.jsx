import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { ArrowLeft, Flame, Beef, Wheat, Droplets, Save, RefreshCw, ChevronDown } from "lucide-react";
import WeightProgressionWidget from "../components/WeightProgressionWidget";
import { useNavigate } from "react-router-dom";

// --- Macro Calculation Engine ---
function calcMacros({ weightLbs, dayType, recoveryScore }) {
  const weightKg = (weightLbs || 225) / 2.205;
  const isBJJ = dayType === "BJJ Training Day";
  const isStrength = dayType === "Strength Day";
  const isRest = dayType === "Rest Day";
  const isActive = dayType === "Active Recovery";

  // Base protein: 1g per lb bodyweight (BJJ days), 0.85g rest days
  const proteinG = Math.round(isBJJ || isStrength ? weightLbs * 1.0 : weightLbs * 0.85);

  // TDEE estimate (Mifflin-St Jeor + activity multiplier)
  const bmr = 10 * weightKg + 6.25 * 175 - 5 * 35 + 5; // assume 175cm, 35yo male
  const tdee = isBJJ ? bmr * 1.7 : isStrength ? bmr * 1.6 : isActive ? bmr * 1.4 : bmr * 1.2;

  // Low recovery = add 200kcal buffer to prevent metabolic crash
  const recoveryBonus = (recoveryScore && recoveryScore < 34) ? 200 : 0;
  const calories = Math.round(tdee + recoveryBonus);

  // Fat: 25-30% of calories
  const fatG = Math.round((calories * 0.27) / 9);

  // Carbs: remaining calories after protein + fat
  const carbCals = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.round(Math.max(50, carbCals / 4));

  // Hydration: bodyweight / 2 oz + 16 oz per hour of BJJ
  const hydrationOz = Math.round(weightLbs / 2 + (isBJJ ? 32 : 0));

  return { calories, proteinG, carbsG, fatG, hydrationOz };
}

function MacroBar({ label, actual, target, color, unit = "g", icon: Icon }) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  const over = actual > target;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
          <span className="text-white font-semibold">{label}</span>
        </div>
        <span className={`font-bold ${over ? "text-red-400" : "text-commander-muted"}`}>
          {actual}{unit} / {target}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${over ? "bg-red-500" : color.replace(/text-/g, "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const DAY_TYPES = ["BJJ Training Day", "Strength Day", "Active Recovery", "Rest Day"];

const DAY_TYPE_STYLES = {
  "BJJ Training Day": "border-vellera-blue bg-vellera-blue/10 text-vellera-blue",
  "Strength Day": "border-vellera-green bg-vellera-green/10 text-vellera-green",
  "Active Recovery": "border-yellow-500 bg-yellow-500/10 text-yellow-400",
  "Rest Day": "border-gray-600 bg-gray-800 text-gray-400",
};

const DAY_TYPE_TIPS = {
  "BJJ Training Day": "High-carb day. Load up 90 min before sparring with fast carbs. Post-training: protein shake within 30 min.",
  "Strength Day": "Moderate-high carbs around lift window. Prioritize protein for muscle protein synthesis.",
  "Active Recovery": "Low-moderate carbs. Focus on anti-inflammatory foods and micronutrients.",
  "Rest Day": "Lower calories and carbs. Prioritize protein to preserve lean mass.",
};

export default function NutritionTracker() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [dayType, setDayType] = useState("BJJ Training Day");
  const [actuals, setActuals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, hydration: 0 });
  const [weight, setWeight] = useState("");
  const [recovery, setRecovery] = useState("");
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [caloricAdjustment, setCaloricAdjustment] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const [profiles, plans, biometrics, sessions] = await Promise.all([
          base44.entities.UserProfile.list("-created_date", 1),
          base44.entities.NutritionPlan.filter({ date: today }),
          base44.entities.BiometricLog.filter({ date: today }),
          base44.entities.TrainingSession.list("-date", 7),
        ]);

        const prof = profiles[0];
        setProfile(prof);

        // Auto-detect day type from today's training session
        const todaySession = sessions.find(s => s.date === today);
        const autoType = todaySession
          ? todaySession.session_type?.toLowerCase().includes("bjj") || todaySession.session_type?.toLowerCase().includes("combat")
            ? "BJJ Training Day"
            : todaySession.session_type?.toLowerCase().includes("strength") || todaySession.session_type?.toLowerCase().includes("lift")
            ? "Strength Day"
            : "Active Recovery"
          : "Rest Day";

        const bio = biometrics[0];
        const recoveryVal = bio?.recovery_score || prof?.zulu_current_weight_lbs ? null : null;

        if (plans[0]) {
          const p = plans[0];
          setTodayPlan(p);
          setDayType(p.day_type);
          setActuals({ calories: p.actual_calories || 0, protein: p.actual_protein_g || 0, carbs: p.actual_carbs_g || 0, fat: p.actual_fat_g || 0, hydration: p.hydration_oz || 0 });
          setWeight(p.weight_lbs || "");
          setRecovery(p.recovery_score || "");
          setNotes(p.notes || "");
        } else {
          setDayType(autoType);
          if (bio?.recovery_score) setRecovery(bio.recovery_score);
        }

        const hist = await base44.entities.NutritionPlan.list("-date", 14);
        setHistory(hist.filter(h => h.date !== today));
      } catch (err) {
        console.error("NutritionTracker load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const weightLbs = parseFloat(weight) || profile?.zulu_current_weight_lbs || 225;
  const recoveryScore = parseFloat(recovery) || null;
  const baseTargets = calcMacros({ weightLbs, dayType, recoveryScore });
  const targets = {
    ...baseTargets,
    calories: Math.max(1500, baseTargets.calories + caloricAdjustment),
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      date: today,
      day_type: dayType,
      target_calories: targets.calories,
      target_protein_g: targets.proteinG,
      target_carbs_g: targets.carbsG,
      target_fat_g: targets.fatG,
      actual_calories: actuals.calories,
      actual_protein_g: actuals.protein,
      actual_carbs_g: actuals.carbs,
      actual_fat_g: actuals.fat,
      hydration_oz: actuals.hydration,
      weight_lbs: parseFloat(weight) || null,
      recovery_score: parseFloat(recovery) || null,
      notes,
    };

    if (todayPlan) {
      await base44.entities.NutritionPlan.update(todayPlan.id, data);
    } else {
      const created = await base44.entities.NutritionPlan.create(data);
      setTodayPlan(created);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-vellera-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white text-xl font-black">Nutrition Tracker</h1>
            <p className="text-commander-muted text-xs">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-vellera-green text-commander-dark font-black px-4 py-2 rounded-xl hover:bg-vellera-blue transition-all flex items-center gap-1.5 disabled:opacity-60">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      {/* Day Type Selector */}
      <div className="space-y-2">
        <p className="text-commander-muted text-xs uppercase tracking-widest font-bold">Today's Training Type</p>
        <div className="grid grid-cols-2 gap-2">
          {DAY_TYPES.map(t => (
            <button key={t} onClick={() => setDayType(t)}
              className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-all ${dayType === t ? DAY_TYPE_STYLES[t] : "border-commander-border text-commander-muted bg-commander-surface hover:border-gray-500"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className={`rounded-xl p-3 border text-xs ${DAY_TYPE_STYLES[dayType]}`}>
          💡 {DAY_TYPE_TIPS[dayType]}
        </div>
      </div>

      {/* Biometric Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-commander-muted text-xs font-bold uppercase">Morning Weight (lbs)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={`${weightLbs}`}
            className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-commander-muted text-xs font-bold uppercase">Recovery Score</label>
          <input type="number" min="0" max="100" value={recovery} onChange={e => setRecovery(e.target.value)} placeholder="0–100"
            className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm" />
        </div>
      </div>

      {/* Macro Targets */}
      <div className="bg-gradient-to-br from-vellera-blue/10 to-vellera-green/10 border border-vellera-blue/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-white font-black">Daily Targets</p>
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${DAY_TYPE_STYLES[dayType]}`}>{dayType}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Calories", val: targets.calories, unit: "kcal", color: "text-orange-400" },
            { label: "Protein", val: targets.proteinG, unit: "g", color: "text-red-400" },
            { label: "Carbs", val: targets.carbsG, unit: "g", color: "text-yellow-400" },
            { label: "Fat", val: targets.fatG, unit: "g", color: "text-blue-400" },
          ].map(({ label, val, unit, color }) => (
            <div key={label} className="bg-black/30 rounded-lg py-2">
              <p className={`font-black text-sm ${color}`}>{val}</p>
              <p className="text-commander-muted text-xs">{unit}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-commander-muted text-xs text-center">💧 Hydration target: <span className="text-vellera-blue font-bold">{targets.hydrationOz} oz</span></p>
      </div>

      {/* Log Actuals */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
        <p className="text-white font-black">Log Today's Intake</p>
        <div className="space-y-3">
          <MacroBar label="Calories" actual={actuals.calories} target={targets.calories} color="text-orange-400" icon={Flame} unit=" kcal" />
          <MacroBar label="Protein" actual={actuals.protein} target={targets.proteinG} color="text-red-400" icon={Beef} />
          <MacroBar label="Carbs" actual={actuals.carbs} target={targets.carbsG} color="text-yellow-400" icon={Wheat} />
          <MacroBar label="Fat" actual={actuals.fat} target={targets.fatG} color="text-blue-400" />
          <MacroBar label="Hydration" actual={actuals.hydration} target={targets.hydrationOz} color="text-vellera-blue" icon={Droplets} unit=" oz" />
        </div>

        {/* Number inputs for actuals */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-commander-border">
          {[
            { key: "calories", label: "Calories", placeholder: "0 kcal" },
            { key: "protein", label: "Protein (g)", placeholder: "0g" },
            { key: "carbs", label: "Carbs (g)", placeholder: "0g" },
            { key: "fat", label: "Fat (g)", placeholder: "0g" },
            { key: "hydration", label: "Water (oz)", placeholder: "0 oz" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-commander-muted text-xs">{label}</label>
              <input
                type="number" min="0"
                value={actuals[key] || ""}
                onChange={e => setActuals(a => ({ ...a, [key]: parseFloat(e.target.value) || 0 }))}
                placeholder={placeholder}
                className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weight Progression & Auto-Adjustment */}
      <div className="space-y-2">
        <p className="text-commander-muted text-xs uppercase tracking-widest font-bold">Weight Progression & Auto-Calorie Adjust</p>
        <WeightProgressionWidget onAdjustmentReady={adj => setCaloricAdjustment(adj)} />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-commander-muted text-xs font-bold uppercase">Meal Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Pre/post training meals, how you felt..."
          className="w-full bg-gray-900 border border-commander-border rounded-lg px-3 py-2 text-white text-sm resize-none" />
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
          <button onClick={() => setShowHistory(h => !h)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-all">
            <p className="text-white font-bold text-sm">Recent History ({history.length} days)</p>
            <ChevronDown className={`w-4 h-4 text-commander-muted transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          {showHistory && (
            <div className="border-t border-commander-border divide-y divide-commander-border">
              {history.slice(0, 7).map(h => {
                const calPct = h.target_calories > 0 ? Math.round((h.actual_calories / h.target_calories) * 100) : 0;
                return (
                  <div key={h.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-semibold">{h.date}</p>
                      <p className="text-commander-muted text-xs">{h.day_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-bold">{h.actual_calories || 0} <span className="text-commander-muted font-normal">/ {h.target_calories} kcal</span></p>
                      <p className={`text-xs font-bold ${calPct >= 90 && calPct <= 110 ? "text-vellera-green" : calPct < 80 ? "text-red-400" : "text-yellow-400"}`}>
                        {calPct}% hit
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
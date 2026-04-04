import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Zap, RefreshCw, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CARB_PROFILES = {
  high: { label: "High-Carb Day", emoji: "⚡", carbs: 300, fat: 70, calories: 3200, reason: "Intense training / Lab day" },
  moderate: { label: "Moderate-Carb Day", emoji: "🟡", carbs: 180, fat: 80, calories: 2800, reason: "Skill / Drills day" },
  low: { label: "Low-Carb Day", emoji: "🔴", carbs: 80, fat: 110, calories: 2500, reason: "Recovery / Rest day" },
};

function MacroBar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-commander-muted mb-1">
        <span>{label}</span>
        <span className="text-white font-bold">{value}g</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-900/60 border border-commander-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-800/50 transition-all"
      >
        <div className="text-left">
          <p className="text-white font-bold text-sm">{meal.time} — {meal.name}</p>
          <p className="text-commander-muted text-xs">
            {meal.calories} kcal · P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-commander-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-commander-border p-3 space-y-2">
          {meal.foods?.map((food, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-gray-300">{food.item}</span>
              <span className="text-commander-muted">{food.amount}</span>
            </div>
          ))}
          {meal.prep_tip && (
            <p className="text-vellera-blue text-xs mt-2">💡 {meal.prep_tip}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MealPlanner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(true);
  const [dayType, setDayType] = useState("moderate");
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  // Auto-detect today's training intensity
  useEffect(() => {
    const detectDayType = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        const [userProfile, shredMetrics] = await Promise.all([
          base44.entities.UserProfile.list("-created_date", 1),
          base44.entities.ZuluShredMetrics.filter({ date: today }),
        ]);

        if (userProfile[0]) setProfile(userProfile[0]);

        const todayMetrics = shredMetrics[0];
        if (todayMetrics?.recovery_score !== undefined && todayMetrics.recovery_score !== null) {
          if (todayMetrics.recovery_score >= 67) setDayType("high");
          else if (todayMetrics.recovery_score >= 34) setDayType("moderate");
          else setDayType("low");
        } else {
          // Fall back to day-of-week heuristic (Mon/Tue/Thu = Lab days = high carb)
          const dow = new Date().getDay();
          if ([1, 2, 4].includes(dow)) setDayType("high");
          else if ([3, 5].includes(dow)) setDayType("moderate");
          else setDayType("low");
        }
      } catch (err) {
        console.warn("Could not detect day type:", err.message);
      } finally {
        setDetecting(false);
      }
    };
    detectDayType();
  }, []);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);

    const carbProfile = CARB_PROFILES[dayType];
    const proteinTarget = profile?.daily_protein_target_g || 260;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a performance nutrition coach for a high-level BJJ/MMA athlete doing body recomposition (target: 215–225 lbs).

Generate a detailed daily meal plan for a "${carbProfile.label}" (${carbProfile.reason}).

MACRO TARGETS:
- Protein: ${proteinTarget}g (NON-NEGOTIABLE — hit this exactly)
- Carbohydrates: ~${carbProfile.carbs}g
- Fat: ~${carbProfile.fat}g
- Total Calories: ~${carbProfile.calories} kcal

RULES:
- 5 meals/snacks spaced throughout the day
- Time meals: Pre-workout carbs (50g) 90 min before PM session at 18:00
- Whole foods preferred. No junk. High micronutrient density.
- Include practical prep tips

Return JSON matching this schema exactly:
{
  "day_type": string,
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "hydration_oz": number,
  "meals": [
    {
      "time": string (e.g. "06:30 AM"),
      "name": string,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "foods": [
        { "item": string, "amount": string }
      ],
      "prep_tip": string
    }
  ],
  "supplement_timing": [
    { "time": string, "supplement": string }
  ],
  "warrior_note": string
}`,
        response_json_schema: {
          type: "object",
          properties: {
            day_type: { type: "string" },
            total_calories: { type: "number" },
            total_protein: { type: "number" },
            total_carbs: { type: "number" },
            total_fat: { type: "number" },
            hydration_oz: { type: "number" },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  name: { type: "string" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  foods: { type: "array", items: { type: "object", properties: { item: { type: "string" }, amount: { type: "string" } } } },
                  prep_tip: { type: "string" },
                },
              },
            },
            supplement_timing: {
              type: "array",
              items: { type: "object", properties: { time: { type: "string" }, supplement: { type: "string" } } },
            },
            warrior_note: { type: "string" },
          },
        },
      });

      setPlan(result);
    } catch (err) {
      setError("Failed to generate meal plan. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const carbProfile = CARB_PROFILES[dayType];

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white text-xl font-black">Meal Planner</h1>
          <p className="text-commander-muted text-xs">260g protein · Carb-cycled to training load</p>
        </div>
      </div>

      {/* Day Type Selector */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Training Day Type</p>
          {detecting && <span className="text-xs text-vellera-blue animate-pulse">Auto-detecting…</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(CARB_PROFILES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setDayType(key)}
              className={`rounded-xl p-3 border transition-all text-center ${
                dayType === key
                  ? "border-vellera-blue bg-vellera-blue/10"
                  : "border-commander-border hover:border-gray-600"
              }`}
            >
              <p className="text-xl">{val.emoji}</p>
              <p className={`text-xs font-bold mt-1 ${dayType === key ? "text-vellera-blue" : "text-white"}`}>
                {val.label.replace("-Carb Day", "")}
              </p>
              <p className="text-commander-muted text-xs">{val.carbs}g carbs</p>
            </button>
          ))}
        </div>

        {/* Macro Summary */}
        <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
          <p className="text-xs text-commander-muted font-bold uppercase">{carbProfile.label} Targets</p>
          <MacroBar label="Protein" value={profile?.daily_protein_target_g || 260} max={300} color="bg-vellera-green" />
          <MacroBar label="Carbs" value={carbProfile.carbs} max={350} color="bg-vellera-blue" />
          <MacroBar label="Fat" value={carbProfile.fat} max={150} color="bg-orange-400" />
          <p className="text-commander-muted text-xs text-right">~{carbProfile.calories} kcal total</p>
        </div>

        <button
          onClick={generatePlan}
          disabled={loading}
          className="w-full bg-vellera-green text-commander-dark font-black py-3 rounded-xl hover:bg-vellera-blue transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Generating Plan…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" /> Generate Today's Meal Plan
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">{error}</div>
      )}

      {/* Generated Plan */}
      {plan && (
        <div className="space-y-4">
          {/* Warrior Note */}
          {plan.warrior_note && (
            <div className="bg-vellera-blue/10 border border-vellera-blue/30 rounded-xl p-4">
              <p className="text-vellera-blue font-bold text-xs uppercase tracking-widest mb-1">⚔️ Warrior Note</p>
              <p className="text-gray-300 text-sm">{plan.warrior_note}</p>
            </div>
          )}

          {/* Macro Totals */}
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
            <p className="text-white font-bold text-sm">Daily Macro Summary</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Calories", value: plan.total_calories, unit: "kcal", color: "text-white" },
                { label: "Protein", value: plan.total_protein, unit: "g", color: "text-vellera-green" },
                { label: "Carbs", value: plan.total_carbs, unit: "g", color: "text-vellera-blue" },
                { label: "Fat", value: plan.total_fat, unit: "g", color: "text-orange-400" },
              ].map((m, i) => (
                <div key={i} className="bg-gray-900/50 rounded-lg p-2">
                  <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
                  <p className="text-commander-muted text-xs">{m.unit}</p>
                  <p className="text-commander-muted text-xs">{m.label}</p>
                </div>
              ))}
            </div>
            {plan.hydration_oz && (
              <p className="text-blue-400 text-xs text-center">💧 Hydration target: {plan.hydration_oz} oz</p>
            )}
          </div>

          {/* Meals */}
          <div className="space-y-2">
            <p className="text-white font-bold text-sm">Meal Breakdown</p>
            {plan.meals?.map((meal, i) => <MealCard key={i} meal={meal} />)}
          </div>

          {/* Supplement Timing */}
          {plan.supplement_timing?.length > 0 && (
            <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-2">
              <p className="text-white font-bold text-sm">Supplement Timing</p>
              {plan.supplement_timing.map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-commander-muted">{s.time}</span>
                  <span className="text-gray-300 font-medium">{s.supplement}</span>
                </div>
              ))}
            </div>
          )}

          {/* Regenerate */}
          <button
            onClick={generatePlan}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Regenerate Plan
          </button>
        </div>
      )}
    </div>
  );
}
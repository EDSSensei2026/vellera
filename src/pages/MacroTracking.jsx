import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import BackButton from "../components/BackButton";
import { AlertTriangle, Plus } from "lucide-react";
import TacticalFuelStatus from "../components/TacticalFuelStatus";

const COMMON_FOODS = [
  { name: "Chicken Breast (3oz)", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Rice (1 cup cooked)", calories: 206, protein: 4.3, carbs: 45, fat: 0.2 },
  { name: "Egg (1 large)", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: "Salmon (3oz)", calories: 175, protein: 19, carbs: 0, fat: 11 },
  { name: "Sweet Potato (1 medium)", calories: 103, protein: 2.3, carbs: 23, fat: 0.1 },
  { name: "Broccoli (1 cup)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { name: "Banana (1 medium)", calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { name: "Greek Yogurt (1 cup)", calories: 130, protein: 23, carbs: 9, fat: 0.4 },
  { name: "Almonds (1 oz)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Oatmeal (1 cup cooked)", calories: 150, protein: 5, carbs: 27, fat: 3 },
];

export default function MacroTracking() {
  const [today, setToday] = useState(new Date().toISOString().split("T")[0]);
  const [macroLog, setMacroLog] = useState(null);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [foodInput, setFoodInput] = useState({ name: "", servings: 1 });
  const [selectedFood, setSelectedFood] = useState(null);
  const [trainingMinutes, setTrainingMinutes] = useState(0);

  useEffect(() => {
    loadData();
  }, [today]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      const profile = profiles[0];
      setUserProfile(profile);

      // Get today's macro log
      const logs = await base44.entities.MacroTracker.filter({ date: today });
      setMacroLog(logs[0] || null);

      // Calculate requirements
      if (profile) {
        const todaySessions = await base44.entities.TrainingSession.filter({
          date: today,
        });
        const mins = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        setTrainingMinutes(mins);

        const res = await base44.functions.invoke("calculateMacroRequirements", {
          weight_lbs: profile.momentum_score ? 250 : 200, // fallback estimate
          training_volume_minutes: mins || 60,
          goal: "strength",
        });

        if (res.data.success) {
          setTargets({
            calories: res.data.tdee,
            protein: res.data.daily_protein,
            carbs: res.data.daily_carbs,
            fat: res.data.daily_fat,
            underFuelingThreshold: res.data.under_fueling_threshold,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const addFood = async () => {
    if (!selectedFood) {
      toast.error("Select a food");
      return;
    }

    const food = {
      ...selectedFood,
      servings: foodInput.servings,
      calories: selectedFood.calories * foodInput.servings,
      protein: selectedFood.protein * foodInput.servings,
      carbs: selectedFood.carbs * foodInput.servings,
      fat: selectedFood.fat * foodInput.servings,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    let log = macroLog;
    if (!log) {
      log = await base44.entities.MacroTracker.create({
        date: today,
        training_volume_minutes: trainingMinutes,
        daily_target_calories: targets.calories,
        daily_target_protein: targets.protein,
        daily_target_carbs: targets.carbs,
        daily_target_fat: targets.fat,
        foods_logged: [food],
        calories_consumed: food.calories,
        protein_g: food.protein,
        carbs_g: food.carbs,
        fat_g: food.fat,
      });
    } else {
      const updated = {
        ...log,
        foods_logged: [...(log.foods_logged || []), food],
        calories_consumed: (log.calories_consumed || 0) + food.calories,
        protein_g: (log.protein_g || 0) + food.protein,
        carbs_g: (log.carbs_g || 0) + food.carbs,
        fat_g: (log.fat_g || 0) + food.fat,
        under_fueling_alert: (log.calories_consumed || 0) + food.calories < targets.underFuelingThreshold,
      };
      log = await base44.entities.MacroTracker.update(log.id, updated);
    }

    setMacroLog(log);
    setSelectedFood(null);
    setFoodInput({ name: "", servings: 1 });
    setShowForm(false);
    toast.success(`Added ${selectedFood.name}`);
  };

  if (loading) return <div className="text-commander-muted">Loading...</div>;

  const current = macroLog || { calories_consumed: 0, protein_g: 0, carbs_g: 0, fat_g: 0, foods_logged: [] };
  const caloriePercent = targets ? Math.min(100, (current.calories_consumed / targets.calories) * 100) : 0;
  const isUnderFueling = targets && current.calories_consumed < targets.underFuelingThreshold;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black tracking-tight">Macro Tracking</h1>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-yellow-950/20 border border-yellow-800 rounded-lg px-3 py-2">
        <p className="text-xs text-yellow-400 font-medium">⚠️ Macro calculations are estimates. Consult a registered dietitian for personalized nutrition guidance.</p>
      </div>

      {/* Date Selector */}
      <div>
        <label className="text-xs text-commander-muted block mb-2">Date</label>
        <input
          type="date"
          value={today}
          onChange={(e) => setToday(e.target.value)}
          className="w-full bg-commander-surface border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
        />
      </div>

      {/* Calorie Summary */}
      {targets && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg">{Math.round(current.calories_consumed)}</p>
              <p className="text-commander-muted text-xs">Calories consumed</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg">{targets.calories}</p>
              <p className="text-commander-muted text-xs">Daily target</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                isUnderFueling ? "bg-red-500" : caloriePercent >= 100 ? "bg-green-500" : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(100, caloriePercent)}%` }}
            />
          </div>

          <p className="text-xs text-commander-muted text-center">{Math.round(caloriePercent)}% of daily target</p>

          {/* Under-Fueling Alert */}
          {isUnderFueling && (
            <div className="bg-red-950/30 border border-red-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 text-xs font-bold">Under-Fueling Alert</p>
                  <p className="text-red-300 text-xs mt-1">You're {Math.round(targets.underFuelingThreshold - current.calories_consumed)} calories below recommended intake for your {trainingMinutes} min training volume.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Macros Grid */}
      {targets && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-commander-surface border border-commander-border rounded-lg p-3 text-center">
            <p className="text-orange-400 font-bold text-sm">{Math.round(current.protein_g)}g</p>
            <p className="text-commander-muted text-xs mt-1">Protein</p>
            <p className="text-gray-600 text-xs mt-0.5">/ {targets.protein}g</p>
          </div>
          <div className="bg-commander-surface border border-commander-border rounded-lg p-3 text-center">
            <p className="text-yellow-400 font-bold text-sm">{Math.round(current.carbs_g)}g</p>
            <p className="text-commander-muted text-xs mt-1">Carbs</p>
            <p className="text-gray-600 text-xs mt-0.5">/ {targets.carbs}g</p>
          </div>
          <div className="bg-commander-surface border border-commander-border rounded-lg p-3 text-center">
            <p className="text-blue-400 font-bold text-sm">{Math.round(current.fat_g)}g</p>
            <p className="text-commander-muted text-xs mt-1">Fat</p>
            <p className="text-gray-600 text-xs mt-0.5">/ {targets.fat}g</p>
          </div>
        </div>
      )}

      {/* Tactical Fuel Status */}
      <TacticalFuelStatus caloriesToday={current.calories_consumed} date={today} />

      {/* Add Food Button */}
      <button
        onClick={() => setShowForm((f) => !f)}
        className="w-full bg-commander-red text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-all min-h-[44px] flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Log Food
      </button>

      {/* Food Selection Form */}
      {showForm && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs text-commander-muted block mb-2">Select Food</label>
            <select
              value={selectedFood ? COMMON_FOODS.indexOf(selectedFood) : ""}
              onChange={(e) => setSelectedFood(COMMON_FOODS[parseInt(e.target.value)])}
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
            >
              <option value="">Choose a food...</option>
              {COMMON_FOODS.map((food, i) => (
                <option key={i} value={i}>
                  {food.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFood && (
            <div>
              <label className="text-xs text-commander-muted block mb-2">Servings</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={foodInput.servings}
                onChange={(e) => setFoodInput((f) => ({ ...f, servings: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
              />
            </div>
          )}

          <button
            onClick={addFood}
            className="w-full bg-commander-red text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-all min-h-[44px]"
          >
            Add Food
          </button>
        </div>
      )}

      {/* Foods Logged */}
      {current.foods_logged && current.foods_logged.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-commander-muted uppercase tracking-widest">Logged Foods</p>
          {current.foods_logged.map((food, i) => (
            <div key={i} className="bg-commander-surface border border-commander-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-bold">{food.name} × {food.servings}</p>
                  <p className="text-commander-muted text-xs">{Math.round(food.calories)} cal · P:{Math.round(food.protein)}g · C:{Math.round(food.carbs)}g · F:{Math.round(food.fat)}g</p>
                </div>
                <span className="text-commander-muted text-xs">{food.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
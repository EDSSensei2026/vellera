import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Camera, Loader2, ChevronDown, ChevronUp, Droplets, AlertTriangle } from "lucide-react";
import BackButton from "../components/BackButton";
import FuelTrainingMatrix from "../components/FuelTrainingMatrix";
import TacticalFuelStatus from "../components/TacticalFuelStatus";
import SelectDrawer from "../components/SelectDrawer";

// Daily targets from Blueprint
const TARGETS = {
  dad:  { calories: 2700, protein_g: 250, carbs_g: 250, fat_g: 90,  water_oz: 125 },
  son:  { calories: 1800, protein_g: 65,  carbs_g: 200, fat_g: 55,  water_oz: 48  },
};

const MEAL_TYPES = ["Morning Fuel", "Midday Power", "Pre-Mat Snack", "Post-Mat Recovery", "Dinner", "Night Snack"];

const CONFIDENCE_COLORS = { high: "text-green-400", medium: "text-yellow-400", low: "text-red-400" };

function MacroRing({ label, current, target, color }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const over = current > target;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#1f2937" strokeWidth="5" />
          <circle cx="28" cy="28" r="22" fill="none"
            stroke={over ? "#ef4444" : color}
            strokeWidth="5"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-black ${over ? "text-red-400" : "text-white"}`}>{pct}%</span>
        </div>
      </div>
      <p className="text-xs text-commander-muted">{label}</p>
      <p className={`text-xs font-bold ${over ? "text-red-400" : "text-white"}`}>{current}<span className="text-commander-muted font-normal">/{target}{label === "Water" ? "oz" : "g"}</span></p>
    </div>
  );
}

function DayProgressBar({ label, current, target, color, unit = "g" }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const over = current > target;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-commander-muted">{label}</span>
        <span className={over ? "text-red-400 font-bold" : "text-white"}>{current}{unit} / {target}{unit} {over ? "⚠️" : ""}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${over ? "bg-red-500" : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FoodLogCard({ log }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3 text-left">
        {log.photo_url && (
          <img src={log.photo_url} alt="meal" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">{log.meal_type}</p>
          <p className="text-commander-muted text-xs truncate">{log.food_description || "Logged meal"}</p>
          {log.calories && <p className="text-orange-400 text-xs font-bold mt-0.5">{log.calories} cal · {log.protein_g}g protein</p>}
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {log.confidence && <span className={`text-xs font-medium ${CONFIDENCE_COLORS[log.confidence]}`}>{log.confidence}</span>}
          {open ? <ChevronUp className="w-4 h-4 text-commander-muted" /> : <ChevronDown className="w-4 h-4 text-commander-muted" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-commander-border px-3 pb-3 pt-2 space-y-2">
          {log.food_description && <p className="text-white text-sm">{log.food_description}</p>}
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: "Calories", v: log.calories, unit: "kcal", c: "text-orange-400" },
              { l: "Protein", v: log.protein_g, unit: "g", c: "text-red-400" },
              { l: "Carbs", v: log.carbs_g, unit: "g", c: "text-yellow-400" },
              { l: "Fat", v: log.fat_g, unit: "g", c: "text-blue-400" },
            ].map(({ l, v, unit, c }) => (
              <div key={l} className="bg-gray-800 rounded-lg p-2 text-center">
                <p className={`font-bold text-sm ${c}`}>{v ?? "—"}</p>
                <p className="text-xs text-commander-muted">{l}</p>
              </div>
            ))}
          </div>
          {log.notes && <p className="text-commander-muted text-xs italic">{log.notes}</p>}
        </div>
      )}
    </div>
  );
}

function WeeklyAdjustmentEngine({ weekLogs, athlete }) {
  const target = TARGETS[athlete];
  if (weekLogs.length < 3) return null;

  const avgCal = Math.round(weekLogs.reduce((s, l) => s + (l.calories || 0), 0) / weekLogs.length);
  const avgProtein = Math.round(weekLogs.reduce((s, l) => s + (l.protein_g || 0), 0) / weekLogs.length);

  // Stall detection: consistently under or over targets
  const calDiff = avgCal - target.calories;
  const proteinDiff = avgProtein - target.protein_g;
  const calStalling = Math.abs(calDiff) > target.calories * 0.15;
  const proteinLow = proteinDiff < -(target.protein_g * 0.15);

  if (!calStalling && !proteinLow) return null;

  const suggestions = [];
  if (calDiff > target.calories * 0.15) suggestions.push({ icon: "📉", text: `Avg ${avgCal} cal/day — ${calDiff} over target. Reduce portion size of carbs at dinner.`, color: "text-red-300" });
  if (calDiff < -(target.calories * 0.15)) suggestions.push({ icon: "📈", text: `Avg ${avgCal} cal/day — ${Math.abs(calDiff)} under target. You may be under-fueling mat sessions. Add a pre-mat snack.`, color: "text-yellow-300" });
  if (proteinLow) suggestions.push({ icon: "🥩", text: `Avg protein ${avgProtein}g — ${Math.abs(proteinDiff)}g below target. Add a protein shake post-training or a second meat source at lunch.`, color: "text-orange-300" });

  return (
    <div className="bg-yellow-950/30 border border-yellow-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        <p className="text-yellow-300 font-bold text-xs uppercase tracking-wider">Nutrition Adjustment Recommended</p>
      </div>
      <p className="text-yellow-400 text-xs mb-2 italic">These are AI suggestions only, not medical advice. Consult a registered dietitian before making dietary changes.</p>
      <p className="text-yellow-400 text-xs mb-3">Based on your last {weekLogs.length} logged meals, your weekly averages suggest adjustments:</p>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span>{s.icon}</span>
            <p className={`text-xs ${s.color}`}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FoodLog() {
  const [athlete, setAthlete] = useState("dad");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("log");
  const [analyzing, setAnalyzing] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [mealType, setMealType] = useState("Morning Fuel");
  const [waterToday, setWaterToday] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const target = TARGETS[athlete];

  const load = () => {
    base44.entities.FoodLog.filter({ athlete }).then(l => {
      setLogs(l.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
  };

  useEffect(() => { setLoading(true); load(); }, [athlete]);

  const todayLogs = logs.filter(l => l.date === selectedDate);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const weekLogs = logs.filter(l => l.date >= weekAgo);

  const totals = todayLogs.reduce((acc, l) => ({
    calories: acc.calories + (l.calories || 0),
    protein_g: acc.protein_g + (l.protein_g || 0),
    carbs_g: acc.carbs_g + (l.carbs_g || 0),
    fat_g: acc.fat_g + (l.fat_g || 0),
  }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!photoFile) { toast.error("Take or upload a meal photo first"); return; }
    setAnalyzing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      const t = TARGETS[athlete];
      const prompt = `You are a precision sports nutritionist analyzing a meal photo for a ${athlete === "dad" ? "43-year-old 250lb BJJ athlete cutting to 230lbs" : "young child (65 lbs, 4'11\") BJJ athlete in a growth/performance phase"}.

Daily targets: ${t.calories} cal · ${t.protein_g}g protein · ${t.carbs_g}g carbs · ${t.fat_g}g fat.

Analyze this meal photo and estimate:
1. What foods are visible (be specific about portions if possible)
2. Estimated calories
3. Estimated macros (protein, carbs, fat in grams)
4. Your confidence level (high/medium/low) based on how clearly you can see the portions

Be precise for athletic performance. If you can't see the full meal clearly, note that in your confidence rating.

Return JSON with: food_description (string, describe what you see), calories (number), protein_g (number), carbs_g (number), fat_g (number), confidence ("high"/"medium"/"low"), notes (string, any caveats or recommendations relative to the athlete's targets).`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            food_description: { type: "string" },
            calories: { type: "number" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fat_g: { type: "number" },
            confidence: { type: "string" },
            notes: { type: "string" },
          },
        },
      });

      await base44.entities.FoodLog.create({
        date: selectedDate,
        meal_type: mealType,
        photo_url: file_url,
        athlete,
        ...result,
      });

      toast.success(`Meal logged! ~${result.calories} cal · ${result.protein_g}g protein`);
      setPhotoFile(null);
      setPhotoPreview(null);
      load();
    } catch (err) {
      toast.error("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const calRemaining = target.calories - totals.calories;
  const proteinRemaining = target.protein_g - totals.protein_g;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      {/* Legal Disclaimer */}
      <div className="bg-yellow-950/20 border border-yellow-800 rounded-lg px-3 py-2 mb-2">
        <p className="text-xs text-yellow-400 font-medium">⚠️ This food log is informational only. AI estimates are approximate and do not diagnose, treat, or prevent any medical or nutritional condition. Consult a registered dietitian for personalized nutrition advice.</p>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black tracking-tight">Food Log</h1>
      </div>

      {/* Athlete Toggle */}
      <div className="flex bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
        <button onClick={() => setAthlete("dad")} className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold transition-all min-h-[44px] flex items-center justify-center ${athlete === "dad" ? "bg-commander-red text-white" : "text-commander-muted"}`}>
          ⚔️ Commander
        </button>
        <button onClick={() => setAthlete("son")} className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold transition-all min-h-[44px] flex items-center justify-center ${athlete === "son" ? "bg-blue-700 text-white" : "text-commander-muted"}`}>
          🥋 Lil Prodigy
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <button onClick={() => setActiveTab("log")} className={`flex-1 py-2.5 text-xs font-bold transition-all min-h-[44px] ${activeTab === "log" ? "bg-[#00E5FF20] text-[#00E5FF]" : "text-gray-500"}`}>
          📋 Daily Log
        </button>
        <button onClick={() => setActiveTab("matrix")} className={`flex-1 py-2.5 text-xs font-bold transition-all min-h-[44px] ${activeTab === "matrix" ? "bg-[#CCFF0020] text-[#CCFF00]" : "text-gray-500"}`}>
          📊 Fuel Matrix
        </button>
      </div>

      {activeTab === "matrix" && <FuelTrainingMatrix athlete={athlete} />}

      {activeTab === "log" && <>

      {/* Date Selector */}
      <div>
        <label className="text-xs text-commander-muted block mb-2 font-semibold">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 min-h-[44px]"
        />
      </div>

      {/* Daily Macro Rings */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Today vs Targets</p>
        <div className="flex justify-around mb-4">
          <MacroRing label="Protein" current={totals.protein_g} target={target.protein_g} color="#f97316" />
          <MacroRing label="Carbs" current={totals.carbs_g} target={target.carbs_g} color="#eab308" />
          <MacroRing label="Fat" current={totals.fat_g} target={target.fat_g} color="#3b82f6" />
          <MacroRing label="Water" current={waterToday} target={target.water_oz} color="#06b6d4" />
        </div>

        <DayProgressBar label="Calories" current={totals.calories} target={target.calories} color="bg-orange-500" unit="kcal" />

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className={`rounded-lg p-2 text-center ${calRemaining < 0 ? "bg-red-950 border border-red-800" : "bg-gray-800"}`}>
            <p className={`font-bold text-sm ${calRemaining < 0 ? "text-red-400" : "text-green-400"}`}>
              {calRemaining < 0 ? `${Math.abs(calRemaining)} over` : `${calRemaining} left`}
            </p>
            <p className="text-xs text-commander-muted">Calories</p>
          </div>
          <div className={`rounded-lg p-2 text-center ${proteinRemaining < 0 ? "bg-green-950 border border-green-800" : "bg-gray-800"}`}>
            <p className={`font-bold text-sm ${proteinRemaining < 0 ? "text-green-400" : "text-orange-400"}`}>
              {proteinRemaining < 0 ? `✓ Goal hit!` : `${proteinRemaining}g needed`}
            </p>
            <p className="text-xs text-commander-muted">Protein</p>
          </div>
        </div>

        {/* Water quick log */}
        <div className="mt-3 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-xs text-commander-muted">Water today:</span>
          <div className="flex gap-1 ml-auto">
            {[8, 16, 24, 32].map(oz => (
              <button key={oz} onClick={() => setWaterToday(w => Math.min(target.water_oz, w + oz))}
                className="text-xs bg-cyan-950 border border-cyan-800 text-cyan-400 px-3 py-2 rounded-lg hover:bg-cyan-900 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                +{oz}oz
              </button>
            ))}
            <button onClick={() => setWaterToday(0)} className="text-xs text-commander-muted px-2 py-1">↺</button>
          </div>
        </div>
      </div>

      {/* Tactical Fuel Status */}
      <TacticalFuelStatus caloriesToday={totals.calories} date={selectedDate} />

      {/* AI Adjustment Engine */}
      <WeeklyAdjustmentEngine weekLogs={weekLogs} athlete={athlete} />

      {/* Upload Form */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-xs text-commander-muted uppercase tracking-widest">Log a Meal with AI Vision</p>

        <div className="grid grid-cols-2 gap-2">
          <SelectDrawer
            label="Meal Type"
            value={mealType}
            options={MEAL_TYPES}
            onChange={setMealType}
          />
          <div>
            <label className="text-xs text-commander-muted block mb-2 font-semibold">Athlete</label>
            <div className="flex bg-gray-800 border border-commander-border rounded-lg overflow-hidden min-h-[44px]">
              <button onClick={() => setAthlete("dad")} className={`flex-1 text-xs font-bold transition-all ${athlete === "dad" ? "bg-commander-red text-white" : "text-commander-muted"}`}>Dad</button>
              <button onClick={() => setAthlete("son")} className={`flex-1 text-xs font-bold transition-all ${athlete === "son" ? "bg-blue-700 text-white" : "text-commander-muted"}`}>Son</button>
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-commander-border rounded-xl cursor-pointer hover:border-commander-red transition-all bg-gray-900 overflow-hidden">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
          {photoPreview ? (
            <img src={photoPreview} alt="meal preview" className="w-full h-40 object-cover" />
          ) : (
            <div className="py-12 text-center min-h-[160px] flex flex-col items-center justify-center">
              <Camera className="w-8 h-8 text-commander-muted mx-auto mb-2" />
              <p className="text-commander-muted text-sm font-medium">Tap to take photo or upload</p>
              <p className="text-commander-muted text-xs mt-1">AI will analyze portions & estimate macros</p>
            </div>
          )}
        </label>

        <button onClick={handleAnalyze} disabled={analyzing || !photoFile}
          className="w-full bg-commander-red text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-60 min-h-[44px]" title={!photoFile ? "Please upload a photo first" : ""}>
          {analyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with Vision AI...</>
          ) : (
            <><Camera className="w-4 h-4" /> Analyze & Log Meal</>
          )}
        </button>
      </div>

      {/* Today's Logs */}
      {todayLogs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-commander-muted uppercase tracking-widest">Today's Meals</p>
          {todayLogs.map(log => <FoodLogCard key={log.id} log={log} />)}
        </div>
      )}

      {/* Past Logs */}
      {logs.filter(l => l.date !== selectedDate).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-commander-muted uppercase tracking-widest">Past Entries</p>
          {logs.filter(l => l.date !== selectedDate).slice(0, 10).map(log => <FoodLogCard key={log.id} log={log} />)}
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <Camera className="w-8 h-8 text-commander-muted mx-auto mb-2" />
          <p className="text-commander-muted text-sm">No meals logged yet. Snap a photo of your next meal to get started.</p>
        </div>
      )}
      </> }
    </div>
  );
}
import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { TrendingUp } from "lucide-react";

const DAYS = 30;

function getDayKey(d) {
  return d.toISOString().split("T")[0];
}

function getLast30Days() {
  return Array.from({ length: DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return getDayKey(d);
  });
}

function DayCell({ hasFuel, hasTrain, label }) {
  let bg, title;
  if (hasFuel && hasTrain)  { bg = "bg-[#CCFF00]";   title = "Fueled + Trained"; }
  else if (hasFuel)          { bg = "bg-[#00E5FF40]"; title = "Fueled only"; }
  else if (hasTrain)         { bg = "bg-orange-500/60"; title = "Trained only"; }
  else                       { bg = "bg-gray-800";     title = "No activity"; }

  return (
    <div
      className={`w-7 h-7 rounded-md ${bg} flex items-center justify-center`}
      title={`${label}: ${title}`}
    >
      {hasFuel && hasTrain && <span className="text-black text-[8px] font-black">✦</span>}
    </div>
  );
}

export default function FuelTrainingMatrix({ athlete = "dad" }) {
  const [fuelDays, setFuelDays] = useState(new Set());
  const [trainDays, setTrainDays] = useState(new Set());
  const [macroAverages, setMacroAverages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DAYS);
    const cutoffStr = getDayKey(cutoff);

    Promise.all([
      base44.entities.FoodLog.filter({ athlete }),
      base44.entities.TrainingSession.list("-date", 60),
    ]).then(([foodLogs, sessions]) => {
      // Food days
      const fd = new Set(
        foodLogs.filter(l => l.date >= cutoffStr).map(l => l.date)
      );
      setFuelDays(fd);

      // Training days
      const td = new Set(
        sessions.filter(s => s.date >= cutoffStr).map(s => s.date)
      );
      setTrainDays(td);

      // Macro averages over logged days
      const recent = foodLogs.filter(l => l.date >= cutoffStr && l.calories);
      if (recent.length > 0) {
        const avg = (key) => Math.round(recent.reduce((s, l) => s + (l[key] || 0), 0) / recent.length);
        setMacroAverages({
          calories: avg("calories"),
          protein_g: avg("protein_g"),
          carbs_g: avg("carbs_g"),
          fat_g: avg("fat_g"),
          loggedDays: fd.size,
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [athlete]);

  const days = getLast30Days();
  const both = days.filter(d => fuelDays.has(d) && trainDays.has(d)).length;
  const fuelOnly = days.filter(d => fuelDays.has(d) && !trainDays.has(d)).length;
  const trainOnly = days.filter(d => !fuelDays.has(d) && trainDays.has(d)).length;
  const consistency = days.length > 0 ? Math.round((fuelDays.size / days.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-gray-700 border-t-[#00E5FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Consistency Score */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">30-Day Fuel Consistency</p>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-4xl font-black text-[#CCFF00] leading-none">{consistency}%</span>
          <span className="text-gray-500 text-sm mb-1">days logged / 30</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${consistency}%`, backgroundColor: consistency >= 70 ? "#CCFF00" : consistency >= 40 ? "#f97316" : "#ef4444" }}
          />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Last 30 Days</p>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map(d => (
            <DayCell
              key={d}
              hasFuel={fuelDays.has(d)}
              hasTrain={trainDays.has(d)}
              label={d.slice(5)}
            />
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {[
            { color: "bg-[#CCFF00]", label: "Fueled + Trained" },
            { color: "bg-[#00E5FF40] border border-[#00E5FF60]", label: "Fueled only" },
            { color: "bg-orange-500/60", label: "Trained only" },
            { color: "bg-gray-800", label: "No activity" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3.5 h-3.5 rounded-sm ${color}`} />
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-[#CCFF00] font-black text-xl">{both}</p>
          <p className="text-gray-500 text-xs mt-0.5">Fueled + Trained</p>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-[#00E5FF] font-black text-xl">{fuelOnly}</p>
          <p className="text-gray-500 text-xs mt-0.5">Fuel Only</p>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-orange-400 font-black text-xl">{trainOnly}</p>
          <p className="text-gray-500 text-xs mt-0.5">Trained Unfueled</p>
        </div>
      </div>

      {/* Macro Averages */}
      {macroAverages && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
            <p className="text-white text-sm font-bold">Average Daily Nutrition</p>
            <span className="text-gray-600 text-xs ml-auto">over {macroAverages.loggedDays} logged days</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Calories", val: macroAverages.calories, unit: "kcal", color: "text-orange-400" },
              { label: "Protein",  val: `${macroAverages.protein_g}g`, unit: "", color: "text-red-400" },
              { label: "Carbs",    val: `${macroAverages.carbs_g}g`, unit: "", color: "text-yellow-400" },
              { label: "Fat",      val: `${macroAverages.fat_g}g`, unit: "", color: "text-blue-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-gray-900 rounded-lg px-3 py-2 flex justify-between items-center">
                <span className="text-gray-500 text-xs">{label}</span>
                <span className={`font-bold text-sm ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {trainOnly > 3 && (
        <div className="bg-orange-950/40 border border-orange-800 rounded-xl p-3">
          <p className="text-orange-300 text-xs font-bold">⚠️ {trainOnly} sessions without fuel logging detected</p>
          <p className="text-orange-400/70 text-xs mt-0.5">Consistent post-workout logging helps optimize recovery nutrition.</p>
        </div>
      )}
    </div>
  );
}
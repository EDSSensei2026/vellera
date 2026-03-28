import { useState, useEffect } from "react";
import TrainingHeatmap from "../components/TrainingHeatmap";
import { base44 } from "@/api/base44Client";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Star, Zap, TrendingUp } from "lucide-react";

const CATEGORIES = [
  "Escapes & Survival",
  "Guard Retention",
  "Passing & Pressure",
  "Submissions",
  "Wrestling & Takedowns",
  "MMA Fundamentals",
];

const CATEGORY_COLORS = {
  "Escapes & Survival":     "#ef4444",
  "Guard Retention":        "#f97316",
  "Passing & Pressure":     "#eab308",
  "Submissions":            "#22c55e",
  "Wrestling & Takedowns":  "#3b82f6",
  "MMA Fundamentals":       "#a855f7",
};

const MASTERY_LABELS = ["", "Aware", "Drilling", "Solid", "Sharp", "Master"];

function MasteryStars({ level }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= level ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`} />
      ))}
    </div>
  );
}

function XPBar({ xp, maxXp = 100, color }) {
  const pct = Math.min(100, Math.round((xp / maxXp) * 100));
  return (
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function Progress() {
  const [techniques, setTechniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    base44.entities.Technique.list("-xp", 100).then(t => {
      setTechniques(t.filter(x => !x.is_junior));
      setLoading(false);
    });
  }, []);

  const totalXP = techniques.reduce((s, t) => s + (t.xp || 0), 0);
  const avgMastery = techniques.length
    ? (techniques.reduce((s, t) => s + (t.mastery_level || 0), 0) / techniques.length).toFixed(1)
    : 0;
  const mastered = techniques.filter(t => t.mastery_level >= 4).length;

  // Radar data by category
  const radarData = CATEGORIES.map(cat => {
    const catTechs = techniques.filter(t => t.category === cat);
    const avg = catTechs.length
      ? catTechs.reduce((s, t) => s + (t.mastery_level || 0), 0) / catTechs.length
      : 0;
    return { category: cat.split(" ")[0], fullName: cat, value: parseFloat(avg.toFixed(1)) };
  });

  // Bar chart: top techniques by XP
  const topTechs = [...techniques].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 8);

  const filtered = selectedCategory === "All"
    ? techniques
    : techniques.filter(t => t.category === selectedCategory);

  if (loading) return (
    <div className="p-4 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-commander-surface border border-commander-border rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24">
      <h1 className="text-white text-xl font-black tracking-tight">XP & Mastery Progress</h1>

      {/* Heatmap */}
      <TrainingHeatmap />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <p className="text-yellow-400 font-black text-xl">{totalXP}</p>
          <p className="text-commander-muted text-xs">Total XP</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <Star className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <p className="text-orange-400 font-black text-xl">{avgMastery}</p>
          <p className="text-commander-muted text-xs">Avg Mastery</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-green-400 font-black text-xl">{mastered}</p>
          <p className="text-commander-muted text-xs">Sharp+</p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Skill Web — Avg Mastery by Category</p>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="category" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Radar dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} dot={{ fill: "#ef4444", r: 3 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Techniques Bar Chart */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest mb-3">Top 8 Techniques by XP</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={topTechs} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#d1d5db", fontSize: 10 }} width={110} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#fff" }}
              formatter={(v) => [`${v} XP`, ""]}
            />
            <Bar dataKey="xp" radius={[0, 4, 4, 0]}>
              {topTechs.map((t, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[t.category] || "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Filter + Technique List */}
      <div>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
          {["All", ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all flex-shrink-0 font-medium ${
                selectedCategory === cat
                  ? "border-commander-red bg-red-950 text-white"
                  : "border-commander-border text-commander-muted"
              }`}>
              {cat === "All" ? "All" : cat.split(" ")[0]}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-commander-muted text-sm text-center py-8">No techniques found. Add some in the Skill Matrix.</p>
          )}
          {filtered.map(tech => {
            const color = CATEGORY_COLORS[tech.category] || "#ef4444";
            const nextLevelXp = (tech.mastery_level || 0) < 5 ? ((tech.mastery_level || 0) + 1) * 20 : 100;
            const currentLevelXp = (tech.mastery_level || 0) * 20;
            const progressInLevel = Math.min(1, ((tech.xp || 0) - currentLevelXp) / 20);
            return (
              <div key={tech.id} className="bg-commander-surface border border-commander-border rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{tech.name}</p>
                    <p className="text-commander-muted text-xs">{tech.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <MasteryStars level={tech.mastery_level || 0} />
                    <span className="text-xs font-bold" style={{ color }}>{tech.xp || 0} XP</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-commander-muted mb-0.5">
                    <span>{MASTERY_LABELS[tech.mastery_level || 0] || "Unranked"}</span>
                    {(tech.mastery_level || 0) < 5 && (
                      <span>{MASTERY_LABELS[(tech.mastery_level || 0) + 1]} →</span>
                    )}
                  </div>
                  <XPBar xp={progressInLevel * 100} maxXp={100} color={color} />
                  {tech.last_drilled && (
                    <p className="text-xs text-commander-muted text-right">Last: {tech.last_drilled}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
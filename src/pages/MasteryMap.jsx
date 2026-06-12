import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { Target, TrendingUp } from "lucide-react";
import BackButton from "../components/BackButton";

const MASTERY_TIERS = [
  { min: 0, max: 9,   label: "Uncharted",  color: "#4b5563", bg: "bg-gray-800",    border: "border-gray-700" },
  { min: 10, max: 29, label: "Learning",   color: "#3b82f6", bg: "bg-blue-950",    border: "border-blue-800" },
  { min: 30, max: 59, label: "Developing", color: "#f59e0b", bg: "bg-yellow-950",  border: "border-yellow-800" },
  { min: 60, max: 99, label: "Proficient", color: "#f97316", bg: "bg-orange-950",  border: "border-orange-800" },
  { min: 100, max: Infinity, label: "Mastered", color: "#22c55e", bg: "bg-green-950", border: "border-green-800" },
];

function getTier(xp) {
  return MASTERY_TIERS.find(t => xp >= t.min && xp <= t.max) || MASTERY_TIERS[0];
}

function XpBar({ xp, max = 100 }) {
  const tier = getTier(xp);
  const pct = Math.min(100, Math.round((xp / max) * 100));
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: tier.color }} />
    </div>
  );
}

function TechniqueCard({ tech, drillCount }) {
  const tier = getTier(tech.xp || 0);
  const daysSince = tech.last_drilled
    ? Math.floor((Date.now() - new Date(tech.last_drilled)) / 86400000)
    : null;
  return (
    <div className={`rounded-xl border p-3 ${tier.bg} ${tier.border}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-white text-xs font-semibold leading-tight">{tech.name}</p>
        <span className="text-xs font-bold flex-shrink-0" style={{ color: tier.color }}>{tech.xp || 0} XP</span>
      </div>
      <XpBar xp={tech.xp || 0} max={100} />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs" style={{ color: tier.color }}>{tier.label}</span>
        <span className="text-xs text-gray-500">
          {drillCount > 0 ? `${drillCount}× drilled` : "never drilled"}
          {daysSince !== null ? ` · ${daysSince}d ago` : ""}
        </span>
      </div>
    </div>
  );
}

export default function MasteryMap() {
  const [techniques, setTechniques] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeView, setActiveView] = useState("map");

  useEffect(() => {
    Promise.all([
      base44.entities.Technique.list("-xp", 200),
      base44.entities.TrainingSession.list("-date", 60),
    ]).then(([techs, sess]) => {
      setTechniques(techs);
      setSessions(sess);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-commander-red border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Drill frequency per technique name
  const drillFreq = {};
  sessions.forEach(s => {
    if (s.xp_awarded_technique) {
      drillFreq[s.xp_awarded_technique] = (drillFreq[s.xp_awarded_technique] || 0) + 1;
    }
    (s.techniques_drilled || []).forEach(t => {
      drillFreq[t] = (drillFreq[t] || 0) + 1;
    });
  });

  // XP growth over time (last 30 sessions with xp awards)
  const xpTimeline = sessions
    .filter(s => s.xp_awarded_technique && s.xp_amount)
    .slice(0, 30)
    .reverse()
    .map((s, i) => ({
      date: s.date?.slice(5),
      technique: s.xp_awarded_technique,
      xp: s.xp_amount,
    }));

  // Cumulative XP timeline
  let cumXp = 0;
  const cumulativeXp = xpTimeline.map(e => {
    cumXp += e.xp;
    return { ...e, cumXp };
  });

  // Categories
  const categories = ["All", ...new Set(techniques.map(t => t.category).filter(Boolean))];

  const filtered = activeCategory === "All"
    ? techniques
    : techniques.filter(t => t.category === activeCategory);

  // Suggested drills: lowest XP, never drilled or drilled long ago
  const suggested = [...techniques]
    .filter(t => (t.xp || 0) < 60)
    .sort((a, b) => {
      const scoreA = (a.xp || 0) + (drillFreq[a.name] || 0) * 5;
      const scoreB = (b.xp || 0) + (drillFreq[b.name] || 0) * 5;
      return scoreA - scoreB;
    })
    .slice(0, 5);

  // Category radar data
  const radarData = categories.filter(c => c !== "All").map(cat => {
    const catTechs = techniques.filter(t => t.category === cat);
    const avgXp = catTechs.length
      ? Math.round(catTechs.reduce((s, t) => s + (t.xp || 0), 0) / catTechs.length)
      : 0;
    return { category: cat.split(" ")[0], xp: Math.min(100, avgXp) };
  });

  // Tier distribution
  const tierDist = MASTERY_TIERS.map(tier => ({
    label: tier.label,
    count: techniques.filter(t => (t.xp || 0) >= tier.min && (t.xp || 0) <= tier.max).length,
    color: tier.color,
  }));

  const totalXp = techniques.reduce((s, t) => s + (t.xp || 0), 0);
  const masteredCount = techniques.filter(t => (t.xp || 0) >= 100).length;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2">
        <BackButton to="/techniques" />
        <h1 className="text-white text-xl font-black tracking-tight">Mastery Map</h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-yellow-400 font-black text-2xl">{totalXp}</p>
          <p className="text-commander-muted text-xs">Total XP</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-green-400 font-black text-2xl">{masteredCount}</p>
          <p className="text-commander-muted text-xs">Mastered</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
          <p className="text-blue-400 font-black text-2xl">{techniques.length}</p>
          <p className="text-commander-muted text-xs">Techniques</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
        {[["map", "📊 Map"], ["radar", "🎯 Radar"], ["growth", "📈 Growth"]].map(([v, l]) => (
          <button key={v} onClick={() => setActiveView(v)}
            className={`flex-1 py-2.5 text-xs font-bold transition-all min-h-[44px] ${activeView === v ? "bg-commander-red text-white" : "text-commander-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* MAP VIEW */}
      {activeView === "map" && <>
        {/* Tier Distribution Bar */}
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-wider mb-3">Tier Distribution</p>
          <div className="flex h-6 rounded-lg overflow-hidden gap-0.5">
            {tierDist.map(({ label, count, color }) => count > 0 && (
              <div key={label} className="flex items-center justify-center text-xs font-bold text-white transition-all"
                style={{ flex: count, backgroundColor: color, minWidth: 4 }}>
                {count > 1 ? count : ""}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {tierDist.map(({ label, count, color }) => (
              <span key={label} className="text-xs" style={{ color }}>
                {label}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all min-h-[36px] ${activeCategory === c ? "bg-commander-red border-commander-red text-white" : "border-commander-border text-commander-muted hover:text-white"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Technique Grid */}
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(tech => (
            <TechniqueCard key={tech.id} tech={tech} drillCount={drillFreq[tech.name] || 0} />
          ))}
        </div>
      </>}

      {/* RADAR VIEW */}
      {activeView === "radar" && <>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-wider mb-3">Avg XP by Category</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <PolarGrid stroke="#2a2a2a" />
              <PolarAngleAxis dataKey="category" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Radar name="XP" dataKey="xp" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart by category */}
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <p className="text-xs text-commander-muted uppercase tracking-wider mb-3">Total XP by Category</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categories.filter(c => c !== "All").map(cat => ({
              cat: cat.split(" ")[0],
              xp: techniques.filter(t => t.category === cat).reduce((s, t) => s + (t.xp || 0), 0),
            }))} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="cat" tick={{ fill: "#9ca3af", fontSize: 9 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 9 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="xp" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>}

      {/* GROWTH VIEW */}
      {activeView === "growth" && <>
        {cumulativeXp.length > 1 ? (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
            <p className="text-xs text-commander-muted uppercase tracking-wider mb-3">Cumulative XP Over Time</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={cumulativeXp} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                  formatter={(v, n, p) => [v, "Cumulative XP"]}
                  labelFormatter={(l) => `${l} — ${cumulativeXp.find(e => e.date === l)?.technique || ""}`} />
                <Line type="monotone" dataKey="cumXp" stroke="#00E5FF" strokeWidth={2} dot={{ r: 3, fill: "#00E5FF" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-commander-muted mx-auto mb-2" />
            <p className="text-commander-muted text-sm">Start awarding XP to techniques in your session logs to see growth over time.</p>
          </div>
        )}

        {/* Per-session XP log */}
        {xpTimeline.length > 0 && (
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
            <p className="text-xs text-commander-muted uppercase tracking-wider mb-3">XP Awards Log</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {[...xpTimeline].reverse().map((e, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-medium">{e.technique}</p>
                    <p className="text-commander-muted text-xs">{e.date}</p>
                  </div>
                  <span className="text-yellow-400 font-bold text-xs">+{e.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>}

      {/* Suggested Drills — always visible */}
      {suggested.length > 0 && (
        <div className="bg-commander-surface border border-[#00E5FF40] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#00E5FF]" />
            <p className="text-xs text-[#00E5FF] uppercase tracking-wider font-bold">Drill Next — Lowest Mastery</p>
          </div>
          <div className="space-y-2">
            {suggested.map((t, i) => {
              const tier = getTier(t.xp || 0);
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-commander-muted w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{t.name}</p>
                    <p className="text-commander-muted text-xs">{t.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: tier.color }}>{t.xp || 0} XP</p>
                    <p className="text-xs text-commander-muted">{tier.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
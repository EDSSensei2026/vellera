import { useMemo } from "react";
import { Shield, TrendingUp } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, LineChart, Line,
  XAxis, YAxis, CartesianGrid
} from "recharts";

// EP-related keywords used to tag techniques as Executive Protection
const EP_KEYWORDS = [
  "pistol", "draw", "holster", "firearm", "weapon",
  "ruck", "pack", "carry", "load",
  "extraction", "vip", "principal", "escort", "formation",
  "threat", "scan", "ambush", "vehicle", "dismount",
  "combative", "restraint", "wrist lock", "control",
  "low-light", "night", "flashlight",
  "stress", "inoculation", "defensive driving",
  "overwatch", "cover", "conceal", "close protection",
];

// Broader skill buckets for the radar
const EP_SKILL_BUCKETS = {
  "Firearms / Draw": ["pistol", "draw", "holster", "firearm", "weapon"],
  "Load Bearing": ["ruck", "pack", "carry", "load"],
  "Movement / Extraction": ["extraction", "vip", "principal", "escort", "formation", "overwatch", "close protection"],
  "Threat Awareness": ["threat", "scan", "ambush", "vehicle", "dismount", "cover", "conceal", "defensive driving"],
  "Combatives": ["combative", "restraint", "wrist lock", "control", "stress", "inoculation"],
  "Low-Light Ops": ["low-light", "night", "flashlight"],
};

function isEPTechnique(name = "") {
  const lower = name.toLowerCase();
  return EP_KEYWORDS.some(kw => lower.includes(kw));
}

function getBucket(name = "") {
  const lower = name.toLowerCase();
  for (const [bucket, kws] of Object.entries(EP_SKILL_BUCKETS)) {
    if (kws.some(kw => lower.includes(kw))) return bucket;
  }
  return null;
}

const TooltipStyle = {
  contentStyle: { backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: "8px", fontSize: 11 },
  labelStyle: { color: "#fff" },
};

export default function EPMasteryTracker({ entries }) {
  // --- Derive EP techniques across all entries ---
  const { radarData, trendData, topTechniques, totalEPReps } = useMemo(() => {
    // Accumulate reps per bucket
    const bucketReps = Object.fromEntries(Object.keys(EP_SKILL_BUCKETS).map(b => [b, 0]));
    // Per-technique totals
    const techMap = {};
    // Trend: reps per session date for EP techniques
    const dateMap = {};

    const sorted = [...entries].sort((a, b) =>
      new Date(a.session_date) - new Date(b.session_date)
    );

    sorted.forEach(entry => {
      const dateLabel = entry.session_date?.slice(5); // MM-DD
      let sessionEPReps = 0;

      (entry.techniques_practiced || []).forEach(t => {
        if (!t.name || !isEPTechnique(t.name)) return;
        const reps = t.reps || 1;
        const bucket = getBucket(t.name);
        if (bucket) bucketReps[bucket] += reps;
        techMap[t.name] = (techMap[t.name] || 0) + reps;
        sessionEPReps += reps;
      });

      if (sessionEPReps > 0 && dateLabel) {
        dateMap[dateLabel] = (dateMap[dateLabel] || 0) + sessionEPReps;
      }
    });

    // Radar: normalize to 0-100 scale
    const maxReps = Math.max(...Object.values(bucketReps), 1);
    const radarData = Object.entries(bucketReps).map(([skill, reps]) => ({
      skill: skill.split(" / ")[0], // short label
      fullSkill: skill,
      value: Math.round((reps / maxReps) * 100),
      reps,
    }));

    // Trend: cumulative EP reps over time
    let cumulative = 0;
    const trendData = Object.entries(dateMap).map(([date, reps]) => {
      cumulative += reps;
      return { date, reps, cumulative };
    });

    // Top 5 techniques by rep count
    const topTechniques = Object.entries(techMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, reps]) => ({ name, reps, bucket: getBucket(name) }));

    const totalEPReps = Object.values(techMap).reduce((a, b) => a + b, 0);

    return { radarData, trendData, topTechniques, totalEPReps };
  }, [entries]);

  if (totalEPReps === 0) {
    return (
      <div className="bg-commander-surface border border-amber-800/50 rounded-xl p-5 text-center space-y-2">
        <Shield className="w-8 h-8 text-amber-500 mx-auto" />
        <p className="text-white font-bold text-sm">No EP Techniques Logged Yet</p>
        <p className="text-commander-muted text-xs leading-relaxed">
          Tag techniques with EP keywords (e.g. "Pistol Draw", "Pack Carry", "VIP Extraction") 
          in your journal entries to track mastery here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <p className="text-white font-black">EP Mastery Tracker</p>
        </div>
        <span className="text-xs bg-amber-900/40 border border-amber-700/50 text-amber-400 font-bold px-2 py-0.5 rounded-full">
          {totalEPReps} total reps logged
        </span>
      </div>

      {/* Radar — skill coverage */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-commander-muted text-xs uppercase tracking-widest mb-1">Skill Coverage Radar</p>
        <p className="text-commander-muted text-xs mb-3">Relative mastery across EP domains</p>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: "#888", fontSize: 10 }} />
            <Radar
              name="Mastery"
              dataKey="value"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              {...TooltipStyle}
              formatter={(v, _, props) => [`${props.payload.reps} reps`, props.payload.fullSkill]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend — cumulative EP reps over time */}
      {trendData.length > 1 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-vellera-green" />
            <p className="text-commander-muted text-xs uppercase tracking-widest">Cumulative EP Rep Volume</p>
          </div>
          <p className="text-commander-muted text-xs mb-3">Total reps drilled across all EP techniques over time</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
              <YAxis tick={{ fill: "#666", fontSize: 10 }} />
              <Tooltip {...TooltipStyle} formatter={(v) => [v, "Cumulative Reps"]} />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#CCFF00"
                strokeWidth={2}
                dot={{ fill: "#CCFF00", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Techniques */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-commander-muted text-xs uppercase tracking-widest mb-3">Most Drilled EP Techniques</p>
        <div className="space-y-2">
          {topTechniques.map(({ name, reps, bucket }, i) => {
            const maxReps = topTechniques[0]?.reps || 1;
            const pct = Math.round((reps / maxReps) * 100);
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-amber-500 font-black text-xs w-4 shrink-0">#{i + 1}</span>
                    <span className="text-white text-xs font-semibold truncate">{name}</span>
                  </div>
                  <span className="text-commander-muted text-xs shrink-0 ml-2">{reps} reps</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
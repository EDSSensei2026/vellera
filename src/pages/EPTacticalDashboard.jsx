import { useState } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Plus, CheckCircle2, Circle, ChevronRight, TrendingUp, Target, Zap } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

// ── Drill catalog ─────────────────────────────────────────────────────────────
const DRILL_CATALOG = [
  {
    id: "pistol-draw",
    category: "Firearms / Draw",
    name: "Pistol Draw & Presentation",
    color: "text-red-400",
    borderColor: "border-red-700/50",
    bgColor: "bg-red-900/20",
    milestones: [
      { label: "Draw from open carry (slow)", reps: 20 },
      { label: "Draw from concealment", reps: 50 },
      { label: "One-hand draw", reps: 30 },
      { label: "High guard presentation", reps: 25 },
      { label: "Sub-2 sec consistent draw", reps: 100 },
    ],
  },
  {
    id: "pack-carry",
    category: "Load Bearing",
    name: "Pack & Gear Carry Conditioning",
    color: "text-orange-400",
    borderColor: "border-orange-700/50",
    bgColor: "bg-orange-900/20",
    milestones: [
      { label: "400m ruck walk (45 lbs)", reps: 6 },
      { label: "400m ruck walk (55 lbs)", reps: 6 },
      { label: "400m ruck walk (65 lbs)", reps: 6 },
      { label: "Ruck + jog intervals x6", reps: 3 },
      { label: "Sustained 60-min ruck", reps: 5 },
    ],
  },
  {
    id: "threat-scan",
    category: "Threat Awareness",
    name: "Threat ID & 360° Scan",
    color: "text-yellow-400",
    borderColor: "border-yellow-700/50",
    bgColor: "bg-yellow-900/20",
    milestones: [
      { label: "Basic scan drill (5 targets)", reps: 10 },
      { label: "ID in <2 sec", reps: 20 },
      { label: "Interview stance practice", reps: 15 },
      { label: "Verbal challenge scenarios", reps: 10 },
      { label: "Full 360° stress scenario", reps: 10 },
    ],
  },
  {
    id: "vip-extraction",
    category: "Movement / Extraction",
    name: "VIP Extraction Footwork",
    color: "text-blue-400",
    borderColor: "border-blue-700/50",
    bgColor: "bg-blue-900/20",
    milestones: [
      { label: "L-shape extraction solo", reps: 10 },
      { label: "Vehicle stack drill", reps: 10 },
      { label: "Building entry/exit", reps: 10 },
      { label: "Formation movement (box)", reps: 5 },
      { label: "Full timed extraction run", reps: 5 },
    ],
  },
  {
    id: "ep-combatives",
    category: "Combatives",
    name: "EP Combatives: Control & Restraint",
    color: "text-purple-400",
    borderColor: "border-purple-700/50",
    bgColor: "bg-purple-900/20",
    milestones: [
      { label: "Wrist lock technique", reps: 20 },
      { label: "Arm bar escort", reps: 20 },
      { label: "Rear choke escape", reps: 15 },
      { label: "Weapon retention drill", reps: 15 },
      { label: "5x 3-min live rounds", reps: 5 },
    ],
  },
  {
    id: "stress-inoculation",
    category: "Stress Conditioning",
    name: "Stress Inoculation Circuit",
    color: "text-pink-400",
    borderColor: "border-pink-700/50",
    bgColor: "bg-pink-900/20",
    milestones: [
      { label: "Burpees → dry draw", reps: 5 },
      { label: "Sprint → threat scan", reps: 5 },
      { label: "Push-ups → comms drill", reps: 5 },
      { label: "Full 3-station circuit", reps: 3 },
      { label: "5 consecutive rounds sub-fatigue", reps: 5 },
    ],
  },
  {
    id: "low-light",
    category: "Low-Light Ops",
    name: "Low-Light / Night Movement",
    color: "text-indigo-400",
    borderColor: "border-indigo-700/50",
    bgColor: "bg-indigo-900/20",
    milestones: [
      { label: "FBI flashlight hold (20 reps)", reps: 20 },
      { label: "Rogers hold technique", reps: 20 },
      { label: "Structure movement (dark)", reps: 5 },
      { label: "Corner clearing (night)", reps: 10 },
      { label: "Full low-vis structure run", reps: 3 },
    ],
  },
  {
    id: "vehicle-ambush",
    category: "Threat Awareness",
    name: "Vehicle Ambush Immediate Action",
    color: "text-amber-400",
    borderColor: "border-amber-700/50",
    bgColor: "bg-amber-900/20",
    milestones: [
      { label: "Vehicle dismount (<3 sec)", reps: 10 },
      { label: "React to contact", reps: 10 },
      { label: "Cover & concealment", reps: 10 },
      { label: "Principal secure drill", reps: 10 },
      { label: "Full ambush scenario timed", reps: 5 },
    ],
  },
];

const MASTERY_LABELS = ["Untrained", "Introduced", "Drilling", "Proficient", "Mastered"];
const MASTERY_COLORS = ["text-gray-500", "text-red-400", "text-yellow-400", "text-blue-400", "text-vellera-green"];
const MASTERY_BG = ["bg-gray-800", "bg-red-900/40", "bg-yellow-900/40", "bg-blue-900/40", "bg-green-900/40"];

function getMasteryLevel(completedMilestones, total) {
  const pct = completedMilestones / total;
  if (pct === 0) return 0;
  if (pct < 0.25) return 1;
  if (pct < 0.5) return 2;
  if (pct < 1) return 3;
  return 4;
}

const STORAGE_KEY = "ep_drill_progress_v1";

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Drill Card ────────────────────────────────────────────────────────────────
function DrillCard({ drill, progress, onToggle, onSelect }) {
  const completed = drill.milestones.filter((_, i) => progress[drill.id]?.[i]).length;
  const level = getMasteryLevel(completed, drill.milestones.length);
  const pct = Math.round((completed / drill.milestones.length) * 100);

  return (
    <div className={`bg-commander-surface border ${drill.borderColor} rounded-xl overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => onSelect(drill.id)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/40 transition-all text-left"
      >
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm ${drill.color}`}>{drill.name}</p>
          <p className="text-commander-muted text-xs mt-0.5">{drill.category}</p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden w-full">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-vellera-green" : "bg-gradient-to-r from-amber-600 to-amber-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-commander-muted text-xs mt-1">{completed}/{drill.milestones.length} milestones</p>
        </div>
        <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${MASTERY_BG[level]} ${MASTERY_COLORS[level]}`}>
            {MASTERY_LABELS[level]}
          </span>
          <ChevronRight className="w-4 h-4 text-commander-muted" />
        </div>
      </button>

      {/* Quick milestone toggles */}
      <div className="px-4 pb-3 space-y-1 border-t border-commander-border/50 pt-3">
        {drill.milestones.map((m, i) => {
          const done = progress[drill.id]?.[i] || false;
          return (
            <button
              key={i}
              onClick={() => onToggle(drill.id, i)}
              className="flex items-center gap-2 w-full text-left group"
            >
              {done
                ? <CheckCircle2 className="w-4 h-4 text-vellera-green shrink-0" />
                : <Circle className="w-4 h-4 text-gray-600 shrink-0 group-hover:text-gray-400" />}
              <span className={`text-xs ${done ? "line-through text-gray-500" : "text-gray-300"}`}>
                {m.label}
                <span className="text-commander-muted ml-1">({m.reps} reps)</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function EPTacticalDashboard() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(loadProgress);
  const [filter, setFilter] = useState("All");

  const categories = ["All", ...new Set(DRILL_CATALOG.map(d => d.category))];

  const toggleMilestone = (drillId, idx) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        [drillId]: { ...(prev[drillId] || {}), [idx]: !prev[drillId]?.[idx] },
      };
      saveProgress(updated);
      return updated;
    });
  };

  // Radar data
  const radarData = Object.entries(
    DRILL_CATALOG.reduce((acc, d) => {
      const cat = d.category;
      const completed = d.milestones.filter((_, i) => progress[d.id]?.[i]).length;
      const total = d.milestones.length;
      if (!acc[cat]) acc[cat] = { total: 0, completed: 0 };
      acc[cat].total += total;
      acc[cat].completed += completed;
      return acc;
    }, {})
  ).map(([cat, { total, completed }]) => ({
    skill: cat.split(" / ")[0].split(" ")[0],
    fullSkill: cat,
    value: total > 0 ? Math.round((completed / total) * 100) : 0,
  }));

  // Overall stats
  const totalMilestones = DRILL_CATALOG.reduce((s, d) => s + d.milestones.length, 0);
  const totalCompleted = DRILL_CATALOG.reduce((s, d) =>
    s + d.milestones.filter((_, i) => progress[d.id]?.[i]).length, 0);
  const masteredDrills = DRILL_CATALOG.filter(d => {
    const completed = d.milestones.filter((_, i) => progress[d.id]?.[i]).length;
    return completed === d.milestones.length;
  }).length;

  const filtered = filter === "All" ? DRILL_CATALOG : DRILL_CATALOG.filter(d => d.category === filter);

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-28 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-xl font-black flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> EP Tactical Dashboard
          </h1>
          <p className="text-commander-muted text-xs">Track mastery across all EP drills</p>
        </div>
        <button
          onClick={() => navigate("/schedule-drills")}
          className="flex items-center gap-1 text-xs bg-amber-900/40 border border-amber-700/50 text-amber-400 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-800/50 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Schedule
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Target, label: "Milestones", value: `${totalCompleted}/${totalMilestones}`, color: "text-vellera-blue" },
          { icon: Zap, label: "Mastered", value: `${masteredDrills}/${DRILL_CATALOG.length}`, color: "text-vellera-green" },
          { icon: TrendingUp, label: "Overall", value: `${Math.round((totalCompleted / totalMilestones) * 100)}%`, color: "text-amber-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-commander-surface border border-commander-border rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <p className={`font-black text-base ${color}`}>{value}</p>
            <p className="text-commander-muted text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Radar */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-commander-muted text-xs uppercase tracking-widest mb-3">Skill Domain Coverage</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: "#888", fontSize: 10 }} />
            <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: "8px", fontSize: 11 }}
              formatter={(v, _, p) => [`${v}%`, p.payload.fullSkill]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              filter === cat
                ? "bg-amber-500 text-black border-amber-400"
                : "border-commander-border text-commander-muted hover:text-white hover:border-gray-500"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Drill cards */}
      <div className="space-y-3">
        {filtered.map(drill => (
          <DrillCard
            key={drill.id}
            drill={drill}
            progress={progress}
            onToggle={toggleMilestone}
            onSelect={() => {}} // expand handled inline
          />
        ))}
      </div>
    </div>
  );
}
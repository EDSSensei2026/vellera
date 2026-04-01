import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Dumbbell, ChevronRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

// ─── Mock Workout Catalog ─────────────────────────────────────────────────────
const WORKOUT_CATALOG = [
  { workout_id: "wh_001", track_target: "whole_health", title: "The Reset: Morning Mobility", category: "The Reset", difficulty_level: "Beginner / Low Impact", duration_minutes: 10, equipment_needed: "None / Mat", icon: "🧘", path: "/recovery" },
  { workout_id: "wh_002", track_target: "whole_health", title: "The Foundation: Chair-Assisted Strength", category: "The Foundation", difficulty_level: "Beginner / Adaptive", duration_minutes: 12, equipment_needed: "Sturdy Chair", icon: "🪑", path: "/hub" },
  { workout_id: "wh_003", track_target: "whole_health", title: "Steady State Walk: Zone 2 Timer", category: "The Tempo", difficulty_level: "All Levels", duration_minutes: 30, equipment_needed: "None", icon: "🚶", path: "/hub" },
  { workout_id: "tac_001", track_target: "tactical", title: "The Grind: Shift-Ready Armor", category: "The Foundation", difficulty_level: "Advanced / High Intensity", duration_minutes: 15, equipment_needed: "Bodyweight / Optional Sandbag", icon: "⚙️", path: "/combat" },
  { workout_id: "tac_002", track_target: "tactical", title: "The Tempo: On-Foot Pursuit", category: "The Tempo", difficulty_level: "Intermediate / High Intensity", duration_minutes: 12, equipment_needed: "None", icon: "🏃", path: "/hub" },
  { workout_id: "tac_003", track_target: "tactical", title: "HIIT: Tactical Conditioning Block", category: "The Grind", difficulty_level: "Advanced", duration_minutes: 20, equipment_needed: "Bodyweight", icon: "🔥", path: "/combat" },
  { workout_id: "comp_001", track_target: "competitor", title: "The Strike: 5x5 Heavy Bag Intervals", category: "Combat", difficulty_level: "Advanced / Max Intensity", duration_minutes: 25, equipment_needed: "Heavy Bag", icon: "🥊", path: "/combat" },
  { workout_id: "comp_002", track_target: "competitor", title: "Grappling Flow: Positional Drilling", category: "Combat", difficulty_level: "Intermediate / Advanced", duration_minutes: 60, equipment_needed: "Mat Space", icon: "🥋", path: "/techniques" },
  { workout_id: "comp_003", track_target: "competitor", title: "Explosive Power: Olympic Complex", category: "The Foundation", difficulty_level: "Advanced", duration_minutes: 30, equipment_needed: "Barbell", icon: "⚡", path: "/hub" },
  { workout_id: "mom_001", track_target: "momentum", title: "The Foundation: Balanced Strength Circuit", category: "The Foundation", difficulty_level: "Intermediate", duration_minutes: 30, equipment_needed: "Full Gym", icon: "💪", path: "/hub" },
  { workout_id: "mom_002", track_target: "momentum", title: "Cardio Tempo: Beat-Driven HIIT", category: "The Tempo", difficulty_level: "Beginner / Intermediate", duration_minutes: 20, equipment_needed: "None", icon: "🎵", path: "/combat" },
  { workout_id: "mom_003", track_target: "momentum", title: "The Reset: Stress-Relief Stretch", category: "The Reset", difficulty_level: "All Levels", duration_minutes: 15, equipment_needed: "Mat", icon: "🌿", path: "/recovery" },
];

const TRACK_CONFIG = {
  whole_health: { label: "Whole Health", color: "#a855f7", emoji: "🧘" },
  tactical:     { label: "Tactical",     color: "#f59e0b", emoji: "🛡️" },
  competitor:   { label: "Competitor",   color: "#ef4444", emoji: "🥊" },
  momentum:     { label: "Momentum",     color: "#00E5FF", emoji: "⚡" },
};

const DIFFICULTY_COLORS = {
  "Beginner": "text-green-400",
  "Beginner / Low Impact": "text-green-400",
  "Beginner / Adaptive": "text-green-400",
  "Beginner / Intermediate": "text-green-400",
  "Intermediate": "text-yellow-400",
  "Intermediate / High Intensity": "text-yellow-400",
  "Intermediate / Advanced": "text-orange-400",
  "Advanced": "text-red-400",
  "Advanced / High Intensity": "text-red-400",
  "Advanced / Max Intensity": "text-red-400",
  "All Levels": "text-blue-400",
};

function WorkoutCard({ workout, accentColor }) {
  const diffColor = DIFFICULTY_COLORS[workout.difficulty_level] || "text-gray-400";
  return (
    <Link to={workout.path} className="block rounded-xl border border-gray-800 bg-[#1a1a1a] overflow-hidden hover:border-gray-600 transition-all active:scale-[0.98]">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0 mt-0.5">{workout.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-white font-bold text-sm leading-tight">{workout.title}</p>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
            </div>
            <p className="text-xs mt-1 font-medium" style={{ color: accentColor }}>{workout.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-400 text-xs">{workout.duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-400 text-xs truncate">{workout.equipment_needed}</span>
          </div>
          <span className={`text-xs font-semibold ml-auto ${diffColor}`}>{workout.difficulty_level.split(" / ")[0]}</span>
        </div>
      </div>
    </Link>
  );
}

export default function AdaptiveWorkoutDashboard() {
  const [activeTrack, setActiveTrack] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user's actual track from their profile
  useEffect(() => {
    base44.entities.UserProfile.filter({}).then(profiles => {
      if (profiles[0]?.vellera_track) {
        setActiveTrack(profiles[0].vellera_track);
      } else {
        setActiveTrack("momentum"); // default
      }
      setProfileLoaded(true);
    });
  }, []);

  // ── Filter Logic ──────────────────────────────────────────────────────────
  const filteredWorkouts = useMemo(() =>
    WORKOUT_CATALOG.filter(w => w.track_target === activeTrack),
    [activeTrack]
  );

  const config = TRACK_CONFIG[activeTrack] || TRACK_CONFIG.momentum;

  if (!profileLoaded) return null;

  return (
    <div className="space-y-4">
      {/* Track Selector — test toggle */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5" style={{ color: "#00E5FF" }} />
          <p className="text-xs uppercase tracking-widest text-gray-500">Your Track Workouts</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {Object.entries(TRACK_CONFIG).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => setActiveTrack(id)}
              className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[36px] border"
              style={activeTrack === id
                ? { backgroundColor: cfg.color + "20", borderColor: cfg.color, color: cfg.color }
                : { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a", color: "#666" }
              }
            >
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{filteredWorkouts.length} routines for {config.emoji} {config.label}</p>
      </div>

      {/* Filtered Workout List */}
      <div className="space-y-3">
        {filteredWorkouts.map(workout => (
          <WorkoutCard key={workout.workout_id} workout={workout} accentColor={config.color} />
        ))}
      </div>

      {filteredWorkouts.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-8 text-center">
          <p className="text-gray-500 text-sm">No workouts for this track yet.</p>
        </div>
      )}
    </div>
  );
}
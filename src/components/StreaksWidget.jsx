import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

const MILESTONES = [
  { days: 3,  label: "On Fire",       emoji: "🔥", color: "#f97316", glow: "#f9731640" },
  { days: 7,  label: "Week Warrior",  emoji: "⚡", color: "#00E5FF", glow: "#00E5FF40" },
  { days: 30, label: "Unstoppable",   emoji: "🏆", color: "#CCFF00", glow: "#CCFF0040" },
];

function calcStreak(sessions) {
  if (!sessions.length) return { current: 0, longest: 0 };

  // Unique days sorted descending
  const days = [...new Set(sessions.map(s => {
    const d = s.date_completed || s.date || s.created_date;
    return d ? d.split("T")[0] : null;
  }).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  if (!days.length) return { current: 0, longest: 0 };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Current streak: must start today or yesterday
  let current = 0;
  if (days[0] === today || days[0] === yesterday) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diff = Math.round((prev - curr) / 86400000);
      if (diff <= 2) current++;
      else break;
    }
  }

  // Longest streak
  let longest = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    if (Math.round((prev - curr) / 86400000) <= 2) { run++; longest = Math.max(longest, run); }
    else run = 1;
  }

  return { current, longest };
}

function MilestoneBadge({ milestone, unlocked }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-1"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl relative border-2 transition-all"
        style={unlocked
          ? { borderColor: milestone.color, backgroundColor: milestone.glow, boxShadow: `0 0 16px ${milestone.glow}` }
          : { borderColor: "#2a2a2a", backgroundColor: "#111", filter: "grayscale(1)", opacity: 0.4 }
        }
      >
        {milestone.emoji}
        {unlocked && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: milestone.color }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <p className="text-xs font-bold" style={{ color: unlocked ? milestone.color : "#444" }}>{milestone.days}d</p>
      <p className="text-xs text-gray-600 text-center leading-tight w-14">{milestone.label}</p>
    </motion.div>
  );
}

export default function StreaksWidget() {
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);
  const [justHit, setJustHit] = useState(null);

  useEffect(() => {
    base44.entities.Session_History.list("-date_completed", 90)
      .then(sessions => {
        const s = calcStreak(sessions);
        setStreak(s);
        // Check if current streak just hit a milestone
        const hit = MILESTONES.filter(m => s.current === m.days).pop();
        if (hit) setJustHit(hit);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const nextMilestone = MILESTONES.find(m => m.days > streak.current);
  const daysToNext = nextMilestone ? nextMilestone.days - streak.current : 0;

  if (loading) return null;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 space-y-4">
      {/* Milestone pop banner */}
      <AnimatePresence>
        {justHit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg px-4 py-2.5 text-center font-black text-sm"
            style={{ backgroundColor: justHit.glow, color: justHit.color, border: `1px solid ${justHit.color}40` }}
          >
            {justHit.emoji} {justHit.days}-Day Milestone Unlocked: {justHit.label}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak counter */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <motion.div
            animate={streak.current > 0 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: streak.current > 0 ? "#f9731420" : "#111", border: `2px solid ${streak.current > 0 ? "#f97316" : "#2a2a2a"}` }}
          >
            <Flame className="w-7 h-7" style={{ color: streak.current > 0 ? "#f97316" : "#333" }} />
          </motion.div>
          {streak.current > 0 && (
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#f97316] flex items-center justify-center">
              <span className="text-black text-xs font-black">{streak.current}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-black text-3xl leading-none">{streak.current}</span>
            <span className="text-gray-500 text-sm">day streak</span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">Longest: <span className="text-gray-300 font-semibold">{streak.longest} days</span></p>
          {nextMilestone && streak.current > 0 && (
            <p className="text-xs mt-1" style={{ color: nextMilestone.color }}>
              {daysToNext} more day{daysToNext !== 1 ? "s" : ""} to {nextMilestone.emoji} {nextMilestone.label}
            </p>
          )}
          {streak.current === 0 && (
            <p className="text-gray-600 text-xs mt-1">Log a session to start your streak</p>
          )}
        </div>
      </div>

      {/* Progress bar to next milestone */}
      {nextMilestone && (
        <div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ backgroundColor: nextMilestone.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (streak.current / nextMilestone.days) * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600 text-xs">{streak.current}d</span>
            <span className="text-xs" style={{ color: nextMilestone.color }}>{nextMilestone.days}d {nextMilestone.emoji}</span>
          </div>
        </div>
      )}

      {/* Milestone badges */}
      <div className="flex justify-around pt-1">
        {MILESTONES.map(m => (
          <MilestoneBadge key={m.days} milestone={m} unlocked={streak.current >= m.days || streak.longest >= m.days} />
        ))}
      </div>
    </div>
  );
}
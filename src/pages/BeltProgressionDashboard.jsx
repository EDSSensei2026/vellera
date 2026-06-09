import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Award, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { computeBadges } from "../lib/bjjBadges";

const BELT_ORDER = ["White", "Blue", "Purple", "Brown", "Black"];

const BELT_STYLES = {
  White:  { bar: "bg-gray-100",    ring: "border-gray-300",   label: "text-gray-900 bg-gray-100",   glow: "" },
  Blue:   { bar: "bg-blue-500",    ring: "border-blue-400",   label: "text-white bg-blue-600",      glow: "shadow-blue-500/40" },
  Purple: { bar: "bg-purple-500",  ring: "border-purple-400", label: "text-white bg-purple-700",    glow: "shadow-purple-500/40" },
  Brown:  { bar: "bg-amber-700",   ring: "border-amber-600",  label: "text-white bg-amber-800",     glow: "shadow-amber-600/40" },
  Black:  { bar: "bg-gray-800",    ring: "border-gray-500",   label: "text-white bg-gray-900 border border-gray-600", glow: "shadow-gray-500/40" },
};



function BadgeCard({ badge }) {
  return (
    <div className={`relative rounded-xl p-4 flex flex-col items-center gap-2 border transition-all text-center ${
      badge.unlocked
        ? "bg-gradient-to-b from-vellera-green/10 to-transparent border-vellera-green/50 shadow-lg shadow-vellera-green/10"
        : "bg-commander-surface border-commander-border opacity-50"
    }`}>
      <span className="text-3xl">{badge.icon}</span>
      {badge.unlocked
        ? <Award className="absolute top-2 right-2 w-4 h-4 text-vellera-green" />
        : <Lock className="absolute top-2 right-2 w-3 h-3 text-commander-muted" />
      }
      <p className={`font-black text-xs text-center leading-tight ${badge.unlocked ? "text-white" : "text-commander-muted"}`}>
        {badge.name}
      </p>
      <p className="text-xs text-commander-muted leading-tight">{badge.description}</p>
    </div>
  );
}

function BeltSection({ belt, techniques }) {
  const mastered = techniques.filter(t => t.status === "Mastered").length;
  const pct = techniques.length > 0 ? Math.round((mastered / techniques.length) * 100) : 0;
  const style = BELT_STYLES[belt];

  const byCategory = {};
  techniques.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });

  return (
    <div className={`bg-commander-surface border rounded-xl overflow-hidden ${pct === 100 ? `border-vellera-green shadow-lg ${style.glow}` : "border-commander-border"}`}>
      {/* Belt header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-black ${style.label}`}>{belt} Belt</span>
          <span className="text-commander-muted text-xs">{mastered}/{techniques.length} mastered</span>
        </div>
        <span className={`font-black text-sm ${pct === 100 ? "text-vellera-green" : "text-white"}`}>{pct}%</span>
      </div>

      {/* Overall belt bar */}
      <div className="px-4 pb-3">
        <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-vellera-green" : style.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Per-category breakdown */}
        <div className="space-y-2">
          {Object.entries(byCategory).map(([cat, techs]) => {
            const catMastered = techs.filter(t => t.status === "Mastered").length;
            const catPct = Math.round((catMastered / techs.length) * 100);
            return (
              <div key={cat} className="flex items-center gap-2">
                <p className="text-commander-muted text-xs w-32 truncate">{cat}</p>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${catPct === 100 ? "bg-vellera-green" : style.bar}`}
                    style={{ width: `${catPct}%` }}
                  />
                </div>
                <span className="text-xs text-commander-muted w-8 text-right">{catPct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BeltProgressionDashboard() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.SkillRoadmap.list("-created_date", 200)
      .then(setSkills)
      .finally(() => setLoading(false));
  }, []);

  const badges = computeBadges(skills);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  const byBelt = {};
  skills.forEach(s => {
    if (!byBelt[s.belt_level]) byBelt[s.belt_level] = [];
    byBelt[s.belt_level].push(s);
  });

  const totalMastered = skills.filter(s => s.status === "Mastered").length;
  const overallPct = skills.length > 0 ? Math.round((totalMastered / skills.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-vellera-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-commander-muted hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white text-xl font-black">Belt Progression</h1>
          <p className="text-commander-muted text-xs">{unlockedCount}/{badges.length} badges unlocked</p>
        </div>
      </div>

      {/* Overall ring */}
      <div className="bg-gradient-to-r from-vellera-blue/10 to-vellera-green/10 border border-vellera-blue/30 rounded-xl p-4 flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1e2e" strokeWidth="12" />
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={overallPct === 100 ? "#CCFF00" : "#00E5FF"} strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(overallPct / 100) * 263.9} 263.9`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-white text-lg font-black">{overallPct}%</p>
          </div>
        </div>
        <div>
          <p className="text-white font-black">Overall BJJ Mastery</p>
          <p className="text-commander-muted text-sm">{totalMastered}/{skills.length} techniques mastered</p>
          <p className="text-vellera-green text-sm font-bold mt-1">{unlockedCount} badges earned 🏆</p>
        </div>
      </div>

      {/* Badges Grid */}
      <div>
        <p className="text-white font-black mb-3">Achievement Badges</p>
        <div className="grid grid-cols-3 gap-3">
          {badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
        </div>
      </div>

      {/* Belt Sections */}
      <div>
        <p className="text-white font-black mb-3">Belt-by-Belt Breakdown</p>
        <div className="space-y-3">
          {BELT_ORDER.filter(b => byBelt[b]?.length > 0).map(belt => (
            <BeltSection key={belt} belt={belt} techniques={byBelt[belt]} />
          ))}
        </div>
      </div>

      {/* CTA to Skill Roadmap */}
      <button
        onClick={() => navigate("/skill-roadmap")}
        className="w-full bg-vellera-blue/20 border border-vellera-blue text-vellera-blue font-bold py-3 rounded-xl hover:bg-vellera-blue/40 transition-all"
      >
        Update Technique Status →
      </button>
    </div>
  );
}
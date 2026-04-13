import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { computeBadges } from "../lib/bjjBadges";

export default function BJJBadgesShowcase() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.SkillRoadmap.list("-created_date", 200)
      .then(skills => {
        const computed = computeBadges(skills);
        setBadges(computed);
      })
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, []);

  const unlocked = badges.filter(b => b.unlocked);
  if (loading || unlocked.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-transparent via-vellera-green/5 to-transparent">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-vellera-green text-xs uppercase tracking-widest font-bold mb-2">🏆 Earned on the Mats</p>
          <h2 className="text-3xl font-black text-white">BJJ Achievement Badges</h2>
          <p className="text-gray-400 text-sm mt-2">{unlocked.length} badge{unlocked.length !== 1 ? "s" : ""} unlocked through logged training</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          {unlocked.map(badge => (
            <div key={badge.id} className="bg-gradient-to-b from-vellera-green/10 to-transparent border border-vellera-green/40 rounded-xl p-3 flex flex-col items-center gap-1 text-center">
              <span className="text-3xl">{badge.icon}</span>
              <p className="text-white text-xs font-black leading-tight">{badge.name}</p>
            </div>
          ))}
        </div>

        {/* Locked badges (greyed out) */}
        {badges.filter(b => !b.unlocked).length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 opacity-30">
            {badges.filter(b => !b.unlocked).map(badge => (
              <div key={badge.id} className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 flex items-center gap-1">
                <span className="text-base grayscale">{badge.icon}</span>
                <span className="text-gray-500 text-xs">???</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/belt-progression"
            className="inline-block bg-vellera-green text-commander-dark font-black px-6 py-3 rounded-xl hover:bg-vellera-blue transition-all"
          >
            View Full Belt Progression →
          </Link>
        </div>
      </div>
    </section>
  );
}
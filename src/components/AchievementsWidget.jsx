import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy } from "lucide-react";

const BADGE_CONFIG = {
  first_session: { name: "First Steps", icon: "🥋", desc: "Logged your first session", rarity: "common" },
  sessions_10: { name: "Momentum Starter", icon: "⚡", desc: "10 sessions logged", rarity: "uncommon" },
  sessions_50: { name: "Iron Grinder", icon: "🔥", desc: "50 sessions logged", rarity: "rare" },
  sessions_100: { name: "Warrior", icon: "⚔️", desc: "100 sessions logged", rarity: "legendary" },
  strength_5lb_increase: { name: "Gaining Ground", icon: "💪", desc: "Added 5 lbs to 1RM", rarity: "common" },
  strength_25lb_increase: { name: "Power Surge", icon: "⚡", desc: "Added 25 lbs to 1RM", rarity: "rare" },
  strength_50lb_increase: { name: "Beast Mode", icon: "🦾", desc: "Added 50 lbs to 1RM", rarity: "legendary" },
  consistency_7_days: { name: "On a Roll", icon: "🔗", desc: "7 consecutive training days", rarity: "uncommon" },
  consistency_30_days: { name: "Unstoppable", icon: "🌟", desc: "30 consecutive training days", rarity: "legendary" },
  endurance_100_minutes: { name: "Endurance Start", icon: "🏃", desc: "100 total endurance minutes", rarity: "common" },
  endurance_500_minutes: { name: "Marathon Runner", icon: "🚴", desc: "500 total endurance minutes", rarity: "rare" },
  weight_loss_5lbs: { name: "Lighter Load", icon: "⬇️", desc: "Lost 5 lbs", rarity: "uncommon" },
  weight_loss_10lbs: { name: "Shredded", icon: "💎", desc: "Lost 10 lbs", rarity: "rare" },
  first_technique: { name: "Technique Scholar", icon: "📖", desc: "First technique mastered", rarity: "common" },
  techniques_10: { name: "Arsenal Master", icon: "🎯", desc: "10 techniques mastered", rarity: "rare" },
  first_xp_award: { name: "XP Earned", icon: "✨", desc: "First XP awarded to technique", rarity: "uncommon" },
};

const RARITY_COLORS = {
  common: "bg-gray-800 border-gray-700 text-gray-300",
  uncommon: "bg-green-900 border-green-700 text-green-300",
  rare: "bg-blue-900 border-blue-700 text-blue-300",
  legendary: "bg-yellow-900 border-yellow-700 text-yellow-300",
};

export default function AchievementsWidget() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Achievement.list("-awarded_date", 20).then(a => {
      setAchievements(a);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-commander-muted text-xs">Loading achievements...</div>;

  const recentAchievements = achievements.slice(0, 5);
  const totalCount = achievements.length;

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-bold text-sm">Achievements</h3>
        <span className="ml-auto text-xs bg-commander-red text-white px-2 py-1 rounded-full font-bold">{totalCount}</span>
      </div>

      {recentAchievements.length > 0 ? (
        <div className="space-y-2">
          {recentAchievements.map(ach => {
            const badge = BADGE_CONFIG[ach.badge_id] || { name: ach.badge_name, icon: "🏆", rarity: "common" };
            const rarityClass = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;
            return (
              <div key={ach.id} className={`border rounded-lg p-2.5 flex items-center gap-2 ${rarityClass}`}>
                <span className="text-lg">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight">{badge.name}</p>
                  <p className="text-xs opacity-75 leading-tight">{badge.desc}</p>
                </div>
                {ach.awarded_date && (
                  <span className="text-xs opacity-60 flex-shrink-0">
                    {new Date(ach.awarded_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-commander-muted text-xs">Start training to unlock achievements!</p>
        </div>
      )}

      {totalCount > 5 && (
        <button className="w-full text-xs text-commander-muted hover:text-white transition-all py-2 border-t border-commander-border pt-3">
          View all {totalCount} achievements
        </button>
      )}
    </div>
  );
}
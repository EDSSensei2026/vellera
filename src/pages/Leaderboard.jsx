import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import BackButton from "../components/BackButton";
import { Flame, Clock, Target } from "lucide-react";

const MEDAL_COLORS = {
  1: "text-yellow-400",
  2: "text-gray-400",
  3: "text-orange-400",
};

const MEDAL_EMOJIS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    // Default to current month
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(defaultMonth);
    loadLeaderboard(defaultMonth);
  }, []);

  const loadLeaderboard = async (month) => {
    setLoading(true);
    try {
      const data = await base44.entities.MonthlyConsistency.filter(
        { year_month: month },
        "-consistency_score",
        100
      );
      setEntries(data);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    loadLeaderboard(e.target.value);
  };

  // Generate available months (last 12 months)
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(month);
  }

  const getMonthLabel = (month) => {
    const [year, m] = month.split("-");
    return new Date(year, parseInt(m) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top">
      <div className="flex items-center gap-2">
        <BackButton to="/" />
        <h1 className="text-white text-xl font-black">Consistency Leaderboard</h1>
      </div>

      {/* Month Selector */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <label className="text-xs text-commander-muted uppercase tracking-widest block mb-2">Select Month</label>
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
        >
          {months.map(m => (
            <option key={m} value={m}>{getMonthLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* Info Card */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-commander-muted text-xs">
          <span className="text-white font-bold">📊 Scoring:</span> 40% Sessions + 40% Minutes + 20% Streak. Individual biometric data remains private.
        </p>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-commander-surface border border-commander-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
          <p className="text-commander-muted text-sm">No leaderboard data for {getMonthLabel(selectedMonth)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const medal = MEDAL_EMOJIS[rank];
            const medalColor = MEDAL_COLORS[rank];

            return (
              <div
                key={entry.id}
                className={`border rounded-xl p-4 ${
                  rank <= 3
                    ? "bg-commander-surface border-yellow-800"
                    : "bg-commander-surface border-commander-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Rank & Name */}
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`text-2xl font-black ${medalColor}`}>
                      {medal || `#${rank}`}
                    </span>
                    <div>
                      <p className="text-white font-bold text-sm">{entry.user_name}</p>
                      <p className="text-commander-muted text-xs text-ellipsis">{entry.user_email}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className={`text-2xl font-black ${
                      entry.consistency_score >= 80 ? "text-green-400" :
                      entry.consistency_score >= 60 ? "text-yellow-400" :
                      "text-orange-400"
                    }`}>
                      {entry.consistency_score}
                    </p>
                    <p className="text-commander-muted text-xs">consistency</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-commander-border">
                  <div className="text-center">
                    <Flame className="w-4 h-4 text-red-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">{entry.total_sessions}</p>
                    <p className="text-commander-muted text-xs">sessions</p>
                  </div>

                  <div className="text-center">
                    <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">{entry.total_minutes}</p>
                    <p className="text-commander-muted text-xs">minutes</p>
                  </div>

                  <div className="text-center">
                    <Target className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-sm">{entry.streak_days}</p>
                    <p className="text-commander-muted text-xs">streak</p>
                  </div>
                </div>

                {/* Categories */}
                {entry.categories_trained?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.categories_trained.slice(0, 3).map(cat => (
                      <span key={cat} className="text-xs bg-commander-border text-commander-muted px-2 py-0.5 rounded">
                        {cat}
                      </span>
                    ))}
                    {entry.categories_trained.length > 3 && (
                      <span className="text-xs text-commander-muted">+{entry.categories_trained.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-xs text-commander-muted space-y-1">
        <p className="text-white font-bold text-sm mb-2">🏆 How it works</p>
        <p>• Consistency Score calculated monthly from your training activity.</p>
        <p>• No biometric data (HRV, sleep, etc) is shown — only training volume.</p>
        <p>• Streak resets if you miss a day. Sessions = unique training dates.</p>
        <p>• Rankings update automatically at the start of each month.</p>
      </div>
    </div>
  );
}
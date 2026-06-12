import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import BackButton from "../components/BackButton";
import { Trophy, Flame, Zap, TrendingUp, Users } from "lucide-react";

const PATH_CONFIG = {
  strength: { label: "Strength & Power", icon: Flame, color: "text-orange-400", bgColor: "bg-orange-950/30 border-orange-800" },
  bodybuilding: { label: "Bodybuilding", icon: TrendingUp, color: "text-pink-400", bgColor: "bg-pink-950/30 border-pink-800" },
  endurance: { label: "Endurance", icon: Zap, color: "text-yellow-400", bgColor: "bg-yellow-950/30 border-yellow-800" },
  bjj: { label: "BJJ", icon: Users, color: "text-blue-400", bgColor: "bg-blue-950/30 border-blue-800" },
};

export default function CommunityChallenge() {
  const [leaderboards, setLeaderboards] = useState({});
  const [selectedPath, setSelectedPath] = useState("strength");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const profiles = await base44.entities.UserProfile.list("-created_date", 100);
      const sessions = await base44.entities.TrainingSession.list("-date", 500);

      // Group by fitness path
      const byPath = {};
      Object.keys(PATH_CONFIG).forEach(path => {
        byPath[path] = [];
      });

      profiles.forEach(profile => {
        if (!profile.fitness_path) return;
        
        const userSessions = sessions.filter(s => s.created_by === profile.created_by);
        const totalVolume = userSessions.reduce((sum, s) => {
          const match = s.lifting_exercises?.match(/\d+lbs/g) || [];
          const weights = match.map(w => parseInt(w));
          return sum + weights.reduce((a, b) => a + b, 0);
        }, 0);

        const consistencyDays = new Set(userSessions.map(s => s.date)).size;
        const totalMinutes = userSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

        byPath[profile.fitness_path].push({
          email: profile.created_by,
          name: user?.email === profile.created_by ? "You" : profile.created_by.split("@")[0],
          isCurrentUser: user?.email === profile.created_by,
          volume: totalVolume,
          consistencyDays,
          totalMinutes,
          sessions: userSessions.length,
        });
      });

      // Sort each leaderboard
      Object.keys(byPath).forEach(path => {
        byPath[path].sort((a, b) => {
          if (path === "strength") return b.volume - a.volume;
          if (path === "bodybuilding") return b.consistencyDays - a.consistencyDays;
          if (path === "endurance") return b.totalMinutes - a.totalMinutes;
          return b.sessions - a.sessions;
        });
      });

      setLeaderboards(byPath);
      setLoading(false);
    };

    load();
  }, []);

  const config = PATH_CONFIG[selectedPath];
  const Icon = config.icon;
  const lb = leaderboards[selectedPath] || [];

  const getMetricLabel = () => {
    if (selectedPath === "strength") return "Total Volume";
    if (selectedPath === "bodybuilding") return "Consistency Days";
    if (selectedPath === "endurance") return "Total Minutes";
    return "Sessions";
  };

  const getMetricValue = (user) => {
    if (selectedPath === "strength") return `${user.volume.toLocaleString()} lbs`;
    if (selectedPath === "bodybuilding") return `${user.consistencyDays} days`;
    if (selectedPath === "endurance") return `${user.totalMinutes} min`;
    return user.sessions;
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2 mb-4">
        <BackButton to="/" />
        <div>
          <h1 className="text-white text-xl font-black tracking-tight">Community Challenges</h1>
          <p className="text-commander-muted text-xs">Compete on your fitness path</p>
        </div>
      </div>

      {/* Path Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(PATH_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setSelectedPath(key)}
            className={`flex-shrink-0 text-xs px-3 py-2 rounded-full border transition-all font-medium min-h-[36px] ${
              selectedPath === key
                ? `border-${key === "strength" ? "orange" : key === "bodybuilding" ? "pink" : key === "endurance" ? "yellow" : "blue"}-600 bg-${key === "strength" ? "orange" : key === "bodybuilding" ? "pink" : key === "endurance" ? "yellow" : "blue"}-950/30 text-white`
                : "border-commander-border text-commander-muted"
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Active Challenge Card */}
      <div className={`border rounded-xl p-4 ${config.bgColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <h2 className={`font-bold text-sm ${config.color}`}>{config.label} Challenge</h2>
        </div>
        <p className="text-commander-muted text-xs">
          {selectedPath === "strength"
            ? "Compete on total lifting volume across all sessions"
            : selectedPath === "bodybuilding"
            ? "Most consistent training days logged"
            : selectedPath === "endurance"
            ? "Most total endurance training minutes"
            : "Most training sessions logged"}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-commander-muted font-mono">LEADERBOARD</span>
          <span className={`text-xs font-bold ${config.color}`}>{getMetricLabel()}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-commander-muted">Loading leaderboard...</div>
      ) : lb.length === 0 ? (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 text-center">
          <Trophy className="w-8 h-8 text-commander-muted mx-auto mb-2 opacity-50" />
          <p className="text-commander-muted text-sm">No participants on this path yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lb.slice(0, 10).map((user, idx) => {
            const medal =
              idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
            return (
              <div
                key={user.email}
                className={`border rounded-xl p-3 flex items-center gap-3 transition-all ${
                  user.isCurrentUser
                    ? `${config.bgColor} border-2`
                    : "bg-commander-surface border-commander-border"
                }`}
              >
                <div className="text-sm font-black w-6 text-center">
                  {typeof medal === "string" && medal.length === 1 ? medal : medal}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {user.name}
                    {user.isCurrentUser && <span className="ml-1 text-xs text-commander-muted">(you)</span>}
                  </p>
                  <p className="text-commander-muted text-xs">{user.sessions} sessions</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm ${config.color}`}>{getMetricValue(user)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      {lb.length > 0 && (
        <div className="grid grid-cols-3 gap-2 bg-commander-surface border border-commander-border rounded-xl p-3">
          <div className="text-center">
            <p className="text-white font-black text-lg">{lb.length}</p>
            <p className="text-commander-muted text-xs">Competitors</p>
          </div>
          <div className="text-center">
            <p className={`font-black text-lg ${config.color}`}>{getMetricValue(lb[0])}</p>
            <p className="text-commander-muted text-xs">1st Place</p>
          </div>
          <div className="text-center">
            {currentUser && (
              <>
                <p className={`font-black text-lg ${config.color}`}>
                  #{lb.findIndex(u => u.email === currentUser.email) + 1}
                </p>
                <p className="text-commander-muted text-xs">Your Rank</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
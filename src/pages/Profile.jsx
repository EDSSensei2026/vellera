import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Settings } from "lucide-react";
import BackButton from "../components/BackButton";
import MomentumRing from "../components/MomentumRing";
import StatsGrid from "../components/StatsGrid";
import ActivityFeed from "../components/ActivityFeed";
import { Link } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Get user profile
        const profiles = await base44.entities.UserProfile.filter(
          { created_by: currentUser.email },
          "-created_date",
          1
        );
        if (profiles.length > 0) {
          setProfile(profiles[0]);
        }

        // Get recent sessions
        const recentSessions = await base44.entities.Session_History.filter(
          { created_by: currentUser.email },
          "-date_completed",
          5
        );
        setSessions(recentSessions);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BackButton to="/" />
          <h1 className="text-white text-xl font-black tracking-tight">Profile</h1>
        </div>
        <Link
          to="/settings"
          className="text-commander-muted hover:text-white transition-all touch-target-min"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>

      {/* Athlete Profile Section */}
      <div className="bg-commander-surface border border-commander-border rounded-2xl p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-vellera-blue to-vellera-green mx-auto mb-4 flex items-center justify-center">
          <span className="text-4xl">🥋</span>
        </div>
        <h2 className="text-white font-black text-2xl mb-1">{user?.full_name || "Athlete"}</h2>
        <p className="text-commander-muted text-sm">
          Vellera Athlete since {user?.created_date ? new Date(user.created_date).getFullYear() : "2026"}
        </p>
      </div>

      {/* Momentum Ring */}
      {profile && <MomentumRing score={profile.momentum_score} level={profile.momentum_level} />}

      {/* Stats Grid */}
      {profile && (
        <StatsGrid
          streak={profile.current_streak_days}
          totalTime={profile.lifetime_minutes}
          workoutsCompleted={profile.lifetime_workouts}
          combatRounds={profile.lifetime_combat_rounds}
        />
      )}

      {/* Recent Activity Feed */}
      {sessions.length > 0 && <ActivityFeed sessions={sessions} />}

      {!profile && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center">
          <p className="text-commander-muted text-sm">Start your first workout to see your progress!</p>
        </div>
      )}
    </div>
  );
}
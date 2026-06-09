import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, Edit2, Check, X } from "lucide-react";
import BackButton from "../components/BackButton";
import { toast } from "sonner";
import MomentumRing from "../components/MomentumRing";
import StatsGrid from "../components/StatsGrid";
import ActivityFeed from "../components/ActivityFeed";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

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
          setEditForm(profiles[0]);
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

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error("Logout failed: " + err.message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, editForm);
        setProfile(editForm);
        setEditing(false);
        toast.success("Profile updated!");
      }
    } catch (err) {
      toast.error("Failed to save: " + err.message);
    }
  };

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
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-commander-muted hover:text-white transition-all touch-target-min"
              title="Edit Profile"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-commander-muted hover:text-red-400 transition-all touch-target-min"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
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

      {/* Edit Mode */}
      {editing && profile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-white text-lg font-bold">Edit Profile</h3>

            <div>
              <label className="text-xs text-commander-muted block mb-2">Weight (lbs)</label>
              <input
                type="number"
                value={editForm.weight_lbs || ""}
                onChange={(e) => setEditForm({ ...editForm, weight_lbs: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs text-commander-muted block mb-2">Fitness Goal</label>
              <input
                type="text"
                value={editForm.onboarding_goal || ""}
                onChange={(e) => setEditForm({ ...editForm, onboarding_goal: e.target.value })}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 border border-commander-border text-commander-muted rounded-lg py-2 font-bold text-sm hover:text-white transition-all min-h-[44px] flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-commander-red text-white rounded-lg py-2 font-bold text-sm hover:bg-red-700 transition-all min-h-[44px] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
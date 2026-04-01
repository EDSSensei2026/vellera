import { useState, useEffect } from "react";
import { ArrowLeft, Trash2, LogOut, Edit2, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email }, "-created_date", 1);
        if (profiles.length > 0) {
          setProfile(profiles[0]);
          setEditForm(profiles[0]);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
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
    setSaving(true);
    try {
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, editForm);
        setProfile(editForm);
        setEditing(false);
        toast.success("Profile updated!");
      }
    } catch (err) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/deleteUserAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to delete account');
      toast.success("Account deleted successfully");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 safe-area-top">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/")}
          className="text-commander-muted hover:text-white transition-all touch-target-min"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-xl font-black tracking-tight">Settings</h1>
      </div>

      {/* Profile Section */}
      {profile && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Profile Settings</p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-commander-muted hover:text-white transition-all p-1"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {!editing ? (
            <div className="space-y-3 text-sm">
              {editForm.onboarding_goal && (
                <div>
                  <p className="text-commander-muted text-xs mb-1">Primary Goal</p>
                  <p className="text-white">{editForm.onboarding_goal}</p>
                </div>
              )}
              {editForm.onboarding_journey && (
                <div>
                  <p className="text-commander-muted text-xs mb-1">Journey Stage</p>
                  <p className="text-white">{editForm.onboarding_journey}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-commander-muted block mb-2">Primary Goal</label>
                <select
                  value={editForm.onboarding_goal || ""}
                  onChange={(e) => setEditForm({ ...editForm, onboarding_goal: e.target.value })}
                  className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
                >
                  <option value="">Select a goal</option>
                  <option>General Fitness & Health</option>
                  <option>Strength & Power</option>
                  <option>Bodybuilding & Hypertrophy</option>
                  <option>Endurance & Conditioning</option>
                  <option>Tactical & First Responder Readiness</option>
                  <option>Combat Sports & Competition</option>
                  <option>Rehab, Mobility & Whole Health</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-commander-muted block mb-2">Journey Stage</label>
                <select
                  value={editForm.onboarding_journey || ""}
                  onChange={(e) => setEditForm({ ...editForm, onboarding_journey: e.target.value })}
                  className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
                >
                  <option value="">Select stage</option>
                  <option>Just starting out / Getting back into it</option>
                  <option>Consistent but want to level up</option>
                  <option>Preparing for a season/fight</option>
                  <option>Active Duty / Professional</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditForm(profile);
                  }}
                  className="flex-1 border border-commander-border text-commander-muted rounded-lg py-2 font-bold text-sm hover:text-white transition-all min-h-[44px] flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 bg-commander-red text-white rounded-lg py-2 font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Section */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Account</p>

        <div className="space-y-2">
          <p className="text-commander-muted text-xs">Logged in as</p>
          <p className="text-white font-semibold">{user?.full_name || "User Account"}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 bg-commander-surface border border-commander-border text-white hover:border-commander-red rounded-xl py-3 px-4 font-semibold transition-all min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className="w-full flex items-center gap-2 bg-red-950/30 border border-red-800 text-red-400 hover:bg-red-950/60 rounded-xl py-3 px-4 font-semibold transition-all min-h-[44px]"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* App Info */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-3">App Info</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-commander-muted">Version</span>
            <span className="text-white font-semibold">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-commander-muted">Built for</span>
            <span className="text-white font-semibold">iOS & Android</span>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-commander-surface border border-commander-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="text-commander-muted">
              This action cannot be undone. All your data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-700 hover:bg-red-800 text-white border-none disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
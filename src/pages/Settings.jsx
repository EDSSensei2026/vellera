import { useState } from "react";
import { ArrowLeft, Trash2, LogOut } from "lucide-react";
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

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error("Logout failed: " + err.message);
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

      {/* Account Section */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
        <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Account</p>

        <div className="space-y-2">
          <p className="text-commander-muted text-xs">Logged in as</p>
          <p className="text-white font-semibold">User Account</p>
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
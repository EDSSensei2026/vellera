import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Email and password required");
      return;
    }

    setLoading(true);
    try {
      // Note: Base44 handles auth internally via the platform
      // This redirects to the platform's login
      await base44.auth.redirectToLogin();
    } catch (err) {
      toast.error("Sign in failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) {
      toast.error("All fields required");
      return;
    }

    setLoading(true);
    try {
      // Note: Base44 handles user creation via the platform
      // This redirects to the platform's signup
      await base44.auth.redirectToLogin();
    } catch (err) {
      toast.error("Sign up failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-commander-dark via-gray-900 to-commander-dark flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-vellera-blue to-vellera-green flex items-center justify-center mb-8">
        <Shield className="w-8 h-8 text-vellera-dark" />
      </div>

      {/* Branding */}
      <h1 className="text-white text-4xl font-black text-center mb-2">Apex Forge</h1>
      <p className="text-commander-muted text-center mb-8">Train. Compete. Dominate.</p>

      {/* Auth Form */}
      <div className="w-full max-w-md bg-commander-surface border border-commander-border rounded-2xl p-6 space-y-6">
        {/* Mode Toggle */}
        <div className="flex bg-gray-800 border border-commander-border rounded-lg overflow-hidden">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-3 text-sm font-bold transition-all min-h-[44px] ${
              mode === "signin"
                ? "bg-commander-red text-white"
                : "text-commander-muted hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-3 text-sm font-bold transition-all min-h-[44px] ${
              mode === "signup"
                ? "bg-commander-red text-white"
                : "text-commander-muted hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs text-commander-muted block mb-2 font-semibold">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your name"
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-commander-red min-h-[44px]"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-commander-muted block mb-2 font-semibold">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-commander-red min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-commander-muted block mb-2 font-semibold">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-commander-red min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-commander-red text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2 mt-6"
          >
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Platform Auth Notice */}
        <div className="bg-gray-800 border border-commander-border rounded-lg p-3">
          <p className="text-xs text-commander-muted text-center">
            Authentication handled by Base44 platform. Redirecting to secure login.
          </p>
        </div>
      </div>

      {/* Demo Info */}
      <div className="mt-8 text-center max-w-md">
        <p className="text-commander-muted text-xs">
          After signing in, complete your profile to set up your training goals and personal stats.
        </p>
      </div>
    </div>
  );
}
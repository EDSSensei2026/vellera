import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Auth() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await base44.auth.redirectToLogin('/dashboard');
  };

  return (
    <div className="min-h-screen bg-vellera-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-vellera-blue/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-vellera-blue to-vellera-green flex items-center justify-center mx-auto mb-4 shadow-lg shadow-vellera-blue/30">
          <Zap className="w-10 h-10 text-vellera-dark" strokeWidth={3} />
        </div>
        <h1 className="text-white text-4xl font-black tracking-tight">Vellera</h1>
        <p className="text-commander-muted text-sm mt-1">Hybrid Athlete Training Platform</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-commander-surface border border-commander-border rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center">
          <h2 className="text-white text-2xl font-black">Welcome Back</h2>
          <p className="text-commander-muted text-sm mt-1">Sign in to access your training dashboard</p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-3 transition-all min-h-[52px] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #00E5FF, #CCFF00)', color: '#121212' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-vellera-dark border-t-transparent rounded-full animate-spin" />
              Redirecting...
            </span>
          ) : (
            <>
              Sign In to Vellera
              <ArrowRight className="w-5 h-5" strokeWidth={3} />
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-commander-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-commander-surface text-commander-muted text-xs uppercase tracking-wider">New to Vellera?</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-commander-muted text-xs leading-relaxed">
            Create your account via the sign-in page — select <span className="text-vellera-blue font-semibold">"Sign Up"</span> after clicking above.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex gap-4 text-xs text-commander-muted">
        <Link to="/" className="hover:text-white transition">← Back to Home</Link>
        <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-white transition">Terms</Link>
      </div>
    </div>
  );
}
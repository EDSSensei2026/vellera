import { useState, useEffect } from "react";
import { Shield, Star, MessageSquare, X, Zap } from "lucide-react";

const STORAGE_KEY = "vellera_beta_welcomed";

/**
 * BetaWelcomeModal — shown once per device for new users.
 * Informs them this is a pre-release build and invites feedback.
 */
export default function BetaWelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show only if the user hasn't been welcomed yet
    const hasBeenWelcomed = localStorage.getItem(STORAGE_KEY);
    if (!hasBeenWelcomed) {
      // Slight delay so the dashboard renders first
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-commander-surface border border-vellera-blue/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-vellera-blue/20 to-vellera-green/20 border-b border-commander-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-vellera-blue" />
            <span className="text-white font-black text-sm tracking-widest uppercase">Welcome to Vellera</span>
          </div>
          <button onClick={dismiss} className="text-gray-500 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Pre-release badge */}
          <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-700/50 rounded-xl px-3 py-2">
            <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-yellow-300 text-xs font-bold">
              PRE-RELEASE · Google Play Test Group
            </p>
          </div>

          <p className="text-white text-sm leading-relaxed">
            You're one of <span className="text-vellera-blue font-bold">1,000 selected testers</span> for the Vellera pre-release. 
            Thank you for helping us build something extraordinary.
          </p>

          <div className="space-y-2">
            {[
              { icon: Star, color: "text-vellera-green", text: "All features are fully unlocked during the test period." },
              { icon: MessageSquare, color: "text-vellera-blue", text: "Your feedback directly shapes the final product." },
              { icon: Shield, color: "text-purple-400", text: "Data you log is real and securely stored." },
            ].map(({ icon: Icon, color, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                <p className="text-gray-300 text-xs leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
            <p className="text-gray-400 text-xs">Bugs? Ideas? We want to hear it.</p>
            <a
              href="mailto:vellera@eds-360.com?subject=Vellera Beta Feedback"
              className="text-vellera-blue text-xs font-bold hover:underline"
            >
              vellera@eds-360.com
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <button
            onClick={dismiss}
            className="w-full py-4 bg-gradient-to-r from-vellera-blue to-vellera-green text-black font-black rounded-xl text-sm hover:opacity-90 transition"
          >
            Let's Go 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
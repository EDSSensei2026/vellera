import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Lock } from "lucide-react";

/**
 * BetaGate — wraps the authenticated app.
 * If the beta limit (1000 users) is reached, shows a closed-beta screen
 * instead of the app content. Passes through if under the limit or on error.
 */
export default function BetaGate({ children }) {
  const [status, setStatus] = useState("open"); // start open — check runs in background
  const [spotsLeft, setSpotsLeft] = useState(null);

  useEffect(() => {
    base44.functions.invoke("checkBetaLimit", {})
      .then((res) => {
        const { is_open, spots_remaining } = res.data;
        setSpotsLeft(spots_remaining);
        if (!is_open) setStatus("closed");
      })
      .catch(() => {
        // Fail open — don't block users if the function errors
      });
  }, []);

  if (status === "closed") {
    return (
      <div className="fixed inset-0 bg-commander-dark flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-900/30 border border-red-700/50 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-white font-black text-2xl mb-2">Beta Closed</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Our Google Play test group has reached its limit of <span className="text-vellera-blue font-bold">1,000 users</span>. 
              We're working hard to open the next phase soon.
            </p>
          </div>
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-vellera-blue shrink-0" />
            <div className="text-left">
              <p className="text-white text-sm font-bold">1,000 / 1,000 spots filled</p>
              <p className="text-commander-muted text-xs">Join the waitlist for Phase 2</p>
            </div>
          </div>
          <a
            href="mailto:vellera@eds-360.com?subject=Vellera Beta Waitlist"
            className="block w-full py-4 bg-gradient-to-r from-vellera-blue to-vellera-green text-black font-black rounded-xl text-sm"
          >
            Join the Waitlist
          </a>
          <p className="text-gray-600 text-xs">
            Already have access?{" "}
            <button
              onClick={() => setStatus("open")}
              className="text-vellera-blue underline"
            >
              Sign in anyway
            </button>
          </p>
        </div>
      </div>
    );
  }

  return children;
}
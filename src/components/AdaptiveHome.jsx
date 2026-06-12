import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Settings, Loader2 } from "lucide-react";
import { getTrack } from "../lib/velleraTrack";

/**
 * AdaptiveHome — renders a personalized greeting, featured routine, and focus tags
 * based on the user's assigned Vellera Track from their UserProfile.
 */
export default function AdaptiveHome({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      base44.entities.UserProfile.filter({}).then(profiles => {
        setProfile(profiles[0] || null);
        setLoading(false);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-gray-500 text-sm">Loading your track...</span>
      </div>
    );
  }

  // Not onboarded — prompt them
  if (!profile?.onboarding_complete) {
    return (
      <div className="rounded-xl border border-[#00E5FF33] bg-[#00E5FF08] p-5">
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#00E5FF" }}>Personalize Your Experience</p>
        <p className="text-white font-black text-lg leading-tight mb-1">Find Your Vellera Track</p>
        <p className="text-gray-400 text-sm mb-4">Takes 60 seconds. We'll build a custom dashboard around your goals.</p>
        <button
          onClick={() => navigate("/onboarding")}
          className="w-full py-3 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2"
          style={{ backgroundColor: "#00E5FF" }}
        >
          Start Personalization <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const track = getTrack(profile.vellera_track);
  const firstName = user?.full_name?.split(" ")[0] || null;

  return (
    <div className="space-y-3">
      {/* Track greeting card */}
      <div
        className="rounded-xl border p-5 relative overflow-hidden"
        style={{ borderColor: track.color + "40", backgroundColor: track.color + "08" }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: track.color }}>
              {track.label}
            </p>
            <p className="text-white font-black text-base leading-snug max-w-[80%]">
              {track.greeting(firstName)}
            </p>
          </div>
          <Link to="/onboarding" className="p-1 touch-target-min flex items-center justify-center" title="Change track">
            <Settings className="w-4 h-4 text-gray-600 hover:text-gray-400 transition-colors" />
          </Link>
        </div>

        {/* Focus tags */}
        <div className="flex flex-wrap gap-1.5">
          {track.focus_tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: track.color + "20", color: track.color }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Featured Routine */}
      <Link
        to={track.featured_routine.path}
        className="block rounded-xl border border-gray-800 bg-[#1a1a1a] p-4 hover:border-gray-600 transition-all"
      >
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Today's Featured Routine</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl flex-shrink-0">{track.featured_routine.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">{track.featured_routine.title}</p>
            <p className="text-gray-500 text-xs mt-0.5">{track.featured_routine.subtitle}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
        </div>
      </Link>

      {/* Alt Routine */}
      <Link
        to={track.alt_routine.path}
        className="block rounded-xl border border-gray-800 bg-[#1a1a1a] p-4 hover:border-gray-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">{track.alt_routine.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{track.alt_routine.title}</p>
            <p className="text-gray-500 text-xs mt-0.5">{track.alt_routine.subtitle}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
        </div>
      </Link>
    </div>
  );
}
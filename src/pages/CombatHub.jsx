import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, VolumeX, Zap } from "lucide-react";

export default function CombatHub() {
  const [anthemPlaying, setAnthemPlaying] = useState(false);
  const navigate = useNavigate();

  const combatCategories = [
    {
      title: "The Strike",
      subtitle: "Boxing / Muay Thai timers & shadowboxing",
      route: "/training",
      icon: "👊",
      accent: "text-red-400",
      bgAccent: "from-red-500/10 to-orange-600/10",
      borderAccent: "border-red-500/30",
    },
    {
      title: "The Grind",
      subtitle: "BJJ / Wrestling conditioning",
      route: "/bjj-journal",
      icon: "🔒",
      accent: "text-orange-400",
      bgAccent: "from-orange-500/10 to-amber-600/10",
      borderAccent: "border-orange-500/30",
    },
    {
      title: "The Mat",
      subtitle: "Combo flows and full circuits",
      route: "/techniques",
      icon: "⚔️",
      accent: "text-red-500",
      bgAccent: "from-red-600/10 to-red-700/10",
      borderAccent: "border-red-600/30",
    },
  ];

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 safe-area-top">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-white text-3xl font-black">VELLERA COMBAT</h1>
        <p className="text-red-400 text-sm font-semibold">
          Unleash your inner warrior. Full intensity. No limits.
        </p>
      </div>

      {/* Combat Anthem Toggle */}
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/20 border border-red-700/50 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${anthemPlaying ? "bg-red-500 animate-pulse" : "bg-gray-600"}`} />
          <div>
            <p className="text-white font-bold">Combat Anthem</p>
            <p className="text-red-300 text-xs">Aggressive Hip Hop / Metal</p>
          </div>
        </div>
        <button
          onClick={() => setAnthemPlaying(!anthemPlaying)}
          className="p-3 rounded-full bg-red-600/20 hover:bg-red-600/40 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {anthemPlaying ? (
            <Volume2 className="w-5 h-5 text-red-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Combat Categories */}
      <div className="space-y-3">
        {combatCategories.map((cat) => (
          <button
            key={cat.title}
            onClick={() => navigate(cat.route)}
            className={`w-full bg-gradient-to-br ${cat.bgAccent} border ${cat.borderAccent} rounded-xl p-5 text-left hover:border-opacity-100 transition-all group min-h-[44px]`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="text-white font-black text-lg">{cat.title}</h3>
                </div>
                <p className="text-gray-300 text-sm">{cat.subtitle}</p>
              </div>
              <div className={`${cat.accent} group-hover:scale-110 transition-transform`}>
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Combat Stats */}
      <div className="bg-gray-950 border border-red-900/30 rounded-xl p-4 space-y-3">
        <p className="text-red-400 text-xs uppercase tracking-widest font-bold">
          Combat History
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-red-400 text-2xl font-black">28</p>
            <p className="text-gray-500 text-xs">Sessions</p>
          </div>
          <div>
            <p className="text-orange-400 text-2xl font-black">12h</p>
            <p className="text-gray-500 text-xs">Total Time</p>
          </div>
          <div>
            <p className="text-red-500 text-2xl font-black">🔥</p>
            <p className="text-gray-500 text-xs">On Fire</p>
          </div>
        </div>
      </div>

      {/* War Cry */}
      <div className="bg-red-950/20 border-2 border-red-600/50 rounded-xl p-4 text-center space-y-2">
        <p className="text-red-400 font-black text-lg">RISE & GRIND</p>
        <p className="text-gray-400 text-sm">Your next level starts now.</p>
      </div>
    </div>
  );
}
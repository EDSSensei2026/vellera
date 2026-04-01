import { useState } from "react";
import { Music, Zap, Flame, Shield, RotateCcw, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const [userName] = useState("Champion");

  const workoutCategories = [
    {
      title: "Warm-Up",
      subtitle: "Dynamic prep",
      icon: "🔥",
      color: "from-orange-500/20 to-orange-600/10",
      border: "border-orange-500/30",
    },
    {
      title: "Strength & Power",
      subtitle: "Lift, build, press",
      icon: "💪",
      color: "from-vellera-green/20 to-lime-600/10",
      border: "border-vellera-green/30",
    },
    {
      title: "Cardio & Conditioning",
      subtitle: "Endurance work",
      icon: "⚡",
      color: "from-vellera-blue/20 to-cyan-600/10",
      border: "border-vellera-blue/30",
    },
    {
      title: "Recovery & Mobility",
      subtitle: "Restore & prep",
      icon: "🧘",
      color: "from-purple-500/20 to-violet-600/10",
      border: "border-purple-500/30",
    },
  ];

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 safe-area-top overflow-auto">
      {/* App Hero Section */}
      <div className="bg-gradient-to-b from-vellera-blue/10 to-vellera-dark border border-vellera-blue/30 rounded-2xl p-6 space-y-3">
        <div>
          <h1 className="text-white text-3xl font-black">VELLERA</h1>
          <p className="text-vellera-blue text-sm font-bold tracking-wide">Command Your Training & Recovery</p>
        </div>
        <p className="text-vellera-muted text-sm leading-relaxed">
          Your all-in-one training platform for strength, endurance, combat sports, tactical conditioning, bodybuilding, and whole health. We combine biometric recovery data, AI coaching, and squad accountability to optimize every athlete—regardless of sport or level.
        </p>
        <p className="text-xs text-vellera-blue italic">"Vellera" = velocity + the warrior's path. Built for every athlete who trains with purpose.</p>
      </div>

      {/* Founders Section */}
      <div className="bg-commander-surface border border-commander-border rounded-2xl p-4 space-y-3">
        <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Built by Warriors</p>
        <div className="flex gap-4 items-center">
          <img
            src="https://media.base44.com/images/public/69c722c665db36b41f55ba9c/f5ddba3fd_Gemini_Generated_Image_y5i1n5y5i1n5y5i1.png"
            alt="Founders Asaad & Shauntze Morman"
            className="w-20 h-20 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-white font-bold text-sm">Asaad & Shauntze Morman</h3>
            <p className="text-commander-muted text-xs">Combat athletes, coaches, and recovery obsessives building the platform they wish existed.</p>
          </div>
        </div>
      </div>

      {/* How We Compare */}
      <div className="bg-commander-surface border border-commander-border rounded-2xl p-4 space-y-3">
        <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Why Vellera?</p>
        <div className="space-y-2 text-xs">
          <div className="flex gap-2 items-start">
            <CheckCircle className="w-4 h-4 text-vellera-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Recovery-First Design</p>
              <p className="text-commander-muted">Unlike generic fitness apps, we prioritize biometric recovery over simple calorie counting.</p>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle className="w-4 h-4 text-vellera-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Combat-Sport Specific</p>
              <p className="text-commander-muted">Built for BJJ, MMA, boxing—not generic CrossFit or running metrics.</p>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle className="w-4 h-4 text-vellera-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">Squad Accountability</p>
              <p className="text-commander-muted">Train with your crew. Real-time motivation & challenge tracking.</p>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle className="w-4 h-4 text-vellera-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">AI Coach That Listens</p>
              <p className="text-commander-muted">Contextual coaching based on YOUR recovery, not generic scripts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Device Integration */}
      <div className="bg-commander-surface border border-commander-border rounded-2xl p-4 space-y-3">
        <p className="text-xs text-commander-muted uppercase tracking-widest font-bold">Connected Devices</p>
        
        {/* Currently Supported */}
        <div>
          <p className="text-white text-xs font-bold mb-2 flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-400" /> Connected Now</p>
          <div className="grid grid-cols-2 gap-2">
            {["Whoop", "Fitbit", "Garmin", "Apple Watch", "Google Fit", "Strava"].map((device) => (
              <div key={device} className="bg-gray-800/50 rounded-lg px-3 py-2 text-center border border-green-800/30">
                <p className="text-white text-xs font-semibold">{device}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div>
          <p className="text-white text-xs font-bold mb-2 flex items-center gap-2"><Clock className="w-3 h-3 text-vellera-blue" /> Coming Soon</p>
          <div className="grid grid-cols-2 gap-2">
            {["Oura Ring", "WHOOP 5.0", "Polar H10", "Apple Health", "Rested AI", "TrainingPeaks"].map((device) => (
              <div key={device} className="bg-gray-800/30 rounded-lg px-3 py-2 text-center border border-vellera-blue/20">
                <p className="text-commander-muted text-xs font-semibold">{device}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header Greeting */}
      <div className="space-y-2">
        <h2 className="text-white text-2xl font-black">
          Welcome back, <span className="text-vellera-blue">{userName}</span>.
        </h2>
        <p className="text-vellera-muted text-sm">Let's find your pace today.</p>
      </div>

      {/* Music Integration Widget */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-vellera-blue/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-vellera-blue" />
          <h2 className="text-white font-bold text-lg">Bring your own energy</h2>
        </div>
        <p className="text-vellera-muted text-sm">
          Connect your favorite music streaming to power your workouts.
        </p>
        <div className="flex gap-2">
          <button className="flex-1 bg-vellera-blue/20 border border-vellera-blue hover:bg-vellera-blue/30 text-vellera-blue font-semibold py-3 rounded-lg transition-all">
            Spotify
          </button>
          <button className="flex-1 bg-vellera-blue/20 border border-vellera-blue hover:bg-vellera-blue/30 text-vellera-blue font-semibold py-3 rounded-lg transition-all">
            Apple Music
          </button>
        </div>
      </div>

      {/* Workout Categories Grid */}
      <div className="space-y-3">
        <p className="text-vellera-muted text-xs uppercase tracking-widest font-bold">
          Pick Your Workout
        </p>
        <div className="grid grid-cols-2 gap-3">
          {workoutCategories.map((cat) => (
            <button
              key={cat.title}
              className={`bg-gradient-to-br ${cat.color} border ${cat.border} rounded-xl p-4 text-left hover:border-opacity-100 transition-all min-h-[140px] flex flex-col justify-between`}
            >
              <div className="text-3xl">{cat.icon}</div>
              <div>
                <h3 className="text-white font-bold text-sm">{cat.title}</h3>
                <p className="text-vellera-muted text-xs">{cat.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex justify-around text-center">
        <div>
          <p className="text-vellera-green text-2xl font-black">12</p>
          <p className="text-vellera-muted text-xs">Workouts</p>
        </div>
        <div className="w-px bg-gray-700" />
        <div>
          <p className="text-vellera-blue text-2xl font-black">4.5</p>
          <p className="text-vellera-muted text-xs">Avg Rating</p>
        </div>
        <div className="w-px bg-gray-700" />
        <div>
          <p className="text-orange-400 text-2xl font-black">42</p>
          <p className="text-vellera-muted text-xs">Streak Days</p>
        </div>
      </div>
    </div>
  );
}
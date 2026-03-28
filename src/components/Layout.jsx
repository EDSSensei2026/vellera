import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Shield, Activity, BookOpen, Trophy, Users, Dumbbell, Video, Flame, Apple, BarChart2 } from "lucide-react";

const WARRIOR_IMAGES = [
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/9af62c059_2845.png",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/3d1213c6a_2825.jpg",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/96befed01_2826.jpg",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/112a5c2cc_2827.jpg",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/6d582ea34_2837.png",
];

const NAV = [
  { path: "/", label: "Command", icon: Shield },
  { path: "/training", label: "Log Session", icon: Activity },
  { path: "/techniques", label: "Skill Matrix", icon: BookOpen },
  { path: "/recovery", label: "Recovery", icon: Dumbbell },
  { path: "/competition", label: "Competition", icon: Trophy },
  { path: "/junior", label: "Junior", icon: Users },
  { path: "/vault", label: "Film", icon: Video },
  { path: "/blueprint", label: "Blueprint", icon: Flame },
  { path: "/food", label: "Fuel", icon: Apple },
  { path: "/progress", label: "XP", icon: BarChart2 },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setImgIndex(i => (i + 1) % WARRIOR_IMAGES.length), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-screen bg-commander-dark flex flex-col relative overflow-hidden">
      {/* Rotating Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {WARRIOR_IMAGES.map((src, i) => (
          <div key={src} className="absolute inset-0 transition-opacity duration-2000"
            style={{ opacity: i === imgIndex ? 1 : 0 }}>
            <img src={src} alt="" className="w-full h-full object-contain" />
          </div>
        ))}
        <div className="absolute inset-0 bg-commander-dark/60" />
      </div>
      {/* Hidden Background Music */}
      <div className="fixed -bottom-full -right-full" style={{opacity: 0, pointerEvents: 'none', width: 1, height: 1, overflow: 'hidden'}}>
        <iframe src="https://www.youtube.com/embed/Me6IG-fTQDI?autoplay=1&loop=1&playlist=Me6IG-fTQDI&controls=0&rel=0&mute=0" allow="autoplay; encrypted-media" title="Motivation Music 1" />
        <iframe src="https://www.youtube.com/embed/qTNcs3NSYWI?autoplay=1&loop=1&playlist=qTNcs3NSYWI&controls=0&rel=0&mute=0" allow="autoplay; encrypted-media" title="Motivation Music 2" />
      </div>

      {/* Top Header */}
      <header className="bg-commander-surface/95 backdrop-blur border-b border-commander-border px-4 py-3 flex items-center justify-between sticky top-0 z-50 relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-commander-red rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-widest uppercase">Mat-Commander</span>
            <div className="text-xs text-commander-muted">The Lab Edition</div>
          </div>
        </div>
        <div className="text-xs text-commander-muted font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="bg-commander-surface/95 backdrop-blur border-t border-commander-border px-2 py-2 sticky bottom-0 z-50">
        <div className="flex justify-around">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${
                  active ? "text-commander-red" : "text-commander-muted hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
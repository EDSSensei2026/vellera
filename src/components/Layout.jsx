import { useState, useEffect, useRef } from "react";
import DrillTimer from "./DrillTimer";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Shield, Activity, BookOpen, Trophy, Users, Dumbbell, Video, Flame, Apple, BarChart2, Swords, Zap } from "lucide-react";

const WARRIOR_IMAGES = [
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/9af62c059_2845.png",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/3d1213c6a_2825.jpg",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/96befed01_2826.jpg",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/112a5c2cc_2827.jpg",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/6d582ea34_2837.png",
];

const PRIMARY_NAV = [
  { path: "/", label: "Home", icon: Shield, id: "home" },
  { path: "/training", label: "Training", icon: Activity, id: "training" },
  { path: "/techniques", label: "Matrix", icon: BookOpen, id: "techniques" },
  { path: "/blueprint", label: "Blueprint", icon: Flame, id: "blueprint" },
  { path: "/combat", label: "Combat", icon: Zap, id: "combat", glow: true },
];

const MORE_NAV = [
  { path: "/recovery", label: "Recovery", icon: Dumbbell },
  { path: "/competition", label: "Competition", icon: Trophy },
  { path: "/junior", label: "Junior", icon: Users },
  { path: "/vault", label: "Film", icon: Video },
  { path: "/food", label: "Fuel", icon: Apple },
  { path: "/progress", label: "XP", icon: BarChart2 },
  { path: "/partners", label: "Partners", icon: Swords },
  { path: "/hub", label: "Training Hub", icon: BookOpen },
  { path: "/wellness", label: "Wellness", icon: Apple },
  { path: "/events", label: "Events", icon: Trophy },
  { path: "/settings", label: "Settings", icon: Shield },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [imgIndex, setImgIndex] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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
      {/* Background Music iframes - shown after user clicks play */}
      {musicOn && (
        <div style={{ position: 'fixed', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          <iframe src={`https://www.youtube.com/embed/Me6IG-fTQDI?autoplay=1&loop=1&playlist=Me6IG-fTQDI&controls=0&rel=0&mute=${muted ? 1 : 0}`} allow="autoplay; encrypted-media" title="Music 1" />
        </div>
      )}

      <DrillTimer />

      {/* Music Toggle Button */}
      <button
        onClick={() => { if (!musicOn) { setMusicOn(true); } else { setMuted(m => !m); } }}
        className="fixed bottom-20 right-3 z-50 w-9 h-9 rounded-full bg-commander-surface border border-commander-border flex items-center justify-center text-base shadow-lg hover:border-commander-red transition-all"
        title={musicOn ? (muted ? 'Unmute music' : 'Mute music') : 'Play music'}
      >
        {!musicOn ? '🎵' : muted ? '🔇' : '🔊'}
      </button>

      {/* Top Header */}
      <header className="bg-commander-surface/95 backdrop-blur border-b border-commander-border px-4 py-3 flex items-center justify-between sticky top-0 z-50 pt-safe">
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

      {/* Page Content - Tab Stack */}
      <main className="flex-1 overflow-hidden relative z-10">
        {/* Each tab stays mounted in DOM, switches visibility */}
        <div className={`absolute inset-0 overflow-auto ${pathname === "/" ? "block" : "hidden"}`}>
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Bottom Nav - 5 tabs */}
      <nav className="bg-commander-surface/95 backdrop-blur border-t border-commander-border px-2 py-2 fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="flex justify-around">
          {PRIMARY_NAV.map(({ path, label, icon: Icon, glow }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all touch-target-min ${
                  active ? (glow ? "text-red-500 drop-shadow-lg drop-shadow-red-500/50" : "text-commander-red") : "text-commander-muted hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
            })}
            {/* More button */}
            <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all text-commander-muted hover:text-white touch-target-min"
          >
            <div className="w-5 h-5 flex items-center justify-center">⋯</div>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="bg-commander-surface border-t border-commander-border">
          <DrawerHeader className="border-b border-commander-border">
            <DrawerTitle className="text-white">More Options</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[60vh] overflow-y-auto pb-4">
            {MORE_NAV.map(({ path, label, icon: Icon }) => {
              const active = pathname === path;
              return (
                <DrawerClose key={path} asChild>
                  <Link
                    to={path}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-commander-border hover:bg-gray-800 transition-all min-h-[44px] ${
                      active ? "text-commander-red" : "text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{label}</span>
                  </Link>
                </DrawerClose>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
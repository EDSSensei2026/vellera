import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import DrillTimer from "./DrillTimer";
import VelleraBackground from "./VelleraBackground";
import SpotifyPlayer from "./SpotifyPlayer";
import BackgroundImageManager from "./BackgroundImageManager";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Shield, Activity, BookOpen, Trophy, Users, Dumbbell, Video, Flame, Apple, BarChart2, Swords, Zap, CalendarDays } from "lucide-react";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
  "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
  "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&q=80",
];

const PRIMARY_NAV = [
  { path: "/", label: "Home", icon: Shield, id: "home" },
  { path: "/training", label: "Training", icon: Activity, id: "training" },
  { path: "/techniques", label: "Matrix", icon: BookOpen, id: "techniques" },
  { path: "/blueprint", label: "Blueprint", icon: Flame, id: "blueprint" },
  { path: "/combat", label: "Combat", icon: Zap, id: "combat", glow: true },
];

const MORE_NAV = [
  { path: "/coach", label: "AI Coach", icon: Zap },
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
  { path: "/squads", label: "Squads", icon: Users },
  { path: "/wearables", label: "Wearables", icon: Activity },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/settings", label: "Settings", icon: Shield },
];

// Tab stack component - keeps its own scroll position and state
function TabStack({ tabId, currentTabId, children, scrollRefs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const isActive = currentTabId === tabId;
    
    if (isActive && scrollRefs.current[tabId]) {
      // Restore scroll position when tab becomes active
      containerRef.current.scrollTop = scrollRefs.current[tabId];
    }
  }, [currentTabId, tabId, scrollRefs]);

  const handleScroll = () => {
    if (containerRef.current) {
      scrollRefs.current[tabId] = containerRef.current.scrollTop;
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`absolute inset-0 overflow-auto transition-opacity duration-200 ${
        currentTabId === tabId ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      key={`tab-${tabId}`}
      style={{ overscrollBehavior: 'contain' }}
    >
      {children}
    </div>
  );
}

export default function TabStackLayout() {
  const { pathname } = useLocation();
  const [imgIndex, setImgIndex] = useState(0);
  const [allImages, setAllImages] = useState(DEFAULT_IMAGES);
  const [bgManagerOpen, setBgManagerOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const scrollRefs = useRef({});

  // Enforce strict dark mode on Android
  useEffect(() => {
    if (window.navigator.userAgent.includes("Android")) {
      document.documentElement.style.colorScheme = "dark";
    }
  }, []);

  useEffect(() => {
    base44.entities.UserBackgroundImage.filter({ is_active: true })
      .then(userImgs => {
        const urls = userImgs.map(i => i.image_url).filter(Boolean);
        setAllImages(urls.length > 0 ? [...DEFAULT_IMAGES, ...urls] : DEFAULT_IMAGES);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setImgIndex(i => (i + 1) % allImages.length), 8000);
    return () => clearInterval(t);
  }, [allImages]);

  // Map current path to tab ID
  const getCurrentTabId = () => {
    const tab = PRIMARY_NAV.find(nav => nav.path === pathname);
    return tab ? tab.id : "home";
  };

  const currentTabId = getCurrentTabId();

  // Reset scroll when pathname changes
  useEffect(() => {
    if (scrollRefs.current[currentTabId]) {
      scrollRefs.current[currentTabId] = 0;
    }
  }, [pathname]);

  return (
    <div className="h-screen bg-commander-dark flex flex-col relative overflow-hidden">
      {/* Vellera Animated Background */}
      <VelleraBackground />

      {/* Rotating Background */}
      <div className="fixed inset-0 z-1 pointer-events-none" style={{ overscrollBehavior: 'contain' }}>
        {allImages.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-2000"
          style={{ opacity: i === imgIndex ? 1 : 0 }}
        >
          <img src={src} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
        <div className="absolute inset-0 bg-commander-dark/60" />
      </div>

      {/* Background Music iframes - shown after user clicks play */}
      {musicOn && (
        <div style={{ position: "fixed", left: -9999, top: -9999, width: 1, height: 1, overflow: "hidden" }}>
          <iframe
            src={`https://www.youtube.com/embed/Me6IG-fTQDI?autoplay=1&loop=1&playlist=Me6IG-fTQDI&controls=0&rel=0&mute=${muted ? 1 : 0}`}
            allow="autoplay; encrypted-media"
            title="Music 1"
          />
        </div>
      )}

      <DrillTimer />

      {/* Music Toggle Button */}
      <button
        onClick={() => setSpotifyOpen(!spotifyOpen)}
        className="fixed bottom-20 right-3 z-50 w-9 h-9 rounded-full bg-green-700 border border-green-600 flex items-center justify-center text-base shadow-lg hover:bg-green-600 transition-all safe-area-bottom"
        title="Open Spotify Player"
      >
        🎵
      </button>

      {/* Spotify Player Modal */}
      {spotifyOpen && (
        <div className="fixed bottom-20 right-3 z-50 w-80 max-h-96 shadow-2xl rounded-xl overflow-hidden">
          <button
            onClick={() => setSpotifyOpen(false)}
            className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full w-6 h-6 flex items-center justify-center"
          >
            ✕
          </button>
          <SpotifyPlayer />
        </div>
      )}

      {/* Top Header */}
      <header className="bg-commander-surface/95 backdrop-blur border-b border-commander-border px-4 py-3 flex items-center justify-between sticky top-0 z-50 safe-area-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-commander-red rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-widest uppercase">Apex Forge</span>
            <div className="text-xs text-commander-muted">Train Everything</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBgManagerOpen(true)}
            title="My Motivation Wall"
            className="text-xs text-commander-muted hover:text-white transition-all px-2 py-1 rounded-lg hover:bg-gray-800"
          >
            🖼️
          </button>
          <div className="text-xs text-commander-muted font-mono">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>
      </header>

      {/* Page Content - Independent Tab Stacks */}
      <main className="flex-1 overflow-hidden relative z-10">
        {PRIMARY_NAV.map(nav => (
          <TabStack key={nav.id} tabId={nav.id} currentTabId={currentTabId} scrollRefs={scrollRefs}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </TabStack>
        ))}
      </main>

      {/* Bottom Nav - 5 tabs */}
      <nav className="bg-commander-surface/95 backdrop-blur border-t border-commander-border px-2 py-3 fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="flex justify-around">
          {PRIMARY_NAV.map(({ path, label, icon: Icon, glow }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  active
                    ? glow
                      ? "text-red-500 drop-shadow-lg drop-shadow-red-500/50"
                      : "text-commander-red"
                    : "text-commander-muted hover:text-white"
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

      <BackgroundImageManager open={bgManagerOpen} onOpenChange={setBgManagerOpen} />

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
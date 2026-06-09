import { useState } from "react";
import { base44 } from "@/api/base44Client";
import BJJBadgesShowcase from "../components/BJJBadgesShowcase";
import { ChevronRight, Shield, Lock, Eye, Database, ChevronLeft, Star, Activity, Brain, Dumbbell, Heart, Users, BarChart3, Calendar, Video, Target, Award, Flame } from "lucide-react";
import { Link } from "react-router-dom";

// ─── App Screen Mockup ────────────────────────────────────────────────────────
function AppScreen({ title, icon: Icon, color, children }) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-black" />
        </div>
        <span className="text-white font-bold text-sm">{title}</span>
        <div className="ml-auto flex gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────
function StatBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-bold">{value}/{max}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-black" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Security Badge ───────────────────────────────────────────────────────────
function SecurityBadge({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-vellera-blue/20 border border-vellera-blue/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-vellera-blue" />
      </div>
      <div>
        <p className="text-white font-bold text-sm">{title}</p>
        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Main Landing ─────────────────────────────────────────────────────────────
export default function Landing() {
  const [reviewIndex, setReviewIndex] = useState(0);

  const reviews = [
    { name: "Jordan M.", role: "BJJ Athlete", text: "Finally, an app that gets combat sports. The MMA timers and grappling flows are exactly what I needed. No generic fitness noise.", rating: 5 },
    { name: "Maya P.", role: "Fitness Beginner", text: "I was intimidated by fitness apps, but Vellera's interface is clean and welcoming. The mobility routines are perfect for my pace.", rating: 5 },
    { name: "Alex T.", role: "Strength Coach", text: "The AI recovery predictions are game-changing. I can now adjust my athletes' load before they hit a wall, not after.", rating: 5 },
  ];

  const features = [
    { icon: Brain, title: "AI Coach", color: "bg-vellera-blue", desc: "Your 24/7 personal coach powered by AI. Get real-time form feedback, training adjustments, and personalized programming based on your biometrics and goals." },
    { icon: Activity, title: "Biometrics & Wearables", color: "bg-vellera-green", desc: "Connect Whoop, Strava, Polar, Fitbit, and Google Fit. See your HRV, strain, recovery score, and sleep data in one unified dashboard." },
    { icon: Dumbbell, title: "Lift Analysis", color: "bg-purple-400", desc: "Upload a video of your lift and get AI-powered form analysis, technique error detection, and safety alerts — like having a certified coach in your pocket." },
    { icon: Target, title: "BJJ & Combat", color: "bg-orange-400", desc: "Dedicated tools for BJJ, MMA, boxing, and wrestling. Technique library, sparring logs, belt progression tracker, and tactical journal." },
    { icon: BarChart3, title: "Progress Tracking", color: "bg-yellow-400", desc: "Track every metric that matters: strength PRs, body composition, training volume, consistency streaks, and performance correlation charts." },
    { icon: Heart, title: "Wellness & Recovery", color: "bg-red-400", desc: "Daily readiness check-ins, pain tracking, sleep quality monitoring, and AI-powered recovery predictions to keep you training safely." },
    { icon: Users, title: "Squads & Coaching", color: "bg-cyan-400", desc: "Join training squads, challenge friends, assign tasks as a coach, review student videos, and track your athletes' progress in real time." },
    { icon: Calendar, title: "Smart Scheduling", color: "bg-green-400", desc: "AI-generated training calendars that auto-adjust based on your recovery scores, upcoming events, and historical performance data." },
    { icon: Video, title: "Video Vault", color: "bg-pink-400", desc: "Store, organize, and analyze your technique videos. Draw on frames with the telestration tool to highlight movement patterns and corrections." },
  ];

  return (
    <div className="bg-gray-950 min-h-screen text-white overflow-hidden font-inter">

      {/* Beta Banner */}
      <div className="bg-yellow-900/40 border-b border-yellow-700/50 px-4 py-2.5 text-center">
        <p className="text-sm text-yellow-300 font-semibold">
          ⚠️ <span className="uppercase tracking-widest text-xs">Beta</span> — Awaiting App Store & Play Store approval. Available now as a web app.
        </p>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative px-4 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-vellera-blue/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-vellera-green/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-vellera-blue/10 border border-vellera-blue/30 rounded-full px-4 py-1.5">
                <Flame className="w-4 h-4 text-vellera-blue" />
                <span className="text-vellera-blue text-xs font-bold uppercase tracking-widest">Your All-In-One Training OS</span>
              </div>

              <div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
                  Train Smarter.<br />
                  Recover Faster.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-vellera-blue to-vellera-green">Own Your Data.</span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                  Vellera is the complete training platform for strength athletes, combat sports practitioners, and hybrid athletes — with AI coaching, biometric integration, and clinical-grade privacy.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/beta-request"
                  className="px-8 py-4 bg-gradient-to-r from-vellera-blue to-vellera-green text-black font-black rounded-xl text-lg hover:shadow-2xl hover:shadow-vellera-blue/30 transition-all flex items-center justify-center gap-2"
                >
                  Join Beta (Invite-Only) <ChevronRight className="w-5 h-5" />
                </Link>
                <button disabled className="px-8 py-4 bg-gray-800 text-gray-400 font-bold rounded-xl text-lg cursor-not-allowed flex items-center justify-center gap-2">
                  📱 Coming to App Stores
                </button>
              </div>

              <p className="text-gray-500 text-sm">✨ No credit card required · Full access · Cancel anytime</p>
            </div>

            {/* App Mockups */}
            <div className="space-y-4 hidden lg:block">
              <AppScreen title="Dashboard" icon={Activity} color="bg-vellera-blue">
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Today's Readiness</p>
                      <p className="text-3xl font-black text-vellera-green">87%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Streak</p>
                      <p className="text-2xl font-black text-vellera-blue">🔥 23</p>
                    </div>
                  </div>
                  <StatBar label="HRV Score" value={68} max={100} color="bg-vellera-green" />
                  <StatBar label="Sleep Quality" value={7.5} max={10} color="bg-vellera-blue" />
                  <StatBar label="Training Load" value={72} max={100} color="bg-purple-500" />
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {["Strength", "Combat", "Recovery"].map(t => (
                      <div key={t} className="bg-gray-800 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">{t}</p>
                        <p className="text-vellera-blue font-bold text-sm">Active</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AppScreen>

              <AppScreen title="AI Coach Analysis" icon={Brain} color="bg-vellera-green">
                <div className="space-y-2">
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-vellera-blue font-bold mb-1">AI Coach · Now</p>
                    <p className="text-sm text-gray-200 leading-relaxed">Based on your HRV drop and yesterday's heavy squat session, I recommend reducing today's volume by 20%. Focus on technique work instead of max effort.</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-vellera-green font-bold mb-1">Form Analysis · Squat</p>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-black text-vellera-green">82</div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-300">Knee cave detected on left side. Cue: drive knees out, engage glutes at bottom.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AppScreen>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE NAME ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 border-t border-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-vellera-blue font-bold uppercase tracking-[0.3em] mb-4">The Name</p>
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-vellera-blue to-vellera-green">Vellera</span>
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Derived from the Latin <em className="text-white font-semibold">vellere</em> — meaning <span className="text-vellera-green font-bold">"to pull, to draw out, to forge"</span> — Vellera represents the act of pulling your best self forward. It speaks to the tension athletes live in: pushing through resistance, drawing strength from discipline, and forging identity through consistent effort.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                root: "vellere",
                lang: "Latin",
                meaning: "To pull, to draw out",
                interpretation: "Every rep, every roll, every session is you pulling forward — extracting strength that wasn't accessible yesterday."
              },
              {
                root: "vel",
                lang: "Proto-Indo-European",
                meaning: "Power & will",
                interpretation: "The root 'vel' traces back to words for want, will, and volition — the internal drive that separates those who train from those who transform."
              },
              {
                root: "-era",
                lang: "Suffix · Latin",
                meaning: "A time, a defining period",
                interpretation: "This is your era. Not a season, not a phase — a defined chapter in which you chose to take your body, mind, and discipline seriously."
              },
            ].map(({ root, lang, meaning, interpretation }) => (
              <div key={root} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-all">
                <div className="mb-3">
                  <p className="text-vellera-blue font-black text-xl italic">{root}</p>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">{lang}</p>
                </div>
                <p className="text-vellera-green font-bold text-sm mb-2">{meaning}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{interpretation}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 bg-gradient-to-r from-vellera-blue/10 to-vellera-green/10 border border-vellera-blue/20 rounded-2xl px-8 py-6">
            <p className="text-white text-xl font-black italic">
              "You are not just tracking workouts. You are in the process of becoming."
            </p>
            <p className="text-commander-muted text-sm mt-2">— The Vellera Philosophy</p>
          </div>
        </div>
      </section>

      {/* ── APP FEATURE SCREENSHOTS ───────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Everything You Need to Level Up</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">From your first workout to elite competition prep — Vellera has purpose-built tools for every goal.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── LIVE APP SCREENS DEMO ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-900/30 border-y border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">See It In Action</h2>
            <p className="text-gray-400 text-xl">Real screens from inside the app</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Training Log Screen */}
            <AppScreen title="Training Log" icon={Dumbbell} color="bg-purple-400">
              <div className="space-y-2">
                {[
                  { name: "Back Squat", sets: "5×5", weight: "285 lbs", pr: true },
                  { name: "Romanian Deadlift", sets: "4×8", weight: "225 lbs", pr: false },
                  { name: "Bulgarian Split Squat", sets: "3×10", weight: "135 lbs", pr: false },
                ].map((ex, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-white text-xs font-bold">{ex.name}</p>
                      <p className="text-gray-400 text-xs">{ex.sets} @ {ex.weight}</p>
                    </div>
                    {ex.pr && <span className="text-xs bg-vellera-green/20 text-vellera-green border border-vellera-green/30 px-2 py-0.5 rounded font-bold">PR 🏆</span>}
                  </div>
                ))}
                <div className="bg-vellera-blue/10 border border-vellera-blue/20 rounded-lg px-3 py-2 text-center mt-2">
                  <p className="text-vellera-blue text-xs font-bold">Volume: 18,450 lbs · +12% vs last week</p>
                </div>
              </div>
            </AppScreen>

            {/* BJJ Tactical Journal */}
            <AppScreen title="BJJ Tactical Journal" icon={Target} color="bg-orange-400">
              <div className="space-y-2">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white text-xs font-bold">Sunday Open Mat</p>
                    <span className="text-xs text-orange-400 font-bold">Blue Belt</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">Worked X-guard sweeps, 3 successful entries. Submitted twice via rear naked choke.</p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">X-Guard</span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">Back Take</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-800 rounded-lg p-2 text-center"><p className="text-vellera-green text-lg font-black">14</p><p className="text-gray-500 text-xs">Techniques</p></div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center"><p className="text-vellera-blue text-lg font-black">6</p><p className="text-gray-500 text-xs">Mastered</p></div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center"><p className="text-yellow-400 text-lg font-black">3</p><p className="text-gray-500 text-xs">In Drill</p></div>
                </div>
              </div>
            </AppScreen>

            {/* Recovery Predictor */}
            <AppScreen title="Recovery Predictor" icon={Heart} color="bg-red-400">
              <div className="space-y-3">
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tomorrow's Predicted Readiness</p>
                  <p className="text-4xl font-black text-vellera-green">91%</p>
                  <p className="text-xs text-gray-400 mt-1">Based on sleep, HRV trend & load</p>
                </div>
                <div className="space-y-1">
                  {[
                    { label: "Sleep Debt", val: "Low ✓", color: "text-vellera-green" },
                    { label: "Muscle Fatigue", val: "Moderate", color: "text-yellow-400" },
                    { label: "CNS Stress", val: "Low ✓", color: "text-vellera-green" },
                    { label: "HRV Trend", val: "Rising ↑", color: "text-vellera-blue" },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between bg-gray-800 rounded px-3 py-1.5">
                      <span className="text-gray-400 text-xs">{r.label}</span>
                      <span className={`text-xs font-bold ${r.color}`}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AppScreen>

            {/* Squad Challenges */}
            <AppScreen title="Squad Challenges" icon={Users} color="bg-cyan-400">
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-vellera-blue/20 to-vellera-green/20 border border-vellera-blue/30 rounded-xl p-3 mb-3">
                  <p className="text-xs text-vellera-blue font-bold uppercase tracking-wider">Active Challenge</p>
                  <p className="text-white font-bold">30-Day Consistency Forge</p>
                  <div className="h-1.5 bg-gray-800 rounded-full mt-2">
                    <div className="h-1.5 bg-gradient-to-r from-vellera-blue to-vellera-green rounded-full" style={{ width: "73%" }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">22 of 30 days · You're in 2nd place</p>
                </div>
                {["Jordan M.", "You", "Alex T."].map((name, i) => (
                  <div key={name} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{i + 1}</span>
                      <span className="text-white text-xs font-bold">{name}</span>
                    </div>
                    <span className="text-vellera-green text-xs font-bold">{[28, 22, 19][i]} days</span>
                  </div>
                ))}
              </div>
            </AppScreen>

            {/* Nutrition / Macros */}
            <AppScreen title="Macro Tracker" icon={BarChart3} color="bg-yellow-400">
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">2,847</p>
                    <p className="text-xs text-gray-500">kcal consumed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-vellera-green">+153</p>
                    <p className="text-xs text-gray-500">kcal remaining</p>
                  </div>
                </div>
                <StatBar label="Protein" value={218} max={260} color="bg-vellera-blue" />
                <StatBar label="Carbs" value={312} max={350} color="bg-yellow-400" />
                <StatBar label="Fat" value={78} max={90} color="bg-orange-400" />
                <div className="bg-vellera-green/10 border border-vellera-green/30 rounded-lg px-3 py-2 mt-2">
                  <p className="text-xs text-vellera-green font-bold">AI: Great protein intake today. Add 50g carbs pre-workout.</p>
                </div>
              </div>
            </AppScreen>

            {/* Progress / Stats */}
            <AppScreen title="Strength Progress" icon={Award} color="bg-pink-400">
              <div className="space-y-2">
                {[
                  { lift: "Squat", current: 285, start: 225, unit: "lbs" },
                  { lift: "Deadlift", current: 365, start: 295, unit: "lbs" },
                  { lift: "Bench", current: 215, start: 175, unit: "lbs" },
                ].map(l => (
                  <div key={l.lift} className="bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-white text-xs font-bold">{l.lift}</p>
                      <p className="text-vellera-green text-xs font-bold">+{l.current - l.start} {l.unit}</p>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full">
                      <div className="h-1.5 bg-vellera-green rounded-full" style={{ width: `${(l.start / l.current) * 100}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{l.start} {l.unit}</span>
                      <span className="text-xs text-vellera-blue font-bold">{l.current} {l.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </AppScreen>
          </div>
        </div>
      </section>

      {/* ── DATA CONTROL & PRIVACY ────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="inline-flex items-center gap-2 bg-vellera-blue/10 border border-vellera-blue/30 rounded-full px-4 py-1.5 mb-6">
                <Shield className="w-4 h-4 text-vellera-blue" />
                <span className="text-vellera-blue text-xs font-bold uppercase tracking-widest">Your Data, Your Control</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">Privacy-First.<br />By Design.</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Vellera was built from the ground up with data sovereignty in mind. Your health data is sensitive — we treat it that way. You own your data, always.
              </p>
              <div className="space-y-6">
                <SecurityBadge icon={Lock} title="End-to-End Encryption" desc="All health metrics, biometrics, and medical data are encrypted in transit and at rest. Your clinical assessments are never shared without explicit consent." />
                <SecurityBadge icon={Eye} title="Granular Consent Controls" desc="You decide exactly who sees what. Share specific data with your coach, keep medical notes private, or revoke access at any time — instantly." />
                <SecurityBadge icon={Database} title="Data Portability" desc="Export all your data at any time in standard formats. No lock-in. Your training history, assessments, and nutrition logs belong to you." />
                <SecurityBadge icon={Shield} title="HIPAA-Aligned Architecture" desc="Clinical assessments use FHIR-compliant data structures. Sensitive fields like medical notes have row-level security enforced at the database level." />
                <SecurityBadge icon={Users} title="Role-Based Access" desc="Coaches see what athletes share. Clinicians have separate secure notes. Admins operate with audited privilege levels. Zero over-sharing by default." />
              </div>
            </div>

            <div className="space-y-4">
              {/* Privacy Control Panel Mockup */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-white font-black text-lg mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-vellera-blue" /> Privacy Control Center</p>
                <div className="space-y-3">
                  {[
                    { label: "Share Biometrics with Coach", on: true, color: "bg-vellera-green" },
                    { label: "Share Medical Notes with Coach", on: false, color: "bg-gray-600" },
                    { label: "Allow Squad to View Streak", on: true, color: "bg-vellera-green" },
                    { label: "Include in Leaderboard", on: true, color: "bg-vellera-green" },
                    { label: "Share Nutrition Data", on: false, color: "bg-gray-600" },
                    { label: "Allow AI Training Insights", on: true, color: "bg-vellera-green" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                      <p className="text-gray-200 text-sm">{item.label}</p>
                      <div className={`w-10 h-6 rounded-full flex items-center px-1 ${item.on ? "bg-vellera-green/30 border border-vellera-green/50" : "bg-gray-700"}`}>
                        <div className={`w-4 h-4 rounded-full transition-all ${item.on ? "bg-vellera-green ml-auto" : "bg-gray-500"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-white font-bold mb-4">Your Data Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Workouts Logged", val: "247", color: "text-vellera-blue" },
                    { label: "Data Points Collected", val: "14.2K", color: "text-vellera-green" },
                    { label: "Shared with Coach", val: "12%", color: "text-yellow-400" },
                    { label: "Private (Only You)", val: "88%", color: "text-purple-400" },
                  ].map(d => (
                    <div key={d.label} className="bg-gray-800 rounded-xl p-3 text-center">
                      <p className={`text-2xl font-black ${d.color}`}>{d.val}</p>
                      <p className="text-gray-500 text-xs mt-1">{d.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-vellera-blue/10 border border-vellera-blue/20 rounded-xl p-3">
                  <p className="text-vellera-blue text-xs font-bold text-center">🔐 Your data is never sold. Never shared without consent.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY VELLERA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-900/30 border-y border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Why Vellera Wins</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-400">Other Fitness Apps</h3>
              <ul className="space-y-4">
                {["One-size-fits-all workouts", "Your data monetized by the platform", "No real integration with wearables", "Generic AI with no context", "Siloed — nutrition OR training OR recovery"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="text-red-500 font-bold mt-0.5">✕</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-vellera-blue/10 to-vellera-green/10 border border-vellera-blue/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-white">Vellera</h3>
              <ul className="space-y-4">
                {["Purpose-built paths: strength, BJJ, endurance, bodybuilding, tactical", "You own your data — always portable, always private", "Native Whoop, Strava, Polar, Fitbit, Google Fit sync", "AI coach with full context: biometrics + history + goals", "Fully unified: training + nutrition + recovery + coaching"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white">
                    <span className="text-vellera-green font-bold mt-0.5">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">What Athletes Say</h2>
          </div>
          <div className="relative">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 min-h-56 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4">{Array(reviews[reviewIndex].rating).fill(0).map((_, i) => <Star key={i} className="w-5 h-5 fill-vellera-green text-vellera-green" />)}</div>
                <p className="text-xl text-gray-200 mb-6 italic">"{reviews[reviewIndex].text}"</p>
              </div>
              <div>
                <p className="font-bold text-white">{reviews[reviewIndex].name}</p>
                <p className="text-vellera-blue text-sm">{reviews[reviewIndex].role}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-8">
              <button onClick={() => setReviewIndex(i => (i - 1 + reviews.length) % reviews.length)} className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-vellera-blue transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex gap-2">{reviews.map((_, i) => <button key={i} onClick={() => setReviewIndex(i)} className={`h-2 rounded-full transition-all ${i === reviewIndex ? "bg-vellera-blue w-8" : "bg-gray-600 w-2"}`} />)}</div>
              <button onClick={() => setReviewIndex(i => (i + 1) % reviews.length)} className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-vellera-blue transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ── BADGES ───────────────────────────────────────────────────────── */}
      <BJJBadgesShowcase />

      {/* ── CREATORS ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-900/30 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">Meet the Creators</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-vellera-blue/10 to-vellera-green/10 flex items-center justify-center p-8">
              <img src="https://media.base44.com/images/public/69c722c665db36b41f55ba9c/69137a96a_Gemini_Generated_Image_y5i1n5y5i1n5y5i1.png" alt="Asaad & Shauntze Morman" className="w-full h-auto max-h-[500px] object-contain" />
            </div>
            <div className="grid md:grid-cols-2 gap-8 p-8">
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-vellera-blue">Asaad Morman</h3>
                <p className="text-white font-bold text-xs uppercase tracking-widest">Founder & Creator</p>
                <p className="text-gray-300 text-sm leading-relaxed">Military veteran, martial artist, strength coach, and tactical specialist. Decades of experience across combat sports, strength training, and human performance.</p>
                <a href="https://cyberdojosensai.org" target="_blank" rel="noopener noreferrer" className="inline-block text-vellera-blue font-bold text-sm hover:text-vellera-green transition">cyberdojosensai.org →</a>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-vellera-green">Shauntze Morman</h3>
                <p className="text-white font-bold text-xs uppercase tracking-widest">Co-Founder</p>
                <p className="text-gray-300 text-sm leading-relaxed">EMT, firefighter, dispatcher, and fitness educator. Real-world functional fitness expertise and deep understanding of performance for strength, endurance, and competition.</p>
                <a href="https://shauntzemorman.info" target="_blank" rel="noopener noreferrer" className="inline-block text-vellera-green font-bold text-sm hover:text-vellera-blue transition">shauntzemorman.info →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-4">Ready to Own Your Training?</h2>
          <p className="text-gray-400 text-lg mb-10">Join athletes who train smarter with AI coaching, real biometric data, and full control over their health data.</p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link to="/beta-request" className="px-10 py-5 bg-gradient-to-r from-vellera-blue to-vellera-green text-black font-black rounded-2xl text-lg hover:shadow-2xl hover:shadow-vellera-blue/40 transition-all">
              Request Beta Access
            </Link>
            <span className="text-gray-500 text-sm">or</span>
            <button onClick={() => base44.auth.redirectToLogin('/dashboard')} className="px-10 py-5 bg-gray-800 text-white font-black rounded-2xl text-lg hover:bg-gray-700 transition-all border border-gray-700">
              Sign In
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-4">✨ 30-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-gray-950 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <p className="font-bold text-vellera-blue mb-4">Vellera</p>
              <p className="text-sm text-gray-500">Training for every path. Built with discipline.</p>
            </div>
            <div>
              <p className="font-bold mb-4 text-gray-300">Resources</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="https://cyberdojosensai.org" target="_blank" rel="noopener noreferrer" className="hover:text-vellera-blue transition">Cyberdo Jo Sensai</a></li>
                <li><Link to="/privacy" className="hover:text-vellera-blue transition">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4 text-gray-300">Legal</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/terms" className="hover:text-vellera-blue transition">Terms of Service</Link></li>
                <li><a href="mailto:vellera@eds-360.com" className="hover:text-vellera-blue transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4 text-gray-300">Connect</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="https://www.facebook.com/share/18NyHszzDX/" target="_blank" rel="noopener noreferrer" className="hover:text-vellera-blue transition">Facebook</a></li>
                <li><a href="https://instagram.com/vellerafitness" target="_blank" rel="noopener noreferrer" className="hover:text-vellera-blue transition">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2026 Vellera. Built with discipline.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
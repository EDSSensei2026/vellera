import { useState } from "react";
import { useNavigate } from "react-router-dom";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import { assignTrack, getTrack } from "../lib/velleraTrack";
import { toast } from "sonner";

const STEPS = [
  {
    id: "goal",
    question: "What brings you to Vellera?",
    subtitle: "We'll build your personalized track around this.",
    options: [
      { value: "General Fitness & Health", icon: "💪", desc: "Get fit, feel great, build habits" },
      { value: "Strength & Power", icon: "🏋️", desc: "Powerlifting, strongman, max strength" },
      { value: "Bodybuilding & Hypertrophy", icon: "💪", desc: "Muscle building, aesthetics, physique" },
      { value: "Endurance & Conditioning", icon: "🏃", desc: "Running, cycling, long-distance athletics" },
      { value: "Tactical & First Responder Readiness", icon: "🛡️", desc: "Military, LEO, EMS — stay mission-ready" },
      { value: "Combat Sports & Competition", icon: "🥊", desc: "BJJ, MMA, boxing — fight-camp focus" },
      { value: "Rehab, Mobility & Whole Health", icon: "🧘", desc: "Recovery, MOVE!, VA Whole Health" },
    ],
  },
  {
    id: "journey",
    question: "Where are you in your journey?",
    subtitle: "Be honest — this helps us calibrate intensity.",
    options: [
      { value: "Just starting out / Getting back into it", icon: "🌱", desc: "Fresh start or returning after a break" },
      { value: "Consistent but want to level up", icon: "📈", desc: "Active already, pushing for more" },
      { value: "Preparing for a season/fight", icon: "🎯", desc: "Specific competition or season ahead" },
      { value: "Active Duty / Professional", icon: "⭐", desc: "Full-time athlete or operator" },
    ],
  },
  {
    id: "equipment",
    question: "Any equipment or physical limitations?",
    subtitle: "We'll only show you workouts you can actually do.",
    options: [
      { value: "Bodyweight only", icon: "🏠", desc: "Home training, no gear needed" },
      { value: "Full Gym Access", icon: "🏋️", desc: "Weights, machines, cables" },
      { value: "Heavy Bag / Mat Space", icon: "🥋", desc: "Combat sports setup" },
      { value: "Need low-impact/joint-friendly options", icon: "🦵", desc: "Injuries, arthritis, or recovery focus" },
    ],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ goal: null, journey: null, equipment: null });
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [assignedTrack, setAssignedTrack] = useState(null);

  const current = STEPS[step];
  const fieldKey = current?.id;
  const progress = ((step) / STEPS.length) * 100;

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleNext = async () => {
    if (!answers[fieldKey]) return;

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }

    // Final step — assign track and save
    setSaving(true);
    try {
      const track = assignTrack(answers.goal, answers.journey, answers.equipment);
      setAssignedTrack(getTrack(track));

      const existing = await base44.entities.UserProfile.filter({});
      const data = {
        onboarding_complete: true,
        onboarding_goal: answers.goal,
        onboarding_journey: answers.journey,
        onboarding_equipment: answers.equipment,
        vellera_track: track,
      };

      if (existing.length > 0) {
        await base44.entities.UserProfile.update(existing[0].id, data);
      } else {
        await base44.entities.UserProfile.create(data);
      }

      setShowResult(true);
    } catch (e) {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (showResult && assignedTrack) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-sm w-full space-y-6"
        >
          <div className="text-6xl">{assignedTrack.featured_routine.icon}</div>
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: assignedTrack.color }}>Your Vellera Track</p>
            <h1 className="text-white text-3xl font-black">{assignedTrack.label}</h1>
            <p className="text-gray-400 mt-2 text-sm">{assignedTrack.tagline}</p>
          </div>

          <div className="rounded-xl p-4 border" style={{ borderColor: assignedTrack.color + "40", backgroundColor: assignedTrack.color + "10" }}>
            <p className="text-xs uppercase tracking-widest mb-2 text-gray-400">Your First Workout</p>
            <p className="text-white font-bold text-base">{assignedTrack.featured_routine.title}</p>
            <p className="text-gray-400 text-xs mt-1">{assignedTrack.featured_routine.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {assignedTrack.focus_tags.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full border border-gray-700 text-gray-300">{tag}</span>
            ))}
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-xl font-black text-base text-black transition-all hover:opacity-90"
            style={{ backgroundColor: assignedTrack.color }}
          >
            Enter the App →
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col p-6 safe-area-top">
      {/* Progress Bar */}
      <div className="mb-8 mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Step {step + 1} of {STEPS.length}</p>
          <p className="text-xs font-bold" style={{ color: "#00E5FF" }}>{Math.round((step / STEPS.length) * 100 + 33)}%</p>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <motion.div
            className="h-1.5 rounded-full"
            style={{ backgroundColor: "#00E5FF" }}
            animate={{ width: `${(step / STEPS.length) * 100 + 33}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Logo */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#00E5FF" }}>VELLERA</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="flex-1 space-y-6"
        >
          <div>
            <h1 className="text-white text-2xl font-black leading-tight">{current.question}</h1>
            <p className="text-gray-500 text-sm mt-2">{current.subtitle}</p>
          </div>

          <div className="space-y-3">
            {current.options.map((opt) => {
              const selected = answers[fieldKey] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className="w-full text-left rounded-xl border p-4 transition-all min-h-[64px] flex items-center gap-4"
                  style={{
                    borderColor: selected ? "#00E5FF" : "#2a2a2a",
                    backgroundColor: selected ? "#00E5FF15" : "#1a1a1a",
                  }}
                >
                  <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{opt.value}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{opt.desc}</p>
                  </div>
                  {selected && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#00E5FF" }}>
                      <span className="text-black text-xs font-black">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 pb-8">
        <button
          onClick={handleNext}
          disabled={!answers[fieldKey] || saving}
          className="w-full py-4 rounded-xl font-black text-base text-black flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
          style={{ backgroundColor: "#00E5FF" }}
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Building your track...</>
          ) : step < STEPS.length - 1 ? (
            <>Continue <ChevronRight className="w-5 h-5" /></>
          ) : (
            <>Build My Track <ChevronRight className="w-5 h-5" /></>
          )}
        </button>

        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="w-full mt-3 py-3 text-gray-500 text-sm hover:text-white transition-colors">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
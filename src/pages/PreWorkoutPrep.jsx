import { useState } from "react";
import { Play, ChevronDown, ChevronUp, Shield, Zap, Wind } from "lucide-react";
import BackButton from "../components/BackButton";

const SECTIONS = [
  {
    id: "warmup",
    label: "Dynamic Warm-Up",
    icon: Zap,
    color: "text-yellow-400",
    border: "border-yellow-800",
    bg: "bg-yellow-950/20",
    duration: "8–10 min",
    description: "Raise core temp and activate joints before any mat or lifting work.",
    exercises: [
      {
        name: "World's Greatest Stretch",
        sets: "5 reps/side",
        cue: "Lunge + thoracic rotation + hamstring reach. Opens hips, T-spine, and ankles in one move.",
        photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
        youtube: "https://www.youtube.com/embed/xqvCmoLUFxk",
      },
      {
        name: "Hip Circle Walk",
        sets: "10 circles each direction",
        cue: "Stand on one leg, draw big circles with raised knee. Lubricates hip socket — critical at 250lb.",
        photo: "https://images.unsplash.com/photo-1549476464-37392f717541?w=400&q=80",
        youtube: "https://www.youtube.com/embed/dJ3HMrW3FAc",
      },
      {
        name: "Arm Circles & Shoulder CAR",
        sets: "10 forward, 10 backward",
        cue: "Slow controlled articulation of the shoulder joint. Prevents rotator cuff strain in guard play.",
        photo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80",
        youtube: "https://www.youtube.com/embed/WL-_t0b0QEg",
      },
      {
        name: "Jumping Jacks into Inchworms",
        sets: "20 jacks → 5 inchworms",
        cue: "Elevates heart rate then loads posterior chain dynamically.",
        photo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
        youtube: "https://www.youtube.com/embed/7KM_yIHKYS0",
      },
    ],
  },
  {
    id: "bjj_specific",
    label: "BJJ-Specific Activation",
    icon: Shield,
    color: "text-red-400",
    border: "border-red-800",
    bg: "bg-red-950/20",
    duration: "5–7 min",
    description: "Movement patterns that mirror mat work — neck, spine, and grip activation.",
    exercises: [
      {
        name: "Shrimping / Hip Escape Drill",
        sets: "2 × 10m",
        cue: "The most important BJJ warm-up. Drives hip mobility and mat feel simultaneously.",
        photo: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80",
        youtube: "https://www.youtube.com/embed/YxKg7P1vBBk",
      },
      {
        name: "Granby Roll",
        sets: "2 × 10m",
        cue: "Neck and shoulder loading in a safe context. Do NOT skip this before guard work.",
        photo: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&q=80",
        youtube: "https://www.youtube.com/embed/qdI0rTU0QJo",
      },
      {
        name: "Neck CARs (Controlled Articular Rotations)",
        sets: "3 slow reps each direction",
        cue: "Slow full-range neck circles. Do NOT rush. Guards against stinger injuries.",
        photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
        youtube: "https://www.youtube.com/embed/Zc-9XTVVVHI",
      },
      {
        name: "Grip / Finger Warm-Up",
        sets: "30 sec flicks + 10 fist squeezes",
        cue: "Finger tendon injuries are #1 BJJ complaint. 30 sec of this prevents weeks of pain.",
        photo: "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&q=80",
        youtube: "https://www.youtube.com/embed/iIoEwBmDL3E",
      },
    ],
  },
  {
    id: "mobility",
    label: "Injury Prevention Stretching",
    icon: Wind,
    color: "text-blue-400",
    border: "border-blue-800",
    bg: "bg-blue-950/20",
    duration: "10–15 min",
    description: "Post-session or standalone mobility work. Heaviest focus for 43yo athlete.",
    exercises: [
      {
        name: "90/90 Hip Stretch",
        sets: "2 min each side",
        cue: "Both legs at 90°. Rotate slowly. #1 guard mobility drill — opens hip internal/external rotation.",
        photo: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
        youtube: "https://www.youtube.com/embed/cZKr3IpMxJI",
      },
      {
        name: "Open the Book (Thoracic Rotation)",
        sets: "10 reps/side",
        cue: "Side-lying, top arm sweeps to opposite side. Reverses mat hunching and opens breathing.",
        photo: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80",
        youtube: "https://www.youtube.com/embed/8ZGcmQnYXR8",
      },
      {
        name: "Couch Stretch (Hip Flexor)",
        sets: "90 sec each side",
        cue: "Rear foot on wall, front foot forward. Critical for wrestlers and guard players.",
        photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
        youtube: "https://www.youtube.com/embed/mzJ7A8h8gFk",
      },
      {
        name: "Child's Pose into Cat-Cow",
        sets: "2 min flow",
        cue: "Decompresses lumbar spine. Do this after every single session at 250lb.",
        photo: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
        youtube: "https://www.youtube.com/embed/kqnua4rHVVA",
      },
      {
        name: "Doorway Pec Stretch",
        sets: "60 sec each arm",
        cue: "Counteracts constant guard-pulling and collar gripping. Prevents shoulder impingement.",
        photo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80",
        youtube: "https://www.youtube.com/embed/Kq2CYiC-WU8",
      },
    ],
  },
];

function ExerciseCard({ ex }) {
  const [expanded, setExpanded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      {/* Photo header */}
      <div className="relative h-36 overflow-hidden">
        <img src={ex.photo} alt={ex.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
          <div>
            <p className="text-white font-bold text-sm">{ex.name}</p>
            <p className="text-yellow-400 text-xs font-medium">{ex.sets}</p>
          </div>
          <button
            onClick={() => setShowVideo(v => !v)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all min-h-[36px]"
          >
            <Play className="w-3 h-3" /> {showVideo ? "Hide" : "Watch"}
          </button>
        </div>
      </div>

      {/* Video embed */}
      {showVideo && (
        <div className="aspect-video">
          <iframe
            src={ex.youtube}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={ex.name}
          />
        </div>
      )}

      {/* Cue */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <p className="text-commander-muted text-xs flex-1 pr-2">{expanded ? ex.cue : ex.cue.slice(0, 60) + "…"}</p>
        {expanded ? <ChevronUp className="w-4 h-4 text-commander-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-commander-muted flex-shrink-0" />}
      </button>
    </div>
  );
}

function Section({ section }) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  return (
    <div className={`border rounded-xl overflow-hidden ${section.border} ${section.bg}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <Icon className={`w-5 h-5 ${section.color} flex-shrink-0`} />
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{section.label}</p>
          <p className="text-commander-muted text-xs">{section.duration} · {section.description}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-commander-muted" /> : <ChevronDown className="w-4 h-4 text-commander-muted" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {section.exercises.map(ex => <ExerciseCard key={ex.name} ex={ex} />)}
        </div>
      )}
    </div>
  );
}

export default function PreWorkoutPrep() {
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top overflow-auto h-screen">
      <div className="flex items-center gap-2">
        <BackButton to="/" />
        <div>
          <h1 className="text-white text-xl font-black tracking-tight">Pre-Workout Prep</h1>
          <p className="text-commander-muted text-xs">Injury prevention · Warm-up · Mobility</p>
        </div>
      </div>

      {/* 43yo alert banner */}
      <div className="bg-orange-950/40 border border-orange-700 rounded-xl p-3 flex gap-2 items-start">
        <Shield className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
        <p className="text-orange-300 text-xs">
          <span className="font-bold">43yo Protocol:</span> Never skip warm-up. At 250lb, cold tendons + explosive mat work = months off the mat. Allow 15–20 min total before rolling.
        </p>
      </div>

      {SECTIONS.map(s => <Section key={s.id} section={s} />)}
    </div>
  );
}
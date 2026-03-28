import { useState, useEffect } from "react";
import { Flame, Droplets, Zap, Shield, Star, Target, Apple, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

// ─── ATHLETE PROFILES ───────────────────────────────────────────
const DAD = {
  name: "The Commander",
  alias: "Romini",
  weight: 250,
  height: "6'1\"",
  age: 43,
  goal_weight: 230,
  tdee: 3200,
  cut_target: 2700,
  protein_g: 250,
  carbs_g: 250,
  fat_g: 90,
  water_oz: 125,
  belt: "White → Blue Belt",
  division: "Masters 1 · Ultra Heavy",
};

const SON = {
  name: "Lil Prodigy",
  alias: "Lil Prodigy",
  weight: 65,
  height: "4'11\"",
  age: null,
  tdee: 1800,
  protein_g: 65,
  carbs_g: 200,
  fat_g: 55,
  water_oz: 48,
  belt: "Rookie Belt Progression",
  division: "Peewee · 65 lbs",
};

// ─── MEAL PLANS ──────────────────────────────────────────────────
const DAD_MEALS = [
  {
    time: "6:00 AM — Pre-Training Fuel",
    color: "border-orange-700 bg-orange-950/20",
    badge: "text-orange-400",
    items: [
      "3 whole eggs + 3 egg whites (scrambled)",
      "½ cup oatmeal with blueberries",
      "1 tbsp almond butter",
      "Black coffee or green tea",
    ],
    macros: "~520 cal · 42g protein · 45g carbs · 18g fat",
  },
  {
    time: "11:00 AM — Midday Power Meal",
    color: "border-blue-700 bg-blue-950/20",
    badge: "text-blue-400",
    items: [
      "8oz lean ground bison or 93/7 beef",
      "1 cup white rice (cooked)",
      "Sautéed spinach + garlic in olive oil",
      "16oz water",
    ],
    macros: "~680 cal · 60g protein · 55g carbs · 18g fat",
  },
  {
    time: "2:00 PM — Pre-Mat Snack",
    color: "border-yellow-700 bg-yellow-950/20",
    badge: "text-yellow-400",
    items: [
      "Greek yogurt (2% Fage, 1 cup)",
      "1 banana",
      "Handful of mixed nuts",
      "Pre-workout electrolytes (no stimulants if evening class)",
    ],
    macros: "~420 cal · 30g protein · 45g carbs · 14g fat",
  },
  {
    time: "Post-Mat (within 30 min)",
    color: "border-green-700 bg-green-950/20",
    badge: "text-green-400",
    items: [
      "2 scoops whey isolate in water",
      "1 cup tart cherry juice (anti-inflammatory)",
      "Handful of rice cakes",
    ],
    macros: "~380 cal · 55g protein · 38g carbs · 4g fat",
  },
  {
    time: "7:30 PM — Recovery Dinner",
    color: "border-purple-700 bg-purple-950/20",
    badge: "text-purple-400",
    items: [
      "6oz salmon OR 8oz chicken breast",
      "2 cups roasted sweet potato",
      "Large mixed greens salad + olive oil/lemon",
      "1 cup bone broth (joint support)",
    ],
    macros: "~620 cal · 55g protein · 65g carbs · 16g fat",
  },
  {
    time: "Optional Night Snack",
    color: "border-gray-700 bg-gray-900/40",
    badge: "text-gray-400",
    items: [
      "1 cup cottage cheese (casein protein)",
      "Cinnamon + a few walnuts",
      "Magnesium glycinate supplement (sleep)",
    ],
    macros: "~220 cal · 28g protein · 8g carbs · 8g fat",
  },
];

const SON_MEALS = [
  {
    time: "Morning Fuel",
    color: "border-yellow-700 bg-yellow-950/20",
    badge: "text-yellow-400",
    items: [
      "2 scrambled eggs + 1 slice whole wheat toast",
      "½ cup strawberries or orange slices",
      "8oz whole milk",
    ],
    macros: "~420 cal · 22g protein · 38g carbs · 16g fat",
  },
  {
    time: "School Lunch",
    color: "border-green-700 bg-green-950/20",
    badge: "text-green-400",
    items: [
      "Turkey or chicken sandwich on whole grain",
      "Cheese stick + apple slices",
      "Veggie sticks with hummus",
      "Water bottle (16oz)",
    ],
    macros: "~480 cal · 28g protein · 52g carbs · 14g fat",
  },
  {
    time: "Pre-BJJ Snack (4:00 PM)",
    color: "border-blue-700 bg-blue-950/20",
    badge: "text-blue-400",
    items: [
      "Peanut butter + banana on rice cake",
      "8oz chocolate milk (natural recovery drink)",
    ],
    macros: "~340 cal · 10g protein · 50g carbs · 10g fat",
  },
  {
    time: "Post-Mat Dinner",
    color: "border-orange-700 bg-orange-950/20",
    badge: "text-orange-400",
    items: [
      "4oz chicken breast or salmon",
      "½ cup rice + steamed broccoli",
      "8oz milk",
    ],
    macros: "~420 cal · 35g protein · 40g carbs · 10g fat",
  },
];

// ─── TRAINING PLANS ──────────────────────────────────────────────
const DAD_WEEKLY = [
  { day: "Mon", label: "Technical Foundations + S&C", color: "text-blue-400", sessions: ["6:15 PM BJJ Foundations @ The Lab", "Work Gym: Squats, Deadlifts, Hip Thrusts (posterior chain priority)"], tip: "Heavy compound lifts. Protect the lower back." },
  { day: "Tue", label: "MMA Wrestling + Zone 2", color: "text-red-400", sessions: ["6:15 PM BJJ Foundations", "7:15 PM MMA Wrestling @ The Lab"], tip: "Focus: Wall walks and sprawl defense." },
  { day: "Wed", label: "Zone 2 Cardio + Mobility", color: "text-green-400", sessions: ["Crunch Fitness: 35 min at 130–145 bpm", "Home: 20-min Heavyweight Restoration"], tip: "No lifting. CNS recovery. Keep HR in Zone 2." },
  { day: "Thu", label: "No-Gi + Explosive Power", color: "text-yellow-400", sessions: ["6:15 PM No-Gi @ The Lab", "Work Gym: Power Cleans, Box Jumps, Pull-ups"], tip: "Explosiveness day. Short rest periods." },
  { day: "Fri", label: "No-Gi + Mobility", color: "text-purple-400", sessions: ["6:15 PM No-Gi / BJJ @ The Lab", "Home: 15-min hip flexor / spine decompression"], tip: "Film a round for Video Vault analysis." },
  { day: "Sat", label: "Masters Class + Active Recovery", color: "text-orange-400", sessions: ["10:00 AM Masters Class @ The Lab", "Watch son's class (5:15 PM)"], tip: "Max mat time day. Focus on pressure game." },
  { day: "Sun", label: "Full Rest + Film Study", color: "text-gray-400", sessions: ["Watch session clips with your son", "Plan next week's training targets"], tip: "Log Sunday biometrics. Recharge the body." },
];

const SON_WEEKLY = [
  { day: "Mon", label: "BJJ + Animal Movement", color: "text-blue-400", sessions: ["5:15 PM Kids BJJ @ The Lab", "Bear crawls + gorilla walks drill at home"], tip: "Reinforce class techniques with fun drills." },
  { day: "Tue", label: "Rest / Outdoor Play", color: "text-green-400", sessions: ["Active play: tag, climbing, jumping"], tip: "Unstructured movement = athletic development." },
  { day: "Wed", label: "BJJ + Balance Work", color: "text-yellow-400", sessions: ["5:15 PM Kids BJJ @ The Lab", "Balance beam or gymnastics-style drills"], tip: "Focus on hip switches and breakfalls." },
  { day: "Thu", label: "Active Recovery", color: "text-purple-400", sessions: ["Bike ride or swimming", "Light stretching + breathing games"], tip: "Keep it fun. No pressure." },
  { day: "Fri", label: "BJJ + Sparring Review", color: "text-orange-400", sessions: ["5:15 PM Kids BJJ @ The Lab"], tip: "Ask coach for 1 takeaway. Log in Junior Tracker." },
  { day: "Sat", label: "Watch Dad Compete / Open Mat", color: "text-red-400", sessions: ["Watch Dad at Masters Class", "Junior open mat if available"], tip: "Family mat time. Watch and learn together." },
  { day: "Sun", label: "Rest + Film Study", color: "text-gray-400", sessions: ["Watch clip from the week together", "Celebrate wins with dad"], tip: "Build the habit of reflection early." },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────
function MacroBar({ label, val, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-commander-muted">{label}</span>
        <span className={color}>{val}g</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color.replace("text-", "bg-")}`} style={{ width: `${Math.min(100, (val / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden ${meal.color}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-3 text-left">
        <p className={`font-bold text-xs ${meal.badge}`}>{meal.time}</p>
        {open ? <ChevronUp className="w-4 h-4 text-commander-muted" /> : <ChevronDown className="w-4 h-4 text-commander-muted" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1">
          {meal.items.map((item, i) => (
            <div key={i} className="flex gap-2 text-sm text-white items-start">
              <span className="text-commander-red mt-0.5">•</span>{item}
            </div>
          ))}
          <p className="text-xs text-commander-muted mt-2 font-mono">{meal.macros}</p>
        </div>
      )}
    </div>
  );
}

function DayCard({ day }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3 text-left">
        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className={`text-xs font-black ${day.color}`}>{day.day}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">{day.label}</p>
          <p className="text-commander-muted text-xs truncate">{day.sessions[0]}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-commander-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-commander-muted flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-commander-border pt-2 space-y-2">
          {day.sessions.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Target className={`w-3 h-3 mt-0.5 flex-shrink-0 ${day.color}`} />
              <p className="text-white text-sm">{s}</p>
            </div>
          ))}
          <div className="bg-gray-800 rounded-lg px-3 py-2 mt-2">
            <p className="text-commander-muted text-xs italic">💡 {day.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SupplementStack({ supplements }) {
  return (
    <div className="space-y-2">
      {supplements.map(s => (
        <div key={s.name} className="flex items-start gap-3 bg-commander-surface border border-commander-border rounded-xl p-3">
          <span className="text-lg">{s.icon}</span>
          <div>
            <p className="text-white text-sm font-semibold">{s.name}</p>
            <p className="text-commander-muted text-xs">{s.dose} · {s.timing}</p>
            <p className="text-blue-400 text-xs mt-0.5">{s.benefit}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const DAD_SUPPS = [
  { icon: "💊", name: "Creatine Monohydrate", dose: "5g daily", timing: "Any time with water", benefit: "Strength, power output, and recovery for heavy training" },
  { icon: "🐟", name: "Omega-3 Fish Oil", dose: "3g EPA/DHA", timing: "With largest meal", benefit: "Joint lubrication — essential for 43yo grappling" },
  { icon: "🦴", name: "Collagen Peptides", dose: "15g", timing: "Post-training with Vitamin C", benefit: "Tendon & cartilage repair after mat sessions" },
  { icon: "😴", name: "Magnesium Glycinate", dose: "400mg", timing: "30 min before bed", benefit: "Deep sleep, muscle relaxation, HRV improvement" },
  { icon: "⚡", name: "Electrolytes", dose: "1 packet", timing: "During long mat sessions", benefit: "Sodium, potassium, magnesium for endurance" },
  { icon: "🫐", name: "Tart Cherry Extract", dose: "480mg", timing: "Post-training", benefit: "Reduces muscle soreness and inflammation" },
];

const SON_SUPPS = [
  { icon: "🥛", name: "Chocolate Milk (post-training)", dose: "8oz", timing: "Within 30 min of class", benefit: "Perfect 3:1 carb-to-protein ratio for kid recovery" },
  { icon: "🐟", name: "Kids Omega-3 (Nordic Naturals)", dose: "650mg DHA", timing: "With dinner", benefit: "Brain development and joint support for growing athlete" },
  { icon: "☀️", name: "Vitamin D3 (1000 IU)", dose: "1000 IU", timing: "With breakfast", benefit: "Bone density and immune support" },
  { icon: "🦷", name: "Magnesium Kids Gummy", dose: "Per label", timing: "Before bed", benefit: "Better sleep and growing muscle recovery" },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────
const DAD_IMAGES = [
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/9af62c059_2845.png",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/3d1213c6a_2825.jpg",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/96befed01_2826.jpg",
  "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/112a5c2cc_2827.jpg",
];
const SON_IMAGE = "https://media.base44.com/images/public/69c722c665db36b41f55ba9c/6d582ea34_2837.png";

export default function Blueprint() {
  const [imgIndex, setImgIndex] = useState(0);
  const [athlete, setAthlete] = useState("dad");
  const [section, setSection] = useState("nutrition");

  const isDad = athlete === "dad";
  const profile = isDad ? DAD : SON;
  const meals = isDad ? DAD_MEALS : SON_MEALS;
  const plan = isDad ? DAD_WEEKLY : SON_WEEKLY;
  const supps = isDad ? DAD_SUPPS : SON_SUPPS;
  const heroImg = isDad ? DAD_IMAGES[imgIndex] : SON_IMAGE;

  // cycle dad images every 5s
  useEffect(() => {
    const t = setInterval(() => setImgIndex(i => (i + 1) % DAD_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden border border-commander-red" style={{ minHeight: 220 }}>
        <img src={heroImg} alt="warrior" className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/55 to-black/95" />
        <div className="relative p-4 flex flex-col justify-end" style={{ minHeight: 220 }}>
          <p className="text-xs text-commander-red uppercase tracking-widest font-bold mb-1">Family Legacy Blueprint</p>
          <h1 className="text-white text-2xl font-black tracking-tight">Performance Formula</h1>
          <p className="text-white/60 text-xs mt-1">The code to becoming who you're destined to be. Father & son. Warrior lineage.</p>
          {isDad && (
            <div className="flex gap-1 mt-3">
              {DAD_IMAGES.map((_, i) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  className={`h-1 rounded-full transition-all ${i === imgIndex ? "bg-commander-red w-5" : "bg-white/30 w-2"}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Athlete Toggle */}
      <div className="flex bg-commander-surface border border-commander-border rounded-xl overflow-hidden">
        <button onClick={() => setAthlete("dad")} className={`flex-1 py-3 text-sm font-bold transition-all ${athlete === "dad" ? "bg-commander-red text-white" : "text-commander-muted"}`}>
          ⚔️ The Commander
        </button>
        <button onClick={() => setAthlete("son")} className={`flex-1 py-3 text-sm font-bold transition-all ${athlete === "son" ? "bg-blue-700 text-white" : "text-commander-muted"}`}>
          🥋 Lil Prodigy
        </button>
      </div>

      {/* Profile Card */}
      <div className={`border rounded-xl p-4 ${isDad ? "bg-red-950/20 border-red-800" : "bg-blue-950/20 border-blue-800"}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className={`text-lg font-black ${isDad ? "text-red-300" : "text-blue-300"}`}>{profile.name}</p>
            <p className="text-commander-muted text-xs">{profile.division}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-sm">{profile.weight} lbs · {profile.height}</p>
            <p className={`text-xs font-semibold ${isDad ? "text-red-400" : "text-blue-400"}`}>{profile.belt}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-gray-800/60 rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">{profile.tdee}</p>
            <p className="text-commander-muted text-xs">Daily Cal</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-2 text-center">
            <p className="text-orange-400 font-bold text-sm">{profile.protein_g}g</p>
            <p className="text-commander-muted text-xs">Protein</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-2 text-center">
            <p className="text-blue-400 font-bold text-sm">{profile.water_oz} oz</p>
            <p className="text-commander-muted text-xs">Water</p>
          </div>
        </div>
        {isDad && (
          <div className="mt-3 bg-gray-800/60 rounded-lg p-3 space-y-2">
            <MacroBar label="Protein" val={profile.protein_g} max={300} color="text-orange-400" />
            <MacroBar label="Carbs" val={profile.carbs_g} max={350} color="text-yellow-400" />
            <MacroBar label="Fat" val={profile.fat_g} max={150} color="text-blue-400" />
          </div>
        )}
        {isDad && (
          <div className="mt-2 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
            <p className="text-red-300 text-xs font-bold">🎯 Cut Target: {profile.goal_weight} lbs — {profile.cut_target} cal/day deficit protocol</p>
          </div>
        )}
        {!isDad && (
          <div className="mt-2 bg-blue-900/30 border border-blue-800 rounded-lg px-3 py-2">
            <p className="text-blue-300 text-xs font-bold">🌱 Growth Phase: Fuel the body, don't restrict. Optimize for performance and development.</p>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["nutrition", "🍖 Nutrition"], ["training", "🥋 Training"], ["supplements", "💊 Supplements"]].map(([key, label]) => (
          <button key={key} onClick={() => setSection(key)}
            className={`whitespace-nowrap text-xs px-3 py-2 rounded-full border transition-all flex-shrink-0 font-medium ${section === key ? (isDad ? "border-commander-red bg-red-950 text-white" : "border-blue-600 bg-blue-950 text-white") : "border-commander-border text-commander-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* NUTRITION */}
      {section === "nutrition" && (
        <div className="space-y-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest">
            {isDad ? "Warrior Meal Plan — Cut + Performance" : "Lil Prodigy — Growth & Performance Fuel"}
          </p>
          {meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
            <p className="text-xs text-commander-muted uppercase tracking-widest mb-2">Daily Nutrition Formula</p>
            <div className="space-y-1 text-sm text-white">
              {isDad ? (
                <>
                  <p>🔴 <span className="font-bold text-orange-400">Protein:</span> 1g per lb body weight = {profile.protein_g}g</p>
                  <p>🟡 <span className="font-bold text-yellow-400">Carbs:</span> Cycle — higher on mat days, lower on rest</p>
                  <p>🔵 <span className="font-bold text-blue-400">Fat:</span> 30-35% of remaining calories</p>
                  <p>💧 <span className="font-bold text-cyan-400">Water:</span> {profile.weight}lbs ÷ 2 + 32oz per mat hour</p>
                </>
              ) : (
                <>
                  <p>🥩 <span className="font-bold text-orange-400">Protein:</span> 1g per lb = {profile.protein_g}g for muscle + growth</p>
                  <p>🍚 <span className="font-bold text-yellow-400">Carbs:</span> Primary fuel — whole grains, fruit, rice</p>
                  <p>🥑 <span className="font-bold text-green-400">Fat:</span> Healthy fats for brain + joint development</p>
                  <p>💧 <span className="font-bold text-cyan-400">Water:</span> 48oz daily + extra on class days</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRAINING */}
      {section === "training" && (
        <div className="space-y-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest">
            {isDad ? "7-Day Periodized Training Plan" : "Junior Weekly Development Plan"}
          </p>
          {plan.map((day, i) => <DayCard key={i} day={day} />)}
          {isDad && (
            <div className="bg-red-950/30 border border-red-800 rounded-xl p-4">
              <p className="text-red-300 text-xs font-bold uppercase tracking-wider mb-2">43yo Warrior Rules</p>
              <div className="space-y-1 text-xs text-red-200">
                <p>⚠️ Never skip the 20-min restoration protocol after heavy mat days</p>
                <p>⚠️ If gas level ≥ 8 for 3 consecutive days → mandatory Mobility Day</p>
                <p>⚠️ Recovery score &lt; 45%? Technical drilling only. No live rolling.</p>
                <p>⚠️ Reduce Work Gym lifting 50% in the final 2 weeks before competition</p>
              </div>
            </div>
          )}
          {!isDad && (
            <div className="bg-blue-950/30 border border-blue-800 rounded-xl p-4">
              <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">Lil Prodigy Development Rules</p>
              <div className="space-y-1 text-xs text-blue-200">
                <p>🌟 Fun first — results follow when kids enjoy training</p>
                <p>🌟 No more than 3 structured BJJ sessions per week at this age</p>
                <p>🌟 Celebrate attitude & effort equally with technique wins</p>
                <p>🌟 Unstructured outdoor play counts as athletic development</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUPPLEMENTS */}
      {section === "supplements" && (
        <div className="space-y-3">
          <p className="text-xs text-commander-muted uppercase tracking-widest">
            {isDad ? "Commander Stack — 43yo Performance" : "Lil Prodigy Stack — Youth Optimization"}
          </p>
          <SupplementStack supplements={supps} />
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-3">
            <p className="text-gray-400 text-xs">⚠️ Always consult your physician before starting supplements. Son's stack should be reviewed with his pediatrician.</p>
          </div>
        </div>
      )}
    </div>
  );
}
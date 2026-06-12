import { useState } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Sparkles, Target, Dumbbell, Apple, Heart, Flame, ChevronRight, Loader2, RotateCcw, ImagePlus, X } from "lucide-react";
import BackButton from "../components/BackButton";
import BodyGoalPlanDisplay from "../components/BodyGoalPlanDisplay";

const BODY_TYPE_PRESETS = [
  { id: "lean_athletic", label: "Lean & Athletic", emoji: "⚡", desc: "Low body fat, visible muscle definition, functional strength" },
  { id: "muscular_bulk", label: "Muscular & Powerful", emoji: "💪", desc: "Mass, size, and strength — bodybuilder aesthetic" },
  { id: "physique_competitor", label: "Physique / Stage Ready", emoji: "🏆", desc: "Competition-ready — symmetry, cuts, vascularity" },
  { id: "hybrid_athlete", label: "Hybrid Athlete", emoji: "🔥", desc: "Strong, conditioned, mobile — combat sports or CrossFit ready" },
  { id: "slim_tone", label: "Slim & Toned", emoji: "✨", desc: "Lean, toned muscles without bulk — endurance athlete look" },
  { id: "tactical_fit", label: "Tactical / Military Fit", emoji: "🎖️", desc: "Functional strength, cardio base, durability" },
];

const GOALS = [
  { id: "lose_fat", label: "Lose Body Fat", icon: Flame },
  { id: "build_muscle", label: "Build Muscle", icon: Dumbbell },
  { id: "recomp", label: "Body Recomposition", icon: Target },
  { id: "endurance", label: "Boost Endurance", icon: Heart },
];

export default function BodyGoalPlanner() {
  const [step, setStep] = useState(1); // 1=select goal, 2=details, 3=generating, 4=results
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [description, setDescription] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  // User stats
  const [stats, setStats] = useState({
    age: "",
    weight: "",
    height: "",
    fitnessLevel: "beginner",
    daysPerWeek: "4",
    equipment: "full_gym",
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImageUrl(file_url);
      setUploadedImage(URL.createObjectURL(file));
    } catch (err) {
      setError("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setStep(3);
    setError(null);
    try {
      const presetInfo = BODY_TYPE_PRESETS.find(p => p.id === selectedPreset);
      const goalInfo = GOALS.find(g => g.id === selectedGoal);

      const prompt = `You are an elite certified personal trainer, registered dietitian, and strength & conditioning coach.

A client wants to achieve a specific physique goal. Generate a comprehensive, detailed, personalized transformation plan.

CLIENT PROFILE:
- Target Physique: ${presetInfo?.label || "Not specified"} — ${presetInfo?.desc || ""}
- Primary Goal: ${goalInfo?.label || "Not specified"}
- Age: ${stats.age || "Not provided"}
- Current Weight: ${stats.weight || "Not provided"} lbs
- Height: ${stats.height || "Not provided"}
- Fitness Level: ${stats.fitnessLevel}
- Training Days per Week: ${stats.daysPerWeek}
- Equipment Access: ${stats.equipment === "full_gym" ? "Full Gym" : stats.equipment === "home" ? "Home/Minimal Equipment" : "Bodyweight Only"}
- Additional Description: ${description || "None"}
${uploadedImageUrl ? "- Client has provided a reference photo of their target physique (analyze the visual goals implied)" : ""}

Generate a COMPLETE transformation plan in JSON format:
{
  "plan_title": "string — personalized title",
  "overview": "string — 2-3 sentence summary of the approach",
  "timeline": "string — realistic timeline (e.g. '16 weeks')",
  "body_composition_targets": {
    "starting_body_fat_estimate": "string",
    "target_body_fat": "string",
    "expected_muscle_gain_lbs": "string",
    "expected_fat_loss_lbs": "string"
  },
  "weekly_schedule": [
    {
      "day": "Monday",
      "focus": "string — e.g. Upper Body Push",
      "type": "strength|cardio|hiit|mobility|rest",
      "duration_minutes": 60,
      "exercises": [
        { "name": "string", "sets": 4, "reps": "8-10", "rest_seconds": 90, "tip": "string" }
      ]
    }
  ],
  "nutrition_plan": {
    "daily_calories": 2800,
    "protein_g": 200,
    "carbs_g": 280,
    "fat_g": 80,
    "meal_timing": "string",
    "pre_workout_meal": "string",
    "post_workout_meal": "string",
    "meals": [
      { "name": "Breakfast", "time": "7:00 AM", "foods": ["string"], "calories": 600, "protein_g": 45 }
    ],
    "foods_to_prioritize": ["string"],
    "foods_to_avoid": ["string"],
    "supplements": [{ "name": "string", "dose": "string", "timing": "string", "purpose": "string" }]
  },
  "cardio_plan": {
    "type": "string",
    "frequency_per_week": 3,
    "duration_minutes": 30,
    "intensity": "string",
    "notes": "string"
  },
  "weekly_meal_prep": {
    "prep_day": "Sunday",
    "prep_duration_hours": 2,
    "batch_cook_items": ["string"],
    "sample_weekly_grocery_list": ["string"]
  },
  "recovery_protocol": {
    "sleep_target_hours": 8,
    "mobility_minutes_daily": 15,
    "key_recovery_habits": ["string"]
  },
  "phase_breakdown": [
    { "phase": "Phase 1 (Weeks 1-4)", "focus": "string", "key_adjustments": "string" }
  ],
  "success_metrics": ["string"],
  "pro_tips": ["string"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: uploadedImageUrl ? [uploadedImageUrl] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            plan_title: { type: "string" },
            overview: { type: "string" },
            timeline: { type: "string" },
            body_composition_targets: { type: "object" },
            weekly_schedule: { type: "array" },
            nutrition_plan: { type: "object" },
            cardio_plan: { type: "object" },
            weekly_meal_prep: { type: "object" },
            recovery_protocol: { type: "object" },
            phase_breakdown: { type: "array" },
            success_metrics: { type: "array" },
            pro_tips: { type: "array" },
          },
        },
      });

      setPlan(result);
      setStep(4);
    } catch (err) {
      setError("Failed to generate plan: " + err.message);
      setStep(2);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedPreset(null);
    setSelectedGoal(null);
    setDescription("");
    setUploadedImage(null);
    setUploadedImageUrl(null);
    setPlan(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 border-b border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <BackButton to="/home" />
          <div>
            <h1 className="text-white font-black text-lg">Body Goal Planner</h1>
            <p className="text-gray-500 text-xs">AI-powered transformation plan</p>
          </div>
          {step === 4 && (
            <button onClick={handleReset} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-vellera-blue transition">
              <RotateCcw className="w-3.5 h-3.5" /> New Plan
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Step 1 — Choose Target Physique */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-vellera-blue font-bold uppercase tracking-widest mb-1">Step 1 of 2</p>
              <h2 className="text-2xl font-black mb-1">What's Your Target Physique?</h2>
              <p className="text-gray-400 text-sm">Choose the body type you're working toward, or describe it yourself below.</p>
            </div>

            {/* Preset Cards */}
            <div className="grid grid-cols-2 gap-3">
              {BODY_TYPE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedPreset === preset.id
                      ? "border-vellera-blue bg-vellera-blue/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
                >
                  <div className="text-2xl mb-2">{preset.emoji}</div>
                  <p className="text-white font-bold text-sm">{preset.label}</p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{preset.desc}</p>
                </button>
              ))}
            </div>

            {/* Primary Goal */}
            <div>
              <p className="text-sm font-bold text-gray-300 mb-3">Primary Goal</p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedGoal(id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedGoal === id
                        ? "border-vellera-green bg-vellera-green/10"
                        : "border-gray-800 bg-gray-900 hover:border-gray-600"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selectedGoal === id ? "text-vellera-green" : "text-gray-500"}`} />
                    <span className="text-sm font-bold text-white">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Reference Photo */}
            <div>
              <p className="text-sm font-bold text-gray-300 mb-2">Reference Photo <span className="text-gray-500 font-normal">(optional)</span></p>
              <p className="text-xs text-gray-500 mb-3">Upload a photo of a body type you're working toward — the AI will factor in the visual goal.</p>

              {uploadedImage ? (
                <div className="relative">
                  <img src={uploadedImage} alt="Reference" className="w-full max-h-48 object-cover rounded-xl border border-gray-700" />
                  <button
                    onClick={() => { setUploadedImage(null); setUploadedImageUrl(null); }}
                    className="absolute top-2 right-2 bg-black/70 rounded-full p-1"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-xl p-8 cursor-pointer hover:border-vellera-blue transition-all">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-vellera-blue animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-gray-500" />
                      <span className="text-sm text-gray-400">Tap to upload a reference photo</span>
                      <span className="text-xs text-gray-600">JPG, PNG — any fitness inspiration image</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedPreset || !selectedGoal}
              className="w-full py-4 bg-gradient-to-r from-vellera-blue to-vellera-green text-black font-black rounded-xl text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2 — Your Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-vellera-blue font-bold uppercase tracking-widest mb-1">Step 2 of 2</p>
              <h2 className="text-2xl font-black mb-1">Tell Us About You</h2>
              <p className="text-gray-400 text-sm">The more detail you give, the more personalized your plan will be.</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-300 text-sm">{error}</div>
            )}

            {/* Stats Form */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Age", key: "age", placeholder: "28", type: "number" },
                { label: "Weight (lbs)", key: "weight", placeholder: "185", type: "number" },
                { label: "Height", key: "height", placeholder: "5'10\"", type: "text" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={stats[key]}
                    onChange={e => setStats(s => ({ ...s, [key]: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-vellera-blue outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Fitness Level</label>
                <select
                  value={stats.fitnessLevel}
                  onChange={e => setStats(s => ({ ...s, fitnessLevel: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-vellera-blue outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Training Days/Week</label>
                <select
                  value={stats.daysPerWeek}
                  onChange={e => setStats(s => ({ ...s, daysPerWeek: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-vellera-blue outline-none"
                >
                  {["3","4","5","6"].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Equipment Access</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "full_gym", label: "Full Gym" },
                  { value: "home", label: "Home Setup" },
                  { value: "bodyweight", label: "Bodyweight" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStats(s => ({ ...s, equipment: opt.value }))}
                    className={`py-2.5 rounded-lg border text-sm font-bold transition-all ${
                      stats.equipment === opt.value
                        ? "border-vellera-blue bg-vellera-blue/10 text-vellera-blue"
                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Anything else? <span className="text-gray-600">(injuries, preferences, etc.)</span></label>
              <textarea
                placeholder="E.g. I have a bad left knee, I prefer morning workouts, I'm lactose intolerant..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-vellera-blue outline-none resize-none placeholder-gray-600"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-700 text-gray-300 font-bold rounded-xl hover:border-gray-500 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleGeneratePlan}
                className="flex-[2] py-4 bg-gradient-to-r from-vellera-blue to-vellera-green text-black font-black rounded-xl flex items-center justify-center gap-2 text-lg transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Build My Plan
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Generating */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-vellera-blue/20 to-vellera-green/20 border border-vellera-blue/40 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-vellera-blue animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Building Your Plan...</h2>
              <p className="text-gray-400 text-sm max-w-xs">Analyzing your goals and crafting a complete diet, training, and meal prep plan. This takes about 15 seconds.</p>
            </div>
            <div className="flex flex-col gap-2 text-left w-full max-w-xs">
              {[
                { icon: Dumbbell, label: "Designing weekly training split" },
                { icon: Apple, label: "Calculating macro targets" },
                { icon: Heart, label: "Building recovery protocol" },
                { icon: Target, label: "Creating phase-by-phase roadmap" },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                  <Icon className="w-4 h-4 text-vellera-green" />
                  <span className="text-sm text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 — Results */}
        {step === 4 && plan && (
          <BodyGoalPlanDisplay
            plan={plan}
            referenceImage={uploadedImage}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
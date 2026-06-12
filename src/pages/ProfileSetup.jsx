import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";

const GOALS = [
  "General Fitness & Health",
  "Strength & Power",
  "Bodybuilding & Hypertrophy",
  "Endurance & Conditioning",
  "Tactical & First Responder Readiness",
  "Combat Sports & Competition",
  "Rehab, Mobility & Whole Health",
];

const JOURNEYS = [
  "Just starting out / Getting back into it",
  "Consistent but want to level up",
  "Preparing for a season/fight",
  "Active Duty / Professional",
];

const EQUIPMENT = [
  "Bodyweight only",
  "Full Gym Access",
  "Heavy Bag / Mat Space",
  "Need low-impact/joint-friendly options",
];

const PATHS = [
  { id: "bjj", label: "Brazilian Jiu-Jitsu" },
  { id: "strength", label: "Strength Training" },
  { id: "bodybuilding", label: "Bodybuilding" },
  { id: "endurance", label: "Endurance" },
  { id: "tactical", label: "Tactical" },
  { id: "whole_health", label: "Whole Health" },
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1-4
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    goal: "",
    journey: "",
    equipment: "",
    fitness_path: "bjj",
    weight_lbs: 180,
    target_weight_lbs: 180,
    goals_text: "",
  });

  useEffect(() => {
    base44.auth.me().then((u) => setUser(u));
  }, []);

  const handleSave = async () => {
    if (!form.goal || !form.journey || !form.equipment || !form.fitness_path) {
      toast.error("Please complete all fields");
      return;
    }

    setLoading(true);
    try {
      // Check if profile exists
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });

      if (profiles.length > 0) {
        // Update existing
        await base44.entities.UserProfile.update(profiles[0].id, {
          onboarding_goal: form.goal,
          onboarding_journey: form.journey,
          onboarding_equipment: form.equipment,
          fitness_path: form.fitness_path,
          onboarding_complete: true,
        });
      } else {
        // Create new
        await base44.entities.UserProfile.create({
          onboarding_goal: form.goal,
          onboarding_journey: form.journey,
          onboarding_equipment: form.equipment,
          fitness_path: form.fitness_path,
          onboarding_complete: true,
          momentum_score: 0,
          momentum_level: 1,
        });
      }

      toast.success("Profile set up complete!");
      navigate("/");
    } catch (err) {
      toast.error("Failed to save profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-commander-dark via-gray-900 to-commander-dark flex flex-col items-center justify-center p-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all ${
                s <= step ? "bg-commander-red w-8" : "bg-gray-700 w-4"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-md bg-commander-surface border border-commander-border rounded-2xl p-6">
        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-2xl font-black mb-2">What's your primary goal?</h2>
              <p className="text-commander-muted text-sm">This helps us personalize your experience.</p>
            </div>

            <div className="space-y-2">
              {GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => setForm({ ...form, goal })}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all min-h-[44px] flex items-center ${
                    form.goal === goal
                      ? "border-commander-red bg-red-950/20 text-white"
                      : "border-commander-border bg-gray-800 text-commander-muted hover:text-white"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Journey */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-2xl font-black mb-2">Where are you in your journey?</h2>
              <p className="text-commander-muted text-sm">Understanding your starting point.</p>
            </div>

            <div className="space-y-2">
              {JOURNEYS.map((journey) => (
                <button
                  key={journey}
                  onClick={() => setForm({ ...form, journey })}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all min-h-[44px] flex items-center ${
                    form.journey === journey
                      ? "border-commander-red bg-red-950/20 text-white"
                      : "border-commander-border bg-gray-800 text-commander-muted hover:text-white"
                  }`}
                >
                  {journey}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Equipment */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-2xl font-black mb-2">What equipment do you have access to?</h2>
              <p className="text-commander-muted text-sm">We'll adjust training accordingly.</p>
            </div>

            <div className="space-y-2">
              {EQUIPMENT.map((eq) => (
                <button
                  key={eq}
                  onClick={() => setForm({ ...form, equipment: eq })}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all min-h-[44px] flex items-center ${
                    form.equipment === eq
                      ? "border-commander-red bg-red-950/20 text-white"
                      : "border-commander-border bg-gray-800 text-commander-muted hover:text-white"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Fitness Path & Stats */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-2xl font-black mb-2">Your primary fitness path?</h2>
              <p className="text-commander-muted text-sm">Choose your main discipline.</p>
            </div>

            <div className="space-y-2 mb-6">
              {PATHS.map((path) => (
                <button
                  key={path.id}
                  onClick={() => setForm({ ...form, fitness_path: path.id })}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all min-h-[44px] flex items-center ${
                    form.fitness_path === path.id
                      ? "border-commander-red bg-red-950/20 text-white"
                      : "border-commander-border bg-gray-800 text-commander-muted hover:text-white"
                  }`}
                >
                  {path.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-commander-muted block mb-2 font-semibold">Current Weight (lbs)</label>
              <input
                type="number"
                value={form.weight_lbs}
                onChange={(e) => setForm({ ...form, weight_lbs: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-2 text-white text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs text-commander-muted block mb-2 font-semibold">Goals & Notes</label>
              <textarea
                value={form.goals_text}
                onChange={(e) => setForm({ ...form, goals_text: e.target.value })}
                placeholder="e.g., Get to blue belt in 2 years, lose 20 lbs..."
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-2 text-white text-sm resize-none min-h-[80px]"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex-1 border border-commander-border text-commander-muted rounded-lg py-3 font-bold text-sm hover:text-white transition-all disabled:opacity-30 min-h-[44px] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-commander-red text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-all min-h-[44px] flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-commander-red text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-60 min-h-[44px]"
            >
              {loading ? "Saving..." : "Complete Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
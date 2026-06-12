import { useState, useEffect } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";

export default function BetaOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    biography: "",
    fitness_experience: "Intermediate (1-3 years)",
    what_will_you_use_for: [],
    feedback_focus_areas: [],
    device_testing: [],
    consent_data_collection: false,
    consent_contact: true,
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        if (!me) {
          navigate("/auth");
          return;
        }
        setUser(me);

        // Check if user is an approved beta tester
        const testers = await base44.entities.BetaTester.filter({ email: me.email });
        if (testers.length === 0) {
          setError("You are not an approved beta tester. Please request access first.");
          return;
        }

        const tester = testers[0];
        if (tester.feedback_submitted) {
          setError("You have already completed beta onboarding.");
          return;
        }

        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          biography: tester.biography || "",
          fitness_experience: tester.fitness_experience || "Intermediate (1-3 years)",
          what_will_you_use_for: tester.what_will_you_use_for || [],
          feedback_focus_areas: tester.feedback_focus_areas || [],
          device_testing: tester.device_testing || [],
          consent_data_collection: tester.consent_data_collection || false,
          consent_contact: tester.consent_contact || true,
        }));
      } catch (err) {
        setError("Failed to load beta onboarding: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.biography.trim()) {
      toast.error("Please tell us about yourself");
      return;
    }
    if (formData.what_will_you_use_for.length === 0) {
      toast.error("Please select at least one use case");
      return;
    }
    if (formData.device_testing.length === 0) {
      toast.error("Please select at least one device to test on");
      return;
    }
    if (!formData.consent_data_collection) {
      toast.error("Please consent to data collection");
      return;
    }

    setSubmitting(true);
    try {
      // Update the BetaTester record
      const testers = await base44.entities.BetaTester.filter({ email: user.email });
      if (testers.length > 0) {
        const tester = testers[0];
        await base44.entities.BetaTester.update(tester.id, {
          ...formData,
          feedback_submitted: true,
        });
      }

      setSubmitted(true);
      toast.success("Welcome to Vellera Beta! 🎉");
      
      // Redirect after 2 seconds
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      toast.error("Failed to complete onboarding: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-vellera-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-950/20 border border-red-700/50 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-black text-white">Access Denied</h1>
          <p className="text-red-300">{error}</p>
          <a href="/" className="inline-block px-6 py-3 bg-vellera-blue text-black font-bold rounded-xl hover:opacity-90 transition-all">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-vellera-green/20 border border-vellera-green/40 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-vellera-green" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white mb-2">You're All Set!</h1>
            <p className="text-commander-muted">Your 30-day beta trial has started. Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Welcome to Vellera Beta! 🎉</h1>
          <p className="text-commander-muted">Before you start exploring, tell us a bit more about yourself and your goals.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-commander-surface border border-commander-border rounded-2xl p-8 space-y-8">
          {/* Biography */}
          <div>
            <label className="block text-white font-bold text-sm mb-2">About You *</label>
            <textarea
              name="biography"
              value={formData.biography}
              onChange={handleChange}
              placeholder="Tell us about your fitness background, current training, and what drives you as an athlete or fitness enthusiast. (100-500 words)"
              rows={6}
              className="w-full bg-gray-800 border border-commander-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue transition resize-none"
              required
            />
            <p className="text-xs text-commander-muted mt-1">{formData.biography.length} / 500 characters</p>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-white font-bold text-sm mb-3">Fitness Experience Level *</label>
            <div className="space-y-2">
              {["Beginner (< 1 year)", "Intermediate (1-3 years)", "Advanced (3-7 years)", "Elite (7+ years)"].map(level => (
                <label key={level} className="flex items-center gap-3 p-3 border border-commander-border rounded-lg hover:border-vellera-blue transition cursor-pointer">
                  <input
                    type="radio"
                    name="fitness_experience"
                    value={level}
                    checked={formData.fitness_experience === level}
                    onChange={handleChange}
                    className="w-4 h-4 accent-vellera-blue"
                  />
                  <span className="text-white font-medium">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <label className="block text-white font-bold text-sm mb-3">What will you use Vellera for? (select all that apply) *</label>
            <div className="grid md:grid-cols-2 gap-3">
              {["Strength Training", "Combat Sports (BJJ/MMA/Boxing)", "Conditioning", "Recovery Tracking", "Nutrition", "Biometric Integration", "Coaching Others", "Personal Progression"].map(use => (
                <label key={use} className="flex items-center gap-2 p-3 border border-commander-border rounded-lg hover:border-vellera-blue transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.what_will_you_use_for.includes(use)}
                    onChange={() => handleMultiSelect("what_will_you_use_for", use)}
                    className="w-4 h-4 accent-vellera-blue"
                  />
                  <span className="text-white text-sm font-medium">{use}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Feedback Areas */}
          <div>
            <label className="block text-white font-bold text-sm mb-3">What areas would you like to give feedback on? (optional)</label>
            <div className="grid md:grid-cols-2 gap-3">
              {["User Interface", "AI Coach", "Form Analysis", "Mobile Experience", "Biometric Sync", "Community Features", "Performance", "Onboarding"].map(area => (
                <label key={area} className="flex items-center gap-2 p-3 border border-commander-border rounded-lg hover:border-vellera-blue transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.feedback_focus_areas.includes(area)}
                    onChange={() => handleMultiSelect("feedback_focus_areas", area)}
                    className="w-4 h-4 accent-vellera-blue"
                  />
                  <span className="text-white text-sm font-medium">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Device Testing */}
          <div>
            <label className="block text-white font-bold text-sm mb-3">Which devices will you test on? (select all that apply) *</label>
            <div className="space-y-2">
              {["Web Browser", "iPhone", "Android", "Desktop", "Tablet"].map(device => (
                <label key={device} className="flex items-center gap-3 p-3 border border-commander-border rounded-lg hover:border-vellera-blue transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.device_testing.includes(device)}
                    onChange={() => handleMultiSelect("device_testing", device)}
                    className="w-4 h-4 accent-vellera-blue"
                  />
                  <span className="text-white font-medium">{device}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Consents */}
          <div className="border-t border-commander-border pt-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="consent_data_collection"
                checked={formData.consent_data_collection}
                onChange={handleChange}
                className="w-5 h-5 accent-vellera-blue mt-1"
                required
              />
              <div>
                <p className="text-white font-medium">Data Collection & Privacy Consent *</p>
                <p className="text-xs text-commander-muted mt-1">I consent to my training data being used to improve Vellera (per our Privacy Policy). All data is encrypted, never sold, and handled per HIPAA-aligned standards.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="consent_contact"
                checked={formData.consent_contact}
                onChange={handleChange}
                className="w-5 h-5 accent-vellera-blue mt-1"
              />
              <div>
                <p className="text-white font-medium">Beta Feedback & Communication</p>
                <p className="text-xs text-commander-muted mt-1">I agree to be contacted about beta feedback, improvements, and surveys. You can unsubscribe anytime.</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all min-h-[44px]"
            style={{
              backgroundColor: submitting ? "#333" : "#00E5FF",
              color: submitting ? "#666" : "#000",
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Setting up your trial...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Start Your 30-Day Trial
              </>
            )}
          </button>

          <p className="text-xs text-commander-muted text-center">
            By submitting, you agree to our <a href="/terms" className="text-vellera-blue hover:underline">Terms</a> and <a href="/privacy" className="text-vellera-blue hover:underline">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
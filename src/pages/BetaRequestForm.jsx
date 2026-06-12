import { useState } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { toast } from "sonner";
import { Mail, Check, ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function BetaRequestForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    primary_goal: "Strength & Power",
    why_interested: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.why_interested.trim()) {
      toast.error("Please fill out all fields");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.BetaRequest.create({
        ...formData,
        requested_date: new Date().toISOString(),
        status: "pending",
      });

      setSubmitted(true);
      toast.success("Request submitted! We'll review and email you soon.");

      // Send confirmation email to applicant
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: "Vellera Beta Access Request Received",
        body: `Hi ${formData.full_name},\n\nThank you for your interest in Vellera! We've received your beta access request.\n\nWe're reviewing all requests and will email you within 5 business days with a decision.\n\nIn the meantime, you can learn more at vellera.app\n\nBest,\nThe Vellera Team`,
      });

      // Notify admins
      const adminNotification = {
        subject: `New Beta Request: ${formData.full_name}`,
        body: `New beta access request received:\n\nName: ${formData.full_name}\nEmail: ${formData.email}\nGoal: ${formData.primary_goal}\n\nWhy interested:\n${formData.why_interested}`,
      };
      await Promise.all([
        base44.integrations.Core.SendEmail({ to: "vellera@eds-360.com", ...adminNotification }),
        base44.integrations.Core.SendEmail({ to: "Asaad.morman@eds-360.com", ...adminNotification }),
      ]);
    } catch (err) {
      toast.error("Failed to submit request: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-commander-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-vellera-green/20 border border-vellera-green/40 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-vellera-green" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Request Submitted!</h1>
            <p className="text-commander-muted">We'll review your application and email you within 5 business days.</p>
          </div>
          <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-left space-y-2">
            <p className="text-xs text-commander-muted uppercase tracking-wider font-bold">What happens next:</p>
            <ol className="space-y-2 text-sm text-gray-300">
              <li className="flex gap-2"><span className="text-vellera-green">✓</span> We review your background & goals</li>
              <li className="flex gap-2"><span className="text-vellera-green">✓</span> We send you a confirmation email with access details</li>
              <li className="flex gap-2"><span className="text-vellera-green">✓</span> You get 30 days of full free access to test everything</li>
              <li className="flex gap-2"><span className="text-vellera-green">✓</span> You'll be asked for feedback at the end of the trial</li>
            </ol>
          </div>
          <div>
            <p className="text-xs text-commander-muted mb-4">Check your email (including spam folder) for updates.</p>
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-vellera-blue text-black font-black rounded-xl hover:opacity-90 transition-all">
              Back to Home <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-commander-muted hover:text-white transition text-sm">← Back</Link>
          <h1 className="text-4xl font-black text-white mt-4 mb-2">Join the Vellera Beta</h1>
          <p className="text-commander-muted">Help us build the future of training. Request your 30-day free trial.</p>
        </div>

        <div className="bg-commander-surface border border-commander-border rounded-2xl p-8 space-y-8">
          {/* Info Banner */}
          <div className="bg-vellera-blue/10 border border-vellera-blue/30 rounded-xl p-4 flex gap-3">
            <Shield className="w-5 h-5 text-vellera-blue shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-vellera-blue font-bold mb-1">Invitation-Only Beta</p>
              <p className="text-gray-400">This is a controlled beta program. We review all applications to ensure quality feedback and a cohesive testing community.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-bold text-sm mb-2">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-gray-800 border border-commander-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue transition min-h-[44px]"
                required
              />
            </div>

            <div>
              <label className="block text-white font-bold text-sm mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-commander-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue transition min-h-[44px]"
                required
              />
              <p className="text-xs text-commander-muted mt-1">We'll send your acceptance email here.</p>
            </div>

            <div>
              <label className="block text-white font-bold text-sm mb-2">Primary Fitness Goal *</label>
              <select
                name="primary_goal"
                value={formData.primary_goal}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-commander-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-vellera-blue transition min-h-[44px]"
                required
              >
                <option value="Strength & Power">Strength & Power</option>
                <option value="BJJ & Combat Sports">BJJ & Combat Sports</option>
                <option value="CrossFit & Conditioning">CrossFit & Conditioning</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Bodybuilding">Bodybuilding</option>
                <option value="Endurance">Endurance</option>
                <option value="Tactical / First Responder">Tactical / First Responder</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-bold text-sm mb-2">Why are you interested in Vellera? *</label>
              <textarea
                name="why_interested"
                value={formData.why_interested}
                onChange={handleChange}
                placeholder="Tell us what draws you to our platform. What problems are you looking to solve? What features are you most interested in testing?"
                rows={5}
                className="w-full bg-gray-800 border border-commander-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue transition resize-none"
                required
              />
              <p className="text-xs text-commander-muted mt-1">This helps us understand what you're looking for and assign you to the right cohort.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all min-h-[44px]"
              style={{
                backgroundColor: loading ? "#333" : "#00E5FF",
                color: loading ? "#666" : "#000",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Request Beta Access
                </>
              )}
            </button>
          </form>

          {/* Legal Info */}
          <div className="border-t border-commander-border pt-6">
            <p className="text-xs text-commander-muted leading-relaxed">
              By submitting this form, you agree to our <Link to="/terms" className="text-vellera-blue hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-vellera-blue hover:underline">Privacy Policy</Link>. We use your data to review your application and send you updates. You can unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-black text-white">Frequently Asked Questions</h2>
          {[
            {
              q: "How long is the beta trial?",
              a: "30 days from your approval date. You'll get full access to all Vellera features."
            },
            {
              q: "Will I be charged?",
              a: "No. The 30-day trial is completely free. If you decide to continue after, we'll let you know the pricing options."
            },
            {
              q: "How do I know if I'm approved?",
              a: "We'll send you an email within 5 business days. Check your spam folder if you don't see it."
            },
            {
              q: "What if I'm rejected?",
              a: "We aim to accept all genuine applicants, but we reserve the right to limit the beta to maintain quality. You can reapply later."
            },
            {
              q: "What happens after 30 days?",
              a: "We'll ask for your feedback. If you love it, you can convert to a paid subscription. Otherwise, your trial ends and your data is preserved."
            },
            {
              q: "Is my data safe during the beta?",
              a: "Yes. Your data is encrypted, never sold, and handled per HIPAA-aligned standards. See our Privacy Policy for details."
            },
          ].map((item, i) => (
            <div key={i} className="bg-commander-surface border border-commander-border rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">{item.q}</h3>
              <p className="text-commander-muted text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
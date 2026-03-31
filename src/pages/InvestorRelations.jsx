import { useState } from "react";
import { Zap, Shield, Music, Database, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

export default function InvestorRelations() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // TODO: Connect to backend email service or CRM
      console.log("Investor inquiry:", formData);
      toast.success("Thanks! We'll be in touch shortly.");
      setFormData({ name: "", company: "", email: "", message: "" });
    } catch (err) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-vellera-dark text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-vellera-blue/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-vellera-green/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            Invest in the Future of Fitness & Combat Conditioning.
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Vellera bridges the gap between everyday fitness and authentic martial arts training. Built for all levels. Driven by custom music integrations.
          </p>
          <button className="px-8 py-4 bg-vellera-blue text-commander-dark font-black rounded-xl hover:bg-cyan-400 transition-all text-lg inline-flex items-center gap-2">
            Schedule a Partner Meeting
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Market Gap Section */}
      <section className="py-24 px-4 bg-commander-surface/30 border-y border-commander-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">The Market Gap</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problem */}
            <div className="bg-red-950/20 border border-red-800 rounded-2xl p-8">
              <h3 className="text-2xl font-black mb-4 text-red-400">The Problem</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Zap className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>
                    Generic fitness apps lack authenticity and lock users into
                    curated, elevator-music playlists.
                  </p>
                </li>
                <li className="flex gap-3">
                  <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>
                    Authentic combat gyms are intimidating, cost $150+/month, and
                    require travel.
                  </p>
                </li>
                <li className="flex gap-3">
                  <Music className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <p>
                    No affordable digital solution bridges elite conditioning with
                    personal music preference.
                  </p>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-vellera-blue/20 border border-vellera-blue rounded-2xl p-8">
              <h3 className="text-2xl font-black mb-4 text-vellera-blue">The Vellera Solution</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-vellera-blue flex-shrink-0 mt-1" />
                  <p>
                    Premium digital hub at $19.99/mo with elite striking, grappling,
                    and fitness timers.
                  </p>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-vellera-blue flex-shrink-0 mt-1" />
                  <p>
                    "Bring Your Own Energy"—full Spotify API integration + Apple
                    Music coming soon.
                  </p>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-vellera-blue flex-shrink-0 mt-1" />
                  <p>
                    Accessible from anywhere. Train at your pace, on your terms,
                    with your music.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">The Unfair Advantage: The Founder</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image Placeholder */}
            <div className="relative h-96 bg-gradient-to-br from-vellera-blue/30 to-vellera-green/30 rounded-2xl border border-commander-border flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-24 h-24 text-vellera-blue mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Asaad Morman — Founder</p>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-black mb-2">Asaad Morman</h3>
                <p className="text-vellera-blue font-bold uppercase tracking-widest text-sm">
                  Founder & Creator
                </p>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                Asaad brings a lifetime of elite discipline to Vellera. With a deep background in
                the military and extensive experience in martial arts and tactical defense as part of
                Emerging Defense Solutions (EDS), Asaad understands what it takes to build physical
                resilience and mental toughness.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                <span className="font-bold text-vellera-blue">Vellera isn't a Silicon Valley gimmick.</span> It's forged in real-world discipline and tactical
                resilience, giving the brand unmatched authenticity. That's the unfair advantage.
              </p>
              <ul className="space-y-3 mt-6 pt-6 border-t border-commander-border">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-vellera-green flex-shrink-0" />
                  <span>Military-grade discipline & tactical training</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-vellera-green flex-shrink-0" />
                  <span>Founding Member, Emerging Defense Solutions (EDS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-vellera-green flex-shrink-0" />
                  <span>15+ years combat sports & conditioning expertise</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Architecture */}
      <section className="py-24 px-4 bg-commander-surface/30 border-y border-commander-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">Technology & Architecture</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Cross-Platform",
                desc: "Fully built and deployed codebase using React Native, with iOS and Android native support.",
                accent: "vellera-blue",
              },
              {
                icon: Music,
                title: "Audio Infrastructure",
                desc: "Custom audio-ducking technology integrating Spotify Web API, native device audio, and Apple Music (roadmap).",
                accent: "vellera-green",
              },
              {
                icon: Database,
                title: "Scalable Backend",
                desc: "Transaction-safe cloud database with atomic operations designed for high concurrency and 1000+ simultaneous users.",
                accent: "vellera-blue",
              },
            ].map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className="bg-commander-surface border border-commander-border rounded-2xl p-6 hover:border-vellera-blue transition-all"
                >
                  <Icon className={`w-8 h-8 text-${tech.accent} mb-4`} />
                  <h3 className="text-lg font-black mb-2">{tech.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{tech.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Revenue Engine */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">Revenue Engine & Go-To-Market</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Recurring Base */}
            <div className="bg-commander-surface border border-commander-border rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Recurring Base</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Monthly Plan</p>
                  <p className="text-4xl font-black text-vellera-blue">$19.99</p>
                  <p className="text-gray-400 text-sm mt-1">/ user / month</p>
                </div>
                <div className="border-t border-commander-border pt-4">
                  <p className="text-gray-400 text-sm mb-2">Annual Plan</p>
                  <p className="text-4xl font-black text-vellera-green">$119.99</p>
                  <p className="text-gray-400 text-sm mt-1">$9.99/mo (50% savings)</p>
                </div>
              </div>
            </div>

            {/* Founding Athlete */}
            <div className="bg-vellera-green/10 border-2 border-vellera-green rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-vellera-green">The Seed Injection</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Founding Athlete Tier</p>
                  <p className="text-4xl font-black text-vellera-green">$249.99</p>
                  <p className="text-gray-400 text-sm mt-1">Lifetime Access (one-time)</p>
                </div>
                <div className="border-t border-vellera-green/50 pt-4">
                  <p className="text-vellera-green font-bold text-lg">1,000 Units × $249.99</p>
                  <p className="text-4xl font-black text-vellera-green mt-2">$249,990</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Non-dilutive capital to fund marketing and operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 px-4 bg-commander-surface/30 border-t border-commander-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-8 text-center">Partner With Us</h2>
          <form
            onSubmit={handleSubmit}
            className="bg-commander-surface border border-commander-border rounded-2xl p-8 space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vellera-blue"
                  placeholder="Asaad Morman"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Firm / Company *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vellera-blue"
                  placeholder="Venture Capital Fund"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vellera-blue"
                placeholder="you@firm.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                className="w-full bg-gray-800 border border-commander-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vellera-blue resize-none"
                placeholder="Tell us about your interest in partnering with Vellera..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-vellera-blue text-commander-dark font-bold py-3 rounded-lg hover:bg-cyan-400 transition-all disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send Inquiry"}
            </button>
          </form>

          {/* Legal Links & Download */}
          <div className="mt-12 text-center space-y-4">
            <a
              href="#"
              className="inline-block px-6 py-2 bg-commander-surface border border-commander-border rounded-lg hover:border-vellera-blue transition-all font-bold"
            >
              📄 Download Pitch Deck (PDF)
            </a>
            <div className="flex justify-center gap-4 text-xs text-gray-500">
              <a href="/privacy" className="hover:text-gray-300 transition-all">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="/terms" className="hover:text-gray-300 transition-all">
                Terms of Service
              </a>
              <span>•</span>
              <a href="#" className="hover:text-gray-300 transition-all">
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
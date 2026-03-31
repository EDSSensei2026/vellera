import { useState } from "react";
import { ChevronRight, Zap, Heart, Dumbbell, Shield, Music, Star, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  const [reviewIndex, setReviewIndex] = useState(0);

  const reviews = [
    {
      name: "Jordan M.",
      role: "BJJ Athlete",
      text: "Finally, an app that gets combat sports. The MMA timers and grappling flows are exactly what I needed. No generic fitness noise.",
      rating: 5,
    },
    {
      name: "Maya P.",
      role: "Fitness Beginner",
      text: "I was intimidated by fitness apps, but Vellera's interface is clean and welcoming. The mobility routines are perfect for my pace.",
      rating: 5,
    },
    {
      name: "Alex T.",
      role: "Strength Coach",
      text: "The Spotify integration is game-changing. My clients love training to their own playlists. This is the future of fitness apps.",
      rating: 5,
    },
  ];

  const features = [
    {
      title: "The Primer & Reset",
      desc: "Mobility, yoga, and recovery routines to keep you feeling alive.",
      icon: "🧘",
    },
    {
      title: "The Tempo",
      desc: "Beat-driven cardio and HIIT that moves with your music.",
      icon: "⚡",
    },
    {
      title: "The Foundation",
      desc: "Strength and weightlifting protocols built for real athletes.",
      icon: "💪",
    },
    {
      title: "Vellera Combat",
      desc: "MMA, boxing, and grappling timers. Fight-ready conditioning.",
      icon: "🥊",
    },
    {
      title: "Bring Your Own Energy",
      desc: "Full Spotify & Apple Music integration. Your soundtrack, your rules.",
      icon: "🎵",
    },
  ];

  return (
    <div className="bg-vellera-dark min-h-screen text-white overflow-hidden">
      {/* Beta Banner */}
      <div className="bg-yellow-900/40 border-b border-yellow-700 px-4 py-3 text-center">
        <p className="text-sm text-yellow-300 font-semibold">
          ⚠️ <span className="uppercase tracking-widest">Beta Version</span> — Currently awaiting App Store & Play Store approval. Features may change.
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-vellera-blue/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-vellera-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4 tracking-tight">
                  Your Pace.<br />
                  Your Progress.<br />
                  Your <span className="text-vellera-blue">Vellera.</span>
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed">
                  The only fitness and combat sports app built for all levels—from your first 15-minute mobility routine to elite MMA conditioning.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button disabled className="px-6 py-4 bg-gray-600 text-white font-bold rounded-lg opacity-60 cursor-not-allowed flex items-center justify-center gap-2" title="Coming soon after app store approval">
                    📱 Coming to iOS
                  </button>
                  <button disabled className="px-6 py-4 bg-gray-600 text-white font-bold rounded-lg opacity-60 cursor-not-allowed flex items-center justify-center gap-2" title="Coming soon after app store approval">
                    🤖 Coming to Android
                  </button>
              </div>

              <p className="text-sm text-gray-500">📋 Beta access available — download directly from this web app for now.</p>
            </div>

            {/* Right: Phone Mockup */}
            <div className="relative hidden md:flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-vellera-blue/20 to-vellera-green/20 rounded-3xl blur-2xl"></div>
              <div className="relative w-72 h-96 bg-gradient-to-b from-gray-900 to-black border-8 border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-vellera-blue/20 via-transparent to-vellera-green/20"></div>
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-full border border-gray-800 flex items-center justify-center text-xs text-gray-500 z-50">
                  9:41
                </div>
                <div className="mt-8 px-4 space-y-3 text-center">
                  <div className="h-3 bg-vellera-blue/30 rounded-full w-2/3 mx-auto"></div>
                  <div className="h-3 bg-vellera-green/30 rounded-full w-3/4 mx-auto"></div>
                  <div className="h-3 bg-vellera-blue/20 rounded-full w-1/2 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-vellera-blue/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Built Different.</h2>
            <p className="text-xl text-gray-300">Everything you need to find your momentum.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-commander-surface border border-commander-border rounded-2xl p-6 hover:border-vellera-blue transition-all group cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Why Vellera Wins.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Other Apps */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-400">Other Fitness Apps</h3>
              <ul className="space-y-4">
                {[
                  "Intimidating metrics & jargon",
                  "Generic, royalty-free music",
                  "Locked into one training style",
                  "Designed for gym bros, not everyone",
                  "No room for your personality",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="text-red-500 font-bold mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vellera */}
            <div className="bg-gradient-to-br from-vellera-blue/20 to-vellera-green/20 border border-vellera-blue/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Vellera</h3>
              <ul className="space-y-4">
                {[
                  "Personal momentum, not metrics",
                  "Spotify & Apple Music integration",
                  "Combat sports + fitness + recovery",
                  "Built for beginners AND athletes",
                  "Your soundtrack, your style, your pace",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white">
                    <span className="text-vellera-green font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-vellera-green/5 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="bg-commander-surface border border-commander-border rounded-2xl p-12">
            <h2 className="text-4xl font-black mb-6">Forged in Discipline.</h2>
            <h3 className="text-2xl text-vellera-blue font-bold mb-8">Built for Everyone.</h3>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Vellera wasn't created in a Silicon Valley boardroom. It was born from a need for a training platform that respects the mental and physical grind of real athletes, while remaining entirely accessible to beginners.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              We realized that true momentum—whether you are walking your first mile or stepping onto the mat—requires the same mindset: discipline, consistency, and the right tools. Vellera bridges that gap.
            </p>
          </div>
        </div>
      </section>

      {/* Creator Profile */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-12">Meet the Creator.</h2>

          <div className="bg-commander-surface border border-commander-border rounded-2xl p-12 space-y-6">
            {/* Placeholder Avatar */}
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-vellera-blue to-vellera-green rounded-full border-4 border-commander-border flex items-center justify-center">
              <span className="text-5xl">🛡️</span>
            </div>

            <div>
              <h3 className="text-3xl font-black">Asaad Morman</h3>
              <p className="text-vellera-blue font-bold text-sm uppercase tracking-widest">Founder & Creator</p>
            </div>

            <p className="text-gray-300 leading-relaxed">
              Asaad Morman brings a lifetime of elite discipline to Vellera. With a deep background in the military and extensive experience in martial arts and tactical defense (as part of Emerging Defense Solutions / EDS), Asaad understands what it takes to build physical resilience and mental toughness.
            </p>

            <p className="text-gray-300 leading-relaxed font-bold text-vellera-green">
              He created Vellera to bridge the gap between elite combat conditioning and everyday fitness, ensuring that anyone, from any background, has the tools to build their own momentum.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Carousel */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-vellera-blue/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">What Users Are Saying.</h2>
          </div>

          {/* Carousel */}
          <div className="relative">
            <div className="bg-commander-surface border border-commander-border rounded-2xl p-12 min-h-64 flex flex-col justify-between">
              {/* Review Content */}
              <div>
                <div className="flex gap-1 mb-4">
                  {Array(reviews[reviewIndex].rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-vellera-green text-vellera-green" />
                    ))}
                </div>
                <p className="text-xl text-gray-200 mb-6 italic">"{reviews[reviewIndex].text}"</p>
              </div>

              <div>
                <p className="font-bold text-white">{reviews[reviewIndex].name}</p>
                <p className="text-vellera-blue text-sm">{reviews[reviewIndex].role}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button onClick={() => setReviewIndex((i) => (i - 1 + reviews.length) % reviews.length)} className="p-3 bg-commander-surface border border-commander-border rounded-lg hover:border-vellera-blue transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-2">
                {reviews.map((_, i) => (
                  <button key={i} onClick={() => setReviewIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === reviewIndex ? "bg-vellera-blue w-8" : "bg-gray-600"}`} />
                ))}
              </div>

              <button onClick={() => setReviewIndex((i) => (i + 1) % reviews.length)} className="p-3 bg-commander-surface border border-commander-border rounded-lg hover:border-vellera-blue transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-8">Ready to find your pace?</h2>

          <button className="px-8 py-4 bg-gradient-to-r from-vellera-blue to-vellera-green text-vellera-dark font-bold rounded-xl text-lg hover:shadow-2xl hover:shadow-vellera-blue/50 transition-all">
            Start Your 7-Day Free Trial
          </button>

          <p className="text-gray-400 text-sm mt-4">✨ No credit card required. Full access to all features.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-commander-border bg-commander-dark/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <p className="font-bold text-vellera-blue mb-4">Vellera</p>
              <p className="text-sm text-gray-400">Your pace. Your progress.</p>
            </div>

            <div>
              <p className="font-bold mb-4">Links</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-vellera-blue transition">
                    About EDS
                  </a>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-vellera-blue transition">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-bold mb-4">Legal</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/terms" className="hover:text-vellera-blue transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-vellera-blue transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-bold mb-4">Follow</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-vellera-blue transition">
                    Twitter / X
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-vellera-blue transition">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-commander-border pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 Vellera. Built with discipline.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
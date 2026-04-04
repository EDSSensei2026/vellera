import { CheckCircle2, Zap, Video, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: "What is hybrid training?",
    a: "Hybrid training combines functional strength, conditioning, and martial arts fundamentals to build athletes who are strong, fast, and combat-ready."
  },
  {
    q: "How often should I train?",
    a: "Optimal hybrid training follows a 4-5 day split: 2 strength days, 2 combat/skill days, 1 conditioning. Recovery is critical."
  },
  {
    q: "Can I track my progress on Vellera?",
    a: "Yes. Every workout logs volume, intensity, and skill progression. Share your stats instantly to social media."
  },
  {
    q: "Do I need a coach?",
    a: "Not required, but highly recommended. Video feedback from a coach accelerates learning and prevents injury."
  },
];

export default function HybridAthlete() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  };

  return (
    <div className="min-h-screen bg-vellera-dark text-white pb-24">
      {/* JSON-LD Schema */}
      <script type="application/ld+json">{JSON.stringify(schema)}</script>

      {/* Hero */}
      <div className="relative overflow-hidden px-4 py-24 text-center space-y-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-vellera-blue rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-vellera-green rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-5xl font-black leading-tight mb-4">
            Hybrid Athlete Training
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Strength. Speed. Combat Ready. Track every rep, every drill, every improvement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/onboarding?type=hybrid" className="px-8 py-3 bg-vellera-green text-black font-black rounded-lg hover:opacity-90 transition">
              Start Free Trial
            </Link>
            <Link to="/referral" className="px-8 py-3 border-2 border-vellera-green text-vellera-green font-black rounded-lg hover:bg-vellera-green/10 transition">
              Refer a Coach
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-vellera-green shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold">Functional Strength</h3>
                <p className="text-commander-muted text-sm">Progressive overload protocols for real-world power.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-vellera-blue shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold">Video Form Analysis</h3>
                <p className="text-commander-muted text-sm">Coach feedback with AI-powered telestration in seconds.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-vellera-green shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold">Coach Directory</h3>
                <p className="text-commander-muted text-sm">Find specialists in your discipline.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-vellera-blue shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold">Performance Tracking</h3>
                <p className="text-commander-muted text-sm">Volume, intensity, skill progression all in one dashboard.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-vellera-green shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold">Shareable Stats</h3>
                <p className="text-commander-muted text-sm">Export your training card to Instagram instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-vellera-green shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold">AI Coaching</h3>
                <p className="text-commander-muted text-sm">Real-time technique tips and recovery recommendations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h2 className="text-3xl font-black text-center mb-12">Hybrid Athlete FAQ</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-commander-surface border border-commander-border rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">{faq.q}</h3>
              <p className="text-commander-muted text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 bg-gradient-to-r from-vellera-green/10 to-vellera-blue/10 rounded-2xl border border-vellera-green/40">
        <h2 className="text-3xl font-black">Ready to become a Hybrid Athlete?</h2>
        <p className="text-gray-300">Join thousands training smarter with video feedback and performance tracking.</p>
        <Link to="/onboarding?type=hybrid" className="inline-block px-8 py-3 bg-vellera-green text-black font-black rounded-lg hover:opacity-90 transition">
          Start Free Trial
        </Link>
      </div>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { Shield, Clock, Zap, AlertCircle } from 'lucide-react';

export default function ExecutiveFitnessDefense() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is executive tactical fitness?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A hybrid training program designed for professionals requiring situational awareness, tactical movement, and real-world performance under stress. Combines functional strength, de-escalation drills, and situational response conditioning.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much time does it require per week?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Flexible programming: 45-60 min sessions, 3-4x per week. Can be done at home, office gym, or tactical range.'
        }
      },
    ]
  };

  return (
    <div className="min-h-screen bg-vellera-dark text-white pb-24">
      <script type="application/ld+json">{JSON.stringify(schema)}</script>

      {/* Hero */}
      <div className="px-4 py-20 text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-5xl font-black">Executive Fitness & Tactical Defense</h1>
        <p className="text-xl text-gray-300">
          For professionals who need strength, speed, and situational readiness. Training built for high-stakes environments.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/onboarding?type=tactical" className="px-8 py-3 bg-vellera-green text-black font-black rounded-lg hover:opacity-90 transition">
            Start Program
          </Link>
          <Link to="/coach" className="px-8 py-3 border-2 border-vellera-blue text-vellera-blue font-black rounded-lg hover:bg-vellera-blue/10 transition">
            Tactical Coach
          </Link>
        </div>
      </div>

      {/* Pillars */}
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
        <h2 className="text-3xl font-black text-center mb-12">Core Training Pillars</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-3">
            <Zap className="w-6 h-6 text-vellera-green" />
            <h3 className="text-white font-black text-lg">Functional Strength</h3>
            <p className="text-commander-muted text-sm">Compound movements under fatigue. Real-world loaded patterns.</p>
            <ul className="text-xs text-gray-400 space-y-1 mt-3">
              <li>• Loaded carries & sleds</li>
              <li>• Explosive pulling & pressing</li>
              <li>• Core bracing under load</li>
            </ul>
          </div>

          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-3">
            <AlertCircle className="w-6 h-6 text-vellera-blue" />
            <h3 className="text-white font-black text-lg">Tactical Movement</h3>
            <p className="text-commander-muted text-sm">De-escalation, positioning, and situational response.</p>
            <ul className="text-xs text-gray-400 space-y-1 mt-3">
              <li>• Footwork & stance transitions</li>
              <li>• Environmental awareness</li>
              <li>• Explosive directional changes</li>
            </ul>
          </div>

          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-3">
            <Clock className="w-6 h-6 text-vellera-green" />
            <h3 className="text-white font-black text-lg">Work Capacity</h3>
            <p className="text-commander-muted text-sm">Maintain performance under sustained stress.</p>
            <ul className="text-xs text-gray-400 space-y-1 mt-3">
              <li>• Zone 2 steady state</li>
              <li>• Vo2 max intervals</li>
              <li>• Recovery protocols</li>
            </ul>
          </div>

          <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-3">
            <Shield className="w-6 h-6 text-vellera-blue" />
            <h3 className="text-white font-black text-lg">Injury Prevention</h3>
            <p className="text-commander-muted text-sm">Joint stability & soft tissue resilience.</p>
            <ul className="text-xs text-gray-400 space-y-1 mt-3">
              <li>• Mobility sequences</li>
              <li>• Prehab & rehab</li>
              <li>• Load management</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-4 py-16 text-center bg-gradient-to-r from-vellera-green/10 to-vellera-blue/10 rounded-2xl border border-vellera-blue/40 space-y-6">
        <h2 className="text-3xl font-black">Train for Real-World Performance</h2>
        <p className="text-gray-300">7-day free trial. No credit card required.</p>
        <Link to="/onboarding?type=tactical" className="inline-block px-8 py-3 bg-vellera-green text-black font-black rounded-lg hover:opacity-90 transition">
          Start Free
        </Link>
      </div>
    </div>
  );
}
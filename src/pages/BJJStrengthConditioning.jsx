import { Link } from 'react-router-dom';
import { BarChart3, Shield, Zap, Video } from 'lucide-react';

export default function BJJStrengthConditioning() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does strength training improve BJJ performance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Strength increases escape speed, grip power, and injury resilience. A comprehensive BJJ S&C program targets hip mobility, core bracing, and posterior chain power for technique execution.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the ideal training split for BJJ athletes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Optimal split: 2 strength days (lower/upper), 3-4 mat sessions (technique + sparring), 1 mobility day. Periodize around competition schedule.'
        }
      },
    ]
  };

  return (
    <div className="min-h-screen bg-vellera-dark text-white pb-24">
      <script type="application/ld+json">{JSON.stringify(schema)}</script>

      {/* Hero */}
      <div className="px-4 py-20 text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-5xl font-black">BJJ + Strength & Conditioning</h1>
        <p className="text-xl text-gray-300">
          Video-analyzed strength drills + periodized S&C programming built for grappling.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/onboarding?type=bjj" className="px-8 py-3 bg-vellera-green text-black font-black rounded-lg hover:opacity-90 transition">
            Start Training
          </Link>
          <Link to="/coach" className="px-8 py-3 border-2 border-vellera-blue text-vellera-blue font-black rounded-lg hover:bg-vellera-blue/10 transition">
            Find S&C Coach
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-3">
          <Zap className="w-6 h-6 text-vellera-green" />
          <h3 className="text-white font-black text-lg">Lower Body Strength</h3>
          <p className="text-commander-muted text-sm">Hip pressure, guard retention, and escape power. Every rep counts.</p>
        </div>

        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-3">
          <BarChart3 className="w-6 h-6 text-vellera-blue" />
          <h3 className="text-white font-black text-lg">Volume Tracking</h3>
          <p className="text-commander-muted text-sm">Log every squat, deadlift, and conditioning session. Auto-calculate tonnage.</p>
        </div>

        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-3">
          <Video className="w-6 h-6 text-vellera-green" />
          <h3 className="text-white font-black text-lg">Form Video Analysis</h3>
          <p className="text-commander-muted text-sm">Submit your lifts. Get immediate feedback from S&C specialists.</p>
        </div>

        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-3">
          <Shield className="w-6 h-6 text-vellera-blue" />
          <h3 className="text-white font-black text-lg">Injury Prevention</h3>
          <p className="text-commander-muted text-sm">AI-powered mobility cues based on grappling mechanics.</p>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { X, Check, Lock } from "lucide-react";
import PricingCard from "../components/PricingCard";
import SubscriptionCheckout from "../components/SubscriptionCheckout";

const VALUE_PROPS = [
  "Access to the exclusive Vellera Combat Hub (MMA, Boxing, Grappling)",
  "Full Spotify & Apple Music integration",
  "Hundreds of guided routines (Mobility, Strength, HIIT)",
  "Advanced progress and streak tracking",
];

export default function Paywall() {
  const [selectedPlan, setSelectedPlan] = useState("premium");
  
  const planMap = {
    premium: 'premium',
    elite: 'elite',
  };

  const handleSkip = () => {
    window.history.back();
  };

  return (
    <div className="relative min-h-screen bg-commander-dark text-white overflow-hidden">
      {/* Background blur glow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-vellera-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-50 p-2 text-commander-muted hover:text-white transition-all touch-target-min"
        title="Exit"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen px-4 py-8 overflow-auto">
        {/* Hero Section */}
        <div className="relative mb-8 rounded-2xl overflow-hidden h-48 sm:h-64">
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1518611505867-48a8e4aa0f09?w=600&h=400&fit=crop"
            alt="Athlete training"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Hero text */}
          <div className="relative h-full flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl sm:text-4xl font-black mb-2 leading-tight">Unlock Your Full Momentum</h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-xs">
              Join thousands of athletes training at their own pace. Start your 7-day free trial today. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Value Props */}
        <div className="mb-8 space-y-3">
          {VALUE_PROPS.map((prop, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-vellera-blue flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-200">{prop}</span>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="mb-8 space-y-3">
          <PricingCard
            title="Premium Training"
            price="$29.99"
            period="month"
            badge="MOST POPULAR"
            isSelected={selectedPlan === "premium"}
            onClick={() => setSelectedPlan("premium")}
            trialText="Full access to all training programs"
          />

          <PricingCard
            title="Elite Coaching"
            price="$49.99"
            period="month"
            isSelected={selectedPlan === "elite"}
            onClick={() => setSelectedPlan("elite")}
            trialText="Premium + 1-on-1 coaching sessions"
          />
        </div>

        {/* CTA Button */}
        <SubscriptionCheckout planType={planMap[selectedPlan]} />

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
          <Lock className="w-3 h-3" />
          <span>Secure checkout via App Store. No commitment, cancel anytime.</span>
        </div>

        {/* Legal Links */}
        <div className="flex justify-center gap-4 text-xs text-gray-500 pb-4">
          <a href="#" className="hover:text-gray-300 transition-all">
            Restore Purchases
          </a>
          <span>•</span>
          <a href="#" className="hover:text-gray-300 transition-all">
            Terms of Service
          </a>
          <span>•</span>
          <a href="#" className="hover:text-gray-300 transition-all">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
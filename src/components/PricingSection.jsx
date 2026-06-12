import { useState, useEffect } from "react";
import { Lock, Check } from "lucide-react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };

export default function PricingSection() {
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await base44.functions.invoke('getFoundingSpotsLeft', {});
        setSpotsLeft(response.data);
      } catch (err) {
        console.error("Failed to fetch spots:", err);
        setSpotsLeft({ spots_left: 742, spots_total: 1000 });
      } finally {
        setLoading(false);
      }
    };
    fetchSpots();
  }, []);

  const pricingCards = [
    {
      id: "monthly",
      name: "The Grind",
      price: "$19.99",
      period: "month",
      badge: null,
      description: "Perfect for testing your momentum.",
      features: [
        "Full access to The Primer & The Tempo",
        "The Foundation (strength & conditioning)",
        "Vellera Combat Hub (MMA, Boxing, Grappling)",
        "Spotify API & Local Audio integration",
        "Progress & streak tracking",
        "Cancel anytime",
      ],
      cta: "Subscribe Monthly",
      ctaStyle: "outline",
      accentColor: null,
      href: "/paywall?plan=monthly",
    },
    {
      id: "annual",
      name: "The Vellera Era",
      price: "$119.99",
      period: "year",
      badge: "MOST POPULAR - SAVE 50%",
      description: "The best value. Recommended.",
      features: [
        "All Grind features included",
        "Apple Music integration (coming soon)",
        "Priority support",
        "7-Day Free Trial",
        "Cancel anytime, no questions asked",
      ],
      cta: "Start 7-Day Free Trial",
      ctaStyle: "solid",
      accentColor: "vellera-blue",
      href: "/paywall?plan=annual",
      isHighlighted: true,
    },
    {
      id: "lifetime",
      name: "Founding Athlete",
      price: "$249.99",
      period: "Lifetime",
      badge: "LIMITED EDITION - ONLY 1,000 SPOTS",
      description: "One-time investment. Forever access.",
      features: [
        "Lifetime access to all features",
        "All current & future updates",
        "Exclusive Founding Athlete badge",
        "VIP priority support",
        "No recurring charges. Ever.",
        "Part of something rare.",
      ],
      cta: "Claim Lifetime Access",
      ctaStyle: "solid",
      accentColor: "vellera-green",
      href: "/paywall?plan=founding_athlete",
      scarcity: spotsLeft,
    },
  ];

  return (
    <section className="py-24 px-4 bg-vellera-dark relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-vellera-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-vellera-green/5 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Invest in Your Momentum.
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Simple, transparent pricing. Train at your own pace with no hidden gym fees.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {pricingCards.map((card) => (
            <div
              key={card.id}
              className={`relative rounded-2xl transition-all ${
                card.isHighlighted
                  ? "md:scale-105 border-2 border-vellera-blue bg-vellera-blue/10 shadow-2xl shadow-vellera-blue/30"
                  : card.accentColor === "vellera-green"
                  ? "border-2 border-vellera-green bg-commander-surface"
                  : "border-2 border-commander-border bg-commander-surface hover:border-commander-red transition-all"
              } p-6 sm:p-8 flex flex-col h-full`}
            >
              {/* Badge */}
              {card.badge && (
                <div className="mb-4">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      card.accentColor === "vellera-green"
                        ? "bg-vellera-green/20 text-vellera-green"
                        : "bg-vellera-blue/20 text-vellera-blue"
                    }`}
                  >
                    {card.badge}
                  </span>
                </div>
              )}

              {/* Card Name & Description */}
              <h3 className="text-2xl font-black mb-1">{card.name}</h3>
              <p className="text-sm text-gray-400 mb-6">{card.description}</p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span
                  className={`text-4xl font-black ${
                    card.accentColor === "vellera-green"
                      ? "text-vellera-green"
                      : "text-vellera-blue"
                  }`}
                >
                  {card.price}
                </span>
                <span className="text-gray-400 text-sm">/{card.period}</span>
              </div>

              {/* Scarcity Indicator (Founding Athlete) */}
              {card.scarcity && !loading && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Spots Remaining</span>
                    <span className="text-xs font-bold text-vellera-green">
                      {card.scarcity.spots_left} / {card.scarcity.spots_total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-vellera-green h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          ((card.scarcity.spots_total - card.scarcity.spots_left) /
                            card.scarcity.spots_total) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Features List */}
              <ul className="space-y-3 mb-8 flex-1">
                {card.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        card.accentColor === "vellera-green"
                          ? "text-vellera-green"
                          : "text-vellera-blue"
                      }`}
                    />
                    <span className="text-sm text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <a
                href={card.href}
                className={`block text-center py-3 px-4 rounded-xl font-bold transition-all min-h-[48px] flex items-center justify-center ${
                  card.ctaStyle === "solid"
                    ? card.accentColor === "vellera-green"
                      ? "bg-vellera-green text-commander-dark hover:bg-lime-300"
                      : "bg-vellera-blue text-commander-dark hover:bg-cyan-400"
                    : "border-2 border-gray-600 text-white hover:border-gray-400"
                }`}
              >
                {card.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-400 bg-commander-surface/50 border border-commander-border rounded-xl p-6">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>
            Secure, encrypted checkout. Cancel anytime. Available on iOS and Android.
          </span>
        </div>
      </div>
    </section>
  );
}
export default function PricingCard({
  title,
  price,
  period,
  subtext,
  trialText,
  badge,
  isSelected,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left min-h-[120px] flex flex-col justify-between ${
        isSelected
          ? "border-vellera-blue bg-vellera-blue/10 shadow-lg shadow-vellera-blue/30"
          : "border-commander-border bg-commander-surface hover:border-commander-red"
      }`}
    >
      {badge && (
        <div className="inline-block mb-2">
          <span className="text-xs font-black text-vellera-blue bg-vellera-blue/20 px-2 py-1 rounded-full">
            {badge}
          </span>
        </div>
      )}

      <div>
        <p className="text-white font-bold text-lg">{title}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black text-vellera-blue">{price}</span>
          <span className="text-sm text-commander-muted">/{period}</span>
        </div>
        {subtext && <p className="text-xs text-commander-muted mt-1">{subtext}</p>}
        {trialText && <p className="text-xs text-green-400 mt-1">{trialText}</p>}
      </div>
    </button>
  );
}
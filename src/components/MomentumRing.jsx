export default function MomentumRing({ score = 0, level = 1 }) {
  const pct = Math.min(100, (score % 1000) / 10);

  return (
    <div className="bg-commander-surface border border-commander-border rounded-2xl p-8 flex flex-col items-center justify-center">
      <p className="text-xs text-commander-muted uppercase tracking-widest mb-4">Momentum Score</p>

      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" fill="none" stroke="#2a2a2a" strokeWidth="8" />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - pct / 100)}`}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#CCFF00" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-vellera-blue">Level {level}</p>
          <p className="text-xs text-commander-muted mt-1">{score} Pts</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-commander-muted text-xs">
          {pct.toFixed(0)}% to next level
        </p>
      </div>
    </div>
  );
}
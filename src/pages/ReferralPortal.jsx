import { useState, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Copy, Check, Gift, Users, TrendingUp } from 'lucide-react';
import BackButton from '../components/BackButton';

export default function ReferralPortal() {
  const [user, setUser] = useState(null);
  const [referral, setReferral] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Fetch or create referral for this user
      const existing = await base44.entities.Referral.filter({ referrer_email: me.email });
      if (existing.length > 0) {
        setReferral(existing[0]);
      } else {
        // Create new referral code
        const code = `VELLERA${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const link = `https://vellera.app?ref=${code}`;
        const newReferral = await base44.entities.Referral.create({
          referrer_email: me.email,
          referrer_type: 'student', // Can be overridden by coach detection
          referral_code: code,
          referral_link: link,
        });
        setReferral(newReferral);
      }

      // Fetch all referrals from this user
      const myReferrals = await base44.entities.Referral.filter({ referrer_email: me.email });
      setReferrals(myReferrals);

      setLoading(false);
    };
    init();
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(referral?.referral_link || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activatedCount = referrals.filter(r => r.status === 'activated').length;
  const rewardedCount = referrals.filter(r => r.reward_unlocked).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 safe-area-top">
      <div className="flex items-center gap-2 mb-4">
        <BackButton to="/" />
        <h1 className="text-white text-2xl font-black">Refer & Earn</h1>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-vellera-green/20 to-vellera-blue/20 border border-vellera-green/40 rounded-2xl p-6 text-center">
        <Gift className="w-12 h-12 text-vellera-green mx-auto mb-3" />
        <h2 className="text-white font-black text-lg mb-2">Unlock Premium Features</h2>
        <p className="text-commander-muted text-sm">Invite a friend. They complete 3 drills. You both get rewards.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
          <p className="text-commander-muted text-xs uppercase mb-2">Invited</p>
          <p className="text-white text-3xl font-black">{referrals.length}</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
          <p className="text-commander-muted text-xs uppercase mb-2">Activated</p>
          <p className="text-vellera-green text-3xl font-black">{activatedCount}</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
          <p className="text-commander-muted text-xs uppercase mb-2">Rewards</p>
          <p className="text-vellera-blue text-3xl font-black">{rewardedCount}</p>
        </div>
      </div>

      {/* Referral Link */}
      {referral && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-white font-bold text-sm">Your Referral Link</p>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-3">
            <input
              type="text"
              value={referral.referral_link}
              readOnly
              className="flex-1 bg-transparent text-white text-xs font-mono outline-none"
            />
            <button
              onClick={copyLink}
              className="text-vellera-blue hover:text-vellera-green transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-commander-muted text-xs">Share this link to invite friends</p>
        </div>
      )}

      {/* Reward Structure */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
        <p className="text-white font-bold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-vellera-green" />
          Reward Structure
        </p>
        <div className="space-y-2">
          {[
            { count: 1, reward: 'Premium for 1 week' },
            { count: 3, reward: 'Premium for 1 month' },
            { count: 5, reward: '100 credits + custom program' },
          ].map((tier, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-900 rounded-lg">
              <span className="text-white text-sm">{tier.count} activated referrals</span>
              <span className="text-vellera-green text-xs font-bold">{tier.reward}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Referral List */}
      {referrals.length > 0 && (
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-3">
          <p className="text-white font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Your Referrals
          </p>
          <div className="space-y-2">
            {referrals.map(ref => (
              <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                <div>
                  <p className="text-white text-sm font-semibold">{ref.referred_email || 'Pending'}</p>
                  <p className={`text-xs mt-1 font-bold uppercase ${
                    ref.status === 'rewarded' ? 'text-vellera-green' :
                    ref.status === 'activated' ? 'text-vellera-blue' :
                    'text-yellow-500'
                  }`}>
                    {ref.status}
                  </p>
                </div>
                {ref.reward_unlocked && <Gift className="w-4 h-4 text-vellera-green" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SubscriptionCheckout({ planType, priceId, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Check if running in iframe (published app requirement)
      if (window.self !== window.top) {
        toast.error('Checkout only works from the published app, not the preview.');
        setLoading(false);
        return;
      }

      const res = await base44.functions.invoke('createCheckoutSession', {
        planType,
        priceId,
      });

      if (!res.data?.url) {
        toast.error('Failed to create checkout session');
        setLoading(false);
        return;
      }

      window.location.href = res.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-vellera-blue text-vellera-dark font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-vellera-blue/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Subscribe Now'
      )}
    </button>
  );
}
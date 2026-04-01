import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SubscriptionCheckout({ planType, priceId }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    console.log('Starting checkout with planType:', planType);
    
    try {
      if (window.self !== window.top) {
        toast.error('Checkout only works from the published app, not the preview.');
        setLoading(false);
        return;
      }

      if (!planType) {
        toast.error('Please select a plan');
        setLoading(false);
        return;
      }

      console.log('Invoking createCheckoutSession...');
      const res = await base44.functions.invoke('createCheckoutSession', {
        planType: planType,
        priceId: priceId || null,
      });

      console.log('Response:', res.data);
      
      if (!res.data?.url) {
        toast.error('Failed to create checkout session');
        setLoading(false);
        return;
      }

      console.log('Redirecting to:', res.data.url);
      window.location.href = res.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('Checkout failed: ' + errorMsg);
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
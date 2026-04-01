import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = await import('npm:stripe@17.0.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

const PRICES = {
  premium: 'price_1THSpOE0ms2VThmPq0FfHc86',
  elite: 'price_1THSpOE0ms2VThmPkLinTRTz',
  founding: 'price_1THSpOE0ms2VThmPjx8L7GaT',
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { priceId, planType } = body;

    if (!priceId && !planType) {
      return Response.json({ error: 'Missing priceId or planType' }, { status: 400 });
    }

    const selectedPrice = priceId || PRICES[planType];
    if (!selectedPrice) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: planType === 'founding' || priceId === PRICES.founding ? 'payment' : 'subscription',
      line_items: [
        {
          price: selectedPrice,
          quantity: 1,
        },
      ],
      success_url: `${new URL(req.url).origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/paywall`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
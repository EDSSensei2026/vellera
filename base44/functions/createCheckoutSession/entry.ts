import Stripe from 'npm:stripe@17.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PRICES = {
  premium: 'price_1THSpOE0ms2VThmPq0FfHc86',
  elite: 'price_1THSpOE0ms2VThmPkLinTRTz',
  founding: 'price_1THSpOE0ms2VThmPjx8L7GaT',
};

Deno.serve(async (req) => {
  try {
    let body = {};
    
    // Only parse JSON if there's a body
    if (req.method === 'POST' && req.body) {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          body = await req.json();
        } catch (e) {
          console.error('JSON parse error:', e);
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
      }
    }

    const { priceId, planType } = body;

    if (!priceId && !planType) {
      return Response.json({ error: 'Missing priceId or planType' }, { status: 400 });
    }

    const selectedPrice = priceId || PRICES[planType];
    if (!selectedPrice) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const mode = planType === 'founding' || priceId === PRICES.founding ? 'payment' : 'subscription';
    const successUrl = `${new URL(req.url).origin}/?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${new URL(req.url).origin}/paywall`;

    console.log(`Creating ${mode} checkout for price ${selectedPrice}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: mode,
      line_items: [{ price: selectedPrice, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { base44_app_id: Deno.env.get('BASE44_APP_ID') },
    });

    console.log(`Checkout session created: ${session.id}`);
    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
});
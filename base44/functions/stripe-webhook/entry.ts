import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = await import('npm:stripe@17.0.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log(`Webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(`✓ Payment successful - Session: ${session.id}`);
        // Update user subscription status in database if needed
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        console.log(`✓ Subscription ${event.type.split('.')[2]} - Customer: ${subscription.customer}`);
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        console.log(`✗ Subscription cancelled - Customer: ${deletedSub.customer}`);
        break;

      case 'payment_intent.succeeded':
        console.log(`✓ Payment intent succeeded`);
        break;

      case 'payment_intent.payment_failed':
        console.log(`✗ Payment failed`);
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});
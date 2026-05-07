const router = require('express').Router();

router.post('/create-intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('YOUR_SECRET_KEY_HERE')) {
      return res.status(503).json({ error: 'Stripe payments are not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { amount_usd } = req.body;
    if (!amount_usd || parseFloat(amount_usd) <= 0)
      return res.status(400).json({ error: 'Invalid amount' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount_usd) * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

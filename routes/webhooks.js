const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb, save } = require('../db');

function rowsToObjects(result) {
  if (!result[0]) return [];
  const cols = result[0].columns;
  return result[0].values.map(row =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]]))
  );
}

// Stripe sends raw body — must be mounted before express.json()
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { orderId } = paymentIntent.metadata;

    try {
      const db = await getDb();
      const orders = rowsToObjects(db.exec(
        `SELECT * FROM orders WHERE id = ? AND status = 'pending'`, [orderId]
      ));

      if (orders.length) {
        db.run(`UPDATE orders SET status = 'completed' WHERE id = ?`, [orderId]);

        const items = rowsToObjects(db.exec(
          `SELECT product_id FROM order_items WHERE order_id = ?`, [orderId]
        ));
        items.forEach(item => {
          db.run(`UPDATE products SET downloads = downloads + 1 WHERE id = ?`, [item.product_id]);
        });

        save();
      }
    } catch (e) {
      console.error('Webhook processing error:', e.message);
    }
  }

  res.json({ received: true });
});

module.exports = router;

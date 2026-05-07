const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, save } = require('../db');
const { adminAuth } = require('../middleware/auth');
const { notifyUserOrderCompleted } = require('../utils/email');

function rowsToObjects(result) {
  if (!result[0]) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c,i) => [c,row[i]])));
}

// Stats
router.get('/stats', adminAuth, async (req, res) => {
  const db = await getDb();
  const [total] = rowsToObjects(db.exec("SELECT COUNT(*) as c FROM crypto_orders"));
  const [pending] = rowsToObjects(db.exec("SELECT COUNT(*) as c FROM crypto_orders WHERE status='pending'"));
  const [processing] = rowsToObjects(db.exec("SELECT COUNT(*) as c FROM crypto_orders WHERE status='processing'"));
  const [completed] = rowsToObjects(db.exec("SELECT COUNT(*) as c FROM crypto_orders WHERE status='completed'"));
  const [volume] = rowsToObjects(db.exec("SELECT COALESCE(SUM(fiat_amount),0) as c FROM crypto_orders WHERE status='completed'"));
  const [users] = rowsToObjects(db.exec("SELECT COUNT(*) as c FROM users WHERE role='user'"));
  res.json({ total: total.c, pending: pending.c, processing: processing.c, completed: completed.c, volume: volume.c, users: users.c });
});

// Orders
router.get('/orders', adminAuth, async (req, res) => {
  const db = await getDb();
  const orders = rowsToObjects(db.exec(
    `SELECT o.*, u.name as user_name, COALESCE(o.customer_email, u.email) as user_email
     FROM crypto_orders o JOIN users u ON o.user_id=u.id
     ORDER BY o.created_at DESC`
  ));
  res.json(orders);
});

router.patch('/orders/:id', adminAuth, async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    const allowedStatuses = new Set(['pending', 'processing', 'completed', 'cancelled']);
    if (!allowedStatuses.has(status)) return res.status(400).json({ error: 'Invalid order status' });

    const db = await getDb();

    // Fetch order + user before updating (to send email if completing)
    const [order] = rowsToObjects(db.exec(
      `SELECT o.*, u.name as user_name, COALESCE(o.customer_email, u.email) as user_email
       FROM crypto_orders o JOIN users u ON o.user_id=u.id WHERE o.id=?`, [req.params.id]
    ));

    if (!order) return res.status(404).json({ error: 'Order not found' });

    db.run(`UPDATE crypto_orders SET status=?, admin_note=?, updated_at=datetime('now') WHERE id=?`,
      [status, admin_note || null, req.params.id]);
    save();

    // Send completion email to user when admin marks as completed
    if (status === 'completed' && order && order.status !== 'completed') {
      notifyUserOrderCompleted({
        userEmail: order.user_email,
        userName: order.user_name,
        order: { ...order, status },
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rates
router.get('/rates', adminAuth, async (req, res) => {
  const db = await getDb();
  res.json(rowsToObjects(db.exec('SELECT * FROM exchange_rates')));
});

router.put('/rates/:id', adminAuth, async (req, res) => {
  const { buy_rate, sell_rate } = req.body;
  if (!Number.isFinite(parseFloat(buy_rate)) || parseFloat(buy_rate) <= 0 ||
      !Number.isFinite(parseFloat(sell_rate)) || parseFloat(sell_rate) <= 0) {
    return res.status(400).json({ error: 'Rates must be positive numbers' });
  }

  const db = await getDb();
  db.run(`UPDATE exchange_rates SET buy_rate=?, sell_rate=?, updated_at=datetime('now') WHERE id=?`,
    [buy_rate, sell_rate, req.params.id]);
  save();
  res.json({ success: true });
});

// Wallet addresses
router.get('/wallets', adminAuth, async (req, res) => {
  const db = await getDb();
  res.json(rowsToObjects(db.exec('SELECT * FROM wallet_addresses ORDER BY crypto, network')));
});

router.post('/wallets', adminAuth, async (req, res) => {
  const { crypto, network, address, label } = req.body;
  const db = await getDb();
  const id = uuidv4();
  db.run(`INSERT INTO wallet_addresses (id,crypto,network,address,label) VALUES (?,?,?,?,?)`,
    [id, crypto, network, address, label]);
  save();
  res.json({ id, crypto, network, address, label, active: 1 });
});

router.put('/wallets/:id', adminAuth, async (req, res) => {
  const { address, label, active } = req.body;
  const db = await getDb();
  db.run(`UPDATE wallet_addresses SET address=?, label=?, active=? WHERE id=?`,
    [address, label, active ? 1 : 0, req.params.id]);
  save();
  res.json({ success: true });
});

// Settings
router.get('/settings', adminAuth, async (req, res) => {
  const db = await getDb();
  const rows = rowsToObjects(db.exec('SELECT * FROM settings'));
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

router.put('/settings', adminAuth, async (req, res) => {
  const db = await getDb();
  Object.entries(req.body).forEach(([k, v]) => {
    db.run(`INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=?`, [k, v, v]);
  });
  save();
  res.json({ success: true });
});

module.exports = router;

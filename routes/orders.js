const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, save } = require('../db');
const { auth, optionalAuth } = require('../middleware/auth');
const { notifyAdminNewOrder, notifyUserOrderCreated } = require('../utils/email');

function rowsToObjects(result) {
  if (!result[0]) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c,i) => [c,row[i]])));
}

function getRate(db, crypto) {
  const r = rowsToObjects(db.exec('SELECT * FROM exchange_rates WHERE crypto=?', [crypto]));
  return r[0] || null;
}

function getDepositAddress(db, crypto, network) {
  const r = rowsToObjects(db.exec(
    'SELECT * FROM wallet_addresses WHERE crypto=? AND network=? AND active=1 LIMIT 1',
    [crypto, network]
  ));
  return r[0]?.address || null;
}

function getSettings(db) {
  const rows = rowsToObjects(db.exec('SELECT * FROM settings'));
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function getGuestUserId(db) {
  const row = rowsToObjects(db.exec("SELECT id FROM users WHERE email='guest@checkout.local' LIMIT 1"))[0];
  return row?.id;
}

function validateOrderAmount(settings, cryptoAmount, fiatAmount) {
  if (!Number.isFinite(cryptoAmount) || cryptoAmount <= 0) return 'Enter a valid crypto amount';
  if (!Number.isFinite(fiatAmount) || fiatAmount <= 0) return 'Enter a valid order amount';

  const min = parseFloat(settings.min_order_usd || '0');
  const max = parseFloat(settings.max_order_usd || '0');
  if (Number.isFinite(min) && min > 0 && fiatAmount < min) return `Minimum order is $${min.toFixed(2)} USD`;
  if (Number.isFinite(max) && max > 0 && fiatAmount > max) return `Maximum order is $${max.toFixed(2)} USD`;

  return null;
}

function normalizeEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : '';
}

function parseOptionalPositiveNumber(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// POST /api/orders/buy
router.post('/buy', optionalAuth, async (req, res) => {
  try {
    const { crypto, network, crypto_amount, wallet_address, email, fiat_amount, commission_rate, commission_amount } = req.body;
    const customerEmail = normalizeEmail(email || req.user?.email);
    if (!crypto || !network || !crypto_amount || !wallet_address || !customerEmail)
      return res.status(400).json({ error: 'Missing required fields' });

    const db = await getDb();
    const rate = getRate(db, crypto);
    if (!rate) return res.status(400).json({ error: 'Invalid crypto' });

    const parsedCryptoAmount = parseFloat(crypto_amount);
    const quotedFiatAmount = parseOptionalPositiveNumber(fiat_amount);
    const computedFiatAmount = parsedCryptoAmount * rate.buy_rate;
    const displayFiatAmount = quotedFiatAmount || computedFiatAmount;
    const commissionRate = parseOptionalPositiveNumber(commission_rate);
    const commissionAmount = parseOptionalPositiveNumber(commission_amount);
    const settings = getSettings(db);
    const amountError = validateOrderAmount(settings, parsedCryptoAmount, displayFiatAmount);
    if (amountError) return res.status(400).json({ error: amountError });

    const id = uuidv4();
    const userId = req.user?.id || getGuestUserId(db);
    db.run(
      `INSERT INTO crypto_orders (id,user_id,type,crypto,network,crypto_amount,fiat_amount,rate,wallet_address,customer_email,commission_rate,commission_amount,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, userId, 'buy', crypto, network, parsedCryptoAmount, displayFiatAmount, rate.buy_rate, wallet_address, customerEmail, commissionRate, commissionAmount, 'pending']
    );
    save();

    const [userRow] = req.user
      ? rowsToObjects(db.exec('SELECT name, email FROM users WHERE id=?', [req.user.id]))
      : [{ name: 'Customer', email: customerEmail }];
    const order = { id, type: 'buy', crypto, network, crypto_amount, fiat_amount: displayFiatAmount, rate: rate.buy_rate, wallet_address };

    // Fire emails asynchronously
    const adminEmail = process.env.ADMIN_EMAIL || settings.admin_email || 'admin@exchange.com';
    notifyAdminNewOrder({ adminEmail, order, userName: userRow?.name, userEmail: userRow?.email }).catch(() => {});
    notifyUserOrderCreated({ userEmail: customerEmail, userName: userRow?.name || 'Customer', order, paymentDetails: settings }).catch(() => {});

    res.json({ id, fiat_amount: displayFiatAmount, rate: rate.buy_rate, settings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/orders/sell
router.post('/sell', optionalAuth, async (req, res) => {
  try {
    const { crypto, network, crypto_amount, bank_details, email, fiat_amount, commission_rate, commission_amount } = req.body;
    const customerEmail = normalizeEmail(email || req.user?.email);
    if (!crypto || !network || !crypto_amount || !bank_details || !customerEmail)
      return res.status(400).json({ error: 'Missing required fields' });

    const db = await getDb();
    const rate = getRate(db, crypto);
    if (!rate) return res.status(400).json({ error: 'Invalid crypto' });

    const deposit_address = getDepositAddress(db, crypto, network);
    if (!deposit_address) return res.status(400).json({ error: 'No deposit address available for this network' });

    const parsedCryptoAmount = parseFloat(crypto_amount);
    const quotedFiatAmount = parseOptionalPositiveNumber(fiat_amount);
    const computedFiatAmount = parsedCryptoAmount * rate.sell_rate;
    const displayFiatAmount = quotedFiatAmount || computedFiatAmount;
    const commissionRate = parseOptionalPositiveNumber(commission_rate);
    const commissionAmount = parseOptionalPositiveNumber(commission_amount);
    const settings = getSettings(db);
    const amountError = validateOrderAmount(settings, parsedCryptoAmount, displayFiatAmount);
    if (amountError) return res.status(400).json({ error: amountError });

    const id = uuidv4();
    const userId = req.user?.id || getGuestUserId(db);
    db.run(
      `INSERT INTO crypto_orders (id,user_id,type,crypto,network,crypto_amount,fiat_amount,rate,deposit_address,admin_note,customer_email,commission_rate,commission_amount,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, userId, 'sell', crypto, network, parsedCryptoAmount, displayFiatAmount, rate.sell_rate, deposit_address, bank_details, customerEmail, commissionRate, commissionAmount, 'pending']
    );
    save();

    const [userRow] = req.user
      ? rowsToObjects(db.exec('SELECT name, email FROM users WHERE id=?', [req.user.id]))
      : [{ name: 'Customer', email: customerEmail }];
    const order = { id, type: 'sell', crypto, network, crypto_amount, fiat_amount: displayFiatAmount, deposit_address };

    const adminEmail = process.env.ADMIN_EMAIL || settings.admin_email || 'admin@exchange.com';
    notifyAdminNewOrder({ adminEmail, order, userName: userRow?.name, userEmail: userRow?.email }).catch(() => {});
    notifyUserOrderCreated({ userEmail: customerEmail, userName: userRow?.name || 'Customer', order }).catch(() => {});

    res.json({ id, fiat_amount: displayFiatAmount, rate: rate.sell_rate, deposit_address });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/orders/:id/txhash
router.patch('/:id/txhash', auth, async (req, res) => {
  try {
    const { tx_hash } = req.body;
    if (!tx_hash) return res.status(400).json({ error: 'TX hash required' });
    const db = await getDb();
    db.run(
      `UPDATE crypto_orders SET tx_hash=?, status='processing', updated_at=datetime('now') WHERE id=? AND user_id=?`,
      [tx_hash, req.params.id, req.user.id]
    );
    save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/orders/my
router.get('/my', auth, async (req, res) => {
  try {
    const db = await getDb();
    const orders = rowsToObjects(db.exec(
      'SELECT * FROM crypto_orders WHERE user_id=? ORDER BY created_at DESC', [req.user.id]
    ));
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

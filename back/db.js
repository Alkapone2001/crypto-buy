const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'store.db');
let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, name TEXT NOT NULL,
    role TEXT DEFAULT 'user', created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS guest_users (
    id TEXT PRIMARY KEY, created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS exchange_rates (
    id TEXT PRIMARY KEY, crypto TEXT NOT NULL,
    buy_rate REAL NOT NULL, sell_rate REAL NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS crypto_orders (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    type TEXT NOT NULL, crypto TEXT NOT NULL, network TEXT NOT NULL,
    crypto_amount REAL NOT NULL, fiat_amount REAL NOT NULL, rate REAL NOT NULL,
    wallet_address TEXT, deposit_address TEXT, tx_hash TEXT, customer_email TEXT,
    commission_rate REAL, commission_amount REAL,
    status TEXT DEFAULT 'pending', admin_note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  const orderColumns = db.exec("PRAGMA table_info(crypto_orders)")[0]?.values.map(row => row[1]) || [];
  if (!orderColumns.includes('customer_email')) {
    db.run('ALTER TABLE crypto_orders ADD COLUMN customer_email TEXT');
  }
  if (!orderColumns.includes('commission_rate')) {
    db.run('ALTER TABLE crypto_orders ADD COLUMN commission_rate REAL');
  }
  if (!orderColumns.includes('commission_amount')) {
    db.run('ALTER TABLE crypto_orders ADD COLUMN commission_amount REAL');
  }

  db.run(`CREATE TABLE IF NOT EXISTS wallet_addresses (
    id TEXT PRIMARY KEY, crypto TEXT NOT NULL, network TEXT NOT NULL,
    address TEXT NOT NULL, label TEXT, active INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  )`);

  // Seed admin users. admin@store.com keeps older frontend/README demo copy working.
  const adminEmails = ['admin@exchange.com', 'admin@store.com'];
  adminEmails.forEach(email => {
    const adminExists = db.exec('SELECT id FROM users WHERE email=?', [email]);
    if (!adminExists[0]?.values?.length) {
      db.run(`INSERT INTO users (id,email,password,name,role) VALUES (?,?,?,?,?)`,
        [uuidv4(), email, bcrypt.hashSync('admin123', 10), 'Admin', 'admin']);
    }
  });

  // Seed rates
  const ratesExist = db.exec("SELECT COUNT(*) as c FROM exchange_rates")[0].values[0][0];
  if (!ratesExist) {
    db.run(`INSERT INTO exchange_rates (id,crypto,buy_rate,sell_rate) VALUES (?,?,?,?)`, [uuidv4(),'USDT',1.02,0.98]);
    db.run(`INSERT INTO exchange_rates (id,crypto,buy_rate,sell_rate) VALUES (?,?,?,?)`, [uuidv4(),'TRX',0.26,0.23]);
  }
  const btcRateExists = db.exec("SELECT id FROM exchange_rates WHERE crypto='BTC'")[0]?.values?.length;
  if (!btcRateExists) {
    db.run(`INSERT INTO exchange_rates (id,crypto,buy_rate,sell_rate) VALUES (?,?,?,?)`, [uuidv4(),'BTC',77774.76,76000]);
  }

  const guestExists = db.exec("SELECT id FROM users WHERE email='guest@checkout.local'")[0]?.values?.length;
  if (!guestExists) {
    db.run(`INSERT INTO users (id,email,password,name,role) VALUES (?,?,?,?,?)`,
      [uuidv4(), 'guest@checkout.local', bcrypt.hashSync(uuidv4(), 10), 'Guest Checkout', 'guest']);
  }

  // Seed wallet addresses
  const walletsExist = db.exec("SELECT COUNT(*) as c FROM wallet_addresses")[0].values[0][0];
  if (!walletsExist) {
    const wallets = [
      { crypto:'USDT', network:'BSC',   address:'0x742d35Cc6634C0532925a3b8Bc454e4438f44e00', label:'USDT BEP-20' },
      { crypto:'USDT', network:'ERC20', address:'0x742d35Cc6634C0532925a3b8Bc454e4438f44e00', label:'USDT ERC-20' },
      { crypto:'USDT', network:'TRC20', address:'TMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', label:'USDT TRC-20' },
      { crypto:'TRX',  network:'TRX',   address:'TMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', label:'TRX' },
      { crypto:'BTC',  network:'BTC',   address:'bc1qexampledepositaddressxxxxxxxxxxxxxxxxxxx', label:'Bitcoin' },
    ];
    wallets.forEach(w => db.run(`INSERT INTO wallet_addresses (id,crypto,network,address,label) VALUES (?,?,?,?,?)`,
      [uuidv4(), w.crypto, w.network, w.address, w.label]));
  }
  const btcWalletExists = db.exec("SELECT id FROM wallet_addresses WHERE crypto='BTC' AND network='BTC'")[0]?.values?.length;
  if (!btcWalletExists) {
    db.run(`INSERT INTO wallet_addresses (id,crypto,network,address,label) VALUES (?,?,?,?,?)`,
      [uuidv4(), 'BTC', 'BTC', 'bc1qexampledepositaddressxxxxxxxxxxxxxxxxxxx', 'Bitcoin']);
  }

  // Seed settings
  const settingsExist = db.exec("SELECT COUNT(*) as c FROM settings")[0].values[0][0];
  if (!settingsExist) {
    const defaults = [
      ['bank_name','Exchange Bank'],
      ['bank_account','GB29 NWBK 6016 1331 9268 19'],
      ['bank_holder','CryptoExchange Ltd'],
      ['bank_ref_note','Use your Order ID as payment reference'],
      ['min_order_usd','10'],
      ['max_order_usd','50000'],
      ['admin_email','admin@exchange.com'],
    ];
    defaults.forEach(([k,v]) => db.run(`INSERT INTO settings (key,value) VALUES (?,?)`, [k,v]));
  }

  save();
  return db;
}

function save() {
  if (!db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

const saveTimer = setInterval(save, 5000);
saveTimer.unref?.();
module.exports = { getDb, save };

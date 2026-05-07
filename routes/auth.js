const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb, save } = require('../db');
const { SECRET } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });

    const db = await getDb();
    const existing = db.exec(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing[0]?.values?.length) return res.status(400).json({ error: 'Email already in use' });

    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    db.run(`INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)`, [id, email, hash, name]);
    save();

    const token = jwt.sign({ id, email, name, role: 'user' }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email, name, role: 'user' } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = await getDb();
    const result = db.exec(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!result[0]?.values?.length) return res.status(401).json({ error: 'Invalid credentials' });

    const [id, userEmail, hash, name, role] = result[0].values[0];
    if (!bcrypt.compareSync(password, hash)) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id, email: userEmail, name, role }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email: userEmail, name, role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

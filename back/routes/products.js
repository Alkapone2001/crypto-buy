const router = require('express').Router();
const { getDb } = require('../db');

function rowsToObjects(result) {
  if (!result[0]) return [];
  const cols = result[0].columns;
  return result[0].values.map(row =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]]))
  );
}

router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const db = await getDb();
    let query = `SELECT * FROM products WHERE active = 1`;
    const params = [];
    if (search) { query += ` AND (name LIKE ? OR description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (category && category !== 'All') { query += ` AND category = ?`; params.push(category); }
    query += ` ORDER BY created_at DESC`;
    const result = db.exec(query, params);
    res.json(rowsToObjects(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/categories', async (req, res) => {
  const db = await getDb();
  const result = db.exec(`SELECT DISTINCT category FROM products WHERE active = 1 AND category IS NOT NULL`);
  const cats = result[0]?.values?.map(r => r[0]) || [];
  res.json(['All', ...cats]);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const result = db.exec(`SELECT * FROM products WHERE id = ? AND active = 1`, [req.params.id]);
  const products = rowsToObjects(result);
  if (!products.length) return res.status(404).json({ error: 'Not found' });
  res.json(products[0]);
});

module.exports = router;

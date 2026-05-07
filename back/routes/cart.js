const router = require('express').Router();
const { getDb } = require('../db');
const { auth } = require('../middleware/auth');

function rowsToObjects(result) {
  if (!result[0]) return [];
  const cols = result[0].columns;
  return result[0].values.map(row =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]]))
  );
}

// Validate cart items and return enriched items with current prices
router.post('/validate', auth, async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]
    const db = await getDb();
    const enriched = [];
    for (const item of items) {
      const result = db.exec(`SELECT * FROM products WHERE id = ? AND active = 1`, [item.productId]);
      const products = rowsToObjects(result);
      if (products.length) {
        enriched.push({ ...products[0], quantity: item.quantity });
      }
    }
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

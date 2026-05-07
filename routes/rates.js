const router = require('express').Router();
const { getDb } = require('../db');

function rowsToObjects(result) {
  if (!result[0]) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c,i) => [c,row[i]])));
}

router.get('/', async (req, res) => {
  const db = await getDb();
  const rates = rowsToObjects(db.exec('SELECT * FROM exchange_rates'));
  const settings = rowsToObjects(db.exec('SELECT * FROM settings'));
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json({ rates, settings: settingsMap });
});

module.exports = router;

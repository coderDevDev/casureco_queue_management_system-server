const express = require('express');
const router = express.Router();
const { query, callProcedure } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { branch_id, date } = req.query;
    
    const sql = `CALL get_queue_stats(?, ?)`;
    const [stats] = await query(sql, [branch_id, date || null]);
    
    res.json({ stats: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;

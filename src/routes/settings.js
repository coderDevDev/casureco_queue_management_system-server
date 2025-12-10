const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { branch_id } = req.query;
    const settings = await query(
      'SELECT * FROM system_settings WHERE branch_id = ? OR branch_id IS NULL',
      [branch_id]
    );
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { branch_id, setting_key, setting_value, description } = req.body;
    const id = uuidv4();
    
    await query(
      `INSERT INTO system_settings (id, branch_id, setting_key, setting_value, description)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
      [id, branch_id, setting_key, JSON.stringify(setting_value), description, JSON.stringify(setting_value)]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

module.exports = router;

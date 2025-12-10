const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { emitAnnouncement } = require('../socket/socketHandler');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { branch_id, is_active } = req.query;
    let sql = 'SELECT * FROM announcements WHERE 1=1';
    const params = [];

    if (branch_id) {
      sql += ' AND branch_id = ?';
      params.push(branch_id);
    }

    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY priority DESC, created_at DESC';
    const announcements = await query(sql, params);
    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { branch_id, title, message, type, display_duration, priority, start_date, end_date } = req.body;
    const id = uuidv4();
    
    await query(
      `INSERT INTO announcements (id, branch_id, title, message, type, display_duration, priority, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, branch_id, title, message, type || 'info', display_duration || 10, priority || 0, start_date, end_date, req.user.id]
    );

    const announcements = await query('SELECT * FROM announcements WHERE id = ?', [id]);
    const announcement = announcements[0];

    // Emit real-time event
    const io = req.app.get('io');
    emitAnnouncement(io, announcement);

    res.status(201).json({ announcement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

module.exports = router;

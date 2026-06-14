import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/pending', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.relationship_type, c.created_at,
             u.id as user_id, u.name, u.company, u.title
      FROM connections c
      JOIN users u ON u.id = c.requester_id
      WHERE c.receiver_id = $1 AND c.status = 'pending'
    `, [req.user.id]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/status/:targetId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT status FROM connections
      WHERE (requester_id = $1 AND receiver_id = $2)
         OR (requester_id = $2 AND receiver_id = $1)
    `, [req.user.id, req.params.targetId]);
    res.json({ status: result.rows[0]?.status ?? null });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/network/:userId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.requester_id, c.receiver_id, c.relationship_type,
             u1.name as requester_name, u1.company as requester_company,
             u2.name as receiver_name, u2.company as receiver_company
      FROM connections c
      JOIN users u1 ON u1.id = c.requester_id
      JOIN users u2 ON u2.id = c.receiver_id
      WHERE c.status = 'accepted'
        AND (c.requester_id = $1 OR c.receiver_id = $1)
    `, [req.params.userId]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/heart-taken', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id FROM connections
       WHERE requester_id = $1 AND relationship_type = '♡'
         AND status IN ('pending', 'accepted')`,
      [req.user.id]
    );
    res.json({ taken: result.rows.length > 0 });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { receiver_id, relationship_type } = req.body;
  if (receiver_id === req.user.id) {
    return res.status(400).json({ error: '自分自身には申請できません' });
  }
  try {
    // ♡は1人にしか送れない
    if (relationship_type === '♡') {
      const existing = await pool.query(
        `SELECT id FROM connections WHERE requester_id = $1 AND relationship_type = '♡' AND status IN ('pending', 'accepted')`,
        [req.user.id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: '♡ は1人にしか送れません' });
      }
    }
    const result = await pool.query(
      'INSERT INTO connections (requester_id, receiver_id, relationship_type) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, receiver_id, relationship_type || 'その他']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: '既に申請済みです' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const result = await pool.query(
      'UPDATE connections SET status=$1 WHERE id=$2 AND receiver_id=$3 RETURNING *',
      [status, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: '申請が見つかりません' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

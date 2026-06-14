import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { q } = req.query;
  try {
    const result = await pool.query(
      'SELECT id, name, company, title FROM users WHERE (name ILIKE $1 OR email ILIKE $1) AND id != $2 LIMIT 20',
      [`%${q || ''}%`, req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, company, title, bio, school, node_color, avatar_url, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!userResult.rows[0]) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    const snsResult = await pool.query(
      'SELECT platform, url FROM sns_links WHERE user_id = $1',
      [req.params.id]
    );
    res.json({ ...userResult.rows[0], sns_links: snsResult.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  const { name, company, title, bio, school, node_color, avatar_url, sns_links } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, company=$2, title=$3, bio=$4, school=$5, node_color=$6, avatar_url=$7 WHERE id=$8 RETURNING id, name, email, company, title, bio, school, node_color, avatar_url',
      [name, company, title, bio, school, node_color || '#6366f1', avatar_url, req.user.id]
    );
    if (sns_links !== undefined) {
      await pool.query('DELETE FROM sns_links WHERE user_id = $1', [req.user.id]);
      for (const link of sns_links) {
        if (link.platform && link.url) {
          await pool.query(
            'INSERT INTO sns_links (user_id, platform, url) VALUES ($1, $2, $3)',
            [req.user.id, link.platform, link.url]
          );
        }
      }
    }
    const snsResult = await pool.query('SELECT platform, url FROM sns_links WHERE user_id = $1', [req.user.id]);
    res.json({ ...result.rows[0], sns_links: snsResult.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

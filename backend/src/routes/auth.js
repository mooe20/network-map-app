import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db/pool.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = Router();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 新規登録 → 確認メール送信
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: '名前、メール、パスワードは必須です' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'パスワードは8文字以上にしてください' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, email_verified) VALUES ($1, $2, $3, FALSE) RETURNING id, name, email',
      [name, email, hash]
    );
    const user = result.rows[0];

    // 確認トークン生成・保存
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間
    await pool.query(
      'INSERT INTO email_tokens (token, user_id, type, expires_at) VALUES ($1, $2, $3, $4)',
      [token, user.id, 'verify', expiresAt]
    );

    // メール送信
    await sendVerificationEmail(email, token);

    res.status(201).json({ message: '確認メールを送信しました。メールをご確認ください。' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// メールアドレス確認
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'トークンが必要です' });
  try {
    const result = await pool.query(
      `SELECT * FROM email_tokens
       WHERE token = $1 AND type = 'verify' AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    const row = result.rows[0];
    if (!row) return res.status(400).json({ error: 'リンクが無効または期限切れです。再度登録してください。' });

    // ユーザーを認証済みにする
    await pool.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [row.user_id]);
    await pool.query('UPDATE email_tokens SET used_at = NOW() WHERE id = $1', [row.id]);

    // 自動ログイン用のJWT発行
    const userRes = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [row.user_id]);
    const user = userRes.rows[0];
    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 確認メール再送
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!user || user.email_verified) {
      // セキュリティのため成功レスポンスを返す
      return res.json({ message: '確認メールを送信しました（未登録または認証済みの場合は送信されません）' });
    }
    // 古いトークンを無効化
    await pool.query("UPDATE email_tokens SET used_at = NOW() WHERE user_id = $1 AND type = 'verify' AND used_at IS NULL", [user.id]);
    // 新しいトークン生成
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query('INSERT INTO email_tokens (token, user_id, type, expires_at) VALUES ($1, $2, $3, $4)', [token, user.id, 'verify', expiresAt]);
    await sendVerificationEmail(email, token);
    res.json({ message: '確認メールを再送しました' });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'メールアドレスが未確認です。届いたメールのリンクをクリックしてください。', code: 'EMAIL_NOT_VERIFIED', email: user.email });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safe } = user;
    res.json({ token, user: safe });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// パスワード再設定リクエスト
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1 AND email_verified = TRUE', [email]);
    // セキュリティのため、存在しないメールでも成功レスポンスを返す
    if (result.rows[0]) {
      const userId = result.rows[0].id;
      // 古いリセットトークンを無効化
      await pool.query("UPDATE email_tokens SET used_at = NOW() WHERE user_id = $1 AND type = 'reset' AND used_at IS NULL", [userId]);
      // 新しいトークン生成（1時間有効）
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await pool.query('INSERT INTO email_tokens (token, user_id, type, expires_at) VALUES ($1, $2, $3, $4)', [token, userId, 'reset', expiresAt]);
      await sendPasswordResetEmail(email, token);
    }
    res.json({ message: 'パスワード再設定メールを送信しました（登録済みの場合）' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// パスワード再設定実行
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'トークンとパスワードが必要です' });
  if (password.length < 8) return res.status(400).json({ error: 'パスワードは8文字以上にしてください' });
  try {
    const result = await pool.query(
      `SELECT * FROM email_tokens
       WHERE token = $1 AND type = 'reset' AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    const row = result.rows[0];
    if (!row) return res.status(400).json({ error: 'リンクが無効または期限切れです' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, row.user_id]);
    await pool.query('UPDATE email_tokens SET used_at = NOW() WHERE id = $1', [row.id]);

    res.json({ message: 'パスワードを変更しました。ログインしてください。' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

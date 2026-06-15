import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false); // 確認メール送信済み
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      setResendMsg('確認メールを再送しました！');
    } catch {
      setResendMsg('再送に失敗しました。しばらくしてからお試しください。');
    } finally {
      setResending(false);
    }
  };

  // 確認メール送信済み画面
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">確認メールを送信しました</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-1">
            <span className="font-medium text-gray-700">{form.email}</span> に確認メールを送りました。
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            メール内のリンクをクリックするとアカウントが有効になります。
          </p>
          <div className="bg-indigo-50 rounded-xl p-4 text-left mb-6">
            <p className="text-xs text-indigo-700 font-medium mb-1">📬 メールが届かない場合</p>
            <p className="text-xs text-indigo-600">迷惑メールフォルダを確認するか、以下から再送してください。</p>
          </div>
          {resendMsg && (
            <p className="text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2 mb-3">{resendMsg}</p>
          )}
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full border border-indigo-300 text-indigo-600 py-2.5 rounded-xl font-medium hover:bg-indigo-50 transition-colors disabled:opacity-60 text-sm mb-3"
          >
            {resending ? '送信中...' : '確認メールを再送する'}
          </button>
          <Link to="/login" className="block text-center text-sm text-gray-400 hover:text-gray-600">
            ログイン画面へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">新規登録</h1>
          <p className="text-gray-500 text-sm mt-1">人脈マップを始めましょう</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              required
              minLength={8}
              placeholder="8文字以上"
            />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? '送信中...' : '確認メールを送る'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">ログイン</Link>
        </p>
      </div>
    </div>
  );
}

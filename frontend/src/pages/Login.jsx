import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(''); // 未確認の場合
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setResendMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email || email);
        setError(data.error);
      } else {
        setError(data?.error || 'ログインに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      setResendMsg('確認メールを再送しました！メールをご確認ください。');
    } catch {
      setResendMsg('再送に失敗しました。しばらくしてからお試しください。');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">人脈マップ</h1>
          <p className="text-gray-500 text-sm mt-1">あなたの人脈を可視化する</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              required
            />
            <div className="text-right mt-1">
              <Link to="/forgot-password" className="text-xs text-indigo-500 hover:underline">
                パスワードを忘れた場合
              </Link>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 px-3 py-2 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
              {unverifiedEmail && (
                <>
                  {resendMsg
                    ? <p className="text-green-600 text-xs mt-1">{resendMsg}</p>
                    : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="text-indigo-600 text-xs underline mt-1 disabled:opacity-60"
                      >
                        {resending ? '送信中...' : '確認メールを再送する'}
                      </button>
                    )
                  }
                </>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          アカウントがない方は{' '}
          <Link to="/register" className="text-indigo-600 hover:underline font-medium">新規登録</Link>
        </p>
      </div>
    </div>
  );
}

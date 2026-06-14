import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const SNS_PLATFORMS = ['Twitter/X', 'LinkedIn', 'Instagram', 'GitHub', 'Facebook', 'Website', 'その他'];
const RELATIONSHIP_TYPES = ['友人', '同僚', '所属', '活動', '出身大学', '面識あり', '家族'];

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const isOwn = !id || parseInt(id) === currentUser?.id;
  const userId = isOwn ? currentUser?.id : id;

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedType, setSelectedType] = useState('友人');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setProfile(res.data);
      setForm({
        name: res.data.name,
        company: res.data.company || '',
        title: res.data.title || '',
        bio: res.data.bio || '',
        avatar_url: res.data.avatar_url || '',
        sns_links: res.data.sns_links || [],
      });
      if (!isOwn) {
        const connRes = await api.get(`/connections/status/${userId}`);
        setConnectionStatus(connRes.data.status);
      }
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', form);
      setProfile(res.data);
      updateUser({ ...currentUser, name: res.data.name });
      setEditing(false);
    } catch {
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    try {
      await api.post('/connections', { receiver_id: parseInt(userId), relationship_type: selectedType });
      setConnectionStatus('pending');
      setShowConnectModal(false);
    } catch (err) {
      alert(err.response?.data?.error || '申請に失敗しました');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-gray-400">読み込み中...</div>
  );
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-1.5 text-indigo-600 font-medium text-sm hover:text-indigo-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          人脈マップ
        </Link>
        {isOwn && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            編集
          </button>
        )}
      </nav>

      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {editing ? (
            <EditForm
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
              saving={saving}
            />
          ) : (
            <ViewProfile
              profile={profile}
              isOwn={isOwn}
              connectionStatus={connectionStatus}
              onConnectClick={() => setShowConnectModal(true)}
            />
          )}
        </div>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-1">{profile.name}さんと繋がる</h3>
            <p className="text-sm text-gray-500 mb-4">関係タイプを選択してください</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {RELATIONSHIP_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`py-2 px-3 rounded-xl text-sm border-2 transition-colors font-medium ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConnect}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                申請する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewProfile({ profile, isOwn, connectionStatus, onConnectClick }) {
  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden flex-shrink-0">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            : profile.name[0]
          }
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
          {profile.title && <p className="text-gray-600 text-sm">{profile.title}</p>}
          {profile.company && (
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {profile.company}
            </p>
          )}
        </div>
      </div>

      {profile.bio && (
        <div className="mb-5 p-3 bg-gray-50 rounded-xl">
          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {profile.sns_links?.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">SNS・リンク</h3>
          <div className="space-y-2">
            {profile.sns_links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{link.platform}</span>
                <span className="truncate">{link.url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {!isOwn && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {connectionStatus === null && (
            <button
              onClick={onConnectClick}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              繋がりを申請する
            </button>
          )}
          {connectionStatus === 'pending' && (
            <p className="text-center text-sm text-amber-600 bg-amber-50 py-2.5 rounded-xl">申請中...</p>
          )}
          {connectionStatus === 'accepted' && (
            <p className="text-center text-sm text-green-600 bg-green-50 py-2.5 rounded-xl font-medium">繋がっています</p>
          )}
          {connectionStatus === 'rejected' && (
            <p className="text-center text-sm text-gray-400 bg-gray-50 py-2.5 rounded-xl">申請が拒否されました</p>
          )}
        </div>
      )}
    </div>
  );
}

function EditForm({ form, setForm, onSave, onCancel, saving }) {
  const addSnsLink = () => setForm({ ...form, sns_links: [...form.sns_links, { platform: 'Twitter/X', url: '' }] });
  const removeSnsLink = (i) => setForm({ ...form, sns_links: form.sns_links.filter((_, idx) => idx !== i) });
  const updateSnsLink = (i, field, value) => {
    const links = [...form.sns_links];
    links[i] = { ...links[i], [field]: value };
    setForm({ ...form, sns_links: links });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // 正方形にクロップしてリサイズ
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setForm(f => ({ ...f, avatar_url: dataUrl }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">プロフィール編集</h2>

      {/* アバター画像アップロード */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">プロフィール画像</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden flex-shrink-0">
            {form.avatar_url
              ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <span>{form.name?.[0] || '?'}</span>
            }
          </div>
          <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-indigo-200">
            画像を選択
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          {form.avatar_url && (
            <button
              onClick={() => setForm(f => ({ ...f, avatar_url: '' }))}
              className="text-xs text-red-400 hover:text-red-600"
            >
              削除
            </button>
          )}
        </div>
      </div>

      {[
        { label: '名前', key: 'name', type: 'text', required: true },
        { label: '会社・組織', key: 'company', type: 'text' },
        { label: '役職', key: 'title', type: 'text' },
      ].map(({ label, key, type, required }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={type}
            value={form[key]}
            onChange={e => setForm({ ...form, [key]: e.target.value })}
            required={required}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
        <textarea
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">SNS・リンク</label>
          <button onClick={addSnsLink} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ 追加</button>
        </div>
        {form.sns_links.map((link, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <select
              value={link.platform}
              onChange={e => updateSnsLink(i, 'platform', e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {SNS_PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <input
              type="url"
              value={link.url}
              onChange={e => updateSnsLink(i, 'url', e.target.value)}
              placeholder="https://..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button onClick={() => removeSnsLink(i)} className="text-red-400 hover:text-red-600 text-xl w-6 text-center">×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}

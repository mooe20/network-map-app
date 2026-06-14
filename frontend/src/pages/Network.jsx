import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import NetworkGraph from '../components/NetworkGraph';

export default function Network() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [focusedUserId, setFocusedUserId] = useState(user?.id);
  const [focusedUser, setFocusedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('graph');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    if (focusedUserId) loadNetwork(focusedUserId);
  }, [focusedUserId]);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadNetwork = async (userId) => {
    setLoading(true);
    try {
      const [networkRes, userRes] = await Promise.all([
        api.get(`/connections/network/${userId}`),
        api.get(`/users/${userId}`),
      ]);
      setFocusedUser(userRes.data);

      const connections = networkRes.data;
      const nodesMap = new Map();
      // 中心ノードを原点に固定
      nodesMap.set(String(userId), {
        id: String(userId),
        name: userRes.data.name,
        company: userRes.data.company,
        isCenter: true,
        fx: 0, fy: 0,
      });

      connections.forEach(conn => {
        const rid = String(conn.requester_id);
        const eid = String(conn.receiver_id);
        if (!nodesMap.has(rid)) {
          nodesMap.set(rid, { id: rid, name: conn.requester_name, company: conn.requester_company });
        }
        if (!nodesMap.has(eid)) {
          nodesMap.set(eid, { id: eid, name: conn.receiver_name, company: conn.receiver_company });
        }
      });

      // 中心ノード以外を均等にラジアル配置（x/y/fx/fyをすべて設定）
      const neighbors = Array.from(nodesMap.values()).filter(n => !n.isCenter);
      const radius = Math.max(50, neighbors.length * 20);
      neighbors.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / neighbors.length;
        const nx = Math.cos(angle) * radius;
        const ny = Math.sin(angle) * radius;
        node.fx = nx; node.fy = ny;
        node.x = nx;  node.y = ny;
      });
      // 中心ノードの x/y も明示
      const centerNode = nodesMap.get(String(userId));
      if (centerNode) { centerNode.x = 0; centerNode.y = 0; }

      const links = connections.map(conn => ({
        source: String(conn.requester_id),
        target: String(conn.receiver_id),
        label: conn.relationship_type,
        relationshipType: conn.relationship_type,
      }));

      setGraphData({ nodes: Array.from(nodesMap.values()), links });
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const res = await api.get('/connections/pending');
      setPendingRequests(res.data);
    } catch {}
  };

  const handleNodeClick = (node) => {
    setFocusedUserId(node.id);
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch {}
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/connections/${id}`, { status: 'accepted' });
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      loadNetwork(focusedUserId);
    } catch {}
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/connections/${id}`, { status: 'rejected' });
      setPendingRequests(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  const tabs = [
    { key: 'graph', label: 'グラフ' },
    { key: 'search', label: '検索' },
    { key: 'requests', label: pendingRequests.length > 0 ? `申請 (${pendingRequests.length})` : '申請' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-white border-r flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">人脈マップ</span>
            </div>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ログアウト
            </button>
          </div>
          <Link
            to="/me"
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-indigo-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
              {user?.name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">プロフィールを編集</p>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'text-indigo-600 bg-white border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'graph' && (
            <div>
              {String(focusedUserId) !== String(user?.id) && (
                <button
                  onClick={() => setFocusedUserId(user.id)}
                  className="w-full text-left text-xs text-indigo-600 hover:text-indigo-800 mb-3 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  自分の人脈に戻る
                </button>
              )}
              {focusedUser && (
                <div className="p-3 bg-indigo-50 rounded-xl mb-3">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {focusedUser.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 truncate">{focusedUser.name}</p>
                      {focusedUser.company && <p className="text-xs text-gray-500 truncate">{focusedUser.company}</p>}
                    </div>
                  </div>
                  <Link
                    to={`/profile/${focusedUser.id}`}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    プロフィールを見る →
                  </Link>
                </div>
              )}

              {/* Legend */}
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">関係タイプ</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries({
                    '友人': '#60a5fa', '同僚': '#34d399', '所属': '#a78bfa', '活動': '#6ee7b7',
                    '出身大学': '#fbbf24', '面識あり': '#94a3b8', '関係不良': '#f87171', '家族': '#f472b6',
                  }).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-500">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">ノードをクリックするとその人の人脈を表示します</p>
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              <div className="relative mb-3">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="名前・会社で検索..."
                  className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              {searchResults.map(u => (
                <Link
                  key={u.id}
                  to={`/profile/${u.id}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                    {u.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    {u.company && <p className="text-xs text-gray-500 truncate">{u.company}</p>}
                  </div>
                </Link>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">見つかりませんでした</p>
              )}
              {!searchQuery && (
                <p className="text-xs text-gray-400 text-center py-4">名前または会社名で検索できます</p>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">申請はありません</p>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.id} className="p-3 border border-gray-200 rounded-xl mb-2.5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                        {req.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{req.name}</p>
                        {req.company && <p className="text-xs text-gray-500 truncate">{req.company}</p>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-2.5 flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: ({
                            '友人': '#60a5fa', '同僚': '#34d399', '所属': '#a78bfa', '活動': '#6ee7b7',
                            '出身大学': '#fbbf24', '面識あり': '#94a3b8', '関係不良': '#f87171', '家族': '#f472b6',
                          })[req.relationship_type] || '#94a3b8'
                        }}
                      />
                      {req.relationship_type} として申請
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex-1 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        拒否
                      </button>
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex-1 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        承認
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* サイドバー開閉ボタン */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="absolute top-3 left-3 z-10 bg-white border border-gray-200 rounded-xl p-2 shadow-sm hover:bg-gray-50 transition-colors"
        >
          {sidebarOpen ? (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-sm">グラフを読み込み中...</div>
          </div>
        ) : (
          <NetworkGraph
            graphData={graphData}
            focusedNodeId={String(focusedUserId)}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>
    </div>
  );
}

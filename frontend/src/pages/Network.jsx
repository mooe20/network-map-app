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
  const [activeFilters, setActiveFilters] = useState(new Set()); // 選択中の関係タイプ

  useEffect(() => {
    if (focusedUserId) loadNetwork(focusedUserId);
  }, [focusedUserId]);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadNetwork = async (userId) => {
    setLoading(true);
    try {
      const myId = String(user?.id);
      const focusId = String(userId);
      const isSelf = myId === focusId;

      // フォーカス対象のネットワーク取得
      const [networkRes, userRes] = await Promise.all([
        api.get(`/connections/network/${focusId}`),
        api.get(`/users/${focusId}`),
      ]);
      setFocusedUser(userRes.data);

      const connections = networkRes.data;
      const nodesMap = new Map();
      const linksMap = new Map(); // 重複エッジ防止

      // 中心ノード（フォーカス対象）
      nodesMap.set(focusId, {
        id: focusId,
        name: userRes.data.name,
        company: userRes.data.company,
        avatar_url: userRes.data.avatar_url,
        isCenter: true,
        fx: 0, fy: 0, x: 0, y: 0,
      });

      connections.forEach(conn => {
        const rid = String(conn.requester_id);
        const eid = String(conn.receiver_id);
        if (!nodesMap.has(rid))
          nodesMap.set(rid, { id: rid, name: conn.requester_name, company: conn.requester_company });
        if (!nodesMap.has(eid))
          nodesMap.set(eid, { id: eid, name: conn.receiver_name, company: conn.receiver_company });
        const key = [rid, eid].sort().join('-');
        if (!linksMap.has(key))
          linksMap.set(key, { source: rid, target: eid, label: conn.relationship_type, relationshipType: conn.relationship_type });
      });

      // 自分を表示していない場合は追加
      if (!isSelf && !nodesMap.has(myId)) {
        const meRes = await api.get(`/users/${myId}`);
        nodesMap.set(myId, {
          id: myId,
          name: meRes.data.name,
          company: meRes.data.company,
          avatar_url: meRes.data.avatar_url,
          isSelf: true,
        });
      }

      // 自分→フォーカス対象の最短経路を取得
      if (!isSelf) {
        try {
          const pathRes = await api.get(`/connections/path/${focusId}`);
          const pathUsers = pathRes.data.path; // [{id, name, company}, ...]

          if (pathUsers && pathUsers.length >= 2) {
            // 経路上の中間ノードをグラフに追加（経路フラグ付き）
            pathUsers.forEach(u => {
              const uid = String(u.id);
              if (!nodesMap.has(uid)) {
                nodesMap.set(uid, {
                  id: uid,
                  name: u.name,
                  company: u.company,
                  isPathNode: true,
                });
              } else {
                // 既存ノードに経路フラグを付ける
                nodesMap.get(uid).isPathNode = true;
              }
            });

            // 経路のエッジを追加（isPath フラグ付き）
            for (let i = 0; i < pathUsers.length - 1; i++) {
              const a = String(pathUsers[i].id);
              const b = String(pathUsers[i + 1].id);
              const key = [a, b].sort().join('-');
              // 既存エッジに isPath フラグ追加、なければ新規追加
              if (linksMap.has(key)) {
                linksMap.get(key).isPath = true;
              } else {
                linksMap.set(key, {
                  source: a,
                  target: b,
                  label: '',
                  relationshipType: null,
                  isPath: true,
                });
              }
            }
          }
        } catch {}
      }

      // ラジアル配置：自分ノードを特別扱い
      const neighbors = Array.from(nodesMap.values()).filter(n => !n.isCenter);
      const meNode = nodesMap.get(myId);

      // 自分のポジションを左上に固定（フォーカスが他人のとき）
      if (!isSelf && meNode && !meNode.isCenter) {
        meNode.isMe = true;
        // 自分は左斜め上に固定
        const angle = -Math.PI * 0.75;
        const r = Math.max(60, neighbors.length * 18);
        meNode.fx = Math.cos(angle) * r;
        meNode.fy = Math.sin(angle) * r;
        meNode.x = meNode.fx;
        meNode.y = meNode.fy;
      }

      // それ以外を均等ラジアル配置
      const othersToPlace = neighbors.filter(n => !n.isMe && !n.isCenter);
      const radius = Math.max(60, neighbors.length * 18);
      const selfAngle = (!isSelf && meNode && !meNode.isCenter) ? -Math.PI * 0.75 : null;
      othersToPlace.forEach((node, i) => {
        // 自分の角度を避けて配置
        let baseAngle = (2 * Math.PI * i) / othersToPlace.length;
        if (selfAngle !== null) {
          // 自分の位置をスキップするように角度をずらす
          const gap = (2 * Math.PI) / (othersToPlace.length + 1);
          baseAngle = selfAngle + gap * (i + 1);
        }
        node.fx = Math.cos(baseAngle) * radius;
        node.fy = Math.sin(baseAngle) * radius;
        node.x = node.fx;
        node.y = node.fy;
      });

      // 中心ノードの x/y も明示
      const centerNode = nodesMap.get(focusId);
      if (centerNode) { centerNode.x = 0; centerNode.y = 0; }

      setGraphData({ nodes: Array.from(nodesMap.values()), links: Array.from(linksMap.values()) });
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
    setActiveFilters(new Set()); // フォーカス変更時はフィルターリセット
  };

  const toggleFilter = (type) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // グラフ上に存在する関係タイプ一覧（パスや未接続除く）
  const availableTypes = [...new Set(
    graphData.links
      .filter(l => l.relationshipType)
      .map(l => l.relationshipType)
  )];

  // フィルター適用済みグラフデータ
  const filteredGraphData = (() => {
    if (activeFilters.size === 0) return graphData;
    const visibleLinks = graphData.links.filter(l =>
      !l.relationshipType || activeFilters.has(l.relationshipType)
    );
    const visibleNodeIds = new Set();
    visibleLinks.forEach(l => {
      visibleNodeIds.add(typeof l.source === 'object' ? l.source.id : l.source);
      visibleNodeIds.add(typeof l.target === 'object' ? l.target.id : l.target);
    });
    // 中心ノードと自分は常に表示
    graphData.nodes.forEach(n => {
      if (n.isCenter || n.isMe) visibleNodeIds.add(n.id);
    });
    return {
      nodes: graphData.nodes.filter(n => visibleNodeIds.has(n.id)),
      links: visibleLinks,
    };
  })();

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
                    '家族': '#f472b6', 'ビジネス': '#34d399', '地元': '#fbbf24', '大学': '#60a5fa',
                    'イベント(留学・趣味・活動)': '#a78bfa', 'バイト・インターン': '#6ee7b7',
                    'SNS': '#94a3b8', 'その他': '#d1d5db', '♡': '#ef4444',
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
            graphData={filteredGraphData}
            focusedNodeId={String(focusedUserId)}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* 関係タイプフィルターチップ */}
        {!loading && availableTypes.length > 0 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 pointer-events-none">
            <div className="flex flex-wrap gap-2 justify-center pointer-events-auto max-w-full">
              {availableTypes.map(type => {
                const active = activeFilters.has(type);
                const color = {
                  '家族': '#f472b6', 'ビジネス': '#34d399', '地元': '#fbbf24', '大学': '#60a5fa',
                  'イベント(留学・趣味・活動)': '#a78bfa', 'バイト・インターン': '#6ee7b7',
                  'SNS': '#94a3b8', 'その他': '#d1d5db', '♡': '#ef4444',
                }[type] || '#94a3b8';
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-md border-2 transition-all"
                    style={{
                      backgroundColor: active ? color : 'white',
                      borderColor: color,
                      color: active ? 'white' : color,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: active ? 'white' : color }}
                    />
                    {type}
                  </button>
                );
              })}
              {activeFilters.size > 0 && (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-white shadow-md"
                >
                  全て表示
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

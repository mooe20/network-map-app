import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const RELATIONSHIP_COLORS = {
  '家族': '#f472b6',
  'ビジネス': '#34d399',
  '地元': '#fbbf24',
  '大学': '#60a5fa',
  'イベント(留学・趣味・活動)': '#a78bfa',
  'バイト・インターン': '#6ee7b7',
  'SNS': '#94a3b8',
  'その他': '#d1d5db',
  '♡': '#ef4444',
};

const DEFAULT_COLOR = '#94a3b8';

export default function NetworkGraph({ graphData, focusedNodeId, onNodeClick }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dims, setDims] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ width, height });
    });
    ro.observe(el);
    // 初期サイズ
    const { width, height } = el.getBoundingClientRect();
    if (width > 0) setDims({ width, height });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!fgRef.current || graphData.nodes.length === 0) return;
    // ノードは fx/fy で固定済みなのでシミュレーション不要
    fgRef.current.d3Force('charge', null);
    fgRef.current.d3Force('link', null);
    fgRef.current.d3Force('center', null);
  }, [graphData]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isCenter = node.id === focusedNodeId;
    const isMe = node.isMe === true;
    const radius = (isCenter ? 22 : isMe ? 18 : 15) / globalScale;
    const fontSize = Math.max(11 / globalScale, 2.5);

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isCenter ? '#6366f1' : isMe ? '#f59e0b' : '#e0e7ff';
    ctx.fill();
    ctx.strokeStyle = isCenter ? '#4338ca' : isMe ? '#d97706' : '#a5b4fc';
    ctx.lineWidth = (isCenter || isMe ? 3 : 1.5) / globalScale;
    ctx.stroke();

    // isMe のとき点線の枠で強調
    if (isMe) {
      ctx.save();
      ctx.setLineDash([3 / globalScale, 2 / globalScale]);
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 3 / globalScale, 0, 2 * Math.PI);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
      ctx.restore();
    }

    // Person icon
    const iconColor = (isCenter || isMe) ? 'rgba(255,255,255,0.9)' : '#6366f1';
    ctx.fillStyle = iconColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y - radius * 0.2, radius * 0.32, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(node.x, node.y + radius * 0.4, radius * 0.38, radius * 0.28, 0, Math.PI, 0);
    ctx.fill();

    // Name label
    ctx.font = `${(isCenter || isMe) ? 'bold ' : ''}${fontSize}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const label = isMe ? `${node.name}（自分）` : node.name;
    const labelY = node.y + radius + 3 / globalScale;

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const tw = ctx.measureText(label).width;
    ctx.fillRect(node.x - tw / 2 - 2 / globalScale, labelY - 1 / globalScale, tw + 4 / globalScale, fontSize + 2 / globalScale);

    ctx.fillStyle = isCenter ? '#3730a3' : isMe ? '#92400e' : '#374151';
    ctx.fillText(label, node.x, labelY);

    if (!isMe && node.company) {
      const smallFont = fontSize * 0.82;
      ctx.font = `${smallFont}px -apple-system, sans-serif`;
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(node.company, node.x, labelY + fontSize + 2 / globalScale);
    }
  }, [focusedNodeId]);

  const nodePointerAreaPaint = useCallback((node, color, ctx, globalScale) => {
    const radius = (node.id === focusedNodeId ? 24 : 17) / globalScale;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, [focusedNodeId]);

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const start = link.source;
    const end = link.target;
    if (typeof start !== 'object' || typeof end !== 'object') return;

    // 破線（間接つながり）の描画
    if (link.isPhantom) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / dist;
      const uy = dy / dist;

      // 破線
      ctx.save();
      ctx.setLineDash([6 / globalScale, 4 / globalScale]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
      ctx.restore();

      // 線の上に点を3個置く
      const dotR = 3 / globalScale;
      const positions = [0.3, 0.5, 0.7];
      positions.forEach(t => {
        const px = start.x + dx * t;
        const py = start.y + dy * t;
        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, 2 * Math.PI);
        ctx.fillStyle = '#9ca3af';
        ctx.fill();
      });

      // 中央に「未接続」ラベル
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const fontSize = Math.max(8 / globalScale, 2);
      ctx.font = `${fontSize}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = '未接続';
      const tw = ctx.measureText(text).width;
      const pad = 2.5 / globalScale;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(midX - tw/2 - pad, midY - fontSize/2 - pad, tw + pad*2, fontSize + pad*2);
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(text, midX, midY);
      return;
    }

    const color = RELATIONSHIP_COLORS[link.relationshipType] || DEFAULT_COLOR;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / globalScale;
    ctx.stroke();

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const fontSize = Math.max(9 / globalScale, 2);
    ctx.font = `${fontSize}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = `＋ ${link.label}`;
    const tw = ctx.measureText(text).width;
    const pad = 2 / globalScale;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillRect(midX - tw / 2 - pad, midY - fontSize / 2 - pad, tw + pad * 2, fontSize + pad * 2);
    ctx.fillStyle = color;
    ctx.fillText(text, midX, midY);
  }, []);

  if (graphData.nodes.length === 0) {
    return (
      <div ref={containerRef} className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">まだ繋がりがありません</p>
          <p className="text-gray-400 text-sm mt-1">「検索」タブでユーザーを探しましょう</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
    <ForceGraph2D
      ref={fgRef}
      width={dims.width}
      height={dims.height}
      graphData={graphData}
      nodeId="id"
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={nodePointerAreaPaint}
      linkCanvasObject={linkCanvasObject}
      onNodeClick={onNodeClick}
      backgroundColor="#f8fafc"
      cooldownTicks={10}
      onEngineStop={() => {
        if (fgRef.current) fgRef.current.zoomToFit(500, 50);
      }}
      linkDirectionalParticles={link => link.isPhantom ? 0 : 2}
      linkDirectionalParticleWidth={2}
      linkDirectionalParticleColor={link => RELATIONSHIP_COLORS[link.relationshipType] || DEFAULT_COLOR}
      enableNodeDrag={true}
      minZoom={0.3}
      maxZoom={5}
    />
    </div>
  );
}

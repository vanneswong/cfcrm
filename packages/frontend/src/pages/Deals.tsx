import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Deal {
  id: string;
  customer_id: string;
  title: string;
  amount: number;
  stage: string;
  probability: number;
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const stageLabel: Record<string, string> = {
  qualification: '需求确认',
  needs_analysis: '需求分析',
  proposal: '方案提案',
  negotiation: '商务谈判',
  closed_won: '✅ 赢单',
  closed_lost: '❌ 丢单',
};

const stageColor: Record<string, string> = {
  qualification: '#6b7280',
  needs_analysis: '#2563eb',
  proposal: '#7c3aed',
  negotiation: '#d97706',
  closed_won: '#16a34a',
  closed_lost: '#dc2626',
};

export default function Deals() {
  const [result, setResult] = useState<Paginated<Deal> | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const query = stageFilter ? `?stage=${stageFilter}&per_page=50` : '?per_page=50';
    api.get<Paginated<Deal>>(`/deals${query}`)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [stageFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>销售 Pipeline</h1>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: '0.875rem',
          }}
        >
          <option value="">全部阶段</option>
          {Object.entries(stageLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>加载中…</p>
      ) : result && result.data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {result.data.map((deal) => (
            <div
              key={deal.id}
              style={{
                background: '#fff',
                padding: '1rem 1.25rem',
                borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{deal.title}</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(deal.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  background: stageColor[deal.stage] + '18',
                  color: stageColor[deal.stage],
                  padding: '0.2rem 0.625rem',
                  borderRadius: 99,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  {stageLabel[deal.stage] || deal.stage}
                </span>

                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  ¥{deal.amount.toLocaleString()}
                </span>

                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {deal.probability}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#64748b' }}>暂无交易数据。</p>
      )}
    </div>
  );
}

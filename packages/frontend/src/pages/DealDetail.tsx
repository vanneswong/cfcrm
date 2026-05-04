import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

interface Deal {
  id: string;
  customer_id: string;
  title: string;
  amount: number;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  contact_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  company: string | null;
}

interface Interaction {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  deal_id: string | null;
  occurred_at: string | null;
  created_at: string;
}

const stageLabel: Record<string, string> = {
  qualification: '需求确认', needs_analysis: '需求分析', proposal: '方案提案',
  negotiation: '商务谈判', closed_won: '✅ 赢单', closed_lost: '❌ 丢单',
};

const stageColor: Record<string, string> = {
  qualification: '#6b7280', needs_analysis: '#2563eb', proposal: '#7c3aed',
  negotiation: '#d97706', closed_won: '#16a34a', closed_lost: '#dc2626',
};

const interactionLabel: Record<string, string> = {
  call: '📞 电话', meeting: '🤝 会议', email: '📧 邮件', note: '📝 笔记', task: '✅ 任务',
};

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<Deal>(`/deals/${id}`)
      .then(async (d) => {
        setDeal(d);
        // Fetch related customer
        try {
          const cust = await api.get<Customer>(`/customers/${d.customer_id}`);
          setCustomer(cust);
        } catch {}
        // Fetch interactions for this deal's customer
        try {
          const inters = await api.get<Interaction[]>(`/customers/${d.customer_id}/interactions`);
          setInteractions(inters.filter((i) => i.deal_id === id || i.subject?.includes(d.title)));
        } catch {}
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ color: '#64748b' }}>加载中…</p>;
  if (!deal) return <p style={{ color: '#dc2626' }}>交易不存在。</p>;

  const stages = ['qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  const currentIdx = stages.indexOf(deal.stage);

  return (
    <div>
      <Link to="/deals" style={{ color: '#2563eb', fontSize: '0.875rem', textDecoration: 'none' }}>
        ← 返回 Pipeline
      </Link>

      {/* Header */}
      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{deal.title}</h1>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
          {customer && (
            <Link to={`/customers/${customer.id}`} style={{ color: '#2563eb', fontSize: '0.9rem' }}>
              {customer.name}{customer.company ? ` (${customer.company})` : ''}
            </Link>
          )}
          <span style={{
            background: stageColor[deal.stage] + '18', color: stageColor[deal.stage],
            padding: '0.15rem 0.625rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600,
          }}>
            {stageLabel[deal.stage] || deal.stage}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Deal info */}
          <section style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase' }}>
              交易详情
            </h3>
            <InfoRow label="金额" value={`¥${deal.amount.toLocaleString()}`} />
            <InfoRow label="赢单概率" value={`${deal.probability}%`} />
            <InfoRow
              label="预计关单"
              value={deal.expected_close_date
                ? new Date(deal.expected_close_date).toLocaleDateString('zh-CN')
                : '—'}
            />
            <InfoRow label="备注" value={deal.notes} />
            <InfoRow
              label="创建时间"
              value={new Date(deal.created_at).toLocaleString('zh-CN')}
            />
          </section>

          {/* Stage progress */}
          <section style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase' }}>
              阶段进度
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stages.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: i <= currentIdx ? stageColor[s] : '#e2e8f0',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: '0.85rem',
                    color: i <= currentIdx ? '#1e293b' : '#94a3b8',
                    fontWeight: i === currentIdx ? 600 : 400,
                  }}>
                    {stageLabel[s]}
                    {i === currentIdx && ' ← 当前'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Interactions */}
        <section style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase' }}>
            沟通记录 ({interactions.length})
          </h3>
          {interactions.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>暂无记录</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {interactions.map((i) => (
                <div key={i.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {interactionLabel[i.type] || i.type} — {i.subject}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {i.occurred_at ? new Date(i.occurred_at).toLocaleDateString('zh-CN') : ''}
                    </span>
                  </div>
                  {i.body && <p style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'pre-wrap' }}>{i.body}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ width: 80, fontSize: '0.8rem', color: '#94a3b8', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.875rem' }}>{value}</span>
    </div>
  );
}

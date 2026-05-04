import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

interface Customer {
  id: string;
  name: string;
  company: string | null;
  industry: string | null;
  status: string;
  source: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface Contact {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  is_primary: number;
}

interface Interaction {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  occurred_at: string | null;
  created_at: string;
}

interface Deal {
  id: string;
  title: string;
  amount: number;
  stage: string;
  probability: number;
}

const statusLabel: Record<string, string> = {
  active: '活跃', inactive: '沉默', lead: '线索',
};

const interactionLabel: Record<string, string> = {
  call: '📞 电话', meeting: '🤝 会议', email: '📧 邮件', note: '📝 笔记', task: '✅ 任务',
};

const stageLabel: Record<string, string> = {
  qualification: '需求确认', needs_analysis: '需求分析', proposal: '方案提案',
  negotiation: '商务谈判', closed_won: '赢单', closed_lost: '丢单',
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<Customer>(`/customers/${id}`),
      api.get<Contact[]>(`/customers/${id}/contacts`),
      api.get<Interaction[]>(`/customers/${id}/interactions`),
      api.get<{ data: Deal[] }>(`/deals?per_page=20`),
    ]).then(([cust, conts, inters, dealResult]) => {
      setCustomer(cust);
      setContacts(conts);
      setInteractions(inters);
      setDeals(dealResult.data.filter((d: any) => d.customer_id === id));
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ color: '#64748b' }}>加载中…</p>;
  if (!customer) return <p style={{ color: '#dc2626' }}>客户不存在。</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/customers" style={{ color: '#2563eb', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← 返回客户列表
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{customer.name}</h1>
            {customer.company && <p style={{ color: '#64748b' }}>{customer.company}</p>}
          </div>
          <span style={{
            background: customer.status === 'active' ? '#16a34a18' : customer.status === 'lead' ? '#d9770618' : '#94a3b818',
            color: customer.status === 'active' ? '#16a34a' : customer.status === 'lead' ? '#d97706' : '#94a3b8',
            padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600,
          }}>
            {statusLabel[customer.status] || customer.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column: info + contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Customer Info */}
          <Section title="基本信息">
            <InfoRow label="行业" value={customer.industry} />
            <InfoRow label="来源" value={customer.source} />
            <InfoRow label="邮箱" value={customer.email} />
            <InfoRow label="电话" value={customer.phone} />
            <InfoRow label="地址" value={customer.address} />
            <InfoRow label="网站" value={customer.website} />
            <InfoRow label="备注" value={customer.notes} />
          </Section>

          {/* Contacts */}
          <Section title={`联系人 (${contacts.length})`}>
            {contacts.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>暂无联系人</p>
            ) : (
              contacts.map((c) => (
                <div key={c.id} style={{
                  padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: '0.5rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>
                      {c.name} {c.is_primary ? '⭐' : ''}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.department || c.title}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    {[c.email, c.phone].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))
            )}
          </Section>
        </div>

        {/* Right column: deals + interactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Deals */}
          <Section title={`交易 (${deals.length})`}>
            {deals.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>暂无交易</p>
            ) : (
              deals.map((d) => (
                <div key={d.id} style={{
                  padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: '0.5rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{d.title}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
                      {stageLabel[d.stage] || d.stage}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700 }}>¥{d.amount.toLocaleString()}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>{d.probability}%</span>
                  </div>
                </div>
              ))
            )}
          </Section>

          {/* Interactions */}
          <Section title={`沟通记录 (${interactions.length})`}>
            {interactions.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>暂无记录</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {interactions.slice(0, 10).map((i) => (
                  <div key={i.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {interactionLabel[i.type] || i.type} — {i.subject}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {i.occurred_at ? new Date(i.occurred_at).toLocaleDateString('zh-CN') : ''}
                      </span>
                    </div>
                    {i.body && <p style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-wrap' }}>{i.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ width: 80, fontSize: '0.8rem', color: '#94a3b8', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.875rem' }}>
        {label === '网站' && value.startsWith('http') ? (
          <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{value}</a>
        ) : label === '邮箱' ? (
          <a href={`mailto:${value}`} style={{ color: '#2563eb' }}>{value}</a>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

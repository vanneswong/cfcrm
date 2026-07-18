import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';

const stageOptions = [
  { value: 'qualification', label: '需求确认' },
  { value: 'needs_analysis', label: '需求分析' },
  { value: 'proposal', label: '方案提案' },
  { value: 'negotiation', label: '商务谈判' },
  { value: 'closed_won', label: '赢单' },
  { value: 'closed_lost', label: '丢单' },
];

export default function DealNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId') || '';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    customer_id: customerId,
    amount: '',
    stage: 'qualification' as string,
    probability: '20',
    expected_close_date: '',
    notes: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('交易名称不能为空');
    if (!form.customer_id.trim()) return setError('请指定关联客户');
    setError('');
    setSubmitting(true);
    try {
      const deal = await api.post<{ id: string }>('/deals', {
        title: form.title.trim(),
        customer_id: form.customer_id.trim(),
        amount: parseFloat(form.amount) || 0,
        stage: form.stage,
        probability: parseInt(form.probability, 10) || 20,
        expected_close_date: form.expected_close_date || null,
        notes: form.notes.trim() || null,
      });
      navigate(`/deals/${deal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Link to={customerId ? `/customers/${customerId}` : '/deals'} style={{ color: '#2563eb', fontSize: '0.875rem', textDecoration: 'none' }}>
        ← {customerId ? '返回客户详情' : '返回 Pipeline'}
      </Link>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem', marginBottom: '1.5rem' }}>新建交易</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640, background: '#fff', padding: '2rem', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <Field label="交易名称 *" required>
          <Input value={form.title} onChange={handleChange('title')} placeholder="如：年度软件许可采购" required />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="金额 (¥)">
            <Input value={form.amount} onChange={handleChange('amount')} type="number" min="0" step="0.01" placeholder="0" />
          </Field>
          <Field label="赢单概率 (%)">
            <Input value={form.probability} onChange={handleChange('probability')} type="number" min="0" max="100" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="阶段">
            <select value={form.stage} onChange={handleChange('stage')} style={selectStyle}>
              {stageOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="预计关单日期">
            <Input value={form.expected_close_date} onChange={handleChange('expected_close_date')} type="date" />
          </Field>
        </div>

        <Field label="关联客户 ID">
          <Input value={form.customer_id} onChange={handleChange('customer_id')} placeholder="客户 UUID" />
        </Field>

        <Field label="备注">
          <textarea
            value={form.notes}
            onChange={handleChange('notes')}
            rows={3}
            placeholder="交易备注…"
            style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
          />
        </Field>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.625rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none',
              borderRadius: 8, fontWeight: 600, cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? '创建中…' : '创建交易'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '0.625rem 1.5rem', background: '#f1f5f9', color: '#475569', border: '1px solid #d1d5db',
              borderRadius: 8, cursor: 'pointer',
            }}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', marginBottom: '1rem' }}>
      <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle }} />;
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#fff',
  cursor: 'pointer',
};

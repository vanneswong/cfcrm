import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';

const typeOptions = [
  { value: 'call', label: '📞 电话' },
  { value: 'meeting', label: '🤝 会议' },
  { value: 'email', label: '📧 邮件' },
  { value: 'note', label: '📝 笔记' },
  { value: 'task', label: '✅ 任务' },
];

export default function InteractionNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId') || '';
  const dealId = searchParams.get('dealId') || '';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'note' as string,
    subject: '',
    body: '',
    occurred_at: new Date().toISOString().slice(0, 16),
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const getBackPath = () => {
    if (dealId) return `/deals/${dealId}`;
    if (customerId) return `/customers/${customerId}`;
    return '/';
  };

  const getBackLabel = () => {
    if (dealId) return '返回交易详情';
    if (customerId) return '返回客户详情';
    return '返回首页';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) return setError('沟通主题不能为空');
    if (!customerId && !dealId) return setError('请指定关联客户或交易');
    setError('');
    setSubmitting(true);
    try {
      await api.post('/interactions', {
        customer_id: customerId || null,
        deal_id: dealId || null,
        type: form.type,
        subject: form.subject.trim(),
        body: form.body.trim() || null,
        occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : null,
      });
      navigate(getBackPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Link to={getBackPath()} style={{ color: '#2563eb', fontSize: '0.875rem', textDecoration: 'none' }}>
        ← {getBackLabel()}
      </Link>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem', marginBottom: '1.5rem' }}>新增沟通记录</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640, background: '#fff', padding: '2rem', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="沟通类型 *" required>
            <select value={form.type} onChange={handleChange('type')} style={selectStyle}>
              {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="发生时间">
            <Input value={form.occurred_at} onChange={handleChange('occurred_at')} type="datetime-local" />
          </Field>
        </div>

        <Field label="主题 *" required>
          <Input value={form.subject} onChange={handleChange('subject')} placeholder="沟通主题" required />
        </Field>

        <Field label="详细内容">
          <textarea
            value={form.body}
            onChange={handleChange('body')}
            rows={5}
            placeholder="记录沟通内容…"
            style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
          />
        </Field>

        {customerId && (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
            关联客户: {customerId}{dealId ? ` · 关联交易: ${dealId}` : ''}
          </p>
        )}

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
            {submitting ? '创建中…' : '保存记录'}
          </button>
          <button
            type="button"
            onClick={() => navigate(getBackPath())}
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

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const statusOptions = [
  { value: 'lead', label: '线索' },
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '沉默' },
];

export default function CustomerNew() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    company: '',
    industry: '',
    status: 'lead' as string,
    source: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('客户名称不能为空');
    setError('');
    setSubmitting(true);
    try {
      const customer = await api.post<{ id: string }>('/customers', {
        name: form.name.trim(),
        company: form.company.trim() || null,
        industry: form.industry.trim() || null,
        status: form.status,
        source: form.source.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        website: form.website.trim() || null,
        notes: form.notes.trim() || null,
      });
      navigate(`/customers/${customer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>新建客户</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640, background: '#fff', padding: '2rem', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <Field label="客户名称 *" required>
          <Input value={form.name} onChange={handleChange('name')} placeholder="公司或个人名称" required />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="公司">
            <Input value={form.company} onChange={handleChange('company')} placeholder="所属公司" />
          </Field>
          <Field label="行业">
            <Input value={form.industry} onChange={handleChange('industry')} placeholder="如：制造、科技、金融" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="状态">
            <select value={form.status} onChange={handleChange('status')} style={selectStyle}>
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="来源">
            <Input value={form.source} onChange={handleChange('source')} placeholder="如：展会、推荐、官网" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="邮箱">
            <Input value={form.email} onChange={handleChange('email')} type="email" placeholder="email@example.com" />
          </Field>
          <Field label="电话">
            <Input value={form.phone} onChange={handleChange('phone')} placeholder="联系电话" />
          </Field>
        </div>

        <Field label="地址">
          <Input value={form.address} onChange={handleChange('address')} placeholder="详细地址" />
        </Field>

        <Field label="网站">
          <Input value={form.website} onChange={handleChange('website')} placeholder="https://" />
        </Field>

        <Field label="备注">
          <textarea
            value={form.notes}
            onChange={handleChange('notes')}
            rows={3}
            placeholder="备注信息…"
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
            {submitting ? '创建中…' : '创建客户'}
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

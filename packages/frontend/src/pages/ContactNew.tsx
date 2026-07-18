import { useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ContactNew() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    department: '',
    is_primary: false,
    notes: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('联系人姓名不能为空');
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/customers/${customerId}/contacts`, {
        name: form.name.trim(),
        title: form.title.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        department: form.department.trim() || null,
        is_primary: form.is_primary ? 1 : 0,
        notes: form.notes.trim() || null,
      });
      navigate(`/customers/${customerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Link to={`/customers/${customerId}`} style={{ color: '#2563eb', fontSize: '0.875rem', textDecoration: 'none' }}>
        ← 返回客户详情
      </Link>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem', marginBottom: '1.5rem' }}>新增联系人</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640, background: '#fff', padding: '2rem', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <Field label="姓名 *" required>
          <Input value={form.name} onChange={handleChange('name')} placeholder="联系人姓名" required />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="职位">
            <Input value={form.title} onChange={handleChange('title')} placeholder="如：采购经理" />
          </Field>
          <Field label="部门">
            <Input value={form.department} onChange={handleChange('department')} placeholder="如：采购部" />
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

        <Field label="">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm((prev) => ({ ...prev, is_primary: e.target.checked }))}
              style={{ width: 18, height: 18 }}
            />
            设为主要联系人
          </label>
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
            {submitting ? '创建中…' : '创建联系人'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/customers/${customerId}`)}
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
      {label && (
        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>
          {label}
          {required && <span style={{ color: '#dc2626' }}> *</span>}
        </span>
      )}
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

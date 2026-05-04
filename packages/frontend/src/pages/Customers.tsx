import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface Customer {
  id: string;
  name: string;
  company: string | null;
  status: string;
  email: string | null;
  created_at: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const statusLabel: Record<string, string> = {
  active: '活跃',
  inactive: '沉默',
  lead: '线索',
};

const statusColor: Record<string, string> = {
  active: '#16a34a',
  inactive: '#94a3b8',
  lead: '#d97706',
};

export default function Customers() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Customer> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<Paginated<Customer>>(`/customers?page=${page}&per_page=20`)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>客户管理</h1>
        <button
          onClick={() => navigate('/customers/new')}
          style={{
          padding: '0.5rem 1rem',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          + 新建客户
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>加载中…</p>
      ) : result && result.data.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>客户名称</th>
                <th style={thStyle}>公司</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>邮箱</th>
                <th style={thStyle}>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>
                    <Link to={`/customers/${c.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                      {c.name}
                    </Link>
                  </td>
                  <td style={tdStyle}>{c.company || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: statusColor[c.status] + '18',
                      color: statusColor[c.status],
                      padding: '0.125rem 0.5rem',
                      borderRadius: 99,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{c.email || '—'}</td>
                  <td style={tdStyle}>{new Date(c.created_at).toLocaleDateString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={pageBtnStyle}
            >
              上一页
            </button>
            <span style={{ padding: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
              第 {result.page} / {result.total_pages} 页（共 {result.total} 条）
            </span>
            <button
              onClick={() => setPage((p) => Math.min(result.total_pages, p + 1))}
              disabled={page >= result.total_pages}
              style={pageBtnStyle}
            >
              下一页
            </button>
          </div>
        </>
      ) : (
        <p style={{ color: '#64748b' }}>暂无客户数据。</p>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem 1rem',
  fontWeight: 600,
  fontSize: '0.8rem',
  color: '#64748b',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
};

const pageBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.875rem',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

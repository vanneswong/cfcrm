import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Stats {
  totalCustomers: number;
  activeDeals: number;
  wonDeals: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Load dashboard stats from multiple endpoints
    Promise.all([
      api.get<{ total: number }>('/customers?per_page=1'),
      api.get<{ total: number }>('/deals?stage=negotiation&per_page=1'),
      api.get<{ total: number }>('/deals?stage=closed_won&per_page=1'),
    ]).then(([customers, active, won]) => {
      setStats({
        totalCustomers: customers.total,
        activeDeals: active.total,
        wonDeals: won.total,
      });
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        仪表盘
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard label="客户总数" value={stats?.totalCustomers} color="#2563eb" />
        <StatCard label="进行中的交易" value={stats?.activeDeals} color="#d97706" />
        <StatCard label="已赢单" value={stats?.wonDeals} color="#16a34a" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  return (
    <div style={{
      background: '#fff',
      padding: '1.5rem',
      borderRadius: 10,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
    }}>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>
        {value !== undefined ? value.toLocaleString() : '—'}
      </p>
    </div>
  );
}

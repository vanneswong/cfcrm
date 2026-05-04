import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>
          📊 CRM
        </h2>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <NavLink to="/">仪表盘</NavLink>
          <NavLink to="/customers">客户管理</NavLink>
          <NavLink to="/deals">销售 Pipeline</NavLink>
        </nav>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: 'auto' }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {user?.name}
            <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem' }}>
              {user?.role}
            </span>
          </p>
          <button
            onClick={handleLogout}
            style={{
              background: '#334155',
              color: '#e2e8f0',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 6,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem', background: '#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        color: '#e2e8f0',
        textDecoration: 'none',
        padding: '0.5rem 0.75rem',
        borderRadius: 6,
        display: 'block',
      }}
    >
      {children}
    </Link>
  );
}

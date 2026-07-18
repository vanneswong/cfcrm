import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CustomerNew from './pages/CustomerNew';
import Deals from './pages/Deals';
import DealDetail from './pages/DealDetail';
import ContactNew from './pages/ContactNew';
import DealNew from './pages/DealNew';
import InteractionNew from './pages/InteractionNew';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#64748b' }}>加载中…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/new" element={<CustomerNew />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="deals" element={<Deals />} />
            <Route path="deals/new" element={<DealNew />} />
            <Route path="deals/:id" element={<DealDetail />} />
            <Route path="customers/:customerId/contacts/new" element={<ContactNew />} />
            <Route path="interactions/new" element={<InteractionNew />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import Inventory from './pages/Inventory';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Stores from './pages/Stores';
import Users from './pages/Users';
import MyTeam from './pages/MyTeam';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" />;
}

function ManagerRoute({ children }) {
  const { user } = useAuth();
  return (user?.role === 'admin' || user?.role === 'manager') ? children : <Navigate to="/" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Everyone */}
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="add-product" element={<AddProduct />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="settings" element={<Settings />} />

        {/* Manager + Admin */}
        <Route path="reports" element={<ManagerRoute><Reports /></ManagerRoute>} />
        <Route path="my-team" element={<ManagerRoute><MyTeam /></ManagerRoute>} />

        {/* Admin only */}
        <Route path="stores" element={<AdminRoute><Stores /></AdminRoute>} />
        <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </Router>
    </AuthProvider>
  );
}

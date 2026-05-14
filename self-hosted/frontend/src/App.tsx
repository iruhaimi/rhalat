import { Route, Routes, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TwoFactor from './pages/TwoFactor';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 20 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Link to="/">الرئيسية</Link><Link to="/login">دخول</Link>
        <Link to="/register">تسجيل</Link><Link to="/dashboard">لوحتي</Link>
        <Link to="/files">الملفات</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>عطلات رحلاتكم — Self-Hosted</h1>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/2fa" element={<TwoFactor />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/files" element={<Files />} />
      </Routes>
    </div>
  );
}
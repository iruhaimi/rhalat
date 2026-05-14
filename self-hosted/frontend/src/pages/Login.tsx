import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const nav = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await api<{ requires2fa?: boolean; userId?: string }>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      if (r.requires2fa) { sessionStorage.setItem('2fa_user', r.userId!); nav('/2fa'); }
      else nav('/dashboard');
    } catch { setErr('بيانات الدخول غير صحيحة'); }
  }
  return (
    <form onSubmit={submit} style={{ maxWidth: 360, display: 'grid', gap: 8 }}>
      <h2>تسجيل الدخول</h2>
      {err && <div style={{ color: 'crimson' }}>{err}</div>}
      <input dir="ltr" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input dir="ltr" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">دخول</button>
    </form>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
export default function Register() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); const nav = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, fullName }) });
    nav('/dashboard');
  }
  return (
    <form onSubmit={submit} style={{ maxWidth: 360, display: 'grid', gap: 8 }}>
      <h2>إنشاء حساب</h2>
      <input placeholder="الاسم الكامل" value={fullName} onChange={e => setFullName(e.target.value)} />
      <input dir="ltr" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input dir="ltr" type="password" placeholder="Password (8+)" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">تسجيل</button>
    </form>
  );
}
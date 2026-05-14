import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
export default function TwoFactor() {
  const [code, setCode] = useState(''); const nav = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const userId = sessionStorage.getItem('2fa_user');
    await api('/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ userId, code }) });
    sessionStorage.removeItem('2fa_user'); nav('/dashboard');
  }
  return (
    <form onSubmit={submit} style={{ maxWidth: 320, display: 'grid', gap: 8 }}>
      <h2>رمز التحقق</h2>
      <input dir="ltr" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
      <button type="submit">تأكيد</button>
    </form>
  );
}
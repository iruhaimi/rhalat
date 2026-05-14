import { useEffect, useState } from 'react';
import { api } from '../lib/api';
export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => { api('/auth/me').then(setMe).catch(() => setMe({ error: true })); }, []);
  if (!me) return <p>جارٍ التحميل…</p>;
  if (me.error) return <p>غير مسجل دخول.</p>;
  return (<div><h2>أهلاً، {me.user?.email}</h2><p>الأدوار: {me.roles?.join(', ') || 'بدون'}</p></div>);
}
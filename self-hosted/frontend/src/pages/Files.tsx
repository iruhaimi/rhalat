import { useState } from 'react';
import { api } from '../lib/api';
export default function Files() {
  const [appId, setAppId] = useState(''); const [status, setStatus] = useState('');
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !appId) return;
    setStatus('طلب رابط الرفع...');
    const { uploadUrl } = await api<{ uploadUrl: string }>('/files/presigned-upload', {
      method: 'POST',
      body: JSON.stringify({ applicationId: appId, documentType: 'passport',
        fileName: file.name, mimeType: file.type, fileSize: file.size }),
    });
    setStatus('جارٍ الرفع...');
    await fetch(uploadUrl, { method: 'PUT', body: file });
    setStatus('تم الرفع ✅');
  }
  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
      <h2>رفع ملف (Presigned)</h2>
      <input placeholder="Application ID" value={appId} onChange={e => setAppId(e.target.value)} />
      <input type="file" onChange={upload} />
      <p>{status}</p>
    </div>
  );
}
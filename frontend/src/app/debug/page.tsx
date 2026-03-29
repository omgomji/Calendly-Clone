'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const windowUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/api` : 'N/A';
    
    const debugInfo = {
      environment: process.env.NODE_ENV,
      buildTime: new Date().toISOString(),
      apiUrlFromEnv: apiUrl || 'NOT_SET',
      apiUrlFallback: windowUrl,
      finalApiUrl: apiUrl || windowUrl,
    };

    setData(debugInfo);
    setLoading(false);
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  const apiUrl = data?.apiUrlFromEnv || data?.apiUrlFallback;
  
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'monospace', 
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>🔧 Calendly Clone - Debug Info</h1>
        
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>Environment Configuration</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <td style={{ padding: '10px', width: '40%' }}>Environment:</td>
                <td style={{ padding: '10px' }}><strong>{data?.environment}</strong></td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <td style={{ padding: '10px' }}>API URL from .env:</td>
                <td style={{ padding: '10px' }}>
                  <strong style={{ color: data?.apiUrlFromEnv === 'NOT_SET' ? '#ff6b6b' : '#51cf66' }}>
                    {data?.apiUrlFromEnv}
                  </strong>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px' }}>Being Used:</td>
                <td style={{ padding: '10px' }}>
                  <strong style={{ color: '#51cf66' }}>{apiUrl}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>Diagnosis</h2>
          {data?.apiUrlFromEnv === 'NOT_SET' ? (
            <div style={{ color: '#ff6b6b' }}>
              ❌ <strong>NEXT_PUBLIC_API_URL is NOT SET in Vercel</strong>
              <ol style={{ marginTop: '10px' }}>
                <li>Go to Vercel Dashboard</li>
                <li>Select calendly-clone project</li>
                <li>Settings → Environment Variables</li>
                <li>Click "Add New"</li>
                <li>Name: NEXT_PUBLIC_API_URL</li>
                <li>Value: https://calendly-clone-heqv.onrender.com/api</li>
                <li>Check Production, Preview, Development</li>
                <li>Save and Redeploy</li>
              </ol>
            </div>
          ) : (
            <div style={{ color: '#51cf66' }}>
              ✅ <strong>NEXT_PUBLIC_API_URL is SET correctly</strong>
              <p>Testing connection to backend...</p>
              <BackendTest url={apiUrl} />
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px' }}>
          <h2>Backend Status</h2>
          <p>Backend: <strong>https://calendly-clone-heqv.onrender.com</strong></p>
          <p>Health: <strong>/health</strong> endpoint</p>
          <p>API Base: <strong>{apiUrl}</strong></p>
        </div>
      </div>
    </div>
  );
}

function BackendTest({ url }: { url: string }) {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    fetch(`${url}/health`)
      .then(res => res.json())
      .then(() => setStatus('✅ Backend connected successfully'))
      .catch(() => setStatus('❌ Backend not responding - check Render deployment'));
  }, [url]);

  return <p style={{ color: status.includes('✅') ? '#51cf66' : '#ff6b6b' }}>{status}</p>;
}


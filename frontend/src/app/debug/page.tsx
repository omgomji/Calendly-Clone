'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [apiUrl, setApiUrl] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking...');

  useEffect(() => {
    // Get API URL from environment
    const url = process.env.NEXT_PUBLIC_API_URL || 'DEFAULT: http://localhost:5000/api';
    setApiUrl(url);

    // Test backend connection
    fetch(`${url}/health`)
      .then(res => res.json())
      .then(data => setBackendStatus(`✅ Connected: ${JSON.stringify(data)}`))
      .catch(err => setBackendStatus(`❌ Error: ${err.message}`));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}>
      <h1>🔍 API Debug Info</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
        <h2>Frontend Environment</h2>
        <p><strong>NEXT_PUBLIC_API_URL:</strong></p>
        <code style={{ 
          display: 'block', 
          padding: '10px', 
          backgroundColor: '#f0f0f0',
          wordBreak: 'break-all'
        }}>
          {apiUrl}
        </code>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
        <h2>Backend Connection</h2>
        <p><code>{backendStatus}</code></p>
      </div>

      <div style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
        <h2>Troubleshooting</h2>
        <ul>
          <li>If NEXT_PUBLIC_API_URL is empty: Env var not set in Vercel</li>
          <li>If it shows localhost: Using fallback (local development mode)</li>
          <li>If backend connection fails: Check Render backend is running</li>
          <li>If correct URL shown but still 404: Issue with API routing on backend</li>
        </ul>
      </div>
    </div>
  );
}

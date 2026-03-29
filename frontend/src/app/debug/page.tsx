'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [info, setInfo] = useState<string>('Loading...');

  useEffect(() => {
    const debug = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
      backendUrl: process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/health`
        : 'N/A (env not set)',
      allEnvVars: Object.keys(process.env)
        .filter(key => key.toLowerCase().includes('api') || key.toLowerCase().includes('public'))
        .reduce((acc: Record<string, string>, key: string) => {
          acc[key] = process.env[key] || 'undefined';
          return acc;
        }, {}),
    };

    setInfo(JSON.stringify(debug, null, 2));

    // Try to fetch backend
    if (process.env.NEXT_PUBLIC_API_URL) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
        .then(res => res.json())
        .then(data => {
          setInfo(prev => prev + '\n\n✅ BACKEND CONNECTION SUCCESSFUL\n' + JSON.stringify(data, null, 2));
        })
        .catch(err => {
          setInfo(prev => prev + '\n\n❌ BACKEND CONNECTION FAILED\n' + err.message);
        });
    }
  }, []);

  return (
    <div style={{ 
      padding: '40px',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}>
      <h1 style={{ marginBottom: '20px' }}>🔍 DEPLOYMENT DEBUG INFO</h1>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '90vh'
      }}>
        <code>{info}</code>
      </div>
      
      <div style={{ marginTop: '40px', backgroundColor: '#fff', padding: '20px', border: '1px solid #ddd' }}>
        <h3>📋 QUICK CHECKS</h3>
        <ul>
          <li>If NEXT_PUBLIC_API_URL is "NOT SET" → Environment variable not configured in Vercel Settings</li>
          <li>If it shows a URL → Check ✅ or ❌ status below for backend connection</li>
          <li>If ❌ backend fails → Render backend might be down or URL is wrong</li>
          <li>If ✅ backend works → Main frontend should work (refresh home page)</li>
        </ul>
      </div>
    </div>
  );
}

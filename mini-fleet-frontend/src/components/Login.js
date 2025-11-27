// src/components/Login.js
import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/auth/login', {
        email,
        password,
      });
      const token = res.data.token;
      localStorage.setItem('token', token);
      onLogin(token);
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 0% 0%, rgba(56,189,248,0.25), transparent 55%), #020617',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#e5e7eb',
      }}
    >
      <div
        style={{
          width: 380,
          maxWidth: '90vw',
          padding: '26px 26px 22px',
          borderRadius: 18,
          background: '#020617',
          border: '1px solid #1f2937',
          boxShadow: '0 22px 55px rgba(15,23,42,0.9)',
        }}
      >
        {/* Logo / title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: 'linear-gradient(135deg,#22c55e,#3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            R
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 0.4,
              }}
            >
              Mini‑Fleet Monitor
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Sign in to manage your robots
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: 4 }}>
          <label
            style={{
              display: 'block',
              textAlign: 'left',
              fontSize: 12,
              marginBottom: 4,
              color: '#9ca3af',
            }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '9px 10px',
              marginBottom: 10,
              borderRadius: 10,
              border: '1px solid #1f2937',
              background: '#020617',
              color: '#e5e7eb',
              fontSize: 13,
            }}
          />

          <label
            style={{
              display: 'block',
              textAlign: 'left',
              fontSize: 12,
              marginBottom: 4,
              color: '#9ca3af',
            }}
          >
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '9px 10px',
              marginBottom: 14,
              borderRadius: 10,
              border: '1px solid #1f2937',
              background: '#020617',
              color: '#e5e7eb',
              fontSize: 13,
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '9px 10px',
              borderRadius: 10,
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              background:
                'linear-gradient(135deg,#3b82f6,#22c55e)',
              color: '#f9fafb',
              fontSize: 14,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          Use your admin@test.com account to access the dashboard.
        </div>
      </div>
    </div>
  );
}

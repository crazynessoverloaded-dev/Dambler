import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState(false);

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLoginSuccess(true);
      setTimeout(() => setLocation('/'), 1500);
    },
    onError: (err) => {
      setErrors({ general: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    loginMutation.mutate({ email, password });
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '11px 14px', borderRadius: 8, border: `1px solid ${hasError ? '#ef4444' : '#ddd'}`,
    background: '#f5f5f5', color: '#111', fontSize: 13.5, outline: 'none',
    boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, letterSpacing: 0.2,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 18, padding: '36px 32px' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 42, fontWeight: 400, fontFamily: "'Great Vibes', cursive", color: '#fff', lineHeight: 1 }}>Dambler</div>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: 2.5, fontWeight: 700, marginTop: 4, textTransform: 'uppercase' }}>Welcome Back</div>
            <p style={{ fontSize: 12.5, color: '#555', marginTop: 8 }}>Sign in to your account</p>
          </div>

          {loginSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Login Successful!</p>
              <p style={{ fontSize: 13, color: '#555' }}>Redirecting to home…</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errors.general && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p style={{ fontSize: 12.5, color: '#f87171', margin: 0 }}>{errors.general}</p>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email" value={email} placeholder="you@example.com"
                  onChange={e => { setEmail(e.target.value); setErrors({}); }}
                  style={inputStyle(!!errors.email)}
                />
                {errors.email && <p style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>{errors.email}</p>}
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} placeholder="••••••••"
                    onChange={e => { setPassword(e.target.value); setErrors({}); }}
                    style={{ ...inputStyle(!!errors.password), paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>{errors.password}</p>}
              </div>

              <button type="submit" disabled={loginMutation.isPending}
                style={{
                  width: '100%', padding: '12px', borderRadius: 9, border: 'none',
                  background: loginMutation.isPending ? '#333' : '#fff',
                  color: loginMutation.isPending ? '#777' : '#111',
                  fontSize: 13.5, fontWeight: 800, cursor: loginMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}>
                {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
              </button>

              <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #1e1e1e', textAlign: 'center' }}>
                <p style={{ fontSize: 12.5, color: '#555', margin: 0 }}>
                  Don't have an account?{' '}
                  <Link href="/register">
                    <span style={{ color: '#aaa', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>Create one</span>
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link href="/">
            <span style={{ fontSize: 12, color: '#444', cursor: 'pointer', textDecoration: 'none' }}>← Back to site</span>
          </Link>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#333', marginTop: 10 }}>
          By signing in you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}

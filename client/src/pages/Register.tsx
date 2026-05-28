import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

export default function Register() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const refFromUrl = new URLSearchParams(search).get('ref') ?? '';
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '', referralCode: refFromUrl.toUpperCase() });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const utils = trpc.useUtils();
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setRegisterSuccess(true);
      setTimeout(() => setLocation('/'), 1500);
    },
    onError: (err) => {
      const msg = err.message;
      if (msg.includes('email')) setErrors({ email: msg });
      else if (msg.includes('username') || msg.includes('Username')) setErrors({ username: msg });
      else setErrors({ general: msg });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = 'Letters, numbers and underscores only';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    registerMutation.mutate({ username: formData.username, email: formData.email, password: formData.password, referralCode: formData.referralCode.trim() || undefined });
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${hasError ? '#ef4444' : '#ddd'}`,
    background: '#f5f5f5', color: '#111', fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 5, letterSpacing: 0.2,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 18, padding: '36px 32px' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 42, fontWeight: 400, fontFamily: "'Great Vibes', cursive", color: '#fff', lineHeight: 1 }}>Dambler</div>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: 2.5, fontWeight: 700, marginTop: 4, textTransform: 'uppercase' }}>Create Account</div>
            <p style={{ fontSize: 12.5, color: '#555', marginTop: 8 }}>Get 1,000 DMB free on signup</p>
          </div>

          {registerSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={24} color="#fff" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Account Created!</p>
              <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, marginBottom: 4 }}>🎉 1,000 DMB added to your wallet!</p>
              <p style={{ fontSize: 13, color: '#555' }}>Welcome to Dambler. Redirecting…</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errors.general && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p style={{ fontSize: 12.5, color: '#f87171', margin: 0 }}>{errors.general}</p>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Username</label>
                <input type="text" name="username" value={formData.username} placeholder="gambler123"
                  onChange={handleChange} style={inputStyle(!!errors.username)} />
                {errors.username && <p style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>{errors.username}</p>}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Email Address</label>
                <input type="email" name="email" value={formData.email} placeholder="you@example.com"
                  onChange={handleChange} style={inputStyle(!!errors.email)} />
                {errors.email && <p style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>{errors.email}</p>}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} placeholder="Min. 8 characters"
                    onChange={handleChange} style={{ ...inputStyle(!!errors.password), paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>{errors.password}</p>}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} placeholder="••••••••"
                    onChange={handleChange} style={{ ...inputStyle(!!errors.confirmPassword), paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex' }}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>{errors.confirmPassword}</p>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  Referral Code <span style={{ color: '#3a3a3a', fontWeight: 400 }}>(optional)</span>
                </label>
                <input type="text" name="referralCode" value={formData.referralCode} placeholder="e.g. A3F9C2B1"
                  onChange={handleChange} maxLength={8}
                  style={{ ...inputStyle(), textTransform: 'uppercase' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 18 }}>
                <input type="checkbox" required style={{ marginTop: 2, accentColor: '#fff', cursor: 'pointer' }} />
                <span style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                  I agree to the{' '}
                  <Link href="/terms"><span style={{ color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span></Link>
                  {' '}and{' '}
                  <Link href="/privacy"><span style={{ color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span></Link>
                </span>
              </label>

              <button type="submit" disabled={registerMutation.isPending}
                style={{
                  width: '100%', padding: '12px', borderRadius: 9, border: 'none',
                  background: registerMutation.isPending ? '#333' : '#fff',
                  color: registerMutation.isPending ? '#777' : '#111',
                  fontSize: 13.5, fontWeight: 800, cursor: registerMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}>
                {registerMutation.isPending ? 'Creating Account…' : 'Create Account — Get 1,000 DMB Free'}
              </button>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #1e1e1e', textAlign: 'center' }}>
                <p style={{ fontSize: 12.5, color: '#555', margin: 0 }}>
                  Already have an account?{' '}
                  <Link href="/login">
                    <span style={{ color: '#aaa', fontWeight: 700, cursor: 'pointer' }}>Sign in</span>
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link href="/">
            <span style={{ fontSize: 12, color: '#444', cursor: 'pointer' }}>← Back to site</span>
          </Link>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#333', marginTop: 10 }}>
          18+ only. Please gamble responsibly.
        </p>
      </motion.div>
    </div>
  );
}

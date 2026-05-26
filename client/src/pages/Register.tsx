import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, CheckCircle, Tag } from 'lucide-react';
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

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
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

    registerMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      referralCode: formData.referralCode.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join Dambler — get 1,000 DMB free on signup</p>
        </div>

        <div className="glass-effect rounded-2xl p-8 border border-accent/20 backdrop-blur-xl">
          {registerSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
              <p className="text-accent font-bold mb-1">🎉 1,000 DMB added to your wallet!</p>
              <p className="text-muted-foreground">Welcome to Dambler. Redirecting...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.general && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm">{errors.general}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text" name="username" value={formData.username} onChange={handleChange}
                    placeholder="gambler123"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-background border transition-all ${errors.username ? 'border-red-500/50' : 'border-border focus:border-accent/50'} text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/20`}
                  />
                </div>
                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-background border transition-all ${errors.email ? 'border-red-500/50' : 'border-border focus:border-accent/50'} text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/20`}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 rounded-lg bg-background border transition-all ${errors.password ? 'border-red-500/50' : 'border-border focus:border-accent/50'} text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/20`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 rounded-lg bg-background border transition-all ${errors.confirmPassword ? 'border-red-500/50' : 'border-border focus:border-accent/50'} text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/20`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Referral Code <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text" name="referralCode" value={formData.referralCode} onChange={handleChange}
                    placeholder="e.g. A3F9C2B1"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-background border border-border focus:border-accent/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/20 uppercase transition-all"
                    maxLength={8}
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1 rounded border-border" required />
                <span className="text-sm text-muted-foreground">I agree to the Terms of Service and Privacy Policy</span>
              </label>

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-accent text-primary-foreground hover:bg-accent/90 h-11 font-semibold shadow-lg neon-glow-hover disabled:opacity-50"
              >
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account — Get 1,000 DMB Free'}
              </Button>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login">
                    <a className="text-accent hover:text-accent/80 font-semibold transition-colors">Sign in</a>
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          18+ only. Please gamble responsibly.
        </p>
      </motion.div>
    </div>
  );
}

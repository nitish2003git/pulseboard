import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import Spinner from '../components/ui/Spinner';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demo = () => setForm({ email: 'admin@pulseboard.dev', password: 'password123' });

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-content">Sign in to PulseBoard</h2>
        <p className="mt-1.5 text-sm text-muted">Pick up right where your team left off.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label mb-1.5 block">Email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="email"
              required
              autoFocus
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              className="input pl-9"
            />
          </div>
        </div>

        <div>
          <label className="label mb-1.5 block">Password</label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="input pl-9"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={16} /> : (<>Sign in <ArrowRight size={16} /></>)}
        </button>
      </form>

      <button
        onClick={demo}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-2.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Sparkles size={14} /> Fill demo admin credentials
      </button>

      <p className="mt-8 text-center text-sm text-muted">
        New to PulseBoard?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

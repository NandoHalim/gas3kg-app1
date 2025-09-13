import React, { useEffect, useState } from 'react';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function LoginView() {
  const { user, signInWithPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // kalau sudah login & masih buka /login → langsung ke dashboard
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      toast?.show?.({ type: 'success', message: 'Login berhasil' });
      navigate('/', { replace: true }); // selalu ke dashboard
    } catch (err) {
      toast?.show?.({ type: 'error', message: err?.message || 'Login gagal' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1 style={{ marginBottom: 12 }}>Halaman Login</h1>
      <Card>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <label>Email</label>
          <Input
            type="email"
            placeholder="you@mail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
          <label>Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <Button type="submit" disabled={loading}>Login</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

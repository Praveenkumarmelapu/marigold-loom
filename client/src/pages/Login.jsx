import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Field from '../components/Field.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      nav((loc.state && loc.state.from) || (u.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (e) {
      setError(e.message); setErrors(e.fields || {});
    } finally { setBusy(false); }
  };

  return (
    <div className="auth container">
      <div className="auth-art" aria-hidden="true"><p>Welcome back.</p><span>Your cart is saved on your account.</span></div>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Log in</h1>
        {error && <p className="notice error" role="alert">{error}</p>}
        <Field label="Email" error={errors.email}><input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password" error={errors.password}><input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <button className="btn btn-block" disabled={busy}>{busy ? 'Signing in...' : 'Log in'}</button>
        <p className="switch">New here? <Link to="/signup" state={loc.state}>Create an account</Link></p>
      </form>
    </div>
  );
}

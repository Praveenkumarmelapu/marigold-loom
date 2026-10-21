import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Field from '../components/Field.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) e.password = 'Use at least one letter and one number';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await signup(form.name, form.email, form.password);
      nav((loc.state && loc.state.from) || '/', { replace: true });
    } catch (e) {
      setError(e.message); setErrors(e.fields || {});
    } finally { setBusy(false); }
  };

  return (
    <div className="auth container">
      <div className="auth-art alt" aria-hidden="true"><p>Make yourself at home.</p><span>An account keeps your cart between visits.</span></div>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        {error && <p className="notice error" role="alert">{error}</p>}
        <Field label="Full name" error={errors.name}><input autoComplete="name" value={form.name} onChange={set('name')} /></Field>
        <Field label="Email" error={errors.email}><input type="email" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters with a letter and a number"><input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <Field label="Confirm password" error={errors.confirm}><input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></Field>
        <button className="btn btn-block" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
        <p className="switch">Already registered? <Link to="/login" state={loc.state}>Log in</Link></p>
      </form>
    </div>
  );
}

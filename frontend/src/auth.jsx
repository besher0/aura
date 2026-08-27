import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from './api';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.register({ name, email, password });
      localStorage.setItem('aura_token', result.token);
      nav('/');
    } catch (x) {
      setError(x.message);
    }
  };

  return (
    <main className="auth">
      <form className="auth-box" onSubmit={submit}>
        <Link className="brand" to="/">
          Aura
        </Link>
        <h1>إنشاء حساب</h1>
        {error && <p className="error">{error}</p>}
        <label className="field">
          الاسم
          <input required minLength="2" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          البريد الإلكتروني
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          كلمة المرور
          <input
            required
            minLength="6"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="primary full">إنشاء الحساب</button>
        <Link className="muted" to="/login">
          لديك حساب؟ تسجيل الدخول
        </Link>
      </form>
    </main>
  );
}

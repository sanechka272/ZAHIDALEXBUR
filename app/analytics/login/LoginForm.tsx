'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/analytics/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      if (!response.ok) throw new Error('login_failed');
      router.replace('/analytics');
      router.refresh();
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={submit} className="analytics-login__form">
      <label><span>Email</span><input name="email" type="email" required autoComplete="username" /></label>
      <label><span>Password</span><input name="password" type="password" required autoComplete="current-password" /></label>
      {status === 'error' ? <p role="alert">Невірний email або пароль.</p> : null}
      <button type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}

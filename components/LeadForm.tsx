'use client';

import { FormEvent, useState } from 'react';
import { contact } from '@/lib/site-data';

function Arrow() {
  return <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function LeadForm() {
  const [startedAtMs] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? '').trim() || undefined,
      phone: String(form.get('phone') ?? '').trim(),
      location: String(form.get('location') ?? '').trim() || undefined,
      service: String(form.get('service') ?? '').trim() || undefined,
      originatingPage: window.location.pathname,
      honeypot: String(form.get('website') ?? ''),
      startedAtMs,
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('lead_submit_failed');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <div className="reference-form-success"><strong>Дякуємо.</strong><span>Заявку отримано. Для швидкого звʼязку зателефонуйте:</span><a href={contact.phoneHref}>{contact.phoneDisplay}</a></div>;
  }

  return (
    <form className="reference-lead-form" onSubmit={submit}>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label><span>Імʼя</span><input name="name" autoComplete="name" /></label>
      <label><span>Телефон</span><input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="+380" /></label>
      <label><span>Населений пункт</span><input name="location" autoComplete="address-level2" /></label>
      {status === 'error' ? <p role="alert">Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте нам.</p> : null}
      <button type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Надсилаємо…' : 'Підготувати заявку'} <Arrow /></button>
    </form>
  );
}

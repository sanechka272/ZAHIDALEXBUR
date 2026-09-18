'use client';

import { FormEvent, useState } from 'react';
import { contact } from '@/lib/site-data';
import { isValidUaPhone, normalizeUaPhoneInput, UA_PHONE_PREFIX } from '@/lib/phone';

function Arrow() {
  return <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function LeadForm() {
  const [startedAtMs] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [phone, setPhone] = useState(UA_PHONE_PREFIX);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    if (!isValidUaPhone(phone)) {
      setPhoneError('Введіть коректний номер у форматі +380XXXXXXXXX.');
      return;
    }

    setPhoneError(null);
    setStatus('submitting');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? '').trim() || undefined,
      phone,
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
      const result = await response.json() as { id?: string };
      window.dispatchEvent(new CustomEvent('zab:lead_submit', {
        detail: { leadId: result.id ?? null, pagePath: payload.originatingPage },
      }));
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <div className="reference-form-success"><strong>Дякуємо.</strong><span>Заявку отримано. Для швидкого звʼязку зателефонуйте:</span><a href={contact.phoneHref}>{contact.phoneDisplay}</a></div>;
  }

  return (
    <form className="reference-lead-form" onSubmit={submit} noValidate>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label><span>Імʼя</span><input name="name" autoComplete="name" /></label>
      <label>
        <span>Телефон</span>
        <input
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          value={phone}
          maxLength={13}
          aria-invalid={phoneError ? true : undefined}
          aria-describedby={phoneError ? 'lead-phone-error' : undefined}
          onChange={(event) => {
            const nextPhone = normalizeUaPhoneInput(event.currentTarget.value);
            setPhone(nextPhone);
            if (phoneError && isValidUaPhone(nextPhone)) setPhoneError(null);
          }}
          onBlur={() => {
            if (!isValidUaPhone(phone)) setPhoneError('Введіть коректний номер у форматі +380XXXXXXXXX.');
          }}
          onKeyDown={(event) => {
            const input = event.currentTarget;
            if (event.key === 'Backspace' && (input.selectionStart ?? 0) <= UA_PHONE_PREFIX.length && (input.selectionEnd ?? 0) <= UA_PHONE_PREFIX.length) {
              event.preventDefault();
            }
          }}
        />
        {phoneError ? <small id="lead-phone-error" className="reference-field-error" role="alert">{phoneError}</small> : null}
      </label>
      <label><span>Населений пункт</span><input name="location" autoComplete="address-level2" /></label>
      {status === 'error' ? <p role="alert">Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте нам.</p> : null}
      <button type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Надсилаємо…' : 'Підготувати заявку'} <Arrow /></button>
    </form>
  );
}

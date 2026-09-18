'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LeadForm } from '@/components/LeadForm';

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13m-4-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="18" cy="19" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m8 11 7.8-4.7M8 13l7.8 4.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ArticleShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Native share dialogs can be dismissed by the user; no error UI is needed.
    }
  }

  return (
    <button className="article-share" type="button" onClick={share} aria-label="Поділитися статтею">
      <ShareIcon />
      <span>{copied ? 'Посилання скопійовано' : 'Поділитися'}</span>
    </button>
  );
}

export function ArticleLeadButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('no-scroll');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const modal = (
    <div className={`reference-lead-modal article-lead-modal ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="reference-lead-modal__backdrop" aria-label="Закрити форму" onClick={() => setOpen(false)} />
      <div className="reference-lead-modal__card" role="dialog" aria-modal="true" aria-label="Консультація щодо свердловини">
        <button className="reference-lead-modal__close" type="button" aria-label="Закрити" onClick={() => setOpen(false)}><CloseIcon /></button>
        <span className="eyebrow-label">КОНСУЛЬТАЦІЯ</span>
        <h2>Розкажіть,<br />де потрібна вода</h2>
        <p>Передайте телефон і населений пункт — уточнимо задачу та підкажемо наступний крок.</p>
        <LeadForm />
      </div>
    </div>
  );

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <span>{children}</span>
        <ArrowIcon />
      </button>
      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}

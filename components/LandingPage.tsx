'use client';

import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { contact, services } from '@/lib/site-data';

const conceptNav = [
  { label: 'Послуги', href: '#services' },
  { label: 'Про нас', href: '#approach' },
  { label: 'Процес', href: '#process' },
  { label: 'Роботи', href: '#works' },
  { label: 'Контакти', href: '#contact' },
];

const generatedPackageImages = [
  '/generated/package-private.webp',
  '/generated/package-filter.webp',
  '/generated/package-industrial.webp',
];

const proofItems = [
  { value: 'Львів + область', label: 'географія робіт' },
  { value: '3 типи', label: 'свердловин' },
  { value: 'Матеріали', label: 'включені у діапазон ціни' },
  { value: 'Сервіс', label: 'після завершення буріння' },
];

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function LeadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    onSuccess?.();
  }

  if (submitted) {
    return (
      <div className="form-success" role="status">
        <span>Заявку зафіксовано</span>
        <strong>Дякуємо. Для миттєвого зв’язку зателефонуйте нам.</strong>
        <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={submit}>
      <label><span>Ім’я</span><input name="name" autoComplete="name" placeholder="Олександр" /></label>
      <label><span>Телефон</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="+380 99 000 00 00" /></label>
      <label><span>Населений пункт</span><input name="location" autoComplete="address-level2" placeholder="Сокільники" /></label>
      <button className="cta cta--dark cta--wide" type="submit"><span>Отримати розрахунок</span><Arrow /></button>
      <small>Без зобов’язань. Контактні дані потрібні лише для зворотного зв’язку.</small>
    </form>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    root.classList.add('motion-ready');

    const revealImmediately = () => nodes.forEach((node) => node.classList.add('is-visible'));
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealImmediately();
      return () => root.classList.remove('motion-ready');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px 18% 0px' });

    const earlyRevealBoundary = window.innerHeight * 1.16;
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.top < earlyRevealBoundary && rect.bottom > -80) node.classList.add('is-visible');
      else observer.observe(node);
    });

    return () => { observer.disconnect(); root.classList.remove('motion-ready'); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastScrolled = false;

    const renderScrollState = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const nextScrolled = scrollY > 42;
      if (nextScrolled !== lastScrolled) { lastScrolled = nextScrolled; setScrolled(nextScrolled); }
      const maxParallax = reducedMotion.matches ? 0 : window.innerWidth <= 620 ? 0 : window.innerWidth <= 880 ? 10 : 24;
      const heroParallax = Math.min(maxParallax, (Math.min(scrollY, 520) / 520) * maxParallax);
      root.style.setProperty('--hero-parallax', `${heroParallax.toFixed(2)}px`);
    };

    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(renderScrollState); };
    renderScrollState();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reducedMotion.addEventListener?.('change', schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reducedMotion.removeEventListener?.('change', schedule);
      root.style.removeProperty('--hero-parallax');
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', mobileOpen || leadOpen);
    return () => document.body.classList.remove('no-scroll');
  }, [mobileOpen, leadOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); setLeadOpen(false); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <main id="top">
      <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
        <div className="shell header-inner">
          <a className="brand-lockup brand-lockup--image" href="#top" aria-label="ZAHIDALEXBUR — головна">
            <img className="brand-logo" src="/brand/zahidalexbur-logo.webp" alt="ZAHIDALEXBUR — буріння свердловин" />
          </a>
          <nav className="desktop-nav" aria-label="Головна навігація">
            {conceptNav.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
          <a className="header-phone" href={contact.phoneHref}>{contact.phoneDisplay}</a>
          <button className="menu-button" type="button" aria-label="Відкрити меню" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><MenuIcon /></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero__media" style={{ backgroundImage: 'url(/generated/hero-drilling.webp)' }} aria-hidden="true" />
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__grain" aria-hidden="true" />
        <div className="shell hero__layout">
          <div className="hero__copy">
            <span className="hero-kicker hero-enter hero-enter--1">Надійне водопостачання починається тут</span>
            <h1 className="hero-title" aria-label="Буріння свердловин">
              <span className="hero-line hero-line--1"><span>Буріння</span></span>
              <span className="hero-line hero-line--2"><span>свердловин</span></span>
            </h1>
            <strong className="hero-location hero-enter hero-enter--3">Львів та Львівська область</strong>
            <p className="hero-lead hero-enter hero-enter--4">Проєктуємо та буримо свердловини для приватних будинків, бізнесу та промислових об’єктів.</p>
            <div className="hero-actions hero-enter hero-enter--5">
              <button className="cta cta--bronze" type="button" onClick={() => setLeadOpen(true)}><span>Розрахувати вартість</span><Arrow /></button>
              <div className="hero-types" aria-label="Типи свердловин"><span>Безфільтрові</span><i /><span>Фільтрові</span><i /><span>Промислові</span></div>
            </div>
          </div>
          <div className="hero-vertical hero-decor-enter" aria-hidden="true">WATER BECOMES THE SOURCE</div>
          <div className="hero-index hero-enter hero-enter--6"><strong>01</strong><span /><p>Більше<br />ніж просто<br />буріння</p></div>
        </div>
      </section>

      <section className="approach-section" id="approach">
        <div className="approach-copy reveal reveal--from-left">
          <div className="approach-copy__inner">
            <span className="section-label">Наш підхід</span>
            <h2>Вода починається<br />не з буріння.</h2>
            <p>Спочатку ми оцінюємо ділянку, умови, необхідну продуктивність та конструкцію свердловини. І тільки після цього починається робота техніки.</p>
            <div className="approach-note"><span /><strong>Геологія. Розрахунки. Досвід.<br />Реальний результат.</strong></div>
          </div>
        </div>
        <div className="approach-image reveal reveal--clip-right" id="works">
          <img src="/generated/approach-geology.webp" alt="Геологічні шари ґрунту перед бурінням свердловини" />
          <div className="approach-image__caption"><span>Львівська область</span><i /><strong>Ми знаємо,<br />що знаходиться<br />під вашою ділянкою</strong></div>
        </div>
      </section>

      <section className="well-packages" id="services">
        <div className="shell">
          <div className="well-packages__heading reveal reveal--from-left">
            <div><span className="section-label">Типи свердловин</span><h2>3 рішення<br />під вашу задачу</h2></div>
            <p>Ціна залежить від геології конкретної ділянки, конструкції свердловини та розташування об’єкта. У вказані діапазони входять матеріали.</p>
          </div>

          <div className="well-package-grid">
            {services.map((service, index) => (
              <article className="well-package-card reveal" key={service.id} style={{ '--delay': `${index * 110}ms` } as CSSProperties}>
                <div className="well-package-card__media">
                  <img src={generatedPackageImages[index]} alt={service.title} loading="lazy" />
                  <span className="well-package-card__index">0{index + 1}</span>
                </div>
                <div className="well-package-card__body">
                  <div className="well-package-card__title-row"><h3>{service.title}</h3><span>ZAB / 0{index + 1}</span></div>
                  <p>{service.description}</p>
                  <strong className="well-package-card__price">{service.price}</strong>
                  <span className="well-package-card__price-note">Матеріали включені у діапазон ціни</span>
                  <div className="well-package-card__line" aria-hidden="true" />
                  <ul className="well-package-card__list">
                    {service.included.map((item, itemIndex) => (
                      <li key={item} style={{ '--item-delay': `${itemIndex * 38}ms` } as CSSProperties}><span aria-hidden="true">✓</span>{item}</li>
                    ))}
                  </ul>
                  <button className="well-package-card__action" type="button" onClick={() => setLeadOpen(true)}><span>Уточнити розрахунок</span><Arrow /></button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="proof-band" id="process">
        <div className="shell proof-band__inner">
          <div className="proof-brand reveal reveal--proof"><span>ZAHIDALEXBUR</span><strong>у фактах</strong></div>
          {proofItems.map((item, index) => <div className="proof-stat reveal reveal--proof" key={item.value} style={{ '--delay': `${index * 70}ms` } as CSSProperties}><strong>{item.value}</strong><span>{item.label}</span></div>)}
          <div className="proof-end reveal reveal--proof" style={{ '--delay': '300ms' } as CSSProperties}>Стабільна вода<br />для життя<br />і розвитку</div>
        </div>
      </section>

      <section className="conversion-split" id="contact">
        <div className="conversion-photo reveal reveal--clip-left">
          <img src="/generated/water-hands.webp" alt="Чиста вода зі свердловини ZAHIDALEXBUR" />
          <div className="conversion-photo__caption"><strong>Чиста вода.<br />Реальні можливості.<br />Впевнене завтра.</strong><span /></div>
        </div>
        <div className="conversion-copy reveal reveal--from-right">
          <div className="conversion-copy__inner">
            <span className="section-label">Готові обговорити ваш проєкт?</span>
            <h2>Розрахуємо<br />вашу свердловину<br />за 1 день</h2>
            <p>Залиште заявку — підготуємо попередній розрахунок під вашу ділянку та задачу.</p>
            <div className="conversion-actions"><button className="cta cta--dark" type="button" onClick={() => setLeadOpen(true)}><span>Отримати розрахунок</span><Arrow /></button><small>Без зобов’язань.<br />Консультація безкоштовна.</small></div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <a className="footer-brand footer-brand--logo" href="#top"><img src="/brand/zahidalexbur-logo.webp" alt="ZAHIDALEXBUR" /></a>
          <nav className="footer-nav" aria-label="Навігація у футері">{conceptNav.filter((item) => item.href !== '#process').map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
          <div className="footer-contacts"><a href={contact.phoneHref}>{contact.phoneDisplay}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></div>
        </div>
      </footer>

      <div className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <button className="drawer-backdrop" type="button" aria-label="Закрити меню" onClick={() => setMobileOpen(false)} />
        <div className="drawer-panel">
          <div className="drawer-head"><div className="drawer-logo-wrap"><img className="drawer-logo" src="/brand/zahidalexbur-logo.webp" alt="ZAHIDALEXBUR" /></div><button type="button" aria-label="Закрити меню" onClick={() => setMobileOpen(false)}><CloseIcon /></button></div>
          <nav>{conceptNav.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</a>)}</nav>
          <a className="drawer-phone" href={contact.phoneHref}>{contact.phoneDisplay}</a>
        </div>
      </div>

      <div className={`lead-modal ${leadOpen ? 'is-open' : ''}`} aria-hidden={!leadOpen}>
        <button className="modal-backdrop" type="button" aria-label="Закрити форму" onClick={() => setLeadOpen(false)} />
        <div className="modal-card" role="dialog" aria-modal="true" aria-label="Розрахунок свердловини">
          <button className="modal-close" type="button" aria-label="Закрити" onClick={() => setLeadOpen(false)}><CloseIcon /></button>
          <span className="section-label">Попередній розрахунок</span><h2>Розкажіть,<br />де потрібна вода</h2><p>Залиште контакт — уточнимо локацію, потребу у воді та запропонуємо наступний крок.</p><LeadForm />
        </div>
      </div>

      <button className="mobile-sticky-cta" type="button" onClick={() => setLeadOpen(true)}>Розрахувати вартість <Arrow /></button>
    </main>
  );
}

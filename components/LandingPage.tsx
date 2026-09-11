'use client';

import { FormEvent, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { blogArticles } from '@/lib/blog-data';
import { assets, contact, processSteps, services } from '@/lib/site-data';

const navItems = [
  { label: 'Головна', href: '#top' },
  { label: 'Послуги', href: '#services' },
  { label: 'Про нас', href: '#about' },
  { label: 'Процес', href: '#process' },
  { label: 'Блог', href: '#blog' },
  { label: 'Відгуки', href: '#about' },
  { label: 'Контакти', href: '#contact' },
];

const heroStats = [
  { value: '10+', label: 'років досвіду' },
  { value: '500+', label: 'реалізованих проєктів' },
  { value: '98%', label: 'задоволених клієнтів' },
];

const heroProcess = [
  ['01', 'ПРОЕКТУВАННЯ'],
  ['02', 'БУРІННЯ'],
  ['03', 'ОБЛАШТУВАННЯ'],
  ['04', 'СЕРВІС'],
];

const serviceTags = ['ДЛЯ ПРИВАТНИХ БУДИНКІВ', 'ДЛЯ БУДИНКІВ ТА КОТЕДЖІВ', 'ДЛЯ БІЗНЕСУ ТА ВЕЛИКИХ ОБʼЄКТІВ'];

function Arrow({ direction = 'right' }: { direction?: 'left' | 'right' | 'down' }) {
  const path = direction === 'left' ? 'M19 12H6M10 7l-5 5 5 5' : direction === 'down' ? 'M12 5v13M7 14l5 5 5-5' : 'M5 12h13M14 7l5 5-5 5';
  return (
    <svg className="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 7 8 5-8 5V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 8h14M5 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.3 4.5 5.6 6.1c-.6.6-.7 1.5-.3 2.3 2.1 4.2 5.4 7.5 9.6 9.6.8.4 1.7.3 2.3-.3l1.7-1.7-3.2-3.2-1.6 1.1c-.5.3-1.1.3-1.6 0a11.3 11.3 0 0 1-4.2-4.2c-.3-.5-.3-1.1 0-1.6l1.1-1.6-2.1-2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}

function EyebrowLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <span className={`eyebrow-label ${light ? 'eyebrow-label--light' : ''}`}>{children}</span>;
}

function PillButton({ children, variant = 'cream', onClick, className = '' }: { children: ReactNode; variant?: 'cream' | 'brown' | 'outline' | 'dark'; onClick?: () => void; className?: string }) {
  return <button type="button" onClick={onClick} className={`pill-button pill-button--${variant} ${className}`}><span>{children}</span><Arrow /></button>;
}

function StatBlock({ value, caption, dark = false }: { value: string; caption: string; dark?: boolean }) {
  return <div className={`stat-block ${dark ? 'stat-block--dark' : ''}`}><strong>{value}</strong><span>{caption}</span></div>;
}

function GlassInfoCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Вода ближче, ніж ви думаєте" className="glass-info-card hero-enter hero-enter--5" onClick={onClick}>
      <span className="glass-info-card__thumb"><img src={assets.services[2]} alt="Буріння свердловини у Львівській області" /></span>
      <span className="glass-info-card__copy">Вода ближче,<br />ніж ви думаєте</span>
      <span className="glass-info-card__arrow"><Arrow /></span>
    </button>
  );
}

function BlogCard({ article, index }: { article: (typeof blogArticles)[number]; index: number }) {
  return (
    <a className="blog-reference-card reveal" style={{ '--delay': `${index * 70}ms` } as CSSProperties} href={`/blog/${article.slug}`} aria-label={article.title}>
      <div className="blog-reference-card__media">
        <img src={article.image} alt={article.title} loading="lazy" />
        <span>0{index + 1}</span>
      </div>
      <div className="blog-reference-card__body">
        <div className="blog-reference-card__meta"><span>{article.tag}</span><small>{article.readTime}</small></div>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <span className="blog-reference-card__link">Читати матеріал <Arrow /></span>
      </div>
    </a>
  );
}

function ServiceCard({ service, index, onOpen }: { service: (typeof services)[number]; index: number; onOpen: () => void }) {
  const thumbs = [assets.services[index], assets.hero, assets.services[(index + 2) % assets.services.length]];
  return (
    <article id={`service-card-${index}`} className="service-reference-card reveal" style={{ '--delay': `${index * 100}ms` } as CSSProperties}>
      <div className="service-reference-card__photo">
        <img src={service.image} alt={service.title} loading={index === 0 ? 'eager' : 'lazy'} />
        <span className="service-reference-card__number">0{index + 1}</span>
      </div>
      <div className="service-reference-card__body">
        <span className="service-reference-card__tag">{serviceTags[index]}</span>
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <ul>
          {service.included.map((item, itemIndex) => <li key={item} style={{ '--item-delay': `${itemIndex * 42}ms` } as CSSProperties}><span>✓</span>{item}</li>).slice(0, 5)}
        </ul>
        <div className="service-reference-card__price"><strong>{service.shortPrice.replace('грн', '₴')}</strong><button type="button" aria-label={`Розрахувати ${service.title}`} onClick={onOpen}><Arrow /></button></div>
        <div className="service-project-thumbs">
          <div>{thumbs.map((thumb, thumbIndex) => <span key={`${thumb}-${thumbIndex}`}><img src={thumb} alt="" loading="lazy" /></span>)}</div>
          <button type="button" onClick={onOpen}>Переглянути<br />реалізовані проєкти</button>
        </div>
      </div>
    </article>
  );
}

function ProcessIcon({ index }: { index: number }) {
  const icons = [
    <path key="1" d="M5 7h14v9H9l-4 3V7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
    <path key="2" d="m6 17 2.2-5.8L16 3.5l4.5 4.5-7.7 7.8L6 17Zm7.5-11 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
    <path key="3" d="M12 3v18M8 6h8M9 10h6M10 14h4M7 19h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />,
    <path key="4" d="M5 16 16 5m-7 2 8 8M4 19l3-3m10-8 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />,
    <path key="5" d="m4 11 8-7 8 7v9H7v-6h10v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
  ];
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{icons[index]}</svg>;
}

function ProcessStep({ step, index }: { step: (typeof processSteps)[number]; index: number }) {
  return (
    <div className="process-reference-step reveal" style={{ '--delay': `${index * 80}ms` } as CSSProperties}>
      <div className="process-reference-step__top"><span className="process-reference-step__icon"><ProcessIcon index={index} /></span>{index < processSteps.length - 1 && <span className="process-reference-step__connector"><Arrow /></span>}</div>
      <span className="process-reference-step__number">0{index + 1}</span>
      <strong>{step.title}</strong>
      <p>{step.text}</p>
    </div>
  );
}

function MobileProcessFlip({ activeProcess, flipping }: { activeProcess: number; flipping: boolean }) {
  const step = processSteps[activeProcess];
  return (
    <div className="mobile-process-flip" aria-live="polite">
      <span className="mobile-process-flip__label">ЕТАПИ БУРІННЯ</span>
      <div className={`mobile-process-flip__stage ${flipping ? 'is-flipping' : ''}`} key={step.id}>
        <div className="mobile-process-flip__top">
          <span className="mobile-process-flip__icon"><ProcessIcon index={activeProcess} /></span>
          <span className="mobile-process-flip__number">0{activeProcess + 1}</span>
        </div>
        <strong>{step.title}</strong>
        <p>{step.text}</p>
      </div>
      <div className="mobile-process-flip__progress" aria-hidden="true">
        {processSteps.map((item, index) => <span key={item.id} className={index === activeProcess ? 'is-active' : ''} />)}
      </div>
    </div>
  );
}

function TestimonialQuote() {
  return (
    <div className="testimonial-quote reveal reveal--from-right">
      <blockquote>«Ми будуємо не лише свердловини, а й довіру. Саме тому до нас повертаються.»</blockquote>
      <div className="testimonial-quote__person"><button type="button" aria-label="Перейти до процесу" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}><PlayIcon /></button><p><strong>— Олександр Герман</strong><span>Засновник компанії</span></p></div>
    </div>
  );
}

function LeadForm() {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }
  if (sent) return <div className="reference-form-success"><strong>Дякуємо.</strong><span>Заявку підготовлено. Для швидкого звʼязку зателефонуйте:</span><a href={contact.phoneHref}>{contact.phoneDisplay}</a></div>;
  return <form className="reference-lead-form" onSubmit={submit}><label><span>Імʼя</span><input name="name" autoComplete="name" /></label><label><span>Телефон</span><input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="+380" /></label><label><span>Населений пункт</span><input name="location" autoComplete="address-level2" /></label><button type="submit">Підготувати заявку <Arrow /></button></form>;
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeProcess, setActiveProcess] = useState(0);
  const [processInView, setProcessInView] = useState(false);
  const [processFlipping, setProcessFlipping] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    root.classList.add('motion-ready');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return () => root.classList.remove('motion-ready');
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 18% 0px' });
    const boundary = window.innerHeight * 1.15;
    nodes.forEach((node) => node.getBoundingClientRect().top < boundary ? node.classList.add('is-visible') : observer.observe(node));
    return () => { observer.disconnect(); root.classList.remove('motion-ready'); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastScrolled = false;
    const render = () => {
      frame = 0;
      const y = window.scrollY;
      const nextScrolled = y > 32;
      if (nextScrolled !== lastScrolled) { lastScrolled = nextScrolled; setScrolled(nextScrolled); }
      const max = reducedMotion.matches ? 0 : window.innerWidth < 768 ? 0 : window.innerWidth < 1100 ? 10 : 22;
      root.style.setProperty('--hero-parallax', `${Math.min(max, Math.min(y, 520) / 520 * max).toFixed(2)}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
    render();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); root.style.removeProperty('--hero-parallax'); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', mobileOpen || leadOpen);
    const esc = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMobileOpen(false); setLeadOpen(false); } };
    window.addEventListener('keydown', esc);
    return () => { document.body.classList.remove('no-scroll'); window.removeEventListener('keydown', esc); };
  }, [mobileOpen, leadOpen]);

  useEffect(() => {
    const section = document.getElementById('process');
    if (!section || !('IntersectionObserver' in window)) return;
    const mobile = window.matchMedia('(max-width: 767px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(([entry]) => {
      setProcessInView(mobile.matches && !reducedMotion.matches && entry.isIntersecting);
    }, { threshold: 0.3 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!processInView) return;
    let swapTimeout = 0;
    const interval = window.setInterval(() => {
      setProcessFlipping(true);
      swapTimeout = window.setTimeout(() => {
        setActiveProcess((current) => (current + 1) % processSteps.length);
        requestAnimationFrame(() => setProcessFlipping(false));
      }, 150);
    }, 1800);
    return () => { window.clearInterval(interval); window.clearTimeout(swapTimeout); setProcessFlipping(false); };
  }, [processInView]);

  return (
    <main id="top" className="reference-page">
      <header className={`site-header reference-header ${scrolled ? 'site-header--scrolled' : ''}`}>
        <div className="reference-shell reference-header__inner">
          <a className="brand-lockup brand-lockup--image" href="#top" aria-label="ZAHIDALEXBUR — головна"><img className="brand-logo" src={assets.logo} alt="ZAHIDALEXBUR — буріння свердловин" /></a>
          <nav className="desktop-nav" aria-label="Головна навігація">{navItems.map((item) => <a key={`${item.label}-${item.href}`} href={item.href}>{item.label}</a>)}</nav>
          <div className="reference-header__right">
            <a className="header-phone" href={contact.phoneHref}><PhoneIcon /><span><strong>{contact.phoneDisplay}</strong><small>Пн–Сб 8:00–20:00</small></span></a>
            <PillButton variant="brown" className="header-callback" onClick={() => setLeadOpen(true)}>Замовити дзвінок</PillButton>
            <button className="menu-button" type="button" aria-label="Відкрити меню" onClick={() => setMobileOpen(true)}><MenuIcon /></button>
          </div>
        </div>
      </header>

      <section className="hero reference-hero">
        <div className="reference-hero__media" style={{ backgroundImage: `url(${assets.hero})` }} aria-hidden="true" />
        <div className="reference-hero__overlay" aria-hidden="true" />
        <div className="reference-shell reference-hero__layout">
          <div className="reference-hero__copy">
            <EyebrowLabel light>НАДІЙНЕ ВОДОПОСТАЧАННЯ<br />ДЛЯ ВАШОГО ЖИТТЯ</EyebrowLabel>
            <h1 className="reference-hero__title"><span className="hero-line"><span>БУРІННЯ</span></span><span className="hero-line hero-line--2"><span>СВЕРДЛОВИН</span></span></h1>
            <strong className="reference-hero__location">Львів та Львівська область</strong>
            <p className="reference-hero__lead">Чиста вода. Стабільний результат.<br />Працюємо для приватних будинків, бізнесу та промислових обʼєктів.</p>
            <div className="reference-hero__actions"><PillButton variant="cream" onClick={() => setLeadOpen(true)}>Розрахувати вартість</PillButton><button className="video-action" type="button" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}><span><PlayIcon /></span><strong>Дивитися відео<small>(1:24)</small></strong></button></div>
            <div className="hero-stat-row">{heroStats.map((stat) => <StatBlock key={stat.value} value={stat.value} caption={stat.label} />)}</div>
          </div>

          <div className="hero-process-teaser">{heroProcess.map(([number, title], index) => <button type="button" className={index === 1 ? 'is-active' : ''} key={number} onClick={() => index === 1 ? document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) : document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}><span>{number}</span><strong>{title}</strong></button>)}</div>
          <GlassInfoCard onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} />
          <div className="reference-hero__caption"><span>Стабільна вода —</span><strong>стабільне майбутнє.</strong></div>
          <button className="reference-hero__scroll" type="button" aria-label="Прокрутити до послуг" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}><Arrow direction="down" /></button>
        </div>
      </section>

      <section className="services-reference" id="services">
        <div className="reference-shell">
          <div className="services-reference__header reveal">
            <div><EyebrowLabel>НАШІ ПОСЛУГИ</EyebrowLabel><h2 className="services-reference__title">Оберіть свій тип свердловини</h2></div>
          </div>
          <div className="services-reference__grid">{services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} onOpen={() => setLeadOpen(true)} />)}</div>
        </div>
      </section>

      <section className="about-reference" id="about">
        <div className="about-reference__copy reveal reveal--from-left">
          <div><EyebrowLabel light>ПРО НАС</EyebrowLabel><h2>Локальна компанія<br />з реальним досвідом</h2><p>ZAHIDALEXBUR — це команда фахівців, яка знає геологію регіону, працює з сучасною технікою та забезпечує результат. Ми не просто буримо — ми даємо людям доступ до якісної води.</p><PillButton variant="brown" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}>Дізнатися більше</PillButton><div className="about-reference__script"><span>Люди</span><span>Регіон</span><span>Результат</span></div></div>
        </div>
        <div className="about-reference__media" style={{ backgroundImage: `linear-gradient(90deg, rgba(20,18,15,.74), rgba(20,18,15,.18)), url(${assets.about})` }}>
          <div className="about-reference__stats reveal">{heroStats.map((stat) => <StatBlock key={stat.value} value={stat.value} caption={stat.label === 'років досвіду' ? 'років досвіду у регіоні' : stat.label} dark />)}</div>
          <TestimonialQuote />
        </div>
      </section>

      <section className="process-reference" id="process">
        <div className="reference-shell process-reference__layout">
          <div className="process-reference__intro reveal reveal--from-left"><EyebrowLabel>ЯК МИ ПРАЦЮЄМО</EyebrowLabel><h2>Від першої консультації<br />до чистої води</h2><p>Прозорий процес, чіткі етапи, зрозумілий результат.</p></div>
          <div className="process-reference__content">
            <div className="process-reference__cta"><PillButton variant="brown" onClick={() => setLeadOpen(true)}>Залишити заявку</PillButton></div>
            <div className="process-reference__steps">{processSteps.map((step, index) => <ProcessStep key={step.id} step={step} index={index} />)}</div>
            <MobileProcessFlip activeProcess={activeProcess} flipping={processFlipping} />
          </div>
        </div>
      </section>

      <section className="blog-reference" id="blog">
        <div className="reference-shell">
          <div className="blog-reference__header reveal">
            <div><EyebrowLabel>БЛОГ</EyebrowLabel><h2>Корисно знати до того,<br />як почнеться буріння</h2></div>
            <a className="blog-reference__all" href="/blog">Усі матеріали <Arrow /></a>
          </div>
          <div className="blog-reference__grid">{blogArticles.map((article, index) => <BlogCard key={article.slug} article={article} index={index} />)}</div>
        </div>
      </section>

      <section className="contact-reference" id="contact">
        <div className="reference-shell contact-reference__layout">
          <div className="contact-reference__copy reveal reveal--from-left">
            <EyebrowLabel light>КОНТАКТИ</EyebrowLabel>
            <h2>Поговорімо про<br />вашу ділянку</h2>
            <p>Опишіть задачу або просто зателефонуйте. Уточнимо локацію, тип обʼєкта та підкажемо, з чого почати.</p>
            <div className="contact-reference__details">
              <a href={contact.phoneHref}><span>ТЕЛЕФОН</span><strong>{contact.phoneDisplay}</strong></a>
              <a href={`mailto:${contact.email}`}><span>EMAIL</span><strong>{contact.email}</strong></a>
              <div><span>АДРЕСА</span><strong>{contact.address}</strong></div>
              <div><span>ГРАФІК</span><strong>Пн–Сб 8:00–20:00</strong></div>
            </div>
          </div>
          <div className="contact-reference__form reveal reveal--from-right">
            <EyebrowLabel>ШВИДКИЙ СТАРТ</EyebrowLabel>
            <h3>Отримати попередній розрахунок</h3>
            <p>Залиште телефон і населений пункт — дані вже підготовлені для швидкого контакту з командою.</p>
            <LeadForm />
          </div>
        </div>
      </section>

      <footer className="reference-footer"><div className="reference-shell reference-footer__inner"><a href="#top" className="reference-footer__brand"><img src={assets.logo} alt="ZAHIDALEXBUR" /></a><nav>{navItems.filter((item) => item.href.startsWith('#')).map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}</nav><div><a href={contact.phoneHref}>{contact.phoneDisplay}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></div></div></footer>

      <div className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}><button className="drawer-backdrop" type="button" aria-label="Закрити меню" onClick={() => setMobileOpen(false)} /><div className="drawer-panel"><div className="drawer-head"><img src={assets.logo} alt="ZAHIDALEXBUR" /><button type="button" aria-label="Закрити меню" onClick={() => setMobileOpen(false)}><CloseIcon /></button></div><nav>{navItems.map((item) => <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</a>)}</nav><a className="drawer-phone" href={contact.phoneHref}>{contact.phoneDisplay}</a><PillButton variant="brown" onClick={() => { setMobileOpen(false); setLeadOpen(true); }}>Замовити дзвінок</PillButton></div></div>

      <div className={`reference-lead-modal ${leadOpen ? 'is-open' : ''}`} aria-hidden={!leadOpen}><button type="button" className="reference-lead-modal__backdrop" aria-label="Закрити форму" onClick={() => setLeadOpen(false)} /><div className="reference-lead-modal__card" role="dialog" aria-modal="true" aria-label="Розрахунок свердловини"><button className="reference-lead-modal__close" type="button" aria-label="Закрити" onClick={() => setLeadOpen(false)}><CloseIcon /></button><EyebrowLabel>ПОПЕРЕДНІЙ РОЗРАХУНОК</EyebrowLabel><h2>Розкажіть,<br />де потрібна вода</h2><p>Уточнимо локацію, задачу та підберемо наступний крок без зайвих обіцянок.</p><LeadForm /></div></div>

      <button className="reference-mobile-cta" type="button" onClick={() => setLeadOpen(true)}>Розрахувати вартість <Arrow /></button>
    </main>
  );
}

'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { blogArticles } from '@/lib/blog-data';
import { assets, contact, processSteps, services } from '@/lib/site-data';
import { BlogSection } from '@/components/BlogSection';
import { LeadForm } from '@/components/LeadForm';

const navItems = [
  { label: 'Головна', href: '#top' },
  { label: 'Процес', href: '#process' },
  { label: 'Послуги', href: '#services' },
  { label: 'Про нас', href: '#about' },
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

function BlogCard({ article, index }: { article: (typeof blogArticles)[number]; index: number }) {
  return (
    <a className="blog-reference-card reveal" style={{ '--delay': `${index * 70}ms` } as CSSProperties} href={`/blog/${article.slug}`} aria-label={article.title}>
      <div className="blog-reference-card__media" style={{ position: 'relative' }}>
        <Image src={article.image} alt={article.title} fill sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw" quality={90} />
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
        <Image src={service.image} alt={service.title} fill sizes="(max-width: 767px) 100vw, (max-width: 1100px) 78vw, 33vw" quality={90} />
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
          <div>{thumbs.map((thumb, thumbIndex) => <span key={`${thumb}-${thumbIndex}`} style={{ position: 'relative' }}><Image src={thumb} alt="" fill sizes="96px" quality={90} /></span>)}</div>
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

function ProcessMetricIcon({ type }: { type: 'people' | 'house' | 'shield' }) {
  if (type === 'people') {
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5-1.5a2.4 2.4 0 1 0 0-4.8M4 19v-1.4A4.6 4.6 0 0 1 8.6 13h.8a4.6 4.6 0 0 1 4.6 4.6V19m1-6h.8a4.2 4.2 0 0 1 4.2 4.2V19" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" /></svg>;
  }
  if (type === 'house') {
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 11 8-7 8 7v9H4v-9Zm5 9v-6h6v6" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" /></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Zm-3 8.6 2 2 4-4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ProcessStoryStep({ step, index }: { step: (typeof processSteps)[number]; index: number }) {
  return (
    <div className="process-story__step" style={{ '--delay': `${180 + index * 95}ms` } as CSSProperties}>
      <span className="process-story__step-number">{step.id}</span>
      <span className="process-story__step-icon"><ProcessIcon index={index} /></span>
      <div className="process-story__step-copy"><strong>{step.title}</strong><p>{step.text}</p></div>
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

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        <div className="reference-hero__media" aria-hidden="true">
          <Image src={assets.hero} alt="" fill sizes="100vw" quality={90} fetchPriority="high" style={{ objectFit: 'cover', objectPosition: '58% 50%' }} />
        </div>
        <div className="reference-hero__overlay" aria-hidden="true" />
        <div className="reference-shell reference-hero__layout">
          <div className="reference-hero__copy">
            <EyebrowLabel light>НАДІЙНЕ ВОДОПОСТАЧАННЯ<br />ДЛЯ ВАШОГО ЖИТТЯ</EyebrowLabel>
            <h1 className="reference-hero__title"><span className="hero-line"><span>БУРІННЯ</span></span><span className="hero-line hero-line--2"><span>СВЕРДЛОВИН</span></span></h1>
            <strong className="reference-hero__location">Львів та Львівська область</strong>
            <p className="reference-hero__lead">Чиста вода. Стабільний результат.<br />Працюємо для приватних будинків, бізнесу та промислових обʼєктів.</p>
            <div className="reference-hero__actions"><PillButton variant="cream" onClick={() => setLeadOpen(true)}>Розрахувати вартість</PillButton></div>
            <div className="hero-stat-row">{heroStats.map((stat) => <StatBlock key={stat.value} value={stat.value} caption={stat.label} />)}</div>
          </div>

          <div className="hero-process-teaser">{heroProcess.map(([number, title], index) => <button type="button" className={index === 1 ? 'is-active' : ''} key={number} onClick={() => index === 1 ? document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) : document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}><span>{number}</span><strong>{title}</strong></button>)}</div>
          <div className="reference-hero__caption"><span>Стабільна вода —</span><strong>стабільне майбутнє.</strong></div>
          <button className="reference-hero__scroll" type="button" aria-label="Прокрутити до процесу" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}><Arrow direction="down" /></button>
        </div>
      </section>

      <section className="process-story reveal" id="process">
        <div className="process-story__media" style={{ backgroundImage: 'none' }} aria-hidden="true"><Image src={assets.hero} alt="" fill sizes="100vw" quality={90} style={{ objectFit: 'cover', objectPosition: 'center 52%' }} /></div>
        <div className="process-story__veil" aria-hidden="true" />
        <div className="reference-shell process-story__layout">
          <div className="process-story__copy reveal reveal--from-left">
            <div className="process-story__eyebrow">ЯК МИ ПРАЦЮЄМО</div>
            <h2><span>Від першої</span><span>консультації</span><span>до чистої води</span></h2>
            <p className="process-story__lead">Прозорий процес. Надійний результат.</p>
            <PillButton variant="brown" className="process-story__cta" onClick={() => setLeadOpen(true)}>Залишити заявку</PillButton>
            <div className="process-story__stats">
              <div className="process-story__stat"><span className="process-story__stat-icon"><ProcessMetricIcon type="people" /></span><strong>250+</strong><p>задоволених клієнтів</p></div>
              <div className="process-story__stat"><span className="process-story__stat-icon"><ProcessMetricIcon type="house" /></span><strong>5+</strong><p>років досвіду</p></div>
              <div className="process-story__stat"><span className="process-story__stat-icon"><ProcessMetricIcon type="shield" /></span><strong>100%</strong><p>гарантія якості</p></div>
            </div>
          </div>
          <div className="process-story__glass reveal reveal--from-right" aria-label="Етапи роботи">
            {processSteps.map((step, index) => <ProcessStoryStep key={step.id} step={step} index={index} />)}
          </div>
        </div>
      </section>

      <section className="services-reference" id="services">
        <div className="reference-shell">
          <div className="services-reference__header reveal"><div><EyebrowLabel>НАШІ ПОСЛУГИ</EyebrowLabel><h2 className="services-reference__title">Оберіть свій тип свердловини</h2></div></div>
          <div className="services-reference__grid">{services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} onOpen={() => setLeadOpen(true)} />)}</div>
        </div>
      </section>

      <section className="about-reference" id="about">
        <div className="about-reference__copy reveal reveal--from-left"><div><EyebrowLabel light>ПРО НАС</EyebrowLabel><h2>Локальна компанія<br />з реальним досвідом</h2><p>ZAHIDALEXBUR — це команда фахівців, яка знає геологію регіону, працює з сучасною технікою та забезпечує результат. Ми не просто буримо — ми даємо людям доступ до якісної води.</p><PillButton variant="brown" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}>Дізнатися більше</PillButton></div></div>
        <div className="about-reference__media"><Image src={assets.about} alt="" fill sizes="(max-width: 900px) 100vw, 60vw" quality={90} style={{ objectFit: 'cover', objectPosition: 'center 48%' }} /><div className="about-reference__stats reveal">{heroStats.map((stat) => <StatBlock key={stat.value} value={stat.value} caption={stat.label === 'років досвіду' ? 'років досвіду у регіоні' : stat.label} dark />)}</div><TestimonialQuote /></div>
      </section>

      <BlogSection onLeadOpen={() => setLeadOpen(true)} />

      <section className="contact-reference" id="contact">
        <div className="reference-shell contact-reference__layout">
          <div className="contact-reference__copy reveal reveal--from-left"><EyebrowLabel light>КОНТАКТИ</EyebrowLabel><h2>Поговорімо про<br />вашу ділянку</h2><p>Опишіть задачу або просто зателефонуйте. Уточнимо локацію, тип обʼєкта та підкажемо, з чого почати.</p><div className="contact-reference__details"><a href={contact.phoneHref}><span>ТЕЛЕФОН</span><strong>{contact.phoneDisplay}</strong></a><a href={`mailto:${contact.email}`}><span>EMAIL</span><strong>{contact.email}</strong></a><div><span>АДРЕСА</span><strong>{contact.address}</strong></div><div><span>ГРАФІК</span><strong>Пн–Сб 8:00–20:00</strong></div></div></div>
          <div className="contact-reference__form reveal reveal--from-right"><EyebrowLabel>ШВИДКИЙ СТАРТ</EyebrowLabel><h3>Отримати попередній розрахунок</h3><p>Залиште телефон і населений пункт — дані вже підготовлені для швидкого контакту з командою.</p><LeadForm /></div>
        </div>
      </section>

      <footer className="reference-footer"><div className="reference-shell reference-footer__inner"><a href="#top" className="reference-footer__brand"><img src={assets.logo} alt="ZAHIDALEXBUR" /></a><nav>{navItems.filter((item) => item.href.startsWith('#')).map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}</nav><div><a href={contact.phoneHref}>{contact.phoneDisplay}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></div></div></footer>

      <div className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}><button className="drawer-backdrop" type="button" aria-label="Закрити меню" onClick={() => setMobileOpen(false)} /><div className="drawer-panel"><div className="drawer-head"><img src={assets.logo} alt="ZAHIDALEXBUR" /><button type="button" aria-label="Закрити меню" onClick={() => setMobileOpen(false)}><CloseIcon /></button></div><nav>{navItems.map((item) => <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</a>)}</nav><a className="drawer-phone" href={contact.phoneHref}>{contact.phoneDisplay}</a><PillButton variant="brown" onClick={() => { setMobileOpen(false); setLeadOpen(true); }}>Замовити дзвінок</PillButton></div></div>

      <div className={`reference-lead-modal ${leadOpen ? 'is-open' : ''}`} aria-hidden={!leadOpen}><button type="button" className="reference-lead-modal__backdrop" aria-label="Закрити форму" onClick={() => setLeadOpen(false)} /><div className="reference-lead-modal__card" role="dialog" aria-modal="true" aria-label="Розрахунок свердловини"><button className="reference-lead-modal__close" type="button" aria-label="Закрити" onClick={() => setLeadOpen(false)}><CloseIcon /></button><EyebrowLabel>ПОПЕРЕДНІЙ РОЗРАХУНОК</EyebrowLabel><h2>Розкажіть,<br />де потрібна вода</h2><p>Уточнимо локацію, задачу та підберемо наступний крок без зайвих обіцянок.</p><LeadForm /></div></div>

      <button className="reference-mobile-cta" type="button" onClick={() => setLeadOpen(true)}>Розрахувати вартість <Arrow /></button>
    </main>
  );
}

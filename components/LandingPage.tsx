'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { estimateByLocation, popularLocations } from '@/lib/estimate.js';
import {
  assets,
  benefits,
  contact,
  faqs,
  navigation,
  processSteps,
  services,
} from '@/lib/site-data';

function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'down' }) {
  return (
    <svg
      aria-hidden="true"
      className={`icon icon-arrow icon-arrow--${direction}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M5 12h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m14 7 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none">
      <path
        d="M8.4 3.8 6.2 4.9c-.8.4-1.2 1.2-1 2.1 1.2 5.4 5.4 9.6 10.8 10.8.9.2 1.7-.2 2.1-1l1.1-2.2c.3-.7.1-1.5-.5-1.9l-2.4-1.6c-.6-.4-1.3-.3-1.8.2l-1.1 1.1a12.5 12.5 0 0 1-4-4l1.1-1.1c.5-.5.6-1.2.2-1.8L9.1 4.1a1.4 1.4 0 0 0-1.7-.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DrillIcon() {
  return (
    <svg aria-hidden="true" className="service-symbol" viewBox="0 0 48 48" fill="none">
      <path d="M24 5v27M18 13h12M20 32h8l3 8H17l3-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 40v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LeadForm({ compact = false, onSuccess }: { compact?: boolean; onSuccess?: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    onSuccess?.();
  }

  if (submitted) {
    return (
      <div className={`form-success ${compact ? 'form-success--compact' : ''}`} role="status">
        <span className="eyebrow">Заявку зафіксовано</span>
        <strong>Дякуємо. Залишилось підключити відправку заявок до вашої CRM або месенджера.</strong>
        <a href={contact.phoneHref}>Або зателефонуйте зараз: {contact.phoneDisplay}</a>
      </div>
    );
  }

  return (
    <form className={`lead-form ${compact ? 'lead-form--compact' : ''}`} onSubmit={handleSubmit}>
      <label>
        <span>Ваше імʼя</span>
        <input name="name" autoComplete="name" placeholder="Олександр" />
      </label>
      <label>
        <span>Номер телефону</span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="+380 99 000 00 00" />
      </label>
      <label>
        <span>Населений пункт</span>
        <input name="location" autoComplete="address-level2" placeholder="Наприклад, Сокільники" />
      </label>
      <button className="button button--brown lead-form__submit" type="submit">
        <span>{compact ? 'Отримати розрахунок' : 'Отримати консультацію'}</span>
        <ArrowIcon />
      </button>
      <p className="form-note">Надсилаючи форму, ви погоджуєтесь на обробку контактних даних для зворотного звʼязку.</p>
    </form>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeService, setActiveService] = useState<number | null>(null);
  const [location, setLocation] = useState('Сокільники');
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  const estimate = useMemo(() => estimateByLocation(location), [location]);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle('no-scroll', mobileOpen || activeService !== null || leadModalOpen);
    return () => body.classList.remove('no-scroll');
  }, [mobileOpen, activeService, leadModalOpen]);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem('zahidalexbur-lead-seen')) return;
    } catch {
      return;
    }

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      try {
        window.sessionStorage.setItem('zahidalexbur-lead-seen', '1');
      } catch {
        // Session storage can be blocked; the modal still works without persistence.
      }
      setLeadModalOpen(true);
      window.removeEventListener('scroll', onScroll);
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable > 0.58) trigger();
    };

    const timer = window.setTimeout(trigger, 45000);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const activeServiceData = activeService === null ? null : services[activeService];

  return (
    <main>
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#top" aria-label="ZAHIDALEXBUR — на головну">
            <strong>ZAHIDALEXBUR</strong>
            <span>Вода. Глибше можливого</span>
          </a>

          <nav className="desktop-nav" aria-label="Основна навігація">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </nav>

          <div className="header-actions">
            <a className="header-phone" href={contact.phoneHref}>
              <PhoneIcon />
              <span>{contact.phoneDisplay}</span>
            </a>
            <a className="button button--light header-cta" href="#contact">
              <span>Розрахувати вартість</span>
              <ArrowIcon />
            </a>
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-label="Відкрити меню"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero__media" style={{ backgroundImage: `url(${assets.gallery[0]})` }} aria-hidden="true" />
        <div className="hero__overlay" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="eyebrow eyebrow--light">Львів та Львівська область</span>
            <h1>Буріння<br />свердловин</h1>
            <p className="hero__lead">Надійне водопостачання для приватного будинку, бізнесу та промислових обʼєктів.</p>
            <div className="hero__actions">
              <a className="button button--brown button--large" href="#contact">
                <span>Розрахувати вартість</span>
                <ArrowIcon />
              </a>
              <a className="hero__text-link" href="#works">Дивитись реальні роботи <ArrowIcon /></a>
            </div>
          </div>

          <div className="hero__services" aria-label="Типи свердловин">
            {services.map((service) => (
              <button
                key={service.id}
                className="hero-service"
                type="button"
                onClick={() => setActiveService(Number(service.id) - 1)}
              >
                <DrillIcon />
                <span>{service.title}</span>
              </button>
            ))}
          </div>

          <div className="hero__index" aria-hidden="true">
            <strong>01</strong>
            <span>/ 04</span>
            <p>Вода<br />для кращого<br />життя</p>
          </div>
        </div>
      </section>

      <section className="section section--light" id="services">
        <div className="container">
          <div className="section-heading section-heading--split">
            <div>
              <span className="eyebrow">Наші послуги</span>
              <h2>Оберіть тип<br />свердловини</h2>
            </div>
            <div className="section-heading__aside">
              <p>Підбираємо рішення під геологію конкретної ділянки, необхідну продуктивність та бюджет.</p>
              <span className="section-counter">/ 03</span>
            </div>
          </div>

          <div className="service-grid">
            {services.map((service, index) => (
              <article className="service-card" key={service.id}>
                <div className="service-card__image-wrap">
                  <img src={service.image} alt={service.title} className="service-card__image" />
                  <span className="service-card__number">{service.id}</span>
                </div>
                <div className="service-card__body">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="service-card__bottom">
                    <strong>{service.shortPrice}</strong>
                    <button className="round-button" type="button" aria-label={`Детальніше: ${service.title}`} onClick={() => setActiveService(index)}>
                      <ArrowIcon />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="price-note">* Остаточна вартість залежить від геологічних умов, конструкції свердловини та розташування обʼєкта.</p>
        </div>
      </section>

      <section className="section process-section" id="process">
        <div className="container">
          <div className="section-heading section-heading--split section-heading--dark">
            <div>
              <span className="eyebrow eyebrow--light">Як ми працюємо</span>
              <h2>Від заявки<br />до чистої води</h2>
            </div>
            <p>Прозорий процес та чіткі етапи. Ви завжди розумієте, що відбувається на обʼєкті.</p>
          </div>

          <div className="process-grid">
            {processSteps.map((step) => (
              <article className="process-step" key={step.id}>
                <span className="process-step__number">{step.id}</span>
                <div className="process-step__icon"><DrillIcon /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Ключові переваги">
        <div className="container proof-strip__inner">
          <div className="proof-strip__brand">
            <span>ZAHIDALEXBUR</span>
            <strong>у фактах</strong>
          </div>
          <div className="proof-item">
            <strong>Львів + область</strong>
            <span>виїзд на приватні й комерційні обʼєкти</span>
          </div>
          <div className="proof-item">
            <strong>3 типи</strong>
            <span>свердловин під різні геологічні умови</span>
          </div>
          <div className="proof-item">
            <strong>Матеріали</strong>
            <span>включені у вказаний діапазон ціни</span>
          </div>
          <div className="proof-item">
            <strong>Сервіс</strong>
            <span>обслуговування після завершення буріння</span>
          </div>
        </div>
      </section>

      <section className="estimator-section">
        <div className="estimator-section__media" style={{ backgroundImage: `url(${assets.gallery[4]})` }} aria-hidden="true" />
        <div className="estimator-section__shade" aria-hidden="true" />
        <div className="container estimator-section__inner">
          <div className="estimator-copy">
            <span className="eyebrow eyebrow--light">Орієнтовна оцінка</span>
            <h2>Не знаєте, яка глибина<br />потрібна у вашій місцевості?</h2>
            <p>Вкажіть населений пункт — покажемо орієнтир і підкажемо, що потрібно перевірити перед бурінням.</p>

            <div className="estimator-input-wrap">
              <input
                aria-label="Населений пункт"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Наприклад, Сокільники"
              />
              <span className="estimator-search-icon">⌕</span>
            </div>

            <div className="location-chips" aria-label="Популярні населені пункти">
              {popularLocations.map((item) => (
                <button key={item} type="button" className={location.toLocaleLowerCase('uk-UA') === item.toLocaleLowerCase('uk-UA') ? 'is-active' : ''} onClick={() => setLocation(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="estimate-card" aria-live="polite">
            <span>Населений пункт</span>
            <strong>{estimate.label}</strong>
            <small>Орієнтовна глибина</small>
            <b>{estimate.depth}</b>
            <a href="#contact">Уточнити розрахунок <ArrowIcon /></a>
          </div>

          <div className="estimator-caption">Геологія.<br />Досвід.<br />Реальний результат.</div>
        </div>
      </section>

      <section className="benefits-section">
        <div className="container benefits-grid">
          <div className="benefits-label">Чому обирають нас</div>
          {benefits.map((benefit, index) => (
            <article className="benefit" key={benefit.title}>
              <span className="benefit__icon">0{index + 1}</span>
              <div>
                <strong>{benefit.title}</strong>
                <p>{benefit.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--light works-section" id="works">
        <div className="container">
          <div className="section-heading section-heading--split">
            <div>
              <span className="eyebrow">Наші роботи</span>
              <h2>Реальні обʼєкти.<br />Реальний результат.</h2>
            </div>
            <p className="section-heading__paragraph">Фото з чинного сайту ZAHIDALEXBUR — без стокових підмін у блоці робіт.</p>
          </div>

          <div className="gallery-grid">
            {assets.gallery.map((image, index) => (
              <figure className={`gallery-item gallery-item--${index + 1}`} key={image}>
                <img src={image} alt={`Роботи ZAHIDALEXBUR — фото ${index + 1}`} loading="lazy" />
                <figcaption>
                  <span>0{index + 1}</span>
                  <strong>{index % 2 === 0 ? 'Буріння та монтаж' : 'Прокачування та запуск'}</strong>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="container faq-layout">
          <div className="faq-heading">
            <span className="eyebrow">Питання та відповіді</span>
            <h2>Коротко про те,<br />що важливо до буріння</h2>
            <p>Залишили тільки практичні питання, які допомагають прийняти рішення, а не перевантажують головну сторінку.</p>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details key={faq.question} className="faq-item" open={index === 0}>
                <summary>
                  <span>0{index + 1}</span>
                  <strong>{faq.question}</strong>
                  <i><ArrowIcon direction="down" /></i>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-section__media" style={{ backgroundImage: `url(${assets.gallery[3]})` }} aria-hidden="true" />
        <div className="contact-section__shade" aria-hidden="true" />
        <div className="container contact-section__inner">
          <div className="contact-copy">
            <span className="eyebrow eyebrow--light">Готові обговорити ваш проєкт?</span>
            <h2>Отримайте консультацію<br />вже сьогодні</h2>
            <p>Залиште номер та населений пункт. Підберемо оптимальний тип свердловини й зорієнтуємо по вартості для вашої ділянки.</p>
            <div className="contact-direct">
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <span>{contact.address}</span>
            </div>
          </div>
          <div className="contact-form-card">
            <LeadForm />
          </div>
          <div className="contact-manifesto">Чиста вода.<br />Реальні можливості.<br />Впевнене завтра.</div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <a className="brand brand--footer" href="#top">
            <strong>ZAHIDALEXBUR</strong>
            <span>Вода. Глибше можливого</span>
          </a>
          <nav aria-label="Навігація в підвалі">
            {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
          <a className="footer-phone" href={contact.phoneHref}>{contact.phoneDisplay}</a>
        </div>
      </footer>

      <a className="mobile-sticky-cta" href="#contact">
        <span>Розрахувати вартість</span>
        <ArrowIcon />
      </a>

      {mobileOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Мобільне меню">
          <div className="mobile-menu__top">
            <a className="brand brand--dark" href="#top" onClick={() => setMobileOpen(false)}>
              <strong>ZAHIDALEXBUR</strong>
              <span>Вода. Глибше можливого</span>
            </a>
            <button className="icon-button" type="button" aria-label="Закрити меню" onClick={() => setMobileOpen(false)}><CloseIcon /></button>
          </div>
          <nav>
            {navigation.map((item, index) => (
              <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <span>0{index + 1}</span>
                <strong>{item.label}</strong>
              </a>
            ))}
          </nav>
          <div className="mobile-menu__bottom">
            <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            <a className="button button--brown" href="#contact" onClick={() => setMobileOpen(false)}>Розрахувати вартість <ArrowIcon /></a>
          </div>
        </div>
      )}

      {activeServiceData && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveService(null)}>
          <article className="service-modal" role="dialog" aria-modal="true" aria-label={activeServiceData.title} onMouseDown={(event) => event.stopPropagation()}>
            <button className="icon-button service-modal__close" type="button" aria-label="Закрити" onClick={() => setActiveService(null)}><CloseIcon /></button>
            <div className="service-modal__image"><img src={activeServiceData.image} alt={activeServiceData.title} /></div>
            <div className="service-modal__content">
              <span className="eyebrow">Послуга {activeServiceData.id}</span>
              <h2>{activeServiceData.title}</h2>
              <p>{activeServiceData.description}</p>
              <strong className="service-modal__price">{activeServiceData.price}</strong>
              <h3>Що входить</h3>
              <ul>
                {activeServiceData.included.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <a className="button button--brown button--wide" href="#contact" onClick={() => setActiveService(null)}>Отримати розрахунок <ArrowIcon /></a>
            </div>
          </article>
        </div>
      )}

      {leadModalOpen && (
        <div className="modal-backdrop modal-backdrop--lead" role="presentation" onMouseDown={() => setLeadModalOpen(false)}>
          <article className="lead-modal" role="dialog" aria-modal="true" aria-label="Безкоштовний попередній розрахунок" onMouseDown={(event) => event.stopPropagation()}>
            <button className="icon-button lead-modal__close" type="button" aria-label="Закрити" onClick={() => setLeadModalOpen(false)}><CloseIcon /></button>
            <div className="lead-modal__visual" style={{ backgroundImage: `url(${assets.gallery[2]})` }}>
              <span>Попередній розрахунок</span>
            </div>
            <div className="lead-modal__content">
              <span className="eyebrow">Не втрачайте час на здогадки</span>
              <h2>Дізнайтесь орієнтовну вартість для вашої ділянки</h2>
              <p>Залиште телефон і населений пункт. Без довгих анкет та зайвих полів.</p>
              <LeadForm compact onSuccess={() => window.setTimeout(() => setLeadModalOpen(false), 1800)} />
            </div>
          </article>
        </div>
      )}
    </main>
  );
}

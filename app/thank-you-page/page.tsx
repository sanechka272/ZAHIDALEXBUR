import type { Metadata } from 'next';
import Link from 'next/link';
import { assets, contact } from '@/lib/site-data';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Дякуємо за заявку | ZAHIDALEXBUR',
  description: 'Заявку отримано. Команда ZAHIDALEXBUR звʼяжеться з вами найближчим часом.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThankYouPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="ZAHIDALEXBUR — на головну">
          <img src={assets.logo} alt="ZAHIDALEXBUR" />
        </Link>
        <a className={styles.phone} href={contact.phoneHref}>{contact.phoneDisplay}</a>
      </header>

      <section className={styles.content}>
        <div className={styles.badge} aria-hidden="true">✓</div>
        <p className={styles.eyebrow}>ЗАЯВКУ ОТРИМАНО</p>
        <h1>Дякуємо.<br />Ми вже отримали ваші дані.</h1>
        <p className={styles.copy}>
          Команда ZAHIDALEXBUR звʼяжеться з вами найближчим часом, щоб уточнити деталі та зорієнтувати по наступному кроку.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>Повернутися на головну</Link>
          <a href={contact.phoneHref} className={styles.secondary}>Зателефонувати зараз</a>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from 'next';
import { FirstPartyTracker } from '@/components/analytics/FirstPartyTracker';
import { GtmBridge } from '@/components/analytics/GtmBridge';
import { MetaPixel } from '@/components/analytics/MetaPixel';
import './globals.css';
import './fixes.css';
import './final.css';
import './media.css';
import './header.css';
import './content.css';
import './mobile.css';
import './process.css';
import './layout-overrides.css';
import './blog-knowledge.css';
import './blog-seo.css';
import './process-mobile-fix.css';
import './services-editorial.css';
import './services-card-fade.css';
import './blog-index-hero.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://zahidalexbur.com.ua'),
  title: 'Буріння свердловин у Львові та області | ZAHIDALEXBUR',
  description:
    'Буріння свердловин у Львові та Львівській області: безфільтрові, фільтрові та промислові свердловини. Розрахунок вартості та консультація.',
  keywords: [
    'буріння свердловин Львів',
    'буріння скважин Львів',
    'свердловина на воду',
    'ZAHIDALEXBUR',
  ],
  openGraph: {
    title: 'ZAHIDALEXBUR — буріння свердловин',
    description: 'Надійне водопостачання для приватних, комерційних і промислових обʼєктів.',
    locale: 'uk_UA',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <head>
        <link
          rel="preload"
          as="image"
          href="/media/6cf70733-a291-4fd2-ae11-f5d510e1d959.webp"
          type="image/webp"
          media="(max-width: 767px)"
        />
      </head>
      <body>
        {children}
        <FirstPartyTracker />
        <GtmBridge />
        <MetaPixel />
      </body>
    </html>
  );
}

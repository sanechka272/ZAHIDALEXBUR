import type { Metadata } from 'next';
import { FirstPartyTracker } from '@/components/analytics/FirstPartyTracker';
import { GtmBridge } from '@/components/analytics/GtmBridge';
import './globals.css';
import './fixes.css';
import './final.css';
import './media.css';
import './header.css';
import './content.css';
import './mobile.css';
import './process.css';
import './hero-cleanup.css';

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
      <body>
        {children}
        <FirstPartyTracker />
        <GtmBridge />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import CookieConsent from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'Koharu Maps — Zero-Dependency Standalone GIS',
  description: 'Pure Offline & High-Performance Global Cartographic Engine developed by KCS - Koharu Coding Server.',
  metadataBase: new URL('https://map.koharu.live'),
  authors: [{ name: 'KCS - Koharu Coding Server' }],
  creator: 'KCS - Koharu Coding Server',
  publisher: 'KCS - Koharu Coding Server',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Koharu Maps',
    description: 'Zero-Dependency Standalone GIS & Cartographic Engine',
    url: 'https://map.koharu.live',
    siteName: 'Koharu Maps',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body data-theme="light">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://novelys-crm.dentalhitec-6381.chatgpt.site'),
  title: 'NOVELYS — CRM Full Ace',
  description: 'L’espace commercial Full Ace : contacts, contexte et prochaines actions.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'NOVELYS — CRM Full Ace',
    description: 'Les bons contacts. Le bon contexte. La prochaine action.',
    images: [{ url: '/og.png', width: 1672, height: 941, alt: 'NOVELYS — CRM Full Ace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOVELYS — CRM Full Ace',
    description: 'Les bons contacts. Le bon contexte. La prochaine action.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}

import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { GlobalSearch } from '@/components/global-search';
import './globals.css';

// Every page reads the CRM database, so render on each request instead of at build time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'
  ),
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
  return (
    <html lang="fr">
      <body>
        <SidebarProvider>
          <div className="app-shell flex min-h-screen w-full">
            <AppSidebar />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </SidebarProvider>
        <GlobalSearch />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

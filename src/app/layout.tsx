import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ASSETS } from '@/lib/assets';

const TITLE       = 'Squadra Web App · Gerencie, conecte, reconheça';
const DESCRIPTION = 'A Squadra num só lugar. Acompanhe sua jornada, reconheça colegas, gerencie equipes e mantenha tudo em dia — de forma simples e humana.';

export const metadata: Metadata = {
  title:           TITLE,
  description:     DESCRIPTION,
  applicationName: 'Squadra',
  manifest: '/manifest.webmanifest',
  icons: {
    icon:  [{ url: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable:         true,
    title:           'Squadra',
    statusBarStyle:  'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title:       TITLE,
    description: DESCRIPTION,
    type:        'website',
    images: [
      {
        url:    ASSETS.ogImage,
        width:  1200,
        height: 630,
        alt:    TITLE,
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
    description: DESCRIPTION,
    images:      [ASSETS.ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'Squadra App',
  description: 'Gestao de horas e colaboradores Squadra',
  applicationName: 'Horas - Squadra',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/assets/favicon-white.svg', type: 'image/svg+xml' },
      { url: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Horas',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
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

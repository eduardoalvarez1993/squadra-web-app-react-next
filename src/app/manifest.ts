import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Horas - Squadra',
    short_name: 'Horas',
    description: 'Gestao de horas e equipe Squadra',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f7fa',
    theme_color: '#1d4ed8',
    lang: 'pt-BR',
    icons: [
      {
        src: '/assets/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/assets/favicon-white.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}

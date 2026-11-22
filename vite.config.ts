import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Caminhos relativos: o app funciona em qualquer endereço (o repositório se chama Estudo-banestes, com E maiúsculo).
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify('1.1.0') },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Painel PROVA · Banestes',
        short_name: 'PROVA',
        description: 'Estudo adaptativo offline para o concurso Banestes (FCC) — Analista de TI, Desenvolvimento de Sistemas.',
        lang: 'pt-BR',
        theme_color: '#1f4e5f',
        background_color: '#f6f4ef',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html'
      }
    })
  ],
  test: { environment: 'node' }
} as any);

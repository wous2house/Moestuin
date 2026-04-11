import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Controleer of we in Termux draaien (mobiel apparaat)
const isTermux = process.env.PREFIX && process.env.PREFIX.includes('com.termux');

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  const plugins: any[] = [react(), tailwindcss()];
  
  // Voeg de PWA plugin alleen toe als we NIET in Termux zijn, 
  // omdat de zware compressie (Terser) het geheugen van Termux laat crashen.
  if (!isTermux) {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['favicon.svg', 'favicon.png', 'logo-transparent.png', 'logo.png'],
        manifest: {
          name: 'Moestuin JTHV',
          short_name: 'Moestuin',
          description: 'Beheer je moestuin en familie taken',
          theme_color: '#5A8F5A',
          background_color: '#EAF2EA',
          display: 'standalone',
          icons: [
            {
              src: '/logo-transparent.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/logo-transparent.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          sourcemap: false,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        }
      })
    );
  }

  return {
    plugins,
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Voorkom minification crashes op mobiel
      minify: isTermux ? false : 'esbuild',
    },
    server: {
      port: 3004,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

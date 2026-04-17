// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
// import preact from '@astrojs/preact'; // Disabled for now - Phase 3
import pagefind from 'astro-pagefind';

// https://astro.build/config
export default defineConfig({
  site: 'https://vai-calcio.fr',
  output: 'static',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      filter: (page) => !page.includes('/api/'),
      customPages: [],
    }),
    // preact({ compat: true }), // Phase 3 - Live components
    pagefind(),
  ],
  vite: {
    build: {
      rollupOptions: {
        external: [],
      },
    },
  },
});

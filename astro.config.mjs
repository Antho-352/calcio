// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
// import preact from '@astrojs/preact'; // TODO: Fix compatibility issue with Astro 5
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
    // sitemap() disabled - using dynamic SSR sitemap at /sitemap.xml
    // preact({ compat: true }), // TODO: Fix compatibility issue with Astro 5
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

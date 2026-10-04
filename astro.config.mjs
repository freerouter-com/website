import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://free-router.com',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});

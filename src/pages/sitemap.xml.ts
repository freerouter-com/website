import type { APIRoute } from 'astro';
import { getPosts, homePath, sectionPath, type Section } from '../lib/content';

const SECTIONS: Section[] = ['blog', 'news'];

export const GET: APIRoute = async ({ site }) => {
  const paths = [homePath('zh'), homePath('en')];
  for (const section of SECTIONS) {
    for (const lang of ['zh', 'en'] as const) {
      const posts = await getPosts(section, lang);
      paths.push(sectionPath(lang, section), ...posts.map((post) => `${sectionPath(lang, section)}${post.slug}/`));
    }
  }
  const urls = paths.map((path) => `<url><loc>${new URL(path, site).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

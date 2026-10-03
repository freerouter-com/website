import type { APIRoute } from 'astro';
import { blogPath, getPosts, homePath } from '../lib/blog';

export const GET: APIRoute = async ({ site }) => {
  const [zh, en] = await Promise.all([getPosts('zh'), getPosts('en')]);
  const paths = [
    homePath('zh'),
    homePath('en'),
    blogPath('zh'),
    blogPath('en'),
    ...[...zh, ...en].map((post) => `${blogPath(post.lang)}${post.slug}/`),
  ];
  const urls = paths.map((path) => `<url><loc>${new URL(path, site).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};